import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  console.log('Assurez-vous que SUPABASE_URL et SUPABASE_ANON_KEY sont définis');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTables() {
  try {
    console.log('🔍 Vérification de l\'état des tables...');
    
    // Vérifier la table user_packs
    const { data: userPacksData, error: userPacksError } = await supabase
      .from('user_packs')
      .select('id')
      .limit(1);
    
    if (userPacksError) {
      if (userPacksError.code === 'PGRST116') {
        console.log('❌ Table user_packs manquante');
      } else {
        console.log('⚠️  Erreur lors de l\'accès à user_packs:', userPacksError.message);
      }
    } else {
      console.log('✅ Table user_packs existe');
    }
    
    // Vérifier la table user_services
    const { data: userServicesData, error: userServicesError } = await supabase
      .from('user_services')
      .select('id')
      .limit(1);
    
    if (userServicesError) {
      if (userServicesError.code === 'PGRST116') {
        console.log('❌ Table user_services manquante');
      } else {
        console.log('⚠️  Erreur lors de l\'accès à user_services:', userServicesError.message);
      }
    } else {
      console.log('✅ Table user_services existe');
    }
    
    // Vérifier la table packs
    const { data: packsData, error: packsError } = await supabase
      .from('packs')
      .select('id, name')
      .limit(5);
    
    if (packsError) {
      if (packsError.code === 'PGRST116') {
        console.log('❌ Table packs manquante');
      } else {
        console.log('⚠️  Erreur lors de l\'accès à packs:', packsError.message);
      }
    } else {
      console.log('✅ Table packs existe avec', packsData?.length || 0, 'entrées');
    }
    
    console.log('\n📝 Instructions pour créer les tables manquantes:');
    console.log('1. Ouvrez l\'éditeur SQL dans votre tableau de bord Supabase');
    console.log('2. Allez sur: https://supabase.com/dashboard/project/ptrqhtwstldphjaraufi/sql/new');
    console.log('3. Copiez et exécutez le contenu du fichier create-user-packs-table.sql');
    console.log('4. Redémarrez l\'application après avoir créé les tables');
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error.message);
  }
}

// Exécuter la vérification
checkTables();