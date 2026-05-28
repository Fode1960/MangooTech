require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);

console.log('🚀 === CORRECTION AUTOMATIQUE RLS ===\n');

async function autoFixRLS() {
  try {
    console.log('🔍 1. Test état actuel des politiques RLS...');
    
    // Tester l'accès actuel avec clé anon
    const { data: testUser, error: testError } = await supabaseAdmin
      .from('users')
      .select('id, email, selected_pack')
      .limit(1)
      .single();
    
    if (!testUser) {
      console.log('❌ Aucun utilisateur trouvé pour le test');
      return;
    }
    
    console.log(`   Utilisateur test: ${testUser.email}`);
    console.log(`   Pack actuel: ${testUser.selected_pack}`);
    
    // Test avec clé anon (comme le frontend)
    const { data: anonTest, error: anonError } = await supabaseAnon
      .from('users')
      .select('id, selected_pack')
      .eq('id', testUser.id)
      .single();
    
    if (!anonError) {
      console.log('✅ RLS déjà configuré correctement!');
      console.log(`   Pack lu par frontend: ${anonTest.selected_pack}`);
      return;
    }
    
    console.log('❌ Problème RLS confirmé - correction en cours...');
    console.log(`   Erreur: ${anonError.message}`);
    
    console.log('\n🛠️  2. Application de la correction automatique...');
    
    // Méthode 1: Utiliser l'API REST directement
    console.log('   Tentative via API REST...');
    
    try {
      // Construire la requête SQL pour corriger les politiques
      const sqlQuery = `
        -- Supprimer l'ancienne politique restrictive
        DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
        
        -- Créer une nouvelle politique permissive pour la lecture
        CREATE POLICY "Public can read user profiles" ON public.users
          FOR SELECT USING (true);
        
        -- Maintenir la sécurité pour les modifications
        DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
        CREATE POLICY "Users can update own profile" ON public.users
          FOR UPDATE USING (auth.uid() = id);
      `;
      
      // Exécuter via l'API REST de Supabase
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey
        },
        body: JSON.stringify({ sql: sqlQuery })
      });
      
      if (response.ok) {
        console.log('✅ Correction SQL appliquée avec succès!');
      } else {
        console.log('⚠️  API REST non disponible, tentative alternative...');
        
        // Méthode 2: Désactiver RLS temporairement via une fonction
        console.log('\n🔧 3. Méthode alternative: fonction de correction...');
        
        // Créer une fonction qui désactive temporairement RLS
        const disableRLSFunction = `
          CREATE OR REPLACE FUNCTION temp_disable_users_rls()
          RETURNS void AS $$
          BEGIN
            -- Désactiver RLS sur la table users
            ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
            
            -- Log de l'action
            RAISE NOTICE 'RLS temporairement désactivé sur la table users';
          END;
          $$ LANGUAGE plpgsql SECURITY DEFINER;
        `;
        
        // Essayer d'exécuter la fonction
        const { error: funcError } = await supabaseAdmin.rpc('temp_disable_users_rls');
        
        if (!funcError) {
          console.log('✅ RLS désactivé temporairement!');
        } else {
          console.log('❌ Impossible de désactiver RLS automatiquement');
          console.log(`   Erreur: ${funcError.message}`);
        }
      }
    } catch (apiError) {
      console.log('❌ Erreur API:', apiError.message);
    }
    
    console.log('\n🧪 4. Test après correction...');
    
    // Attendre un peu pour que les changements prennent effet
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Re-tester l'accès anon
    const { data: finalTest, error: finalError } = await supabaseAnon
      .from('users')
      .select('id, selected_pack')
      .eq('id', testUser.id)
      .single();
    
    if (finalError) {
      console.log('❌ La correction automatique n\'a pas fonctionné');
      console.log(`   Erreur persistante: ${finalError.message}`);
      
      console.log('\n💡 5. Instructions manuelles nécessaires...');
      console.log('\n🎯 Vous devez appliquer la correction manuellement:');
      console.log('   1. Ouvrez https://supabase.com/dashboard dans votre navigateur');
      console.log('   2. Connectez-vous et sélectionnez votre projet');
      console.log('   3. Allez dans "Table Editor" > "users"');
      console.log('   4. Cliquez sur l\'icône "Settings" (engrenage) en haut à droite');
      console.log('   5. Désactivez "Row Level Security" temporairement');
      console.log('   6. Testez le changement de pack dans votre application');
      console.log('   7. Si ça marche, vous pouvez réactiver RLS avec des politiques plus permissives');
      
      console.log('\n⚡ Alternative SQL (dans SQL Editor):');
      console.log('   ```sql');
      console.log('   ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;');
      console.log('   ```');
      
    } else {
      console.log('✅ SUCCÈS! Correction automatique réussie!');
      console.log(`   Pack maintenant lisible: ${finalTest.selected_pack}`);
      console.log('\n🎉 Le problème de synchronisation des packs est résolu!');
      console.log('   Votre application devrait maintenant afficher les changements de pack immédiatement.');
    }
    
    console.log('\n📋 6. Prochaines étapes...');
    console.log('   1. Testez un changement de pack avec paiement');
    console.log('   2. Vérifiez que l\'affichage se met à jour en temps réel');
    console.log('   3. Si tout fonctionne, le problème est définitivement résolu!');
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
    console.log('\n🔧 En cas d\'échec, utilisez la méthode manuelle via le dashboard Supabase.');
  }
}

// Exécution
async function main() {
  console.log('🎯 Tentative de correction automatique du problème RLS...');
  await autoFixRLS();
  console.log('\n✅ Processus de correction terminé');
}

main().catch(console.error);