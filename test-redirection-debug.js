/**
 * Test pour déboguer le problème de redirection vers 3001
 * Ce script va tester la création d'une session de paiement
 * et afficher les URLs générées
 */

const SUPABASE_URL = 'http://localhost:54321';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

console.log('🔍 === DEBUG REDIRECTION APRÈS PAIEMENT ===');
console.log('Objectif: Identifier pourquoi la redirection va vers 3001 au lieu de 3002\n');

// Simuler une requête avec différents headers Origin
async function testWithDifferentOrigins() {
  const testOrigins = [
    'http://localhost:3001',
    'http://localhost:3001', // Pour voir si c'est le navigateur qui envoie ça
    'http://localhost:3003',
    null // Pas d'origin
  ];
  
  console.log('📋 Test avec différents headers Origin:');
  
  for (const origin of testOrigins) {
    console.log(`\n🧪 Test avec Origin: ${origin || 'null'}`);
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    };
    
    if (origin) {
      headers['Origin'] = origin;
    }
    
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/create-checkout-session`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          packId: 'pack-premium',
          priceId: 'price_test'
        })
      });
      
      const result = await response.json();
      
      if (response.ok && result.checkoutUrl) {
        console.log('✅ Session créée avec succès');
        
        // Extraire les URLs de redirection de l'URL Stripe
        const url = new URL(result.checkoutUrl);
        const successUrl = url.searchParams.get('success_url');
        const cancelUrl = url.searchParams.get('cancel_url');
        
        console.log('📍 URLs de redirection détectées:');
        console.log(`   Success: ${successUrl}`);
        console.log(`   Cancel: ${cancelUrl}`);
        
        // Vérifier les ports
        if (successUrl) {
          if (successUrl.includes(':3001')) {
            console.log('❌ PROBLÈME: Success URL pointe vers 3001!');
          } else if (successUrl.includes(':3001')) {
            console.log('✅ OK: Success URL pointe vers 3002');
          } else {
            console.log('⚠️ Success URL pointe vers un autre port');
          }
        }
        
        if (cancelUrl) {
          if (cancelUrl.includes(':3001')) {
            console.log('❌ PROBLÈME: Cancel URL pointe vers 3001!');
          } else if (cancelUrl.includes(':3001')) {
            console.log('✅ OK: Cancel URL pointe vers 3002');
          } else {
            console.log('⚠️ Cancel URL pointe vers un autre port');
          }
        }
        
      } else {
        console.log(`❌ Erreur: ${response.status}`);
        console.log(`   Message: ${result.error || 'Erreur inconnue'}`);
      }
      
    } catch (error) {
      console.log(`❌ Erreur de connexion: ${error.message}`);
    }
  }
}

// Vérifier les variables d'environnement Supabase
async function checkSupabaseEnv() {
  console.log('\n🔧 === VÉRIFICATION VARIABLES D\'ENVIRONNEMENT ===');
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Origin': 'http://localhost:3001'
      },
      body: JSON.stringify({
        packId: 'debug-env-check',
        debug: true
      })
    });
    
    const result = await response.json();
    console.log('📊 Réponse de l\'Edge Function:', result);
    
  } catch (error) {
    console.log(`❌ Erreur: ${error.message}`);
  }
}

// Instructions pour debug manuel
function showDebugInstructions() {
  console.log('\n📋 === INSTRUCTIONS DEBUG MANUEL ===');
  console.log('1. Ouvrir les DevTools du navigateur (F12)');
  console.log('2. Aller dans l\'onglet Network');
  console.log('3. Sur localhost:3001, essayer de changer de pack');
  console.log('4. Chercher la requête vers create-checkout-session');
  console.log('5. Vérifier les headers de la requête (surtout Origin)');
  console.log('6. Vérifier la réponse et l\'URL Stripe générée');
  console.log('7. Cliquer sur l\'URL Stripe et vérifier les paramètres success_url et cancel_url');
  
  console.log('\n🎯 === POINTS À VÉRIFIER ===');
  console.log('• Le header Origin de la requête');
  console.log('• La variable FRONTEND_URL dans l\'Edge Function');
  console.log('• Les paramètres success_url et cancel_url dans l\'URL Stripe');
  console.log('• Le cache du navigateur (essayer en navigation privée)');
}

// Exécution des tests
async function runAllTests() {
  console.log('🚀 Démarrage du debug de redirection...\n');
  
  await testWithDifferentOrigins();
  await checkSupabaseEnv();
  showDebugInstructions();
  
  console.log('\n🏁 === CONCLUSION ===');
  console.log('Si les URLs générées pointent vers 3002 mais que le navigateur va vers 3001:');
  console.log('• Vider le cache du navigateur');
  console.log('• Essayer en navigation privée');
  console.log('• Vérifier s\'il n\'y a pas de redirection côté client');
  console.log('• Vérifier les sessions Stripe actives');
}

runAllTests().catch(console.error);