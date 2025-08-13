import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  Save
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import MangoLogo from '../components/ui/MangoLogo'
import { Button } from '../components/ui/Button'
import { Input, Label } from '../components/ui/Input'
import { Card, CardContent } from '../components/ui/Card'

const ResetPassword = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0)

  // Vérifier si nous avons les paramètres nécessaires
  useEffect(() => {
    const accessToken = searchParams.get('access_token')
    const refreshToken = searchParams.get('refresh_token')
    
    if (!accessToken || !refreshToken) {
      setError('Lien de réinitialisation invalide ou expiré')
      return
    }

    // Définir la session avec les tokens
    supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken
    })
  }, [searchParams])

  const calculatePasswordStrength = (password) => {
    let strength = 0
    if (password.length >= 8) {strength += 1}
    if (/[a-z]/.test(password)) {strength += 1}
    if (/[A-Z]/.test(password)) {strength += 1}
    if (/[0-9]/.test(password)) {strength += 1}
    if (/[^A-Za-z0-9]/.test(password)) {strength += 1}
    return strength
  }

  const getPasswordStrengthText = (strength) => {
    switch (strength) {
      case 0:
      case 1:
        return { text: 'Très faible', color: 'text-red-600' }
      case 2:
        return { text: 'Faible', color: 'text-orange-600' }
      case 3:
        return { text: 'Moyen', color: 'text-yellow-600' }
      case 4:
        return { text: 'Fort', color: 'text-green-600' }
      case 5:
        return { text: 'Très fort', color: 'text-green-700' }
      default:
        return { text: '', color: '' }
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    // Calculer la force du mot de passe
    if (name === 'password') {
      setPasswordStrength(calculatePasswordStrength(value))
    }

    // Effacer les erreurs lors de la saisie
    if (error) {setError('')}
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    // Validation
    if (formData.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères')
      setIsLoading(false)
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      setIsLoading(false)
      return
    }

    if (passwordStrength < 3) {
      setError('Le mot de passe doit être plus fort (au moins niveau "Moyen")')
      setIsLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: formData.password
      })

      if (error) {
        throw error
      }

      setSuccess(true)
      
      // Rediriger vers la page de connexion après 3 secondes
      setTimeout(() => {
        navigate('/login', {
          state: {
            message: 'Mot de passe mis à jour avec succès ! Vous pouvez maintenant vous connecter.'
          }
        })
      }, 3000)
    } catch (err) {
      console.error('Erreur lors de la mise à jour du mot de passe:', err)
      setError(err.message || 'Une erreur est survenue lors de la mise à jour du mot de passe')
    } finally {
      setIsLoading(false)
    }
  }

  const strengthInfo = getPasswordStrengthText(passwordStrength)

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
              Mot de passe mis à jour !
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Redirection en cours...
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
                      Succès !
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      Votre mot de passe a été mis à jour avec succès.
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Vous allez être redirigé vers la page de connexion dans quelques secondes.
                    </p>
                  </div>

                  <Button
                    onClick={() => navigate('/login')}
                    variant="gradient"
                    className="w-full"
                  >
                    Aller à la connexion maintenant
                  </Button>
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
            Nouveau mot de passe
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Choisissez un mot de passe sécurisé
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
                {/* Nouveau mot de passe */}
                <div className="space-y-2">
                  <Label htmlFor="password">
                    Nouveau mot de passe *
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                      className="pl-10 pr-12"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {formData.password && (
                    <div className="mt-2">
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${
                              passwordStrength <= 1 ? 'bg-red-500' :
                              passwordStrength <= 2 ? 'bg-orange-500' :
                              passwordStrength <= 3 ? 'bg-yellow-500' :
                              passwordStrength <= 4 ? 'bg-green-500' : 'bg-green-600'
                            }`}
                            style={{ width: `${(passwordStrength / 5) * 100}%` }}
                          />
                        </div>
                        <span className={`text-xs font-medium ${strengthInfo.color}`}>
                          {strengthInfo.text}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirmer le mot de passe */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">
                    Confirmer le mot de passe *
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      required
                      className="pl-10 pr-12"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {formData.confirmPassword && formData.password === formData.confirmPassword && (
                    <div className="mt-2 flex items-center text-green-600 dark:text-green-400">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      <span className="text-xs">Les mots de passe correspondent</span>
                    </div>
                  )}
                </div>

                {/* Exigences du mot de passe */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Exigences du mot de passe :
                  </h4>
                  <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                    <li className={`flex items-center ${formData.password.length >= 8 ? 'text-green-600 dark:text-green-400' : ''}`}>
                      <span className="mr-2">{formData.password.length >= 8 ? '✓' : '•'}</span>
                      Au moins 8 caractères
                    </li>
                    <li className={`flex items-center ${/[a-z]/.test(formData.password) ? 'text-green-600 dark:text-green-400' : ''}`}>
                      <span className="mr-2">{/[a-z]/.test(formData.password) ? '✓' : '•'}</span>
                      Une lettre minuscule
                    </li>
                    <li className={`flex items-center ${/[A-Z]/.test(formData.password) ? 'text-green-600 dark:text-green-400' : ''}`}>
                      <span className="mr-2">{/[A-Z]/.test(formData.password) ? '✓' : '•'}</span>
                      Une lettre majuscule
                    </li>
                    <li className={`flex items-center ${/[0-9]/.test(formData.password) ? 'text-green-600 dark:text-green-400' : ''}`}>
                      <span className="mr-2">{/[0-9]/.test(formData.password) ? '✓' : '•'}</span>
                      Un chiffre
                    </li>
                    <li className={`flex items-center ${/[^A-Za-z0-9]/.test(formData.password) ? 'text-green-600 dark:text-green-400' : ''}`}>
                      <span className="mr-2">{/[^A-Za-z0-9]/.test(formData.password) ? '✓' : '•'}</span>
                      Un caractère spécial
                    </li>
                  </ul>
                </div>

                {/* Bouton de mise à jour */}
                <Button
                  type="submit"
                  disabled={isLoading || !formData.password || !formData.confirmPassword || formData.password !== formData.confirmPassword}
                  size="lg"
                  variant="gradient"
                  className="w-full"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      Mise à jour...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <Save className="w-5 h-5 mr-2" />
                      Mettre à jour le mot de passe
                    </div>
                  )}
                </Button>
              </form>

              {/* Liens */}
              <div className="mt-6 text-center">
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
      </div>
    </div>
  )
}

export default ResetPassword