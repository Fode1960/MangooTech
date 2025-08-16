import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Cookie, X, Settings, Check } from 'lucide-react'
import { Link } from 'react-router-dom'

const CookieBanner = () => {
  const [isVisible, setIsVisible] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [preferences, setPreferences] = useState({
    necessary: true, // Toujours activé
    analytics: false,
    marketing: false,
    functional: false
  })

  useEffect(() => {
    // Vérifier si l'utilisateur a déjà donné son consentement
    const cookieConsent = localStorage.getItem('cookieConsent')
    if (!cookieConsent) {
      setIsVisible(true)
    }
  }, [])

  const handleAcceptAll = () => {
    const consent = {
      necessary: true,
      analytics: true,
      marketing: true,
      functional: true,
      timestamp: new Date().toISOString()
    }
    localStorage.setItem('cookieConsent', JSON.stringify(consent))
    setIsVisible(false)
  }

  const handleRejectAll = () => {
    const consent = {
      necessary: true,
      analytics: false,
      marketing: false,
      functional: false,
      timestamp: new Date().toISOString()
    }
    localStorage.setItem('cookieConsent', JSON.stringify(consent))
    setIsVisible(false)
  }

  const handleSavePreferences = () => {
    const consent = {
      ...preferences,
      timestamp: new Date().toISOString()
    }
    localStorage.setItem('cookieConsent', JSON.stringify(consent))
    setIsVisible(false)
  }

  const handlePreferenceChange = (type) => {
    if (type === 'necessary') return // Ne peut pas être désactivé
    setPreferences(prev => ({
      ...prev,
      [type]: !prev[type]
    }))
  }

  const cookieTypes = [
    {
      id: 'necessary',
      name: 'Cookies nécessaires',
      description: 'Ces cookies sont essentiels au fonctionnement du site et ne peuvent pas être désactivés.',
      required: true
    },
    {
      id: 'functional',
      name: 'Cookies fonctionnels',
      description: 'Ces cookies permettent d\'améliorer les fonctionnalités et la personnalisation du site.'
    },
    {
      id: 'analytics',
      name: 'Cookies analytiques',
      description: 'Ces cookies nous aident à comprendre comment vous utilisez notre site pour l\'améliorer.'
    },
    {
      id: 'marketing',
      name: 'Cookies marketing',
      description: 'Ces cookies sont utilisés pour vous proposer des publicités pertinentes.'
    }
  ]

  if (!isVisible) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-2xl"
      >
        <div className="container mx-auto px-4 py-6">
          {!showSettings ? (
            // Vue principale
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div className="flex items-start space-x-4 flex-1">
                <div className="bg-orange-100 dark:bg-orange-900/30 p-2 rounded-lg flex-shrink-0">
                  <Cookie className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    Nous utilisons des cookies
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                    Nous utilisons des cookies pour améliorer votre expérience sur notre site, 
                    analyser le trafic et personnaliser le contenu. En continuant à naviguer, 
                    vous acceptez notre utilisation des cookies.
                  </p>
                  <Link 
                    to="/cookies" 
                    className="text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 text-sm font-medium underline mt-1 inline-block"
                  >
                    En savoir plus sur notre politique des cookies
                  </Link>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 lg:flex-shrink-0">
                <button
                  onClick={() => setShowSettings(true)}
                  className="flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Personnaliser
                </button>
                <button
                  onClick={handleRejectAll}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                >
                  Refuser tout
                </button>
                <button
                  onClick={handleAcceptAll}
                  className="px-6 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors"
                >
                  Accepter tout
                </button>
              </div>
            </div>
          ) : (
            // Vue des paramètres
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Paramètres des cookies
                </h3>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="grid gap-4 max-h-64 overflow-y-auto">
                {cookieTypes.map((type) => (
                  <div key={type.id} className="flex items-start justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="flex-1 mr-4">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                        {type.name}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {type.description}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <button
                        onClick={() => handlePreferenceChange(type.id)}
                        disabled={type.required}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${
                          preferences[type.id]
                            ? 'bg-orange-600'
                            : 'bg-gray-200 dark:bg-gray-600'
                        } ${type.required ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            preferences[type.id] ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200 dark:border-gray-600">
                <button
                  onClick={handleRejectAll}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                >
                  Refuser tout
                </button>
                <button
                  onClick={handleSavePreferences}
                  className="flex-1 flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Enregistrer les préférences
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

export default CookieBanner