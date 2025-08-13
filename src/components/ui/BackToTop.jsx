import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronUp } from 'lucide-react'

/**
 * Composant bouton "Retour en haut" qui apparaît en bas à droite de l'écran
 */
const BackToTop = () => {
  const [isVisible, setIsVisible] = useState(false)

  // Gérer la visibilité du bouton en fonction du scroll
  useEffect(() => {
    const toggleVisibility = () => {
      // Afficher le bouton après avoir scrollé de 300px
      if (window.pageYOffset > 300) {
        setIsVisible(true)
      } else {
        setIsVisible(false)
      }
    }

    window.addEventListener('scroll', toggleVisibility)
    return () => window.removeEventListener('scroll', toggleVisibility)
  }, [])

  // Fonction pour remonter en haut de la page
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 w-12 h-12 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Retour en haut de la page"
        >
          <ChevronUp 
            className="w-6 h-6 transition-transform duration-300 group-hover:-translate-y-0.5" 
          />
          
          {/* Effet de brillance au survol */}
          <div className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
          
          {/* Cercle d'animation au clic */}
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-white"
            initial={{ scale: 1, opacity: 0 }}
            whileTap={{ scale: 1.5, opacity: 0.3 }}
            transition={{ duration: 0.2 }}
          />
        </motion.button>
      )}
    </AnimatePresence>
  )
}

export default BackToTop