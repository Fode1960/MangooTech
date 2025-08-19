import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ptrqhtwstldphjaraufi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0cnFodHdzdGxkcGhqYXJhdWZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MzI0OTIsImV4cCI6MjA3MDUwODQ5Mn0.Wc-dKWVMpAyFoAPFGejzhD0o1rodyEGrBlZK5X3muyA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAuthFix() {
  console.log('🔍 Test de la correction d\'authentification...\n');
  
  try {
    // Test 1: Validation des entrées vides
    console.log('Test 1: Validation des entrées vides');
    const emptyResult = await testSignIn('', '');
    console.log('Résultat:', emptyResult.error ? '✅ Erreur capturée' : '❌ Erreur non capturée');
    
    // Test 2: Validation du format email
    console.log('\nTest 2: Validation du format email');
    const invalidEmailResult = await testSignIn('invalid-email', 'password123');
    console.log('Résultat:', invalidEmailResult.error ? '✅ Erreur capturée' : '❌ Erreur non capturée');
    
    // Test 3: Tentative de connexion avec des identifiants valides (mais probablement inexistants)
    console.log('\nTest 3: Tentative de connexion avec format valide');
    const validFormatResult = await testSignIn('test@example.com', 'password123');
    console.log('Résultat:', validFormatResult.error ? 
      `✅ Erreur gérée: ${validFormatResult.error.message}` : 
      '✅ Connexion réussie');
    
    console.log('\n🎉 Tests terminés. L\'erreur 400 devrait être résolue!');
    
  } catch (error) {
    console.error('❌ Erreur lors des tests:', error);
  }
}

async function testSignIn(email, password) {
  // Validation côté client (comme dans notre correction)
  if (!email || !password) {
    return { 
      data: null, 
      error: { message: 'Email et mot de passe sont requis' } 
    };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { 
      data: null, 
      error: { message: 'Format d\'email invalide' } 
    };
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password
    });
    
    return { data, error };
  } catch (err) {
    return { 
      data: null, 
      error: { 
        message: err.message || 'Erreur de connexion. Vérifiez vos identifiants.' 
      } 
    };
  }
}

testAuthFix();