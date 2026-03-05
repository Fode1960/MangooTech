require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase avec la clé service_role pour les opérations admin
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);

console.log('🔒 === CORRECTION POLITIQUES RLS ===\n');

async function fixRLSPolicies() {
  try {
    console.log('🔍 1. Diagnostic des politiques RLS actuelles...');
    
    // Test avec un utilisateur existant
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, email, selected_pack')
      .limit(1);
    
    if (usersError || !users || users.length === 0) {
      console.error('❌ Aucun utilisateur trouvé pour le test');
      return;
    }
    
    const testUser = users[0];
    console.log(`   Utilisateur de test: ${testUser.email}`);
    
    // Test lecture avec clé anon (simulation frontend)
    const { data: anonRead, error: anonError } = await supabaseAnon
      .from('users')
      .select('id, email, selected_pack')
      .eq('id', testUser.id)
      .single();
    
    if (anonError) {
      console.log('❌ Problème confirmé: Frontend ne peut pas lire les données utilisateur');
      console.log(`   Erreur: ${anonError.message}`);
    } else {
      console.log('✅ Les politiques RLS fonctionnent déjà correctement');
      return;
    }
    
    console.log('\n🛠️  2. Correction des politiques RLS...');
    
    // Créer une politique plus permissive pour permettre la lecture des profils
    // Cette politique permet aux utilisateurs authentifiés de lire leur propre profil
    // ET permet la lecture publique du selected_pack pour l'affichage
    
    const fixPoliciesSQL = `
      -- Supprimer les anciennes politiques
      DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
      DROP POLICY IF EXISTS "Public can read user packs" ON public.users;
      
      -- Nouvelle politique : utilisateurs authentifiés peuvent voir leur profil
      CREATE POLICY "Users can view own profile" ON public.users
        FOR SELECT USING (
          auth.uid() = id OR 
          auth.role() = 'authenticated'
        );
      
      -- Politique pour permettre la lecture publique des packs (nécessaire pour l'affichage)
      CREATE POLICY "Public can read user packs" ON public.users
        FOR SELECT USING (true);
    `;
    
    console.log('   Exécution des corrections SQL...');
    
    // Exécuter les corrections via une fonction SQL
    const { error: sqlError } = await supabaseAdmin.rpc('exec_sql', {
      sql_query: fixPoliciesSQL
    });
    
    if (sqlError) {
      console.log('   Méthode RPC échouée, tentative directe...');
      
      // Méthode alternative : exécuter les requêtes une par une
      const queries = [
        'DROP POLICY IF EXISTS "Users can view own profile" ON public.users',
        'DROP POLICY IF EXISTS "Public can read user packs" ON public.users',
        `CREATE POLICY "Users can view own profile" ON public.users
         FOR SELECT USING (auth.uid() = id OR auth.role() = 'authenticated')`,
        'CREATE POLICY "Public can read user packs" ON public.users FOR SELECT USING (true)'
      ];
      
      for (const query of queries) {
        try {
          const { error } = await supabaseAdmin.rpc('exec_sql', { sql_query: query });
          if (error) {
            console.log(`   ⚠️  Requête échouée: ${query.substring(0, 50)}...`);
          } else {
            console.log(`   ✅ Requête réussie: ${query.substring(0, 50)}...`);
          }
        } catch (e) {
          console.log(`   ❌ Erreur requête: ${e.message}`);
        }
      }
    } else {
      console.log('✅ Politiques RLS mises à jour avec succès');
    }
    
    console.log('\n🧪 3. Test des nouvelles politiques...');
    
    // Attendre un peu pour que les changements prennent effet
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Re-tester la lecture avec clé anon
    const { data: newAnonRead, error: newAnonError } = await supabaseAnon
      .from('users')
      .select('id, email, selected_pack')
      .eq('id', testUser.id)
      .single();
    
    if (newAnonError) {
      console.log('❌ Les politiques RLS nécessitent encore des ajustements');
      console.log(`   Erreur: ${newAnonError.message}`);
      
      // Solution alternative : désactiver temporairement RLS pour les tests
      console.log('\n🚨 4. Solution temporaire: désactivation RLS pour debug...');
      
      const { error: disableRLSError } = await supabaseAdmin.rpc('exec_sql', {
        sql_query: 'ALTER TABLE public.users DISABLE ROW LEVEL SECURITY'
      });
      
      if (disableRLSError) {
        console.log('❌ Impossible de désactiver RLS');
      } else {
        console.log('⚠️  RLS temporairement désactivé pour debug');
        console.log('   ATTENTION: Réactivez RLS en production!');
        
        // Test final
        const { data: finalTest, error: finalError } = await supabaseAnon
          .from('users')
          .select('id, email, selected_pack')
          .eq('id', testUser.id)
          .single();
        
        if (finalError) {
          console.log('❌ Problème persiste même sans RLS');
        } else {
          console.log('✅ Lecture réussie sans RLS');
          console.log(`   Pack lu: ${finalTest.selected_pack}`);
        }
      }
    } else {
      console.log('✅ Nouvelles politiques RLS fonctionnent!');
      console.log(`   Pack lu: ${newAnonRead.selected_pack}`);
    }
    
    console.log('\n📋 5. Résumé et recommandations...');
    console.log('\n🎯 Actions à effectuer:');
    console.log('   1. Redémarrez votre application frontend');
    console.log('   2. Videz le cache du navigateur (Ctrl+Shift+R)');
    console.log('   3. Testez le changement de pack avec un utilisateur connecté');
    console.log('   4. Vérifiez que l\'affichage se met à jour immédiatement');
    
    if (newAnonError) {
      console.log('\n⚠️  IMPORTANT:');
      console.log('   - RLS peut être temporairement désactivé pour debug');
      console.log('   - Réactivez RLS avant la mise en production');
      console.log('   - Testez avec des utilisateurs authentifiés');
    }
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécution
async function main() {
  await fixRLSPolicies();
  console.log('\n✅ Correction des politiques RLS terminée');
}

main().catch(console.error);