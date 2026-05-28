/**
 * Script de diagnostic avancé pour identifier le problème d'affichage du pack
 * À exécuter dans la console du dashboard
 */

console.log('🔍 === DIAGNOSTIC AVANCÉ DU PACK ===\n');

// Fonction de diagnostic complet
async function diagnosePack() {
  try {
    console.log('1️⃣ Récupération des données utilisateur...');
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('❌ Utilisateur non connecté:', authError);
      return;
    }
    
    console.log('✅ Utilisateur:', user.email);
    
    // Récupérer toutes les données pertinentes
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
          next_billing_date,
          created_at,
          updated_at,
          packs(
            id,
            name,
            slug,
            price
          )
        ),
        transactions(
          id,
          pack_id,
          status,
          amount,
          created_at,
          packs(
            id,
            name,
            slug,
            price
          )
        )
      `)
      .eq('id', user.id)
      .single();
    
    if (userError) {
      console.error('❌ Erreur récupération:', userError);
      return;
    }
    
    console.log('\n2️⃣ Analyse des données...');
    
    // Analyser les packs
    const allUserPacks = userData.user_packs || [];
    const activePacks = allUserPacks.filter(up => up.status === 'active');
    const inactivePacks = allUserPacks.filter(up => up.status === 'inactive');
    
    console.log(`📦 Total packs utilisateur: ${allUserPacks.length}`);
    console.log(`✅ Packs actifs: ${activePacks.length}`);
    console.log(`❌ Packs inactifs: ${inactivePacks.length}`);
    
    // Analyser les transactions
    const allTransactions = userData.transactions || [];
    const completedTransactions = allTransactions
      .filter(t => t.status === 'completed')
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    console.log(`💳 Total transactions: ${allTransactions.length}`);
    console.log(`✅ Transactions réussies: ${completedTransactions.length}`);
    
    // Afficher les détails
    console.log('\n3️⃣ Détails des packs actifs:');
    activePacks.forEach((pack, index) => {
      console.log(`   ${index + 1}. ${pack.packs.name} (${pack.packs.slug})`);
      console.log(`      - ID: ${pack.pack_id}`);
      console.log(`      - Status: ${pack.status}`);
      console.log(`      - Démarré: ${new Date(pack.started_at).toLocaleString()}`);
      console.log(`      - Prochaine facturation: ${pack.next_billing_date ? new Date(pack.next_billing_date).toLocaleString() : 'Non définie'}`);
    });
    
    console.log('\n4️⃣ Dernières transactions:');
    completedTransactions.slice(0, 3).forEach((transaction, index) => {
      console.log(`   ${index + 1}. ${transaction.packs.name} - ${transaction.amount}€`);
      console.log(`      - Date: ${new Date(transaction.created_at).toLocaleString()}`);
      console.log(`      - Pack ID: ${transaction.pack_id}`);
    });
    
    console.log(`\n5️⃣ Selected pack actuel: ${userData.selected_pack}`);
    
    // Vérifier la cohérence
    console.log('\n6️⃣ Vérification de cohérence:');
    
    if (activePacks.length === 0) {
      console.log('❌ PROBLÈME: Aucun pack actif trouvé!');
    } else if (activePacks.length > 1) {
      console.log('⚠️  ATTENTION: Plusieurs packs actifs détectés!');
    } else {
      const activePack = activePacks[0];
      console.log(`✅ Un pack actif: ${activePack.packs.name}`);
      
      if (completedTransactions.length > 0) {
        const lastTransaction = completedTransactions[0];
        
        if (activePack.pack_id === lastTransaction.pack_id) {
          console.log('✅ Pack actif correspond à la dernière transaction');
        } else {
          console.log('❌ PROBLÈME: Pack actif ne correspond pas à la dernière transaction!');
          console.log(`   Pack actif: ${activePack.packs.name} (${activePack.pack_id})`);
          console.log(`   Dernière transaction: ${lastTransaction.packs.name} (${lastTransaction.pack_id})`);
        }
        
        if (userData.selected_pack === activePack.packs.slug) {
          console.log('✅ Selected pack correspond au pack actif');
        } else {
          console.log('❌ PROBLÈME: Selected pack ne correspond pas au pack actif!');
          console.log(`   Selected pack: ${userData.selected_pack}`);
          console.log(`   Pack actif slug: ${activePack.packs.slug}`);
        }
      }
    }
    
    // Vérifier le contexte React
    console.log('\n7️⃣ Vérification du contexte React...');
    
    // Essayer d'accéder aux données du contexte
    if (window.React && window.ReactDOM) {
      console.log('✅ React détecté');
      
      // Chercher les données dans le DOM ou le state
      const dashboardElement = document.querySelector('[data-testid="dashboard"], .dashboard, #dashboard');
      if (dashboardElement) {
        console.log('✅ Élément dashboard trouvé');
      } else {
        console.log('⚠️  Élément dashboard non trouvé');
      }
    }
    
    // Vérifier le localStorage/sessionStorage
    console.log('\n8️⃣ Vérification du stockage local...');
    
    const localStorageKeys = Object.keys(localStorage);
    const sessionStorageKeys = Object.keys(sessionStorage);
    
    console.log(`📱 LocalStorage keys: ${localStorageKeys.length}`);
    localStorageKeys.forEach(key => {
      if (key.includes('pack') || key.includes('user') || key.includes('supabase')) {
        console.log(`   - ${key}: ${localStorage.getItem(key)?.substring(0, 100)}...`);
      }
    });
    
    console.log(`📱 SessionStorage keys: ${sessionStorageKeys.length}`);
    sessionStorageKeys.forEach(key => {
      if (key.includes('pack') || key.includes('user') || key.includes('supabase')) {
        console.log(`   - ${key}: ${sessionStorage.getItem(key)?.substring(0, 100)}...`);
      }
    });
    
    return {
      user: userData,
      activePacks,
      completedTransactions,
      hasIssues: activePacks.length !== 1 || 
                 (completedTransactions.length > 0 && 
                  (activePacks[0]?.pack_id !== completedTransactions[0]?.pack_id ||
                   userData.selected_pack !== activePacks[0]?.packs?.slug))
    };
    
  } catch (error) {
    console.error('❌ Erreur diagnostic:', error);
    return null;
  }
}

// Fonction de correction forcée
async function forcePackCorrection() {
  try {
    console.log('🔧 === CORRECTION FORCÉE ===\n');
    
    const diagnostic = await diagnosePack();
    
    if (!diagnostic || !diagnostic.hasIssues) {
      console.log('✅ Aucun problème détecté ou correction non nécessaire');
      return;
    }
    
    const { user, completedTransactions } = diagnostic;
    
    if (completedTransactions.length === 0) {
      console.log('❌ Aucune transaction à utiliser pour la correction');
      return;
    }
    
    const targetTransaction = completedTransactions[0];
    console.log(`🎯 Correction vers: ${targetTransaction.packs.name}`);
    
    // 1. Nettoyer tous les packs existants
    console.log('1️⃣ Nettoyage des packs existants...');
    
    const { error: cleanError } = await supabase
      .from('user_packs')
      .delete()
      .eq('user_id', user.id);
    
    if (cleanError) {
      console.error('❌ Erreur nettoyage:', cleanError);
      return;
    }
    
    console.log('✅ Packs nettoyés');
    
    // 2. Créer le nouveau pack actif
    console.log('2️⃣ Création du nouveau pack actif...');
    
    const { error: createError } = await supabase
      .from('user_packs')
      .insert({
        user_id: user.id,
        pack_id: targetTransaction.pack_id,
        status: 'active',
        started_at: new Date().toISOString(),
        next_billing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      });
    
    if (createError) {
      console.error('❌ Erreur création:', createError);
      return;
    }
    
    console.log('✅ Nouveau pack créé');
    
    // 3. Mettre à jour selected_pack
    console.log('3️⃣ Mise à jour selected_pack...');
    
    const { error: updateError } = await supabase
      .from('users')
      .update({ selected_pack: targetTransaction.packs.slug })
      .eq('id', user.id);
    
    if (updateError) {
      console.error('❌ Erreur mise à jour:', updateError);
      return;
    }
    
    console.log('✅ Selected pack mis à jour');
    
    // 4. Nettoyer le cache
    console.log('4️⃣ Nettoyage du cache...');
    
    // Nettoyer localStorage et sessionStorage
    Object.keys(localStorage).forEach(key => {
      if (key.includes('supabase') || key.includes('pack') || key.includes('user')) {
        localStorage.removeItem(key);
      }
    });
    
    Object.keys(sessionStorage).forEach(key => {
      if (key.includes('supabase') || key.includes('pack') || key.includes('user')) {
        sessionStorage.removeItem(key);
      }
    });
    
    console.log('✅ Cache nettoyé');
    
    console.log('\n🎉 === CORRECTION FORCÉE TERMINÉE ===');
    console.log(`✨ Pack configuré: ${targetTransaction.packs.name}`);
    console.log('🔄 Rechargement de la page dans 2 secondes...');
    
    setTimeout(() => {
      window.location.reload();
    }, 2000);
    
  } catch (error) {
    console.error('❌ Erreur correction forcée:', error);
  }
}

// Export des fonctions
window.diagnosePack = diagnosePack;
window.forcePackCorrection = forcePackCorrection;

console.log('📋 === COMMANDES DISPONIBLES ===');
console.log('- diagnosePack() : Diagnostic complet');
console.log('- forcePackCorrection() : Correction forcée avec nettoyage');
console.log('\n🚀 Exécution automatique du diagnostic...');

// Auto-diagnostic
diagnosePack().then(result => {
  if (result && result.hasIssues) {
    console.log('\n💡 Problème détecté! Exécutez forcePackCorrection() pour corriger');
  } else if (result) {
    console.log('\n✅ Tout semble correct!');
  }
});