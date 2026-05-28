/**
 * Script d'exécution automatique pour corriger le problème de pack
 * Se lance automatiquement au chargement de la page
 */

// Attendre que la page soit complètement chargée
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAutoFix);
} else {
  initAutoFix();
}

function initAutoFix() {
  // Attendre que Supabase soit disponible
  const checkSupabase = setInterval(() => {
    if (typeof supabase !== 'undefined') {
      clearInterval(checkSupabase);
      console.log('🚀 Auto-correction du pack en cours...');
      executeAutoFix();
    }
  }, 500);
}

async function executeAutoFix() {
  try {
    console.log('🔍 Vérification de l\'authentification...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.log('❌ Utilisateur non connecté');
      return;
    }

    console.log('✅ Utilisateur connecté:', user.email);
    
    // Récupérer les données utilisateur
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (userError) {
      console.error('❌ Erreur récupération utilisateur:', userError);
      return;
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

    if (transactionError) {
      console.log('ℹ️ Aucune transaction trouvée');
      return;
    }

    console.log('💳 Dernière transaction:', lastTransaction);

    // Récupérer les packs actifs
    const { data: activePacks, error: packsError } = await supabase
      .from('user_packs')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (packsError) {
      console.error('❌ Erreur récupération packs:', packsError);
      return;
    }

    console.log('📦 Packs actifs actuels:', activePacks);

    // Vérifier si correction nécessaire
    const needsCorrection = activePacks.length === 0 || 
      !activePacks.some(pack => pack.pack_slug === lastTransaction.pack_slug);

    if (!needsCorrection) {
      console.log('✅ Synchronisation correcte, aucune correction nécessaire');
      return;
    }

    console.log('🔧 Correction nécessaire - Début de la correction...');

    // Désactiver tous les packs existants
    if (activePacks.length > 0) {
      const { error: deactivateError } = await supabase
        .from('user_packs')
        .update({ is_active: false })
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (deactivateError) {
        console.error('❌ Erreur désactivation packs:', deactivateError);
        return;
      }
      console.log('🔄 Packs existants désactivés');
    }

    // Créer le nouveau pack actif
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
      return;
    }

    console.log('✅ Nouveau pack créé:', createdPack);

    // Mettre à jour selected_pack dans users
    const { error: updateUserError } = await supabase
      .from('users')
      .update({ selected_pack: lastTransaction.pack_slug })
      .eq('id', user.id);

    if (updateUserError) {
      console.error('❌ Erreur mise à jour selected_pack:', updateUserError);
      return;
    }

    console.log('✅ selected_pack mis à jour');

    // Nettoyer le cache local
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('user_pack_cache');
      localStorage.removeItem('pack_data');
      console.log('🧹 Cache local nettoyé');
    }

    console.log('🎉 CORRECTION TERMINÉE AVEC SUCCÈS!');
    console.log('🔄 Rechargement de la page dans 2 secondes...');
    
    // Recharger la page après un délai
    setTimeout(() => {
      window.location.reload();
    }, 2000);

  } catch (error) {
    console.error('❌ Erreur lors de la correction automatique:', error);
  }
}

// Fonction de diagnostic rapide
window.quickDiagnose = async function() {
  try {
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

    console.log('👤 Utilisateur:', userData.data);
    console.log('📦 Packs actifs:', activePacks.data);
    console.log('💳 Dernière transaction:', lastTransaction.data);
    
    const isSync = activePacks.data?.some(pack => pack.pack_slug === lastTransaction.data?.pack_slug);
    console.log(isSync ? '✅ SYNCHRONISÉ' : '❌ DÉSYNCHRONISÉ');
    
  } catch (error) {
    console.error('Erreur diagnostic:', error);
  }
};

console.log('🤖 Script de correction automatique chargé!');
console.log('📋 Commandes disponibles:');
console.log('  - quickDiagnose() : Diagnostic rapide');
console.log('  - executeAutoFix() : Correction manuelle');