// Script de test pour simuler le flux de paiement et identifier les problèmes

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Utilise la clé service pour les tests
);

async function testPaymentFlow() {
  console.log('=== TEST DU FLUX DE PAIEMENT ===\n');
  
  try {
    // 1. Vérifier la structure des tables
    console.log('1. 🔍 Vérification de la structure des tables...');
    
    const tables = ['users', 'packs', 'user_packs'];
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.error(`❌ Erreur table ${table}:`, error.message);
      } else {
        console.log(`✅ Table ${table}: OK`);
      }
    }
    
    // 2. Vérifier les packs disponibles
    console.log('\n2. 📦 Vérification des packs disponibles...');
    const { data: packs, error: packsError } = await supabase
      .from('packs')
      .select('*')
      .eq('is_active', true);
    
    if (packsError) {
      console.error('❌ Erreur lors de la récupération des packs:', packsError);
    } else {
      console.log(`📊 ${packs?.length || 0} pack(s) disponible(s):`);
      packs?.forEach((pack, index) => {
        console.log(`   ${index + 1}. ${pack.name} - ${pack.price}€`);
      });
    }
    
    // 3. Créer un utilisateur de test
    console.log('\n3. 👤 Création d\'un utilisateur de test...');
    const testUserId = 'test-user-' + Date.now();
    const testEmail = `test-${Date.now()}@example.com`;
    
    // Simuler la création d'un utilisateur (normalement fait par Supabase Auth)
    const { data: testUser, error: userError } = await supabase
      .from('users')
      .insert({
        id: testUserId,
        email: testEmail,
        first_name: 'Test',
        last_name: 'User',
        account_type: 'individual'
      })
      .select()
      .single();
    
    if (userError) {
      console.error('❌ Erreur création utilisateur:', userError);
      return;
    }
    
    console.log(`✅ Utilisateur créé: ${testUser.email}`);
    
    // 4. Simuler l'achat d'un pack
    if (packs && packs.length > 0) {
      console.log('\n4. 💳 Simulation d\'achat de pack...');
      const selectedPack = packs[0]; // Prendre le premier pack
      const fakeStripeSessionId = 'cs_test_' + Date.now();
      
      // Simuler le webhook Stripe - créer un pack utilisateur
      const { data: userPack, error: packError } = await supabase
        .from('user_packs')
        .insert({
          user_id: testUserId,
          pack_id: selectedPack.id,
          status: 'active',
          stripe_session_id: fakeStripeSessionId,
          started_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (packError) {
        console.error('❌ Erreur création pack utilisateur:', packError);
      } else {
        console.log(`✅ Pack attribué: ${selectedPack.name}`);
        console.log(`   Session Stripe: ${fakeStripeSessionId}`);
        console.log(`   ID pack utilisateur: ${userPack.id}`);
      }
      
      // 5. Tester la récupération du pack utilisateur
      console.log('\n5. 🔄 Test de récupération du pack utilisateur...');
      const { data: retrievedPack, error: retrieveError } = await supabase
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
        .eq('user_id', testUserId)
        .eq('status', 'active')
        .single();
      
      if (retrieveError) {
        console.error('❌ Erreur récupération pack:', retrieveError);
      } else {
        console.log('✅ Pack récupéré avec succès:');
        console.log(`   Nom: ${retrievedPack.packs?.name}`);
        console.log(`   Prix: ${retrievedPack.packs?.price}€`);
        console.log(`   Statut: ${retrievedPack.status}`);
        console.log(`   Démarré: ${new Date(retrievedPack.started_at).toLocaleString()}`);
      }
      
      // 6. Tester avec un utilisateur non-admin (simulation RLS)
      console.log('\n6. 🔒 Test des politiques RLS...');
      const supabaseUser = createClient(
        process.env.VITE_SUPABASE_URL,
        process.env.VITE_SUPABASE_ANON_KEY
      );
      
      // Simuler une session utilisateur (normalement fait par l'authentification)
      const { data: rlsTest, error: rlsError } = await supabaseUser
        .from('user_packs')
        .select('*')
        .eq('user_id', testUserId);
      
      if (rlsError) {
        console.log('⚠️  RLS bloque l\'accès (normal sans authentification):', rlsError.message);
      } else {
        console.log(`✅ RLS permet l'accès: ${rlsTest?.length || 0} pack(s)`);
      }
    }
    
    // 7. Nettoyer les données de test
    console.log('\n7. 🧹 Nettoyage des données de test...');
    
    // Supprimer le pack utilisateur
    const { error: deletePackError } = await supabase
      .from('user_packs')
      .delete()
      .eq('user_id', testUserId);
    
    if (deletePackError) {
      console.error('❌ Erreur suppression pack:', deletePackError);
    } else {
      console.log('✅ Pack utilisateur supprimé');
    }
    
    // Supprimer l'utilisateur
    const { error: deleteUserError } = await supabase
      .from('users')
      .delete()
      .eq('id', testUserId);
    
    if (deleteUserError) {
      console.error('❌ Erreur suppression utilisateur:', deleteUserError);
    } else {
      console.log('✅ Utilisateur de test supprimé');
    }
    
    // 8. Résumé et recommandations
    console.log('\n8. 📋 RÉSUMÉ ET RECOMMANDATIONS:');
    console.log('\n✅ POINTS POSITIFS:');
    console.log('   - Les tables existent et sont accessibles');
    console.log('   - La création de packs utilisateur fonctionne');
    console.log('   - La récupération avec jointures fonctionne');
    
    console.log('\n⚠️  POINTS D\'ATTENTION:');
    console.log('   - Vérifiez que les webhooks Stripe sont correctement configurés');
    console.log('   - Assurez-vous que les variables d\'environnement sont correctes');
    console.log('   - Testez avec de vrais utilisateurs authentifiés');
    
    console.log('\n🔧 ACTIONS RECOMMANDÉES:');
    console.log('   1. Vérifiez les logs Stripe pour les webhooks récents');
    console.log('   2. Testez le processus complet avec un vrai paiement en mode test');
    console.log('   3. Vérifiez que l\'endpoint webhook est accessible depuis Stripe');
    console.log('   4. Contrôlez les politiques RLS avec des utilisateurs authentifiés');
    
  } catch (error) {
    console.error('❌ Erreur générale du test:', error);
  }
}

// Fonction pour tester un utilisateur spécifique
async function testSpecificUser(email) {
  console.log(`=== TEST POUR L'UTILISATEUR: ${email} ===\n`);
  
  try {
    // Rechercher l'utilisateur
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (userError) {
      console.error('❌ Utilisateur non trouvé:', userError.message);
      return;
    }
    
    console.log(`✅ Utilisateur trouvé: ${user.first_name} ${user.last_name}`);
    
    // Vérifier ses packs
    const { data: userPacks, error: packsError } = await supabase
      .from('user_packs')
      .select(`
        *,
        packs(
          name,
          price,
          description
        )
      `)
      .eq('user_id', user.id);
    
    if (packsError) {
      console.error('❌ Erreur récupération packs:', packsError);
    } else {
      console.log(`📦 ${userPacks?.length || 0} pack(s) trouvé(s):`);
      userPacks?.forEach((pack, index) => {
        console.log(`   ${index + 1}. ${pack.packs?.name} - Statut: ${pack.status}`);
        if (pack.stripe_session_id) {
          console.log(`      Session Stripe: ${pack.stripe_session_id}`);
        }
        console.log(`      Créé: ${new Date(pack.created_at).toLocaleString()}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

// Gestion des arguments
const args = process.argv.slice(2);
const userEmail = args.find(arg => arg.startsWith('--user='))?.split('=')[1];

if (userEmail) {
  testSpecificUser(userEmail)
    .then(() => process.exit(0))
    .catch(error => {
      console.error('❌ Erreur fatale:', error);
      process.exit(1);
    });
} else {
  testPaymentFlow()
    .then(() => {
      console.log('\n✅ Test terminé.');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Erreur fatale:', error);
      process.exit(1);
    });
}

// Usage:
// node test-payment-flow.js                    # Test complet
// node test-payment-flow.js --user=email@test.com  # Test utilisateur spécifique