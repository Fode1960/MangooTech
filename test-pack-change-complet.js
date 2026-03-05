// Test automatique simplifié pour vérifier le changement de pack
console.log('🧪 Test automatique du changement de pack');

// Configuration de test
const TEST_CONFIG = {
  frontendUrl: 'http://localhost:3001',
  supabaseUrl: 'http://localhost:54321',
  testPackId: 'pack-premium'
};

async function testPackChange() {
  console.log('\n=== TEST COMPLET CHANGEMENT DE PACK ===');
  
  try {
    // Test 1: Vérifier que le frontend est accessible
    console.log('\n1. 🌐 Test d\'accessibilité du frontend...');
    const frontendResponse = await fetch(TEST_CONFIG.frontendUrl);
    if (frontendResponse.ok) {
      console.log('✅ Frontend accessible sur', TEST_CONFIG.frontendUrl);
    } else {
      console.log('❌ Frontend non accessible');
      return false;
    }

    // Test 2: Vérifier Supabase
    console.log('\n2. 🔧 Test de connectivité Supabase...');
    try {
      const supabaseHealthResponse = await fetch(`${TEST_CONFIG.supabaseUrl}/health`);
      if (supabaseHealthResponse.ok) {
        console.log('✅ Supabase accessible');
      } else {
        console.log('❌ Supabase non accessible (code:', supabaseHealthResponse.status, ')');
        console.log('🔧 Supabase doit être démarré avec Docker Desktop');
        return false;
      }
    } catch (supabaseError) {
      console.log('❌ Supabase non accessible:', supabaseError.message);
      console.log('🔧 Actions requises:');
      console.log('   1. Démarrer Docker Desktop');
      console.log('   2. Exécuter: npx supabase start');
      return false;
    }

    // Test 3: Simuler un appel à smart-pack-change
    console.log('\n3. 🔄 Test de l\'Edge Function smart-pack-change...');
    try {
      const packChangeResponse = await fetch(`${TEST_CONFIG.supabaseUrl}/functions/v1/smart-pack-change`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
        },
        body: JSON.stringify({
          packId: TEST_CONFIG.testPackId
        })
      });

      if (packChangeResponse.ok) {
        const result = await packChangeResponse.json();
        console.log('✅ Edge Function smart-pack-change accessible');
        
        // Vérifier si l'URL de checkout contient la bonne URL
        if (result.checkoutUrl) {
          if (result.checkoutUrl.includes('localhost:3001')) {
            console.log('✅ URL de redirection correcte:', result.checkoutUrl.substring(0, 80) + '...');
            return true;
          } else if (result.checkoutUrl.includes('localhost:3001')) {
            console.log('❌ URL de redirection incorrecte (encore 3001):', result.checkoutUrl.substring(0, 80) + '...');
            console.log('🔧 La variable FRONTEND_URL n\'a pas été prise en compte');
            console.log('🔧 Redémarrer Supabase: npx supabase stop && npx supabase start');
            return false;
          } else {
            console.log('⚠️ URL de redirection inattendue:', result.checkoutUrl.substring(0, 80) + '...');
            return false;
          }
        } else {
          console.log('ℹ️ Pas d\'URL de checkout (changement immédiat possible)');
          console.log('✅ Résultat:', result.message || 'Changement traité');
          return true;
        }
      } else {
        const errorText = await packChangeResponse.text();
        console.log('❌ Edge Function erreur:', packChangeResponse.status);
        console.log('Détails:', errorText.substring(0, 200) + '...');
        return false;
      }
    } catch (fetchError) {
      console.log('❌ Impossible de contacter l\'Edge Function:', fetchError.message);
      return false;
    }

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
    return false;
  }
}

// Test de simulation de paiement
async function testPaymentSimulation() {
  console.log('\n=== TEST SIMULATION PAIEMENT ===');
  
  try {
    // Test de create-checkout-session
    console.log('\n4. 💳 Test de create-checkout-session...');
    const checkoutResponse = await fetch(`${TEST_CONFIG.supabaseUrl}/functions/v1/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
      },
      body: JSON.stringify({
        packId: TEST_CONFIG.testPackId,
        successUrl: `${TEST_CONFIG.frontendUrl}/dashboard?payment=success`,
        cancelUrl: `${TEST_CONFIG.frontendUrl}/dashboard?payment=cancelled`
      })
    });

    if (checkoutResponse.ok) {
      const result = await checkoutResponse.json();
      console.log('✅ create-checkout-session fonctionne');
      
      // Vérifier les URLs de redirection dans la réponse
      if (result.url && result.url.includes('stripe.com')) {
        console.log('✅ URL Stripe générée:', result.url.substring(0, 50) + '...');
        
        // Simuler le retour de paiement
        const successUrl = `${TEST_CONFIG.frontendUrl}/dashboard?payment=success&pack=${TEST_CONFIG.testPackId}`;
        console.log('✅ URL de succès attendue:', successUrl);
        
        return true;
      } else {
        console.log('❌ URL Stripe invalide ou manquante');
        console.log('Réponse:', JSON.stringify(result, null, 2));
        return false;
      }
    } else {
      const errorText = await checkoutResponse.text();
      console.log('❌ create-checkout-session échoue:', checkoutResponse.status);
      console.log('Erreur:', errorText.substring(0, 200) + '...');
      return false;
    }
  } catch (error) {
    console.log('❌ Erreur simulation paiement:', error.message);
    return false;
  }
}

// Fonction de vérification de la configuration
function checkConfiguration() {
  console.log('\n=== VÉRIFICATION CONFIGURATION ===');
  console.log('📋 Configuration actuelle:');
  console.log('   Frontend URL:', TEST_CONFIG.frontendUrl);
  console.log('   Supabase URL:', TEST_CONFIG.supabaseUrl);
  console.log('\n📝 Fichiers de configuration à vérifier:');
  console.log('   - supabase/.env : FRONTEND_URL=http://localhost:3001');
  console.log('   - vite.config.js : port 3001');
  console.log('   - supabase/config.toml : site_url et redirect_urls sur 3002');
}

// Fonction principale
async function runCompleteTest() {
  console.log('🚀 Démarrage du test complet...\n');
  
  checkConfiguration();
  
  const packChangeResult = await testPackChange();
  const paymentResult = packChangeResult ? await testPaymentSimulation() : false;
  
  console.log('\n=== RÉSULTATS FINAUX ===');
  console.log(`Changement de pack: ${packChangeResult ? '✅ OK' : '❌ ÉCHEC'}`);
  console.log(`Simulation paiement: ${paymentResult ? '✅ OK' : '❌ ÉCHEC'}`);
  
  if (packChangeResult && paymentResult) {
    console.log('\n🎉 TOUS LES TESTS PASSENT!');
    console.log('✅ Le changement de pack fonctionne correctement.');
    console.log('✅ Les redirections pointent vers localhost:3001.');
    console.log('✅ Vous pouvez maintenant tester un vrai changement de pack.');
  } else {
    console.log('\n⚠️ CERTAINS TESTS ÉCHOUENT');
    console.log('\n💡 Actions recommandées par ordre de priorité:');
    
    if (!packChangeResult) {
      console.log('🔧 PRIORITÉ 1 - Démarrer Supabase:');
      console.log('   1. Ouvrir Docker Desktop manuellement');
      console.log('   2. Attendre que Docker soit prêt (icône verte)');
      console.log('   3. Exécuter: npx supabase start');
      console.log('   4. Relancer ce test');
    }
    
    if (packChangeResult && !paymentResult) {
      console.log('🔧 PRIORITÉ 2 - Vérifier les Edge Functions:');
      console.log('   1. Vérifier les logs: npx supabase logs');
      console.log('   2. Redéployer les fonctions: npx supabase functions deploy');
    }
  }
  
  return packChangeResult && paymentResult;
}

// Exécuter le test
runCompleteTest().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Erreur fatale:', error);
  process.exit(1);
});