// Test pour vérifier si la correction de FRONTEND_URL fonctionne
console.log('🔍 Test de la correction FRONTEND_URL');

// Simuler un appel à l'Edge Function pour vérifier l'URL générée
async function testFrontendUrlFix() {
  try {
    console.log('\n=== TEST FRONTEND_URL CORRECTION ===');
    
    // Test 1: Vérifier que le serveur local fonctionne sur 3002
    console.log('\n1. Test du serveur local sur port 3001...');
    const localResponse = await fetch('http://localhost:3001/');
    console.log(`✅ Serveur local accessible: ${localResponse.ok}`);
    
    // Test 2: Simuler un appel à create-checkout-session
    console.log('\n2. Test de create-checkout-session...');
    const checkoutResponse = await fetch('http://localhost:54321/functions/v1/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
      },
      body: JSON.stringify({
        packId: 'test-pack-id',
        successUrl: 'http://localhost:3001/dashboard?payment=success',
        cancelUrl: 'http://localhost:3001/dashboard?payment=cancelled'
      })
    });
    
    if (checkoutResponse.ok) {
      const result = await checkoutResponse.json();
      console.log('✅ Edge Function accessible');
      console.log('URL de succès générée:', result.successUrl || 'Non disponible');
    } else {
      console.log('❌ Edge Function non accessible:', checkoutResponse.status);
      const errorText = await checkoutResponse.text();
      console.log('Erreur:', errorText);
    }
    
    console.log('\n=== RÉSULTAT ===');
    console.log('Si vous voyez encore localhost:3001 dans le navigateur,');
    console.log('cela signifie que Supabase doit être redémarré pour');
    console.log('prendre en compte la nouvelle variable FRONTEND_URL.');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
    console.log('\n💡 Solutions possibles:');
    console.log('1. Redémarrer Docker Desktop');
    console.log('2. Redémarrer Supabase avec: npx supabase stop && npx supabase start');
    console.log('3. Vérifier que le fichier supabase/.env contient FRONTEND_URL=http://localhost:3001');
  }
}

// Exécuter le test
testFrontendUrlFix();