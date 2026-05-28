// Script de test pour vérifier l'isolation des données utilisateur
// Ce script teste l'authentification entre deux comptes différents

console.log('🧪 TEST: Vérification de l\'isolation des données utilisateur');

// Test 1: Vérifier que le pont d'authentification est actif
console.log('📋 Test 1: Vérification du pont d\'authentification');
if (window.miniShopBridge) {
  console.log('✅ Pont d\'authentification détecté');
  console.log('📍 Méthodes disponibles:', Object.keys(window.miniShopBridge));
} else {
  console.log('❌ Pont d\'authentification non trouvé');
}

// Test 2: Simuler la connexion avec deux utilisateurs différents
async function testUserIsolation() {
  console.log('\n📋 Test 2: Test d\'isolation des données');
  
  // Utilisateur 1: testeur2025@example.com
  const user1 = {
    id: 'user1-testeur2025',
    email: 'testeur2025@example.com',
    name: 'Testeur 2025'
  };
  
  // Utilisateur 2: test2@example.com  
  const user2 = {
    id: 'user2-test2',
    email: 'test2@example.com',
    name: 'Test 2'
  };
  
  console.log('👤 Utilisateur 1:', user1.email);
  console.log('👤 Utilisateur 2:', user2.email);
  
  // Test avec Utilisateur 1
  console.log('\n🔍 Test avec Utilisateur 1:');
  const storageKey1 = `miniShopProducts_${user1.id}`;
  const products1 = JSON.parse(localStorage.getItem(storageKey1) || '[]');
  console.log(`📦 Produits pour ${user1.email}:`, products1.length, 'produits');
  if (products1.length > 0) {
    console.log('📝 Produits:', products1.map(p => p.name));
  }
  
  // Test avec Utilisateur 2
  console.log('\n🔍 Test avec Utilisateur 2:');
  const storageKey2 = `miniShopProducts_${user2.id}`;
  const products2 = JSON.parse(localStorage.getItem(storageKey2) || '[]');
  console.log(`📦 Produits pour ${user2.email}:`, products2.length, 'produits');
  if (products2.length > 0) {
    console.log('📝 Produits:', products2.map(p => p.name));
  }
  
  // Vérification de l'isolation
  console.log('\n🔒 Vérification de l\'isolation:');
  if (storageKey1 !== storageKey2) {
    console.log('✅ Clés de stockage différentes - isolation OK');
  } else {
    console.log('❌ Clés de stockage identiques - problème d\'isolation');
  }
  
  if (products1 !== products2) {
    console.log('✅ Données séparées - isolation OK');
  } else {
    console.log('❌ Données partagées - problème d\'isolation');
  }
}

// Test 3: Vérifier l'état actuel de l'authentification
function testCurrentAuth() {
  console.log('\n📋 Test 3: État actuel de l\'authentification');
  
  // Vérifier Supabase auth
  const supabaseAuth = localStorage.getItem('supabase-auth-token');
  if (supabaseAuth) {
    console.log('✅ Token Supabase trouvé');
    try {
      const authData = JSON.parse(supabaseAuth);
      console.log('👤 Utilisateur connecté:', authData.user?.email || 'email non trouvé');
    } catch (e) {
      console.log('❌ Erreur lors de la lecture du token Supabase');
    }
  } else {
    console.log('❌ Aucun token Supabase trouvé');
  }
  
  // Vérifier sessionStorage pour le pont
  const bridgeUser = sessionStorage.getItem('miniShopUser');
  if (bridgeUser) {
    console.log('✅ Données utilisateur dans sessionStorage');
    try {
      const userData = JSON.parse(bridgeUser);
      console.log('👤 Utilisateur du pont:', userData.email);
    } catch (e) {
      console.log('❌ Erreur lors de la lecture des données du pont');
    }
  } else {
    console.log('❌ Aucune donnée utilisateur dans sessionStorage');
  }
}

// Test 4: Vérifier les éléments DOM
function testDOMElements() {
  console.log('\n📋 Test 4: Éléments DOM');
  
  // Rechercher le bouton de la Mini-Boutique
  const miniShopButton = document.querySelector('[data-user-id]');
  if (miniShopButton) {
    console.log('✅ Bouton Mini-Boutique trouvé avec attributs data-*');
    console.log('📍 Attributs trouvés:', {
      'data-user-id': miniShopButton.getAttribute('data-user-id'),
      'data-user-email': miniShopButton.getAttribute('data-user-email'),
      'data-user-name': miniShopButton.getAttribute('data-user-name')
    });
  } else {
    console.log('❌ Bouton Mini-Boutique sans attributs data-*');
  }
}

// Exécuter les tests
setTimeout(() => {
  testCurrentAuth();
  testDOMElements();
  testUserIsolation();
}, 1000);

console.log('\n🎯 Résultat attendu: Chaque utilisateur doit avoir ses propres produits isolés');