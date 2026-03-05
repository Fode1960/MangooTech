// Test rapide du système admin permanent
// Exécuter ce script pour vérifier que toutes les modifications sont implémentées

const { testAdminSystemQuick } = require('./src/utils/testAdminSystem.js');

console.log('🚀 Démarrage du test du système admin permanent...');

testAdminSystemQuick().then(result => {
  if (result.success) {
    console.log('🎉 SUCCÈS TOTAL!');
    console.log('Résultat:', result.message);
    console.log('Détails:', result.details);
  } else {
    console.log('❌ ÉCHEC DU TEST');
    console.log('Erreur:', result.error);
    if (result.stack) {
      console.log('Stack:', result.stack);
    }
  }
}).catch(error => {
  console.error('💥 Erreur critique:', error);
});