/**
 * Script de nettoyage du localStorage pour éliminer "Fodé boutique"
 * À exécuter dans la console du navigateur (F12 → Console)
 */

(function() {
  console.log('🧹 Démarrage du nettoyage du localStorage...');
  
  // Afficher toutes les clés actuelles
  console.log('📋 Clés actuelles dans localStorage:');
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    console.log(`  - ${key}`);
  }
  
  // Rechercher les clés contaminées
  const contaminatedKeys = [];
  const allKeys = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      allKeys.push(key);
      const value = localStorage.getItem(key);
      
      // Vérifier si la valeur contient "Fodé", "DAN" ou des variantes
      if (value && (
        value.includes('Fodé') || 
        value.includes('DAN') || 
        value.includes('fodé') || 
        value.includes('dan') ||
        value.includes('Fode') ||
        value.includes('fode')
      )) {
        contaminatedKeys.push({ key, value: value.substring(0, 200) });
      }
    }
  }
  
  console.log(`\n🚨 Clés contaminées trouvées: ${contaminatedKeys.length}`);
  
  if (contaminatedKeys.length > 0) {
    console.log('📝 Détails des clés contaminées:');
    contaminatedKeys.forEach(({ key, value }) => {
      console.log(`  - ${key}: ${value}...`);
    });
    
    if (confirm(`⚠️  ${contaminatedKeys.length} clés contaminées trouvées. Les supprimer ?`)) {
      contaminatedKeys.forEach(({ key }) => {
        localStorage.removeItem(key);
        console.log(`✅ Supprimé: ${key}`);
      });
    }
  }
  
  // Nettoyer les patterns spécifiques
  const patternsToClean = [
    'currentShop',
    'selectedShop', 
    'shopData',
    'offlineShop',
    'offline_shop_', // Ancienne clé partagée problématique
    'shop_settings_',
    'dan_shop',
    'fode_shop'
  ];
  
  console.log('\n🧹 Nettoyage des patterns spécifiques...');
  let cleanedCount = 0;
  
  patternsToClean.forEach(pattern => {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && key.includes(pattern)) {
        const value = localStorage.getItem(key);
        console.log(`🗑️  Pattern trouvé: ${key}`);
        
        if (confirm(`Supprimer ${key} ?`)) {
          localStorage.removeItem(key);
          cleanedCount++;
          console.log(`✅ Supprimé: ${key}`);
        }
      }
    }
  });
  
  console.log(`\n✅ Nettoyage terminé! ${cleanedCount} clés supprimées.`);
  
  // Afficher les clés restantes
  console.log('\n📋 Clés restantes:');
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    console.log(`  - ${key}`);
  }
  
  // Message final
  alert('Nettoyage terminé! Rafraîchissez la page pour voir les changements.');
  
})();