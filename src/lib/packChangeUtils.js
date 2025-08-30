// Utilitaires pour la gestion des changements de pack avec smart-pack-change

import { useState } from 'react'
import { supabase } from './supabase'

/**
 * Types de changements de pack supportés
 */
export const CHANGE_TYPES = {
  UPGRADE: 'upgrade',
  DOWNGRADE: 'downgrade', 
  SAME_PRICE: 'same_price',
  FIRST_PACK: 'first_pack'
}

/**
 * Messages d'interface utilisateur pour chaque type de changement
 */
export const getChangeTypeMessage = (changeType, packName, priceDifference = 0) => {
  const messages = {
    [CHANGE_TYPES.UPGRADE]: `Passer à ${packName} (+${Math.abs(priceDifference / 100).toLocaleString()} FCFA/mois)`,
    [CHANGE_TYPES.DOWNGRADE]: `Rétrograder vers ${packName} (Économie de ${Math.abs(priceDifference / 100).toLocaleString()} FCFA/mois)`,
    [CHANGE_TYPES.SAME_PRICE]: `Changer vers ${packName} (même prix)`,
    [CHANGE_TYPES.FIRST_PACK]: `Activer ${packName}`
  }
  
  return messages[changeType] || `Changer vers ${packName}`
}

/**
 * Texte du bouton selon le type de changement
 */
export const getButtonText = (changeType, packName, isLoading = false, isFree = false) => {
  if (isLoading) return 'Traitement...'
  
  if (isFree) {
    return changeType === CHANGE_TYPES.FIRST_PACK ? 'Choisir ce pack gratuit' : `Changer vers ${packName}`
  }
  
  const buttonTexts = {
    [CHANGE_TYPES.UPGRADE]: `Passer à ${packName}`,
    [CHANGE_TYPES.DOWNGRADE]: `Rétrograder vers ${packName}`,
    [CHANGE_TYPES.SAME_PRICE]: `Changer vers ${packName}`,
    [CHANGE_TYPES.FIRST_PACK]: `Activer ${packName}`
  }
  
  return buttonTexts[changeType] || `Changer vers ${packName}`
}

/**
 * Fonction principale pour changer de pack avec smart-pack-change
 */
export const changePackSmart = async (packId, options = {}) => {
  const {
    successUrl = `${window.location.origin}/dashboard?success=true&pack=${packId}`,
    cancelUrl = `${window.location.origin}/dashboard?canceled=true`,
    onSuccess = null,
    onError = null,
    onRequiresPayment = null
  } = options

  try {
    console.log('🔄 Changement de pack intelligent:', { packId, successUrl, cancelUrl })
    
    // Vérifier l'authentification avant d'appeler la fonction Edge
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      throw new Error('Vous devez être connecté pour changer de pack. Veuillez vous reconnecter.')
    }
    
    console.log('✅ Utilisateur authentifié:', user.email)
    
    const { data, error } = await supabase.functions.invoke('smart-pack-change', {
      body: {
        packId,
        successUrl,
        cancelUrl
      }
    })

    if (error) {
      console.error('❌ Erreur API smart-pack-change:', error)
      
      // Messages d'erreur plus spécifiques
      let errorMessage = 'Erreur lors du changement de pack'
      
      if (error.message) {
        if (error.message.includes('Auth session missing')) {
          errorMessage = 'Session expirée. Veuillez vous reconnecter.'
        } else if (error.message.includes('Non autorisé')) {
          errorMessage = 'Accès non autorisé. Veuillez vous reconnecter.'
        } else if (error.message.includes('Pack ID requis')) {
          errorMessage = 'Pack sélectionné invalide. Veuillez réessayer.'
        } else if (error.message.includes('Nouveau pack non trouvé')) {
          errorMessage = 'Le pack sélectionné n\'existe plus. Veuillez actualiser la page.'
        } else {
          errorMessage = error.message
        }
      }
      
      throw new Error(errorMessage)
    }

    console.log('✅ Réponse smart-pack-change:', data)

    if (data.success) {
      if (data.requiresPayment && data.checkoutUrl) {
        // Changement nécessitant un paiement (upgrade)
        console.log('💳 Redirection vers Stripe Checkout')
        
        if (onRequiresPayment) {
          onRequiresPayment(data)
        }
        
        // Redirection vers Stripe
        window.location.href = data.checkoutUrl
        return { success: true, requiresPayment: true, data }
        
      } else {
        // Changement immédiat (downgrade, same_price, first_pack)
        console.log('✅ Changement immédiat réussi')
        
        if (onSuccess) {
          onSuccess(data)
        }
        
        return { 
          success: true, 
          requiresPayment: false, 
          data,
          message: data.message,
          creditApplied: data.creditApplied || 0
        }
      }
    } else {
      throw new Error(data.message || 'Échec du changement de pack')
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du changement de pack:', error)
    
    if (onError) {
      onError(error)
    }
    
    throw error
  }
}

/**
 * Affiche une notification de succès avec gestion des crédits
 */
export const showPackChangeSuccess = (result, packName) => {
  let message = result.message || `Pack ${packName} activé avec succès !`
  
  // Déterminer le type de changement pour les notifications
  let changeType = 'success'
  if (result.changeType) {
    changeType = result.changeType
  } else if (result.creditApplied && result.creditApplied > 0) {
    changeType = 'downgrade' // Si crédit appliqué, probablement un downgrade
  }
  
  if (result.creditApplied && result.creditApplied > 0) {
    const creditAmount = (result.creditApplied / 100).toLocaleString('fr-FR')
    message += `\n💰 Crédit de ${creditAmount} FCFA appliqué à votre compte.`
  }
  
  return {
    type: 'success',
    title: 'Changement de pack réussi',
    message,
    duration: 5000,
    creditAmount: result.creditApplied || 0,
    changeType,
    packName,
    // Données pour les notifications React
    notificationData: {
      creditAmount: result.creditApplied || 0,
      packName,
      changeType,
      isVisible: true
    }
  }
}

/**
 * Affiche une notification d'erreur
 */
export const showPackChangeError = (error) => {
  return {
    type: 'error',
    title: 'Erreur de changement de pack',
    message: error.message || 'Une erreur est survenue lors du changement de pack.',
    duration: 5000
  }
}

/**
 * Valide si un changement de pack est possible
 */
export const validatePackChange = (currentPack, newPack, user) => {
  if (!user) {
    return {
      valid: false,
      error: 'Vous devez être connecté pour changer de pack'
    }
  }
  
  if (!newPack || !newPack.id) {
    return {
      valid: false,
      error: 'Pack de destination invalide'
    }
  }
  
  if (currentPack && currentPack.id === newPack.id) {
    return {
      valid: false,
      error: 'Vous avez déjà ce pack actif'
    }
  }
  
  return { valid: true }
}

/**
 * Hook personnalisé pour gérer l'état des changements de pack
 */
export const usePackChange = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  const handlePackChange = async (packId, packName, options = {}) => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await changePackSmart(packId, {
        ...options,
        onSuccess: (data) => {
          const notification = showPackChangeSuccess(data, packName)
          // Ici vous pouvez intégrer votre système de notifications
          console.log('Notification:', notification)
          if (options.onSuccess) options.onSuccess(data)
        },
        onError: (error) => {
          const notification = showPackChangeError(error)
          setError(notification.message)
          if (options.onError) options.onError(error)
        }
      })
      
      return result
      
    } catch (error) {
      const notification = showPackChangeError(error)
      setError(notification.message)
      throw error
    } finally {
      setLoading(false)
    }
  }
  
  return {
    loading,
    error,
    handlePackChange,
    clearError: () => setError(null)
  }
}

export default {
  CHANGE_TYPES,
  getChangeTypeMessage,
  getButtonText,
  changePackSmart,
  showPackChangeSuccess,
  showPackChangeError,
  validatePackChange,
  usePackChange
}