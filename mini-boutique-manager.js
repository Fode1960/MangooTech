const { spawn } = require('child_process');
const path = require('path');

class MiniBoutiqueManager {
  constructor() {
    this.process = null;
    this.isStarting = false;
  }

  async start() {
    if (this.process || this.isStarting) {
      console.log('🛍️ Mini-Boutique est déjà en cours de démarrage ou en fonctionnement');
      return;
    }

    this.isStarting = true;

    try {
      console.log('🛍️ Démarrage automatique de Mini-Boutique...');
      
      const miniBoutiquePath = path.join(__dirname, 'mini-boutique-standalone');
      
      // Démarrer le serveur
      this.process = spawn('npm', ['run', 'dev'], {
        cwd: miniBoutiquePath,
        stdio: 'pipe',
        shell: true
      });

      this.process.stdout.on('data', (data) => {
        const output = data.toString();
        console.log('🛍️ Mini-Boutique:', output.trim());
        
        // Détecter quand le serveur est prêt
        if (output.includes('Local:') || output.includes('3007') || output.includes('3009')) {
          console.log('✅ Mini-Boutique démarré avec succès !');
          this.isStarting = false;
        }
      });

      this.process.stderr.on('data', (data) => {
        console.error('🛍️ Mini-Boutique Erreur:', data.toString().trim());
      });

      this.process.on('close', (code) => {
        console.log(`🛍️ Mini-Boutique processus terminé avec le code ${code}`);
        this.process = null;
        this.isStarting = false;
        
        // Redémarrer automatiquement si ce n'est pas une fermeture intentionnelle
        if (code !== 0) {
          console.log('🔄 Redémarrage automatique de Mini-Boutique...');
          setTimeout(() => this.start(), 3000);
        }
      });

      this.process.on('error', (error) => {
        console.error('🛍️ Mini-Boutique Erreur de démarrage:', error);
        this.process = null;
        this.isStarting = false;
        
        console.log('🔄 Nouvelle tentative de démarrage...');
        setTimeout(() => this.start(), 3000);
      });

    } catch (error) {
      console.error('🛍️ Erreur lors du démarrage de Mini-Boutique:', error);
      this.isStarting = false;
      
      console.log('🔄 Nouvelle tentative de démarrage...');
      setTimeout(() => this.start(), 3000);
    }
  }

  stop() {
    if (this.process) {
      console.log('🛑 Arrêt de Mini-Boutique...');
      this.process.kill('SIGTERM');
      this.process = null;
    }
  }

  isRunning() {
    return !!this.process;
  }
}

// Créer une instance globale
const miniBoutiqueManager = new MiniBoutiqueManager();

// Démarrer automatiquement si ce script est exécuté directement
if (require.main === module) {
  console.log('🚀 Démarrage du gestionnaire Mini-Boutique...');
  miniBoutiqueManager.start();
}

module.exports = miniBoutiqueManager;