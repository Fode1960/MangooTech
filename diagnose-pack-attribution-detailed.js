// Script de diagnostic détaillé pour les problèmes d'attribution de packs
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnosePacks() {
  console.log('🔍 Diagnostic détaillé des packs utilisateur\n');

  try {
    // 1. Analyser tous les utilisateurs et leurs packs
    console.log('1. 👥 Analyse des utilisateurs et leurs packs...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, selected_pack, created_at');

    if (usersError) {
      console.error('❌ Erreur lors de la récupération des utilisateurs:', usersError.message);
      return;
    }

    console.log(`✅ ${users.length} utilisateurs trouvés`);
    
    // 2. Analyser les user_packs
    console.log('\n2. 📦 Analyse des user_packs...');
    const { data: userPacks, error: userPacksError } = await supabase
      .from('user_packs')
      .select('*');

    if (userPacksError) {
      console.error('❌ Erreur lors de la récupération des user_packs:', userPacksError.message);
      return;
    }

    console.log(`✅ ${userPacks.length} user_packs trouvés`);
    
    // 3. Analyser les packs disponibles
    console.log('\n3. 🎯 Analyse des packs disponibles...');
    const { data: packs, error: packsError } = await supabase
      .from('packs')
      .select('*');

    if (packsError) {
      console.error('❌ Erreur lors de la récupération des packs:', packsError.message);
      return;
    }

    console.log(`✅ ${packs.length} packs trouvés:`);
    packs.forEach(pack => {
      console.log(`   - ${pack.name}: ${pack.price}€ (ID: ${pack.id})`);
    });

    // 4. Analyser les transactions
    console.log('\n4. 💳 Analyse des transactions...');
    const { data: transactions, error: transactionsError } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false });

    if (transactionsError) {
      console.error('❌ Erreur lors de la récupération des transactions:', transactionsError.message);
    } else {
      console.log(`✅ ${transactions.length} transactions trouvées`);
      if (transactions.length > 0) {
        console.log('   Dernières transactions:');
        transactions.slice(0, 5).forEach(tx => {
          console.log(`   - ${tx.user_id}: ${tx.amount}€ - ${tx.status} (${tx.created_at})`);
        });
      }
    }

    // 5. Identifier les incohérences
    console.log('\n5. 🔍 Identification des incohérences...');
    
    // Utilisateurs sans user_pack correspondant
    const usersWithoutPacks = users.filter(user => 
      !userPacks.some(up => up.user_id === user.id)
    );
    
    if (usersWithoutPacks.length > 0) {
      console.log(`⚠️  ${usersWithoutPacks.length} utilisateurs sans user_pack:`);
      usersWithoutPacks.forEach(user => {
        console.log(`   - ${user.email} (selected_pack: ${user.selected_pack})`);
      });
    }

    // User_packs avec des pack_id invalides
    const invalidUserPacks = userPacks.filter(up => 
      !packs.some(pack => pack.id === up.pack_id)
    );
    
    if (invalidUserPacks.length > 0) {
      console.log(`⚠️  ${invalidUserPacks.length} user_packs avec pack_id invalide:`);
      invalidUserPacks.forEach(up => {
        console.log(`   - User: ${up.user_id}, Pack: ${up.pack_id}`);
      });
    }

    // Utilisateurs avec selected_pack différent de leur user_pack actif
    const inconsistentUsers = [];
    for (const user of users) {
      const activePack = userPacks.find(up => 
        up.user_id === user.id && up.status === 'active'
      );
      
      if (activePack) {
        const pack = packs.find(p => p.id === activePack.pack_id);
        if (pack && pack.name.toLowerCase().includes(user.selected_pack) === false) {
          inconsistentUsers.push({
            user: user.email,
            selected_pack: user.selected_pack,
            actual_pack: pack.name
          });
        }
      }
    }

    if (inconsistentUsers.length > 0) {
      console.log(`⚠️  ${inconsistentUsers.length} utilisateurs avec incohérence selected_pack/user_pack:`);
      inconsistentUsers.forEach(inc => {
        console.log(`   - ${inc.user}: selected='${inc.selected_pack}' vs actual='${inc.actual_pack}'`);
      });
    }

    // 6. Recommandations
    console.log('\n6. 💡 Recommandations:');
    
    if (usersWithoutPacks.length > 0) {
      console.log('   - Créer des user_packs pour les utilisateurs sans pack');
    }
    
    if (invalidUserPacks.length > 0) {
      console.log('   - Corriger ou supprimer les user_packs avec pack_id invalide');
    }
    
    if (inconsistentUsers.length > 0) {
      console.log('   - Synchroniser selected_pack avec les user_packs actifs');
    }
    
    if (transactions && transactions.length > 0) {
      const successfulPayments = transactions.filter(tx => tx.status === 'completed');
      console.log(`   - Vérifier que les ${successfulPayments.length} paiements réussis ont bien créé des user_packs`);
    }

    console.log('\n🎉 Diagnostic terminé!');

  } catch (error) {
    console.error('❌ Erreur lors du diagnostic:', error.message);
  }
}

// Exécuter le diagnostic
if (process.argv[1] && process.argv[1].endsWith('diagnose-pack-attribution-detailed.js')) {
  diagnosePacks();
}

export { diagnosePacks };