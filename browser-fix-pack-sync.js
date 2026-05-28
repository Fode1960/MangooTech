/**
 * Script de correction automatique pour le navigateur
 * À exécuter dans la console du dashboard (F12 > Console)
 */

console.log('🚀 === CORRECTION AUTOMATIQUE SYNCHRONISATION PACK ===\n');

// Fonction principale de correction
async function autoFixPackSync() {
  try {
    console.log('1️⃣ Vérification de l\'authentification...');
    
    // Vérifier l'utilisateur connecté
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('❌ Utilisateur non connecté:', authError);
      return;
    }
    
    console.log('✅ Utilisateur connecté:', user.email);
    
    // 2. Récupérer les données utilisateur
    console.log('\n2️⃣ Récupération des données utilisateur...');
    
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select(`
        id,
        email,
        selected_pack,
        user_packs(
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
      .eq('id', user.id)
      .single();
    
    if (userError) {
      console.error('❌ Erreur récupération utilisateur:', userError);
      return;
    }
    
    console.log('📊 Données utilisateur récupérées');
    
    // 3. Analyser la situation
    console.log('\n3️⃣ Analyse de la synchronisation...');
    
    const activePacks = userData.user_packs.filter(up => up.status === 'active');
    const completedTransactions = userData.transactions
      .filter(t => t.status === 'completed')
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    console.log(`📦 Packs actifs: ${activePacks.length}`);
    console.log(`💳 Transactions réussies: ${completedTransactions.length}`);
    console.log(`🏷️  Selected pack actuel: ${userData.selected_pack}`);
    
    if (activePacks.length > 0) {
      console.log(`📋 Pack actif: ${activePacks[0].packs.name} (${activePacks[0].packs.slug})`);
    }
    
    if (completedTransactions.length > 0) {
      const lastTransaction = completedTransactions[0];
      console.log(`💰 Dernière transaction: ${lastTransaction.packs.name} (${lastTransaction.packs.slug})`);
      
      // Vérifier s'il y a un problème de synchronisation
      const expectedPack = lastTransaction.packs;
      const currentActivePack = activePacks[0];
      
      const hasPackIssue = !currentActivePack || currentActivePack.pack_id !== lastTransaction.pack_id;
      const hasSelectedPackIssue = userData.selected_pack !== expectedPack.slug;
      
      if (!hasPackIssue && !hasSelectedPackIssue) {
        console.log('\n✅ Synchronisation correcte! Aucune correction nécessaire.');
        return;
      }
      
      console.log('\n🔧 Problème de synchronisation détecté!');
      
      if (hasPackIssue) {
        console.log('❌ Pack actif incorrect');
      }
      
      if (hasSelectedPackIssue) {
        console.log('❌ Selected pack incorrect');
      }
      
      // 4. Correction automatique
      console.log('\n4️⃣ Application de la correction...');
      
      // Désactiver tous les packs actuels
      if (activePacks.length > 0) {
        console.log('🔄 Désactivation des packs actuels...');
        
        const { error: deactivateError } = await supabase
          .from('user_packs')
          .update({ status: 'inactive' })
          .eq('user_id', user.id)
          .eq('status', 'active');
        
        if (deactivateError) {
          console.error('❌ Erreur désactivation:', deactivateError);
          return;
        }
        
        console.log('✅ Packs désactivés');
      }
      
      // Activer le bon pack
      console.log('🔄 Activation du pack correct...');
      
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
        console.error('❌ Erreur activation:', activateError);
        return;
      }
      
      console.log('✅ Pack activé');
      
      // Mettre à jour selected_pack
      console.log('🔄 Mise à jour selected_pack...');
      
      const { error: updateError } = await supabase
        .from('users')
        .update({ selected_pack: expectedPack.slug })
        .eq('id', user.id);
      
      if (updateError) {
        console.error('❌ Erreur mise à jour:', updateError);
        return;
      }
      
      console.log('✅ Selected pack mis à jour');
      
      console.log('\n🎉 === CORRECTION TERMINÉE AVEC SUCCÈS ===');
      console.log(`✨ Pack corrigé: ${expectedPack.name} (${expectedPack.slug})`);
      console.log('💡 Rechargez la page pour voir les changements!');
      
      // Recharger automatiquement après 2 secondes
      setTimeout(() => {
        console.log('🔄 Rechargement automatique...');
        window.location.reload();
      }, 2000);
      
    } else {
      console.log('\n⚠️  Aucune transaction réussie trouvée. Impossible de déterminer le pack correct.');
    }
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Fonction de vérification rapide
async function quickCheck() {
  try {
    console.log('🔍 === VÉRIFICATION RAPIDE ===\n');
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.log('❌ Utilisateur non connecté');
      return;
    }
    
    const { data: userData } = await supabase
      .from('users')
      .select(`
        selected_pack,
        user_packs!inner(
          status,
          packs(name, slug)
        ),
        transactions(
          status,
          created_at,
          packs(name, slug)
        )
      `)
      .eq('id', user.id)
      .eq('user_packs.status', 'active')
      .single();
    
    const activePack = userData.user_packs[0];
    const lastTransaction = userData.transactions
      .filter(t => t.status === 'completed')
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
    
    console.log(`👤 Utilisateur: ${user.email}`);
    console.log(`📦 Pack actif: ${activePack?.packs?.name || 'Aucun'}`);
    console.log(`🏷️  Selected pack: ${userData.selected_pack}`);
    console.log(`💳 Dernière transaction: ${lastTransaction?.packs?.name || 'Aucune'}`);
    
    const isSync = activePack && lastTransaction && 
                   userData.selected_pack === activePack.packs.slug &&
                   activePack.packs.slug === lastTransaction.packs.slug;
    
    console.log(`\n${isSync ? '✅' : '❌'} Statut: ${isSync ? 'SYNCHRONISÉ' : 'DÉSYNCHRONISÉ'}`);
    
    if (!isSync) {
      console.log('\n💡 Exécutez autoFixPackSync() pour corriger automatiquement');
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

// Afficher les instructions
console.log('📋 === INSTRUCTIONS ===');
console.log('1. quickCheck() - Vérification rapide du statut');
console.log('2. autoFixPackSync() - Correction automatique');
console.log('\n💡 Commencez par: quickCheck()');

// Export des fonctions pour utilisation
window.autoFixPackSync = autoFixPackSync;
window.quickCheck = quickCheck;

console.log('\n✅ Script chargé! Tapez quickCheck() pour commencer.');}}}