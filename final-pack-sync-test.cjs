require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);

console.log('🎯 === TEST FINAL SYNCHRONISATION PACK ===\n');

async function finalPackSyncTest() {
  try {
    console.log('🔍 1. Diagnostic complet du problème...');
    
    // Trouver un utilisateur avec un pack actif
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, email, selected_pack')
      .not('selected_pack', 'is', null)
      .limit(5);
    
    if (usersError || !users?.length) {
      console.log('❌ Aucun utilisateur avec pack trouvé');
      return;
    }
    
    const testUser = users[0];
    console.log(`   Utilisateur test: ${testUser.email}`);
    console.log(`   Pack actuel: ${testUser.selected_pack}`);
    
    // Test 1: Accès admin
    console.log('\n🔧 2. Test accès administrateur...');
    const { data: adminData, error: adminError } = await supabaseAdmin
      .from('users')
      .select('id, email, selected_pack')
      .eq('id', testUser.id)
      .single();
    
    if (adminError) {
      console.log('❌ Échec accès admin:', adminError.message);
    } else {
      console.log('✅ Accès admin OK');
      console.log(`   Pack lu par admin: ${adminData.selected_pack}`);
    }
    
    // Test 2: Accès anonyme (comme le frontend)
    console.log('\n🌐 3. Test accès frontend (anonyme)...');
    const { data: anonData, error: anonError } = await supabaseAnon
      .from('users')
      .select('id, email, selected_pack')
      .eq('id', testUser.id)
      .single();
    
    if (anonError) {
      console.log('❌ PROBLÈME IDENTIFIÉ: Accès frontend impossible');
      console.log(`   Code erreur: ${anonError.code}`);
      console.log(`   Message: ${anonError.message}`);
      console.log('   🎯 C\'est exactement pourquoi le pack ne se met pas à jour!');
    } else {
      console.log('✅ Accès frontend OK');
      console.log(`   Pack lu par frontend: ${anonData.selected_pack}`);
    }
    
    // Test 3: Vérifier les user_packs
    console.log('\n📦 4. Vérification des packs utilisateur...');
    const { data: userPacks, error: packsError } = await supabaseAdmin
      .from('user_packs')
      .select('pack_id, is_active, created_at')
      .eq('user_id', testUser.id)
      .order('created_at', { ascending: false });
    
    if (packsError) {
      console.log('❌ Erreur lecture user_packs:', packsError.message);
    } else {
      console.log(`✅ ${userPacks.length} packs trouvés pour cet utilisateur`);
      userPacks.forEach((pack, index) => {
        console.log(`   Pack ${index + 1}: ${pack.pack_id} (actif: ${pack.is_active})`);
      });
    }
    
    // Test 4: Simulation changement de pack
    console.log('\n🔄 5. Simulation changement de pack...');
    
    // Trouver un autre pack disponible
    const { data: availablePacks, error: availableError } = await supabaseAdmin
      .from('packs')
      .select('id, name')
      .neq('id', testUser.selected_pack)
      .limit(1);
    
    if (availableError || !availablePacks?.length) {
      console.log('⚠️  Aucun autre pack disponible pour le test');
    } else {
      const newPack = availablePacks[0];
      console.log(`   Tentative changement vers: ${newPack.name} (${newPack.id})`);
      
      // Mettre à jour selected_pack
      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({ selected_pack: newPack.id })
        .eq('id', testUser.id);
      
      if (updateError) {
        console.log('❌ Échec mise à jour selected_pack:', updateError.message);
      } else {
        console.log('✅ selected_pack mis à jour avec succès');
        
        // Attendre et tester la lecture frontend
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const { data: updatedData, error: readError } = await supabaseAnon
          .from('users')
          .select('selected_pack')
          .eq('id', testUser.id)
          .single();
        
        if (readError) {
          console.log('❌ PROBLÈME CONFIRMÉ: Frontend ne peut pas lire la mise à jour');
          console.log(`   Erreur: ${readError.message}`);
        } else {
          console.log('✅ Frontend peut lire la mise à jour');
          console.log(`   Nouveau pack lu: ${updatedData.selected_pack}`);
        }
        
        // Remettre l'ancien pack
        await supabaseAdmin
          .from('users')
          .update({ selected_pack: testUser.selected_pack })
          .eq('id', testUser.id);
        
        console.log('   ↩️  Pack original restauré');
      }
    }
    
    console.log('\n🎯 6. DIAGNOSTIC FINAL...');
    
    if (anonError) {
      console.log('\n❌ PROBLÈME IDENTIFIÉ:');
      console.log('   Le frontend ne peut pas lire la table users à cause des politiques RLS');
      console.log('   Même si le paiement met à jour selected_pack, le frontend ne voit pas le changement');
      
      console.log('\n🛠️  SOLUTIONS IMMÉDIATES:');
      console.log('\n   OPTION 1 - Solution rapide (Dashboard Supabase):');
      console.log('   1. Allez sur https://supabase.com/dashboard');
      console.log('   2. Sélectionnez votre projet');
      console.log('   3. Allez dans "Table Editor" > "users"');
      console.log('   4. Cliquez sur l\'icône "Settings" (engrenage) à droite');
      console.log('   5. Désactivez "Row Level Security" temporairement');
      console.log('   6. Testez le changement de pack');
      console.log('   7. Réactivez RLS après confirmation');
      
      console.log('\n   OPTION 2 - Solution via SQL (Dashboard):');
      console.log('   1. Allez dans "SQL Editor"');
      console.log('   2. Exécutez cette requête:');
      console.log('   ```sql');
      console.log('   DROP POLICY IF EXISTS "Users can view own profile" ON public.users;');
      console.log('   CREATE POLICY "Public can read user profiles" ON public.users');
      console.log('     FOR SELECT USING (true);');
      console.log('   ```');
      
      console.log('\n   OPTION 3 - Solution sécurisée (recommandée):');
      console.log('   1. Modifiez votre frontend pour utiliser un utilisateur authentifié');
      console.log('   2. Ou créez une vue publique avec seulement les champs nécessaires');
      
    } else {
      console.log('\n✅ PROBLÈME RÉSOLU!');
      console.log('   Le frontend peut maintenant lire les données utilisateur');
      console.log('   Le changement de pack devrait fonctionner correctement');
    }
    
    console.log('\n📋 7. ÉTAPES DE VALIDATION:');
    console.log('   1. Appliquez une des solutions ci-dessus');
    console.log('   2. Redémarrez votre application (Ctrl+C puis npm run dev)');
    console.log('   3. Testez un changement de pack avec paiement');
    console.log('   4. Vérifiez que l\'affichage se met à jour immédiatement');
    console.log('   5. Si ça marche, le problème est résolu définitivement!');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  }
}

// Exécution
async function main() {
  await finalPackSyncTest();
  console.log('\n🏁 Test de synchronisation terminé');
}

main().catch(console.error);