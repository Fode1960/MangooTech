// Script pour synchroniser le champ selected_pack avec les user_packs actifs

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Utiliser la clé de service pour bypasser RLS
const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixSelectedPackSync() {
  try {
    console.log('🔄 Synchronisation des selected_pack avec les user_packs actifs...');
    
    // 1. Récupérer tous les utilisateurs avec leurs packs actifs
    const { data: userPacks, error: userPacksError } = await supabaseAdmin
      .from('user_packs')
      .select(`
        user_id,
        pack_id,
        status,
        started_at,
        packs(name)
      `)
      .eq('status', 'active')
      .order('started_at', { ascending: false }); // Le plus récent en premier
    
    if (userPacksError) {
      console.error('❌ Erreur récupération user_packs:', userPacksError.message);
      return;
    }
    
    console.log(`📦 Trouvé ${userPacks?.length || 0} packs actifs`);
    
    if (!userPacks || userPacks.length === 0) {
      console.log('ℹ️ Aucun pack actif trouvé');
      return;
    }
    
    // 2. Grouper par utilisateur (prendre le pack le plus récent pour chaque utilisateur)
    const userPackMap = new Map();
    
    userPacks.forEach(userPack => {
      const userId = userPack.user_id;
      if (!userPackMap.has(userId)) {
        userPackMap.set(userId, userPack);
      }
    });
    
    console.log(`👥 ${userPackMap.size} utilisateurs uniques avec packs actifs`);
    
    // 3. Récupérer les utilisateurs actuels
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, email, selected_pack')
      .in('id', Array.from(userPackMap.keys()));
    
    if (usersError) {
      console.error('❌ Erreur récupération utilisateurs:', usersError.message);
      return;
    }
    
    console.log(`👤 Trouvé ${users?.length || 0} utilisateurs`);
    
    // 4. Identifier les utilisateurs qui ont besoin d'une mise à jour
    const usersToUpdate = [];
    
    users?.forEach(user => {
      const userPack = userPackMap.get(user.id);
      // Convertir le nom du pack en slug pour selected_pack
      const packSlug = userPack.packs?.name?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || 'free';
      if (userPack && packSlug !== user.selected_pack) {
        usersToUpdate.push({
          id: user.id,
          email: user.email,
          currentSelectedPack: user.selected_pack,
          newSelectedPack: packSlug,
          packName: userPack.packs?.name
        });
      }
    });
    
    console.log(`🔄 ${usersToUpdate.length} utilisateurs nécessitent une mise à jour:`);
    
    if (usersToUpdate.length === 0) {
      console.log('✅ Tous les selected_pack sont déjà synchronisés!');
      return;
    }
    
    // 5. Afficher les changements prévus
    usersToUpdate.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email}`);
      console.log(`      Actuel: ${user.currentSelectedPack}`);
      console.log(`      Nouveau: ${user.newSelectedPack} (${user.packName})`);
    });
    
    // 6. Effectuer les mises à jour
    console.log('\n🔧 Mise à jour des selected_pack...');
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const user of usersToUpdate) {
      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({ selected_pack: user.newSelectedPack })
        .eq('id', user.id);
      
      if (updateError) {
        console.error(`❌ Erreur mise à jour ${user.email}:`, updateError.message);
        errorCount++;
      } else {
        console.log(`✅ ${user.email}: ${user.currentSelectedPack} → ${user.newSelectedPack}`);
        successCount++;
      }
    }
    
    // 7. Rapport final
    console.log('\n📊 RAPPORT FINAL:');
    console.log(`✅ Mises à jour réussies: ${successCount}`);
    console.log(`❌ Erreurs: ${errorCount}`);
    
    if (successCount > 0) {
      console.log('\n🎉 Synchronisation terminée avec succès!');
      console.log('💡 Les utilisateurs devraient maintenant voir leurs packs corrects dans le Dashboard.');
    }
    
    // 8. Vérification finale
    console.log('\n🔍 Vérification finale...');
    
    const { data: finalCheck, error: finalError } = await supabaseAdmin
      .from('users')
      .select(`
        id,
        email,
        selected_pack,
        user_packs!inner(
          pack_id,
          status,
          packs(name)
        )
      `)
      .eq('user_packs.status', 'active')
      .in('id', Array.from(userPackMap.keys()));
    
    if (finalError) {
      console.error('❌ Erreur vérification finale:', finalError.message);
    } else {
      console.log('\n📋 État final des utilisateurs:');
      finalCheck?.forEach((user, index) => {
        const activePack = user.user_packs?.[0];
        const packSlug = activePack?.packs?.name?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || 'free';
        const isSync = user.selected_pack === packSlug;
        console.log(`   ${index + 1}. ${user.email}`);
        console.log(`      selected_pack: ${user.selected_pack}`);
        console.log(`      pack actif: ${packSlug} (${activePack?.packs?.name})`);
        console.log(`      synchronisé: ${isSync ? '✅' : '❌'}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }
}

// Exécuter le script
if (process.argv[1] && process.argv[1].endsWith('fix-selected-pack-sync.js')) {
  fixSelectedPackSync()
    .then(() => {
      console.log('\n✅ Script terminé.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erreur fatale:', error);
      process.exit(1);
    });
}

export { fixSelectedPackSync };