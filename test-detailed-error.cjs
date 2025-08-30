const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ptrqhtwstldphjaraufi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0cnFodHdzdGxkcGhqYXJhdWZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MzI0OTIsImV4cCI6MjA3MDUwODQ5Mn0.Wc-dKWVMpAyFoAPFGejzhD0o1rodyEGrBlZK5X3muyA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDetailedError() {
  console.log('🔍 Test détaillé des erreurs smart-pack-change\n');
  
  try {
    // 1. Créer un utilisateur de test
    const testEmail = `test-detailed-${Date.now()}@example.com`;
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
    
    // 3. Tester directement handle-subscription-change
    console.log('\n🧪 Test direct handle-subscription-change...');
    
    const packId = '209a0b0e-7888-41a3-9cd1-45907705261a'; // Pack Visibilité
    
    const response = await fetch(`${supabaseUrl}/functions/v1/handle-subscription-change`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        newPackId: packId,
        prorationBehavior: 'create_prorations'
      })
    });
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Succès handle-subscription-change:', JSON.stringify(data, null, 2));
    } else {
      const errorText = await response.text();
      console.log('❌ Erreur handle-subscription-change:', errorText);
      
      // Essayer de parser l'erreur JSON
      try {
        const errorData = JSON.parse(errorText);
        console.log('📋 Détails de l\'erreur:', JSON.stringify(errorData, null, 2));
      } catch (e) {
        console.log('📋 Erreur brute (non-JSON):', errorText);
      }
    }
    
    // 4. Vérifier l'état de l'utilisateur dans la base
    console.log('\n🔍 Vérification de l\'état utilisateur...');
    
    const { data: userPacks, error: userPacksError } = await supabase
      .from('user_packs')
      .select(`
        *,
        packs(*)
      `)
      .eq('user_id', signInData.user.id)
      .eq('status', 'active');
    
    if (userPacksError) {
      console.log('❌ Erreur récupération user_packs:', userPacksError);
    } else {
      console.log('📊 Packs utilisateur:', userPacks);
    }
    
    // 5. Vérifier que le pack cible existe
    const { data: targetPack, error: targetPackError } = await supabase
      .from('packs')
      .select('*')
      .eq('id', packId)
      .single();
    
    if (targetPackError) {
      console.log('❌ Erreur récupération pack cible:', targetPackError);
    } else {
      console.log('📦 Pack cible:', targetPack);
    }
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

testDetailedError().catch(console.error);