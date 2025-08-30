import React, { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { 
  changePackSmart, 
  getButtonText, 
  validatePackChange,
  showPackChangeSuccess,
  showPackChangeError,
  CHANGE_TYPES
} from '../../lib/packChangeUtils'
import { useCreditNotification } from '../../hooks/useCreditNotification'
import CreditNotification from '../ui/CreditNotification'

const PaymentButton = ({ 
  pack, 
  currentPack = null, 
  changeType = 'new', 
  className = '',
  onSuccess = null,
  onError = null,
  successUrl = null,
  cancelUrl = null
}) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { user } = useAuth()
  const creditNotification = useCreditNotification()

  // Déterminer le type de changement intelligent
  const getSmartChangeType = () => {
    if (!currentPack) return CHANGE_TYPES.FIRST_PACK
    
    if (changeType === 'upgrade') return CHANGE_TYPES.UPGRADE
    if (changeType === 'downgrade') return CHANGE_TYPES.DOWNGRADE
    
    return CHANGE_TYPES.SAME_PRICE
  }

  const smartChangeType = getSmartChangeType()
  const isFree = pack.price === 0 || pack.isFree

  const handlePayment = async () => {
    // Validation de base
    const validation = validatePackChange(currentPack, pack, user)
    if (!validation.valid) {
      alert(validation.error)
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      const defaultSuccessUrl = successUrl || `${window.location.origin}/dashboard?success=true&pack=${pack.id}`
      const defaultCancelUrl = cancelUrl || `${window.location.origin}/dashboard?canceled=true`
      
      const result = await changePackSmart(pack.id, {
        successUrl: defaultSuccessUrl,
        cancelUrl: defaultCancelUrl,
        onSuccess: (data) => {
          // Afficher notification de succès
          const notification = showPackChangeSuccess(data, pack.name)
          console.log('✅ Changement réussi:', notification)
          
          // Afficher la notification de crédit si applicable
          if (notification.creditAmount && notification.creditAmount > 0) {
            creditNotification.showDowngradeCredit(
              notification.creditAmount,
              notification.packName,
              notification.changeType
            )
          } else {
            creditNotification.showPackChangeSuccess(
              notification.packName,
              notification.changeType
            )
          }
          
          // Callback personnalisé
          if (onSuccess) {
            onSuccess(data, notification)
          } else {
            // Comportement par défaut - redirection après notification
            setTimeout(() => {
              window.location.href = defaultSuccessUrl
            }, 2000)
          }
        },
        onError: (error) => {
          const notification = showPackChangeError(error)
          setError(notification.message)
          
          if (onError) {
            onError(error, notification)
          }
        },
        onRequiresPayment: (data) => {
          console.log('💳 Paiement requis, redirection vers Stripe')
          // La redirection est gérée automatiquement par changePackSmart
        }
      })
      
      console.log('🔄 Résultat changement pack:', result)
      
    } catch (error) {
      console.error('❌ Erreur lors du changement de pack:', error)
      const notification = showPackChangeError(error)
      setError(notification.message)
      
      if (onError) {
        onError(error, notification)
      } else {
        alert(`Erreur: ${notification.message}`)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={className}>
      {error && (
        <div className="text-red-600 text-sm mb-2">
          {error}
        </div>
      )}
      <button
        onClick={handlePayment}
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded transition-colors"
      >
        {getButtonText(smartChangeType, pack.name, loading, isFree)}
      </button>
      
      {/* Notification de crédit */}
      <CreditNotification
        isVisible={creditNotification.isVisible}
        creditAmount={creditNotification.creditAmount}
        packName={creditNotification.packName}
        changeType={creditNotification.changeType}
        duration={creditNotification.duration}
        onClose={creditNotification.hideNotification}
      />
    </div>
  )
}

export default PaymentButton