/**
 * Script de débogage pour analyser le problème de mise à jour du pack après paiement
 * 
 * PROBLÈME IDENTIFIÉ:
 * - L'utilisateur a payé mais garde toujours le Pack Découverte
 * - User ID: 9c97cee9-9c65-47dd-b75b-3d7a0f513701
 * - Pack ID actuel: 0a85e74a-4aec-480a-8af1-7b57391a80d2 (Pack Découverte)
 */

console.log('🔍 ANALYSE DU PROBLÈME DE PAIEMENT');
console.log('=====================================');

// Informations extraites des logs
const USER_ID = '9c97cee9-9c65-47dd-b75b-3d7a0f513701';
const CURRENT_PACK_ID = '0a85e74a-4aec-480a-8af1-7b57391a80d2'; // Pack Découverte

console.log('\n📊 ÉTAT ACTUEL:');
console.log('- User ID:', USER_ID);
console.log('- Pack actuel:', CURRENT_PACK_ID, '(Pack Découverte)');
console.log('- Prix actuel: 0 FCFA/mois');
console.log('- Prochaine facturation: Non défini');

console.log('\n🔍 POINTS DE CONTRÔLE À VÉRIFIER:');
console.log('\n1. WEBHOOK STRIPE:');
console.log('   - Le webhook a-t-il été appelé après le paiement ?');
console.log('   - Les métadonnées (user_id, pack_id) étaient-elles correctes ?');
console.log('   - Y a-t-il eu des erreurs lors de la mise à jour de la base ?');

console.log('\n2. BASE DE DONNÉES user_packs:');
console.log('   - Vérifier tous les enregistrements pour cet utilisateur');
console.log('   - Statut des packs (active, cancelled, etc.)');
console.log('   - Dates de création et mise à jour');

console.log('\n3. MÉTADONNÉES STRIPE:');
console.log('   - Le pack_id dans les métadonnées était-il correct ?');
console.log('   - Le user_id était-il correct ?');
console.log('   - Le paiement a-t-il été confirmé ?');

console.log('\n4. LOGS SERVEUR:');
console.log('   - Vérifier les logs du webhook Stripe');
console.log('   - Rechercher des erreurs de base de données');
console.log('   - Vérifier les permissions RLS');

console.log('\n🛠️ ACTIONS DE DÉBOGAGE RECOMMANDÉES:');
console.log('\n1. Requête SQL pour vérifier l\'état de la base:');
console.log(`   SELECT * FROM user_packs WHERE user_id = '${USER_ID}' ORDER BY created_at DESC;`);

console.log('\n2. Vérifier les packs disponibles:');
console.log('   SELECT * FROM packs ORDER BY price;');

console.log('\n3. Vérifier les sessions Stripe récentes:');
console.log('   - Aller dans le dashboard Stripe');
console.log('   - Vérifier les paiements récents');
console.log('   - Examiner les métadonnées des sessions');

console.log('\n4. Vérifier les logs du webhook:');
console.log('   - Aller dans Supabase Dashboard > Edge Functions');
console.log('   - Vérifier les logs de stripe-webhook');
console.log('   - Rechercher des erreurs récentes');

console.log('\n🚨 CAUSES POSSIBLES:');
console.log('\n1. WEBHOOK NON DÉCLENCHÉ:');
console.log('   - Configuration webhook Stripe incorrecte');
console.log('   - URL webhook non accessible');
console.log('   - Secret webhook incorrect');

console.log('\n2. ERREUR DANS LE WEBHOOK:');
console.log('   - Métadonnées manquantes ou incorrectes');
console.log('   - Erreur de base de données (permissions RLS)');
console.log('   - Erreur de logique dans le code');

console.log('\n3. PROBLÈME DE TIMING:');
console.log('   - Le webhook s\'exécute mais après le rafraîchissement');
console.log('   - Problème de cache côté client');

console.log('\n4. PROBLÈME DE PERMISSIONS:');
console.log('   - RLS bloque la mise à jour');
console.log('   - Service role key incorrecte');

console.log('\n✅ PROCHAINES ÉTAPES:');
console.log('1. Vérifier la base de données avec les requêtes SQL');
console.log('2. Examiner les logs Stripe et Supabase');
console.log('3. Tester un nouveau paiement avec logs détaillés');
console.log('4. Vérifier la configuration webhook');

console.log('\n=== FIN DE L\'ANALYSE ===');