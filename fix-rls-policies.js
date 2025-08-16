import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixRLSPolicies() {
  try {
    console.log('=== CORRECTION DES POLITIQUES RLS ===');
    
    // Tester directement l'insertion dans les tables avec le client service_role
     console.log('1. Test d\'insertion directe avec service_role...');
     
     // Créer un client avec la clé service_role pour bypasser RLS
      const serviceRoleSupabase = createClient(supabaseUrl, supabaseServiceKey);
     
     const testEmail = `testuser${Date.now()}@gmail.com`;
      const testPassword = 'TestPassword123!';
      
      console.log('2. Création d\'un utilisateur auth...');
      
      // D'abord créer l'utilisateur dans auth.users
      const { data: authUser, error: authError } = await serviceRoleSupabase.auth.admin.createUser({
        email: testEmail,
        password: testPassword,
        email_confirm: true
      });
      
      if (authError) {
        console.error('Erreur lors de la création de l\'utilisateur auth:', authError);
        return;
      }
      
      console.log('Utilisateur auth créé:', authUser.user.id);
      
      console.log('3. Vérification si le profil existe déjà...');
       
       const { data: existingProfile } = await serviceRoleSupabase
         .from('users')
         .select('*')
         .eq('id', authUser.user.id)
         .single();
       
       let profileResult;
       
       if (existingProfile) {
         console.log('Profil existant trouvé, utilisation du profil existant');
         profileResult = [existingProfile];
       } else {
         console.log('Création du profil utilisateur...');
         
         const profileData = {
           id: authUser.user.id,
           email: testEmail,
           first_name: 'Test',
           last_name: 'User',
           phone: '+1234567890',
           company: 'Test Company',
           account_type: 'individual'
         };
         
         const { data: newProfile, error: profileError } = await serviceRoleSupabase
           .from('users')
           .insert([profileData])
           .select();
         
         if (profileError) {
           console.error('Erreur lors de la création du profil:', profileError);
           return;
         }
         
         profileResult = newProfile;
       }
     
     console.log('Profil utilisateur prêt:', profileResult);
       
       // Essayer d'assigner un pack
        console.log('4. Assignation du pack découverte...');
        
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
         console.error('Erreur lors de l\'assignation du pack:', packError);
       } else {
         console.log('Pack assigné avec succès:', packResult);
         
         // Vérifier les données finales
          console.log('5. Vérification des données finales...');
         
         const { data: finalUsers, error: usersError } = await serviceRoleSupabase
           .from('users')
           .select('*');
         
         const { data: finalUserPacks, error: userPacksError } = await serviceRoleSupabase
           .from('user_packs')
           .select('*');
         
         console.log('Utilisateurs en base:', finalUsers?.length || 0);
         console.log('User packs en base:', finalUserPacks?.length || 0);
       }
     
   } catch (error) {
     console.error('Erreur générale:', error);
   }
 }

fixRLSPolicies();