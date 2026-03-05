require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase avec les vraies variables d'environnement
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🔧 Configuration Supabase:');
console.log(`   URL: ${supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'NON DÉFINIE'}`);
console.log(`   Key: ${supabaseKey ? supabaseKey.substring(0, 20) + '...' : 'NON DÉFINIE'}`);

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes!');
  console.log('   Vérifiez que VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY sont définies dans .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifySupabasePackState() {
  console.log('\n🔍 === VÉRIFICATION ÉTAT SUPABASE ===\n');
  
  try {
    // Test de connexion basique
    console.log('🔌 Test de connexion Supabase...');
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.error('❌ Erreur de connexion:', testError);
      return;
    }
    console.log('✅ Connexion Supabase réussie');
    
    // 1. Vérifier les utilisateurs et leurs packs
    console.log('\n📊 1. État des utilisateurs et packs:');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, selected_pack, created_at, updated_at')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (usersError) {
      console.error('❌ Erreur utilisateurs:', usersError);
    } else {
      console.log(`   Nombre d'utilisateurs: ${users?.length || 0}`);
      users?.forEach(user => {
        console.log(`   - ${user.email}: pack=${user.selected_pack || 'AUCUN'}, updated=${user.updated_at}`);
      });
    }
    
    // 2. Vérifier les abonnements actifs
    console.log('\n💳 2. Abonnements actifs:');
    const { data: subscriptions, error: subsError } = await supabase
      .from('subscriptions')
      .select('user_id, pack_id, status, created_at, updated_at')
      .eq('status', 'active')
      .order('updated_at', { ascending: false })
      .limit(10);
    
    if (subsError) {
      console.error('❌ Erreur abonnements:', subsError);
      console.log('   ℹ️  La table subscriptions n\'existe peut-être pas encore');
    } else {
      console.log(`   Nombre d'abonnements actifs: ${subscriptions?.length || 0}`);
      subscriptions?.forEach(sub => {
        console.log(`   - User ${sub.user_id}: pack=${sub.pack_id}, status=${sub.status}`);
      });
    }
    
    // 3. Vérifier les packs disponibles
    console.log('\n📦 3. Packs disponibles:');
    const { data: packs, error: packsError } = await supabase
      .from('packs')
      .select('id, name, price, features')
      .order('price', { ascending: true });
    
    if (packsError) {
      console.error('❌ Erreur packs:', packsError);
    } else {
      console.log(`   Nombre de packs: ${packs?.length || 0}`);
      packs?.forEach(pack => {
        console.log(`   - ${pack.name} (${pack.id}): ${pack.price}€`);
      });
    }
    
    // 4. Vérifier les transactions récentes
    console.log('\n💰 4. Transactions récentes:');
    const { data: transactions, error: transError } = await supabase
      .from('transactions')
      .select('user_id, pack_id, amount, status, created_at')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (transError) {
      console.error('❌ Erreur transactions:', transError);
      console.log('   ℹ️  La table transactions n\'existe peut-être pas encore');
    } else {
      console.log(`   Nombre de transactions récentes: ${transactions?.length || 0}`);
      transactions?.forEach(trans => {
        console.log(`   - User ${trans.user_id}: pack=${trans.pack_id}, amount=${trans.amount}€, status=${trans.status}`);
      });
    }
    
    // 5. Vérifier la cohérence des données
    console.log('\n🔍 5. Analyse de cohérence:');
    
    if (users && subscriptions) {
      const usersWithPacks = users.filter(u => u.selected_pack);
      const usersWithSubs = new Set(subscriptions.map(s => s.user_id));
      
      console.log(`   - Utilisateurs avec selected_pack: ${usersWithPacks.length}`);
      console.log(`   - Utilisateurs avec abonnement actif: ${usersWithSubs.size}`);
      
      // Vérifier les incohérences
      const inconsistencies = [];
      users?.forEach(user => {
        const hasSelectedPack = !!user.selected_pack;
        const hasActiveSub = usersWithSubs.has(user.id);
        
        if (hasSelectedPack && !hasActiveSub) {
          inconsistencies.push(`${user.email}: a selected_pack mais pas d'abonnement actif`);
        }
        if (!hasSelectedPack && hasActiveSub) {
          inconsistencies.push(`${user.email}: a un abonnement actif mais pas de selected_pack`);
        }
      });
      
      if (inconsistencies.length > 0) {
        console.log('\n⚠️  Incohérences détectées:');
        inconsistencies.forEach(inc => console.log(`   - ${inc}`));
      } else {
        console.log('   ✅ Aucune incohérence détectée');
      }
    }
    
    // 6. Vérifier les tables existantes
    console.log('\n🗄️  6. Tables disponibles:');
    const tables = ['users', 'packs', 'subscriptions', 'transactions'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`   ❌ ${table}: ${error.message}`);
        } else {
          console.log(`   ✅ ${table}: accessible`);
        }
      } catch (err) {
        console.log(`   ❌ ${table}: erreur de connexion`);
      }
    }
    
    // 7. Recommandations
    console.log('\n💡 7. Diagnostic et recommandations:');
    
    if (!users || users.length === 0) {
      console.log('   ⚠️  PROBLÈME: Aucun utilisateur trouvé');
      console.log('       → Vérifiez les politiques RLS sur la table users');
      console.log('       → Connectez-vous avec un utilisateur authentifié');
    }
    
    if (!packs || packs.length === 0) {
      console.log('   ⚠️  PROBLÈME: Aucun pack configuré');
      console.log('       → Créez les packs dans la table packs');
      console.log('       → Vérifiez les migrations Supabase');
    }
    
    const usersWithoutPack = users?.filter(u => !u.selected_pack) || [];
    if (usersWithoutPack.length > 0) {
      console.log(`   ⚠️  PROBLÈME: ${usersWithoutPack.length} utilisateur(s) sans pack`);
      console.log('       → Assignez un pack par défaut');
      console.log('       → Vérifiez le processus d\'onboarding');
    }
    
    console.log('\n🔧 Actions immédiates suggérées:');
    console.log('   1. Vérifiez que vous êtes connecté en tant qu\'utilisateur');
    console.log('   2. Contrôlez les politiques RLS dans le dashboard Supabase');
    console.log('   3. Vérifiez que les packs sont créés dans la base');
    console.log('   4. Testez le changement de pack depuis l\'interface');
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
    console.log('\n🔧 Vérifications à faire:');
    console.log('   1. Connexion réseau à Supabase');
    console.log('   2. Validité des clés API');
    console.log('   3. Configuration des politiques de sécurité');
  }
}

// Exécution
async function main() {
  await verifySupabasePackState();
  console.log('\n✅ Vérification Supabase terminée');
}

main().catch(console.error);