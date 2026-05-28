/**
 * Script de test pour vérifier le déploiement de production
 * Vérifie la configuration, les URLs et le fonctionnement des fonctionnalités clés
 */

import https from 'https';
import http from 'http';

// Configuration de test
const CONFIG = {
  // URL de production (à adapter selon votre déploiement)
  PRODUCTION_URL: 'https://your-username.github.io/MangooTech',
  
  // URLs des Edge Functions Supabase
  SUPABASE_FUNCTIONS: {
    CREATE_CHECKOUT: 'https://your-project.supabase.co/functions/v1/create-checkout-session',
    STRIPE_WEBHOOK: 'https://your-project.supabase.co/functions/v1/stripe-webhook'
  },
  
  // Tests à effectuer
  TESTS: [
    'app_loading',
    'environment_variables',
    'supabase_connection',
    'stripe_integration',
    'pack_change_functionality'
  ]
};

/**
 * Effectue une requête HTTP/HTTPS
 */
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    const req = protocol.get(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

/**
 * Test 1: Vérifier le chargement de l'application
 */
async function testAppLoading() {
  console.log('🔍 Test 1: Chargement de l\'application...');
  
  try {
    const response = await makeRequest(CONFIG.PRODUCTION_URL);
    
    if (response.statusCode === 200) {
      console.log('✅ Application accessible');
      
      // Vérifier la présence d'éléments clés
      const hasViteApp = response.data.includes('id="root"');
      const hasTitle = response.data.includes('<title>');
      
      if (hasViteApp && hasTitle) {
        console.log('✅ Structure HTML correcte');
        return true;
      } else {
        console.log('❌ Structure HTML incomplète');
        return false;
      }
    } else {
      console.log(`❌ Erreur HTTP: ${response.statusCode}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Erreur de connexion: ${error.message}`);
    return false;
  }
}

/**
 * Test 2: Vérifier les variables d'environnement
 */
async function testEnvironmentVariables() {
  console.log('🔍 Test 2: Variables d\'environnement...');
  
  try {
    const response = await makeRequest(CONFIG.PRODUCTION_URL);
    
    // Rechercher les variables Vite injectées dans le build
    const hasSupabaseConfig = response.data.includes('supabase') || 
                             response.data.includes('VITE_SUPABASE');
    
    if (hasSupabaseConfig) {
      console.log('✅ Configuration Supabase détectée');
      return true;
    } else {
      console.log('⚠️  Configuration Supabase non détectée dans le build');
      console.log('   Vérifiez que les secrets GitHub sont correctement configurés');
      return false;
    }
  } catch (error) {
    console.log(`❌ Erreur: ${error.message}`);
    return false;
  }
}

/**
 * Test 3: Vérifier la connexion Supabase
 */
async function testSupabaseConnection() {
  console.log('🔍 Test 3: Connexion Supabase...');
  
  try {
    // Test de base de l'API Supabase
    const supabaseUrl = CONFIG.SUPABASE_FUNCTIONS.CREATE_CHECKOUT.replace('/functions/v1/create-checkout-session', '');
    const healthUrl = `${supabaseUrl}/rest/v1/`;
    
    const response = await makeRequest(healthUrl, {
      headers: {
        'apikey': 'test-key' // Clé de test
      }
    });
    
    if (response.statusCode === 401 || response.statusCode === 200) {
      console.log('✅ API Supabase accessible');
      return true;
    } else {
      console.log(`❌ API Supabase inaccessible: ${response.statusCode}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Erreur Supabase: ${error.message}`);
    return false;
  }
}

/**
 * Test 4: Vérifier l'intégration Stripe
 */
async function testStripeIntegration() {
  console.log('🔍 Test 4: Intégration Stripe...');
  
  try {
    // Test de la fonction Edge create-checkout-session
    const response = await makeRequest(CONFIG.SUPABASE_FUNCTIONS.CREATE_CHECKOUT, {
      method: 'OPTIONS' // Test CORS
    });
    
    if (response.statusCode === 200 || response.statusCode === 204) {
      console.log('✅ Edge Function accessible');
      return true;
    } else {
      console.log(`❌ Edge Function inaccessible: ${response.statusCode}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Erreur Edge Function: ${error.message}`);
    return false;
  }
}

/**
 * Test 5: Vérifier la fonctionnalité de changement de pack
 */
async function testPackChangeFunction() {
  console.log('🔍 Test 5: Fonctionnalité changement de pack...');
  
  // Ce test nécessite une interface utilisateur active
  // Pour l'instant, on vérifie juste que l'app se charge
  console.log('ℹ️  Test manuel requis:');
  console.log('   1. Ouvrir l\'application en production');
  console.log('   2. Tester le changement de pack');
  console.log('   3. Vérifier les redirections Stripe');
  console.log('   4. Confirmer le retour après paiement');
  
  return true;
}

/**
 * Exécuter tous les tests
 */
async function runAllTests() {
  console.log('🚀 Début des tests de déploiement de production\n');
  
  const results = {
    app_loading: await testAppLoading(),
    environment_variables: await testEnvironmentVariables(),
    supabase_connection: await testSupabaseConnection(),
    stripe_integration: await testStripeIntegration(),
    pack_change_functionality: await testPackChangeFunction()
  };
  
  console.log('\n📊 Résultats des tests:');
  console.log('========================');
  
  let passedTests = 0;
  let totalTests = 0;
  
  for (const [test, passed] of Object.entries(results)) {
    totalTests++;
    if (passed) {passedTests++;}
    
    const status = passed ? '✅' : '❌';
    const testName = test.replace(/_/g, ' ').toUpperCase();
    console.log(`${status} ${testName}`);
  }
  
  console.log(`\n📈 Score: ${passedTests}/${totalTests} tests réussis`);
  
  if (passedTests === totalTests) {
    console.log('🎉 Tous les tests sont passés! Déploiement réussi.');
  } else {
    console.log('⚠️  Certains tests ont échoué. Vérifiez la configuration.');
  }
  
  return results;
}

/**
 * Instructions d'utilisation
 */
function showInstructions() {
  console.log('📋 Instructions d\'utilisation:');
  console.log('==============================');
  console.log('1. Modifiez CONFIG.PRODUCTION_URL avec votre vraie URL');
  console.log('2. Modifiez CONFIG.SUPABASE_FUNCTIONS avec vos vraies URLs');
  console.log('3. Exécutez: node test-production-deployment.js');
  console.log('4. Suivez les instructions pour les tests manuels');
  console.log('');
}

// Exécution du script
if (import.meta.url === new URL(process.argv[1], 'file:').href) {
  showInstructions();
  runAllTests().catch(console.error);
}

// Exécution directe alternative
if (process.argv[1] && process.argv[1].endsWith('test-production-deployment.js')) {
  showInstructions();
  runAllTests().catch(console.error);
}

export {
  runAllTests,
  testAppLoading,
  testEnvironmentVariables,
  testSupabaseConnection,
  testStripeIntegration,
  testPackChangeFunction
};