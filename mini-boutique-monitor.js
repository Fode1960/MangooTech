const { spawn } = require('child_process');
const net = require('net');
const path = require('path');

/**
 * Surveillance continue de Mini-Boutique
 * Ce script surveille Mini-Boutique et le redémarre automatiquement en cas de problème
 */

class MiniBoutiqueMonitor {
  constructor() {
    this.isMonitoring = false;
    this.checkInterval = 30000; // Vérifier toutes les 30 secondes
    this.restartDelay = 5000; // Attendre 5 secondes avant de redémarrer
    this.maxRetries = 5;
    this.retryCount = 0;
    this.miniBoutiquePath = path.join(__dirname, 'mini-boutique-standalone');
    this.process = null;
  }

  /**
   * Vérifie si un port est accessible
   */
  async checkPort(port) {
    return new Promise((resolve) => {
      const socket = new net.Socket();
      
      socket.setTimeout(3000);
      
      socket.on('connect', () => {
        socket.destroy();
        resolve(true);
      });
      
      socket.on('error', () => {
        resolve(false);
      });
      
      socket.on('timeout', () => {
        socket.destroy();
        resolve(false);
      });
      
      socket.connect(port, 'localhost');
    });
  }

  /**
   * Vérifie l'état de Mini-Boutique
   */
  async checkHealth() {
    console.log('🔍 Vérification de l\'état de Mini-Boutique...');
    
    // Vérifier les deux ports possibles
    const port3007Ok = await this.checkPort(3007);
    const port3009Ok = await this.checkPort(3009);
    
    return port3007Ok || port3009Ok;
  }

  /**
   * Démarre Mini-Boutique
   */
  async startMiniBoutique() {
    if (this.process) {
      console.log('🛍️ Mini-Boutique est déjà en cours de démarrage');
      return;
    }

    try {
      console.log('🚀 Démarrage de Mini-Boutique...');

      // Déterminer le package manager
      const fs = require('fs');
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

      const command = packageManager === 'npm' ? 'npm' : packageManager;
      const args = packageManager === 'npm' ? ['run', 'dev'] : ['dev'];

      this.process = spawn(command, args, {
        cwd: this.miniBoutiquePath,
        stdio: 'pipe',
        shell: true
      });

      this.process.stdout.on('data', (data) => {
        const output = data.toString();
        console.log(`🛍️ Mini-Boutique: ${output.trim()}`);
      });

      this.process.stderr.on('data', (data) => {
        console.error(`❌ Mini-Boutique Error: ${data.toString().trim()}`);
      });

      this.process.on('exit', (code, signal) => {
        console.log(`🛑 Mini-Boutique s'est arrêté (code: ${code}, signal: ${signal})`);
        this.process = null;
        
        // Si ce n'est pas un arrêt normal, essayer de redémarrer
        if (code !== 0 && this.retryCount < this.maxRetries) {
          this.retryCount++;
          console.log(`🔄 Tentative de redémarrage ${this.retryCount}/${this.maxRetries}...`);
          setTimeout(() => this.startMiniBoutique(), this.restartDelay);
        }
      });

    } catch (error) {
      console.error('❌ Erreur lors du démarrage de Mini-Boutique:', error);
      this.process = null;
    }
  }

  /**
   * Arrête Mini-Boutique
   */
  async stopMiniBoutique() {
    if (!this.process) {
      return;
    }

    console.log('🛑 Arrêt de Mini-Boutique...');
    
    return new Promise((resolve) => {
      this.process.once('exit', () => {
        console.log('✅ Mini-Boutique arrêté');
        this.process = null;
        resolve();
      });

      this.process.kill('SIGTERM');
      
      // Forcer l'arrêt après 5 secondes si nécessaire
      setTimeout(() => {
        if (this.process) {
          console.log('🚨 Force l\'arrêt de Mini-Boutique');
          this.process.kill('SIGKILL');
          this.process = null;
        }
        resolve();
      }, 5000);
    });
  }

  /**
   * Boucle de surveillance
   */
  async monitor() {
    if (!this.isMonitoring) {
      return;
    }

    try {
      const isHealthy = await this.checkHealth();
      
      if (!isHealthy) {
        console.log('⚠️ Mini-Boutique ne répond pas, tentative de redémarrage...');
        this.retryCount = 0;
        await this.startMiniBoutique();
      } else {
        console.log('✅ Mini-Boutique fonctionne correctement');
        this.retryCount = 0; // Réinitialiser le compteur si tout va bien
      }

    } catch (error) {
      console.error('❌ Erreur lors de la surveillance:', error);
    }

    // Planifier la prochaine vérification
    if (this.isMonitoring) {
      setTimeout(() => this.monitor(), this.checkInterval);
    }
  }

  /**
   * Démarre la surveillance
   */
  start() {
    if (this.isMonitoring) {
      console.log('🔍 La surveillance est déjà en cours');
      return;
    }

    console.log('🔍 Démarrage de la surveillance Mini-Boutique...');
    console.log(`📊 Vérification toutes les ${this.checkInterval / 1000} secondes`);
    console.log(`🔄 Redémarrage automatique après ${this.restartDelay / 1000} secondes`);
    
    this.isMonitoring = true;
    
    // Démarrer la première vérification
    this.monitor();

    // Configuration de l'arrêt gracieux
    const shutdown = async (signal) => {
      console.log(`\n🛑 Signal ${signal} reçu, arrêt de la surveillance...`);
      this.isMonitoring = false;
      await this.stopMiniBoutique();
      process.exit(0);
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  }

  /**
   * Arrête la surveillance
   */
  stop() {
    console.log('🛑 Arrêt de la surveillance...');
    this.isMonitoring = false;
  }
}

// Démarrage si ce script est exécuté directement
if (require.main === module) {
  const monitor = new MiniBoutiqueMonitor();
  
  console.log('🌟 Démarrage du système de surveillance Mini-Boutique');
  console.log('='.repeat(50));
  
  monitor.start();
  
  console.log('✅ Surveillance activée - Mini-Boutique sera redémarré automatiquement en cas de problème');
  console.log('📝 Appuyez sur Ctrl+C pour arrêter la surveillance');
}

module.exports = MiniBoutiqueMonitor;