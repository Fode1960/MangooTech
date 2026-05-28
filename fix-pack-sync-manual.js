/**
 * Script de correction manuelle pour le problème de synchronisation du pack
 * 
 * Ce script corrige directement le problème en:
 * 1. Identifiant la dernière transaction réussie
 * 2. Activant le pack correspondant dans user_packs
 * 3. Rafraîchissant les données utilisateur
 * 
 * À exécuter dans la console du navigateur
 */

console.log('🛠️ === CORRECTION MANUELLE SYNCHRONISATION PACK ===\n');

// Fonction principale de correction
async function fixPackSyncIssue() {
  try {
    console.log('1️⃣ Vérification de l\'authentification...');
    
    // Vérifier l'utilisateur connecté
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('❌ Utilisateur non connecté:', authError);
      return false;
    }
    
    console.log('✅ Utilisateur connecté:', user.id);
    const userId = user.id;
    
    console.log('\n2️⃣ Recherche de la dernière transaction réussie...');
    
    // Récupérer la dernière transaction réussie
    const { data: transactions, error: transError } = await supabase
      .from('transactions')
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
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (transError) {
      console.error('❌ Erreur récupération transactions:', transError);
      return false;
    }
    
    if (!transactions || transactions.length === 0) {
      console.log('ℹ️ Aucune transaction trouvée - utilisateur avec pack gratuit');
      
      // Vérifier si le pack gratuit est bien activé
      const { data: currentPacks } = await supabase
        .from('user_packs')
        .select('*, packs(name)')
        .eq('user_id', userId)
        .eq('status', 'active');
      
      if (!currentPacks || currentPacks.length === 0) {
        console.log('🔧 Activation du pack gratuit...');
        await activateFreePack(userId);
      } else {
        console.log('✅ Pack gratuit déjà actif:', currentPacks[0].packs?.name);
      }
      return true;
    }
    
    const lastTransaction = transactions[0];
    console.log('💰 Dernière transaction trouvée:', {
      pack_name: lastTransaction.packs?.name,
      pack_id: lastTransaction.pack_id,
      amount: lastTransaction.amount,
      currency: lastTransaction.currency,
      date: new Date(lastTransaction.created_at).toLocaleString()
    });
    
    console.log('\n3️⃣ Vérification du pack actuel...');
    
    // Vérifier le pack actuellement actif
    const { data: currentPacks, error: currentError } = await supabase
      .from('user_packs')
      .select(`
        *,
        packs(
          id,
          name,
          price
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false });
    
    if (currentError) {
      console.error('❌ Erreur récupération pack actuel:', currentError);
      return false;
    }
    
    const currentPack = currentPacks?.[0];
    
    if (currentPack) {
      console.log('📦 Pack actuellement actif:', {
        pack_name: currentPack.packs?.name,
        pack_id: currentPack.pack_id,
        status: currentPack.status
      });
      
      // Vérifier si le pack actuel correspond à la transaction
      if (currentPack.pack_id === lastTransaction.pack_id) {
        console.log('✅ Le pack actuel correspond à la dernière transaction');
        console.log('ℹ️ Le problème pourrait être dans l\'affichage du Dashboard');
        
        // Forcer le rafraîchissement des données
        console.log('🔄 Rafraîchissement des données...');
        if (window.location.pathname === '/dashboard') {
          // Si on est sur le dashboard, rafraîchir les services
          if (typeof refreshUserServices === 'function') {
            await refreshUserServices();
            console.log('✅ Données rafraîchies');
          } else {
            console.log('🔄 Rechargement de la page...');
            window.location.reload();
          }
        }
        return true;
      }
    }
    
    console.log('\n4️⃣ Correction nécessaire - Activation du bon pack...');
    
    // Désactiver tous les packs actuels
    console.log('   a) Désactivation des packs actuels...');
    const { error: deactivateError } = await supabase
      .from('user_packs')
      .update({ 
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('status', 'active');
    
    if (deactivateError) {
      console.error('❌ Erreur désactivation:', deactivateError);
      return false;
    }
    
    console.log('   ✅ Packs actuels désactivés');
    
    // Activer le pack correspondant à la transaction
    console.log('   b) Activation du pack payé...');
    const { error: activateError, data: newPack } = await supabase
      .from('user_packs')
      .insert({
        user_id: userId,
        pack_id: lastTransaction.pack_id,
        status: 'active',
        started_at: new Date().toISOString()
      })
      .select(`
        *,
        packs(
          id,
          name,
          price
        )
      `)
      .single();
    
    if (activateError) {
      console.error('❌ Erreur activation pack:', activateError);
      return false;
    }
    
    console.log('   ✅ Pack activé:', newPack.packs?.name);
    
    console.log('\n5️⃣ Finalisation...');
    
    // Rafraîchir les données
    console.log('🔄 Rafraîchissement des données utilisateur...');
    
    // Essayer de rafraîchir via le contexte si disponible
    if (window.location.pathname === '/dashboard') {
      if (typeof refreshUserServices === 'function') {
        await refreshUserServices();
        console.log('✅ Données rafraîchies via le contexte');
      } else {
        console.log('🔄 Rechargement de la page dans 2 secondes...');
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    }
    
    console.log('\n🎉 CORRECTION TERMINÉE AVEC SUCCÈS!');
    console.log(`✅ Pack "${newPack.packs?.name}" maintenant actif`);
    
    return true;
    
  } catch (error) {
    console.error('❌ Erreur générale lors de la correction:', error);
    return false;
  }
}

// Fonction pour activer le pack gratuit
async function activateFreePack(userId) {
  const FREE_PACK_ID = '0a85e74a-4aec-480a-8af1-7b57391a80d2'; // Pack Découverte
  
  try {
    const { error, data } = await supabase
      .from('user_packs')
      .insert({
        user_id: userId,
        pack_id: FREE_PACK_ID,
        status: 'active',
        started_at: new Date().toISOString()
      })
      .select(`
        *,
        packs(name)
      `)
      .single();
    
    if (error) {
      console.error('❌ Erreur activation pack gratuit:', error);
      return false;
    }
    
    console.log('✅ Pack gratuit activé:', data.packs?.name);
    return true;
    
  } catch (error) {
    console.error('❌ Erreur activation pack gratuit:', error);
    return false;
  }
}

// Fonction de vérification rapide
async function quickCheck() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('❌ Non connecté');
      return;
    }
    
    const [packsResult, transResult] = await Promise.all([
      supabase
        .from('user_packs')
        .select('*, packs(name)')
        .eq('user_id', user.id)
        .eq('status', 'active'),
      supabase
        .from('transactions')
        .select('*, packs(name)')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(1)
    ]);
    
    const activePack = packsResult.data?.[0];
    const lastTransaction = transResult.data?.[0];
    
    console.log('📊 === ÉTAT ACTUEL ===');
    console.log('Pack actif:', activePack?.packs?.name || 'Aucun');
    console.log('Dernière transaction:', lastTransaction?.packs?.name || 'Aucune');
    
    if (lastTransaction && (!activePack || activePack.pack_id !== lastTransaction.pack_id)) {
      console.log('❌ DÉSYNCHRONISATION DÉTECTÉE!');
      console.log('💡 Exécuter: fixPackSyncIssue() pour corriger');
    } else {
      console.log('✅ Synchronisation OK');
    }
    
  } catch (error) {
    console.error('❌ Erreur vérification:', error);
  }
}

// Instructions
console.log('📋 === INSTRUCTIONS ===');
console.log('1. quickCheck() - Vérification rapide de l\'état');
console.log('2. fixPackSyncIssue() - Correction complète du problème');
console.log('\n🚀 Lancement de la vérification...');

// Lancer la vérification automatiquement
quickCheck();