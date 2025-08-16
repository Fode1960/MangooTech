import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function listAllUsers() {
  console.log('=== Liste de tous les utilisateurs ===\n');
  
  try {
    // Récupérer tous les utilisateurs
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, account_type, created_at')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Erreur lors de la récupération des utilisateurs:', error.message);
      return;
    }
    
    if (!users || users.length === 0) {
      console.log('⚠️ Aucun utilisateur trouvé dans la base de données');
      return;
    }
    
    console.log(`✅ ${users.length} utilisateur(s) trouvé(s):\n`);
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email}`);
      console.log(`   - ID: ${user.id}`);
      console.log(`   - Nom: ${user.first_name || 'N/A'} ${user.last_name || 'N/A'}`);
      console.log(`   - Type: ${user.account_type || 'N/A'}`);
      // Pack sélectionné sera vérifié via user_packs
      console.log(`   - Créé le: ${new Date(user.created_at).toLocaleString()}`);
      console.log('');
    });
    
    // Vérifier aussi les utilisateurs auth de Supabase
    console.log('\n=== Vérification des utilisateurs auth ===\n');
    
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Erreur lors de la récupération des utilisateurs auth:', authError.message);
    } else {
      console.log(`✅ ${authUsers.users.length} utilisateur(s) auth trouvé(s):\n`);
      
      authUsers.users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.email}`);
        console.log(`   - ID: ${user.id}`);
        console.log(`   - Confirmé: ${user.email_confirmed_at ? 'Oui' : 'Non'}`);
        console.log(`   - Dernière connexion: ${user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'Jamais'}`);
        console.log(`   - Créé le: ${new Date(user.created_at).toLocaleString()}`);
        console.log('');
      });
    }
    
  } catch (error) {
    console.error('❌ Erreur inattendue:', error.message);
  }
}

listAllUsers();