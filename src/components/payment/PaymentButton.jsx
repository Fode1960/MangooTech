import React, { useState } from 'react'
import { useNotify } from '@/hooks/useNotify'
import { motion } from 'framer-motion'
import { CreditCard, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useServices } from '../../contexts/ServicesContext'
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
import LoadingIndicator, { useLoading } from '../LoadingIndicator'
import { globalCache } from '../../utils/cacheManager'

const PaymentButton = ({ 
  pack, 
  currentPack = null, 
  changeType = 'new', 
  className = '',
  onSuccess = null,
  onError = null,
  successUrl = null,
  cancelUrl = null,
  disabled = false
}) => {
  const [error, setError] = useState(null)
  const { user } = useAuth()
  const { refreshUserServices } = useServices()
  const creditNotification = useCreditNotification()
  const { isLoading, withLoading, setLoadingError } = useLoading(false)

  // Déterminer le type de changement intelligent
  const getSmartChangeType = () => {
    if (!currentPack) {return CHANGE_TYPES.FIRST_PACK}
    
    if (changeType === 'upgrade') {return CHANGE_TYPES.UPGRADE}
    if (changeType === 'downgrade') {return CHANGE_TYPES.DOWNGRADE}
    
    return CHANGE_TYPES.SAME_PRICE
  }

  const smartChangeType = getSmartChangeType()
  const isFree = pack.price === 0 || pack.isFree

  const notify = useNotify()
  const handlePayment = async () => {
    // Validation de base
    const validation = validatePackChange(currentPack, pack, user)
    if (!validation.valid) {
      notify.error(validation.error)
      return
    }

    setError(null)
    
    try {
      await withLoading(async () => {
      const defaultSuccessUrl = successUrl || `${window.location.origin}/dashboard?success=true&pack=${pack.id}`
      const defaultCancelUrl = cancelUrl || `${window.location.origin}/dashboard?canceled=true`
      
      const result = await changePackSmart(pack.id, {
        successUrl: defaultSuccessUrl,
        cancelUrl: defaultCancelUrl,
        refreshUserData: refreshUserServices,
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
            showPackChangeSuccess(
              { changeType: notification.changeType },
              notification.packName
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
      
        // Invalider le cache des packs après un changement réussi
        globalCache.invalidatePattern('pack_.*')
        globalCache.invalidatePattern('user_.*')
      })
    } catch (error) {
      console.error('❌ Erreur lors du changement de pack:', error)
      const notification = showPackChangeError(error)
      setError(notification.message)
      setLoadingError(notification.message)
      
      if (onError) {
        onError(error, notification)
      } else {
        notify.error(`Erreur: ${notification.message}`)
      }
    }
  }

  return (
    <div className={className}>
      {error && (
        <div className="text-red-600 text-sm mb-2">
          {error}
        </div>
      )}
      <motion.button
        onClick={handlePayment}
        disabled={disabled || isLoading || !user}
        className={`w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded transition-colors ${
          disabled || isLoading || !user ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'
        }`}
        whileHover={{ scale: disabled || isLoading || !user ? 1 : 1.05 }}
        whileTap={{ scale: disabled || isLoading || !user ? 1 : 0.95 }}
      >
        <div className="flex items-center justify-center gap-2">
          {isLoading ? (
            <LoadingIndicator size="small" message="" />
          ) : (
            <CreditCard className="w-4 h-4" />
          )}
          <span className="font-medium">
            {isLoading ? 'Traitement...' : getButtonText(smartChangeType, pack.name, isLoading, isFree)}
          </span>
        </div>
      </motion.button>
      
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