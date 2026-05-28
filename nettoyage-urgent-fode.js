/**
 * Script de nettoyage URGENT pour éliminer "Fodé boutique"
 * À exécuter dans la console du navigateur (F12 → Console)
 * 
 * Ce script va supprimer toutes les données de boutique contaminées
 * et forcer le rechargement des données utilisateur spécifiques
 */

(function() {
  console.log('🚨 NETTOYAGE URGENT - Élimination de "Fodé boutique"...');
  
  // 1. Identifier toutes les clés de boutique
  const shopKeys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.includes('shop') || key.includes('Shop'))) {
      shopKeys.push(key);
    }
  }
  
  console.log(`📋 ${shopKeys.length} clés de boutique trouvées:`);
  shopKeys.forEach(key => {
    const value = localStorage.getItem(key);
    const hasFode = value && (
      value.includes('Fodé') || 
      value.includes('Fode') || 
      value.includes('fodé') || 
      value.includes('fode') ||
      value.includes('DAN') ||
      value.includes('dan')
    );
    
    console.log(`  ${hasFode ? '🚨' : '✅'} ${key}: ${hasFode ? 'CONTAMINÉ' : 'OK'}`);
  });
  
  // 2. Demander confirmation pour la suppression
  if (confirm(`⚠️  Suppression de ${shopKeys.length} clés de boutique ?\n\nCela va:\n- Supprimer toutes les boutiques hors ligne\n- Réinitialiser l'état de création de boutique\n- Forcer le rechargement depuis Supabase\n\nConfirmez-vous le nettoyage ?`)) {
    
    // 3. Supprimer toutes les clés de boutique
    shopKeys.forEach(key => {
      localStorage.removeItem(key);
      console.log(`🗑️  Supprimé: ${key}`);
    });
    
    // 4. Supprimer aussi les clés génériques problématiques
    const genericKeys = [
      'currentShop',
      'selectedShop',
      'shopData',
      'offlineShop',
      'mangoo-offline-shop',
      'mangoo-shop-status',
      'mangoo-shop-just-created',
      'mangoo-shop-creation-time'
    ];
    
    genericKeys.forEach(key => {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
        console.log(`🗑️  Supprimé: ${key}`);
      }
    });
    
    // 5. Afficher le résultat
    console.log(`\n✅ Nettoyage terminé!`);
    console.log(`📊 ${shopKeys.length} clés de boutique supprimées`);
    
    // 6. Afficher les clés restantes
    const remainingKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
      remainingKeys.push(localStorage.key(i));
    }
    
    console.log(`\n📋 Clés restantes (${remainingKeys.length}):`);
    remainingKeys.forEach(key => console.log(`  - ${key}`));
    
    // 7. Rafraîchir la page
    alert('✅ Nettoyage terminé! La page va être rafraîchie.');
    
    setTimeout(() => {
      console.log('🔄 Rafraîchissement de la page...');
      window.location.reload();
    }, 1000);
    
  } else {
    console.log('❌ Nettoyage annulé.');
  }
})();