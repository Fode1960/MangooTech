/**
 * Script de diagnostic pour le problème de synchronisation du pack
 * 
 * PROBLÈME IDENTIFIÉ:
 * - Le webhook Stripe met à jour 'selected_pack' avec un slug
 * - Le Dashboard utilise 'userPack.pack_id' (UUID) pour afficher le pack
 * - Ces deux systèmes ne sont pas synchronisés
 * 
 * À exécuter dans la console du navigateur
 */

console.log('🔍 === DIAGNOSTIC PROBLÈME SYNCHRONISATION PACK ===\n');

// Configuration
const CONFIG = {
  // Remplacer par votre configuration
  supabaseUrl: 'https://your-project.supabase.co',
  supabaseKey: 'your-anon-key',
  userId: 'your-user-id' // Remplacer par l'ID utilisateur problématique
};

// Fonction principale de diagnostic
async function diagnoseProblem() {
  try {
    console.log('1️⃣ Vérification de l\'utilisateur connecté...');
    
    // Récupérer l'utilisateur connecté
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('❌ Utilisateur non connecté:', authError);
      return;
    }
    
    console.log('✅ Utilisateur connecté:', user.id);
    const userId = user.id;
    
    console.log('\n2️⃣ Vérification du pack actif dans user_packs...');
    
    // Vérifier le pack actif
    const { data: userPacks, error: packsError } = await supabase
      .from('user_packs')
      .select(`
        *,
        packs(
          id,
          name,
          price,
          currency
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false });
    
    if (packsError) {
      console.error('❌ Erreur récupération packs:', packsError);
      return;
    }
    
    console.log('📦 Packs actifs trouvés:', userPacks?.length || 0);
    
    if (!userPacks || userPacks.length === 0) {
      console.error('❌ PROBLÈME CRITIQUE: Aucun pack actif trouvé');
      console.log('💡 Le webhook n\'a probablement pas créé/réactivé le pack correctement');
      
      // Vérifier tous les packs de l'utilisateur
      const { data: allUserPacks } = await supabase
        .from('user_packs')
        .select('*, packs(name)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      console.log('📋 Tous les packs de l\'utilisateur:', allUserPacks);
      return;
    }
    
    const currentPack = userPacks[0];
    console.log('✅ Pack actif trouvé:', {
      pack_id: currentPack.pack_id,
      pack_name: currentPack.packs?.name,
      status: currentPack.status,
      created_at: currentPack.created_at,
      updated_at: currentPack.updated_at
    });
    
    console.log('\n3️⃣ Vérification du selected_pack dans users...');
    
    // Vérifier selected_pack
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, selected_pack')
      .eq('id', userId)
      .single();
    
    if (userError) {
      console.error('❌ Erreur récupération utilisateur:', userError);
      return;
    }
    
    console.log('👤 Selected pack:', userData.selected_pack);
    
    console.log('\n4️⃣ Vérification des transactions récentes...');
    
    // Vérifier les transactions
    const { data: transactions, error: transError } = await supabase
      .from('transactions')
      .select(`
        *,
        packs(name, price)
      `)
      .eq('user_id', userId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (transError) {
      console.error('❌ Erreur récupération transactions:', transError);
    } else {
      console.log('💰 Transactions récentes:', transactions?.length || 0);
      transactions?.forEach((trans, index) => {
        console.log(`   ${index + 1}. ${trans.packs?.name} - ${trans.amount} ${trans.currency} - ${new Date(trans.created_at).toLocaleString()}`);
      });
    }
    
    console.log('\n5️⃣ Diagnostic final...');
    
    // Diagnostic final
    const hasRecentPayment = transactions && transactions.length > 0;
    const isDiscoveryPack = currentPack.packs?.name?.toLowerCase().includes('découverte') || 
                           currentPack.packs?.name?.toLowerCase().includes('decouverte');
    
    if (hasRecentPayment && isDiscoveryPack) {
      console.log('❌ PROBLÈME CONFIRMÉ: Paiement effectué mais pack Découverte affiché');
      console.log('🔧 CAUSE PROBABLE: Le webhook Stripe n\'a pas correctement mis à jour user_packs');
      console.log('\n💡 SOLUTIONS:');
      console.log('   1. Vérifier les logs du webhook Stripe dans Supabase');
      console.log('   2. Vérifier que le pack_id dans les métadonnées Stripe est correct');
      console.log('   3. Relancer manuellement la mise à jour du pack');
      
      // Proposer une correction automatique
      if (transactions && transactions.length > 0) {
        const lastTransaction = transactions[0];
        console.log('\n🛠️ CORRECTION AUTOMATIQUE DISPONIBLE:');
        console.log(`   Pack à activer: ${lastTransaction.packs?.name}`);
        console.log(`   Pack ID: ${lastTransaction.pack_id}`);
        console.log('\n   Exécuter: fixPackSynchronization() pour corriger automatiquement');
      }
    } else if (!hasRecentPayment && isDiscoveryPack) {
      console.log('✅ NORMAL: Pack Découverte, aucun paiement récent');
    } else if (hasRecentPayment && !isDiscoveryPack) {
      console.log('✅ NORMAL: Pack payant actif correspondant au paiement');
    } else {
      console.log('⚠️ SITUATION INHABITUELLE: Pack payant sans transaction récente');
    }
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Fonction de correction automatique
async function fixPackSynchronization() {
  try {
    console.log('🛠️ === CORRECTION AUTOMATIQUE ===\n');
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('❌ Utilisateur non connecté');
      return;
    }
    
    // Récupérer la dernière transaction réussie
    const { data: lastTransaction, error: transError } = await supabase
      .from('transactions')
      .select('*, packs(id, name)')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (transError || !lastTransaction) {
      console.error('❌ Aucune transaction trouvée pour la correction');
      return;
    }
    
    console.log('📦 Pack à activer:', lastTransaction.packs?.name);
    
    // 1. Désactiver les packs actuels
    console.log('1️⃣ Désactivation des packs actuels...');
    const { error: deactivateError } = await supabase
      .from('user_packs')
      .update({ 
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .eq('status', 'active');
    
    if (deactivateError) {
      console.error('❌ Erreur désactivation:', deactivateError);
      return;
    }
    
    // 2. Créer/réactiver le bon pack
    console.log('2️⃣ Activation du nouveau pack...');
    const { error: insertError, data: newPack } = await supabase
      .from('user_packs')
      .insert({
        user_id: user.id,
        pack_id: lastTransaction.pack_id,
        status: 'active',
        started_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ Erreur activation:', insertError);
      return;
    }
    
    console.log('✅ Pack activé avec succès:', newPack);
    
    // 3. Rafraîchir la page
    console.log('3️⃣ Rafraîchissement de la page...');
    setTimeout(() => {
      window.location.reload();
    }, 1000);
    
  } catch (error) {
    console.error('❌ Erreur correction:', error);
  }
}

// Instructions d'utilisation
console.log('📋 === INSTRUCTIONS ===');
console.log('1. Exécuter: diagnoseProblem() pour diagnostiquer');
console.log('2. Si problème détecté, exécuter: fixPackSynchronization() pour corriger');
console.log('\n🚀 Lancement du diagnostic...');

// Lancer automatiquement le diagnostic
diagnoseProblem();