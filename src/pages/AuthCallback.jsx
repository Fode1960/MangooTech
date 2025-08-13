import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  CheckCircle, 
  XCircle, 
  Loader2,
  ArrowLeft
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import MangoLogo from '../components/ui/MangoLogo'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card'

const AuthCallback = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState('loading') // loading, success, error
  const [message, setMessage] = useState('')

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Vérifier s'il y a des paramètres d'erreur dans l'URL
        const error = searchParams.get('error')
        const errorDescription = searchParams.get('error_description')

        if (error) {
          throw new Error(errorDescription || error)
        }

        // Utiliser la méthode getSession pour vérifier l'état d'authentification
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          throw sessionError
        }

        if (session && session.user) {
          // L'utilisateur est maintenant connecté, email confirmé
          localStorage.removeItem('pendingConfirmationEmail')
          
          setStatus('success')
          setMessage('Votre email a été confirmé avec succès ! Vous êtes maintenant connecté.')
          
          // Rediriger vers le dashboard après 2 secondes
          setTimeout(() => {
            navigate('/dashboard')
          }, 2000)
        } else {
          // Pas de session, mais pas d'erreur non plus
          // Cela peut signifier que l'email a été confirmé mais l'utilisateur doit se connecter
          setStatus('success')
          setMessage('Votre email a été confirmé avec succès ! Vous pouvez maintenant vous connecter.')
          
          // Rediriger vers la page de connexion après 3 secondes
          setTimeout(() => {
            navigate('/login', {
              state: {
                message: 'Email confirmé ! Vous pouvez maintenant vous connecter.'
              }
            })
          }, 3000)
        }
      } catch (error) {
        console.error('Erreur lors de la confirmation:', error)
        setStatus('error')
        setMessage(error.message || 'Une erreur est survenue lors de la confirmation de votre email')
      }
    }

    handleAuthCallback()
  }, [searchParams, navigate])

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader2 className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin" />
      case 'success':
        return <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
      case 'error':
        return <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
      default:
        return null
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case 'loading':
        return 'bg-blue-100 dark:bg-blue-900/30'
      case 'success':
        return 'bg-green-100 dark:bg-green-900/30'
      case 'error':
        return 'bg-red-100 dark:bg-red-900/30'
      default:
        return 'bg-gray-100 dark:bg-gray-900/30'
    }
  }

  const getStatusTitle = () => {
    switch (status) {
      case 'loading':
        return 'Confirmation en cours...'
      case 'success':
        return 'Email confirmé !'
      case 'error':
        return 'Erreur de confirmation'
      default:
        return 'Confirmation'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Logo */}
          <div className="text-center mb-8">
            <MangoLogo className="h-12 w-auto mx-auto" />
          </div>

          <Card className="shadow-xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardHeader className="text-center pb-6">
              <div className={`mx-auto w-16 h-16 ${getStatusColor()} rounded-full flex items-center justify-center mb-4`}>
                {getStatusIcon()}
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {getStatusTitle()}
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-300 mt-2">
                {status === 'loading' && 'Veuillez patienter pendant que nous confirmons votre email...'}
                {status === 'success' && 'Redirection automatique vers la page de connexion...'}
                {status === 'error' && 'Une erreur est survenue'}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Message */}
              <div className="text-center">
                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                  {message}
                </p>
              </div>

              {/* Actions */}
              {status === 'success' && (
                <div className="text-center space-y-4">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Redirection automatique dans quelques secondes...
                  </div>
                  <Button
                    onClick={() => navigate('/login')}
                    variant="default"
                    className="w-full"
                  >
                    Aller à la connexion maintenant
                  </Button>
                </div>
              )}

              {status === 'error' && (
                <div className="space-y-4">
                  <Button
                    onClick={() => navigate('/register')}
                    variant="default"
                    className="w-full"
                  >
                    Réessayer l'inscription
                  </Button>
                  <Button
                    onClick={() => navigate('/login')}
                    variant="outline"
                    className="w-full"
                  >
                    Aller à la connexion
                  </Button>
                </div>
              )}

              {/* Lien retour */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
                <button
                  onClick={() => navigate('/')}
                  className="inline-flex items-center justify-center w-full text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour à l'accueil
                </button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

export default AuthCallback