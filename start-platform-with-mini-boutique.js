const { spawn } = require('child_process');
const MiniBoutiqueAutoStarter = require('./auto-start-mini-boutique');

/**
 * Script de démarrage principal
 * Démarre automatiquement la plateforme principale et Mini-Boutique
 */

class PlatformStarter {
  constructor() {
    this.mainProcess = null;
    this.miniBoutiqueStarter = new MiniBoutiqueAutoStarter();
    this.isShuttingDown = false;
  }

  /**
   * Démarre la plateforme principale
   */
  async startMainPlatform() {
    console.log('🚀 Démarrage de la plateforme principale MangooTech...');

    return new Promise((resolve, reject) => {
      // Déterminer la commande de démarrage
      const command = 'npm';
      const args = ['run', 'dev:simple'];

      this.mainProcess = spawn(command, args, {
        stdio: 'pipe',
        shell: true
      });

      this.mainProcess.stdout.on('data', (data) => {
        const output = data.toString();
        console.log(`🏢 Main: ${output.trim()}`);
        
        // Détecter quand le serveur principal est prêt
        if (output.includes('Local:') || output.includes('3000') || output.includes('ready')) {
          console.log('✅ Plateforme principale prête');
          resolve(true);
        }
      });

      this.mainProcess.stderr.on('data', (data) => {
        console.error(`❌ Main Error: ${data.toString().trim()}`);
      });

      this.mainProcess.on('error', (error) => {
        console.error('❌ Erreur lors du démarrage de la plateforme principale:', error);
        reject(error);
      });

      this.mainProcess.on('exit', (code, signal) => {
        console.log(`🛑 Plateforme principale arrêtée (code: ${code}, signal: ${signal})`);
        this.mainProcess = null;
        
        if (!this.isShuttingDown && code !== 0) {
          console.log('🔄 Redémarrage automatique de la plateforme principale...');
          setTimeout(() => this.startMainPlatform(), 5000);
        }
      });
    });
  }

  /**
   * Démarre tous les services
   */
  async startAll() {
    try {
      console.log('🌟 Démarrage complet de la plateforme MangooTech');
      console.log('='.repeat(50));

      // Étape 1: Démarrer la plateforme principale
      await this.startMainPlatform();
      
      // Attendre un peu pour que le serveur principal soit complètement prêt
      console.log('⏳ Attente de la stabilisation du serveur principal...');
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Étape 2: Démarrer Mini-Boutique automatiquement
      console.log('🛍️ Démarrage automatique de Mini-Boutique...');
      const miniBoutiqueStarted = await this.miniBoutiqueStarter.startMiniBoutique();

      if (miniBoutiqueStarted) {
        console.log('✅ Mini-Boutique démarré avec succès');
        this.miniBoutiqueStarter.startMonitoring();
      } else {
        console.log('⚠️ Mini-Boutique n\'a pas pu démarrer, mais la plateforme principale fonctionne');
      }

      console.log('='.repeat(50));
      console.log('🎉 Plateforme complètement démarrée !');
      console.log('📍 Plateforme principale: http://localhost:3000');
      console.log('🛍️ Mini-Boutique: http://localhost:3007');
      console.log('='.repeat(50));

      // Gestion de l'arrêt gracieux
      this.setupGracefulShutdown();

    } catch (error) {
      console.error('❌ Erreur lors du démarrage:', error);
      process.exit(1);
    }
  }

  /**
   * Configuration de l'arrêt gracieux
   */
  setupGracefulShutdown() {
    const shutdown = async (signal) => {
      console.log(`\n🛑 Signal ${signal} reçu, arrêt gracieux...`);
      this.isShuttingDown = true;

      try {
        // Arrêter Mini-Boutique
        await this.miniBoutiqueStarter.stopMiniBoutique();
        
        // Arrêter la plateforme principale
        if (this.mainProcess) {
          console.log('🛑 Arrêt de la plateforme principale...');
          this.mainProcess.kill('SIGTERM');
          
          // Attendre l'arrêt ou forcer après 5 secondes
          await new Promise(resolve => {
            const timeout = setTimeout(() => {
              if (this.mainProcess) {
                this.mainProcess.kill('SIGKILL');
              }
              resolve();
            }, 5000);

            this.mainProcess.once('exit', () => {
              clearTimeout(timeout);
              resolve();
            });
          });
        }

        console.log('✅ Arrêt complet effectué');
        process.exit(0);

      } catch (error) {
        console.error('❌ Erreur lors de l\'arrêt:', error);
        process.exit(1);
      }
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    
    // Gérer les erreurs non capturées
    process.on('uncaughtException', (error) => {
      console.error('❌ Exception non capturée:', error);
      shutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Rejet non géré:', reason);
      shutdown('unhandledRejection');
    });
  }
}

// Démarrage de la plateforme
const starter = new PlatformStarter();

// Gestion des erreurs globales
process.on('uncaughtException', (error) => {
  console.error('❌ Exception non capturée:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Rejet non géré:', reason);
  process.exit(1);
});

// Lancer la plateforme
console.log('🌟 Lancement de la plateforme MangooTech avec Mini-Boutique automatique');
starter.startAll().catch((error) => {
  console.error('❌ Échec du démarrage:', error);
  process.exit(1);
});