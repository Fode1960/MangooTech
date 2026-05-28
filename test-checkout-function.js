// Test de la fonction de test checkout
const testCheckoutFunction = async () => {
  try {
    console.log('🧪 Test de la fonction test-checkout...');
    
    const response = await fetch('http://localhost:54321/functions/v1/test-checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
      },
      body: JSON.stringify({
        packId: 'test-pack-123'
      })
    });
    
    console.log('📊 Status:', response.status);
    
    const responseText = await response.text();
    console.log('📄 Response:', responseText);
    
    if (response.ok) {
      const data = JSON.parse(responseText);
      console.log('\n✅ Résultats:');
      console.log('🌐 Frontend URL:', data.frontendUrl);
      console.log('✅ Success URL:', data.successUrl);
      console.log('❌ Cancel URL:', data.cancelUrl);
      console.log('🧪 Test URL:', data.testUrl);
      
      // Vérifier si les URLs contiennent le bon port
      if (data.successUrl && data.successUrl.includes('3002')) {
        console.log('\n🎉 SUCCESS: Les URLs utilisent bien le port 3001!');
      } else {
        console.log('\n⚠️  WARNING: Les URLs n\'utilisent pas le port 3001');
      }
    } else {
      console.log('❌ Erreur:', responseText);
    }
    
  } catch (error) {
    console.error('💥 Erreur de test:', error.message);
  }
};

testCheckoutFunction();