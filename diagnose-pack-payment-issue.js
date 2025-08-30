// Script de diagnostic pour identifier les problèmes d'attribution de packs après paiement

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function diagnosePackPaymentIssues() {
  console.log('=== DIAGNOSTIC DES PROBLÈMES DE PAIEMENT DE PACKS ===\n');
  
  try {
    // 1. Vérifier les utilisateurs sans pack actif
    console.log('1. 🔍 Recherche des utilisateurs sans pack actif...');
    const { data: usersWithoutPack, error: usersError } = await supabase
      .from('users')
      .select(`
        id,
        email,
        created_at,
        user_packs!left(
          id,
          pack_id,
          status,
          stripe_session_id,
          created_at
        )
      `)
      .is('user_packs.id', null)
      .or('user_packs.status.neq.active');
    
    if (usersError) {
      console.error('❌ Erreur lors de la récupération des utilisateurs:', usersError);
    } else {
      console.log(`📊 Utilisateurs sans pack actif: ${usersWithoutPack?.length || 0}`);
      if (usersWithoutPack && usersWithoutPack.length > 0) {
        usersWithoutPack.slice(0, 5).forEach((user, index) => {
          console.log(`   ${index + 1}. ${user.email} (ID: ${user.id.substring(0, 8)}...)`);
        });
        if (usersWithoutPack.length > 5) {
          console.log(`   ... et ${usersWithoutPack.length - 5} autres`);
        }
      }
    }
    
    // 2. Vérifier les packs avec session Stripe mais statut inactif
    console.log('\n2. 💳 Recherche des packs payés mais inactifs...');
    const { data: paidButInactive, error: paidError } = await supabase
      .from('user_packs')
      .select(`
        *,
        users(email),
        packs(name, price)
      `)
      .not('stripe_session_id', 'is', null)
      .neq('status', 'active');
    
    if (paidError) {
      console.error('❌ Erreur lors de la récupération des packs payés inactifs:', paidError);
    } else {
      console.log(`📊 Packs payés mais inactifs: ${paidButInactive?.length || 0}`);
      if (paidButInactive && paidButInactive.length > 0) {
        paidButInactive.forEach((pack, index) => {
          console.log(`   ${index + 1}. ${pack.users?.email} - ${pack.packs?.name} (${pack.status})`);
          console.log(`      Session: ${pack.stripe_session_id}`);
          console.log(`      Créé: ${new Date(pack.created_at).toLocaleString()}`);
        });
      }
    }
    
    // 3. Vérifier les utilisateurs avec plusieurs packs actifs (problème potentiel)
    console.log('\n3. ⚠️  Recherche des utilisateurs avec plusieurs packs actifs...');
    const { data: multipleActivePacks, error: multipleError } = await supabase
      .rpc('find_users_with_multiple_active_packs');
    
    if (multipleError && multipleError.code !== '42883') { // Fonction n'existe pas
      console.error('❌ Erreur lors de la vérification des packs multiples:', multipleError);
    } else if (multipleError && multipleError.code === '42883') {
      // Requête alternative si la fonction n'existe pas
      const { data: manualCheck, error: manualError } = await supabase
        .from('user_packs')
        .select(`
          user_id,
          users(email),
          count
        `)
        .eq('status', 'active')
        .group('user_id');
      
      if (!manualError) {
        const usersWithMultiple = manualCheck?.filter(item => item.count > 1) || [];
        console.log(`📊 Utilisateurs avec plusieurs packs actifs: ${usersWithMultiple.length}`);
      }
    } else {
      console.log(`📊 Utilisateurs avec plusieurs packs actifs: ${multipleActivePacks?.length || 0}`);
    }
    
    // 4. Vérifier les sessions Stripe récentes sans pack correspondant
    console.log('\n4. 🔄 Recherche des sessions Stripe récentes...');
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data: recentPacks, error: recentError } = await supabase
      .from('user_packs')
      .select(`
        *,
        users(email),
        packs(name, price)
      `)
      .gte('created_at', oneDayAgo)
      .not('stripe_session_id', 'is', null)
      .order('created_at', { ascending: false });
    
    if (recentError) {
      console.error('❌ Erreur lors de la récupération des packs récents:', recentError);
    } else {
      console.log(`📊 Packs créés dans les dernières 24h: ${recentPacks?.length || 0}`);
      if (recentPacks && recentPacks.length > 0) {
        recentPacks.forEach((pack, index) => {
          console.log(`   ${index + 1}. ${pack.users?.email} - ${pack.packs?.name}`);
          console.log(`      Statut: ${pack.status}`);
          console.log(`      Session: ${pack.stripe_session_id}`);
          console.log(`      Créé: ${new Date(pack.created_at).toLocaleString()}`);
        });
      }
    }
    
    // 5. Statistiques générales
    console.log('\n5. 📈 Statistiques générales...');
    
    const { data: totalUsers, error: totalUsersError } = await supabase
      .from('users')
      .select('id', { count: 'exact' });
    
    const { data: activePacksCount, error: activePacksError } = await supabase
      .from('user_packs')
      .select('id', { count: 'exact' })
      .eq('status', 'active');
    
    const { data: paidPacksCount, error: paidPacksError } = await supabase
      .from('user_packs')
      .select('id', { count: 'exact' })
      .not('stripe_session_id', 'is', null);
    
    if (!totalUsersError) {
      console.log(`👥 Total utilisateurs: ${totalUsers?.length || 0}`);
    }
    if (!activePacksError) {
      console.log(`📦 Packs actifs: ${activePacksCount?.length || 0}`);
    }
    if (!paidPacksError) {
      console.log(`💳 Packs avec session Stripe: ${paidPacksCount?.length || 0}`);
    }
    
    // 6. Recommandations
    console.log('\n6. 💡 RECOMMANDATIONS:');
    console.log('   - Vérifiez les logs du webhook Stripe pour les erreurs récentes');
    console.log('   - Contrôlez que les variables d\'environnement Stripe sont correctes');
    console.log('   - Vérifiez les politiques RLS sur la table user_packs');
    console.log('   - Testez manuellement le processus de paiement en mode test');
    
    if (paidButInactive && paidButInactive.length > 0) {
      console.log('\n🔧 ACTIONS CORRECTIVES SUGGÉRÉES:');
      console.log('   - Exécutez le script fix-user-pack-status.js pour réactiver les packs payés');
      console.log('   - Vérifiez manuellement chaque session Stripe mentionnée ci-dessus');
    }
    
  } catch (error) {
    console.error('❌ Erreur générale du diagnostic:', error);
  }
}

// Exécuter le diagnostic
diagnosePackPaymentIssues()
  .then(() => {
    console.log('\n✅ Diagnostic terminé.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });