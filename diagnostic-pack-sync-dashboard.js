/**
 * Script de diagnostic pour le problème de synchronisation du pack après paiement
 * 
 * PROBLÈME: Le paiement fonctionne, le message "Pack activé avec succès" s'affiche,
 * mais le pack reste sur "découverte" dans le dashboard.
 * 
 * À exécuter dans la console du navigateur après un paiement réussi
 */

console.log('🔍 === DIAGNOSTIC SYNCHRONISATION PACK DASHBOARD ===\n');

// Configuration
const DISCOVERY_PACK_ID = '0a85e74a-4aec-480a-8af1-7b57391a80d2';

async function diagnosticPackSync() {
  try {
    // 1. Vérifier l'utilisateur connecté
    console.log('1️⃣ Vérification utilisateur...');
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('❌ Utilisateur non connecté:', userError);
      return;
    }
    
    console.log('✅ Utilisateur connecté:', user.email);
    console.log('   User ID:', user.id);
    
    // 2. Vérifier les transactions récentes
    console.log('\n2️⃣ Vérification des transactions récentes...');
    const { data: transactions, error: transError } = await supabase
      .from('transactions')
      .select(`
        *,
        packs(id, name, price)
      `)
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(3);
    
    if (transError) {
      console.error('❌ Erreur transactions:', transError);
    } else {
      console.log(`✅ ${transactions.length} transaction(s) trouvée(s)`);
      transactions.forEach((t, i) => {
        console.log(`   ${i + 1}. ${t.packs?.name} - ${t.amount/100}€ - ${new Date(t.created_at).toLocaleString()}`);
      });
    }
    
    // 3. Vérifier les packs utilisateur actuels
    console.log('\n3️⃣ Vérification des packs utilisateur...');
    const { data: userPacks, error: packError } = await supabase
      .from('user_packs')
      .select(`
        *,
        packs(id, name, price)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (packError) {
      console.error('❌ Erreur user_packs:', packError);
    } else {
      console.log(`✅ ${userPacks.length} pack(s) utilisateur trouvé(s)`);
      userPacks.forEach((up, i) => {
        const isActive = up.status === 'active';
        const icon = isActive ? '🟢' : '🔴';
        console.log(`   ${icon} ${up.packs?.name} - Status: ${up.status} - ${new Date(up.created_at).toLocaleString()}`);
      });
    }
    
    // 4. Vérifier le pack actif spécifiquement
    console.log('\n4️⃣ Vérification du pack actif...');
    const { data: activePack, error: activeError } = await supabase
      .from('user_packs')
      .select(`
        *,
        packs(id, name, price, description)
      `)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (activeError) {
      if (activeError.code === 'PGRST116') {
        console.log('❌ PROBLÈME: Aucun pack actif trouvé!');
      } else {
        console.error('❌ Erreur pack actif:', activeError);
      }
    } else {
      console.log('✅ Pack actif trouvé:', activePack.packs?.name);
      console.log('   Pack ID:', activePack.pack_id);
      console.log('   Status:', activePack.status);
      console.log('   Créé le:', new Date(activePack.created_at).toLocaleString());
    }
    
    // 5. Vérifier le selected_pack dans users
    console.log('\n5️⃣ Vérification du selected_pack...');
    const { data: userData, error: userDataError } = await supabase
      .from('users')
      .select('selected_pack')
      .eq('id', user.id)
      .single();
    
    if (userDataError) {
      console.error('❌ Erreur selected_pack:', userDataError);
    } else {
      console.log('✅ Selected pack:', userData.selected_pack);
    }
    
    // 6. Diagnostic et recommandations
    console.log('\n6️⃣ Diagnostic et recommandations...');
    
    const hasRecentTransaction = transactions && transactions.length > 0;
    const hasActivePack = !activeError && activePack;
    const isDiscoveryPack = hasActivePack && activePack.pack_id === DISCOVERY_PACK_ID;
    
    if (hasRecentTransaction && !hasActivePack) {
      console.log('🔴 PROBLÈME CRITIQUE: Transaction réussie mais aucun pack actif!');
      console.log('   → Le webhook Stripe n\'a pas créé le pack utilisateur');
      console.log('   → Solution: Exécuter fixPackAfterPayment()');
      
    } else if (hasRecentTransaction && hasActivePack && isDiscoveryPack) {
      const lastTransaction = transactions[0];
      if (lastTransaction.pack_id !== DISCOVERY_PACK_ID) {
        console.log('🔴 PROBLÈME: Pack actif ne correspond pas à la dernière transaction!');
        console.log(`   → Transaction: ${lastTransaction.packs?.name}`);
        console.log(`   → Pack actif: ${activePack.packs?.name}`);
        console.log('   → Solution: Exécuter fixPackAfterPayment()');
      } else {
        console.log('✅ Situation normale: Pack Découverte actif et payé');
      }
      
    } else if (hasRecentTransaction && hasActivePack && !isDiscoveryPack) {
      console.log('✅ NORMAL: Pack payant actif correspondant à la transaction');
      console.log('   → Si le dashboard affiche encore "Découverte", c\'est un problème de cache');
      console.log('   → Solution: Rafraîchir les données ou recharger la page');
      
    } else if (!hasRecentTransaction && hasActivePack && isDiscoveryPack) {
      console.log('✅ NORMAL: Pack Découverte, aucune transaction récente');
      
    } else {
      console.log('⚠️ SITUATION INHABITUELLE: Analyser manuellement');
    }
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Fonction de correction automatique
async function fixPackAfterPayment() {
  try {
    console.log('\n🛠️ === CORRECTION AUTOMATIQUE ===\n');
    
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
    const { error: activateError, data: newPack } = await supabase
      .from('user_packs')
      .insert({
        user_id: user.id,
        pack_id: lastTransaction.pack_id,
        status: 'active',
        started_at: new Date().toISOString(),
        next_billing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // +30 jours
      })
      .select('*, packs(id, name, price)')
      .single();
    
    if (activateError) {
      console.error('❌ Erreur activation:', activateError);
      return;
    }
    
    console.log('✅ Pack activé:', newPack.packs?.name);
    
    // 3. Mettre à jour selected_pack dans users
    console.log('3️⃣ Mise à jour du selected_pack...');
    const { error: updateUserError } = await supabase
      .from('users')
      .update({ selected_pack: lastTransaction.packs?.slug || lastTransaction.packs?.name?.toLowerCase() })
      .eq('id', user.id);
    
    if (updateUserError) {
      console.warn('⚠️ Erreur mise à jour selected_pack:', updateUserError);
    } else {
      console.log('✅ Selected_pack mis à jour');
    }
    
    // 4. Rafraîchir l'interface
    console.log('4️⃣ Rafraîchissement de l\'interface...');
    
    // Essayer de rafraîchir via le contexte si disponible
    if (typeof refreshUserServices === 'function') {
      await refreshUserServices();
      console.log('✅ Données rafraîchies via le contexte');
    } else {
      console.log('🔄 Rechargement de la page dans 2 secondes...');
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    }
    
    console.log('\n🎉 CORRECTION TERMINÉE AVEC SUCCÈS!');
    console.log(`✅ Pack "${newPack.packs?.name}" maintenant actif`);
    
  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error);
  }
}

// Fonction pour forcer le rafraîchissement du dashboard
async function forceRefreshDashboard() {
  console.log('🔄 === RAFRAÎCHISSEMENT FORCÉ DU DASHBOARD ===\n');
  
  try {
    // Essayer de rafraîchir via le contexte
    if (typeof refreshUserServices === 'function') {
      console.log('🔄 Rafraîchissement via refreshUserServices...');
      await refreshUserServices();
      console.log('✅ Rafraîchissement terminé');
    } else {
      console.log('⚠️ refreshUserServices non disponible, rechargement de la page...');
      window.location.reload();
    }
  } catch (error) {
    console.error('❌ Erreur lors du rafraîchissement:', error);
    console.log('🔄 Rechargement de la page en fallback...');
    window.location.reload();
  }
}

// Exécuter le diagnostic automatiquement
diagnosticPackSync();

// Exposer les fonctions globalement pour utilisation manuelle
window.diagnosticPackSync = diagnosticPackSync;
window.fixPackAfterPayment = fixPackAfterPayment;
window.forceRefreshDashboard = forceRefreshDashboard;

console.log('\n📋 === FONCTIONS DISPONIBLES ===');
console.log('• diagnosticPackSync() - Relancer le diagnostic');
console.log('• fixPackAfterPayment() - Corriger la synchronisation');
console.log('• forceRefreshDashboard() - Forcer le rafraîchissement');
console.log('\n💡 Conseil: Si le diagnostic montre un problème, exécutez fixPackAfterPayment()');