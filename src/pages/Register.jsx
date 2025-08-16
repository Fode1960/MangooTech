import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  User, 
  Phone, 
  Building, 
  UserPlus, 
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  Check
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import MangoLogo from '../components/ui/MangoLogo'
import { Button } from '../components/ui/Button'
import { Input, Label } from '../components/ui/Input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card'

const Register = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { signUp, user } = useAuth()
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    password: '',
    confirmPassword: '',
    userType: 'individual', // individual, professional, enterprise
    selectedPack: '', // Pack sélectionné (obligatoire)
    acceptTerms: false,
    acceptNewsletter: false
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [passwordStrength, setPasswordStrength] = useState(0)

  // Rediriger si déjà connecté
  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true })
    }
  }, [user, navigate])

  // Récupérer le pack sélectionné depuis l'état de navigation
  useEffect(() => {
    if (location.state?.selectedPack) {
      // Mapper les IDs des packs de Home.jsx vers les IDs de Register.jsx
      const packMapping = {
        'free': 'free', // Pack Découverte
        'visibility': 'visibility', // Pack Visibilité
        'professional': 'professional', // Pack Professionnel
        'premium': 'premium' // Pack Premium
      }
      
      const mappedPackId = packMapping[location.state.selectedPack] || 'free'
      
      setFormData(prev => ({
        ...prev,
        selectedPack: mappedPackId
      }))
    }
  }, [location.state])

  const userTypes = [
    {
      id: 'individual',
      name: 'Particulier',
      description: 'Pour un usage personnel',
      icon: User
    },
    {
      id: 'professional',
      name: 'Professionnel',
      description: 'Freelance, consultant, artisan',
      icon: Building
    },
    {
      id: 'enterprise',
      name: 'Entreprise',
      description: 'PME, grande entreprise',
      icon: Building
    }
  ]

  // Packs disponibles
  const availablePacks = [
    {
      id: 'free',
      name: 'Pack Gratuit',
      price: 'Gratuit',
      priceUnit: '',
      description: 'Idéal pour commencer',
      features: [
        'Site web basique',
        'Support communautaire',
        'Bande passante limitée'
      ],
      popular: false
    },
    {
      id: 'visibility',
      name: 'Pack Visibilité',
      price: '5 000',
      priceUnit: 'FCFA/mois',
      description: 'Pour améliorer votre présence en ligne',
      features: [
        'Site web professionnel',
        'SEO de base',
        'Support par email',
        'Analytics basiques'
      ],
      popular: true
    },
    {
      id: 'professional',
      name: 'Pack Professionnel',
      price: '10 000',
      priceUnit: 'FCFA/mois',
      description: 'Pour les entreprises en croissance',
      features: [
        'Site web avancé',
        'E-commerce intégré',
        'SEO avancé',
        'Support prioritaire',
        'Analytics détaillées'
      ],
      popular: false
    },
    {
      id: 'premium',
      name: 'Pack Premium',
      price: '15 000',
      priceUnit: 'FCFA/mois',
      description: 'Solution complète pour les grandes entreprises',
      features: [
        'Sites illimités',
        'E-commerce avancé',
        'Marketing automation',
        'Support 24/7',
        'Analytics avancées',
        'API personnalisée'
      ],
      popular: false
    }
  ]

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

  const validateForm = () => {
    const newErrors = {}

    // Validation des champs requis
    if (!formData.firstName.trim()) {newErrors.firstName = 'Le prénom est requis'}
    if (!formData.lastName.trim()) {newErrors.lastName = 'Le nom est requis'}
    if (!formData.email.trim()) {newErrors.email = 'L\'email est requis'}
    if (!formData.password) {newErrors.password = 'Le mot de passe est requis'}
    if (!formData.confirmPassword) {newErrors.confirmPassword = 'La confirmation est requise'}
    if (!formData.selectedPack) {newErrors.selectedPack = 'Vous devez sélectionner un pack'}
    if (!formData.acceptTerms) {newErrors.acceptTerms = 'Vous devez accepter les conditions'}

    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = 'Format d\'email invalide'
    }

    // Validation téléphone
    if (formData.phone && !/^[+]?[1-9]\d{1,14}$/.test(formData.phone.replace(/[\s-()]/g, ''))) {
      newErrors.phone = 'Format de téléphone invalide'
    }

    // Validation mot de passe
    if (formData.password && formData.password.length < 8) {
      newErrors.password = 'Le mot de passe doit contenir au moins 8 caractères'
    }

    // Validation confirmation mot de passe
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas'
    }

    // Validation entreprise pour les professionnels
    if ((formData.userType === 'professional' || formData.userType === 'enterprise') && !formData.company.trim()) {
      newErrors.company = 'Le nom de l\'entreprise est requis'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    const newValue = type === 'checkbox' ? checked : value
    
    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }))

    // Calculer la force du mot de passe
    if (name === 'password') {
      setPasswordStrength(calculatePasswordStrength(value))
    }

    // Effacer l'erreur pour ce champ
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      await signUp(formData.email, formData.password, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        company: formData.company,
        accountType: formData.userType,
        selectedPack: formData.selectedPack,
        acceptNewsletter: formData.acceptNewsletter
      })
      
      // Rediriger directement vers le dashboard après inscription réussie
      // (La confirmation d'email a été désactivée pour éviter les conflits avec le système de paiement)
      navigate('/dashboard', {
        state: {
          message: 'Inscription réussie ! Bienvenue sur MangooTech.'
        }
      })
    } catch (err) {
      console.error('Erreur d\'inscription:', err)
      setErrors({ submit: err.message || 'Une erreur est survenue lors de l\'inscription' })
    } finally {
      setIsLoading(false)
    }
  }

  const strengthInfo = getPasswordStrengthText(passwordStrength)

  return (
    <div className="min-h-screen pt-24 bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-gray-900 dark:to-gray-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-8"
        >
          <Link to="/" className="inline-block mb-6">
            <MangoLogo className="h-16 w-auto mx-auto" />
          </Link>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {t('auth.register.title')}
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            {t('auth.register.subtitle')}
          </p>
        </motion.div>

        {/* Formulaire */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <Card className="shadow-xl border-0">
            <CardContent className="space-y-6 pt-6">
            {/* Erreur générale */}
            {errors.submit && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-3 flex-shrink-0" />
                <span className="text-red-800 dark:text-red-300 text-sm">{errors.submit}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Type d'utilisateur */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Type de compte *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {userTypes.map((type) => {
                    const Icon = type.icon
                    return (
                      <label
                        key={type.id}
                        className={`relative flex flex-col p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          formData.userType === type.id
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                        }`}
                      >
                        <input
                          type="radio"
                          name="userType"
                          value={type.id}
                          checked={formData.userType === type.id}
                          onChange={handleInputChange}
                          className="sr-only"
                        />
                        <Icon className={`w-6 h-6 mb-2 ${
                          formData.userType === type.id ? 'text-primary-600' : 'text-gray-400'
                        }`} />
                        <span className="font-medium text-sm text-gray-900 dark:text-gray-100">{type.name}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">{type.description}</span>
                      </label>
                    )
                  })}
                </div>
              </div>

              {/* Sélection de pack */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Choisissez votre pack *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availablePacks.map((pack) => (
                    <label
                      key={pack.id}
                      className={`relative flex flex-col p-6 border-2 rounded-lg cursor-pointer transition-all ${
                        formData.selectedPack === pack.id
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                      } ${
                        pack.popular ? 'ring-2 ring-primary-200 dark:ring-primary-800' : ''
                      }`}
                    >
                      <input
                        type="radio"
                        name="selectedPack"
                        value={pack.id}
                        checked={formData.selectedPack === pack.id}
                        onChange={handleInputChange}
                        className="sr-only"
                      />
                      {pack.popular && (
                        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                          <span className="bg-primary-500 text-white text-xs font-medium px-3 py-1 rounded-full">
                            Populaire
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between items-start mb-3">
                        <h3 className={`font-semibold text-lg flex-1 mr-2 ${
                          formData.selectedPack === pack.id ? 'text-primary-600' : 'text-gray-900 dark:text-gray-100'
                        }`}>
                          {pack.name}
                        </h3>
                        <div className="text-right flex-shrink-0 min-w-0">
                          <div className={`text-xl font-bold leading-tight ${
                            formData.selectedPack === pack.id ? 'text-primary-600' : 'text-gray-900 dark:text-gray-100'
                          }`}>
                            {pack.price}
                          </div>
                          {pack.priceUnit && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 leading-tight">
                              {pack.priceUnit}
                            </div>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                        {pack.description}
                      </p>
                      <ul className="space-y-2 flex-1">
                        {pack.features.map((feature, index) => (
                          <li key={index} className="flex items-center text-sm">
                            <Check className={`w-4 h-4 mr-2 flex-shrink-0 ${
                              formData.selectedPack === pack.id ? 'text-primary-500' : 'text-green-500'
                            }`} />
                            <span className="text-gray-600 dark:text-gray-300">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </label>
                  ))}
                </div>
                {errors.selectedPack && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.selectedPack}</p>
                )}
              </div>

              {/* Informations personnelles */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">
                    Prénom *
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className={`pl-10 ${
                        errors.firstName ? 'border-red-300 focus:border-red-500' : ''
                      }`}
                      placeholder="Votre prénom"
                    />
                  </div>
                  {errors.firstName && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.firstName}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="lastName">
                    Nom *
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className={`pl-10 ${
                        errors.lastName ? 'border-red-300 focus:border-red-500' : ''
                      }`}
                      placeholder="Votre nom"
                    />
                  </div>
                  {errors.lastName && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.lastName}</p>
                  )}
                </div>
              </div>

              {/* Email et téléphone */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">
                    {t('auth.register.email')} *
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`pl-10 ${
                        errors.email ? 'border-red-300 focus:border-red-500' : ''
                      }`}
                      placeholder="votre@email.com"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="phone">
                    Téléphone
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className={`pl-10 ${
                        errors.phone ? 'border-red-300 focus:border-red-500' : ''
                      }`}
                      placeholder="+225 XX XX XX XX"
                    />
                  </div>
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.phone}</p>
                  )}
                </div>
              </div>

              {/* Entreprise (conditionnel) */}
              {(formData.userType === 'professional' || formData.userType === 'enterprise') && (
                <div>
                  <Label htmlFor="company">
                    {formData.userType === 'enterprise' ? 'Nom de l\'entreprise' : 'Nom de l\'activité'} *
                  </Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      type="text"
                      id="company"
                      name="company"
                      value={formData.company}
                      onChange={handleInputChange}
                      className={`pl-10 ${
                        errors.company ? 'border-red-300 focus:border-red-500' : ''
                      }`}
                      placeholder={formData.userType === 'enterprise' ? 'Nom de votre entreprise' : 'Votre activité professionnelle'}
                    />
                  </div>
                  {errors.company && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.company}</p>
                  )}
                </div>
              )}

              {/* Mots de passe */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="password">
                    {t('auth.register.password')} *
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className={`pl-10 pr-12 ${
                        errors.password ? 'border-red-300 focus:border-red-500' : ''
                      }`}
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
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password}</p>
                  )}
                </div>

                <div>
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
                      className={`pl-10 pr-12 ${
                        errors.confirmPassword ? 'border-red-300 focus:border-red-500' : ''
                      }`}
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
                  {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.confirmPassword}</p>
                  )}
                </div>
              </div>

              {/* Cases à cocher */}
              <div className="space-y-4">
                <div className="flex items-start">
                  <input
                    id="acceptTerms"
                    name="acceptTerms"
                    type="checkbox"
                    checked={formData.acceptTerms}
                    onChange={handleInputChange}
                    className={`mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 rounded ${
                      errors.acceptTerms ? 'border-red-300' : ''
                    }`}
                  />
                  <label htmlFor="acceptTerms" className="ml-3 text-sm text-gray-700 dark:text-gray-300">
                    J'accepte les{' '}
                    <Link to="/terms" className="text-primary-600 hover:text-primary-500 underline">
                      conditions d'utilisation
                    </Link>
                    {' '}et la{' '}
                    <Link to="/privacy" className="text-primary-600 hover:text-primary-500 underline">
                      politique de confidentialité
                    </Link>
                    {' '}*
                  </label>
                </div>
                {errors.acceptTerms && (
                  <p className="text-sm text-red-600 dark:text-red-400">{errors.acceptTerms}</p>
                )}

                <div className="flex items-start">
                  <input
                    id="acceptNewsletter"
                    name="acceptNewsletter"
                    type="checkbox"
                    checked={formData.acceptNewsletter}
                    onChange={handleInputChange}
                    className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 rounded"
                  />
                  <label htmlFor="acceptNewsletter" className="ml-3 text-sm text-gray-700 dark:text-gray-300">
                    Je souhaite recevoir les actualités et offres spéciales de Mangoo Tech
                  </label>
                </div>
              </div>

              {/* Bouton d'inscription */}
              <Button
                type="submit"
                disabled={isLoading}
                size="lg"
                variant="gradient"
                className="w-full"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    Création du compte...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <UserPlus className="w-5 h-5 mr-2" />
                    {t('auth.register.submit')}
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

              <p className="text-sm text-gray-600 dark:text-gray-300">
                Déjà un compte ?{' '}
                <Link
                  to="/login"
                  className="font-medium text-primary-600 hover:text-primary-500 transition-colors"
                >
                  Se connecter
                </Link>
              </p>

              <Link
                to="/"
                className="inline-flex items-center text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
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

export default Register