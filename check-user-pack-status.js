// Script de diagnostic pour vérifier le statut du pack utilisateur
// À exécuter dans la console du navigateur

(async function checkUserPackStatus() {
  console.log('🔍 === DIAGNOSTIC PACK UTILISATEUR ===');
  
  // ID utilisateur des logs
  const userId = '9c97cee9-9c65-47dd-b75b-3d7a0f513701';
  console.log('👤 User ID:', userId);
  
  try {
    // Récupérer le client Supabase depuis le module
    let supabase;
    
    // Essayer différentes méthodes pour récupérer le client Supabase
    if (window.supabase) {
      supabase = window.supabase;
    } else if (window._supabase) {
      supabase = window._supabase;
    } else {
      // Essayer d'importer depuis le module (si disponible)
      try {
        const { supabase: supabaseClient } = await import('/src/lib/supabase.js');
        supabase = supabaseClient;
      } catch (importError) {
        console.error('❌ Impossible d\'importer le client Supabase:', importError);
        console.log('💡 SOLUTION: Copiez ce script dans la console de votre application React en cours d\'exécution');
        console.log('💡 Ou utilisez directement les requêtes SQL dans Supabase Dashboard');
        return;
      }
    }
    
    if (!supabase) {
      console.error('❌ Supabase client non trouvé');
      console.log('💡 SOLUTION: Assurez-vous d\'être sur la page de votre application React');
      return;
    }
    
    console.log('✅ Client Supabase trouvé');
    
    console.log('\n📊 === VÉRIFICATION DES PACKS UTILISATEUR ===');
    
    // 1. Récupérer TOUS les packs de l'utilisateur (actifs et inactifs)
    const { data: allUserPacks, error: packsError } = await supabase
      .from('user_packs')
      .select(`
        *,
        packs(
          id,
          name,
          price,
          currency,
          billing_period
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (packsError) {
      console.error('❌ Erreur récupération packs:', packsError);
      return;
    }
    
    console.log('📦 Tous les packs utilisateur:', allUserPacks);
    console.log('📊 Nombre total de packs:', allUserPacks?.length || 0);
    
    // 2. Filtrer les packs actifs
    const activePacks = allUserPacks?.filter(pack => pack.status === 'active') || [];
    console.log('\n✅ Packs actifs:', activePacks);
    console.log('📊 Nombre de packs actifs:', activePacks.length);
    
    // 3. Vérifier les transactions récentes
    console.log('\n💳 === VÉRIFICATION DES TRANSACTIONS ===');
    const { data: transactions, error: transError } = await supabase
      .from('transactions')
      .select(`
        *,
        packs(
          id,
          name,
          price
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (transError) {
      console.error('❌ Erreur récupération transactions:', transError);
    } else {
      console.log('💰 Transactions récentes:', transactions);
      const successfulTransactions = transactions?.filter(t => t.status === 'completed') || [];
      console.log('✅ Transactions réussies:', successfulTransactions.length);
    }
    
    // 4. Vérifier le selected_pack dans users
    console.log('\n👤 === VÉRIFICATION UTILISATEUR ===');
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select(`
        id,
        email,
        selected_pack,
        packs(
          id,
          name,
          price
        )
      `)
      .eq('id', userId)
      .single();
    
    if (userError) {
      console.error('❌ Erreur récupération utilisateur:', userError);
    } else {
      console.log('👤 Données utilisateur:', userData);
    }
    
    // 5. Diagnostic final
    console.log('\n🔍 === DIAGNOSTIC FINAL ===');
    
    if (activePacks.length === 0) {
      console.log('❌ PROBLÈME: Aucun pack actif trouvé');
    } else if (activePacks.length === 1) {
      const currentPack = activePacks[0];
      console.log('📦 Pack actuel:', currentPack.packs?.name);
      console.log('💰 Prix:', currentPack.packs?.price, currentPack.packs?.currency);
      
      if (currentPack.packs?.name === 'Pack Découverte' && transactions?.some(t => t.status === 'completed')) {
        console.log('⚠️  PROBLÈME IDENTIFIÉ: Pack Découverte actif malgré des paiements réussis');
        console.log('🔧 SOLUTION: Le webhook Stripe n\'a probablement pas mis à jour le pack');
      } else if (currentPack.packs?.name === 'Pack Découverte') {
        console.log('ℹ️  NORMAL: Pack Découverte actif, aucun paiement réussi trouvé');
      } else {
        console.log('✅ NORMAL: Pack payant actif');
      }
    } else {
      console.log('⚠️  ATTENTION: Plusieurs packs actifs détectés');
      activePacks.forEach((pack, index) => {
        console.log(`📦 Pack ${index + 1}:`, pack.packs?.name, '-', pack.packs?.price, pack.packs?.currency);
      });
    }
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
})();