import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { 
  Mail, 
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  Send
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import MangoLogo from '../components/ui/MangoLogo'
import { Button } from '../components/ui/Button'
import { Input, Label } from '../components/ui/Input'
import { Card, CardContent } from '../components/ui/Card'

const ForgotPassword = () => {
  const { t } = useTranslation()
  
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })

      if (error) {
        throw error
      }

      setSuccess(true)
    } catch (err) {
      console.error('Erreur lors de l\'envoi de l\'email:', err)
      setError(err.message || 'Une erreur est survenue lors de l\'envoi de l\'email')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e) => {
    setEmail(e.target.value)
    if (error) {setError('')}
  }

  if (success) {
    return (
      <div className="min-h-screen pt-24 bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <Link to="/" className="inline-block mb-6">
              <MangoLogo className="h-16 w-auto mx-auto" />
            </Link>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Email envoyé !
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Vérifiez votre boîte de réception
            </p>
          </motion.div>

          {/* Message de succès */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <Card className="shadow-xl border-0">
              <CardContent className="pt-6">
                <div className="text-center space-y-6">
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </div>
                  
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Instructions envoyées
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      Nous avons envoyé un lien de réinitialisation à <strong>{email}</strong>.
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Cliquez sur le lien dans l'email pour créer un nouveau mot de passe. 
                      Si vous ne voyez pas l'email, vérifiez votre dossier spam.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <Button
                      onClick={() => window.location.reload()}
                      variant="outline"
                      className="w-full"
                    >
                      Renvoyer l'email
                    </Button>
                    
                    <Link
                      to="/login"
                      className="inline-flex items-center justify-center w-full text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Retour à la connexion
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-24 bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <Link to="/" className="inline-block mb-6">
            <MangoLogo className="h-16 w-auto mx-auto" />
          </Link>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Mot de passe oublié ?
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Entrez votre email pour recevoir un lien de réinitialisation
          </p>
        </motion.div>

        {/* Formulaire */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <Card className="shadow-xl border-0">
            <CardContent className="pt-6">
              {/* Message d'erreur */}
              {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-3 flex-shrink-0" />
                  <span className="text-red-800 dark:text-red-300 text-sm">{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">
                    Adresse email *
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      type="email"
                      id="email"
                      name="email"
                      value={email}
                      onChange={handleInputChange}
                      required
                      className="pl-10"
                      placeholder="votre@email.com"
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Nous vous enverrons un lien pour réinitialiser votre mot de passe
                  </p>
                </div>

                {/* Bouton d'envoi */}
                <Button
                  type="submit"
                  disabled={isLoading || !email.trim()}
                  size="lg"
                  variant="gradient"
                  className="w-full"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      Envoi en cours...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <Send className="w-5 h-5 mr-2" />
                      Envoyer le lien
                    </div>
                  )}
                </Button>
              </form>

              {/* Liens */}
              <div className="mt-6 text-center space-y-4">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300 dark:border-gray-600" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">ou</span>
                  </div>
                </div>

                <Link
                  to="/login"
                  className="inline-flex items-center text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour à la connexion
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Informations supplémentaires */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-center"
        >
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg p-4 border border-white/20 dark:border-gray-700/20">
            <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Besoin d'aide ?</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
              Si vous ne recevez pas l'email, contactez notre support.
            </p>
            <Link
              to="/contact"
              className="text-sm text-primary-600 hover:text-primary-500 font-medium transition-colors"
            >
              Contacter le support →
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default ForgotPassword