require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase avec la clé service_role pour les opérations admin
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔧 Configuration Supabase (Admin):');
console.log(`   URL: ${supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'NON DÉFINIE'}`);
console.log(`   Service Key: ${supabaseServiceKey ? supabaseServiceKey.substring(0, 20) + '...' : 'NON DÉFINIE'}`);

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes!');
  console.log('   Vérifiez VITE_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY dans .env');
  process.exit(1);
}

// Client admin avec service_role key
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function fixSupabaseDatabase() {
  console.log('\n🔧 === CORRECTION BASE DE DONNÉES SUPABASE ===\n');
  
  try {
    // 1. Vérifier les packs existants
    console.log('📦 1. Vérification des packs existants...');
    
    const { data: existingPacks, error: packsError } = await supabaseAdmin
      .from('packs')
      .select('id, name, price, description')
      .order('sort_order', { ascending: true });
    
    if (packsError) {
      console.error('❌ Erreur lecture packs:', packsError);
      return;
    }
    
    console.log(`   Packs trouvés: ${existingPacks?.length || 0}`);
    existingPacks?.forEach(pack => {
      console.log(`   - ${pack.name}: ${pack.price} FCFA (${pack.id})`);
    });
    
    if (!existingPacks || existingPacks.length === 0) {
      console.log('   ⚠️  Aucun pack trouvé - ils devraient être créés par les migrations');
      return;
    }
    
    // 2. Vérifier les utilisateurs
    console.log('\n👤 2. Vérification des utilisateurs...');
    
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, email, selected_pack, created_at')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (usersError) {
      console.error('❌ Erreur lecture utilisateurs:', usersError);
      return;
    }
    
    console.log(`   Utilisateurs trouvés: ${users?.length || 0}`);
    users?.forEach(user => {
      console.log(`   - ${user.email}: pack=${user.selected_pack || 'AUCUN'}`);
    });
    
    // 3. Vérifier les user_packs (abonnements)
    console.log('\n💳 3. Vérification des abonnements (user_packs)...');
    
    const { data: userPacks, error: userPacksError } = await supabaseAdmin
      .from('user_packs')
      .select(`
        id, 
        user_id, 
        pack_id, 
        status, 
        started_at,
        users!inner(email),
        packs!inner(name)
      `)
      .eq('status', 'active')
      .order('started_at', { ascending: false })
      .limit(10);
    
    if (userPacksError) {
      console.error('❌ Erreur lecture user_packs:', userPacksError);
    } else {
      console.log(`   Abonnements actifs: ${userPacks?.length || 0}`);
      userPacks?.forEach(up => {
        console.log(`   - ${up.users.email}: ${up.packs.name} (${up.status})`);
      });
    }
    
    // 4. Corriger les utilisateurs sans pack
    console.log('\n🔄 4. Correction des utilisateurs sans pack...');
    
    if (users && existingPacks) {
      const usersWithoutPack = users.filter(u => !u.selected_pack);
      const defaultPack = existingPacks.find(p => p.name === 'Pack Découverte');
      
      if (usersWithoutPack.length > 0 && defaultPack) {
        console.log(`   Assignation du Pack Découverte à ${usersWithoutPack.length} utilisateur(s)...`);
        
        for (const user of usersWithoutPack) {
          // Mettre à jour selected_pack dans users
          const { error: updateUserError } = await supabaseAdmin
            .from('users')
            .update({ 
              selected_pack: defaultPack.id,
              updated_at: new Date().toISOString()
            })
            .eq('id', user.id);
          
          if (updateUserError) {
            console.error(`❌ Erreur mise à jour user ${user.email}:`, updateUserError);
            continue;
          }
          
          // Créer un user_pack actif
          const { error: createPackError } = await supabaseAdmin
            .from('user_packs')
            .insert({
              user_id: user.id,
              pack_id: defaultPack.id,
              status: 'active',
              started_at: new Date().toISOString()
            });
          
          if (createPackError) {
            console.error(`❌ Erreur création user_pack ${user.email}:`, createPackError);
          } else {
            console.log(`✅ Pack assigné à ${user.email}`);
          }
        }
      } else if (usersWithoutPack.length > 0) {
        console.log('   ⚠️  Utilisateurs sans pack trouvés mais pas de Pack Découverte disponible');
      } else {
        console.log('   ✅ Tous les utilisateurs ont un pack assigné');
      }
    }
    
    // 5. Synchroniser selected_pack avec user_packs actifs
    console.log('\n🔄 5. Synchronisation selected_pack avec user_packs...');
    
    if (users && userPacks) {
      for (const user of users) {
        const activePack = userPacks.find(up => up.user_id === user.id && up.status === 'active');
        
        if (activePack && user.selected_pack !== activePack.pack_id) {
          console.log(`   Synchronisation ${user.email}: ${user.selected_pack} → ${activePack.pack_id}`);
          
          const { error: syncError } = await supabaseAdmin
            .from('users')
            .update({ 
              selected_pack: activePack.pack_id,
              updated_at: new Date().toISOString()
            })
            .eq('id', user.id);
          
          if (syncError) {
            console.error(`❌ Erreur synchronisation ${user.email}:`, syncError);
          } else {
            console.log(`✅ Synchronisé ${user.email}`);
          }
        }
      }
    }
    
    // 6. Vérifier les politiques RLS
    console.log('\n🔒 6. Test des politiques RLS...');
    
    const supabaseAnon = createClient(supabaseUrl, process.env.VITE_SUPABASE_ANON_KEY);
    
    // Test lecture packs (doit fonctionner)
    const { data: anonPacks, error: anonPacksError } = await supabaseAnon
      .from('packs')
      .select('id, name, price')
      .limit(1);
    
    if (anonPacksError) {
      console.error('❌ Politiques RLS packs trop restrictives:', anonPacksError);
    } else {
      console.log('✅ Politiques RLS packs: OK');
    }
    
    // 7. Rapport final
    console.log('\n📊 === RAPPORT FINAL ===');
    
    // Recompter après corrections
    const { data: finalPacks } = await supabaseAdmin.from('packs').select('id');
    const { data: finalUsers } = await supabaseAdmin.from('users').select('id, selected_pack');
    const { data: finalUserPacks } = await supabaseAdmin.from('user_packs').select('id').eq('status', 'active');
    
    const usersWithPacks = finalUsers?.filter(u => u.selected_pack) || [];
    
    console.log(`   📦 Packs disponibles: ${finalPacks?.length || 0}`);
    console.log(`   👤 Utilisateurs total: ${finalUsers?.length || 0}`);
    console.log(`   ✅ Utilisateurs avec pack: ${usersWithPacks.length}`);
    console.log(`   💳 Abonnements actifs: ${finalUserPacks?.length || 0}`);
    
    if (usersWithPacks.length === finalUsers?.length) {
      console.log('\n🎉 ✅ SUCCÈS: Tous les utilisateurs ont un pack assigné!');
    } else {
      console.log(`\n⚠️  ${(finalUsers?.length || 0) - usersWithPacks.length} utilisateur(s) sans pack`);
    }
    
    console.log('\n🎯 Prochaines étapes:');
    console.log('   1. Redémarrez votre application frontend');
    console.log('   2. Connectez-vous avec un utilisateur');
    console.log('   3. Testez le changement de pack');
    console.log('   4. Vérifiez que l\'affichage se met à jour correctement');
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécution
async function main() {
  await fixSupabaseDatabase();
  console.log('\n✅ Correction Supabase terminée');
}

main().catch(console.error);