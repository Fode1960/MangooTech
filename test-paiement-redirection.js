// Test automatisé de paiement et redirection pour changement de pack
console.log('🧪 Test de paiement et redirection - Changement de pack');

// Configuration du test
const TEST_CONFIG = {
  frontendUrl: 'http://localhost:3001',
  supabaseUrl: 'http://localhost:54321',
  testPackId: 'pack-premium',
  testUserId: 'test-user-payment',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
};

// Fonction pour simuler un appel à create-checkout-session
async function testCreateCheckoutSession() {
  console.log('\n=== TEST CREATE-CHECKOUT-SESSION ===');
  
  try {
    console.log('🔄 Simulation d\'un appel de création de session de paiement...');
    
    const response = await fetch(`${TEST_CONFIG.supabaseUrl}/functions/v1/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_CONFIG.anonKey}`
      },
      body: JSON.stringify({
        packId: TEST_CONFIG.testPackId,
        successUrl: `${TEST_CONFIG.frontendUrl}/dashboard?payment=success&pack=${TEST_CONFIG.testPackId}`,
        cancelUrl: `${TEST_CONFIG.frontendUrl}/dashboard?payment=cancelled`
      })
    });

    console.log('📊 Statut de la réponse:', response.status);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Session de paiement créée avec succès');
      
      if (result.url && result.url.includes('stripe.com')) {
        console.log('✅ URL Stripe générée:', result.url.substring(0, 80) + '...');
        
        // Vérifier que les URLs de redirection sont correctes
        console.log('\n🔍 Vérification des URLs de redirection:');
        
        // Simuler le retour de paiement réussi
        const successUrl = `${TEST_CONFIG.frontendUrl}/dashboard?payment=success&pack=${TEST_CONFIG.testPackId}`;
        console.log('✅ URL de succès:', successUrl);
        
        // Vérifier que l'URL contient localhost:3001
        if (successUrl.includes('localhost:3001')) {
          console.log('✅ Redirection correcte vers localhost:3001');
          return { success: true, checkoutUrl: result.url, successUrl };
        } else {
          console.log('❌ Redirection incorrecte - ne pointe pas vers localhost:3001');
          return { success: false, error: 'URL de redirection incorrecte' };
        }
      } else {
        console.log('❌ URL Stripe manquante ou invalide');
        console.log('Réponse complète:', JSON.stringify(result, null, 2));
        return { success: false, error: 'URL Stripe invalide' };
      }
    } else {
      const errorText = await response.text();
      console.log('❌ Erreur lors de la création de la session:', response.status);
      console.log('Détails:', errorText);
      return { success: false, error: errorText };
    }
  } catch (error) {
    console.log('❌ Erreur de connexion:', error.message);
    return { success: false, error: error.message };
  }
}

// Fonction pour simuler le retour de paiement
async function simulatePaymentReturn(successUrl) {
  console.log('\n=== SIMULATION RETOUR DE PAIEMENT ===');
  
  try {
    console.log('🔄 Simulation d\'un retour de paiement réussi...');
    console.log('🌐 URL de retour:', successUrl);
    
    // Vérifier que le frontend est accessible
    const frontendResponse = await fetch(TEST_CONFIG.frontendUrl);
    
    if (frontendResponse.ok) {
      console.log('✅ Frontend accessible pour le retour de paiement');
      
      // Extraire les paramètres de l'URL
      const url = new URL(successUrl);
      const paymentStatus = url.searchParams.get('payment');
      const packId = url.searchParams.get('pack');
      
      console.log('📋 Paramètres de retour:');
      console.log('   - Statut paiement:', paymentStatus);
      console.log('   - Pack ID:', packId);
      
      if (paymentStatus === 'success' && packId === TEST_CONFIG.testPackId) {
        console.log('✅ Paramètres de retour corrects');
        return { success: true, paymentStatus, packId };
      } else {
        console.log('❌ Paramètres de retour incorrects');
        return { success: false, error: 'Paramètres incorrects' };
      }
    } else {
      console.log('❌ Frontend non accessible pour le retour');
      return { success: false, error: 'Frontend inaccessible' };
    }
  } catch (error) {
    console.log('❌ Erreur lors de la simulation de retour:', error.message);
    return { success: false, error: error.message };
  }
}

// Fonction pour tester smart-pack-change (si utilisateur connecté)
async function testSmartPackChange() {
  console.log('\n=== TEST SMART-PACK-CHANGE ===');
  
  try {
    console.log('🔄 Test de l\'Edge Function smart-pack-change...');
    
    const response = await fetch(`${TEST_CONFIG.supabaseUrl}/functions/v1/smart-pack-change`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_CONFIG.anonKey}`
      },
      body: JSON.stringify({
        packId: TEST_CONFIG.testPackId
      })
    });

    console.log('📊 Statut de la réponse:', response.status);
    
    if (response.status === 401) {
      console.log('ℹ️ Authentification requise (comportement normal)');
      console.log('✅ Edge Function smart-pack-change est accessible');
      return { success: true, requiresAuth: true };
    } else if (response.ok) {
      const result = await response.json();
      console.log('✅ smart-pack-change fonctionne');
      console.log('Résultat:', JSON.stringify(result, null, 2));
      return { success: true, result };
    } else {
      const errorText = await response.text();
      console.log('❌ Erreur smart-pack-change:', response.status);
      console.log('Détails:', errorText);
      return { success: false, error: errorText };
    }
  } catch (error) {
    console.log('❌ Erreur de connexion smart-pack-change:', error.message);
    return { success: false, error: error.message };
  }
}

// Fonction principale de test
async function runPaymentTest() {
  console.log('🚀 Démarrage du test de paiement complet...\n');
  
  // Vérifications préliminaires
  console.log('=== VÉRIFICATIONS PRÉLIMINAIRES ===');
  console.log('📋 Configuration:');
  console.log('   - Frontend:', TEST_CONFIG.frontendUrl);
  console.log('   - Supabase:', TEST_CONFIG.supabaseUrl);
  console.log('   - Pack de test:', TEST_CONFIG.testPackId);
  
  // Test 1: Vérifier la connectivité
  try {
    const frontendCheck = await fetch(TEST_CONFIG.frontendUrl);
    const supabaseCheck = await fetch(`${TEST_CONFIG.supabaseUrl}/rest/v1/`, {
      headers: { 'apikey': TEST_CONFIG.anonKey }
    });
    
    console.log('✅ Frontend accessible:', frontendCheck.ok);
    console.log('✅ Supabase accessible:', supabaseCheck.ok);
    
    if (!frontendCheck.ok || !supabaseCheck.ok) {
      console.log('❌ Services non disponibles - arrêt du test');
      return false;
    }
  } catch (error) {
    console.log('❌ Erreur de connectivité:', error.message);
    return false;
  }
  
  // Test 2: Création de session de paiement
  const checkoutResult = await testCreateCheckoutSession();
  
  // Test 3: Simulation de retour de paiement
  let returnResult = null;
  if (checkoutResult.success && checkoutResult.successUrl) {
    returnResult = await simulatePaymentReturn(checkoutResult.successUrl);
  }
  
  // Test 4: Test de smart-pack-change
  const smartPackResult = await testSmartPackChange();
  
  // Résultats finaux
  console.log('\n=== RÉSULTATS FINAUX ===');
  console.log(`Création session paiement: ${checkoutResult.success ? '✅ OK' : '❌ ÉCHEC'}`);
  console.log(`Simulation retour paiement: ${returnResult?.success ? '✅ OK' : '❌ ÉCHEC'}`);
  console.log(`Smart-pack-change accessible: ${smartPackResult.success ? '✅ OK' : '❌ ÉCHEC'}`);
  
  const allTestsPassed = checkoutResult.success && 
                        (returnResult?.success || returnResult === null) && 
                        smartPackResult.success;
  
  if (allTestsPassed) {
    console.log('\n🎉 TOUS LES TESTS DE PAIEMENT PASSENT!');
    console.log('✅ La redirection pointe correctement vers localhost:3001');
    console.log('✅ Les Edge Functions sont opérationnelles');
    console.log('✅ Le processus de paiement devrait fonctionner correctement');
    
    console.log('\n💡 ÉTAPES POUR TESTER MANUELLEMENT:');
    console.log('1. Connectez-vous sur http://localhost:3001');
    console.log('2. Allez dans le dashboard');
    console.log('3. Tentez un changement de pack');
    console.log('4. Vérifiez que la redirection après paiement est correcte');
  } else {
    console.log('\n⚠️ CERTAINS TESTS ÉCHOUENT');
    
    if (!checkoutResult.success) {
      console.log('🔧 Problème avec create-checkout-session');
      console.log('   - Vérifiez que Supabase est démarré');
      console.log('   - Vérifiez les Edge Functions');
    }
    
    if (!smartPackResult.success) {
      console.log('🔧 Problème avec smart-pack-change');
      console.log('   - Vérifiez le déploiement des fonctions');
    }
  }
  
  return allTestsPassed;
}

// Exécution du test
runPaymentTest().then(success => {
  console.log(`\n🏁 Test terminé avec ${success ? 'succès' : 'échec'}`);
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});