/**
 * Script de correction automatique pour le problème de synchronisation du pack
 * Exécute la correction directement via l'API Supabase
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuration Supabase (à partir des variables d'environnement)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY manquante dans .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Fonction principale de correction
async function autoFixPackSync() {
  try {
    console.log('🚀 === CORRECTION AUTOMATIQUE SYNCHRONISATION PACK ===\n');

    // 1. Récupérer tous les utilisateurs avec des problèmes de sync
    console.log('1️⃣ Recherche des utilisateurs avec problèmes de synchronisation...');
    
    const { data: problematicUsers, error: usersError } = await supabase
      .from('users')
      .select(`
        id,
        email,
        selected_pack,
        user_packs!inner(
          id,
          pack_id,
          status,
          started_at,
          packs(
            id,
            name,
            slug
          )
        ),
        transactions(
          id,
          pack_id,
          status,
          created_at,
          packs(
            id,
            name,
            slug
          )
        )
      `)
      .eq('user_packs.status', 'active')
      .eq('transactions.status', 'completed')
      .order('transactions.created_at', { ascending: false });

    if (usersError) {
      console.error('❌ Erreur lors de la récupération des utilisateurs:', usersError);
      return;
    }

    console.log(`📊 ${problematicUsers?.length || 0} utilisateurs trouvés`);

    if (!problematicUsers || problematicUsers.length === 0) {
      console.log('✅ Aucun problème de synchronisation détecté!');
      return;
    }

    // 2. Analyser et corriger chaque utilisateur
    for (const user of problematicUsers) {
      console.log(`\n👤 Traitement utilisateur: ${user.email}`);
      
      // Récupérer la dernière transaction réussie
      const lastTransaction = user.transactions
        .filter(t => t.status === 'completed')
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];

      if (!lastTransaction) {
        console.log('⚠️  Aucune transaction réussie trouvée');
        continue;
      }

      const expectedPack = lastTransaction.packs;
      const currentActivePack = user.user_packs.find(up => up.status === 'active');
      
      console.log(`💳 Dernière transaction: ${expectedPack.name} (${expectedPack.slug})`);
      console.log(`📦 Pack actif: ${currentActivePack?.packs?.name || 'Aucun'}`);
      console.log(`🏷️  Selected pack: ${user.selected_pack}`);

      // Vérifier s'il y a un problème de synchronisation
      const hasIssue = 
        currentActivePack?.pack_id !== lastTransaction.pack_id ||
        user.selected_pack !== expectedPack.slug;

      if (!hasIssue) {
        console.log('✅ Synchronisation correcte');
        continue;
      }

      console.log('🔧 Correction nécessaire...');

      // 3. Désactiver tous les packs actuels
      const { error: deactivateError } = await supabase
        .from('user_packs')
        .update({ status: 'inactive' })
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (deactivateError) {
        console.error('❌ Erreur lors de la désactivation:', deactivateError);
        continue;
      }

      // 4. Activer le bon pack
      const { error: activateError } = await supabase
        .from('user_packs')
        .upsert({
          user_id: user.id,
          pack_id: lastTransaction.pack_id,
          status: 'active',
          started_at: new Date().toISOString(),
          next_billing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        });

      if (activateError) {
        console.error('❌ Erreur lors de l\'activation:', activateError);
        continue;
      }

      // 5. Mettre à jour selected_pack
      const { error: updateError } = await supabase
        .from('users')
        .update({ selected_pack: expectedPack.slug })
        .eq('id', user.id);

      if (updateError) {
        console.error('❌ Erreur lors de la mise à jour:', updateError);
        continue;
      }

      console.log('✅ Correction appliquée avec succès!');
    }

    console.log('\n🎉 === CORRECTION TERMINÉE ===');
    console.log('💡 Rechargez la page du dashboard pour voir les changements');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Fonction de vérification rapide
async function quickVerification() {
  try {
    console.log('🔍 === VÉRIFICATION RAPIDE ===\n');
    
    const { data: users, error } = await supabase
      .from('users')
      .select(`
        email,
        selected_pack,
        user_packs!inner(
          status,
          packs(name, slug)
        )
      `)
      .eq('user_packs.status', 'active')
      .limit(10);

    if (error) {
      console.error('❌ Erreur:', error);
      return;
    }

    users.forEach(user => {
      const activePack = user.user_packs[0];
      const isSync = user.selected_pack === activePack.packs.slug;
      console.log(`${isSync ? '✅' : '❌'} ${user.email}: ${activePack.packs.name} (${isSync ? 'OK' : 'DÉSYNCHRONISÉ'})`);
    });

  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

// Exécution
if (require.main === module) {
  const command = process.argv[2];
  
  if (command === 'verify') {
    quickVerification();
  } else {
    autoFixPackSync();
  }
}

module.exports = { autoFixPackSync, quickVerification };