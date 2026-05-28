#!/usr/bin/env node

/**
 * Script pour tester l'isolation localStorage entre utilisateurs
 * Ce script simule plusieurs utilisateurs et vérifie l'isolation
 */

console.log('🔍 Test d\'isolation localStorage pour Mini-Boutique\n');

// Simuler différents utilisateurs
const users = [
  { id: 'user-123', email: 'test1@example.com', name: 'Utilisateur 1' },
  { id: 'user-456', email: 'test2@example.com', name: 'Utilisateur 2' },
  { id: 'user-789', email: 'test3@example.com', name: 'Utilisateur 3' }
];

// Fonction pour simuler un utilisateur
function simulateUser(user) {
  console.log(`\n👤 Simulation de ${user.name} (ID: ${user.id})`);
  
  // Clés localStorage utilisées par Mini-Boutique
  const miniShopKey = `miniShopProducts_${user.id}`;
  const danKey = `dan-products-${user.id}`;
  const offlineShopKey = `offline_shop_${user.id}`;
  
  console.log(`   Clé Mini-Boutique: ${miniShopKey}`);
  console.log(`   Clé DAN: ${danKey}`);
  console.log(`   Clé Offline Shop: ${offlineShopKey}`);
  
  // Vérifier s'il y a des clés GLOBALES (problématiques)
  const globalKeys = [
    'miniShopProducts_demo-user-123',
    'dan-products',
    'offline_shop',
    'miniShopProducts_demo-user-12345678',
    'dan-products-default'
  ];
  
  globalKeys.forEach(key => {
    console.log(`   ⚠️  Clé globale potentielle: ${key}`);
  });
}

console.log('📋 Vérification des clés localStorage par utilisateur:');

users.forEach(simulateUser);

console.log('\n🔍 Résumé des problèmes potentiels:');
console.log('1. Clés sans ID utilisateur => PARTAGE entre tous');
console.log('2. Clés avec ID fixe (demo-user-123) => PARTAGE');
console.log('3. Clés avec ID unique => ISOLATION correcte');

console.log('\n💡 Pour vérifier dans votre navigateur:');
console.log('- Ouvrez la console (F12)');
console.log('- Tapez: Object.keys(localStorage)');
console.log('- Recherchez des clés sans ID utilisateur');

console.log('\n🧪 Test de séparation:');
console.log('1. Créer un produit avec Utilisateur 1');
console.log('2. Vérifier que Utilisateur 2 ne le voit PAS');
console.log('3. Si Utilisateur 2 le voit => PROBLÈME de partage');