const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const supabaseUrl = 'https://ptrqhtwstldphjaraufi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0cnFodHdzdGxkcGhqYXJhdWZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MzI0OTIsImV4cCI6MjA3MDUwODQ5Mn0.Wc-dKWVMpAyFoAPFGejzhD0o1rodyEGrBlZK5X3muyA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSmartPackChange() {
  console.log('🧪 Test de la fonction smart-pack-change\n');
  
  try {
    // D'abord, authentifier l'utilisateur
    console.log('1. Authentification...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'mdansoko@mangoo.tech',
      password: 'Mangoo2024!' // Remplacez par le vrai mot de passe
    });
    
    if (authError) {
      console.error('❌ Erreur d\'authentification:', authError.message);
      return;
    }
    
    console.log('✅ Utilisateur authentifié:', authData.user.email);
    
    // Ensuite, tester la fonction
    console.log('\n2. Test de smart-pack-change...');
    const { data, error } = await supabase.functions.invoke('smart-pack-change', {
      body: {
        newPackId: 2, // Pack Premium
        successUrl: 'http://localhost:5173/dashboard?success=true&pack=2',
        cancelUrl: 'http://localhost:5173/dashboard?canceled=true'
      }
    });
    
    console.log('\n📊 Résultat de l\'appel:');
    console.log('- Data:', JSON.stringify(data, null, 2));
    console.log('- Error:', error);
    
    if (error) {
      console.error('❌ Erreur de la fonction:', error.message);
    } else {
      console.log('✅ Fonction appelée avec succès');
      
      if (data?.requiresPayment === false) {
        console.log('🎯 Migration directe (pas de paiement requis)');
      } else if (data?.requiresPayment === true && data?.checkoutUrl) {
        console.log('💳 Paiement requis, URL Stripe:', data.checkoutUrl);
      } else {
        console.log('⚠️ Réponse inattendue:', data);
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Fonction pour tester sans authentification (pour voir l'erreur)
async function testWithoutAuth() {
  console.log('\n🔍 Test sans authentification...');
  
  try {
    const { data, error } = await supabase.functions.invoke('smart-pack-change', {
      body: {
        newPackId: 2,
        successUrl: 'http://localhost:5173/dashboard?success=true&pack=2',
        cancelUrl: 'http://localhost:5173/dashboard?canceled=true'
      }
    });
    
    console.log('- Data:', JSON.stringify(data, null, 2));
    console.log('- Error:', error);
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

// Exécuter les tests
async function runTests() {
  await testWithoutAuth();
  await testSmartPackChange();
}

runTests().catch(console.error);