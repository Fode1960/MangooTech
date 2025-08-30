const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkUserEmails() {
  try {
    console.log('🔍 Recherche des utilisateurs dans la base de données...');
    console.log('=' .repeat(50));

    // Récupérer tous les utilisateurs
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, selected_pack, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('❌ Erreur:', error.message);
      return;
    }

    if (!users || users.length === 0) {
      console.log('❌ Aucun utilisateur trouvé dans la table users');
      return;
    }

    console.log(`✅ ${users.length} utilisateur(s) trouvé(s):`);
    console.log('');

    users.forEach((user, index) => {
      console.log(`👤 Utilisateur ${index + 1}:`);
      console.log(`  - ID: ${user.id}`);
      console.log(`  - Email: ${user.email}`);
      console.log(`  - Selected pack: ${user.selected_pack || 'N/A'}`);
      console.log(`  - Créé le: ${user.created_at}`);
      console.log('');
    });

    // Rechercher spécifiquement l'email qui ressemble à mdans...
    const { data: mdansUsers, error: mdansError } = await supabase
      .from('users')
      .select('*')
      .ilike('email', '%mdans%');

    if (mdansError) {
      console.error('❌ Erreur recherche mdans:', mdansError.message);
    } else if (mdansUsers && mdansUsers.length > 0) {
      console.log('🎯 Utilisateurs contenant "mdans":');
      mdansUsers.forEach(user => {
        console.log(`  - ${user.email} (ID: ${user.id})`);
      });
    } else {
      console.log('❌ Aucun utilisateur trouvé avec "mdans" dans l\'email');
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

checkUserEmails();