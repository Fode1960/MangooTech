const { spawn } = require('child_process');
const net = require('net');

// Fonction pour vérifier si un port est déjà utilisé
function checkPort(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(true); // Port déjà utilisé
      } else {
        resolve(false);
      }
    });
    
    server.once('listening', () => {
      server.close();
      resolve(false); // Port disponible
    });
    
    server.listen(port);
  });
}

// Fonction pour démarrer le Mini-Boutique uniquement si nécessaire
async function startMiniBoutiqueIfNeeded() {
  try {
    // Vérifier si le port 3007 ou 3009 est déjà utilisé
    const port3007InUse = await checkPort(3007);
    const port3009InUse = await checkPort(3009);
    
    if (port3007InUse || port3009InUse) {
      console.log('✅ Mini-Boutique est déjà en cours d\'exécution');
      return;
    }
    
    console.log('🛍️ Mini-Boutique n\'est pas en cours d\'exécution, démarrage automatique...');
    
    // Démarrer le gestionnaire Mini-Boutique
    const miniBoutiqueManager = require('./mini-boutique-manager.js');
    miniBoutiqueManager.start();
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification du Mini-Boutique:', error);
  }
}

// Export pour utilisation dans d'autres scripts
module.exports = { startMiniBoutiqueIfNeeded, checkPort };

// Si exécuté directement
if (require.main === module) {
  startMiniBoutiqueIfNeeded();
}