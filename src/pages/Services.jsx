import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { assignPackToUser } from '../lib/services'
import { 
  changePackSmart, 
  showPackChangeSuccess, 
  showPackChangeError,
  validatePackChange 
} from '../lib/packChangeUtils'
import { useCreditNotification } from '../hooks/useCreditNotification'
import CreditNotification from '../components/ui/CreditNotification'
import { useAuthError } from '../hooks/useAuthError'
import AuthAlert from '../components/ui/AuthAlert'
import { 
  Globe, 
  ShoppingCart, 
  CreditCard, 
  Truck, 
  MessageCircle, 
  BarChart3,
  Headphones,
  TrendingUp,
  Heart,
  Briefcase,
  GraduationCap,
  Gamepad2,
  Stethoscope,
  Wheat,
  Search,
  Filter,
  Star,
  Check,
  ArrowRight,
  Smartphone,
  Users,
  Building,
  Zap,
  Shield,
  Clock,
  Target
} from 'lucide-react'

const Services = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [isVisible, setIsVisible] = useState(false)
  const [loadingPack, setLoadingPack] = useState(null)
  const [error, setError] = useState(null)
  const creditNotification = useCreditNotification()
  const { authAlert, checkAuthError, hideAuthError, handleReconnect } = useAuthError()

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const categories = [
    { id: 'all', name: 'Tous les services', icon: Globe },
    { id: 'websites', name: t('services.categories.websites'), icon: Smartphone },
    { id: 'ecommerce', name: t('services.categories.ecommerce'), icon: ShoppingCart },
    { id: 'communication', name: t('services.categories.communication'), icon: MessageCircle },
    { id: 'business', name: t('services.categories.business'), icon: Briefcase },
    { id: 'specialized', name: t('services.categories.specialized'), icon: Target }
  ]

  const services = [
    // Sites Web
    {
      id: 'mini-sites',
      name: 'Mini-sites',
      category: 'websites',
      icon: Globe,
      description: 'Vitrines web personnalisées pour PME, grandes entreprises, artisans et boutiques.',
      features: ['Templates responsive', 'Nom de domaine personnalisé', 'SEO intégré', 'Statistiques de visite'],
      price: null,
      popular: true,
      gradient: 'from-blue-500 to-blue-600',
      targetAudience: ['PME', 'Grandes entreprises', 'Artisans', 'Boutiques']
    },
    {
      id: 'individual-spaces',
      name: 'Espaces individuels',
      category: 'websites',
      icon: Users,
      description: 'Pages personnalisées pour freelancers, consultants et auto-entrepreneurs.',
      features: ['Profil public complet', 'Module de rendez-vous', 'Contact direct', 'Liens réseaux sociaux'],
      price: null,
      gradient: 'from-green-500 to-green-600',
      targetAudience: ['Freelancers', 'Consultants', 'Auto-entrepreneurs']
    },

    // E-commerce
    {
      id: 'mini-boutiques',
      name: 'Mini-boutiques',
      category: 'ecommerce',
      icon: ShoppingCart,
      description: 'Espaces e-commerce pour commerçants, marchands et revendeurs.',
      features: ['Catalogue avec filtres', 'Panier et paiement', 'Gestion des stocks', 'Intégration livraison'],
      price: null,
      popular: true,
      gradient: 'from-purple-500 to-purple-600',
      targetAudience: ['Commerçants', 'Marchands', 'Revendeurs']
    },
    {
      id: 'mangoo-pay',
      name: 'Mangoo Pay+',
      category: 'ecommerce',
      icon: CreditCard,
      description: 'Services de paiement pour marchands et clients finaux.',
      features: ['Paiement sécurisé', 'Commissions faibles', 'Services financiers', 'Multi-devises'],
      price: null,
      gradient: 'from-yellow-500 to-yellow-600',
      targetAudience: ['Marchands', 'Clients finaux']
    },
    {
      id: 'mangoo-express',
      name: 'Mangoo Express+',
      category: 'ecommerce',
      icon: Truck,
      description: 'Plateforme de livraison pour e-commerçants, boutiques et clients.',
      features: ['Demande en ligne', 'Suivi temps réel', 'Tarification dynamique', 'Réseau de livreurs'],
      price: null,
      gradient: 'from-orange-500 to-orange-600',
      targetAudience: ['E-commerçants', 'Boutiques', 'Clients']
    },

    // Communication
    {
      id: 'mangoo-connect',
      name: 'Mangoo Connect+',
      category: 'communication',
      icon: MessageCircle,
      description: 'Messagerie sécurisée pour tous les utilisateurs.',
      features: ['Chat individuel/groupe', 'Envoi de documents', 'Appels audio/vidéo', 'Chiffrement de bout en bout'],
      price: null,
      gradient: 'from-indigo-500 to-indigo-600',
      targetAudience: ['Tous les utilisateurs']
    },
    {
      id: 'mangoo-ads',
      name: 'Mangoo Ads+',
      category: 'communication',
      icon: TrendingUp,
      description: 'Solutions publicitaires pour entreprises, influenceurs et agences.',
      features: ['Campagnes ciblées', 'Tableau de bord', 'Analytics avancés', 'ROI optimisé'],
      price: null,
      gradient: 'from-pink-500 to-pink-600',
      targetAudience: ['Entreprises', 'Influenceurs', 'Agences']
    },

    // Business
    {
      id: 'mangoo-analytics',
      name: 'Mangoo Analytics+',
      category: 'business',
      icon: BarChart3,
      description: 'Statistiques détaillées pour entrepreneurs et entreprises.',
      features: ['Statistiques détaillées', 'Recommandations IA', 'Rapports personnalisés', 'Prédictions'],
      price: null,
      gradient: 'from-teal-500 to-teal-600',
      targetAudience: ['Entrepreneurs', 'Entreprises']
    },
    {
      id: 'mangoo-crm',
      name: 'Mangoo CRM System',
      category: 'business',
      icon: Users,
      description: 'Gestion avancée des relations clients.',
      features: ['Gestion contacts', 'Pipeline de ventes', 'Automatisation', 'Intégrations'],
      price: null,
      gradient: 'from-cyan-500 to-cyan-600',
      targetAudience: ['Entreprises', 'Équipes commerciales']
    },
    {
      id: 'mangoo-erp',
      name: 'Mangoo ERP System',
      category: 'business',
      icon: Building,
      description: 'Gestion intégrée des ressources de l\'entreprise.',
      features: ['Gestion complète', 'Modules intégrés', 'Reporting avancé', 'Multi-utilisateurs'],
      price: null,
      gradient: 'from-slate-500 to-slate-600',
      targetAudience: ['Grandes entreprises', 'PME']
    },

    // Spécialisés
    {
      id: 'mangoo-health',
      name: 'Mangoo Health+',
      category: 'specialized',
      icon: Stethoscope,
      description: 'Téléconsultation et gestion de dossiers médicaux.',
      features: ['Téléconsultation', 'Dossiers médicaux', 'Prise de RDV', 'Prescriptions'],
      price: null,
      gradient: 'from-red-500 to-red-600',
      targetAudience: ['Cliniques', 'Pharmacies', 'Patients']
    },
    {
      id: 'mangoo-learning',
      name: 'Mangoo Learning+',
      category: 'specialized',
      icon: GraduationCap,
      description: 'E-learning pour formateurs, centres de formation et écoles.',
      features: ['Cours en ligne', 'Évaluations', 'Certificats', 'Suivi progrès'],
      price: null,
      gradient: 'from-emerald-500 to-emerald-600',
      targetAudience: ['Formateurs', 'Centres de formation', 'Écoles']
    },
    {
      id: 'mangoo-agritech',
      name: 'Mangoo Agritech+',
      category: 'specialized',
      icon: Wheat,
      description: 'Mise en relation pour agriculteurs, coopératives et commerçants.',
      features: ['Marketplace agricole', 'Prévisions météo', 'Conseils techniques', 'Financement'],
      price: null,
      gradient: 'from-lime-500 to-lime-600',
      targetAudience: ['Agriculteurs', 'Coopératives', 'Commerçants']
    }
  ]

  // IDs des packs correspondants à la base de données
  const packIds = {
    'Pack Découverte': '0a85e74a-4aec-480a-8af1-7b57391a80d2',
    'Pack Visibilité': 'pack-visibilite-id', // À remplacer par l'ID réel
    'Pack Professionnel': 'pack-professionnel-id', // À remplacer par l'ID réel
    'Pack Premium': 'pack-premium-id' // À remplacer par l'ID réel
  }

  const packs = [
    {
      name: 'Pack Découverte',
      price: 'Gratuit',
      description: 'Nouveaux artisans',
      features: ['Mini-site', 'Mini-boutique', 'Espace personnel', 'Fiche visible', 'Accès Mangoo Connect+'],
      color: 'border-blue-200 bg-blue-50',
      gradient: 'from-blue-500 to-blue-600',
      id: packIds['Pack Découverte'],
      isFree: true
    },
    {
      name: 'Pack Visibilité',
      price: '5 000 FCFA/mois',
      description: 'Artisans en phase de croissance',
      features: ['Pack découverte', 'Référencement Mangoo Market', 'Showroom360 simplifié'],
      color: 'border-green-200 bg-green-50',
      gradient: 'from-green-500 to-green-600',
      id: packIds['Pack Visibilité'],
      isFree: false
    },
    {
      name: 'Pack Professionnel',
      price: '10 000 FCFA/mois',
      description: 'Artisans organisés, organisations, PME',
      features: ['Pack Visibilité', 'Mangoo Express', 'Référencement pro'],
      color: 'border-orange-200 bg-orange-50',
      gradient: 'from-orange-500 to-orange-600',
      popular: true,
      id: packIds['Pack Professionnel'],
      isFree: false
    },
    {
      name: 'Pack Premium',
      price: '15 000 FCFA/mois',
      description: 'PME structurées et entrepreneurs avancés',
      features: ['Pack Professionnel', 'CRM/ERP simplifié', 'Showroom360 complet', 'Support personnalisé'],
      color: 'border-purple-200 bg-purple-50',
      gradient: 'from-purple-500 to-purple-600',
      id: packIds['Pack Premium'],
      isFree: false
    }
  ]

  // Fonction pour gérer la sélection d'un pack avec smart-pack-change
  const handlePackSelection = async (pack) => {
    setError(null)
    setLoadingPack(pack.id)

    try {
      if (!user) {
        // Si l'utilisateur n'est pas connecté, rediriger vers l'inscription avec le pack sélectionné
        navigate('/register', { 
          state: { 
            selectedPack: pack.id,
            packName: pack.name,
            isFree: pack.isFree
          } 
        })
        return
      }

      // Utiliser smart-pack-change pour gérer intelligemment le changement
      const result = await changePackSmart(pack.id, {
        successUrl: `${window.location.origin}/dashboard?success=true&pack=${pack.id}`,
        cancelUrl: `${window.location.origin}/services?canceled=true`,
        onSuccess: (data) => {
          const notification = showPackChangeSuccess(data, pack.name)
          console.log('✅ Pack activé avec succès:', notification)
          
          // Afficher la notification de crédit si applicable
          if (notification.creditAmount && notification.creditAmount > 0) {
            creditNotification.showDowngradeCredit(
              notification.creditAmount,
              notification.packName,
              notification.changeType
            )
          } else {
            creditNotification.showPackChangeSuccess(
              notification.packName,
              notification.changeType
            )
          }
          
          // Rediriger vers le dashboard
          setTimeout(() => {
            navigate('/dashboard')
          }, 2000) // Laisser le temps de voir la notification
        },
        onError: (error) => {
          const notification = showPackChangeError(error)
          console.error('❌ Erreur activation pack:', notification)
          
          // Vérifier si c'est une erreur d'authentification
          if (!checkAuthError(error)) {
            // Si ce n'est pas une erreur d'auth, afficher l'erreur normalement
            setError(notification.message)
          }
        },
        onRequiresPayment: (data) => {
          console.log('💳 Redirection vers paiement pour:', pack.name)
          // La redirection vers Stripe est gérée automatiquement
        }
      })
      
      console.log('🔄 Résultat sélection pack:', result)
      
    } catch (error) {
      console.error('❌ Erreur lors de la sélection du pack:', error)
      const notification = showPackChangeError(error)
      
      // Vérifier si c'est une erreur d'authentification
      if (!checkAuthError(error)) {
        // Si ce n'est pas une erreur d'auth, afficher l'erreur normalement
        setError(notification.message)
      }
    } finally {
      setLoadingPack(null)
    }
  }

  // Fonction pour gérer le bouton "Commencer gratuitement"
  const handleStartFree = () => {
    const freePack = packs.find(pack => pack.isFree)
    if (freePack) {
      handlePackSelection(freePack)
    }
  }

  const filteredServices = services.filter(service => {
    const matchesCategory = selectedCategory === 'all' || service.category === selectedCategory
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.description.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <div className="min-h-screen pt-24">
      {/* Affichage des erreurs */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mx-4 mt-4" role="alert">
          <strong className="font-bold">Erreur: </strong>
          <span className="block sm:inline">{error}</span>
          <button
            onClick={() => setError(null)}
            className="absolute top-0 bottom-0 right-0 px-4 py-3"
          >
            <span className="sr-only">Fermer</span>
            ×
          </button>
        </div>
      )}
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-hero pt-24 pb-16 lg:pt-32 lg:pb-24">
        <div className="absolute inset-0 bg-black/20"></div>
        
        {/* Éléments décoratifs */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-white/10 rounded-full animate-float"></div>
        <div className="absolute top-40 right-20 w-16 h-16 bg-white/10 rounded-full animate-float delay-200"></div>
        <div className="absolute bottom-20 left-1/4 w-12 h-12 bg-white/10 rounded-full animate-float delay-400"></div>
        
        <div className="container relative z-10">
          <div className="max-w-4xl mx-auto text-center text-white">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 30 }}
              transition={{ duration: 0.8 }}
              className="mb-8"
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                {t('services.title')}
              </h1>
              <p className="text-xl md:text-2xl text-white/90 mb-8 leading-relaxed">
                {t('services.subtitle')}
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Filtres et recherche */}
      <section className="py-8 bg-white dark:bg-gray-900 border-b dark:border-gray-700">
        <div className="container">
          <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
            {/* Recherche */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
              <input
                type="text"
                placeholder="Rechercher un service..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            {/* Catégories */}
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => {
                const Icon = category.icon
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                      selectedCategory === category.id
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{category.name}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredServices.map((service, index) => {
              const Icon = service.icon
              return (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="card hover-lift relative overflow-hidden"
                >
                  {service.popular && (
                    <div className="absolute top-4 right-4 bg-secondary-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                      Populaire
                    </div>
                  )}
                  
                  <div className={`h-2 bg-gradient-to-r ${service.gradient}`}></div>
                  
                  <div className="card-body">
                    <div className="flex items-start space-x-4 mb-4">
                      <div className={`w-12 h-12 bg-gradient-to-r ${service.gradient} rounded-lg flex items-center justify-center flex-shrink-0`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold mb-2 dark:text-gray-100">
                          {service.name}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">
                          {service.description}
                        </p>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Fonctionnalités :</h4>
                      <ul className="space-y-1">
                        {service.features.slice(0, 3).map((feature) => (
                          <li key={feature} className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                            <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                            <span>{feature}</span>
                          </li>
                        ))}
                        {service.features.length > 3 && (
                          <li className="text-sm text-gray-500 dark:text-gray-400">
                            +{service.features.length - 3} autres fonctionnalités
                          </li>
                        )}
                      </ul>
                    </div>
                    
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Public cible :</h4>
                      <div className="flex flex-wrap gap-1">
                        {service.targetAudience.map((audience) => (
                          <span key={audience} className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded text-xs">
                            {audience}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-center pt-4 border-t border-gray-100 dark:border-gray-700">
                      <button 
                        onClick={() => document.getElementById('packs')?.scrollIntoView({ behavior: 'smooth' })}
                        className="btn-primary text-sm px-4 py-2 w-full text-center"
                      >
                        Voir les packs
                      </button>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
          
          {filteredServices.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Aucun service trouvé
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Essayez de modifier vos critères de recherche ou de filtrage.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Packs */}
      <section id="packs" className="py-16 bg-white dark:bg-gray-900">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="section-title">
              Nos Packs Tout-en-Un
            </h2>
            <p className="section-subtitle">
              Économisez avec nos offres groupées adaptées à vos besoins
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mt-12">
            {packs.map((pack, index) => (
              <motion.div
                key={pack.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className={`card hover-lift relative overflow-hidden flex flex-col ${pack.color} ${pack.popular ? 'ring-2 ring-orange-500' : ''}`}
              >
                <div className={`h-2 bg-gradient-to-r ${pack.gradient}`}></div>
                <div className="card-body text-center flex flex-col flex-1">
                  {pack.popular && (
                    <div className="mb-4">
                      <div className="inline-block bg-green-500 text-white px-4 py-2 rounded-full text-sm font-medium">
                        Recommandé
                      </div>
                    </div>
                  )}
                  <h3 className="text-2xl font-bold mb-2 dark:text-gray-100">
                    {pack.name}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    {pack.description}
                  </p>
                  <div className="text-3xl font-bold text-primary-600 mb-6">
                    {pack.price}
                  </div>
                  
                  <ul className="space-y-3 mb-8">
                    {pack.features.map((feature) => (
                      <li key={feature} className="flex items-center space-x-2">
                        <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <button 
                    onClick={() => handlePackSelection(pack)}
                    disabled={loadingPack === pack.id}
                    className={`w-full mt-auto flex items-center justify-center space-x-2 ${
                      pack.popular ? 'btn-primary' : 'btn-outline'
                    } ${loadingPack === pack.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {loadingPack === pack.id ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Activation...</span>
                      </>
                    ) : (
                      <span>Choisir ce pack</span>
                    )}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-secondary text-white">
        <div className="container text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl lg:text-4xl font-bold mb-6">
              Besoin d'aide pour choisir ?
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Nos experts sont là pour vous conseiller et vous aider à trouver 
              la solution parfaite pour votre business.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/contact"
                className="btn bg-white text-secondary-600 hover:bg-gray-100 text-lg px-8 py-4 hover-lift"
              >
                Parler à un expert
                <MessageCircle className="w-5 h-5 ml-2" />
              </Link>
              <button
                onClick={handleStartFree}
                disabled={loadingPack !== null}
                className={`btn-outline border-white text-white hover:bg-white hover:text-secondary-600 text-lg px-8 py-4 flex items-center justify-center space-x-2 ${
                  loadingPack !== null ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {loadingPack !== null ? (
                   <>
                     <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                     <span>Activation...</span>
                   </>
                 ) : (
                   <>
                     <span>Commencer gratuitement</span>
                     <ArrowRight className="w-5 h-5 ml-2" />
                   </>
                 )}
               </button>
            </div>
          </motion.div>
        </div>
      </section>
      
      {/* Notification de crédit */}
      <CreditNotification
        isVisible={creditNotification.isVisible}
        creditAmount={creditNotification.creditAmount}
        packName={creditNotification.packName}
        changeType={creditNotification.changeType}
        duration={creditNotification.duration}
        onClose={creditNotification.hideNotification}
      />
      
      {/* Alerte d'authentification */}
      <AuthAlert
        isVisible={authAlert.isVisible}
        message={authAlert.message}
        type={authAlert.type}
        onReconnect={handleReconnect}
        onClose={hideAuthError}
      />
    </div>
  )
}

export default Services