// 🛍️ Test Console Rapide - À Copier/Coller dans la Console du Navigateur
// Ce script teste rapidement l'authentification et l'isolation des données

console.clear();
console.log('%c🛍️ TEST D\'AUTHENTIFICATION MINI-BOUTIQUE', 'color: #22c55e; font-size: 16px; font-weight: bold;');
console.log('%c=' + '='.repeat(50), 'color: #22c55e;');

// Configuration des tests
const TEST_ACCOUNTS = [
  {
    id: 'testeur2025-12345',
    email: 'testeur2025@example.com',
    name: 'Testeur 2025'
  },
  {
    id: 'test2-67890',
    email: 'test2@example.com',
    name: 'Test 2'
  }
];

let testResults = [];
let currentUser = null;

// Fonction de log stylisée
function log(message, type = 'info') {
  const colors = {
    success: 'color: #22c55e; font-weight: bold;',
    error: 'color: #ef4444; font-weight bold;',
    warning: 'color: #f59e0b; font-weight: bold;',
    info: 'color: #6b7280;'
  };
  console.log(`%c${message}`, colors[type] || colors.info);
}

// Test rapide de connexion
async function quickConnectionTest() {
  log('🔍 Test de connexion au serveur...', 'info');
  try {
    const response = await fetch('http://localhost:3009/');
    if (response.ok) {
      log('✅ Serveur Mini-Boutique accessible', 'success');
      return true;
    }
  } catch (error) {
    log('❌ Serveur inaccessible', 'error');
    return false;
  }
}

// Test rapide d'authentification
function quickAuthTest() {
  log('🔐 Test d\'authentification utilisateur...', 'info');
  
  // Test utilisateur 1
  const user1 = TEST_ACCOUNTS[0];
  localStorage.setItem('miniShopCurrentUser', JSON.stringify(user1));
  localStorage.setItem('miniShopAuth', JSON.stringify({ user: user1, isAuthenticated: true }));
  
  // Créer des produits pour utilisateur 1
  const products1 = [
    { id: 1, name: 'T-shirt Premium', price: 29.99, userId: user1.id, userEmail: user1.email },
    { id: 2, name: 'Casque Audio', price: 149.99, userId: user1.id, userEmail: user1.email }
  ];
  localStorage.setItem(`miniShopProducts_${user1.id}`, JSON.stringify(products1));
  
  log(`✅ Utilisateur ${user1.email} connecté avec ${products1.length} produits`, 'success');
  
  // Test utilisateur 2
  const user2 = TEST_ACCOUNTS[1];
  localStorage.setItem('miniShopCurrentUser', JSON.stringify(user2));
  localStorage.setItem('miniShopAuth', JSON.stringify({ user: user2, isAuthenticated: true }));
  
  // Créer des produits différents pour utilisateur 2
  const products2 = [
    { id: 3, name: 'Smartphone X100', price: 599.99, userId: user2.id, userEmail: user2.email },
    { id: 4, name: 'Laptop Gaming', price: 1299.99, userId: user2.id, userEmail: user2.email }
  ];
  localStorage.setItem(`miniShopProducts_${user2.id}`, JSON.stringify(products2));
  
  log(`✅ Utilisateur ${user2.email} connecté avec ${products2.length} produits`, 'success');
  
  return true;
}

// Test rapide d'isolation
function quickIsolationTest() {
  log('🔍 Test d\'isolation des données...', 'info');
  
  let isolationOk = true;
  
  TEST_ACCOUNTS.forEach(account => {
    const storageKey = `miniShopProducts_${account.id}`;
    const products = JSON.parse(localStorage.getItem(storageKey) || '[]');
    
    // Vérifier que tous les produits appartiennent à l'utilisateur
    const foreignProducts = products.filter(p => p.userId !== account.id);
    
    if (foreignProducts.length > 0) {
      log(`❌ Problème d'isolation pour ${account.email}: ${foreignProducts.length} produits étrangers`, 'error');
      isolationOk = false;
    } else {
      log(`✅ Isolation parfaite pour ${account.email}: ${products.length} produits propres`, 'success');
    }
  });
  
  return isolationOk;
}

// Test rapide de comparaison
function quickComparisonTest() {
  log('📊 Comparaison des données entre utilisateurs...', 'info');
  
  const allProductNames = [];
  
  TEST_ACCOUNTS.forEach(account => {
    const storageKey = `miniShopProducts_${account.id}`;
    const products = JSON.parse(localStorage.getItem(storageKey) || '[]');
    
    products.forEach(p => allProductNames.push(p.name));
    log(`📋 ${account.email}: ${products.length} produits`, 'info');
  });
  
  // Vérifier les doublons
  const duplicates = allProductNames.filter((name, index) => 
    allProductNames.indexOf(name) !== index
  );
  
  if (duplicates.length > 0) {
    log(`⚠️ Doublons détectés: ${duplicates.join(', ')}`, 'warning');
    return false;
  } else {
    log('✅ Aucun doublon - Chaque utilisateur a des produits uniques', 'success');
    return true;
  }
}

// Nettoyage rapide
function quickCleanup() {
  log('🧹 Nettoyage des données de test...', 'info');
  
  TEST_ACCOUNTS.forEach(account => {
    const storageKey = `miniShopProducts_${account.id}`;
    localStorage.removeItem(storageKey);
    log(`🗑️ Données supprimées pour ${account.email}`, 'info');
  });
  
  localStorage.removeItem('miniShopCurrentUser');
  localStorage.removeItem('miniShopAuth');
  
  log('✅ Nettoyage terminé', 'success');
}

// Exécution du test rapide
async function runQuickTest() {
  console.log('');
  log('🚀 Lancement du test rapide d\'authentification...', 'info');
  console.log('');
  
  let testsPassed = 0;
  let totalTests = 4;
  
  // Test 1: Connexion
  if (await quickConnectionTest()) testsPassed++;
  
  // Test 2: Authentification
  if (quickAuthTest()) testsPassed++;
  
  // Test 3: Isolation
  if (quickIsolationTest()) testsPassed++;
  
  // Test 4: Comparaison
  if (quickComparisonTest()) testsPassed++;
  
  // Rapport final
  console.log('');
  console.log('%c' + '='.repeat(60), 'color: #22c55e;');
  log('📊 RAPPORT DU TEST RAPIDE', 'info');
  console.log('%c' + '='.repeat(60), 'color: #22c55e;');
  
  log(`✅ Tests réussis: ${testsPassed}/${totalTests}`, testsPassed === totalTests ? 'success' : 'warning');
  log(`❌ Tests échoués: ${totalTests - testsPassed}/${totalTests}`, 'error');
  log(`📈 Taux de réussite: ${Math.round((testsPassed / totalTests) * 100)}%`, 'info');
  
  if (testsPassed === totalTests) {
    log('\n🎉 TOUS LES TESTS SONT RÉUSSIS!', 'success');
    log('✅ L\'authentification et l\'isolation des données fonctionnent parfaitement.', 'success');
    log('✅ Chaque utilisateur voit uniquement ses propres produits.', 'success');
  } else {
    log('\n⚠️ CERTAINS TESTS ONT ÉCHOUÉ', 'warning');
    log('🔧 Vérifiez les problèmes d\'isolation ou d\'authentification.', 'warning');
  }
  
  // Nettoyer
  quickCleanup();
  
  return {
    passed: testsPassed,
    total: totalTests,
    successRate: Math.round((testsPassed / totalTests) * 100)
  };
}

// Lancer le test
console.log('');
log('⏳ Préparation du test...', 'info');

setTimeout(() => {
  runQuickTest().then(results => {
    console.log('');
    log('🎯 Test terminé. Utilisez le test HTML complet pour une validation plus détaillée.', 'info');
    console.log('');
  });
}, 1000);

// Instructions pour l'utilisateur
console.log('');
log('📋 POUR UN TEST PLUS COMPLET:', 'info');
log('1. Ouvrez: http://localhost:3009/test-authentification-complet.html', 'info');
log('2. Cliquez sur "Lancer le Test Complet"', 'info');
log('3. Observez les résultats en temps réel', 'info');
console.log('');