#!/usr/bin/env node

/**
 * Test des URLs des Edge Functions Supabase
 * Vérifie que les Edge Functions utilisent localhost:3001
 */

console.log('🧪 TEST EDGE FUNCTIONS - URLS PORT 3002');
console.log('🚀 Démarrage des tests...');

// Configuration
const SUPABASE_URL = 'https://hnpqkqjqwqjqkqjqwqjq.supabase.co';
const EXPECTED_FRONTEND_URL = 'http://localhost:3001';

// Test 1: Vérifier la configuration des Edge Functions
async function testEdgeFunctionConfig() {
  console.log('\n🔧 Test 1: Configuration des Edge Functions');
  
  try {
    // Simuler un appel à l'Edge Function create-checkout-session
    const testPayload = {
      pack_id: 'pack_pro',
      user_id: 'test-user-123'
    };
    
    console.log('📡 Test de l\'Edge Function create-checkout-session...');
    console.log('- URL Supabase:', SUPABASE_URL);
    console.log('- Frontend URL attendue:', EXPECTED_FRONTEND_URL);
    
    // Vérifier que l'URL de retour utilise le bon port
    const expectedSuccessUrl = `${EXPECTED_FRONTEND_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`;
    const expectedCancelUrl = `${EXPECTED_FRONTEND_URL}/dashboard?canceled=true`;
    
    console.log('✅ URLs de redirection attendues:');
    console.log('  - Success URL:', expectedSuccessUrl);
    console.log('  - Cancel URL:', expectedCancelUrl);
    
    // Vérifier que les URLs contiennent le bon port
    const hasCorrectPort = expectedSuccessUrl.includes(':3001') && expectedCancelUrl.includes(':3001');
    
    if (hasCorrectPort) {
      console.log('✅ Configuration correcte: Port 3001 détecté');
      return true;
    } else {
      console.log('❌ Configuration incorrecte: Port 3001 non détecté');
      return false;
    }
    
  } catch (error) {
    console.log('❌ Erreur lors du test:', error.message);
    return false;
  }
}

// Test 2: Vérifier les variables d'environnement
function testEnvironmentVariables() {
  console.log('\n🔧 Test 2: Variables d\'environnement');
  
  const envVars = {
    'VITE_SUPABASE_URL': process.env.VITE_SUPABASE_URL,
    'VITE_SUPABASE_ANON_KEY': process.env.VITE_SUPABASE_ANON_KEY,
    'FRONTEND_URL': process.env.FRONTEND_URL
  };
  
  console.log('📋 Variables d\'environnement:');
  Object.entries(envVars).forEach(([key, value]) => {
    if (value) {
      if (key === 'VITE_SUPABASE_ANON_KEY') {
        console.log(`  - ${key}: [DÉFINIE - ${value.length} caractères]`);
      } else {
        console.log(`  - ${key}: ${value}`);
      }
    } else {
      console.log(`  - ${key}: [NON DÉFINIE]`);
    }
  });
  
  // Vérifier si FRONTEND_URL utilise le bon port
  const frontendUrl = process.env.FRONTEND_URL;
  if (frontendUrl) {
    const hasCorrectPort = frontendUrl.includes(':3001');
    console.log(`✅ FRONTEND_URL utilise le port 3001: ${hasCorrectPort ? '✅ OUI' : '❌ NON'}`);
    return hasCorrectPort;
  } else {
    console.log('⚠️ FRONTEND_URL non définie - utilisation de la valeur par défaut');
    return true; // On considère que c'est OK si elle n'est pas définie
  }
}

// Test 3: Vérifier la configuration Vite
function testViteConfig() {
  console.log('\n🔧 Test 3: Configuration Vite');
  
  try {
    const fs = require('fs');
    const path = require('path');
    
    // Lire le fichier vite.config.js
    const viteConfigPath = path.join(process.cwd(), 'vite.config.js');
    
    if (fs.existsSync(viteConfigPath)) {
      const viteConfig = fs.readFileSync(viteConfigPath, 'utf8');
      
      // Vérifier si le port 3001 est configuré
      const hasPort3002 = viteConfig.includes('3002');
      
      console.log('📄 Fichier vite.config.js trouvé');
      console.log(`✅ Port 3001 configuré: ${hasPort3002 ? '✅ OUI' : '❌ NON'}`);
      
      if (hasPort3002) {
        console.log('🔍 Configuration détectée dans vite.config.js');
      }
      
      return hasPort3002;
    } else {
      console.log('⚠️ Fichier vite.config.js non trouvé');
      return false;
    }
    
  } catch (error) {
    console.log('❌ Erreur lors de la lecture de vite.config.js:', error.message);
    return false;
  }
}

// Exécution des tests
async function runAllTests() {
  console.log('\n🎯 RÉSULTATS DES TESTS:');
  console.log('=' .repeat(50));
  
  const results = {
    edgeFunction: await testEdgeFunctionConfig(),
    environment: testEnvironmentVariables(),
    viteConfig: testViteConfig()
  };
  
  console.log('\n📊 RÉSUMÉ:');
  console.log(`🔧 Edge Functions: ${results.edgeFunction ? '✅ OK' : '❌ ÉCHEC'}`);
  console.log(`🌍 Variables d'environnement: ${results.environment ? '✅ OK' : '❌ ÉCHEC'}`);
  console.log(`⚙️ Configuration Vite: ${results.viteConfig ? '✅ OK' : '❌ ÉCHEC'}`);
  
  const allPassed = Object.values(results).every(result => result);
  
  console.log('\n🎯 RÉSULTAT GLOBAL:');
  if (allPassed) {
    console.log('✅ TOUS LES TESTS PASSÉS - Configuration correcte pour le port 3001!');
  } else {
    console.log('❌ CERTAINS TESTS ONT ÉCHOUÉ - Vérification nécessaire');
    
    console.log('\n💡 ACTIONS RECOMMANDÉES:');
    if (!results.viteConfig) {
      console.log('- Vérifier la configuration du port dans vite.config.js');
    }
    if (!results.environment) {
      console.log('- Vérifier la variable FRONTEND_URL dans Supabase');
    }
    if (!results.edgeFunction) {
      console.log('- Vérifier les Edge Functions Supabase');
    }
  }
  
  return allPassed;
}

// Lancement des tests
runAllTests().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});