const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const supabaseUrl = 'https://ptrqhtwstldphjaraufi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0cnFodHdzdGxkcGhqYXJhdWZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MzI0OTIsImV4cCI6MjA3MDUwODQ5Mn0.Wc-dKWVMpAyFoAPFGejzhD0o1rodyEGrBlZK5X3muyA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAuthenticatedPackChange() {
  console.log('🔐 Test de changement de pack avec authentification\n');
  
  try {
    // 1. Essayer de s'authentifier avec différentes méthodes
    console.log('1. Tentative d\'authentification...');
    
    // Méthode 1: Vérifier s'il y a une session existante
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    console.log('Session existante:', sessionData.session ? 'Oui' : 'Non');
    
    if (sessionData.session) {
      console.log('✅ Session trouvée, utilisateur:', sessionData.session.user.email);
      
      // Tester avec la session existante
      await testPackChangeWithSession(sessionData.session.access_token);
    } else {
      console.log('❌ Aucune session trouvée');
      
      // Essayer de créer une session de test
      console.log('\n2. Création d\'une session de test...');
      
      // Récupérer l'utilisateur mdansoko@mangoo.tech depuis la base
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*')
        .eq('email', 'mdansoko@mangoo.tech')
        .single();
      
      if (usersError) {
        console.error('❌ Utilisateur non trouvé:', usersError.message);
        return;
      }
      
      console.log('✅ Utilisateur trouvé:', users.email);
      
      // Simuler un appel avec l'ID utilisateur
      await testPackChangeWithUserId(users.id);
    }
    
  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }
}

async function testPackChangeWithSession(accessToken) {
  console.log('\n🔑 Test avec token d\'accès...');
  
  try {
    // Récupérer les packs disponibles
    const { data: packs } = await supabase
      .from('packs')
      .select('*')
      .eq('is_active', true)
      .order('price', { ascending: true });
    
    if (packs && packs.length > 1) {
      const targetPack = packs[1]; // Pack Visibilité
      console.log(`Test avec pack: ${targetPack.name} (${targetPack.id})`);
      
      // Appel avec token d'authentification
      const response = await fetch(`${supabaseUrl}/functions/v1/smart-pack-change`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          packId: targetPack.id,
          successUrl: 'http://localhost:3001/dashboard?success=true&pack=' + targetPack.id,
          cancelUrl: 'http://localhost:3001/dashboard?canceled=true'
        })
      });
      
      console.log('Status:', response.status);
      const responseText = await response.text();
      console.log('Réponse:', responseText);
      
      if (response.status === 400) {
        const errorData = JSON.parse(responseText);
        if (errorData.error === 'Non autorisé') {
          console.log('\n❌ Toujours "Non autorisé" même avec token');
          console.log('💡 Le problème pourrait être dans la fonction elle-même');
        }
      }
    }
  } catch (error) {
    console.error('❌ Erreur avec session:', error.message);
  }
}

async function testPackChangeWithUserId(userId) {
  console.log('\n👤 Test avec ID utilisateur direct...');
  
  try {
    // Vérifier les packs de l'utilisateur
    const { data: userPacks, error: userPacksError } = await supabase
      .from('user_packs')
      .select(`
        *,
        packs:pack_id (
          id,
          name,
          price,
          currency
        )
      `)
      .eq('user_id', userId)
      .eq('is_active', true);
    
    if (userPacksError) {
      console.error('❌ Erreur user_packs:', userPacksError.message);
    } else {
      console.log('✅ Packs actifs de l\'utilisateur:');
      userPacks.forEach(up => {
        console.log(`   - ${up.packs?.name}: ${up.packs?.price} ${up.packs?.currency}`);
      });
    }
    
    // Vérifier la fonction calculate-pack-difference directement
    console.log('\n🧮 Test de calculate-pack-difference...');
    const calcResponse = await fetch(`${supabaseUrl}/functions/v1/calculate-pack-difference`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        newPackId: '209a0b0e-7888-41a3-9cd1-45907705261a' // Pack Visibilité
      })
    });
    
    console.log('Calculate Status:', calcResponse.status);
    const calcText = await calcResponse.text();
    console.log('Calculate Réponse:', calcText);
    
  } catch (error) {
    console.error('❌ Erreur avec userId:', error.message);
  }
}

// Fonction pour diagnostiquer la fonction smart-pack-change
async function diagnoseSmartPackChange() {
  console.log('\n🔍 Diagnostic de la fonction smart-pack-change...');
  
  try {
    // Vérifier si la fonction existe et répond
    const healthCheck = await fetch(`${supabaseUrl}/functions/v1/smart-pack-change`, {
      method: 'OPTIONS',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`
      }
    });
    
    console.log('Health Check Status:', healthCheck.status);
    
    if (healthCheck.status === 200) {
      console.log('✅ La fonction existe et répond aux OPTIONS');
    } else {
      console.log('❌ Problème avec la fonction');
    }
    
    // Test avec un payload minimal
    console.log('\nTest avec payload minimal...');
    const minimalTest = await fetch(`${supabaseUrl}/functions/v1/smart-pack-change`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });
    
    console.log('Minimal Test Status:', minimalTest.status);
    const minimalText = await minimalTest.text();
    console.log('Minimal Test Réponse:', minimalText);
    
  } catch (error) {
    console.error('❌ Erreur diagnostic:', error.message);
  }
}

// Exécuter tous les tests
async function runAllTests() {
  await testAuthenticatedPackChange();
  await diagnoseSmartPackChange();
  
  console.log('\n🎯 CONCLUSIONS:');
  console.log('1. Si "Non autorisé" persiste même avec token → Problème dans la fonction');
  console.log('2. Si "Pack ID requis" → Problème de paramètres');
  console.log('3. Vérifier les logs Supabase pour plus de détails');
}

runAllTests().catch(console.error);