// Test des fonctionnalités du système de paiement
async function testPaymentFeatures() {
  console.log('🧪 Test des fonctionnalités de paiement MangooTech');
  console.log('==============================================');
  
  const baseUrl = 'http://localhost:3009/api';
  
  // Test 1: Vérifier la santé de l'API
  console.log('\n📊 Test 1: Santé de l\'API');
  try {
    const response = await fetch(`${baseUrl}/health`);
    const data = await response.json();
    console.log(`✅ API Santé: ${data.message}`);
  } catch (error) {
    console.log(`❌ API Santé: ${error.message}`);
  }
  
  // Test 2: Vérifier les frais de traitement
  console.log('\n📊 Test 2: Frais de traitement');
  try {
    const response = await fetch(`${baseUrl}/payments/processing-fees`);
    const data = await response.json();
    if (data.success) {
      console.log('✅ Frais de traitement disponibles:');
      Object.entries(data.fees).forEach(([method, fees]) => {
        console.log(`  - ${method}: ${fees.percentage}% + ${fees.fixed}${fees.currency}`);
      });
    }
  } catch (error) {
    console.log(`❌ Frais de traitement: ${error.message}`);
  }
  
  // Test 3: Tester le calcul de commission
  console.log('\n📊 Test 3: Calcul de commission');
  try {
    const response = await fetch(`${baseUrl}/commissions/calculate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: 100,
        currency: 'EUR',
        payment_method: 'stripe'
      })
    });
    const data = await response.json();
    if (data.success) {
      console.log('✅ Calcul commission:');
      console.log(`  - Montant original: ${data.data.original_amount} ${data.data.currency}`);
      console.log(`  - Commission totale: ${data.data.total_commissions} ${data.data.currency}`);
      console.log(`  - Montant vendeur: ${data.data.vendor_amount} ${data.data.currency}`);
    }
  } catch (error) {
    console.log(`❌ Calcul commission: ${error.message}`);
  }
  
  // Test 4: Vérifier les statistiques de commission
  console.log('\n📊 Test 4: Statistiques de commission');
  try {
    const response = await fetch(`${baseUrl}/commissions/stats`);
    const data = await response.json();
    if (data.success) {
      console.log('✅ Statistiques commission:');
      console.log(`  - Période: ${data.period.start} à ${data.period.end}`);
      console.log(`  - Total commissions: ${data.data.total_commissions}`);
      console.log(`  - Total vendeurs: ${data.data.total_vendor_amounts}`);
    }
  } catch (error) {
    console.log(`❌ Statistiques commission: ${error.message}`);
  }
  
  console.log('\n✅ Tests des fonctionnalités terminés');
  console.log('\n🎯 Accéder à l\'interface complète :');
  console.log('   http://localhost:3015/');
}

// Exécuter les tests
testPaymentFeatures().catch(console.error);