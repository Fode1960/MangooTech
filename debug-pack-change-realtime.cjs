require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);

console.log('🔍 === DIAGNOSTIC TEMPS RÉEL CHANGEMENT DE PACK ===\n');

async function debugPackChangeRealtime() {
  try {
    // 1. Identifier l'utilisateur de test
    console.log('👤 1. Recherche d\'un utilisateur de test...');
    
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, email, selected_pack, created_at')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (usersError || !users || users.length === 0) {
      console.error('❌ Aucun utilisateur trouvé:', usersError);
      return;
    }
    
    const testUser = users[0]; // Prendre le plus récent
    console.log(`   Utilisateur de test: ${testUser.email}`);
    console.log(`   Pack actuel: ${testUser.selected_pack}`);
    
    // 2. Vérifier les packs disponibles
    console.log('\n📦 2. Packs disponibles...');
    
    const { data: packs, error: packsError } = await supabaseAdmin
      .from('packs')
      .select('id, name, price')
      .order('sort_order', { ascending: true });
    
    if (packsError) {
      console.error('❌ Erreur lecture packs:', packsError);
      return;
    }
    
    console.log('   Packs disponibles:');
    packs.forEach((pack, index) => {
      const current = pack.id === testUser.selected_pack ? ' ← ACTUEL' : '';
      console.log(`   ${index + 1}. ${pack.name} (${pack.id}) - ${pack.price} FCFA${current}`);
    });
    
    // 3. Choisir un pack différent pour le test
    const targetPack = packs.find(p => p.id !== testUser.selected_pack);
    if (!targetPack) {
      console.log('⚠️  Aucun pack différent disponible pour le test');
      return;
    }
    
    console.log(`\n🎯 3. Test de changement vers: ${targetPack.name} (${targetPack.id})`);
    
    // 4. État AVANT le changement
    console.log('\n📊 4. État AVANT changement...');
    await logUserState(testUser.id, 'AVANT');
    
    // 5. Simuler le changement de pack (comme après paiement)
    console.log('\n🔄 5. Simulation du changement de pack...');
    
    // Étape 5a: Mettre à jour selected_pack dans users
    const { error: updateUserError } = await supabaseAdmin
      .from('users')
      .update({ 
        selected_pack: targetPack.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', testUser.id);
    
    if (updateUserError) {
      console.error('❌ Erreur mise à jour users:', updateUserError);
      return;
    }
    console.log('✅ selected_pack mis à jour dans users');
    
    // Étape 5b: Désactiver l'ancien user_pack
    const { error: deactivateError } = await supabaseAdmin
      .from('user_packs')
      .update({ 
        status: 'cancelled',
        ended_at: new Date().toISOString()
      })
      .eq('user_id', testUser.id)
      .eq('status', 'active');
    
    if (deactivateError) {
      console.error('❌ Erreur désactivation ancien pack:', deactivateError);
    } else {
      console.log('✅ Ancien user_pack désactivé');
    }
    
    // Étape 5c: Créer le nouveau user_pack
    const { error: createPackError } = await supabaseAdmin
      .from('user_packs')
      .insert({
        user_id: testUser.id,
        pack_id: targetPack.id,
        status: 'active',
        started_at: new Date().toISOString()
      });
    
    if (createPackError) {
      console.error('❌ Erreur création nouveau pack:', createPackError);
    } else {
      console.log('✅ Nouveau user_pack créé');
    }
    
    // 6. État APRÈS le changement
    console.log('\n📊 6. État APRÈS changement...');
    await logUserState(testUser.id, 'APRÈS');
    
    // 7. Test de lecture avec clé anon (comme le frontend)
    console.log('\n🔍 7. Test lecture frontend (clé anon)...');
    
    const { data: frontendUser, error: frontendError } = await supabaseAnon
      .from('users')
      .select('id, email, selected_pack')
      .eq('id', testUser.id)
      .single();
    
    if (frontendError) {
      console.error('❌ Erreur lecture frontend:', frontendError);
      console.log('   → Problème de politique RLS!');
    } else {
      console.log(`   Frontend voit: ${frontendUser.selected_pack}`);
      if (frontendUser.selected_pack === targetPack.id) {
        console.log('✅ Frontend voit le bon pack!');
      } else {
        console.log('❌ Frontend voit encore l\'ancien pack!');
      }
    }
    
    // 8. Test des packs avec jointure
    console.log('\n🔗 8. Test lecture pack avec jointure...');
    
    const { data: userWithPack, error: joinError } = await supabaseAnon
      .from('users')
      .select(`
        id,
        email,
        selected_pack,
        packs!inner(id, name, price)
      `)
      .eq('id', testUser.id)
      .single();
    
    if (joinError) {
      console.error('❌ Erreur jointure:', joinError);
    } else {
      console.log(`   Pack joint: ${userWithPack.packs.name}`);
    }
    
    // 9. Recommandations
    console.log('\n💡 9. Diagnostic et recommandations...');
    
    if (frontendError) {
      console.log('🔴 PROBLÈME CRITIQUE: Politique RLS trop restrictive');
      console.log('   → Le frontend ne peut pas lire les données utilisateur');
      console.log('   → Vérifiez les politiques RLS sur la table users');
    } else if (frontendUser.selected_pack !== targetPack.id) {
      console.log('🔴 PROBLÈME: Cache ou synchronisation');
      console.log('   → La base de données est mise à jour mais le frontend ne voit pas le changement');
      console.log('   → Possible problème de cache côté client ou serveur');
    } else {
      console.log('✅ SUCCÈS: Le changement de pack fonctionne correctement');
    }
    
    console.log('\n🎯 Actions recommandées:');
    console.log('   1. Vérifiez les politiques RLS sur la table users');
    console.log('   2. Videz le cache du navigateur (Ctrl+Shift+R)');
    console.log('   3. Vérifiez que le frontend recharge les données après paiement');
    console.log('   4. Testez avec un utilisateur réel connecté');
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

async function logUserState(userId, moment) {
  try {
    // État dans users
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('selected_pack, updated_at')
      .eq('id', userId)
      .single();
    
    // État dans user_packs
    const { data: userPacks } = await supabaseAdmin
      .from('user_packs')
      .select('pack_id, status, started_at, ended_at')
      .eq('user_id', userId)
      .order('started_at', { ascending: false });
    
    console.log(`   ${moment}:`);
    console.log(`     users.selected_pack: ${user?.selected_pack}`);
    console.log(`     users.updated_at: ${user?.updated_at}`);
    console.log(`     user_packs actifs: ${userPacks?.filter(up => up.status === 'active').length || 0}`);
    
    userPacks?.slice(0, 3).forEach((up, index) => {
      console.log(`     user_pack ${index + 1}: ${up.pack_id} (${up.status})`);
    });
    
  } catch (error) {
    console.error(`❌ Erreur log état ${moment}:`, error);
  }
}

// Exécution
async function main() {
  await debugPackChangeRealtime();
  console.log('\n✅ Diagnostic temps réel terminé');
}

main().catch(console.error);