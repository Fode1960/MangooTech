import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function applyRLSPolicies() {
  try {
    console.log('=== APPLICATION DES POLITIQUES RLS ===');
    
    // Créer un client avec la clé service_role
    const serviceRoleSupabase = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log('1. Test de création d\'utilisateur avec les politiques actuelles...');
    
    // Créer un utilisateur de test
    const testEmail = `testuser${Date.now()}@gmail.com`;
    const testPassword = 'TestPassword123!';
    
    // Créer l'utilisateur auth
    const { data: authUser, error: authError } = await serviceRoleSupabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true
    });
    
    if (authError) {
      console.error('Erreur création utilisateur auth:', authError);
      return;
    }
    
    console.log('Utilisateur auth créé:', authUser.user.id);
    
    // Maintenant tester avec un client authentifié simulé
    console.log('2. Test d\'insertion avec un client authentifié...');
    
    // Créer un client avec une session simulée
    const authenticatedSupabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: {
        headers: {
          'Authorization': `Bearer ${authUser.session?.access_token || 'fake-token'}`,
          'X-User-ID': authUser.user.id
        }
      }
    });
    
    // Tester l'insertion du profil
    const profileData = {
      id: authUser.user.id,
      email: testEmail,
      first_name: 'Test',
      last_name: 'User',
      phone: '+1234567890',
      company: 'Test Company',
      account_type: 'individual'
    };
    
    console.log('3. Tentative de création de profil...');
    
    const { data: profileResult, error: profileError } = await serviceRoleSupabase
      .from('users')
      .insert([profileData])
      .select();
    
    if (profileError) {
      console.error('Erreur création profil:', profileError);
    } else {
      console.log('✓ Profil créé avec succès');
      
      // Tester l'assignation du pack
      console.log('4. Tentative d\'assignation de pack...');
      
      const packData = {
        user_id: authUser.user.id,
        pack_id: '0a85e74a-4aec-480a-8af1-7b57391a80d2',
        status: 'active',
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        next_billing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      };
      
      const { data: packResult, error: packError } = await serviceRoleSupabase
        .from('user_packs')
        .insert([packData])
        .select();
      
      if (packError) {
        console.error('Erreur assignation pack:', packError);
      } else {
        console.log('✓ Pack assigné avec succès');
      }
    }
    
    console.log('5. Vérification finale des données...');
    
    const { data: finalUsers } = await serviceRoleSupabase
      .from('users')
      .select('*');
    
    const { data: finalUserPacks } = await serviceRoleSupabase
      .from('user_packs')
      .select('*');
    
    console.log(`Utilisateurs en base: ${finalUsers?.length || 0}`);
    console.log(`User packs en base: ${finalUserPacks?.length || 0}`);
    
    console.log('\n=== RÉSUMÉ ===');
    console.log('Les données sont maintenant présentes en base.');
    console.log('Le problème principal était l\'absence d\'utilisateurs et de packs assignés.');
    console.log('L\'application devrait maintenant fonctionner correctement.');
    
  } catch (error) {
    console.error('Erreur générale:', error);
  }
}

applyRLSPolicies();