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

async function testWebAuthFlow() {
  console.log('=== Test du flux d\'authentification web ===\n');
  
  // Générer un email unique
  const timestamp = Date.now();
  const testEmail = `test-web-${timestamp}@mangootech.com`;
  const testPassword = 'TestPassword123!';
  
  try {
    // 1. Créer un utilisateur
    console.log('1. Création d\'un utilisateur...');
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
    
    // 2. Se connecter explicitement (pour déclencher onAuthStateChange)
    console.log('\n2. Connexion explicite...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });
    
    if (signInError) {
      console.error('❌ Erreur lors de la connexion:', signInError.message);
      return;
    }
    
    console.log('✅ Connexion réussie');
    
    // 3. Attendre que l'attribution automatique se fasse
    console.log('\n3. Attente de l\'attribution automatique (8 secondes)...');
    await new Promise(resolve => setTimeout(resolve, 8000));
    
    // 4. Vérifier si un pack a été automatiquement attribué
    console.log('\n4. Vérification de l\'attribution automatique...');
    
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
      
      // 5. Tenter une attribution manuelle pour tester les politiques RLS
      console.log('\n5. Test d\'attribution manuelle...');
      
      const { data: manualPack, error: manualError } = await supabase
        .from('user_packs')
        .insert({
          user_id: signUpData.user?.id,
          pack_id: '0a85e74a-4aec-480a-8af1-7b57391a80d2', // Pack Découverte
          status: 'active',
          started_at: new Date().toISOString()
        })
        .select(`
          *,
          packs(
            id,
            name,
            description,
            price
          )
        `);
      
      if (manualError) {
        console.error('❌ Erreur lors de l\'attribution manuelle:', manualError.message);
      } else {
        console.log('✅ Attribution manuelle réussie:', manualPack[0].packs?.name);
      }
    }
    
    // 6. Se déconnecter
    console.log('\n6. Déconnexion...');
    await supabase.auth.signOut();
    
    // 7. Nettoyer
    console.log('\n7. Nettoyage...');
    
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
testWebAuthFlow();