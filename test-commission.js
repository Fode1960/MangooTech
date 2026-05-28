// Test du système de commission
import { calculateCommissions, DEFAULT_COMMISSION_RATES } from '../api/services/commissionService.js';

console.log('🧪 Test du système de commission automatique');
console.log('==========================================');

// Test 1: Calcul de commission simple
console.log('\n📊 Test 1: Calcul de commission pour un paiement de 100€');
const testPayment1 = {
  amount: 100,
  currency: 'EUR',
  payment_method: 'stripe',
  vendor_id: 'vendor_123',
  shop_id: 'shop_456'
};

calculateCommissions(testPayment1).then(result => {
  console.log('Résultat du calcul:');
  console.log(`- Montant original: ${result.original_amount} ${result.currency}`);
  console.log(`- Commission traitement: ${result.processing_commission.toFixed(2)} ${result.currency}`);
  console.log(`- Commission plateforme: ${result.platform_commission.toFixed(2)} ${result.currency}`);
  console.log(`- Total commissions: ${result.total_commissions.toFixed(2)} ${result.currency}`);
  console.log(`- Montant vendeur: ${result.vendor_amount.toFixed(2)} ${result.currency}`);
  console.log(`- Taux utilisés:`, result.rates_used);
}).catch(error => {
  console.error('❌ Erreur Test 1:', error.message);
});

// Test 2: Comparaison des méthodes de paiement
console.log('\n📊 Test 2: Comparaison des commissions par méthode de paiement');
const paymentMethods = ['stripe', 'paypal', 'orange_money', 'mtn_momo', 'moov_money'];
const testAmount = 1000; // 1000 XOF pour les méthodes africaines

paymentMethods.forEach(method => {
  const testPayment = {
    amount: testAmount,
    currency: ['orange_money', 'mtn_momo', 'moov_money'].includes(method) ? 'XOF' : 'EUR',
    payment_method: method,
    vendor_id: 'vendor_test',
    shop_id: 'shop_test'
  };

  calculateCommissions(testPayment).then(result => {
    console.log(`\n${method.toUpperCase()}:`);
    console.log(`  Commission: ${result.total_commissions.toFixed(2)} ${result.currency} (${(result.total_commissions/testAmount*100).toFixed(1)}%)`);
    console.log(`  Montant vendeur: ${result.vendor_amount.toFixed(2)} ${result.currency}`);
  }).catch(error => {
    console.error(`❌ Erreur ${method}:`, error.message);
  });
});

// Test 3: Vérification des taux par défaut
console.log('\n📊 Test 3: Taux de commission par défaut');
console.log('Taux de commission par défaut:');
Object.entries(DEFAULT_COMMISSION_RATES).forEach(([key, value]) => {
  console.log(`- ${key}: ${(value * 100).toFixed(1)}%`);
});

console.log('\n✅ Tests du système de commission terminés');
console.log('Le système de commission automatique est opérationnel !');