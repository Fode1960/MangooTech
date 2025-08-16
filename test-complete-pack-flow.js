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

async function testCompletePackFlow() {
  console.log('=== Test du flux complet d\'attribution de pack ===\n');
  
  // Générer un email unique
  const timestamp = Date.now();
  const testEmail = `test-flow-${timestamp}@mangootech.com`;
  const testPassword = 'TestPassword123!';
  
  try {
    // 1. Créer un nouvel utilisateur
    console.log('1. Création d\'un nouvel utilisateur...');
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
    });
    
    if (signUpError) {
      console.error('❌ Erreur lors de la création:', signUpError.message);
      return;
    }
    
    console.log('✅ Utilisateur créé:', testEmail);
    console.log('ID utilisateur:', signUpData.user?.id);
    
    // 2. Vérifier si un pack a été automatiquement attribué
    console.log('\n2. Vérification de l\'attribution automatique du pack...');
    
    const { data: userPacks, error: packsError } = await supabase
      .from('user_packs')
      .select('*')
      .eq('user_id', signUpData.user?.id)
      .eq('status', 'active');
    
    if (packsError) {
      console.error('❌ Erreur lors de la récupération des packs:', packsError.message);
      return;
    }
    
    if (userPacks && userPacks.length > 0) {
      console.log('✅ Pack automatiquement attribué:', userPacks[0]);
    } else {
      console.log('⚠️ Aucun pack automatiquement attribué');
      
      // 3. Tenter d'attribuer manuellement le pack gratuit
      console.log('\n3. Attribution manuelle du pack gratuit...');
      
      const { data: insertData, error: insertError } = await supabase
        .from('user_packs')
        .insert({
          user_id: signUpData.user?.id,
          pack_id: '0a85e74a-4aec-480a-8af1-7b57391a80d2', // Pack Découverte
          status: 'active',
          started_at: new Date().toISOString()
        })
        .select();
      
      if (insertError) {
        console.error('❌ Erreur lors de l\'attribution manuelle:', insertError.message);
        return;
      }
      
      console.log('✅ Pack attribué manuellement:', insertData[0]);
    }
    
    // 4. Vérifier les services associés
    console.log('\n4. Vérification des services utilisateur...');
    
    const { data: userServices, error: servicesError } = await supabase
      .from('user_services')
      .select('*')
      .eq('user_id', signUpData.user?.id);
    
    if (servicesError) {
      console.error('❌ Erreur lors de la récupération des services:', servicesError.message);
      return;
    }
    
    if (userServices && userServices.length > 0) {
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
    await supabase
      .from('user_packs')
      .delete()
      .eq('user_id', signUpData.user?.id);
    
    console.log('✅ Données de test nettoyées');
    
  } catch (error) {
    console.error('❌ Erreur inattendue:', error.message);
  }
}

// Exécuter le test
testCompletePackFlow();