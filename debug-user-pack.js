/**
 * Script de débogage pour vérifier l'état du pack utilisateur
 * dans la base de données
 */

// Simulation d'une vérification des données utilisateur
const debugUserPack = () => {
  console.log('🔍 Débogage du pack utilisateur');
  console.log('\n📋 Points à vérifier:');
  
  const checkpoints = [
    '1. Vérifier la table user_packs pour l\'utilisateur connecté',
    '2. Vérifier que le status est "active"',
    '3. Vérifier la relation avec la table packs',
    '4. Vérifier la fonction getUserPack dans services.ts',
    '5. Vérifier que refreshUserServices() est bien appelé',
    '6. Vérifier les logs de la console dans le navigateur'
  ];
  
  checkpoints.forEach((checkpoint, index) => {
    setTimeout(() => {
      console.log(`✅ ${checkpoint}`);
      if (index === checkpoints.length - 1) {
        console.log('\n🔧 Actions de débogage recommandées:');
        console.log('\n1. Ouvrir la console du navigateur (F12)');
        console.log('2. Aller sur le dashboard');
        console.log('3. Chercher les logs "Debug - User Pack Data:"');
        console.log('4. Vérifier si userPackData est null ou contient les bonnes données');
        console.log('\n5. Si userPackData est null:');
        console.log('   - Vérifier la table user_packs dans Supabase');
        console.log('   - Vérifier que l\'utilisateur a bien un pack actif');
        console.log('\n6. Si userPackData contient des données mais le dashboard ne se met pas à jour:');
        console.log('   - Vérifier que refreshUserServices() est bien appelé après le changement');
        console.log('   - Vérifier les logs de changePackSmart');
        console.log('\n7. Requête SQL pour vérifier manuellement:');
        console.log('   SELECT up.*, p.name, p.price FROM user_packs up');
        console.log('   JOIN packs p ON up.pack_id = p.id');
        console.log('   WHERE up.user_id = \'[USER_ID]\' AND up.status = \'active\'');
        console.log('   ORDER BY up.created_at DESC LIMIT 1;');
      }
    }, index * 300);
  });
};

// Exécuter le débogage
debugUserPack();

// Export pour utilisation dans d'autres fichiers
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { debugUserPack };
}