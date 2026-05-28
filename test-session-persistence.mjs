// Test simple de persistance de session pendant le paiement
console.log('🧪 Test de persistance de session...');

// Simuler une session utilisateur
const mockUser = {
  id: 'test-user-123',
  email: 'test@example.com',
  role: 'client',
  name: 'Test User'
};

// Test 1: Sauvegarde de session
console.log('1️⃣ Test de sauvegarde de session...');
localStorage.setItem('user', JSON.stringify(mockUser));
localStorage.setItem('token', 'test-token-123');
localStorage.setItem('currentRole', 'client');

console.log('✅ Session sauvegardée');

// Test 2: Récupération de session
console.log('2️⃣ Test de récupération de session...');
const savedUser = localStorage.getItem('user');
const savedToken = localStorage.getItem('token');

if (savedUser && savedToken) {
  const userData = JSON.parse(savedUser);
  console.log('✅ Session récupérée:', userData.email);
} else {
  console.log('❌ Session non trouvée');
}

// Test 3: Simulation de perte de session
console.log('3️⃣ Test de reconstitution après perte...');
const currentUser = null; // Simuler une perte de session
const restoredUser = currentUser || JSON.parse(localStorage.getItem('user') || 'null');

if (restoredUser) {
  console.log('✅ Session reconstituée avec succès:', restoredUser.email);
} else {
  console.log('❌ Impossible de reconstituer la session');
}

// Test 4: Gestion du panier pendant le paiement
console.log('4️⃣ Test de persistance du panier...');
const mockCart = [
  { id: 1, name: 'Produit Test', price: '10000', quantity: 2 }
];

localStorage.setItem('pendingCart', JSON.stringify(mockCart));
const savedCart = localStorage.getItem('pendingCart');

if (savedCart) {
  const cartData = JSON.parse(savedCart);
  console.log('✅ Panier sauvegardé:', cartData.length, 'articles');
} else {
  console.log('❌ Panier non sauvegardé');
}

// Nettoyage
localStorage.removeItem('user');
localStorage.removeItem('token');
localStorage.removeItem('currentRole');
localStorage.removeItem('pendingCart');

console.log('🎉 Tests terminés !');