import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Home, 
  ArrowLeft, 
  Search, 
  RefreshCw,
  Wifi,
  AlertTriangle
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

// Logo Mangoo Tech
const MangoLogo = ({ className = "w-16 h-16" }) => (
  <svg viewBox="0 0 200 200" className={className}>
    <defs>
      <linearGradient id="mangoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFA726"></stop>
        <stop offset="100%" stopColor="#FF6F00"></stop>
      </linearGradient>
      <linearGradient id="leafGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#66BB6A"></stop>
        <stop offset="100%" stopColor="#2E7D32"></stop>
      </linearGradient>
      <linearGradient id="leafGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#81C784"></stop>
        <stop offset="100%" stopColor="#388E3C"></stop>
      </linearGradient>
    </defs>
    <circle cx="100" cy="100" r="95" fill="#1B5E20"></circle>
    <ellipse cx="100" cy="120" rx="45" ry="55" fill="url(#mangoGradient)" transform="rotate(-15 100 120)"></ellipse>
    <path d="M85 45 Q70 30 85 15 Q100 25 95 40 Q90 50 85 45" fill="url(#leafGradient1)"></path>
    <path d="M115 35 Q130 20 145 35 Q140 50 125 45 Q110 40 115 35" fill="url(#leafGradient2)"></path>
    <ellipse cx="85" cy="100" rx="15" ry="25" fill="#FFE082" opacity="0.6" transform="rotate(-15 85 100)"></ellipse>
  </svg>
)

const NotFound = () => {
  const { t } = useTranslation()
  const [isVisible, setIsVisible] = useState(false)
  useEffect(() => {
    setIsVisible(true)
  }, [])

  const containerVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut",
        staggerChildren: 0.2
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  }

  const floatingVariants = {
    animate: {
      y: [-10, 10, -10],
      rotate: [-5, 5, -5],
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  }



  return (
    <div className="min-h-screen bg-gradient-hero relative overflow-hidden">
      <div className="absolute inset-0 bg-black/20"></div>
      
      {/* Éléments décoratifs flottants */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-20 left-10 w-20 h-20 bg-white/10 rounded-full"
          variants={floatingVariants}
          animate="animate"
        />
        <motion.div
          className="absolute top-40 right-20 w-16 h-16 bg-white/10 rounded-full"
          variants={floatingVariants}
          animate="animate"
          transition={{ delay: 1 }}
        />
        <motion.div
          className="absolute bottom-20 left-1/4 w-12 h-12 bg-white/10 rounded-full"
          variants={floatingVariants}
          animate="animate"
          transition={{ delay: 2 }}
        />
        <motion.div
          className="absolute top-1/3 right-1/4 w-24 h-24 bg-orange-400/10 rounded-full blur-xl"
          variants={floatingVariants}
          animate="animate"
          transition={{ delay: 0.5 }}
        />
        <motion.div
          className="absolute bottom-1/3 left-1/3 w-32 h-32 bg-green-400/10 rounded-full blur-xl"
          variants={floatingVariants}
          animate="animate"
          transition={{ delay: 1.5 }}
        />
      </div>
      
      <div className="container relative z-10 flex items-center justify-center min-h-screen px-4 pt-32">

        <motion.div
          className="text-center max-w-4xl mx-auto text-white"
          variants={containerVariants}
          initial="hidden"
          animate={isVisible ? "visible" : "hidden"}
        >
          {/* Logo Mangoo animé */}
          <motion.div
            className="mb-8 flex justify-center"
            variants={itemVariants}
          >
            <motion.div
              whileHover={{ scale: 1.1 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="relative"
            >
              <MangoLogo className="w-24 h-24 mx-auto animate-bounce-slow" />
              <motion.div
                className="absolute inset-0 bg-orange-400/20 rounded-full blur-xl"
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.5, 0, 0.5]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            </motion.div>
          </motion.div>

          {/* Code d'erreur 404 avec effet glitch */}
          <motion.div
            className="mb-6"
            variants={itemVariants}
          >
            <motion.h1
              className="text-8xl md:text-9xl font-bold bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 bg-clip-text text-transparent leading-none"
              variants={itemVariants}
            >
              404
            </motion.h1>
          </motion.div>

          {/* Titre principal */}
          <motion.h2
            className="text-3xl md:text-4xl font-bold text-white mb-4"
            variants={itemVariants}
          >
            Page introuvable
          </motion.h2>

          {/* Description */}
          <motion.p
            className="text-lg text-white/90 mb-8 leading-relaxed"
            variants={itemVariants}
          >
            Oups ! Il semble que la page que vous recherchez n'existe pas ou a été déplacée.
            <br className="hidden md:block" />
            Mais ne vous inquiétez pas, nous sommes là pour vous aider à retrouver votre chemin.
          </motion.p>

          {/* Suggestions d'actions */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
            variants={itemVariants}
          >
            <motion.div
              className="p-4 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20"
              whileHover={{ y: -5, scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Search className="w-8 h-8 text-orange-400 mx-auto mb-2" />
              <h3 className="font-semibold text-white mb-1">Rechercher</h3>
              <p className="text-sm text-white/80">Utilisez notre moteur de recherche</p>
            </motion.div>

            <motion.div
              className="p-4 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20"
              whileHover={{ y: -5, scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Wifi className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <h3 className="font-semibold text-white mb-1">Connexion</h3>
              <p className="text-sm text-white/80">Vérifiez votre connexion internet</p>
            </motion.div>

            <motion.div
              className="p-4 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20"
              whileHover={{ y: -5, scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <RefreshCw className="w-8 h-8 text-orange-400 mx-auto mb-2" />
              <h3 className="font-semibold text-white mb-1">Actualiser</h3>
              <p className="text-sm text-white/80">Rechargez la page</p>
            </motion.div>
          </motion.div>

          {/* Boutons d'action */}
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            variants={itemVariants}
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                to="/"
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-lg shadow-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-300 group"
              >
                <Home className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                Retour à l'accueil
              </Link>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <button
                onClick={() => window.history.back()}
                className="inline-flex items-center px-6 py-3 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-lg border border-white/20 hover:bg-white/20 transition-all duration-300 group"
              >
                <ArrowLeft className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                Page précédente
              </button>
            </motion.div>
          </motion.div>

          {/* Message d'aide */}
          <motion.div
            className="mt-12 mb-16 p-6 bg-gradient-to-r from-green-500/20 to-orange-500/20 backdrop-blur-sm rounded-xl border border-white/20"
            variants={itemVariants}
          >
            <h3 className="text-lg font-semibold text-white mb-2">
              Besoin d'aide ?
            </h3>
            <p className="text-white/90 mb-4">
              Notre équipe est là pour vous accompagner dans votre transformation digitale.
            </p>
            <Link
              to="/contact"
              className="inline-flex items-center text-orange-300 font-semibold hover:text-orange-200 transition-colors"
            >
              Contactez-nous
              <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}

export default NotFound