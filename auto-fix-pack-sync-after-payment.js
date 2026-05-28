/**
 * Script de correction automatique pour la synchronisation du pack après paiement
 * 
 * Ce script doit être intégré dans le Dashboard pour s'exécuter automatiquement
 * après un paiement réussi et corriger les problèmes de synchronisation.
 */

// Fonction principale de correction automatique
export async function autoFixPackSyncAfterPayment(userId) {
  console.log('🔧 === AUTO-FIX SYNCHRONISATION PACK ===');
  console.log('👤 User ID:', userId);
  
  try {
    // 1. Attendre un peu pour laisser le webhook Stripe se terminer
    console.log('⏳ Attente de 2 secondes pour le webhook Stripe...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 2. Vérifier la dernière transaction
    console.log('💳 Vérification de la dernière transaction...');
    const { data: lastTransaction, error: transError } = await supabase
      .from('transactions')
      .select(`
        *,
        packs(id, name, slug, price)
      `)
      .eq('user_id', userId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (transError || !lastTransaction) {
      console.log('ℹ️ Aucune transaction récente trouvée, pas de correction nécessaire');
      return { success: true, message: 'Aucune correction nécessaire' };
    }
    
    console.log('✅ Transaction trouvée:', lastTransaction.packs?.name);
    
    // 3. Vérifier le pack actuel
    console.log('📦 Vérification du pack actuel...');
    const { data: currentPack, error: packError } = await supabase
      .from('user_packs')
      .select(`
        *,
        packs(id, name, slug)
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    // 4. Déterminer si une correction est nécessaire
    const needsCorrection = 
      packError || // Aucun pack actif
      !currentPack || // Aucun pack trouvé
      currentPack.pack_id !== lastTransaction.pack_id; // Pack incorrect
    
    if (!needsCorrection) {
      console.log('✅ Synchronisation correcte, aucune correction nécessaire');
      return { success: true, message: 'Synchronisation correcte' };
    }
    
    console.log('🔧 Correction nécessaire...');
    
    // 5. Désactiver tous les packs actuels
    console.log('1️⃣ Désactivation des packs actuels...');
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
      throw new Error('Erreur lors de la désactivation des packs');
    }
    
    // 6. Activer le pack correspondant à la transaction
    console.log('2️⃣ Activation du pack payé...');
    const nextBillingDate = new Date();
    nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
    
    const { error: activateError, data: newPack } = await supabase
      .from('user_packs')
      .insert({
        user_id: userId,
        pack_id: lastTransaction.pack_id,
        status: 'active',
        started_at: new Date().toISOString(),
        next_billing_date: nextBillingDate.toISOString()
      })
      .select(`
        *,
        packs(id, name, slug, price)
      `)
      .single();
    
    if (activateError) {
      console.error('❌ Erreur activation:', activateError);
      throw new Error('Erreur lors de l\'activation du pack');
    }
    
    console.log('✅ Pack activé:', newPack.packs?.name);
    
    // 7. Mettre à jour selected_pack dans users si nécessaire
    console.log('3️⃣ Mise à jour du selected_pack...');
    const packSlug = lastTransaction.packs?.slug || 
                    lastTransaction.packs?.name?.toLowerCase().replace(/\s+/g, '-');
    
    if (packSlug) {
      const { error: updateUserError } = await supabase
        .from('users')
        .update({ selected_pack: packSlug })
        .eq('id', userId);
      
      if (updateUserError) {
        console.warn('⚠️ Erreur mise à jour selected_pack:', updateUserError);
      } else {
        console.log('✅ Selected_pack mis à jour:', packSlug);
      }
    }
    
    console.log('🎉 Correction automatique terminée avec succès!');
    
    return {
      success: true,
      message: `Pack "${newPack.packs?.name}" activé avec succès`,
      packName: newPack.packs?.name,
      packId: newPack.pack_id
    };
    
  } catch (error) {
    console.error('❌ Erreur lors de la correction automatique:', error);
    return {
      success: false,
      message: error.message || 'Erreur lors de la correction automatique'
    };
  }
}

// Fonction pour vérifier et corriger périodiquement
export async function checkAndFixPackSync(userId, maxRetries = 3) {
  console.log('🔍 === VÉRIFICATION PÉRIODIQUE PACK SYNC ===');
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`🔄 Tentative ${attempt}/${maxRetries}...`);
    
    const result = await autoFixPackSyncAfterPayment(userId);
    
    if (result.success) {
      console.log('✅ Synchronisation vérifiée/corrigée avec succès');
      return result;
    }
    
    if (attempt < maxRetries) {
      console.log(`⏳ Attente de ${attempt * 2} secondes avant la prochaine tentative...`);
      await new Promise(resolve => setTimeout(resolve, attempt * 2000));
    }
  }
  
  console.error('❌ Échec de la synchronisation après toutes les tentatives');
  return { success: false, message: 'Échec après toutes les tentatives' };
}

// Fonction pour intégration dans le Dashboard
export function setupAutoFixAfterPayment() {
  // Écouter les changements d'URL pour détecter les retours de paiement
  const urlParams = new URLSearchParams(window.location.search);
  const paymentSuccess = urlParams.get('payment') === 'success' || urlParams.get('success') === 'true';
  
  if (paymentSuccess) {
    console.log('💳 Paiement réussi détecté, lancement de la correction automatique...');
    
    // Récupérer l'utilisateur actuel
    supabase.auth.getUser().then(({ data: { user }, error }) => {
      if (error || !user) {
        console.error('❌ Impossible de récupérer l\'utilisateur:', error);
        return;
      }
      
      // Lancer la correction avec retry
      checkAndFixPackSync(user.id).then(result => {
        if (result.success) {
          console.log('🎉 Auto-fix terminé:', result.message);
          
          // Déclencher un rafraîchissement des données
          if (typeof window.refreshUserServices === 'function') {
            window.refreshUserServices();
          } else if (typeof refreshUserServices === 'function') {
            refreshUserServices();
          }
        } else {
          console.error('❌ Auto-fix échoué:', result.message);
        }
      });
    });
  }
}

// Auto-exécution si le script est chargé directement
if (typeof window !== 'undefined') {
  // Exposer les fonctions globalement pour debug
  window.autoFixPackSyncAfterPayment = autoFixPackSyncAfterPayment;
  window.checkAndFixPackSync = checkAndFixPackSync;
  
  // Setup automatique
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupAutoFixAfterPayment);
  } else {
    setupAutoFixAfterPayment();
  }
}

// Export par défaut
export default {
  autoFixPackSyncAfterPayment,
  checkAndFixPackSync,
  setupAutoFixAfterPayment
};