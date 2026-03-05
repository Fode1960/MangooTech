/**
 * Script de correction automatique à intégrer dans le dashboard
 * À copier-coller dans la console du navigateur sur http://localhost:3001/dashboard
 */

(function() {
  'use strict';
  
  console.log('🚀 === CORRECTION AUTOMATIQUE DU PACK ===');
  console.log('🔧 Initialisation de la correction...');
  
  // Fonction principale de correction
  async function fixPackSync() {
    try {
      console.log('\n🔍 Étape 1: Vérification de l\'authentification...');
      
      // Vérifier l'authentification
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error('❌ ERREUR: Utilisateur non connecté');
        alert('❌ Vous devez être connecté pour effectuer cette correction');
        return false;
      }
      
      console.log(`✅ Utilisateur connecté: ${user.email}`);
      
      console.log('\n📊 Étape 2: Récupération des données...');
      
      // Récupérer les données utilisateur
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (userError) {
        console.error('❌ Erreur récupération utilisateur:', userError);
        return false;
      }
      
      // Récupérer la dernière transaction réussie
      const { data: lastTransaction, error: transactionError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'succeeded')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (transactionError || !lastTransaction) {
        console.log('ℹ️ Aucune transaction réussie trouvée');
        alert('ℹ️ Aucune transaction réussie trouvée. Rien à corriger.');
        return false;
      }
      
      // Récupérer les packs actifs actuels
      const { data: activePacks, error: packsError } = await supabase
        .from('user_packs')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true);
      
      if (packsError) {
        console.error('❌ Erreur récupération packs:', packsError);
        return false;
      }
      
      console.log(`👤 Selected pack actuel: ${userData.selected_pack || 'Aucun'}`);
      console.log(`💳 Dernière transaction: ${lastTransaction.pack_slug}`);
      console.log(`📦 Packs actifs: ${activePacks?.length || 0}`);
      
      if (activePacks?.length > 0) {
        activePacks.forEach(pack => {
          console.log(`  - ${pack.pack_slug} (depuis ${new Date(pack.activated_at).toLocaleString()})`);
        });
      }
      
      console.log('\n🔍 Étape 3: Analyse de la synchronisation...');
      
      // Vérifier si correction nécessaire
      const hasCorrectActivePack = activePacks?.some(pack => pack.pack_slug === lastTransaction.pack_slug);
      const hasCorrectSelectedPack = userData.selected_pack === lastTransaction.pack_slug;
      
      if (hasCorrectActivePack && hasCorrectSelectedPack) {
        console.log('✅ SYNCHRONISATION CORRECTE - Aucune correction nécessaire');
        alert('✅ La synchronisation est déjà correcte!');
        return true;
      }
      
      console.log('❌ DÉSYNCHRONISATION DÉTECTÉE');
      console.log(`   - Pack actif correct: ${hasCorrectActivePack ? '✅' : '❌'}`);
      console.log(`   - Selected pack correct: ${hasCorrectSelectedPack ? '✅' : '❌'}`);
      
      console.log('\n🔧 Étape 4: Correction en cours...');
      
      // Désactiver tous les packs existants
      if (activePacks?.length > 0) {
        console.log('🔄 Désactivation des packs existants...');
        const { error: deactivateError } = await supabase
          .from('user_packs')
          .update({ is_active: false })
          .eq('user_id', user.id)
          .eq('is_active', true);
        
        if (deactivateError) {
          console.error('❌ Erreur désactivation packs:', deactivateError);
          return false;
        }
        console.log('✅ Packs existants désactivés');
      }
      
      // Créer le nouveau pack actif
      console.log('📦 Création du nouveau pack actif...');
      const newPack = {
        user_id: user.id,
        pack_slug: lastTransaction.pack_slug,
        is_active: true,
        activated_at: new Date().toISOString(),
        billing_cycle_start: lastTransaction.created_at,
        billing_cycle_end: new Date(new Date(lastTransaction.created_at).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
      };
      
      const { data: createdPack, error: createError } = await supabase
        .from('user_packs')
        .insert([newPack])
        .select()
        .single();
      
      if (createError) {
        console.error('❌ Erreur création pack:', createError);
        return false;
      }
      
      console.log(`✅ Nouveau pack créé: ${createdPack.pack_slug}`);
      
      // Mettre à jour selected_pack dans users
      console.log('👤 Mise à jour du selected_pack...');
      const { error: updateUserError } = await supabase
        .from('users')
        .update({ selected_pack: lastTransaction.pack_slug })
        .eq('id', user.id);
      
      if (updateUserError) {
        console.error('❌ Erreur mise à jour selected_pack:', updateUserError);
        return false;
      }
      
      console.log('✅ selected_pack mis à jour');
      
      console.log('\n🧹 Étape 5: Nettoyage du cache...');
      
      // Nettoyer le cache local
      try {
        localStorage.removeItem('user_pack_cache');
        localStorage.removeItem('pack_data');
        localStorage.removeItem('supabase.auth.token');
        sessionStorage.clear();
        console.log('✅ Cache local nettoyé');
      } catch (e) {
        console.log('⚠️ Nettoyage cache partiel');
      }
      
      console.log('\n🎉 === CORRECTION TERMINÉE AVEC SUCCÈS! ===');
      console.log(`📦 Pack synchronisé: ${lastTransaction.pack_slug}`);
      console.log('🔄 Rechargement de la page dans 3 secondes...');
      
      // Afficher une notification de succès
      alert(`🎉 Correction terminée avec succès!\n📦 Pack synchronisé: ${lastTransaction.pack_slug}\n🔄 La page va se recharger...`);
      
      // Recharger la page après un délai
      setTimeout(() => {
        window.location.reload();
      }, 3000);
      
      return true;
      
    } catch (error) {
      console.error('❌ ERREUR CRITIQUE lors de la correction:', error);
      alert(`❌ Erreur lors de la correction: ${error.message}`);
      return false;
    }
  }
  
  // Fonction de diagnostic rapide
  window.quickPackDiagnose = async function() {
    try {
      console.log('🔍 === DIAGNOSTIC RAPIDE ===');
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('❌ Non connecté');
        return;
      }
      
      const [userData, activePacks, lastTransaction] = await Promise.all([
        supabase.from('users').select('*').eq('id', user.id).single(),
        supabase.from('user_packs').select('*').eq('user_id', user.id).eq('is_active', true),
        supabase.from('transactions').select('*').eq('user_id', user.id).eq('status', 'succeeded').order('created_at', { ascending: false }).limit(1).single()
      ]);
      
      console.log('👤 Utilisateur:', userData.data?.email);
      console.log('📦 Selected pack:', userData.data?.selected_pack || 'Aucun');
      console.log('💳 Dernière transaction:', lastTransaction.data?.pack_slug || 'Aucune');
      console.log('🔄 Packs actifs:', activePacks.data?.length || 0);
      
      if (activePacks.data?.length > 0) {
        activePacks.data.forEach(pack => {
          console.log(`  - ${pack.pack_slug}`);
        });
      }
      
      const isSync = activePacks.data?.some(pack => pack.pack_slug === lastTransaction.data?.pack_slug) && 
                     userData.data?.selected_pack === lastTransaction.data?.pack_slug;
      
      console.log(isSync ? '✅ SYNCHRONISÉ' : '❌ DÉSYNCHRONISÉ');
      
    } catch (error) {
      console.error('Erreur diagnostic:', error);
    }
  };
  
  // Exposer la fonction de correction
  window.fixPackSync = fixPackSync;
  
  console.log('\n📋 === COMMANDES DISPONIBLES ===');
  console.log('🔧 fixPackSync() - Lance la correction automatique');
  console.log('🔍 quickPackDiagnose() - Diagnostic rapide');
  console.log('\n🚀 Prêt! Tapez fixPackSync() pour corriger le problème.');
  
  // Lancer automatiquement le diagnostic
  setTimeout(() => {
    console.log('\n🔍 Lancement automatique du diagnostic...');
    window.quickPackDiagnose();
  }, 1000);
  
})();

// Message d'aide
console.log('\n💡 AIDE:');
console.log('Pour corriger automatiquement: fixPackSync()');
console.log('Pour un diagnostic rapide: quickPackDiagnose()');