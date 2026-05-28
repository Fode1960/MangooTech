/**
 * Script de test automatisé pour vérifier la correction de synchronisation du pack
 * À exécuter dans la console du dashboard après la correction
 */

console.log('🧪 === TEST AUTOMATISÉ DE LA CORRECTION ===\n');

// Fonction de test complète
async function testPackSyncFix() {
  try {
    console.log('1️⃣ Initialisation du test...');
    
    // Vérifier l'utilisateur connecté
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('❌ Test échoué: Utilisateur non connecté');
      return false;
    }
    
    console.log('✅ Utilisateur connecté:', user.email);
    
    // 2. Récupérer les données après correction
    console.log('\n2️⃣ Vérification des données après correction...');
    
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select(`
        id,
        email,
        selected_pack,
        user_packs(
          id,
          pack_id,
          status,
          started_at,
          next_billing_date,
          packs(
            id,
            name,
            slug
          )
        ),
        transactions(
          id,
          pack_id,
          status,
          created_at,
          packs(
            id,
            name,
            slug
          )
        )
      `)
      .eq('id', user.id)
      .single();
    
    if (userError) {
      console.error('❌ Test échoué: Erreur récupération données:', userError);
      return false;
    }
    
    // 3. Analyser les résultats
    console.log('\n3️⃣ Analyse des résultats...');
    
    const activePacks = userData.user_packs.filter(up => up.status === 'active');
    const completedTransactions = userData.transactions
      .filter(t => t.status === 'completed')
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    console.log(`📊 Résultats de l'analyse:`);
    console.log(`   - Packs actifs: ${activePacks.length}`);
    console.log(`   - Transactions réussies: ${completedTransactions.length}`);
    console.log(`   - Selected pack: ${userData.selected_pack}`);
    
    // Tests de validation
    const tests = [];
    
    // Test 1: Un seul pack actif
    tests.push({
      name: 'Un seul pack actif',
      passed: activePacks.length === 1,
      details: `${activePacks.length} pack(s) actif(s)`
    });
    
    if (activePacks.length > 0 && completedTransactions.length > 0) {
      const activePack = activePacks[0];
      const lastTransaction = completedTransactions[0];
      
      // Test 2: Pack actif correspond à la dernière transaction
      tests.push({
        name: 'Pack actif correspond à la dernière transaction',
        passed: activePack.pack_id === lastTransaction.pack_id,
        details: `Pack actif: ${activePack.packs.name}, Dernière transaction: ${lastTransaction.packs.name}`
      });
      
      // Test 3: Selected pack correspond au pack actif
      tests.push({
        name: 'Selected pack correspond au pack actif',
        passed: userData.selected_pack === activePack.packs.slug,
        details: `Selected: ${userData.selected_pack}, Pack actif: ${activePack.packs.slug}`
      });
      
      // Test 4: Dates de facturation valides
      const hasValidDates = activePack.started_at && activePack.next_billing_date;
      tests.push({
        name: 'Dates de facturation valides',
        passed: hasValidDates,
        details: `Started: ${activePack.started_at ? '✓' : '✗'}, Next billing: ${activePack.next_billing_date ? '✓' : '✗'}`
      });
      
      // Test 5: Cohérence temporelle
      if (hasValidDates) {
        const startDate = new Date(activePack.started_at);
        const nextBillingDate = new Date(activePack.next_billing_date);
        const isValidTimeSequence = nextBillingDate > startDate;
        
        tests.push({
          name: 'Cohérence temporelle des dates',
          passed: isValidTimeSequence,
          details: `Next billing (${nextBillingDate.toLocaleDateString()}) > Started (${startDate.toLocaleDateString()})`
        });
      }
    }
    
    // Affichage des résultats des tests
    console.log('\n4️⃣ Résultats des tests:');
    console.log('=' .repeat(50));
    
    let allTestsPassed = true;
    
    tests.forEach((test, index) => {
      const status = test.passed ? '✅' : '❌';
      console.log(`${status} Test ${index + 1}: ${test.name}`);
      console.log(`   ${test.details}`);
      
      if (!test.passed) {
        allTestsPassed = false;
      }
    });
    
    console.log('=' .repeat(50));
    
    // Résultat final
    if (allTestsPassed) {
      console.log('\n🎉 === TOUS LES TESTS RÉUSSIS ===');
      console.log('✅ La correction de synchronisation fonctionne parfaitement!');
      console.log('💡 Le pack est maintenant correctement synchronisé.');
      
      // Afficher un résumé
      if (activePacks.length > 0) {
        const activePack = activePacks[0];
        console.log('\n📋 Résumé:');
        console.log(`   🎯 Pack actuel: ${activePack.packs.name}`);
        console.log(`   🏷️  Slug: ${activePack.packs.slug}`);
        console.log(`   📅 Démarré: ${new Date(activePack.started_at).toLocaleDateString()}`);
        console.log(`   💳 Prochaine facturation: ${new Date(activePack.next_billing_date).toLocaleDateString()}`);
      }
      
      return true;
    } else {
      console.log('\n❌ === CERTAINS TESTS ONT ÉCHOUÉ ===');
      console.log('⚠️  La correction nécessite des ajustements supplémentaires.');
      console.log('💡 Exécutez autoFixPackSync() à nouveau ou contactez le support.');
      
      return false;
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
    return false;
  }
}

// Fonction de test rapide
async function quickTest() {
  try {
    console.log('⚡ === TEST RAPIDE ===\n');
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.log('❌ Utilisateur non connecté');
      return false;
    }
    
    const { data: userData } = await supabase
      .from('users')
      .select(`
        selected_pack,
        user_packs!inner(
          status,
          pack_id,
          packs(name, slug)
        ),
        transactions(
          status,
          pack_id,
          created_at,
          packs(name, slug)
        )
      `)
      .eq('id', user.id)
      .eq('user_packs.status', 'active')
      .single();
    
    const activePack = userData.user_packs[0];
    const lastTransaction = userData.transactions
      .filter(t => t.status === 'completed')
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
    
    const isSync = activePack && lastTransaction && 
                   userData.selected_pack === activePack.packs.slug &&
                   activePack.pack_id === lastTransaction.pack_id;
    
    console.log(`👤 ${user.email}`);
    console.log(`📦 Pack actif: ${activePack?.packs?.name}`);
    console.log(`💳 Dernière transaction: ${lastTransaction?.packs?.name}`);
    console.log(`🏷️  Selected pack: ${userData.selected_pack}`);
    console.log(`\n${isSync ? '✅' : '❌'} Statut: ${isSync ? 'SYNCHRONISÉ' : 'DÉSYNCHRONISÉ'}`);
    
    return isSync;
    
  } catch (error) {
    console.error('❌ Erreur test rapide:', error);
    return false;
  }
}

// Fonction de test complet avec correction automatique
async function testAndFix() {
  console.log('🔄 === TEST ET CORRECTION AUTOMATIQUE ===\n');
  
  // 1. Test initial
  console.log('1️⃣ Test initial...');
  const initialTest = await quickTest();
  
  if (initialTest) {
    console.log('\n✅ Aucune correction nécessaire!');
    return true;
  }
  
  // 2. Correction
  console.log('\n2️⃣ Application de la correction...');
  await autoFixPackSync();
  
  // 3. Test après correction
  console.log('\n3️⃣ Test après correction...');
  await new Promise(resolve => setTimeout(resolve, 1000)); // Attendre 1 seconde
  
  const finalTest = await testPackSyncFix();
  
  if (finalTest) {
    console.log('\n🎉 Correction réussie et validée!');
  } else {
    console.log('\n⚠️  La correction nécessite une intervention manuelle.');
  }
  
  return finalTest;
}

// Export des fonctions
window.testPackSyncFix = testPackSyncFix;
window.quickTest = quickTest;
window.testAndFix = testAndFix;

console.log('📋 === COMMANDES DE TEST DISPONIBLES ===');
console.log('- quickTest() : Test rapide du statut');
console.log('- testPackSyncFix() : Test complet après correction');
console.log('- testAndFix() : Test + correction + validation automatique');
console.log('\n✅ Scripts de test chargés!');

// Auto-exécution du test rapide
console.log('\n🚀 Exécution automatique du test rapide...');
quickTest().then(result => {
  if (!result) {
    console.log('\n💡 Exécutez testAndFix() pour corriger automatiquement');
  }
});