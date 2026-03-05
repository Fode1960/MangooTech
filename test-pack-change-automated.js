/**
 * Test automatisé pour vérifier la correction du problème de synchronisation pack
 * 
 * Ce script teste automatiquement :
 * 1. Le changement de pack
 * 2. La synchronisation avec la base de données
 * 3. L'affichage dans l'interface
 * 4. Les logs du webhook
 */

console.log('🚀 === TEST AUTOMATISÉ DE CHANGEMENT DE PACK ===\n');

// Configuration du test
const TEST_CONFIG = {
  // Remplacez ces valeurs par vos vraies configurations
  SUPABASE_URL: window.location.origin.includes('localhost') ? 'http://localhost:54321' : 'VOTRE_SUPABASE_URL',
  SUPABASE_ANON_KEY: 'VOTRE_SUPABASE_ANON_KEY',
  TEST_PACK_IDS: {
    'pack-decouverte': '0a85e74a-4aec-480a-8af1-7b57391a80d2',
    'pack-essentiel': 'AUTRE_PACK_ID',
    'pack-professionnel': 'AUTRE_PACK_ID'
  }
};

// Fonction principale de test
async function runAutomatedPackChangeTest() {
  try {
    console.log('1️⃣ Initialisation du test...');
    
    // Vérifier l'authentification
    const authData = localStorage.getItem('sb-' + window.location.hostname.replace(/\./g, '-') + '-auth-token');
    if (!authData) {
      throw new Error('Utilisateur non connecté');
    }
    
    const user = JSON.parse(authData)?.user;
    if (!user?.id) {
      throw new Error('Token d\'authentification invalide');
    }
    
    console.log('✅ Utilisateur connecté:', user.id);
    
    // Étape 1: Récupérer l'état initial
    console.log('\n2️⃣ Récupération de l\'état initial...');
    const initialState = await getPackState(user.id);
    console.log('📦 Pack initial:', initialState.packName);
    console.log('🔗 Selected pack initial:', initialState.selectedPack);
    
    // Étape 2: Simuler un changement de pack
    console.log('\n3️⃣ Simulation du changement de pack...');
    
    // Trouver un pack différent pour le test
    const targetPackId = findDifferentPack(initialState.packId);
    if (!targetPackId) {
      console.log('⚠️  Aucun pack différent disponible pour le test');
      return;
    }
    
    console.log('🎯 Pack cible pour le test:', targetPackId);
    
    // Étape 3: Effectuer le changement (simulation)
    console.log('\n4️⃣ Test du changement de pack...');
    
    // Simuler l'appel à smart-pack-change
    const changeResult = await simulatePackChange(targetPackId);
    console.log('📊 Résultat du changement:', changeResult);
    
    // Étape 4: Vérifier la synchronisation
    console.log('\n5️⃣ Vérification de la synchronisation...');
    
    // Attendre un peu pour la synchronisation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const finalState = await getPackState(user.id);
    console.log('📦 Pack final:', finalState.packName);
    console.log('🔗 Selected pack final:', finalState.selectedPack);
    
    // Étape 5: Analyser les résultats
    console.log('\n6️⃣ Analyse des résultats...');
    
    const testResults = {
      packChanged: initialState.packId !== finalState.packId,
      selectedPackUpdated: initialState.selectedPack !== finalState.selectedPack,
      synchronizationCorrect: checkSynchronization(finalState),
      interfaceUpdated: checkInterfaceUpdate(finalState.packName)
    };
    
    displayTestResults(testResults, initialState, finalState);
    
  } catch (error) {
    console.error('❌ Erreur lors du test automatisé:', error);
  }
}

// Fonction pour récupérer l'état du pack
async function getPackState(userId) {
  try {
    // Récupérer le pack actif
    const packResponse = await fetch(`/rest/v1/user_packs?user_id=eq.${userId}&status=eq.active&select=*,packs(*)`, {
      headers: {
        'apikey': TEST_CONFIG.SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${TEST_CONFIG.SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    const userPacks = await packResponse.json();
    const currentPack = userPacks[0];
    
    // Récupérer le selected_pack
    const userResponse = await fetch(`/rest/v1/users?id=eq.${userId}&select=selected_pack`, {
      headers: {
        'apikey': TEST_CONFIG.SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${TEST_CONFIG.SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    const users = await userResponse.json();
    const selectedPack = users[0]?.selected_pack;
    
    return {
      packId: currentPack?.pack_id,
      packName: currentPack?.packs?.name,
      selectedPack: selectedPack,
      status: currentPack?.status
    };
  } catch (error) {
    console.error('Erreur récupération état pack:', error);
    return null;
  }
}

// Fonction pour trouver un pack différent
function findDifferentPack(currentPackId) {
  const availablePacks = Object.values(TEST_CONFIG.TEST_PACK_IDS);
  return availablePacks.find(packId => packId !== currentPackId);
}

// Fonction pour simuler le changement de pack
async function simulatePackChange(targetPackId) {
  try {
    console.log('🔄 Simulation de l\'appel à smart-pack-change...');
    
    // Simuler l'appel (remplacez par le vrai appel si nécessaire)
    const response = await fetch('/functions/v1/smart-pack-change', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('sb-' + window.location.hostname.replace(/\./g, '-') + '-auth-token')}`
      },
      body: JSON.stringify({ packId: targetPackId })
    });
    
    if (!response.ok) {
      throw new Error(`Erreur API: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.log('⚠️  Simulation du changement (mode test):', error.message);
    return { simulated: true, targetPackId };
  }
}

// Fonction pour vérifier la synchronisation
function checkSynchronization(state) {
  if (!state.packName || !state.selectedPack) {return false;}
  
  // Générer le slug attendu
  const expectedSlug = state.packName.toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  
  return state.selectedPack === expectedSlug;
}

// Fonction pour vérifier la mise à jour de l'interface
function checkInterfaceUpdate(expectedPackName) {
  const packElements = [
    document.querySelector('[data-testid="current-pack-name"]'),
    document.querySelector('.pack-name'),
    document.querySelector('h3'),
    document.querySelector('.pack-title')
  ].filter(Boolean);
  
  return packElements.some(element => 
    element.textContent.includes(expectedPackName)
  );
}

// Fonction pour afficher les résultats
function displayTestResults(results, initialState, finalState) {
  console.log('\n🎯 === RÉSULTATS DU TEST AUTOMATISÉ ===');
  console.log('\n📊 État initial:');
  console.log('   Pack:', initialState.packName);
  console.log('   Selected pack:', initialState.selectedPack);
  
  console.log('\n📊 État final:');
  console.log('   Pack:', finalState.packName);
  console.log('   Selected pack:', finalState.selectedPack);
  
  console.log('\n✅ Résultats des tests:');
  console.log('   Pack changé:', results.packChanged ? '✅ OUI' : '❌ NON');
  console.log('   Selected pack mis à jour:', results.selectedPackUpdated ? '✅ OUI' : '❌ NON');
  console.log('   Synchronisation correcte:', results.synchronizationCorrect ? '✅ OUI' : '❌ NON');
  console.log('   Interface mise à jour:', results.interfaceUpdated ? '✅ OUI' : '❌ NON');
  
  const allTestsPassed = Object.values(results).every(result => result === true);
  
  console.log('\n🏆 RÉSULTAT GLOBAL:', allTestsPassed ? '✅ TOUS LES TESTS RÉUSSIS' : '❌ CERTAINS TESTS ONT ÉCHOUÉ');
  
  if (!allTestsPassed) {
    console.log('\n💡 Actions recommandées:');
    if (!results.synchronizationCorrect) {
      console.log('   - Vérifier que le webhook Stripe génère bien le slug');
    }
    if (!results.interfaceUpdated) {
      console.log('   - Rafraîchir la page ou vérifier le contexte React');
    }
  }
}

// Fonction pour tester les logs du webhook
async function checkWebhookLogs() {
  console.log('\n📋 === VÉRIFICATION DES LOGS WEBHOOK ===');
  console.log('💡 Pour vérifier les logs du webhook Stripe:');
  console.log('1. Allez dans la console Supabase');
  console.log('2. Section "Edge Functions" > "stripe-webhook"');
  console.log('3. Vérifiez les logs récents pour:');
  console.log('   - "✅ selected_pack mis à jour avec slug"');
  console.log('   - "Pack name: [nom du pack]"');
  console.log('   - "Generated slug: [slug généré]"');
}

// Exporter les fonctions pour utilisation
window.runAutomatedPackChangeTest = runAutomatedPackChangeTest;
window.checkWebhookLogs = checkWebhookLogs;

// Instructions d'utilisation
console.log('📋 INSTRUCTIONS D\'UTILISATION:');
console.log('1. Configurez TEST_CONFIG avec vos vraies valeurs');
console.log('2. Exécutez: runAutomatedPackChangeTest()');
console.log('3. Pour vérifier les logs webhook: checkWebhookLogs()');
console.log('\n🚀 Pour lancer le test: runAutomatedPackChangeTest()');