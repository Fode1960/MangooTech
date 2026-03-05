// Test simple de l'Edge Function
const testEdgeFunction = async () => {
  try {
    console.log('🧪 Test de l\'Edge Function...');
    
    const response = await fetch('http://localhost:54321/functions/v1/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
      },
      body: JSON.stringify({
        packId: 'test-pack-id',
        successUrl: 'http://localhost:3001/success',
        cancelUrl: 'http://localhost:3001/cancel'
      })
    });
    
    console.log('📊 Status:', response.status);
    console.log('📋 Headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('📄 Response:', responseText);
    
    if (response.ok) {
      const data = JSON.parse(responseText);
      console.log('✅ URL générée:', data.url);
    } else {
      console.log('❌ Erreur:', responseText);
    }
    
  } catch (error) {
    console.error('💥 Erreur de test:', error.message);
  }
};

testEdgeFunction();