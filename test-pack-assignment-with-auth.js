import { createClient } from '@supabase/supabase-js';

// Configuration Supabase
const supabaseUrl = 'https://ptrqhtwstldphjaraufi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0cnFodHdzdGxkcGhqYXJhdWZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MzI0OTIsImV4cCI6MjA3MDUwODQ5Mn0.Wc-dKWVMpAyFoAPFGejzhD0o1rodyEGrBlZK5X3muyA';

const supabase = createClient(supabaseUrl, supabaseKey);

// Fonction pour tester l'attribution du pack avec un utilisateur existant
async function testWithExistingUser() {
  try {
    console.log('=== Test avec un utilisateur existant ===\n');
    
    // Utiliser un email de test existant ou en créer un nouveau
    const testEmail = 'test@mangootech.com';
    const testPassword = 'TestPassword123!';
    
    console.log('1. Tentative de connexion avec un utilisateur existant...');
    let { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });
    
    if (signInError) {
      console.log('Utilisateur n\'existe pas, création...');
      
      // Créer l'utilisateur s'il n'existe pas
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
        console.error('Erreur lors de la création:', signUpError);
        return;
      }
      
      console.log('Utilisateur créé, tentative de connexion...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const { data: retrySignIn, error: retryError } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword
      });
      
      if (retryError) {
        console.error('Erreur lors de la connexion après création:', retryError);
        return;
      }
      
      signInData = retrySignIn;
    }
    
    console.log('Connexion réussie pour:', signInData.user?.email);
    console.log('ID utilisateur:', signInData.user?.id);
    
    // Attendre que la session soit établie
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Vérifier la session actuelle
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      console.error('Erreur de session:', sessionError);
      return;
    }
    
    console.log('\n2. Session établie, test d\'insertion directe...');
    
    // Tenter d'insérer directement dans user_packs
    const freePackId = '0a85e74a-4aec-480a-8af1-7b57391a80d2';
    
    const { data: insertData, error: insertError } = await supabase
      .from('user_packs')
      .insert({
        user_id: session.user.id,
        pack_id: freePackId,
        status: 'active'
      })
      .select();
    
    if (insertError) {
      console.error('Erreur lors de l\'insertion:', insertError);
      
      // Essayer de voir si l'utilisateur a déjà un pack
      console.log('\n3. Vérification des packs existants...');
      const { data: existingPacks, error: selectError } = await supabase
        .from('user_packs')
        .select('*')
        .eq('user_id', session.user.id);
      
      if (selectError) {
        console.error('Erreur lors de la sélection:', selectError);
      } else {
        console.log('Packs existants:', existingPacks);
      }
    } else {
      console.log('Insertion réussie:', insertData);
    }
    
    // Nettoyer
    await supabase.auth.signOut();
    
  } catch (error) {
    console.error('Erreur lors du test:', error);
  }
}

// Exécuter le test
testWithExistingUser();