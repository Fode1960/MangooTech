const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Démarrage de la plateforme MangooTech avec Mini-Boutique...');

// Fonction pour démarrer le serveur principal
function startMainServer() {
  console.log('🏢 Démarrage du serveur principal...');
  
  const mainProcess = spawn('npm', ['run', 'dev:simple'], {
    stdio: 'inherit',
    shell: true
  });

  mainProcess.on('error', (error) => {
    console.error('❌ Erreur lors du démarrage du serveur principal:', error);
  });

  return mainProcess;
}

// Fonction pour démarrer le Mini-Boutique
function startMiniBoutique() {
  console.log('🛍️ Démarrage de Mini-Boutique...');
  
  const miniBoutiquePath = path.join(__dirname, 'mini-boutique-standalone');
  
  const miniProcess = spawn('npm', ['run', 'dev'], {
    cwd: miniBoutiquePath,
    stdio: 'inherit',
    shell: true
  });

  miniProcess.on('error', (error) => {
    console.error('❌ Erreur lors du démarrage de Mini-Boutique:', error);
  });

  miniProcess.on('close', (code) => {
    console.log(`🛍️ Mini-Boutique s'est arrêté avec le code ${code}`);
    if (code !== 0) {
      console.log('🔄 Redémarrage de Mini-Boutique...');
      setTimeout(() => startMiniBoutique(), 3000);
    }
  });

  return miniProcess;
}

// Démarrage principal
console.log('🚀 Lancement de la plateforme complète...');
console.log('📍 Cela peut prendre 10-15 secondes...');

// Démarrer le serveur principal
const mainProcess = startMainServer();

// Attendre 5 secondes puis démarrer Mini-Boutique
setTimeout(() => {
  startMiniBoutique();
}, 5000);

// Gestion de l'arrêt propre
process.on('SIGINT', () => {
  console.log('\n🛑 Arrêt en cours...');
  mainProcess.kill('SIGTERM');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Arrêt forcé...');
  mainProcess.kill('SIGTERM');
  process.exit(0);
});

console.log('\n🎉 Démarrage en cours...');
console.log('📍 Serveur principal: http://localhost:5173');
console.log('🛍️ Mini-Boutique: http://localhost:3007 (démarrera dans 5 secondes)');
console.log('\n💡 Appuyez sur Ctrl+C pour arrêter tous les services');