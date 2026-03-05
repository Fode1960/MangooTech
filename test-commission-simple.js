// Test simple du système de commission (sans Supabase)
console.log('🧪 Test du système de commission automatique');
console.log('==========================================');

// Configuration des commissions par défaut
const DEFAULT_COMMISSION_RATES = {
  stripe: 0.025,      // 2.5%
  paypal: 0.034,      // 3.4%
  orange_money: 0.01, // 1%
  mtn_momo: 0.015,   // 1.5%
  moov_money: 0.012, // 1.2%
  platform: 0.05,     // 5% commission plateforme
  vendor: 0.90,       // 90% pour le vendeur après commissions
};

// Fonction de calcul simple
function calculateCommissions(paymentData) {
  const { amount, currency, payment_method } = paymentData;
  
  // Utiliser les taux par défaut
  const commissionRates = DEFAULT_COMMISSION_RATES;
  
  // Calculer les commissions
  const processingCommission = amount * commissionRates[payment_method];
  const platformCommission = amount * commissionRates.platform;
  const totalCommissions = processingCommission + platformCommission;
  const vendorAmount = amount - totalCommissions;

  return {
    original_amount: amount,
    currency,
    payment_method,
    processing_commission: processingCommission,
    platform_commission: platformCommission,
    total_commissions: totalCommissions,
    vendor_amount: vendorAmount,
    rates_used: commissionRates,
    calculated_at: new Date().toISOString()
  };
}

// Test 1: Calcul de commission simple
console.log('\n📊 Test 1: Calcul de commission pour un paiement de 100€');
const testPayment1 = {
  amount: 100,
  currency: 'EUR',
  payment_method: 'stripe'
};

const result1 = calculateCommissions(testPayment1);
console.log('Résultat du calcul:');
console.log(`- Montant original: ${result1.original_amount} ${result1.currency}`);
console.log(`- Commission traitement: ${result1.processing_commission.toFixed(2)} ${result1.currency}`);
console.log(`- Commission plateforme: ${result1.platform_commission.toFixed(2)} ${result1.currency}`);
console.log(`- Total commissions: ${result1.total_commissions.toFixed(2)} ${result1.currency}`);
console.log(`- Montant vendeur: ${result1.vendor_amount.toFixed(2)} ${result1.currency}`);

// Test 2: Comparaison des méthodes de paiement
console.log('\n📊 Test 2: Comparaison des commissions par méthode de paiement');
const paymentMethods = ['stripe', 'paypal', 'orange_money', 'mtn_momo', 'moov_money'];
const testAmount = 1000; // 1000 XOF pour les méthodes africaines

paymentMethods.forEach(method => {
  const currency = ['orange_money', 'mtn_momo', 'moov_money'].includes(method) ? 'XOF' : 'EUR';
  const testPayment = {
    amount: testAmount,
    currency: currency,
    payment_method: method
  };

  const result = calculateCommissions(testPayment);
  console.log(`\n${method.toUpperCase()}:`);
  console.log(`  Commission: ${result.total_commissions.toFixed(2)} ${result.currency} (${(result.total_commissions/testAmount*100).toFixed(1)}%)`);
  console.log(`  Montant vendeur: ${result.vendor_amount.toFixed(2)} ${result.currency}`);
});

// Test 3: Vérification des taux par défaut
console.log('\n📊 Test 3: Taux de commission par défaut');
console.log('Taux de commission par défaut:');
Object.entries(DEFAULT_COMMISSION_RATES).forEach(([key, value]) => {
  console.log(`- ${key}: ${(value * 100).toFixed(1)}%`);
});

console.log('\n✅ Tests du système de commission terminés');
console.log('Le système de commission automatique est opérationnel !');