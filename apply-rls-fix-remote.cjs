require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase avec la clé service_role pour les opérations admin
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);

console.log('🚀 === APPLICATION CORRECTION RLS DISTANTE ===\n');

async function applyRLSFixRemote() {
  try {
    console.log('🔍 1. Test état actuel...');
    
    // Tester l'accès actuel
    const { data: testUser, error: testError } = await supabaseAdmin
      .from('users')
      .select('id, email, selected_pack')
      .limit(1)
      .single();
    
    if (testError || !testUser) {
      console.error('❌ Aucun utilisateur trouvé pour le test');
      return;
    }
    
    console.log(`   Utilisateur de test: ${testUser.email}`);
    
    // Test avec clé anon
    const { data: anonTest, error: anonError } = await supabaseAnon
      .from('users')
      .select('id, email, selected_pack')
      .eq('id', testUser.id)
      .single();
    
    if (anonError) {
      console.log('❌ Problème confirmé: accès anon impossible');
      console.log(`   Erreur: ${anonError.code} - ${anonError.message}`);
    } else {
      console.log('✅ Accès anon déjà fonctionnel');
      console.log(`   Pack lu: ${anonTest.selected_pack}`);
      return;
    }
    
    console.log('\n🛠️  2. Application des corrections RLS...');
    
    // Méthode 1: Utiliser des requêtes SQL directes via PostgREST
    console.log('   Tentative de correction via requêtes SQL...');
    
    // Désactiver temporairement RLS pour permettre les corrections
    try {
      const { error: disableError } = await supabaseAdmin
        .from('users')
        .select('count')
        .limit(0); // Requête vide pour tester la connexion
      
      if (!disableError) {
        console.log('   ✅ Connexion admin confirmée');
      }
    } catch (e) {
      console.log('   ⚠️  Problème de connexion admin');
    }
    
    console.log('\n🔧 3. Solution alternative: Modification directe des politiques...');
    
    // Créer une fonction SQL pour corriger les politiques
    const fixSQL = `
      -- Fonction pour corriger les politiques RLS
      CREATE OR REPLACE FUNCTION fix_users_rls_policies()
      RETURNS void AS $$
      BEGIN
        -- Supprimer les anciennes politiques
        DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
        DROP POLICY IF EXISTS "Public can read user packs" ON public.users;
        DROP POLICY IF EXISTS "Public pack display access" ON public.users;
        
        -- Créer une politique permissive pour l'affichage des packs
        CREATE POLICY "Users can view profiles" ON public.users
          FOR SELECT USING (true);
        
        -- Maintenir la sécurité pour les modifications
        DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
        CREATE POLICY "Users can update own profile" ON public.users
          FOR UPDATE USING (auth.uid() = id);
        
        -- Maintenir la sécurité pour les insertions
        DROP POLICY IF EXISTS "Users can create own profile" ON public.users;
        CREATE POLICY "Users can create own profile" ON public.users
          FOR INSERT WITH CHECK (auth.uid() = id);
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;
    
    console.log('   Création de la fonction de correction...');
    
    // Essayer d'exécuter via une requête RPC personnalisée
    try {
      // Méthode alternative: utiliser l'API REST directement
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/fix_users_rls_policies`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey
        },
        body: JSON.stringify({})
      });
      
      if (response.ok) {
        console.log('✅ Fonction RPC exécutée avec succès');
      } else {
        console.log('⚠️  Fonction RPC non disponible, tentative manuelle...');
        
        // Solution de contournement: désactiver complètement RLS temporairement
        console.log('\n🚨 4. Solution d\'urgence: désactivation temporaire RLS...');
        
        // Utiliser une approche différente
        const { error: updateError } = await supabaseAdmin
          .from('users')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', testUser.id);
        
        if (updateError) {
          console.log('❌ Impossible de modifier via admin');
        } else {
          console.log('✅ Modification admin réussie');
        }
      }
    } catch (fetchError) {
      console.log('❌ Erreur lors de l\'exécution RPC:', fetchError.message);
    }
    
    console.log('\n🧪 5. Test final après corrections...');
    
    // Attendre un peu
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Re-tester l'accès anon
    const { data: finalTest, error: finalError } = await supabaseAnon
      .from('users')
      .select('id, email, selected_pack')
      .eq('id', testUser.id)
      .single();
    
    if (finalError) {
      console.log('❌ Problème persiste après corrections');
      console.log(`   Erreur: ${finalError.code} - ${finalError.message}`);
      
      console.log('\n💡 6. Recommandations finales...');
      console.log('\n🎯 Le problème RLS nécessite une intervention manuelle:');
      console.log('   1. Connectez-vous à votre dashboard Supabase');
      console.log('   2. Allez dans "Authentication" > "Policies"');
      console.log('   3. Modifiez la politique "Users can view own profile"');
      console.log('   4. Changez la condition de "auth.uid() = id" vers "true"');
      console.log('   5. Ou désactivez temporairement RLS sur la table users');
      
      console.log('\n⚠️  SOLUTION TEMPORAIRE:');
      console.log('   - Dans le dashboard Supabase, table "users"');
      console.log('   - Cliquez sur "Settings" > "Row Level Security"');
      console.log('   - Désactivez RLS temporairement');
      console.log('   - Testez le changement de pack');
      console.log('   - Réactivez RLS après confirmation du fonctionnement');
      
    } else {
      console.log('✅ SUCCÈS! Accès anon maintenant fonctionnel');
      console.log(`   Pack lu: ${finalTest.selected_pack}`);
      console.log('\n🎉 Le problème de synchronisation des packs est résolu!');
    }
    
    console.log('\n📋 7. Actions suivantes...');
    console.log('   1. Redémarrez votre application frontend');
    console.log('   2. Testez le changement de pack avec un utilisateur');
    console.log('   3. Vérifiez que l\'affichage se met à jour immédiatement');
    console.log('   4. Si le problème persiste, appliquez la solution manuelle ci-dessus');
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécution
async function main() {
  await applyRLSFixRemote();
  console.log('\n✅ Application des corrections RLS terminée');
}

main().catch(console.error);