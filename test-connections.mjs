// Test de connexion aux services (ES Module)
import https from 'https';
import http from 'http';

console.log('🧪 Test de connexion aux services MangooTech');
console.log('==============================================');

// Fonction pour tester une connexion
function testConnection(url, name) {
  return new Promise((resolve) => {
    const client = url.startsWith('https') ? https : http;
    
    const req = client.get(url, (res) => {
      console.log(`✅ ${name}: CONNECTÉ (${res.statusCode})`);
      resolve(true);
    });
    
    req.on('error', (err) => {
      console.log(`❌ ${name}: NON CONNECTÉ - ${err.message}`);
      resolve(false);
    });
    
    req.setTimeout(3000, () => {
      console.log(`⏰ ${name}: TIMEOUT`);
      resolve(false);
    });
  });
}

// Tests des connexions
async function runTests() {
  const tests = [
    ['http://localhost:3015/', 'Interface Principale (3015)'],
    ['http://localhost:3009/api/health', 'API Backend (3009)'],
    ['http://localhost:3005/', 'Interface Principale (3005)'],
    ['http://localhost:3002/', 'Auth Service (3002)'],
    ['http://localhost:3003/', 'Seller Service (3003)'],
    ['http://localhost:3004/', 'Admin Service (3004)']
  ];
  
  console.log('\n📡 Test des connexions...');
  
  for (const [url, name] of tests) {
    await testConnection(url, name);
  }
  
  console.log('\n📊 Résumé des services disponibles :');
  console.log('----------------------------------------');
  console.log('🌐 Accès principal : http://localhost:3015/');
  console.log('🔧 API Backend : http://localhost:3009/api/health');
  console.log('');
  console.log('💡 Pour utiliser le port 3005 :');
  console.log('   1. Arrêter le serveur actuel (Ctrl+C)');
  console.log('   2. Lancer : npm run dev');
  console.log('   3. Accéder : http://localhost:3005/');
}

runTests();