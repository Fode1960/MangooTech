// 📋 SCRIPT À EXÉCUTER DANS LA CONSOLE DU NAVIGATEUR
// Ouvrez F12 et collez ce code

console.log('🔍 DIAGNOSTIC LOCALSTORAGE EN COURS...');

// Afficher toutes les clés localStorage
const allKeys = Object.keys(localStorage);
console.log('📊 Total des clés localStorage:', allKeys.length);
console.log('\n📋 Toutes les clés:');
allKeys.forEach(key => {
  console.log(`  - ${key}`);
});

// Rechercher les clés PROBLÉMATIQUES (partagées)
console.log('\n🚨 CLÉS PROBLÉMATIQUES (potentiellement partagées):');

const problematicKeys = allKeys.filter(key => {
  return (
    key.includes('dan-products') && !key.includes('-user-') ||  // dan-products sans ID
    key.includes('offline_shop') && !key.includes('_user_') ||   // offline_shop sans ID
    key.includes('miniShopProducts') && key.includes('demo-user-123') // ID fixe
  );
});

if (problematicKeys.length > 0) {
  problematicKeys.forEach(key => {
    console.log(`  ❌ ${key} => PARTAGÉE entre utilisateurs !`);
    
    // Afficher le contenu
    try {
      const data = JSON.parse(localStorage.getItem(key));
      console.log(`     Contient: ${Array.isArray(data) ? data.length + ' items' : typeof data}`);
      if (Array.isArray(data) && data.length > 0) {
        console.log(`     Premier item:`, data[0]);
      }
    } catch (e) {
      console.log(`     Contenu:`, localStorage.getItem(key)?.substring(0, 100) + '...');
    }
  });
} else {
  console.log('✅ Aucune clé problématique trouvée');
}

// Rechercher les clés CORRECTES (avec ID utilisateur unique)
console.log('\n✅ CLÉS CORRECTES (isolées par utilisateur):');
const correctKeys = allKeys.filter(key => {
  return (
    (key.includes('miniShopProducts_') && key.includes('demo-user-') && key.length > 30) || // ID unique
    (key.includes('dan-products-') && key.includes('user-')) ||  // Avec user ID
    (key.includes('offline_shop_') && key.includes('user_'))     // Avec user ID
  );
});

if (correctKeys.length > 0) {
  correctKeys.forEach(key => {
    console.log(`  ✅ ${key} => ISOLÉE correctement`);
  });
} else {
  console.log('⚠️  Aucune clé correcte trouvée');
}

// Vérifier les doublons de produits
console.log('\n🔍 VÉRIFICATION DES DOUBLONS:');
const allProducts = [];
allKeys.forEach(key => {
  if (key.includes('products')) {
    try {
      const data = JSON.parse(localStorage.getItem(key));
      if (Array.isArray(data)) {
        allProducts.push(...data);
      }
    } catch (e) {
      // Ignorer les erreurs
    }
  }
});

const productNames = allProducts.map(p => p.name).filter(Boolean);
const duplicates = productNames.filter((name, index) => productNames.indexOf(name) !== index);
const uniqueDuplicates = [...new Set(duplicates)];

if (uniqueDuplicates.length > 0) {
  console.log(`🚨 Produits en doublon: ${uniqueDuplicates.join(', ')}`);
} else {
  console.log('✅ Pas de doublons détectés');
}

console.log('\n🎯 CONCLUSION:');
if (problematicKeys.length > 0) {
  console.log('❌ DES PRODUITS SONT PARTAGÉS ! Les clés problématiques doivent être corrigées.');
} else {
  console.log('✅ Les produits semblent isolés correctement.');
}