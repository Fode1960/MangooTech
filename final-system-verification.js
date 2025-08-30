// Script de vérification finale du système de paiement et d'attribution des packs

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Utiliser la clé de service pour bypasser RLS
const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Client normal pour tester RLS
const supabaseClient = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function finalSystemVerification() {
  try {
    console.log('🔍 VÉRIFICATION FINALE DU SYSTÈME DE PAIEMENT');
    console.log('=' .repeat(60));
    
    // 1. Vérifier la cohérence des données
    console.log('\n1. 📊 VÉRIFICATION DE LA COHÉRENCE DES DONNÉES');
    
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select(`
        id,
        email,
        selected_pack,
        user_packs!inner(
          id,
          pack_id,
          status,
          packs(name)
        )
      `)
      .eq('user_packs.status', 'active');
    
    if (usersError) {
      console.error('❌ Erreur récupération utilisateurs:', usersError.message);
      return;
    }
    
    console.log(`👥 Utilisateurs avec packs actifs: ${users?.length || 0}`);
    
    let syncedUsers = 0;
    let unsyncedUsers = 0;
    
    users?.forEach((user, index) => {
      const activePack = user.user_packs?.[0];
      const packSlug = activePack?.packs?.name?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || 'free';
      const isSync = user.selected_pack === packSlug;
      
      console.log(`   ${index + 1}. ${user.email}`);
      console.log(`      selected_pack: ${user.selected_pack}`);
      console.log(`      pack actif: ${packSlug} (${activePack?.packs?.name})`);
      console.log(`      synchronisé: ${isSync ? '✅' : '❌'}`);
      
      if (isSync) {
        syncedUsers++;
      } else {
        unsyncedUsers++;
      }
    });
    
    console.log(`\n📈 Résumé synchronisation:`);
    console.log(`   ✅ Utilisateurs synchronisés: ${syncedUsers}`);
    console.log(`   ❌ Utilisateurs non synchronisés: ${unsyncedUsers}`);
    
    // 2. Vérifier les statistiques générales
    console.log('\n2. 📈 STATISTIQUES GÉNÉRALES');
    
    const { data: allUsers, error: allUsersError } = await supabaseAdmin
      .from('users')
      .select('id', { count: 'exact' });
    
    const { data: activePacks, error: activePacksError } = await supabaseAdmin
      .from('user_packs')
      .select('id', { count: 'exact' })
      .eq('status', 'active');
    
    const { data: allUserPacks, error: allUserPacksError } = await supabaseAdmin
      .from('user_packs')
      .select('id', { count: 'exact' });
    
    const { data: userServices, error: userServicesError } = await supabaseAdmin
      .from('user_services')
      .select('id', { count: 'exact' })
      .eq('status', 'active');
    
    const { data: availablePacks, error: availablePacksError } = await supabaseAdmin
      .from('packs')
      .select('id, name, price', { count: 'exact' })
      .eq('is_active', true);
    
    if (!allUsersError) {
      console.log(`👥 Total utilisateurs: ${allUsers?.length || 0}`);
    }
    if (!activePacksError) {
      console.log(`📦 Packs actifs: ${activePacks?.length || 0}`);
    }
    if (!allUserPacksError) {
      console.log(`📊 Total user_packs: ${allUserPacks?.length || 0}`);
    }
    if (!userServicesError) {
      console.log(`🔧 Services utilisateur actifs: ${userServices?.length || 0}`);
    }
    if (!availablePacksError) {
      console.log(`🎁 Packs disponibles: ${availablePacks?.length || 0}`);
      availablePacks?.forEach(pack => {
        console.log(`   - ${pack.name}: ${pack.price} FCFA`);
      });
    }
    
    // 3. Tester les politiques RLS
    console.log('\n3. 🔒 TEST DES POLITIQUES RLS');
    
    // Test avec client anonyme (devrait échouer)
    const { data: rlsTestAnon, error: rlsErrorAnon } = await supabaseClient
      .from('user_packs')
      .select('*')
      .limit(1);
    
    if (rlsErrorAnon || !rlsTestAnon || rlsTestAnon.length === 0) {
      console.log('✅ RLS fonctionne: client anonyme ne peut pas accéder aux user_packs');
    } else {
      console.log('⚠️ RLS pourrait avoir un problème: client anonyme peut accéder aux données');
    }
    
    // 4. Vérifier la structure du webhook
    console.log('\n4. 🔧 VÉRIFICATION DU WEBHOOK STRIPE');
    
    try {
      const webhookContent = await import('fs').then(fs => 
        fs.readFileSync('supabase/functions/stripe-webhook/index.ts', 'utf8')
      );
      
      const hasSelectedPackUpdate = webhookContent.includes('selected_pack');
      const hasPackInfoRetrieval = webhookContent.includes('packs');
      const hasSlugGeneration = webhookContent.includes('toLowerCase');
      
      console.log(`   ✅ Mise à jour selected_pack: ${hasSelectedPackUpdate ? '✅' : '❌'}`);
      console.log(`   ✅ Récupération info pack: ${hasPackInfoRetrieval ? '✅' : '❌'}`);
      console.log(`   ✅ Génération slug: ${hasSlugGeneration ? '✅' : '❌'}`);
      
      if (hasSelectedPackUpdate && hasPackInfoRetrieval && hasSlugGeneration) {
        console.log('✅ Webhook Stripe correctement configuré');
      } else {
        console.log('⚠️ Webhook Stripe pourrait nécessiter des corrections');
      }
      
    } catch (error) {
      console.log('⚠️ Impossible de vérifier le webhook:', error.message);
    }
    
    // 5. Recommandations finales
    console.log('\n5. 💡 RECOMMANDATIONS FINALES');
    
    if (unsyncedUsers === 0) {
      console.log('✅ Tous les utilisateurs sont synchronisés!');
    } else {
      console.log(`⚠️ ${unsyncedUsers} utilisateur(s) non synchronisé(s)`);
      console.log('   → Relancez le script fix-selected-pack-sync.js');
    }
    
    console.log('\n📋 ACTIONS DE MAINTENANCE RECOMMANDÉES:');
    console.log('   1. Surveillez les logs du webhook Stripe pour les erreurs');
    console.log('   2. Testez régulièrement le processus de paiement en mode test');
    console.log('   3. Vérifiez périodiquement la synchronisation des selected_pack');
    console.log('   4. Surveillez les politiques RLS pour la sécurité');
    
    // 6. Test de simulation rapide
    console.log('\n6. 🧪 TEST DE SIMULATION RAPIDE');
    
    // Simuler la logique de conversion nom → slug
    const testPackNames = ['Pack Découverte', 'Pack Visibilité', 'Pack Professionnel', 'Pack Premium'];
    console.log('Conversion nom → slug:');
    testPackNames.forEach(name => {
      const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      console.log(`   ${name} → ${slug}`);
    });
    
    console.log('\n🎉 VÉRIFICATION FINALE TERMINÉE!');
    console.log('=' .repeat(60));
    
    // Résumé final
    const systemHealth = unsyncedUsers === 0 ? 'EXCELLENT' : unsyncedUsers <= 2 ? 'BON' : 'NÉCESSITE ATTENTION';
    console.log(`\n🏥 ÉTAT DU SYSTÈME: ${systemHealth}`);
    
    if (systemHealth === 'EXCELLENT') {
      console.log('✅ Le système de paiement et d\'attribution fonctionne parfaitement!');
      console.log('💡 Les utilisateurs devraient voir leurs packs corrects dans le Dashboard.');
    } else {
      console.log('⚠️ Le système nécessite quelques ajustements mineurs.');
      console.log('🔧 Suivez les recommandations ci-dessus pour optimiser le système.');
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification finale:', error.message);
  }
}

// Exécuter la vérification
if (process.argv[1] && process.argv[1].endsWith('final-system-verification.js')) {
  finalSystemVerification()
    .then(() => {
      console.log('\n✅ Vérification terminée.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erreur fatale:', error);
      process.exit(1);
    });
}

export { finalSystemVerification };