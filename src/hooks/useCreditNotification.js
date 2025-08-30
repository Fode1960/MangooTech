import { useState, useCallback } from 'react'

/**
 * Hook personnalisé pour gérer les notifications de crédit
 */
export const useCreditNotification = () => {
  const [notification, setNotification] = useState({
    isVisible: false,
    creditAmount: 0,
    packName: '',
    changeType: 'downgrade',
    duration: 5000
  })

  /**
   * Affiche une notification de crédit
   */
  const showCreditNotification = useCallback(({
    creditAmount,
    packName,
    changeType = 'downgrade',
    duration = 5000
  }) => {
    setNotification({
      isVisible: true,
      creditAmount,
      packName,
      changeType,
      duration
    })
  }, [])

  /**
   * Masque la notification
   */
  const hideCreditNotification = useCallback(() => {
    setNotification(prev => ({
      ...prev,
      isVisible: false
    }))
  }, [])

  /**
   * Affiche une notification pour un downgrade avec crédit
   */
  const showDowngradeCredit = useCallback((creditAmount, packName) => {
    showCreditNotification({
      creditAmount,
      packName,
      changeType: 'downgrade',
      duration: 6000 // Plus long pour les downgrades
    })
  }, [showCreditNotification])

  /**
   * Affiche une notification pour un changement de pack avec crédit
   */
  const showPackChangeCredit = useCallback((creditAmount, packName, changeType = 'same_price') => {
    showCreditNotification({
      creditAmount,
      packName,
      changeType,
      duration: 5000
    })
  }, [showCreditNotification])

  /**
   * Affiche une notification de succès simple
   */
  const showSuccessNotification = useCallback((packName) => {
    showCreditNotification({
      creditAmount: 0,
      packName,
      changeType: 'success',
      duration: 4000
    })
  }, [showCreditNotification])

  return {
    notification,
    showCreditNotification,
    hideCreditNotification,
    showDowngradeCredit,
    showPackChangeCredit,
    showSuccessNotification
  }
}

export default useCreditNotification