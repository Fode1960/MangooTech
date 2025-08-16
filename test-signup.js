import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ptrqhtwstldphjaraufi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0cnFodHdzdGxkcGhqYXJhdWZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MzI0OTIsImV4cCI6MjA3MDUwODQ5Mn0.Wc-dKWVMpAyFoAPFGejzhD0o1rodyEGrBlZK5X3muyA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSignup() {
  try {
    console.log('=== TEST D\'INSCRIPTION ===');
    
    const testEmail = 'testuser@gmail.com';
    const testPassword = 'TestPassword123!';
    
    // 1. Essayer de s'inscrire
    console.log('1. Tentative d\'inscription...');
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword
    });
    
    if (signUpError) {
      console.error('Erreur lors de l\'inscription:', signUpError);
      return;
    }
    
    console.log('Inscription réussie:', signUpData);
    
    // 2. Créer le profil utilisateur
    if (signUpData.user) {
      console.log('2. Création du profil utilisateur...');
      
      const profileData = {
        id: signUpData.user.id,
        email: signUpData.user.email,
        first_name: 'Test',
        last_name: 'User',
        phone: '+1234567890',
        company: 'Test Company',
        account_type: 'individual'
      };
      
      const { data: profileResult, error: profileError } = await supabase
        .from('users')
        .insert([profileData])
        .select();
      
      if (profileError) {
        console.error('Erreur lors de la création du profil:', profileError);
      } else {
        console.log('Profil créé avec succès:', profileResult);
        
        // 3. Assigner le pack découverte
        console.log('3. Assignation du pack découverte...');
        
        const packData = {
          user_id: signUpData.user.id,
          pack_id: '0a85e74a-4aec-480a-8af1-7b57391a80d2', // Pack Découverte
          status: 'active',
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 jours
          next_billing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        };
        
        const { data: packResult, error: packError } = await supabase
          .from('user_packs')
          .insert([packData])
          .select(`
            *,
            packs(
              id,
              name,
              description,
              price,
              currency,
              billing_period
            )
          `);
        
        if (packError) {
          console.error('Erreur lors de l\'assignation du pack:', packError);
        } else {
          console.log('Pack assigné avec succès:', packResult);
        }
      }
    }
    
    // 4. Vérifier les données finales
    console.log('4. Vérification des données finales...');
    
    const { data: finalUsers, error: finalUsersError } = await supabase
      .from('users')
      .select('*');
    
    if (finalUsersError) {
      console.error('Erreur lors de la vérification des utilisateurs:', finalUsersError);
    } else {
      console.log('Utilisateurs dans la base:', finalUsers);
    }
    
    const { data: finalPacks, error: finalPacksError } = await supabase
      .from('user_packs')
      .select(`
        *,
        packs(
          id,
          name,
          description,
          price,
          currency,
          billing_period
        )
      `);
    
    if (finalPacksError) {
      console.error('Erreur lors de la vérification des packs:', finalPacksError);
    } else {
      console.log('Packs utilisateur dans la base:', finalPacks);
    }
    
  } catch (error) {
    console.error('Erreur générale:', error);
  }
}

testSignup();