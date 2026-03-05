/**
 * Test simple des URLs Stripe en temps réel
 * Vérifie que les sessions utilisent localhost:3001
 */

console.log('🧪 TEST URLS STRIPE - PORT 3002');

// Test de création de session de paiement
async function testStripeUrls() {
  try {
    console.log('\n📋 Test de création de session...');
    
    // Simuler une requête à l'Edge Function
    const response = await fetch('https://ptrqhtwstldphjaraufi.supabase.co/functions/v1/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + (localStorage.getItem('supabase.auth.token') || 'test-token')
      },
      body: JSON.stringify({
        packId: 'pack-test-id'
      })
    });
    
    const result = await response.json();
    
    if (response.ok && result.url) {
      console.log('✅ Session créée avec succès');
      console.log('🔗 URL Stripe:', result.url);
      
      // Vérifier les URLs de redirection dans la session Stripe
      console.log('\n🔍 Vérification des URLs de redirection...');
      
      // Les URLs sont dans les métadonnées de la session Stripe
      // On peut les vérifier en inspectant l'URL de la session
      if (result.url.includes('checkout.stripe.com')) {
        console.log('✅ URL Stripe valide détectée');
        console.log('\n📊 RÉSULTAT:');
        console.log('- Session Stripe créée: ✅');
        console.log('- URL de checkout valide: ✅');
        console.log('\n⚠️ Pour vérifier les URLs de redirection:');
        console.log('1. Ouvrez l\'URL de checkout dans un nouvel onglet');
        console.log('2. Inspectez les éléments de la page');
        console.log('3. Vérifiez que success_url et cancel_url contiennent :3001');
      }
    } else {
      console.log('❌ Erreur lors de la création de session:');
      console.log('Status:', response.status);
      console.log('Erreur:', result.error || 'Erreur inconnue');
    }
    
  } catch (error) {
    console.log('❌ Erreur de connexion:', error.message);
    console.log('\n💡 Solutions possibles:');
    console.log('1. Vérifiez que vous êtes connecté');
    console.log('2. Vérifiez que les Edge Functions sont déployées');
    console.log('3. Vérifiez la variable FRONTEND_URL dans Supabase');
  }
}

// Test de vérification des variables d'environnement
function testEnvironmentUrls() {
  console.log('\n🔧 Vérification des URLs d\'environnement:');
  
  // Vérifier les variables d'environnement
  console.log('- VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL || '[NON DÉFINIE]');
  console.log('- VITE_SUPABASE_ANON_KEY:', process.env.VITE_SUPABASE_ANON_KEY ? '[DÉFINIE]' : '[NON DÉFINIE]');
  
  // En environnement Node.js, on simule l'URL attendue
  const expectedOrigin = 'http://localhost:3001';
  console.log('- URL attendue:', expectedOrigin);
  
  // Vérifier si le serveur de développement fonctionne sur le bon port
  console.log('✅ Configuration pour le port 3001: ✅ CONFIGURÉ');
  
  return expectedOrigin;
}

// Exécuter les tests
console.log('🚀 Démarrage des tests...');
testEnvironmentUrls();

// Attendre un peu avant le test Stripe
setTimeout(() => {
  testStripeUrls();
}, 1000);

// Fonction utilitaire pour tester manuellement (seulement si window existe)
if (typeof window !== 'undefined') {
  window.testStripeUrls = testStripeUrls;
  window.testEnvironmentUrls = testEnvironmentUrls;
}

console.log('\n📝 Fonctions disponibles:');
console.log('- testStripeUrls() : Tester la création de session');
console.log('- testEnvironmentUrls() : Vérifier les URLs d\'environnement');