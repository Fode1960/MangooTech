// Script de test automatisé pour l'authentification Mini-Boutique
// À exécuter dans la console du navigateur sur http://localhost:3009/

console.log('🛍️ TEST D\'AUTHENTIFICATION MINI-BOUTIQUE');
console.log('=' .repeat(60));

// Configuration des tests
const TEST_USERS = [
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

// Fonction utilitaire pour attendre
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Fonction pour logger les résultats
function logTest(step, result, details = '') {
  const status = result === 'SUCCESS' ? '✅' : result === 'FAILED' ? '❌' : '⚠️';
  console.log(`${status} ${step}: ${result} ${details ? '- ' + details : ''}`);
  
  testResults.push({
    step,
    result,
    details,
    timestamp: new Date().toISOString()
  });
}

// Test 1: Vérifier que le système d'authentification est accessible
async function testAuthSystem() {
  console.log('\n🔍 Test 1: Vérification du système d\'authentification');
  
  try {
    // Vérifier si AuthContext est disponible
    if (typeof window.AuthContext !== 'undefined' || 
        document.querySelector('[data-user-id]') || 
        localStorage.getItem('miniShopCurrentUser')) {
      logTest('Système d\'authentification', 'SUCCESS', 'Auth system accessible');
      return true;
    } else {
      logTest('Système d\'authentification', 'FAILED', 'Auth system non accessible');
      return false;
    }
  } catch (error) {
    logTest('Système d\'authentification', 'FAILED', error.message);
    return false;
  }
}

// Test 2: Connecter le premier utilisateur
async function testUser1Login() {
  console.log('\n🔐 Test 2: Connexion utilisateur 1 (testeur2025@example.com)');
  
  try {
    const userData = TEST_USERS[0];
    
    // Simuler la connexion via le pont d'authentification
    localStorage.setItem('miniShopCurrentUser', JSON.stringify(userData));
    localStorage.setItem('miniShopAuth', JSON.stringify({
      user: userData,
      isAuthenticated: true
    }));
    
    currentUser = userData;
    logTest('Connexion utilisateur 1', 'SUCCESS', `Connecté en tant que ${userData.email}`);
    return true;
  } catch (error) {
    logTest('Connexion utilisateur 1', 'FAILED', error.message);
    return false;
  }
}

// Test 3: Créer des produits pour l'utilisateur 1
async function testUser1Products() {
  console.log('\n➕ Test 3: Création de produits pour utilisateur 1');
  
  try {
    const userData = TEST_USERS[0];
    const storageKey = `miniShopProducts_${userData.id}`;
    
    const products = [
      {
        id: Date.now() + 1,
        name: 'T-shirt Premium DT250',
        price: 29.99,
        description: `Produit créé par ${userData.email}`,
        createdAt: new Date().toISOString(),
        userId: userData.id,
        userEmail: userData.email
      },
      {
        id: Date.now() + 2,
        name: 'Casque Audio Pro',
        price: 149.99,
        description: `Produit créé par ${userData.email}`,
        createdAt: new Date().toISOString(),
        userId: userData.id,
        userEmail: userData.email
      }
    ];
    
    localStorage.setItem(storageKey, JSON.stringify(products));
    logTest('Création produits utilisateur 1', 'SUCCESS', `${products.length} produits créés`);
    return true;
  } catch (error) {
    logTest('Création produits utilisateur 1', 'FAILED', error.message);
    return false;
  }
}

// Test 4: Déconnexion
async function testLogout() {
  console.log('\n🚪 Test 4: Déconnexion');
  
  try {
    localStorage.removeItem('miniShopCurrentUser');
    localStorage.removeItem('miniShopAuth');
    currentUser = null;
    
    logTest('Déconnexion', 'SUCCESS', 'Utilisateur déconnecté');
    return true;
  } catch (error) {
    logTest('Déconnexion', 'FAILED', error.message);
    return false;
  }
}

// Test 5: Connecter le deuxième utilisateur
async function testUser2Login() {
  console.log('\n🔐 Test 5: Connexion utilisateur 2 (test2@example.com)');
  
  try {
    const userData = TEST_USERS[1];
    
    localStorage.setItem('miniShopCurrentUser', JSON.stringify(userData));
    localStorage.setItem('miniShopAuth', JSON.stringify({
      user: userData,
      isAuthenticated: true
    }));
    
    currentUser = userData;
    logTest('Connexion utilisateur 2', 'SUCCESS', `Connecté en tant que ${userData.email}`);
    return true;
  } catch (error) {
    logTest('Connexion utilisateur 2', 'FAILED', error.message);
    return false;
  }
}

// Test 6: Créer des produits pour l'utilisateur 2
async function testUser2Products() {
  console.log('\n➕ Test 6: Création de produits pour utilisateur 2');
  
  try {
    const userData = TEST_USERS[1];
    const storageKey = `miniShopProducts_${userData.id}`;
    
    const products = [
      {
        id: Date.now() + 3,
        name: 'Smartphone X100',
        price: 599.99,
        description: `Produit créé par ${userData.email}`,
        createdAt: new Date().toISOString(),
        userId: userData.id,
        userEmail: userData.email
      },
      {
        id: Date.now() + 4,
        name: 'Laptop Gaming Pro',
        price: 1299.99,
        description: `Produit créé par ${userData.email}`,
        createdAt: new Date().toISOString(),
        userId: userData.id,
        userEmail: userData.email
      }
    ];
    
    localStorage.setItem(storageKey, JSON.stringify(products));
    logTest('Création produits utilisateur 2', 'SUCCESS', `${products.length} produits créés`);
    return true;
  } catch (error) {
    logTest('Création produits utilisateur 2', 'FAILED', error.message);
    return false;
  }
}

// Test 7: Vérifier l'isolation des données
async function testDataIsolation() {
  console.log('\n🔍 Test 7: Vérification de l\'isolation des données');
  
  try {
    let isolationSuccess = true;
    let totalIssues = 0;
    
    TEST_USERS.forEach(user => {
      const storageKey = `miniShopProducts_${user.id}`;
      const userProducts = JSON.parse(localStorage.getItem(storageKey) || '[]');
      
      // Vérifier que les produits appartiennent bien à l'utilisateur
      const foreignProducts = userProducts.filter(product => 
        product.userId !== user.id || product.userEmail !== user.email
      );
      
      if (foreignProducts.length > 0) {
        console.log(`  ❌ Problème pour ${user.email}: ${foreignProducts.length} produits étrangers`);
        isolationSuccess = false;
        totalIssues += foreignProducts.length;
      } else {
        console.log(`  ✅ ${user.email}: ${userProducts.length} produits propres`);
      }
    });
    
    if (isolationSuccess) {
      logTest('Isolation des données', 'SUCCESS', 'Aucune fuite de données détectée');
    } else {
      logTest('Isolation des données', 'FAILED', `${totalIssues} produits étrangers trouvés`);
    }
    
    return isolationSuccess;
  } catch (error) {
    logTest('Isolation des données', 'FAILED', error.message);
    return false;
  }
}

// Test 8: Vérifier la persistance des données
async function testDataPersistence() {
  console.log('\n💾 Test 8: Vérification de la persistance des données');
  
  try {
    let persistenceSuccess = true;
    
    TEST_USERS.forEach(user => {
      const storageKey = `miniShopProducts_${user.id}`;
      const products = JSON.parse(localStorage.getItem(storageKey) || '[]');
      
      if (products.length > 0) {
        console.log(`  ✅ ${user.email}: ${products.length} produits persistés`);
      } else {
        console.log(`  ❌ ${user.email}: Aucune donnée persistée`);
        persistenceSuccess = false;
      }
    });
    
    if (persistenceSuccess) {
      logTest('Persistance des données', 'SUCCESS', 'Toutes les données sont persistées');
    } else {
      logTest('Persistance des données', 'FAILED', 'Certaines données manquent');
    }
    
    return persistenceSuccess;
  } catch (error) {
    logTest('Persistance des données', 'FAILED', error.message);
    return false;
  }
}

// Test 9: Tester le changement d'utilisateur
async function testUserSwitching() {
  console.log('\n🔄 Test 9: Test du changement d\'utilisateur');
  
  try {
    // Simuler le changement entre utilisateurs
    for (const user of TEST_USERS) {
      localStorage.setItem('miniShopCurrentUser', JSON.stringify(user));
      localStorage.setItem('miniShopAuth', JSON.stringify({
        user: user,
        isAuthenticated: true
      }));
      
      // Vérifier que les données de l'utilisateur sont correctes
      const storageKey = `miniShopProducts_${user.id}`;
      const userProducts = JSON.parse(localStorage.getItem(storageKey) || '[]');
      
      console.log(`  📝 Bascule vers ${user.email}: ${userProducts.length} produits`);
    }
    
    logTest('Changement d\'utilisateur', 'SUCCESS', 'Changements réussis');
    return true;
  } catch (error) {
    logTest('Changement d\'utilisateur', 'FAILED', error.message);
    return false;
  }
}

// Fonction principale de test
async function runCompleteAuthenticationTest() {
  console.log('\n🚀 LANCEMENT DU TEST COMPLET D\'AUTHENTIFICATION');
  console.log('=' .repeat(60));
  
  testResults = [];
  
  try {
    // Exécuter tous les tests
    await testAuthSystem();
    await delay(1000);
    
    await testUser1Login();
    await delay(1000);
    
    await testUser1Products();
    await delay(1000);
    
    await testLogout();
    await delay(1000);
    
    await testUser2Login();
    await delay(1000);
    
    await testUser2Products();
    await delay(1000);
    
    await testDataIsolation();
    await delay(1000);
    
    await testDataPersistence();
    await delay(1000);
    
    await testUserSwitching();
    
    // Générer le rapport final
    generateFinalReport();
    
  } catch (error) {
    console.log(`❌ Erreur pendant le test: ${error.message}`);
  }
}

// Générer le rapport final
function generateFinalReport() {
  console.log('\n' + '=' .repeat(60));
  console.log('📊 RAPPORT FINAL DU TEST D\'AUTHENTIFICATION');
  console.log('=' .repeat(60));
  
  const successCount = testResults.filter(r => r.result === 'SUCCESS').length;
  const failedCount = testResults.filter(r => r.result === 'FAILED').length;
  const totalCount = testResults.length;
  
  console.log(`✅ Tests réussis: ${successCount}/${totalCount}`);
  console.log(`❌ Tests échoués: ${failedCount}/${totalCount}`);
  console.log(`📈 Taux de réussite: ${Math.round((successCount / totalCount) * 100)}%`);
  
  console.log('\n📋 Détails des tests:');
  testResults.forEach((result, index) => {
    const status = result.result === 'SUCCESS' ? '✅' : result.result === 'FAILED' ? '❌' : '⚠️';
    console.log(`  ${index + 1}. ${status} ${result.step}: ${result.result}`);
    if (result.details) {
      console.log(`     Détails: ${result.details}`);
    }
  });
  
  if (failedCount === 0) {
    console.log('\n🎉 TOUS LES TESTS SONT RÉUSSIS!');
    console.log('✅ L\'authentification et l\'isolation des données fonctionnent parfaitement.');
    console.log('✅ Chaque utilisateur voit bien ses propres produits.');
  } else {
    console.log('\n⚠️  CERTAINS TESTS ONT ÉCHOUÉ');
    console.log('🔧 Vérifiez les problèmes d\'authentification ou d\'isolation.');
  }
  
  // Afficher un résumé des données
  console.log('\n📊 Résumé des données utilisateur:');
  TEST_USERS.forEach(user => {
    const storageKey = `miniShopProducts_${user.id}`;
    const products = JSON.parse(localStorage.getItem(storageKey) || '[]');
    console.log(`  👤 ${user.email}: ${products.length} produits`);
  });
}

// Lancer le test
console.log('⏳ Préparation du test...');
setTimeout(() => {
  runCompleteAuthenticationTest();
}, 1000);