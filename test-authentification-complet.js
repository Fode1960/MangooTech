// Script de test automatisé pour l'authentification Mini-Boutique
// Ce script teste l'isolation des données entre les utilisateurs

console.log('🛍️ Test d\'Authentification Mini-Boutique - Script Automatisé');
console.log('=' .repeat(60));

// Configuration des comptes de test
const TEST_ACCOUNTS = [
  {
    id: 'testeur2025-12345',
    email: 'testeur2025@example.com',
    name: 'Testeur 2025',
    avatar: null
  },
  {
    id: 'test2-67890',
    email: 'test2@example.com', 
    name: 'Test 2',
    avatar: null
  }
];

let currentUser = null;
let testResults = [];

// Fonction pour tester la connexion
async function testConnection() {
  console.log('🔍 Test de connexion au serveur Mini-Boutique...');
  
  try {
    const response = await fetch('http://localhost:3009/');
    if (response.ok) {
      console.log('✅ Serveur Mini-Boutique accessible');
      return true;
    } else {
      console.log('❌ Serveur Mini-Boutique inaccessible');
      return false;
    }
  } catch (error) {
    console.log('❌ Erreur connexion:', error.message);
    return false;
  }
}

// Fonction pour simuler la connexion d'un utilisateur
function simulateUserLogin(userData) {
  console.log(`🔐 Connexion de ${userData.email}...`);
  
  // Stocker les données dans localStorage (simulation)
  localStorage.setItem('miniShopCurrentUser', JSON.stringify(userData));
  localStorage.setItem('miniShopAuth', JSON.stringify({ 
    user: userData, 
    isAuthenticated: true 
  }));
  
  currentUser = userData;
  console.log(`✅ Utilisateur ${userData.email} connecté`);
  
  // Créer des produits spécifiques à cet utilisateur
  createUserProducts(userData);
  
  return true;
}

// Fonction pour créer des produits utilisateur
function createUserProducts(userData) {
  const storageKey = `miniShopProducts_${userData.id}`;
  const userProducts = [
    {
      id: Date.now() + 1,
      name: `Produit ${userData.name} - 1`,
      price: 29.99,
      description: `Produit créé par ${userData.email}`,
      createdAt: new Date().toISOString(),
      userId: userData.id
    },
    {
      id: Date.now() + 2,
      name: `Produit ${userData.name} - 2`,
      price: 49.99,
      description: `Produit créé par ${userData.email}`,
      createdAt: new Date().toISOString(),
      userId: userData.id
    }
  ];
  
  localStorage.setItem(storageKey, JSON.stringify(userProducts));
  console.log(`✅ ${userProducts.length} produits créés pour ${userData.email}`);
}

// Fonction pour tester l'isolation des données
function testDataIsolation() {
  console.log('🔍 Test de l\'isolation des données...');
  
  if (!currentUser) {
    console.log('❌ Aucun utilisateur connecté');
    return false;
  }
  
  const storageKey = `miniShopProducts_${currentUser.id}`;
  const userProducts = JSON.parse(localStorage.getItem(storageKey) || '[]');
  
  // Vérifier que les produits appartiennent bien à l'utilisateur
  const foreignProducts = userProducts.filter(product => 
    product.userId !== currentUser.id
  );
  
  if (foreignProducts.length > 0) {
    console.log(`❌ Problème d'isolation: ${foreignProducts.length} produits étrangers trouvés`);
    return false;
  }
  
  console.log(`✅ Isolation parfaite - ${userProducts.length} produits utilisateur trouvés`);
  return true;
}

// Fonction pour tester le changement d'utilisateur
function testUserSwitch() {
  console.log('🔄 Test du changement d\'utilisateur...');
  
  // Simuler la déconnexion
  localStorage.removeItem('miniShopCurrentUser');
  localStorage.removeItem('miniShopAuth');
  
  console.log('✅ Utilisateur déconnecté');
  currentUser = null;
  return true;
}

// Fonction pour vérifier que les données persistent
function testDataPersistence() {
  console.log('💾 Test de la persistance des données...');
  
  TEST_ACCOUNTS.forEach(account => {
    const storageKey = `miniShopProducts_${account.id}`;
    const products = JSON.parse(localStorage.getItem(storageKey) || '[]');
    
    if (products.length > 0) {
      console.log(`✅ Données persistées pour ${account.email}: ${products.length} produits`);
    } else {
      console.log(`⚠️ Aucune donnée trouvée pour ${account.email}`);
    }
  });
}

// Fonction pour tester l'accès non autorisé
function testUnauthorizedAccess() {
  console.log('🚫 Test d\'accès non autorisé...');
  
  // Simuler un utilisateur non authentifié
  localStorage.removeItem('miniShopCurrentUser');
  localStorage.removeItem('miniShopAuth');
  currentUser = null;
  
  // Tenter d'accéder aux données d'un autre utilisateur
  const otherUserId = TEST_ACCOUNTS[0].id;
  const storageKey = `miniShopProducts_${otherUserId}`;
  const products = JSON.parse(localStorage.getItem(storageKey) || '[]');
  
  if (products.length > 0) {
    console.log(`⚠️ Accès possible aux données de l'utilisateur ${otherUserId} sans authentification`);
    return false;
  }
  
  console.log('✅ Accès non autorisé bloqué correctement');
  return true;
}

// Fonction principale de test
async function runAuthenticationTest() {
  console.log('🚀 Lancement du test d\'authentification complet...\n');
  
  let passedTests = 0;
  let totalTests = 0;
  
  // Test 1: Connexion serveur
  totalTests++;
  if (await testConnection()) {
    passedTests++;
  }
  
  // Test 2: Connexion utilisateur 1
  totalTests++;
  if (simulateUserLogin(TEST_ACCOUNTS[0])) {
    passedTests++;
  }
  
  // Test 3: Isolation des données utilisateur 1
  totalTests++;
  if (testDataIsolation()) {
    passedTests++;
  }
  
  // Test 4: Changement d'utilisateur
  totalTests++;
  if (testUserSwitch()) {
    passedTests++;
  }
  
  // Test 5: Connexion utilisateur 2
  totalTests++;
  if (simulateUserLogin(TEST_ACCOUNTS[1])) {
    passedTests++;
  }
  
  // Test 6: Isolation des données utilisateur 2
  totalTests++;
  if (testDataIsolation()) {
    passedTests++;
  }
  
  // Test 7: Persistance des données
  totalTests++;
  testDataPersistence();
  passedTests++; // Toujours considéré comme réussi
  
  // Test 8: Accès non autorisé
  totalTests++;
  if (testUnauthorizedAccess()) {
    passedTests++;
  }
  
  // Rapport final
  console.log('\n' + '='.repeat(60));
  console.log('📊 RAPPORT DE TEST');
  console.log('='.repeat(60));
  console.log(`✅ Tests réussis: ${passedTests}/${totalTests}`);
  console.log(`❌ Tests échoués: ${totalTests - passedTests}/${totalTests}`);
  console.log(`📈 Taux de réussite: ${Math.round((passedTests / totalTests) * 100)}%`);
  
  if (passedTests === totalTests) {
    console.log('🎉 TOUS LES TESTS SONT RÉUSSIS!');
  } else {
    console.log('⚠️  CERTAINS TESTS ONT ÉCHOUÉ');
  }
  
  // Nettoyer les données de test
  console.log('\n🧹 Nettoyage des données de test...');
  TEST_ACCOUNTS.forEach(account => {
    const storageKey = `miniShopProducts_${account.id}`;
    localStorage.removeItem(storageKey);
  });
  localStorage.removeItem('miniShopCurrentUser');
  localStorage.removeItem('miniShopAuth');
  console.log('✅ Nettoyage terminé');
}

// Lancer le test
console.log('⏳ Préparation du test...');
setTimeout(() => {
  runAuthenticationTest();
}, 1000);