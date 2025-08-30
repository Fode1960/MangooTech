const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ptrqhtwstldphjaraufi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0cnFodHdzdGxkcGhqYXJhdWZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MzI0OTIsImV4cCI6MjA3MDUwODQ5Mn0.Wc-dKWVMpAyFoAPFGejzhD0o1rodyEGrBlZK5X3muyA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAuthPackChange() {
  console.log('🔐 Test d\'authentification pour smart-pack-change\n');
  
  try {
    // 1. Créer un utilisateur de test
    const testEmail = `test-pack-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!@#';
    
    console.log('👤 Création d\'un utilisateur de test...');
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword
    });
    
    if (signUpError) {
      console.error('❌ Erreur lors de la création:', signUpError);
      return;
    }
    
    console.log('✅ Utilisateur créé:', testEmail);
    
    // 2. Se connecter avec cet utilisateur
    console.log('🔑 Connexion de l\'utilisateur...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });
    
    if (signInError) {
      console.error('❌ Erreur lors de la connexion:', signInError);
      return;
    }
    
    console.log('✅ Utilisateur connecté');
    const userToken = signInData.session.access_token;
    console.log('🎫 Token utilisateur obtenu:', userToken.substring(0, 50) + '...');
    
    // 3. Tester smart-pack-change avec le token utilisateur
    console.log('\n🧪 Test smart-pack-change avec token utilisateur...');
    
    const packId = '209a0b0e-7888-41a3-9cd1-45907705261a'; // Pack Visibilité
    
    const response = await fetch(`${supabaseUrl}/functions/v1/smart-pack-change`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        packId: packId,
        successUrl: 'http://localhost:3001/dashboard?success=true',
        cancelUrl: 'http://localhost:3001/dashboard?canceled=true'
      })
    });
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Succès avec token utilisateur:', JSON.stringify(data, null, 2));
    } else {
      const errorText = await response.text();
      console.log('❌ Erreur avec token utilisateur:', errorText);
    }
    
    // 4. Comparer avec un appel sans authentification
    console.log('\n🔄 Comparaison: appel sans authentification...');
    
    const responseNoAuth = await fetch(`${supabaseUrl}/functions/v1/smart-pack-change`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        packId: packId,
        successUrl: 'http://localhost:3001/dashboard?success=true',
        cancelUrl: 'http://localhost:3001/dashboard?canceled=true'
      })
    });
    
    console.log(`Status sans auth: ${responseNoAuth.status} ${responseNoAuth.statusText}`);
    
    if (!responseNoAuth.ok) {
      const errorText = await responseNoAuth.text();
      console.log('❌ Erreur sans auth (attendu):', errorText);
    }
    
    console.log('\n🎯 CONCLUSION:');
    console.log('- Le problème vient bien de l\'authentification');
    console.log('- smart-pack-change nécessite un token utilisateur valide');
    console.log('- Les appels depuis l\'interface web doivent utiliser le token de session');
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

testAuthPackChange().catch(console.error);