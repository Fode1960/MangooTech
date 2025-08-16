import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Simuler la fonction assignPackToUser
async function assignPackToUser(packData) {
  const { data, error } = await supabase
    .from('user_packs')
    .insert(packData)
    .select();
  
  if (error) throw error;
  return data;
}

// Simuler la fonction getUserPack
async function getUserPack(userId) {
  const { data, error } = await supabase
    .from('user_packs')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Aucun pack trouvé
    }
    throw error;
  }
  
  return data;
}

// Simuler la fonction signUp d'AuthContext
async function simulateSignUp(email, password, userData = {}) {
  console.log('=== Simulation du flux signUp d\'AuthContext ===\n');
  
  try {
    console.log('1. Création de l\'utilisateur...');
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    });
    
    if (error) throw error;
    
    console.log('✅ Utilisateur créé:', email);
    console.log('ID utilisateur:', data.user?.id);
    
    // Le profil utilisateur est créé automatiquement par le trigger handle_new_user
    if (data.user) {
      console.log('\n2. Attente de la création automatique du profil...');
      
      // Attendre que le trigger crée le profil
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Vérifier que le profil a été créé
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();
      
      if (profileError) {
        console.error('❌ Erreur lors de la récupération du profil:', profileError.message);
      } else {
        console.log('✅ Profil utilisateur trouvé:', profile.email);
        
        // Assigner automatiquement le pack sélectionné
        console.log('\n3. Attribution automatique du pack...');
        
        const packMapping = {
          'free': '0a85e74a-4aec-480a-8af1-7b57391a80d2', // Pack Découverte
          'visibility': 'pack-visibilite-id',
          'professional': 'pack-professionnel-id',
          'premium': 'pack-premium-id'
        };
        
        let packIdToAssign = packMapping[userData.selectedPack] || packMapping['free'];
        
        if (packIdToAssign) {
          try {
            const packData = {
              user_id: data.user.id,
              pack_id: packIdToAssign,
              status: 'active',
              started_at: new Date().toISOString()
            };
            
            await assignPackToUser(packData);
            console.log('✅ Pack assigné avec succès:', packIdToAssign);
            
            // Vérifier l'attribution
            console.log('\n4. Vérification de l\'attribution...');
            const userPack = await getUserPack(data.user.id);
            
            if (userPack) {
              console.log('✅ Pack trouvé:', userPack.pack_id);
              console.log('   Statut:', userPack.status);
              console.log('   Créé le:', new Date(userPack.created_at).toLocaleString());
            } else {
              console.log('⚠️ Aucun pack trouvé après attribution');
            }
            
          } catch (packError) {
            console.error('❌ Erreur lors de l\'assignation du pack:', packError.message);
          }
        }
      }
    }
    
    // Nettoyer
    console.log('\n5. Nettoyage...');
    
    // Supprimer le pack
    await supabase
      .from('user_packs')
      .delete()
      .eq('user_id', data.user.id);
    
    // Supprimer le profil
    await supabase
      .from('users')
      .delete()
      .eq('id', data.user.id);
    
    console.log('✅ Données de test nettoyées');
    
    return { data, error: null };
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    return { data: null, error };
  }
}

// Exécuter le test
async function runTest() {
  const timestamp = Date.now();
  const testEmail = `test-signup-${timestamp}@mangootech.com`;
  const testPassword = 'TestPassword123!';
  
  const userData = {
    firstName: 'Test',
    lastName: 'User',
    selectedPack: 'free'
  };
  
  await simulateSignUp(testEmail, testPassword, userData);
}

runTest();