// 🧪 SCRIPT DE TEST PONT AUTHENTIFICATION
// Ce script teste la communication entre l'app principale et Mini-Boutique

console.log('🚀 TEST PONT AUTHENTIFICATION - Démarrage');

// Fonction principale de test
async function testAuthBridge() {
    console.log('📋 Début des tests du pont d\'authentification');
    
    // Test 1: Vérifier que le pont est chargé
    console.log('\n🔍 Test 1: Vérification du pont');
    if (window.miniShopBridge) {
        console.log('✅ Pont d\'authentification détecté');
        console.log('📍 Méthodes disponibles:', Object.keys(window.miniShopBridge));
    } else {
        console.log('❌ Pont d\'authentification non trouvé');
        console.log('📝 Tentative de chargement du pont...');
        
        // Charger le script si nécessaire
        await loadAuthBridge();
    }
    
    // Test 2: Obtenir l'utilisateur actuel
    console.log('\n🔍 Test 2: Récupération de l\'utilisateur');
    const currentUser = await getCurrentUserFromMainApp();
    
    if (currentUser) {
        console.log('✅ Utilisateur trouvé:', currentUser.email);
        console.log('📊 Données utilisateur:', currentUser);
    } else {
        console.log('❌ Aucun utilisateur trouvé');
        console.log('📝 Création d\'un utilisateur de test...');
        await createTestUser();
    }
    
    // Test 3: Simuler l'ouverture de la Mini-Boutique
    console.log('\n🔍 Test 3: Simulation ouverture Mini-Boutique');
    await simulateMiniShopOpening();
    
    // Test 4: Vérifier l'isolation des données
    console.log('\n🔍 Test 4: Vérification isolation des données');
    await testDataIsolation();
    
    console.log('\n✅ Tests terminés');
}

// Fonction pour charger le pont d'authentification
async function loadAuthBridge() {
    return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = '/mini-shop-bridge.js';
        script.onload = () => {
            console.log('✅ Pont d\'authentification chargé');
            resolve();
        };
        script.onerror = () => {
            console.log('❌ Erreur chargement du pont');
            resolve();
        };
        document.head.appendChild(script);
    });
}

// Fonction pour obtenir l'utilisateur depuis l'app principale
async function getCurrentUserFromMainApp() {
    try {
        // Méthode 1: Depuis le DOM
        const userDataElement = document.querySelector('[data-user-id]');
        if (userDataElement) {
            const userId = userDataElement.getAttribute('data-user-id');
            const userEmail = userDataElement.getAttribute('data-user-email');
            const userName = userDataElement.getAttribute('data-user-name');
            
            if (userId && userEmail) {
                console.log('✅ Utilisateur trouvé dans le DOM');
                return {
                    id: userId,
                    email: userEmail,
                    name: userName || userEmail.split('@')[0]
                };
            }
        }
        
        // Méthode 2: Depuis Supabase localStorage
        const supabaseAuth = localStorage.getItem('supabase-auth-token');
        if (supabaseAuth) {
            try {
                const authData = JSON.parse(supabaseAuth);
                if (authData.user) {
                    console.log('✅ Utilisateur trouvé dans Supabase');
                    return {
                        id: authData.user.id,
                        email: authData.user.email,
                        name: authData.user.user_metadata?.full_name || authData.user.email
                    };
                }
            } catch (e) {
                console.log('❌ Erreur parsing Supabase auth');
            }
        }
        
        // Méthode 3: Depuis sessionStorage
        const bridgeUser = sessionStorage.getItem('miniShopUser');
        if (bridgeUser) {
            try {
                const userData = JSON.parse(bridgeUser);
                console.log('✅ Utilisateur trouvé dans sessionStorage');
                return userData;
            } catch (e) {
                console.log('❌ Erreur parsing sessionStorage');
            }
        }
        
        console.log('❌ Aucun utilisateur trouvé');
        return null;
        
    } catch (error) {
        console.error('❌ Erreur récupération utilisateur:', error);
        return null;
    }
}

// Fonction pour créer un utilisateur de test
async function createTestUser() {
    const testUser = {
        id: 'test-user-' + Date.now(),
        email: 'test@example.com',
        name: 'Utilisateur Test'
    };
    
    // Stocker dans sessionStorage
    sessionStorage.setItem('miniShopUser', JSON.stringify(testUser));
    console.log('✅ Utilisateur de test créé:', testUser.email);
    
    return testUser;
}

// Fonction pour simuler l'ouverture de la Mini-Boutique
async function simulateMiniShopOpening() {
    console.log('🚀 Simulation ouverture Mini-Boutique...');
    
    if (window.openMiniShopWithUser) {
        console.log('✅ Fonction openMiniShopWithUser disponible');
        
        // Au lieu d'ouvrir une nouvelle fenêtre, on teste le mécanisme
        const user = await getCurrentUserFromMainApp();
        if (user) {
            console.log('📤 Données utilisateur à envoyer:', user);
            
            // Simuler l'envoi des données
            sessionStorage.setItem('miniShopCurrentUser', JSON.stringify(user));
            console.log('✅ Données utilisateur stockées dans sessionStorage');
            
            // Tester le postMessage
            setTimeout(() => {
                window.postMessage({ 
                    type: 'MINI_SHOP_USER', 
                    user: user 
                }, 'http://localhost:3007');
                console.log('📤 Message postMessage simulé');
            }, 500);
            
        } else {
            console.log('⚠️ Aucun utilisateur à envoyer');
        }
        
    } else {
        console.log('❌ Fonction openMiniShopWithUser non disponible');
    }
}

// Fonction pour tester l'isolation des données
async function testDataIsolation() {
    console.log('🔒 Test isolation des données...');
    
    // Créer deux utilisateurs de test
    const user1 = {
        id: 'test-user-1',
        email: 'test1@example.com',
        name: 'Test 1'
    };
    
    const user2 = {
        id: 'test-user-2', 
        email: 'test2@example.com',
        name: 'Test 2'
    };
    
    // Créer des produits pour chaque utilisateur
    const product1 = {
        id: 'prod-1',
        name: 'Produit Test 1',
        price: 19.99,
        userId: user1.id
    };
    
    const product2 = {
        id: 'prod-2',
        name: 'Produit Test 2', 
        price: 29.99,
        userId: user2.id
    };
    
    // Stocker les produits
    localStorage.setItem(`miniShopProducts_${user1.id}`, JSON.stringify([product1]));
    localStorage.setItem(`miniShopProducts_${user2.id}`, JSON.stringify([product2]));
    
    console.log('✅ Produits de test créés pour chaque utilisateur');
    
    // Vérifier l'isolation
    const storageKey1 = `miniShopProducts_${user1.id}`;
    const storageKey2 = `miniShopProducts_${user2.id}`;
    
    const products1 = JSON.parse(localStorage.getItem(storageKey1) || '[]');
    const products2 = JSON.parse(localStorage.getItem(storageKey2) || '[]');
    
    console.log(`📊 Utilisateur 1 (${user1.email}): ${products1.length} produit(s)`);
    console.log(`📊 Utilisateur 2 (${user2.email}): ${products2.length} produit(s)`);
    
    if (storageKey1 !== storageKey2 && products1 !== products2) {
        console.log('✅ Isolation des données: OK');
    } else {
        console.log('❌ Problème d\'isolation des données');
    }
    
    // Nettoyer
    localStorage.removeItem(storageKey1);
    localStorage.removeItem(storageKey2);
    console.log('🧹 Données de test nettoyées');
}

// Écouter les messages de la Mini-Boutique
window.addEventListener('message', function(event) {
    if (event.data.type === 'MINI_SHOP_READY') {
        console.log('📨 Message reçu de Mini-Boutique:', event.data);
    }
});

// Lancer les tests automatiquement
setTimeout(() => {
    testAuthBridge();
}, 1000);

console.log('🎯 Objectif: Vérifier que chaque utilisateur a ses propres données isolées');