const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const supabaseUrl = 'https://ptrqhtwstldphjaraufi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0cnFodHdzdGxkcGhqYXJhdWZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MzI0OTIsImV4cCI6MjA3MDUwODQ5Mn0.Wc-dKWVMpAyFoAPFGejzhD0o1rodyEGrBlZK5X3muyA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFullAuthFlow() {
  console.log('🔐 Test complet du flux d\'authentification\n');
  
  try {
    // 1. Vérifier les utilisateurs existants
    console.log('1. Vérification des utilisateurs...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, created_at')
      .limit(5);
    
    if (usersError) {
      console.error('❌ Erreur users:', usersError.message);
    } else {
      console.log('✅ Utilisateurs trouvés:', users.length);
      users.forEach(user => {
        console.log(`   - ${user.email} (${user.id})`);
      });
    }
    
    // 2. Tester l'authentification avec un utilisateur existant
    console.log('\n2. Test d\'authentification...');
    
    // Essayer de s'authentifier avec mdansoko@mangoo.tech
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'mdansoko@mangoo.tech',
      password: 'Mangoo2024!' // Mot de passe par défaut
    });
    
    if (authError) {
      console.error('❌ Erreur auth:', authError.message);
      
      // Essayer avec un autre mot de passe
      console.log('Tentative avec mot de passe alternatif...');
      const { data: authData2, error: authError2 } = await supabase.auth.signInWithPassword({
        email: 'mdansoko@mangoo.tech',
        password: 'password123'
      });
      
      if (authError2) {
        console.error('❌ Erreur auth 2:', authError2.message);
        
        // Si l'authentification échoue, créer un utilisateur de test
        console.log('\n3. Création d\'un utilisateur de test...');
        await createTestUser();
        return;
      } else {
        console.log('✅ Authentification réussie avec mot de passe alternatif');
        await testWithAuthenticatedUser(authData2.session.access_token);
      }
    } else {
      console.log('✅ Authentification réussie');
      console.log('Utilisateur:', authData.user.email);
      await testWithAuthenticatedUser(authData.session.access_token);
    }
    
  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }
}

async function createTestUser() {
  console.log('Création d\'un utilisateur de test...');
  
  try {
    const testEmail = 'test-pack-change@mangoo.tech';
    const testPassword = 'TestPassword123!';
    
    // Créer l'utilisateur
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword
    });
    
    if (signUpError) {
      console.error('❌ Erreur création utilisateur:', signUpError.message);
      return;
    }
    
    console.log('✅ Utilisateur de test créé:', testEmail);
    
    // Attendre un peu pour que l'utilisateur soit créé
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // S'authentifier avec le nouvel utilisateur
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });
    
    if (authError) {
      console.error('❌ Erreur auth utilisateur test:', authError.message);
      return;
    }
    
    console.log('✅ Authentification utilisateur test réussie');
    await testWithAuthenticatedUser(authData.session.access_token);
    
  } catch (error) {
    console.error('❌ Erreur création utilisateur test:', error.message);
  }
}

async function testWithAuthenticatedUser(accessToken) {
  console.log('\n🧪 Test avec utilisateur authentifié...');
  
  try {
    // 1. Vérifier que l'utilisateur est bien authentifié
    console.log('1. Vérification de l\'authentification...');
    const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'apikey': supabaseKey
      }
    });
    
    if (userResponse.ok) {
      const userData = await userResponse.json();
      console.log('✅ Utilisateur authentifié:', userData.email);
    } else {
      console.error('❌ Problème d\'authentification:', userResponse.status);
      return;
    }
    
    // 2. Récupérer les packs disponibles
    console.log('\n2. Récupération des packs...');
    const { data: packs, error: packsError } = await supabase
      .from('packs')
      .select('*')
      .eq('is_active', true)
      .order('price', { ascending: true });
    
    if (packsError) {
      console.error('❌ Erreur packs:', packsError.message);
      return;
    }
    
    console.log('✅ Packs disponibles:', packs.length);
    packs.forEach(pack => {
      console.log(`   - ${pack.name}: ${pack.price} ${pack.currency}`);
    });
    
    // 3. Tester smart-pack-change avec authentification
    if (packs.length > 0) {
      console.log('\n3. Test smart-pack-change avec authentification...');
      const targetPack = packs[0]; // Premier pack
      
      const response = await fetch(`${supabaseUrl}/functions/v1/smart-pack-change`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          packId: targetPack.id,
          successUrl: 'http://localhost:3001/dashboard?success=true',
          cancelUrl: 'http://localhost:3001/dashboard?canceled=true'
        })
      });
      
      console.log('Status:', response.status);
      const responseText = await response.text();
      console.log('Réponse:', responseText);
      
      if (response.ok) {
        console.log('✅ smart-pack-change fonctionne avec authentification!');
        const result = JSON.parse(responseText);
        console.log('Résultat:', JSON.stringify(result, null, 2));
      } else {
        console.error('❌ smart-pack-change échoue même avec authentification');
        
        // Analyser l'erreur
        try {
          const errorData = JSON.parse(responseText);
          console.log('Détails de l\'erreur:', errorData);
        } catch (e) {
          console.log('Réponse brute:', responseText);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur test authentifié:', error.message);
  }
}

// Fonction pour nettoyer l'utilisateur de test
async function cleanupTestUser() {
  console.log('\n🧹 Nettoyage...');
  
  try {
    // Se déconnecter
    await supabase.auth.signOut();
    console.log('✅ Déconnexion effectuée');
  } catch (error) {
    console.error('❌ Erreur nettoyage:', error.message);
  }
}

// Exécuter le test complet
async function runFullTest() {
  await testFullAuthFlow();
  await cleanupTestUser();
  
  console.log('\n🎯 DIAGNOSTIC COMPLET TERMINÉ');
  console.log('Si smart-pack-change fonctionne avec authentification, le problème est dans le frontend.');
  console.log('Si smart-pack-change échoue même avec authentification, le problème est dans la fonction.');
}

runFullTest().catch(console.error);