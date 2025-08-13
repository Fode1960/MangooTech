import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { 
  Mail, 
  CheckCircle, 
  ArrowLeft,
  RefreshCw,
  Clock,
  AlertCircle
} from 'lucide-react'
import MangoLogo from '../components/ui/MangoLogo'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card'
import { supabase } from '../lib/supabase'

const EmailConfirmation = () => {
  const { t } = useTranslation()
  const location = useLocation()
  const [isResending, setIsResending] = useState(false)
  const [resendMessage, setResendMessage] = useState('')
  const [resendError, setResendError] = useState('')

  // Récupérer l'email depuis l'état de navigation ou le localStorage
  const userEmail = location.state?.email || localStorage.getItem('pendingConfirmationEmail')

  const handleResendEmail = async () => {
    if (!userEmail) {
      setResendError('Adresse email non trouvée. Veuillez vous réinscrire.')
      return
    }

    setIsResending(true)
    setResendError('')
    setResendMessage('')

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: userEmail
      })

      if (error) {
        throw error
      }

      setResendMessage('Email de confirmation renvoyé avec succès !')
    } catch (error) {
      console.error('Erreur lors du renvoi de l\'email:', error)
      setResendError(error.message || 'Erreur lors du renvoi de l\'email')
    } finally {
      setIsResending(false)
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
            <Link to="/" className="inline-block">
              <MangoLogo className="h-12 w-auto" />
            </Link>
          </div>

          <Card className="shadow-xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardHeader className="text-center pb-6">
              <div className="mx-auto w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mb-4">
                <Mail className="w-8 h-8 text-primary-600 dark:text-primary-400" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Vérifiez votre email
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-300 mt-2">
                Un email de confirmation a été envoyé à votre adresse
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Message principal */}
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center space-x-2 text-green-600 dark:text-green-400">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Compte créé avec succès !</span>
                </div>
                
                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                  Nous avons envoyé un lien de confirmation à votre adresse email. 
                  Cliquez sur le lien dans l'email pour activer votre compte et vous connecter.
                </p>
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-800 dark:text-blue-200 mb-1">
                      Que faire maintenant ?
                    </p>
                    <ul className="text-blue-700 dark:text-blue-300 space-y-1">
                      <li>• Vérifiez votre boîte de réception</li>
                      <li>• Regardez aussi dans vos spams/courriers indésirables</li>
                      <li>• Cliquez sur le lien de confirmation</li>
                      <li>• Revenez vous connecter</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Messages de retour */}
              {resendMessage && (
                <div className="flex items-center p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mr-3 flex-shrink-0" />
                  <span className="text-green-800 dark:text-green-300 text-sm">{resendMessage}</span>
                </div>
              )}

              {resendError && (
                <div className="flex items-center p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-3 flex-shrink-0" />
                  <span className="text-red-800 dark:text-red-300 text-sm">{resendError}</span>
                </div>
              )}

              {/* Bouton de renvoi */}
              <div className="text-center space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Vous n'avez pas reçu l'email ?
                </p>
                
                <Button
                  onClick={handleResendEmail}
                  variant="outline"
                  className="w-full"
                  disabled={isResending || !userEmail}
                >
                  {isResending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Renvoyer l'email de confirmation
                    </>
                  )}
                </Button>
                
                {!userEmail && (
                  <p className="text-xs text-red-600 dark:text-red-400">
                    Adresse email non disponible. Veuillez vous réinscrire.
                  </p>
                )}
              </div>

              {/* Liens de navigation */}
              <div className="pt-6 border-t border-gray-200 dark:border-gray-600 space-y-4">
                <Link
                  to="/login"
                  className="block w-full"
                >
                  <Button variant="default" className="w-full">
                    Aller à la page de connexion
                  </Button>
                </Link>
                
                <Link
                  to="/"
                  className="inline-flex items-center justify-center w-full text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour à l'accueil
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

export default EmailConfirmation