import { spawn } from 'child_process';
import net from 'net';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Système de démarrage automatique de Mini-Boutique
 * Ce script démarre automatiquement le serveur Mini-Boutique quand la plateforme principale est lancée
 */

class MiniBoutiqueAutoStarter {
  constructor() {
    this.process = null;
    this.isStarting = false;
    this.retryCount = 0;
    this.maxRetries = 3;
    this.miniBoutiquePath = path.join(__dirname, 'mini-boutique-standalone');
  }

  /**
   * Vérifie si un port est déjà utilisé
   */
  async checkPort(port) {
    return new Promise((resolve) => {
      const server = net.createServer();
      
      server.once('error', (err) => {
        server.close();
        resolve(err.code === 'EADDRINUSE');
      });
      
      server.once('listening', () => {
        server.close();
        resolve(false);
      });
      
      server.listen(port);
    });
  }

  /**
   * Attend qu'un serveur soit prêt
   */
  async waitForServer(port, timeout = 30000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      try {
        const response = await fetch(`http://localhost:${port}/`);
        if (response.ok) {
          console.log(`✅ Serveur sur le port ${port} est prêt`);
          return true;
        }
      } catch (error) {
        // Le serveur n'est pas encore prêt
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log(`⏰ Timeout: Serveur sur le port ${port} non prêt après ${timeout}ms`);
    return false;
  }

  /**
   * Démarre le serveur Mini-Boutique
   */
  async startMiniBoutique() {
    if (this.isStarting || this.process) {
      console.log('🛍️ Mini-Boutique est déjà en cours de démarrage ou en fonctionnement');
      return true;
    }

    try {
      this.isStarting = true;
      console.log('🚀 Démarrage automatique de Mini-Boutique...');

      // Vérifier si Mini-Boutique est déjà en cours d'exécution
      const port3007InUse = await this.checkPort(3007);
      const port3009InUse = await this.checkPort(3009);

      if (port3007InUse || port3009InUse) {
        console.log('✅ Mini-Boutique est déjà en cours d\'exécution');
        this.isStarting = false;
        return true;
      }

      // Déterminer le package manager
      let packageManager = 'npm';
      
      try {
        if (fs.existsSync(path.join(this.miniBoutiquePath, 'pnpm-lock.yaml'))) {
          packageManager = 'pnpm';
        } else if (fs.existsSync(path.join(this.miniBoutiquePath, 'yarn.lock'))) {
          packageManager = 'yarn';
        }
      } catch (error) {
        console.log('⚠️ Impossible de détecter le package manager, utilisation de npm par défaut');
      }

      console.log(`📦 Utilisation de ${packageManager} pour démarrer Mini-Boutique`);

      // Définir la commande de démarrage
      const command = packageManager === 'npm' ? 'npm' : packageManager;
      const args = packageManager === 'npm' ? ['run', 'dev'] : ['dev'];

      // Démarre le serveur Mini-Boutique
      this.process = spawn(command, args, {
        cwd: this.miniBoutiquePath,
        stdio: 'pipe',
        shell: true
      });

      // Gestion des logs
      this.process.stdout.on('data', (data) => {
        const output = data.toString();
        console.log(`🛍️ Mini-Boutique: ${output.trim()}`);
        
        // Détecter quand le serveur est prêt
        if (output.includes('Local:') || output.includes('ready') || output.includes('3007')) {
          console.log('🎉 Mini-Boutique est prêt !');
          this.isStarting = false;
          this.retryCount = 0;
        }
      });

      this.process.stderr.on('data', (data) => {
        console.error(`❌ Mini-Boutique Error: ${data.toString().trim()}`);
      });

      this.process.on('error', (error) => {
        console.error('❌ Erreur lors du démarrage de Mini-Boutique:', error.message);
        this.isStarting = false;
        this.process = null;
        
        // Réessayer en cas d'échec
        if (this.retryCount < this.maxRetries) {
          this.retryCount++;
          console.log(`🔄 Tentative de redémarrage ${this.retryCount}/${this.maxRetries}...`);
          setTimeout(() => this.startMiniBoutique(), 5000);
        }
      });

      this.process.on('exit', (code, signal) => {
        console.log(`🛑 Mini-Boutique s'est arrêté (code: ${code}, signal: ${signal})`);
        this.process = null;
        this.isStarting = false;
        
        // Redémarrage automatique si ce n'est pas une fermeture normale
        if (code !== 0 && this.retryCount < this.maxRetries) {
          this.retryCount++;
          console.log(`🔄 Redémarrage automatique ${this.retryCount}/${this.maxRetries}...`);
          setTimeout(() => this.startMiniBoutique(), 5000);
        }
      });

      // Attendre que le serveur soit prêt
      const serverReady = await this.waitForServer(3007, 15000);
      
      if (serverReady) {
        console.log('✅ Mini-Boutique démarré avec succès');
        return true;
      } else {
        console.log('⚠️ Mini-Boutique a démarré mais n\'est pas encore complètement prêt');
        return true; // Considérer comme réussi même si le serveur n'est pas complètement prêt
      }

    } catch (error) {
      console.error('❌ Erreur critique lors du démarrage de Mini-Boutique:', error);
      this.isStarting = false;
      this.process = null;
      return false;
    }
  }

  /**
   * Arrête le serveur Mini-Boutique
   */
  async stopMiniBoutique() {
    if (!this.process) {
      console.log('🛍️ Mini-Boutique n\'est pas en cours d\'exécution');
      return true;
    }

    console.log('🛑 Arrêt de Mini-Boutique...');
    
    return new Promise((resolve) => {
      this.process.once('exit', () => {
        console.log('✅ Mini-Boutique arrêté');
        this.process = null;
        resolve(true);
      });

      this.process.kill('SIGTERM');
      
      // Forcer l'arrêt après 5 secondes si nécessaire
      setTimeout(() => {
        if (this.process) {
          console.log('🚨 Force l\'arrêt de Mini-Boutique');
          this.process.kill('SIGKILL');
          this.process = null;
        }
        resolve(true);
      }, 5000);
    });
  }

  /**
   * Vérifie périodiquement l'état du serveur
   */
  startMonitoring() {
    console.log('🔍 Démarrage de la surveillance Mini-Boutique...');
    
    const checkInterval = setInterval(async () => {
      if (!this.process && !this.isStarting) {
        console.log('🛍️ Mini-Boutique semble être arrêté, tentative de redémarrage...');
        await this.startMiniBoutique();
      }
    }, 30000); // Vérifier toutes les 30 secondes

    // Nettoyer l'intervalle à la fermeture
    process.on('SIGINT', () => {
      clearInterval(checkInterval);
      this.stopMiniBoutique().then(() => process.exit(0));
    });

    process.on('SIGTERM', () => {
      clearInterval(checkInterval);
      this.stopMiniBoutique().then(() => process.exit(0));
    });
  }
}

export default MiniBoutiqueAutoStarter;