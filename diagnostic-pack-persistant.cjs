const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Configuration Supabase
const supabaseUrl = 'https://wnlqjqxqjqjqjqjq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnosticPackPersistant() {
  console.log('🔍 DIAGNOSTIC PACK PERSISTANT - PROBLÈME RÉCURRENT');
  console.log('=' .repeat(60));
  
  const rapport = {
    timestamp: new Date().toISOString(),
    probleme: 'Pack reste sur découverte après paiement réussi',
    etapes: [],
    solutions: []
  };

  try {
    // 1. Vérifier l'état actuel des utilisateurs avec pack découverte
    console.log('\n1️⃣ ANALYSE DES UTILISATEURS AVEC PACK DÉCOUVERTE');
    const { data: usersDecouverte, error: errorUsers } = await supabase
      .from('users')
      .select('id, email, selected_pack, created_at, updated_at')
      .eq('selected_pack', 'decouverte');
    
    if (errorUsers) {
      console.error('❌ Erreur lecture users:', errorUsers);
      rapport.etapes.push({ etape: 'lecture_users', status: 'erreur', details: errorUsers.message });
    } else {
      console.log(`📊 ${usersDecouverte.length} utilisateurs avec pack découverte`);
      usersDecouverte.forEach(user => {
        console.log(`   - ${user.email}: pack=${user.selected_pack}, maj=${user.updated_at}`);
      });
      rapport.etapes.push({ etape: 'lecture_users', status: 'ok', count: usersDecouverte.length });
    }

    // 2. Vérifier les transactions récentes
    console.log('\n2️⃣ ANALYSE DES TRANSACTIONS RÉCENTES');
    const { data: transactions, error: errorTrans } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (errorTrans) {
      console.error('❌ Erreur lecture transactions:', errorTrans);
      rapport.etapes.push({ etape: 'lecture_transactions', status: 'erreur', details: errorTrans.message });
    } else {
      console.log(`💳 ${transactions.length} transactions récentes:`);
      transactions.forEach(trans => {
        console.log(`   - ${trans.user_id}: ${trans.status} - ${trans.pack_type} (${trans.created_at})`);
      });
      rapport.etapes.push({ etape: 'lecture_transactions', status: 'ok', count: transactions.length });
    }

    // 3. Vérifier les politiques RLS sur la table users
    console.log('\n3️⃣ VÉRIFICATION DES POLITIQUES RLS');
    const { data: policies, error: errorPolicies } = await supabase
      .rpc('get_table_policies', { table_name: 'users' })
      .catch(() => ({ data: null, error: 'RPC non disponible' }));
    
    if (errorPolicies || !policies) {
      console.log('⚠️  Impossible de vérifier les politiques RLS automatiquement');
      rapport.etapes.push({ etape: 'verification_rls', status: 'manuel_requis' });
    } else {
      console.log('🔒 Politiques RLS détectées:', policies.length);
      rapport.etapes.push({ etape: 'verification_rls', status: 'ok', count: policies.length });
    }

    // 4. Test de mise à jour directe
    console.log('\n4️⃣ TEST DE MISE À JOUR DIRECTE');
    const testUserId = usersDecouverte[0]?.id;
    if (testUserId) {
      console.log(`🧪 Test de mise à jour pour l'utilisateur: ${testUserId}`);
      
      // Tentative de mise à jour avec service key
      const { data: updateResult, error: updateError } = await supabase
        .from('users')
        .update({ selected_pack: 'premium' })
        .eq('id', testUserId)
        .select();
      
      if (updateError) {
        console.error('❌ Échec mise à jour:', updateError);
        rapport.etapes.push({ 
          etape: 'test_mise_a_jour', 
          status: 'echec', 
          details: updateError.message,
          cause_probable: 'Politiques RLS trop restrictives'
        });
      } else {
        console.log('✅ Mise à jour réussie:', updateResult);
        rapport.etapes.push({ etape: 'test_mise_a_jour', status: 'reussi' });
        
        // Rollback
        await supabase
          .from('users')
          .update({ selected_pack: 'decouverte' })
          .eq('id', testUserId);
        console.log('🔄 Rollback effectué');
      }
    }

    // 5. Vérifier les webhooks Stripe récents
    console.log('\n5️⃣ ANALYSE DES LOGS WEBHOOKS');
    try {
      const { data: webhookLogs } = await supabase
        .from('webhook_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5)
        .catch(() => ({ data: [] }));
      
      if (webhookLogs && webhookLogs.length > 0) {
        console.log(`📡 ${webhookLogs.length} webhooks récents:`);
        webhookLogs.forEach(log => {
          console.log(`   - ${log.event_type}: ${log.status} (${log.created_at})`);
        });
        rapport.etapes.push({ etape: 'analyse_webhooks', status: 'ok', count: webhookLogs.length });
      } else {
        console.log('⚠️  Aucun log webhook trouvé');
        rapport.etapes.push({ etape: 'analyse_webhooks', status: 'aucun_log' });
      }
    } catch (e) {
      console.log('⚠️  Table webhook_logs non accessible');
    }

    // GÉNÉRATION DES SOLUTIONS
    console.log('\n🔧 SOLUTIONS RECOMMANDÉES');
    console.log('=' .repeat(40));
    
    const solutions = [];
    
    // Solution 1: Correction RLS immédiate
    solutions.push({
      priorite: 1,
      titre: 'Correction RLS immédiate',
      description: 'Désactiver temporairement RLS sur table users',
      commandes: [
        'ALTER TABLE users DISABLE ROW LEVEL SECURITY;',
        '-- Tester le changement de pack',
        'ALTER TABLE users ENABLE ROW LEVEL SECURITY;'
      ]
    });
    
    // Solution 2: Politique RLS permissive
    solutions.push({
      priorite: 2,
      titre: 'Politique RLS permissive',
      description: 'Créer une politique permettant la lecture/écriture',
      commandes: [
        'DROP POLICY IF EXISTS "Users can read own data" ON users;',
        'CREATE POLICY "Users can manage own data" ON users FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);'
      ]
    });
    
    // Solution 3: Fonction de mise à jour sécurisée
    solutions.push({
      priorite: 3,
      titre: 'Fonction de mise à jour sécurisée',
      description: 'Créer une fonction RPC pour la mise à jour du pack',
      commandes: [
        `CREATE OR REPLACE FUNCTION update_user_pack(user_id UUID, new_pack TEXT)`,
        `RETURNS BOOLEAN AS $$`,
        `BEGIN`,
        `  UPDATE users SET selected_pack = new_pack WHERE id = user_id;`,
        `  RETURN FOUND;`,
        `END;`,
        `$$ LANGUAGE plpgsql SECURITY DEFINER;`
      ]
    });
    
    solutions.forEach((sol, index) => {
      console.log(`\n${sol.priorite}. ${sol.titre}`);
      console.log(`   ${sol.description}`);
      console.log('   Commandes SQL:');
      sol.commandes.forEach(cmd => console.log(`     ${cmd}`));
    });
    
    rapport.solutions = solutions;
    
    // Sauvegarde du rapport
    fs.writeFileSync('diagnostic-pack-persistant-rapport.json', JSON.stringify(rapport, null, 2));
    console.log('\n📄 Rapport sauvegardé: diagnostic-pack-persistant-rapport.json');
    
    // ACTIONS IMMÉDIATES
    console.log('\n⚡ ACTIONS IMMÉDIATES RECOMMANDÉES');
    console.log('=' .repeat(45));
    console.log('1. Ouvrir le dashboard Supabase');
    console.log('2. Aller dans SQL Editor');
    console.log('3. Exécuter: ALTER TABLE users DISABLE ROW LEVEL SECURITY;');
    console.log('4. Tester un changement de pack');
    console.log('5. Si ça marche, réactiver avec: ALTER TABLE users ENABLE ROW LEVEL SECURITY;');
    console.log('6. Créer une politique plus permissive');
    
    console.log('\n✅ DIAGNOSTIC TERMINÉ - Consultez le rapport JSON pour les détails');
    
  } catch (error) {
    console.error('💥 Erreur critique:', error);
    rapport.erreur_critique = error.message;
    fs.writeFileSync('diagnostic-pack-persistant-rapport.json', JSON.stringify(rapport, null, 2));
  }
}

// Exécution
diagnosticPackPersistant().catch(console.error);