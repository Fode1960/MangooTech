// Script de diagnostic avec clé de service pour contourner RLS
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  console.log('URL:', supabaseUrl ? '✅' : '❌');
  console.log('Service Key:', supabaseServiceKey ? '✅' : '❌');
  process.exit(1);
}

// Utiliser la clé de service pour contourner RLS
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function diagnoseWithServiceKey() {
  console.log('🔍 Diagnostic avec clé de service (contourne RLS)\n');

  try {
    // 1. Analyser tous les utilisateurs
    console.log('1. 👥 Analyse des utilisateurs...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*');

    if (usersError) {
      console.error('❌ Erreur users:', usersError.message);
    } else {
      console.log(`✅ ${users.length} utilisateurs trouvés`);
      if (users.length > 0) {
        console.log('   Premiers utilisateurs:');
        users.slice(0, 3).forEach(user => {
          console.log(`   - ${user.email} (selected_pack: ${user.selected_pack})`);
        });
      }
    }

    // 2. Analyser les user_packs
    console.log('\n2. 📦 Analyse des user_packs...');
    const { data: userPacks, error: userPacksError } = await supabase
      .from('user_packs')
      .select('*');

    if (userPacksError) {
      console.error('❌ Erreur user_packs:', userPacksError.message);
    } else {
      console.log(`✅ ${userPacks.length} user_packs trouvés`);
      if (userPacks.length > 0) {
        console.log('   Premiers user_packs:');
        userPacks.slice(0, 3).forEach(up => {
          console.log(`   - User: ${up.user_id}, Pack: ${up.pack_id}, Status: ${up.status}`);
        });
      }
    }

    // 3. Analyser les packs
    console.log('\n3. 🎯 Analyse des packs...');
    const { data: packs, error: packsError } = await supabase
      .from('packs')
      .select('*');

    if (packsError) {
      console.error('❌ Erreur packs:', packsError.message);
    } else {
      console.log(`✅ ${packs.length} packs trouvés:`);
      packs.forEach(pack => {
        console.log(`   - ${pack.name}: ${pack.price}€`);
      });
    }

    // 4. Analyser les transactions
    console.log('\n4. 💳 Analyse des transactions...');
    const { data: transactions, error: transactionsError } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false });

    if (transactionsError) {
      console.error('❌ Erreur transactions:', transactionsError.message);
    } else {
      console.log(`✅ ${transactions.length} transactions trouvées`);
      if (transactions.length > 0) {
        console.log('   Dernières transactions:');
        transactions.slice(0, 5).forEach(tx => {
          console.log(`   - User: ${tx.user_id}, Amount: ${tx.amount}€, Status: ${tx.status}`);
        });
      }
    }

    // 5. Analyser les relations
    console.log('\n5. 🔗 Analyse des relations utilisateurs-packs...');
    if (users && userPacks && packs) {
      // Utilisateurs sans user_pack
      const usersWithoutPacks = users.filter(user => 
        !userPacks.some(up => up.user_id === user.id)
      );
      
      if (usersWithoutPacks.length > 0) {
        console.log(`⚠️  ${usersWithoutPacks.length} utilisateurs sans user_pack:`);
        usersWithoutPacks.forEach(user => {
          console.log(`   - ${user.email} (selected_pack: ${user.selected_pack})`);
        });
      } else {
        console.log('✅ Tous les utilisateurs ont des user_packs');
      }

      // User_packs actifs
      const activePacks = userPacks.filter(up => up.status === 'active');
      console.log(`\n📊 Statistiques:`);
      console.log(`   - User_packs actifs: ${activePacks.length}/${userPacks.length}`);
      console.log(`   - Utilisateurs: ${users.length}`);
      console.log(`   - Packs disponibles: ${packs.length}`);
      console.log(`   - Transactions: ${transactions ? transactions.length : 0}`);

      // Vérifier la cohérence selected_pack vs user_pack actif
      console.log('\n🔍 Vérification cohérence selected_pack...');
      let inconsistencies = 0;
      for (const user of users) {
        const activePack = userPacks.find(up => 
          up.user_id === user.id && up.status === 'active'
        );
        
        if (activePack) {
          const pack = packs.find(p => p.id === activePack.pack_id);
          if (pack) {
            const packType = pack.name.toLowerCase().includes('découverte') ? 'free' :
                           pack.name.toLowerCase().includes('visibilité') ? 'visibility' :
                           pack.name.toLowerCase().includes('professionnel') ? 'professional' :
                           pack.name.toLowerCase().includes('premium') ? 'premium' : 'unknown';
            
            if (user.selected_pack !== packType) {
              console.log(`   ⚠️  ${user.email}: selected='${user.selected_pack}' vs pack='${pack.name}' (${packType})`);
              inconsistencies++;
            }
          }
        } else if (user.selected_pack !== 'free') {
          console.log(`   ⚠️  ${user.email}: selected='${user.selected_pack}' mais aucun user_pack actif`);
          inconsistencies++;
        }
      }
      
      if (inconsistencies === 0) {
        console.log('   ✅ Aucune incohérence détectée');
      } else {
        console.log(`   ⚠️  ${inconsistencies} incohérences détectées`);
      }
    }

    console.log('\n🎉 Diagnostic avec clé de service terminé!');

  } catch (error) {
    console.error('❌ Erreur lors du diagnostic:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Exécuter le diagnostic
if (process.argv[1] && process.argv[1].endsWith('diagnose-with-service-key.js')) {
  diagnoseWithServiceKey();
}

export { diagnoseWithServiceKey };