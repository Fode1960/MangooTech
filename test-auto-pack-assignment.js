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

async function testAutoPackAssignment() {
  console.log('=== Test de l\'attribution automatique après corrections ===\n');
  
  // Générer un email unique
  const timestamp = Date.now();
  const testEmail = `test-auto-${timestamp}@mangootech.com`;
  const testPassword = 'TestPassword123!';
  
  try {
    // 1. Créer et connecter un utilisateur
    console.log('1. Création et connexion d\'un utilisateur...');
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
    });
    
    if (signUpError) {
      console.error('❌ Erreur lors de la création:', signUpError.message);
      return;
    }
    
    console.log('✅ Utilisateur créé et connecté:', testEmail);
    console.log('ID utilisateur:', signUpData.user?.id);
    
    // 2. Attendre un peu pour que l'attribution automatique se fasse
    console.log('\n2. Attente de l\'attribution automatique (5 secondes)...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // 3. Vérifier si un pack a été automatiquement attribué
    console.log('\n3. Vérification de l\'attribution automatique...');
    
    const { data: userPacks, error: packsError } = await supabase
      .from('user_packs')
      .select(`
        *,
        packs(
          id,
          name,
          description,
          price
        )
      `)
      .eq('user_id', signUpData.user?.id)
      .eq('status', 'active');
    
    if (packsError) {
      console.error('❌ Erreur lors de la récupération des packs:', packsError.message);
    } else if (userPacks && userPacks.length > 0) {
      console.log('✅ Pack automatiquement attribué:');
      userPacks.forEach(pack => {
        console.log(`  - ${pack.packs?.name} (${pack.packs?.price} FCFA)`);
        console.log(`  - Statut: ${pack.status}`);
        console.log(`  - Créé le: ${new Date(pack.created_at).toLocaleString()}`);
      });
    } else {
      console.log('⚠️ Aucun pack automatiquement attribué');
    }
    
    // 4. Vérifier les services associés
    console.log('\n4. Vérification des services utilisateur...');
    
    const { data: userServices, error: servicesError } = await supabase
      .from('user_services')
      .select('*')
      .eq('user_id', signUpData.user?.id);
    
    if (servicesError) {
      console.error('❌ Erreur lors de la récupération des services:', servicesError.message);
    } else if (userServices && userServices.length > 0) {
      console.log('✅ Services utilisateur trouvés:', userServices.length);
      userServices.forEach(service => {
        console.log(`  - Service ${service.service_id}: ${service.usage_count}/${service.usage_limit}`);
      });
    } else {
      console.log('⚠️ Aucun service utilisateur trouvé');
    }
    
    // 5. Nettoyer (supprimer l'utilisateur de test)
    console.log('\n5. Nettoyage...');
    
    // Supprimer les services utilisateur
    if (userServices && userServices.length > 0) {
      await supabase
        .from('user_services')
        .delete()
        .eq('user_id', signUpData.user?.id);
    }
    
    // Supprimer les packs utilisateur
    if (userPacks && userPacks.length > 0) {
      await supabase
        .from('user_packs')
        .delete()
        .eq('user_id', signUpData.user?.id);
    }
    
    console.log('✅ Données de test nettoyées');
    
  } catch (error) {
    console.error('❌ Erreur inattendue:', error.message);
  }
}

// Exécuter le test
testAutoPackAssignment();