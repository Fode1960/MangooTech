/**
 * Script de nettoyage TOTAL du localStorage
 * À exécuter dans la console du navigateur (F12 → Console)
 * ⚠️  Cela supprimera TOUTES les données du localStorage
 */

(function() {
  console.log('🚨 Nettoyage TOTAL du localStorage...');
  
  // Sauvegarder les clés importantes si nécessaire
  const importantKeys = ['auth', 'user', 'session']; // Ajoutez ici les clés à préserver
  const backup = {};
  
  importantKeys.forEach(key => {
    const value = localStorage.getItem(key);
    if (value) {
      backup[key] = value;
      console.log(`💾 Sauvegarde de: ${key}`);
    }
  });
  
  // Afficher toutes les clés avant suppression
  console.log('📋 Clés à supprimer:');
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    console.log(`  - ${key}`);
  }
  
  if (confirm('⚠️  Voulez-vous vraiment supprimer TOUTES les données du localStorage ?\n\nCela inclut:\n- Toutes les boutiques\n- Tous les paramètres\n- Les données de session\n\nAction IRRÉVERSIBLE !')) {
    
    // Vider complètement le localStorage
    localStorage.clear();
    console.log('✅ localStorage vidé !');
    
    // Restaurer les clés importantes
    Object.keys(backup).forEach(key => {
      localStorage.setItem(key, backup[key]);
      console.log(`🔄 Restauration de: ${key}`);
    });
    
    console.log('\n🎉 Nettoyage terminé!');
    console.log('💡 Rafraîchissez la page (F5) pour voir les changements.');
    
    alert('Nettoyage terminé! La page va être rafraîchie.');
    
    // Rafraîchir la page
    setTimeout(() => {
      window.location.reload();
    }, 1000);
    
  } else {
    console.log('❌ Nettoyage annulé.');
  }
})();