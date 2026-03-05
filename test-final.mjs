// Test rapide de connexion
console.log('🧪 Test de connexion au serveur MangooTech');
console.log('==============================================');

// Test 1: Vérifier le frontend
console.log('\n📡 Test Frontend : http://localhost:3015/');
fetch('http://localhost:3015/')
  .then(response => {
    if (response.ok) {
      console.log('✅ Frontend accessible !');
      console.log('   Status:', response.status);
    } else {
      console.log('❌ Frontend problème:', response.status);
    }
  })
  .catch(error => {
    console.log('❌ Frontend erreur:', error.message);
  });

// Test 2: Vérifier l'API
console.log('\n📡 Test API : http://localhost:3009/api/health');
fetch('http://localhost:3009/api/health')
  .then(response => response.json())
  .then(data => {
    console.log('✅ API accessible !');
    console.log('   Réponse:', data.message);
  })
  .catch(error => {
    console.log('❌ API erreur:', error.message);
  });

// Test 3: Vérifier les boutons Admin
console.log('\n📡 Test Boutons Admin : http://localhost:3015/#/admin');
console.log('✅ Les boutons suivants doivent être ACTIFS :');
console.log('   - Créer une boutique');
console.log('   - Voir les paiements');
console.log('   - Gérer les commissions');
console.log('   - Bouton Déconnexion');
console.log('   - Bouton Thème Jour/Nuit');

console.log('\n🎯 Ouvrez votre navigateur sur : http://localhost:3015/');
console.log('   Puis allez dans l\'interface Admin pour tester les boutons !');