// 🧹 SCRIPT DE NETTOYAGE ET D'ISOLATION FORCEE
// Exécuter dans la console (F12) AVANT de créer des produits

console.log('🧹 NETTOYAGE ET ISOLATION FORCEE DES DONNÉES...');

// 1. SAUVEGARDER LES DONNÉES ACTUELLES (optionnel)
const backup = {};
const allKeys = Object.keys(localStorage);

allKeys.forEach(key => {
  try {
    backup[key] = localStorage.getItem(key);
  } catch (e) {
    console.warn('⚠️ Impossible de sauvegarder:', key);
  }
});

console.log('💾 Sauvegarde créée:', Object.keys(backup).length, 'clés');

// 2. IDENTIFIER LES CLÉS PROBLÉMATIQUES
const problematicPatterns = [
  'dan-products',           // Sans suffixe user
  'offline_shop',           // Sans suffixe user  
  'miniShopProducts_demo-user-123', // ID fixe
  'mangoo-offline-shop',    // Global
  'miniShopProducts_demo-user-', // Anciens IDs courts
];

const keysToClean = allKeys.filter(key => {
  return problematicPatterns.some(pattern => key.includes(pattern));
});

console.log('🚨 Clés problématiques trouvées:', keysToClean.length);
keysToClean.forEach(key => console.log('  ❌', key));

// 3. OBTENIR L'ID UTILISATEUR ACTUEL
function getCurrentUserId() {
  // Méthode 1: Depuis sessionStorage
  const sessionUser = sessionStorage.getItem('miniShopCurrentUser');
  if (sessionUser) {
    try {
      const user = JSON.parse(sessionUser);
      if (user && user.id) return user.id;
    } catch (e) {}
  }
  
  // Méthode 2: Depuis localStorage
  const localUser = localStorage.getItem('miniShopCurrentUser');
  if (localUser) {
    try {
      const user = JSON.parse(localUser);
      if (user && user.id) return user.id;
    } catch (e) {}
  }
  
  // Méthode 3: Depuis le bridge
  if (window.currentMiniShopUser && window.currentMiniShopUser.id) {
    return window.currentMiniShopUser.id;
  }
  
  // Méthode 4: Créer un nouvel ID unique
  return `demo-user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

const currentUserId = getCurrentUserId();
console.log('👤 ID utilisateur actuel:', currentUserId);

// 4. NETTOYER LES CLÉS GLOBALES
keysToClean.forEach(key => {
  console.log('🗑️ Suppression:', key);
  localStorage.removeItem(key);
});

// 5. MIGRER LES DONNÉES UTILES (si nécessaire)
const migrationMap = {};

// Pour chaque clé supprimée, créer une version isolée si elle contenait des données
Object.keys(backup).forEach(key => {
  if (keysToClean.includes(key)) {
    const data = backup[key];
    if (data && data !== 'null' && data !== 'undefined') {
      
      // Mini-Boutique products
      if (key.includes('miniShopProducts')) {
        const newKey = `miniShopProducts_${currentUserId}`;
        migrationMap[newKey] = data;
        console.log('📦 Migration Mini-Boutique:', key, '→', newKey);
      }
      
      // DAN products
      else if (key.includes('dan-products')) {
        const newKey = `dan-products-${currentUserId}`;
        migrationMap[newKey] = data;
        console.log('🛍️ Migration DAN:', key, '→', newKey);
      }
      
      // Offline shop
      else if (key.includes('offline_shop')) {
        const newKey = `offline_shop_${currentUserId}`;
        migrationMap[newKey] = data;
        console.log('🏪 Migration Shop:', key, '→', newKey);
      }
      
      // Mangoo offline shop
      else if (key.includes('mangoo-offline-shop')) {
        const newKey = `mangoo-offline-shop-${currentUserId}`;
        migrationMap[newKey] = data;
        console.log('🏪 Migration Mangoo:', key, '→', newKey);
      }
    }
  }
});

// 6. APPLIQUER LES MIGRATIONS
Object.keys(migrationMap).forEach(newKey => {
  localStorage.setItem(newKey, migrationMap[newKey]);
  console.log('✅ Création:', newKey);
});

// 7. VÉRIFIER LE RÉSULTAT
console.log('\n📊 RÉSULTAT DU NETTOYAGE:');
const newKeys = Object.keys(localStorage);
console.log('Nouvelles clés:', newKeys.length);

const userSpecificKeys = newKeys.filter(key => key.includes(currentUserId));
console.log('Clés spécifiques à l\'utilisateur:', userSpecificKeys.length);

userSpecificKeys.forEach(key => {
  try {
    const data = JSON.parse(localStorage.getItem(key));
    console.log(`  ✅ ${key}: ${Array.isArray(data) ? data.length + ' items' : typeof data}`);
  } catch (e) {
    console.log(`  ✅ ${key}: ${localStorage.getItem(key)?.substring(0, 50)}...`);
  }
});

// 8. FORCER L'ID DANS SESSIONSTORAGE
sessionStorage.setItem('miniShopDemoUserId', currentUserId);
sessionStorage.setItem('miniShopCurrentUser', JSON.stringify({
  id: currentUserId,
  email: 'demo@miniboutique.com',
  user_metadata: { full_name: 'Utilisateur Démo' },
  isDemo: true
}));

console.log('\n🎯 ISOLATION TERMINÉE !');
console.log('🔄 Rechargez la page pour appliquer les changements.');

// 9. TEST RAPIDE
console.log('\n🧪 TEST D\'ISOLATION:');
console.log('Créez un produit et vérifiez qu\'il n\'apparaît pas sur d\'autres comptes.');