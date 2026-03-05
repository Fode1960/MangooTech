#!/usr/bin/env node

/**
 * Système de Backup et Rollback Automatique pour Version Lock
 * Crée des sauvegardes automatiques et permet le rollback rapide
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

class VersionLockBackup {
  constructor() {
    this.backupDir = path.join(process.cwd(), '.version-backups');
    this.maxBackups = 10;
    this.autoBackupInterval = 24 * 60 * 60 * 1000; // 24 heures
  }

  /**
   * Initialise le système de backup
   */
  async initialize() {
    try {
      await fs.mkdir(this.backupDir, { recursive: true });
      console.log('✅ Système de backup initialisé');
      
      // Démarrer la sauvegarde automatique
      this.startAutoBackup();
      
      return true;
    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation:', error);
      return false;
    }
  }

  /**
   * Crée une sauvegarde complète du système
   */
  async createBackup(description = 'Manual backup') {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupName = `backup-${timestamp}`;
      const backupPath = path.join(this.backupDir, backupName);

      console.log(`🔄 Création de la sauvegarde: ${backupName}`);

      // Créer le dossier de backup
      await fs.mkdir(backupPath, { recursive: true });

      // Sauvegarder les fichiers critiques
      const filesToBackup = [
        'package.json',
        'package-lock.json',
        'version-lock.json',
        'src/lib/featureFlags.js',
        'src/lib/versionMonitor.js',
        '.env.production',
        'vite.config.js'
      ];

      const backupManifest = {
        timestamp: new Date().toISOString(),
        description,
        files: [],
        gitCommit: this.getCurrentGitCommit(),
        nodeVersion: process.version,
        npmVersion: this.getNpmVersion()
      };

      // Copier les fichiers
      for (const file of filesToBackup) {
        try {
          const sourcePath = path.join(process.cwd(), file);
          const destPath = path.join(backupPath, file);
          
          await fs.mkdir(path.dirname(destPath), { recursive: true });
          await fs.copyFile(sourcePath, destPath);
          
          backupManifest.files.push(file);
          console.log(`  ✅ ${file}`);
        } catch (error) {
          console.warn(`  ⚠️  Impossible de sauvegarder ${file}: ${error.message}`);
        }
      }

      // Sauvegarder la configuration de la base de données
      await this.backupDatabaseConfig(backupPath);

      // Créer le manifest de backup
      await fs.writeFile(
        path.join(backupPath, 'backup-manifest.json'),
        JSON.stringify(backupManifest, null, 2)
      );

      // Créer un lien symbolique vers le dernier backup
      await this.updateLatestBackup(backupName);

      // Nettoyer les anciens backups
      await this.cleanupOldBackups();

      console.log(`✅ Sauvegarde créée avec succès: ${backupName}`);
      return backupName;

    } catch (error) {
      console.error('❌ Erreur lors de la création de la sauvegarde:', error);
      throw error;
    }
  }

  /**
   * Effectue un rollback vers une version précédente
   */
  async rollback(backupName = null, options = {}) {
    try {
      const targetBackup = backupName || await this.getLatestBackup();
      
      if (!targetBackup) {
        throw new Error('Aucune sauvegarde disponible pour le rollback');
      }

      const backupPath = path.join(this.backupDir, targetBackup);
      const manifestPath = path.join(backupPath, 'backup-manifest.json');

      console.log(`🔄 Rollback vers: ${targetBackup}`);

      // Charger le manifest
      const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));

      // Créer une sauvegarde de l'état actuel avant rollback
      if (!options.skipPreRollbackBackup) {
        await this.createBackup(`Pre-rollback backup before ${targetBackup}`);
      }

      // Restaurer les fichiers
      for (const file of manifest.files) {
        try {
          const sourcePath = path.join(backupPath, file);
          const destPath = path.join(process.cwd(), file);
          
          await fs.mkdir(path.dirname(destPath), { recursive: true });
          await fs.copyFile(sourcePath, destPath);
          
          console.log(`  ✅ ${file} restauré`);
        } catch (error) {
          console.warn(`  ⚠️  Impossible de restaurer ${file}: ${error.message}`);
        }
      }

      // Restaurer la configuration de la base de données
      await this.restoreDatabaseConfig(backupPath);

      // Vérifier la cohérence après rollback
      await this.verifyRollback(manifest);

      console.log(`✅ Rollback effectué avec succès vers: ${targetBackup}`);
      return targetBackup;

    } catch (error) {
      console.error('❌ Erreur lors du rollback:', error);
      throw error;
    }
  }

  /**
   * Liste toutes les sauvegardes disponibles
   */
  async listBackups() {
    try {
      const entries = await fs.readdir(this.backupDir);
      const backups = [];

      for (const entry of entries) {
        if (entry.startsWith('backup-')) {
          const manifestPath = path.join(this.backupDir, entry, 'backup-manifest.json');
          try {
            const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
            backups.push({
              name: entry,
              timestamp: manifest.timestamp,
              description: manifest.description,
              gitCommit: manifest.gitCommit,
              nodeVersion: manifest.nodeVersion
            });
          } catch (error) {
            console.warn(`Impossible de lire le manifest de ${entry}`);
          }
        }
      }

      return backups.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } catch (error) {
      console.error('Erreur lors de la liste des backups:', error);
      return [];
    }
  }

  /**
   * Vérifie la cohérence après rollback
   */
  async verifyRollback(manifest) {
    console.log('🔍 Vérification de la cohérence après rollback...');

    // Vérifier que les fichiers importants existent
    const criticalFiles = ['package.json', 'version-lock.json'];
    for (const file of criticalFiles) {
      try {
        await fs.access(path.join(process.cwd(), file));
        console.log(`  ✅ ${file} présent`);
      } catch (error) {
        console.warn(`  ⚠️  ${file} manquant`);
      }
    }

    // Vérifier que la version Node.js est compatible
    if (manifest.nodeVersion !== process.version) {
      console.warn(`  ⚠️  Changement de version Node.js détecté: ${manifest.nodeVersion} -> ${process.version}`);
    }

    console.log('✅ Vérification terminée');
  }

  /**
   * Sauvegarde la configuration de la base de données
   */
  async backupDatabaseConfig(backupPath) {
    try {
      // Sauvegarder les scripts SQL importants
      const sqlFiles = [
        'fix-rls-sql-manual.sql',
        'check-user-pack-status.js',
        'debug-pack-data.js'
      ];

      for (const file of sqlFiles) {
        try {
          const sourcePath = path.join(process.cwd(), file);
          const destPath = path.join(backupPath, 'database', file);
          
          await fs.mkdir(path.dirname(destPath), { recursive: true });
          await fs.copyFile(sourcePath, destPath);
        } catch (error) {
          // Ignorer les erreurs pour les fichiers optionnels
        }
      }
    } catch (error) {
      console.warn('Erreur lors de la sauvegarde de la configuration DB:', error);
    }
  }

  /**
   * Restaure la configuration de la base de données
   */
  async restoreDatabaseConfig(backupPath) {
    try {
      const dbBackupPath = path.join(backupPath, 'database');
      
      try {
        await fs.access(dbBackupPath);
        
        const entries = await fs.readdir(dbBackupPath);
        for (const entry of entries) {
          const sourcePath = path.join(dbBackupPath, entry);
          const destPath = path.join(process.cwd(), entry);
          
          await fs.copyFile(sourcePath, destPath);
          console.log(`  ✅ Configuration DB ${entry} restaurée`);
        }
      } catch (error) {
        // Aucune configuration DB à restaurer
      }
    } catch (error) {
      console.warn('Erreur lors de la restauration de la configuration DB:', error);
    }
  }

  /**
   * Démarre la sauvegarde automatique
   */
  startAutoBackup() {
    setInterval(async () => {
      try {
        await this.createBackup('Automatic daily backup');
      } catch (error) {
        console.error('Erreur lors de la sauvegarde automatique:', error);
      }
    }, this.autoBackupInterval);

    console.log('✅ Sauvegarde automatique démarrée');
  }

  /**
   * Obtient le commit Git actuel
   */
  getCurrentGitCommit() {
    try {
      return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
    } catch (error) {
      return 'unknown';
    }
  }

  /**
   * Obtient la version npm
   */
  getNpmVersion() {
    try {
      return execSync('npm --version', { encoding: 'utf8' }).trim();
    } catch (error) {
      return 'unknown';
    }
  }

  /**
   * Met à jour le lien vers le dernier backup
   */
  async updateLatestBackup(backupName) {
    const latestPath = path.join(this.backupDir, 'latest');
    
    try {
      await fs.unlink(latestPath);
    } catch (error) {
      // Ignorer si le lien n'existe pas
    }

    try {
      await fs.symlink(
        path.join(this.backupDir, backupName),
        latestPath,
        'dir'
      );
    } catch (error) {
      console.warn('Impossible de créer le lien symbolique latest:', error);
    }
  }

  /**
   * Obtient le dernier backup
   */
  async getLatestBackup() {
    try {
      const latestPath = path.join(this.backupDir, 'latest');
      const stats = await fs.lstat(latestPath);
      
      if (stats.isSymbolicLink()) {
        const target = await fs.readlink(latestPath);
        return path.basename(target);
      }
    } catch (error) {
      // Retourner le backup le plus récent
      const backups = await this.listBackups();
      return backups.length > 0 ? backups[0].name : null;
    }
  }

  /**
   * Nettoie les anciens backups
   */
  async cleanupOldBackups() {
    try {
      const backups = await this.listBackups();
      
      if (backups.length > this.maxBackups) {
        const toDelete = backups.slice(this.maxBackups);
        
        for (const backup of toDelete) {
          const backupPath = path.join(this.backupDir, backup.name);
          await fs.rm(backupPath, { recursive: true, force: true });
          console.log(`🗑️  Ancien backup supprimé: ${backup.name}`);
        }
      }
    } catch (error) {
      console.warn('Erreur lors du nettoyage des anciens backups:', error);
    }
  }
}

// Interface CLI
if (require.main === module) {
  const backup = new VersionLockBackup();
  
  const command = process.argv[2];
  const args = process.argv.slice(3);

  (async () => {
    try {
      await backup.initialize();

      switch (command) {
        case 'create':
          const description = args.join(' ') || 'Manual backup';
          await backup.createBackup(description);
          break;

        case 'rollback':
          const backupName = args[0];
          await backup.rollback(backupName);
          break;

        case 'list':
          const backups = await backup.listBackups();
          console.log('\n📋 Backups disponibles:');
          backups.forEach((backup, index) => {
            console.log(`\n${index + 1}. ${backup.name}`);
            console.log(`   Date: ${backup.timestamp}`);
            console.log(`   Description: ${backup.description}`);
            console.log(`   Git Commit: ${backup.gitCommit}`);
          });
          break;

        default:
          console.log(`
Usage: node version-lock-backup.js <command> [args]

Commands:
  create [description]     - Créer une nouvelle sauvegarde
  rollback [backup-name]   - Effectuer un rollback
  list                     - Lister les sauvegardes disponibles
          `);
      }
    } catch (error) {
      console.error('Erreur:', error.message);
      process.exit(1);
    }
  })();
}

module.exports = VersionLockBackup;