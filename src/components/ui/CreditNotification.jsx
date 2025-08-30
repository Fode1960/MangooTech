import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, DollarSign, X, Gift } from 'lucide-react'

/**
 * Composant de notification pour afficher les crédits appliqués
 */
const CreditNotification = ({ 
  isVisible, 
  onClose, 
  creditAmount = 0, 
  packName = '', 
  changeType = 'downgrade',
  autoClose = true,
  duration = 5000 
}) => {
  const [isShowing, setIsShowing] = useState(isVisible)

  useEffect(() => {
    setIsShowing(isVisible)
    
    if (isVisible && autoClose) {
      const timer = setTimeout(() => {
        handleClose()
      }, duration)
      
      return () => clearTimeout(timer)
    }
  }, [isVisible, autoClose, duration])

  const handleClose = () => {
    setIsShowing(false)
    setTimeout(() => {
      if (onClose) onClose()
    }, 300) // Attendre la fin de l'animation
  }

  const formatCreditAmount = (amount) => {
    return (amount / 100).toLocaleString('fr-FR')
  }

  const getNotificationContent = () => {
    switch (changeType) {
      case 'downgrade':
        return {
          icon: <Gift className="w-6 h-6 text-green-600" />,
          title: 'Crédit appliqué !',
          message: `Vous avez reçu un crédit de ${formatCreditAmount(creditAmount)} FCFA suite à votre passage au ${packName}.`,
          bgColor: 'bg-green-50 dark:bg-green-900/20',
          borderColor: 'border-green-200 dark:border-green-800',
          textColor: 'text-green-800 dark:text-green-200'
        }
      case 'same_price':
        return {
          icon: <CheckCircle className="w-6 h-6 text-blue-600" />,
          title: 'Pack changé avec succès !',
          message: `Votre pack ${packName} a été activé. ${creditAmount > 0 ? `Crédit de ${formatCreditAmount(creditAmount)} FCFA appliqué.` : ''}`,
          bgColor: 'bg-blue-50 dark:bg-blue-900/20',
          borderColor: 'border-blue-200 dark:border-blue-800',
          textColor: 'text-blue-800 dark:text-blue-200'
        }
      default:
        return {
          icon: <CheckCircle className="w-6 h-6 text-green-600" />,
          title: 'Pack activé !',
          message: `Votre pack ${packName} a été activé avec succès.`,
          bgColor: 'bg-green-50 dark:bg-green-900/20',
          borderColor: 'border-green-200 dark:border-green-800',
          textColor: 'text-green-800 dark:text-green-200'
        }
    }
  }

  const content = getNotificationContent()

  return (
    <AnimatePresence>
      {isShowing && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.95 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed top-4 right-4 z-50 max-w-md w-full mx-4"
        >
          <div className={`${content.bgColor} ${content.borderColor} border rounded-lg shadow-lg p-4`}>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                {content.icon}
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className={`text-sm font-semibold ${content.textColor}`}>
                  {content.title}
                </h3>
                <p className={`text-sm ${content.textColor} mt-1`}>
                  {content.message}
                </p>
                
                {creditAmount > 0 && (
                  <div className="mt-3 flex items-center space-x-2 p-2 bg-white/50 dark:bg-gray-800/50 rounded-md">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      +{formatCreditAmount(creditAmount)} FCFA
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      ajouté à votre solde
                    </span>
                  </div>
                )}
              </div>
              
              <button
                onClick={handleClose}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default CreditNotification