import { createClient } from '@supabase/supabase-js';

// Configuration Supabase
const supabaseUrl = 'https://ptrqhtwstldphjaraufi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0cnFodHdzdGxkcGhqYXJhdWZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MzI0OTIsImV4cCI6MjA3MDUwODQ5Mn0.Wc-dKWVMpAyFoAPFGejzhD0o1rodyEGrBlZK5X3muyA';

const supabase = createClient(supabaseUrl, supabaseKey);

// Fonction pour créer un utilisateur de test et tester l'attribution du pack
async function testAuthPackAssignment() {
  try {
    console.log('=== Test d\'attribution automatique du pack avec authentification ===\n');
    
    // Générer un email de test unique
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';
    
    console.log('1. Création d\'un utilisateur de test...');
    console.log('Email:', testEmail);
    
    // Créer un nouvel utilisateur
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: 'Test User',
          account_type: 'individual',
          selected_pack: 'free'
        }
      }
    });
    
    if (signUpError) {
      console.error('Erreur lors de la création de l\'utilisateur:', signUpError);
      return;
    }
    
    console.log('Utilisateur créé:', signUpData.user?.id);
    
    // Attendre un peu pour que l'utilisateur soit bien créé
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Se connecter avec l'utilisateur créé
    console.log('\n2. Connexion avec l\'utilisateur de test...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });
    
    if (signInError) {
      console.error('Erreur lors de la connexion:', signInError);
      return;
    }
    
    console.log('Connexion réussie pour:', signInData.user?.email);
    
    // Attendre un peu pour que la session soit établie
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Vérifier si l'utilisateur a un pack assigné
    console.log('\n3. Vérification du pack assigné...');
    const { data: userPacks, error: packsError } = await supabase
      .from('user_packs')
      .select('*')
      .eq('user_id', signInData.user.id)
      .eq('status', 'active');
    
    if (packsError) {
      console.error('Erreur lors de la récupération des packs:', packsError);
    } else {
      console.log('Packs trouvés:', userPacks?.length || 0);
      if (userPacks && userPacks.length > 0) {
        console.log('Pack actif:', userPacks[0]);
      } else {
        console.log('Aucun pack actif trouvé');
        
        // Tenter d'assigner le pack gratuit manuellement
        console.log('\n4. Attribution manuelle du pack gratuit...');
        const freePackId = '0a85e74a-4aec-480a-8af1-7b57391a80d2';
        
        const { data: assignData, error: assignError } = await supabase
          .from('user_packs')
          .insert({
            user_id: signInData.user.id,
            pack_id: freePackId,
            status: 'active'
          })
          .select();
        
        if (assignError) {
          console.error('Erreur lors de l\'attribution du pack:', assignError);
        } else {
          console.log('Pack assigné avec succès:', assignData);
        }
      }
    }
    
    // Nettoyer : supprimer l'utilisateur de test
    console.log('\n5. Nettoyage...');
    await supabase.auth.signOut();
    
    console.log('\n=== Test terminé ===');
    
  } catch (error) {
    console.error('Erreur lors du test:', error);
  }
}

// Exécuter le test
testAuthPackAssignment();