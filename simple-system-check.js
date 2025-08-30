// Script de vérification simple du système sans jointures complexes

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Utiliser la clé de service pour bypasser RLS
const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function simpleSystemCheck() {
  try {
    console.log('🔍 VÉRIFICATION SIMPLE DU SYSTÈME');
    console.log('=' .repeat(50));
    
    // 1. Statistiques de base
    console.log('\n1. 📊 STATISTIQUES DE BASE');
    
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, email, selected_pack');
    
    const { data: userPacks, error: userPacksError } = await supabaseAdmin
      .from('user_packs')
      .select('user_id, pack_id, status');
    
    const { data: packs, error: packsError } = await supabaseAdmin
      .from('packs')
      .select('id, name, price');
    
    const { data: userServices, error: userServicesError } = await supabaseAdmin
      .from('user_services')
      .select('user_id, service_id, status');
    
    if (usersError) {
      console.error('❌ Erreur users:', usersError.message);
    } else {
      console.log(`👥 Total utilisateurs: ${users?.length || 0}`);
    }
    
    if (userPacksError) {
      console.error('❌ Erreur user_packs:', userPacksError.message);
    } else {
      const activePacks = userPacks?.filter(up => up.status === 'active') || [];
      console.log(`📦 Total user_packs: ${userPacks?.length || 0}`);
      console.log(`📦 Packs actifs: ${activePacks.length}`);
    }
    
    if (packsError) {
      console.error('❌ Erreur packs:', packsError.message);
    } else {
      console.log(`🎁 Packs disponibles: ${packs?.length || 0}`);
      packs?.forEach(pack => {
        console.log(`   - ${pack.name}: ${pack.price} FCFA`);
      });
    }
    
    if (userServicesError) {
      console.error('❌ Erreur user_services:', userServicesError.message);
    } else {
      const activeServices = userServices?.filter(us => us.status === 'active') || [];
      console.log(`🔧 Services utilisateur actifs: ${activeServices.length}`);
    }
    
    // 2. Vérification de la synchronisation selected_pack
    console.log('\n2. 🔄 VÉRIFICATION SYNCHRONISATION SELECTED_PACK');
    
    if (users && userPacks && packs) {
      let syncedCount = 0;
      let unsyncedCount = 0;
      
      // Créer des maps pour faciliter les lookups
      const packMap = new Map(packs.map(p => [p.id, p]));
      const activeUserPacksMap = new Map();
      
      // Grouper les packs actifs par utilisateur
      userPacks
        .filter(up => up.status === 'active')
        .forEach(up => {
          if (!activeUserPacksMap.has(up.user_id)) {
            activeUserPacksMap.set(up.user_id, []);
          }
          activeUserPacksMap.get(up.user_id).push(up);
        });
      
      console.log('\n📋 Détail par utilisateur:');
      
      users.forEach((user, index) => {
        const userActivePacks = activeUserPacksMap.get(user.id) || [];
        
        if (userActivePacks.length > 0) {
          // Prendre le premier pack actif
          const activePack = userActivePacks[0];
          const pack = packMap.get(activePack.pack_id);
          
          if (pack) {
            const packSlug = pack.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
            const isSync = user.selected_pack === packSlug;
            
            console.log(`   ${index + 1}. ${user.email}`);
            console.log(`      selected_pack: ${user.selected_pack}`);
            console.log(`      pack actif: ${packSlug} (${pack.name})`);
            console.log(`      synchronisé: ${isSync ? '✅' : '❌'}`);
            
            if (isSync) {
              syncedCount++;
            } else {
              unsyncedCount++;
            }
          }
        } else {
          console.log(`   ${index + 1}. ${user.email}`);
          console.log(`      selected_pack: ${user.selected_pack}`);
          console.log(`      pack actif: aucun`);
          console.log(`      synchronisé: ${user.selected_pack === 'free' ? '✅' : '❌'}`);
          
          if (user.selected_pack === 'free') {
            syncedCount++;
          } else {
            unsyncedCount++;
          }
        }
      });
      
      console.log(`\n📈 Résumé synchronisation:`);
      console.log(`   ✅ Utilisateurs synchronisés: ${syncedCount}`);
      console.log(`   ❌ Utilisateurs non synchronisés: ${unsyncedCount}`);
      
      // 3. État du système
      console.log('\n3. 🏥 ÉTAT DU SYSTÈME');
      
      const systemHealth = unsyncedCount === 0 ? 'EXCELLENT' : 
                          unsyncedCount <= 2 ? 'BON' : 'NÉCESSITE ATTENTION';
      
      console.log(`État: ${systemHealth}`);
      
      if (systemHealth === 'EXCELLENT') {
        console.log('✅ Tous les utilisateurs sont correctement synchronisés!');
        console.log('💡 Le Dashboard devrait afficher les bons packs pour tous.');
      } else {
        console.log(`⚠️ ${unsyncedCount} utilisateur(s) nécessitent une resynchronisation.`);
        console.log('🔧 Relancez le script fix-selected-pack-sync.js si nécessaire.');
      }
    }
    
    // 4. Vérification du webhook
    console.log('\n4. 🔧 VÉRIFICATION DU WEBHOOK');
    
    try {
      const fs = await import('fs');
      const webhookContent = fs.readFileSync('supabase/functions/stripe-webhook/index.ts', 'utf8');
      
      const hasSelectedPackUpdate = webhookContent.includes('selected_pack');
      console.log(`   Mise à jour selected_pack: ${hasSelectedPackUpdate ? '✅' : '❌'}`);
      
      if (hasSelectedPackUpdate) {
        console.log('✅ Webhook configuré pour mettre à jour selected_pack');
      } else {
        console.log('⚠️ Webhook ne met pas à jour selected_pack automatiquement');
      }
      
    } catch (error) {
      console.log('⚠️ Impossible de vérifier le webhook:', error.message);
    }
    
    // 5. Recommandations
    console.log('\n5. 💡 RECOMMANDATIONS');
    console.log('   1. Testez un paiement en mode test pour vérifier le webhook');
    console.log('   2. Surveillez les logs Stripe pour les erreurs');
    console.log('   3. Vérifiez périodiquement la synchronisation');
    console.log('   4. Redéployez les fonctions Supabase si nécessaire');
    
    console.log('\n🎉 Vérification terminée!');
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error.message);
  }
}

// Exécuter la vérification
if (process.argv[1] && process.argv[1].endsWith('simple-system-check.js')) {
  simpleSystemCheck()
    .then(() => {
      console.log('\n✅ Script terminé.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erreur fatale:', error);
      process.exit(1);
    });
}

export { simpleSystemCheck };