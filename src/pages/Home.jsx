import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { useServices } from '../contexts/ServicesContext'
import { motion } from 'framer-motion'
import { 
  ArrowRight, 
  Globe, 
  Shield, 
  Zap, 
  Users, 
  Star,
  CheckCircle,
  TrendingUp,
  Smartphone,
  CreditCard,
  Truck,
  MessageCircle,
  BarChart3,
  Headphones,
  Check,
  Crown,
  Sparkles,
  Briefcase
} from 'lucide-react'
import { ArrowRightIcon, CheckCircleIcon, StarIcon } from '@heroicons/react/24/solid'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card'
import MangoLogo from '../components/ui/MangoLogo'

const Home = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { assignPackToUser } = useServices()
  const [isVisible, setIsVisible] = useState(false)
  const [loadingPack, setLoadingPack] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    setIsVisible(true)
  }, [])

  // Fonction pour gérer la sélection de pack
  const handlePackSelection = async (packId) => {
    try {
      setLoadingPack(packId)
      setError('')
      
      if (!user) {
        // Utilisateur non connecté - rediriger vers l'inscription avec le pack sélectionné
        navigate('/register', { state: { selectedPack: packId } })
        return
      }
      
      // Utilisateur connecté - assigner le pack directement
      await assignPackToUser(user.id, packId)
      navigate('/dashboard')
    } catch (error) {
      console.error('Erreur lors de la sélection du pack:', error)
      setError('Erreur lors de la sélection du pack. Veuillez réessayer.')
    } finally {
      setLoadingPack(null)
    }
  }

  // Fonction pour gérer le bouton "Commencer gratuitement"
  const handleStartFree = async () => {
    await handlePackSelection('free')
  }

  const features = [
    {
      icon: Globe,
      title: t('home.features.accessibility.title'),
      description: t('home.features.accessibility.description'),
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    },
    {
      icon: Zap,
      title: t('home.features.modularity.title'),
      description: t('home.features.modularity.description'),
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      icon: TrendingUp,
      title: t('home.features.innovation.title'),
      description: t('home.features.innovation.description'),
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    },
    {
      icon: Shield,
      title: t('home.features.security.title'),
      description: t('home.features.security.description'),
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    }
  ]

  const mainServices = [
    {
      icon: Smartphone,
      title: t('home.services.miniSites.title'),
      description: t('home.services.miniSites.description'),
      bgColor: 'bg-orange-500',
      features: ['Templates responsive', 'Domaine personnalisé', 'SEO intégré']
    },
    {
      icon: Globe,
      title: t('home.services.ecommerce.title'),
      description: t('home.services.ecommerce.description'),
      bgColor: 'bg-green-700',
      features: ['Catalogue produits', 'Paiement sécurisé', 'Gestion stocks']
    },
    {
      icon: CreditCard,
      title: t('home.services.payment.title'),
      description: t('home.services.payment.description'),
      bgColor: 'bg-orange-600',
      features: ['Paiements mobiles', 'Sécurité maximale', 'Commissions faibles']
    },
    {
      icon: Truck,
      title: t('home.services.delivery.title'),
      description: t('home.services.delivery.description'),
      bgColor: 'bg-green-600',
      features: ['Suivi temps réel', 'Livraison rapide', 'Tarifs compétitifs']
    }
  ]

  const stats = [
    { number: '10,000+', label: 'Utilisateurs actifs' },
    { number: '25+', label: 'Services disponibles' },
    { number: '15+', label: 'Pays couverts' },
    { number: '99.9%', label: 'Disponibilité' }
  ]

  const packs = [
    {
      name: 'Pack Découverte',
      price: 'Gratuit',
      description: 'Nouveaux artisans',
      features: ['Mini-site', 'Mini-boutique', 'Espace personnel', 'Fiche visible', 'Accès Mangoo Connect+'],
      gradient: 'from-blue-500 to-blue-600',
      icon: Globe,
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      name: 'Pack Visibilité',
      price: '5 000',
      priceUnit: 'FCFA/mois',
      description: 'Artisans en phase de croissance',
      features: ['Pack découverte', 'Référencement Mangoo Market', 'Showroom360 simplifié'],
      gradient: 'from-green-500 to-green-600',
      icon: TrendingUp,
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      name: 'Pack Professionnel',
      price: '10 000',
      priceUnit: 'FCFA/mois',
      description: 'Artisans organisés, organisations, PME',
      features: ['Pack Visibilité', 'Mangoo Express', 'Référencement pro'],
      gradient: 'from-orange-500 to-orange-600',
      icon: Briefcase,
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      popular: true
    },
    {
      name: 'Pack Premium',
      price: '15 000',
      priceUnit: 'FCFA/mois',
      description: 'PME structurées et entrepreneurs avancés',
      features: ['Pack Professionnel', 'CRM/ERP simplifié', 'Showroom360 complet', 'Support personnalisé'],
      gradient: 'from-purple-500 to-purple-600',
      icon: Crown,
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    }
  ]

  const testimonials = [
    {
      name: 'Aminata Diallo',
      role: 'Propriétaire de boutique',
      content: 'Mangoo Tech a transformé mon business. Maintenant je peux vendre en ligne facilement !',
      rating: 5
    },
    {
      name: 'Omar Sy',
      role: 'Entrepreneur',
      content: 'Les solutions sont vraiment adaptées au marché africain. Service client exceptionnel.',
      rating: 5
    },
    {
      name: 'Fatou Sall',
      role: 'Consultante',
      content: 'Interface intuitive et prix abordables. Je recommande vivement Mangoo Tech.',
      rating: 5
    },
    {
      name: 'Moussa Traoré',
      role: 'Directeur commercial',
      content: 'Grâce à Mangoo Tech, nous avons digitalisé notre entreprise en quelques semaines seulement.',
      rating: 5
    }
  ]

  return (
    <div className="min-h-screen">
      {/* Message d'erreur */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
          <div className="flex justify-between items-center">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
            <button
              onClick={() => setError('')}
              className="text-red-400 hover:text-red-600"
            >
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
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
              <MangoLogo className="w-20 h-20 mx-auto mb-6 animate-bounce-slow" />
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                {t('home.hero.title')}
              </h1>
              <p className="text-xl md:text-2xl text-white/90 mb-8 leading-relaxed">
                {t('home.hero.subtitle')}
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 30 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link to="/services">
                <Button size="lg" variant="gradient" className="text-lg px-8 py-4 hover-lift">
                  {t('home.hero.cta')}
                  <ArrowRightIcon className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link to="/contact">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-gray-900 text-lg px-8 py-4">
                  {t('home.hero.ctaSecondary')}
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Statistiques */}
      <section className="py-16 bg-white dark:bg-gray-800">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="text-3xl lg:text-4xl font-bold text-primary-600 mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600 dark:text-gray-300 font-medium">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Fonctionnalités */}
      <section className="section bg-gray-50 dark:bg-gray-900">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="section-title">
              {t('home.features.title')}
            </h2>
          </motion.div>
          
          <div className="grid-responsive">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="card hover-lift"
                >
                  <div className="card-body text-center">
                    <div className={`w-16 h-16 ${feature.bgColor} rounded-full flex items-center justify-center mx-auto mb-6`}>
                      <Icon className={`w-8 h-8 ${feature.color}`} />
                    </div>
                    <h3 className="text-xl font-semibold mb-4">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Services principaux */}
      <section className="section bg-white dark:bg-gray-800">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="section-title">
              {t('home.services.title')}
            </h2>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {mainServices.map((service, index) => {
              const Icon = service.icon
              return (
                <motion.div
                  key={service.title}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="group"
                >
                  <Card className="hover-lift group-hover:shadow-xl transition-all duration-300 border-0 shadow-lg overflow-hidden">
                    <div className={`h-2 ${service.bgColor}`}></div>
                    <CardHeader>
                      <div className="flex items-start space-x-4">
                        <div className={`w-12 h-12 ${service.bgColor} rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <CardTitle className={`transition-colors ${
                            service.bgColor.includes('green') 
                              ? 'group-hover:text-green-600' 
                              : 'group-hover:text-orange-600'
                          }`}>
                            {service.title}
                          </CardTitle>
                          <CardDescription className="leading-relaxed">
                            {service.description}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm uppercase tracking-wide">
                          Fonctionnalités clés
                        </h4>
                        <ul className="space-y-2">
                          {service.features.map((feature) => (
                            <li key={feature} className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                              <CheckCircleIcon className="w-4 h-4 text-green-500 flex-shrink-0" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <Link to="/services">
              <Button size="lg" variant="gradient" className="text-lg px-8 py-4 hover-lift">
                Voir tous nos services
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Packs */}
      <section className="section bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-orange-500 mr-2" />
              <h2 className="section-title mb-0">
                Nos Packs Tout-en-Un
              </h2>
              <Sparkles className="w-8 h-8 text-green-500 ml-2" />
            </div>
            <p className="section-subtitle">
              Choisissez le pack adapté à votre niveau et développez votre business
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {packs.map((pack, index) => {
              const Icon = pack.icon
              return (
                <motion.div
                  key={pack.name}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="group relative"
                >
                  <Card className={`hover-lift group-hover:shadow-2xl transition-all duration-300 border-0 shadow-lg overflow-hidden h-full flex flex-col ${pack.bgColor} ${pack.borderColor} border-2 ${pack.popular ? 'ring-2 ring-orange-400 ring-offset-2' : ''}`}>
                    <div className={`h-2 bg-gradient-to-r ${pack.gradient}`}></div>
                    
                    {pack.popular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                        <div className="bg-orange-500 text-white px-4 py-1 rounded-full text-xs font-bold shadow-lg">
                          POPULAIRE
                        </div>
                      </div>
                    )}
                    
                    <CardHeader className="text-center pb-4">
                      <div className={`w-16 h-16 bg-gradient-to-r ${pack.gradient} rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                      <CardTitle className="text-xl font-bold mb-2">
                        {pack.name}
                      </CardTitle>
                      <div className="mb-3">
                        <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                          {pack.price === 'Gratuit' ? (
                            <span className="text-green-600">Gratuit</span>
                          ) : (
                            <>
                              <span className="text-2xl">{pack.price}</span>
                              <span className="text-sm text-gray-600 dark:text-gray-400 ml-1">
                                {pack.priceUnit}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <CardDescription className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {pack.description}
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="pt-0 flex flex-col flex-1">
                      <ul className="space-y-3 mb-6">
                        {pack.features.map((feature, featureIndex) => (
                          <li key={featureIndex} className="flex items-start space-x-2 text-sm">
                            <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                            <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                          </li>
                        ))}
                      </ul>
                      
                      <Button 
                         onClick={() => {
                           const packId = pack.name === 'Pack Découverte' ? 'free' : 
                                          pack.name === 'Pack Visibilité' ? 'visibility' : 
                                          pack.name === 'Pack Professionnel' ? 'professional' : 
                                          pack.name === 'Pack Premium' ? 'premium' : 'free';
                           pack.price === 'Gratuit' ? handleStartFree() : handlePackSelection(packId);
                         }}
                         disabled={loadingPack !== null}
                         className={`w-full mt-auto ${pack.popular ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700' : 'bg-gradient-to-r ' + pack.gradient + ' hover:opacity-90'} text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed`}
                         size="lg"
                       >
                        {(() => {
                          const packId = pack.name === 'Pack Découverte' ? 'free' : 
                                         pack.name === 'Pack Visibilité' ? 'visibility' : 
                                         pack.name === 'Pack Professionnel' ? 'professional' : 
                                         pack.name === 'Pack Premium' ? 'premium' : 'free';
                          return loadingPack === packId;
                        })() ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Activation...
                          </>
                        ) : (
                          <>
                            {pack.price === 'Gratuit' ? 'Commencer gratuitement' : 'Choisir ce pack'}
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <Link to="/services#packs">
              <Button size="lg" variant="outline" className="text-lg px-8 py-4 hover-lift border-2">
                Comparer tous les packs
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Témoignages */}
      <section className="section bg-gray-50 dark:bg-gray-900">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="section-title">
              Ce que disent nos clients
            </h2>
            <p className="section-subtitle">
              Découvrez les témoignages de ceux qui nous font confiance
            </p>
          </motion.div>
          
          <div className="grid-responsive">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="group"
              >
                <Card className="hover-lift group-hover:shadow-xl transition-all duration-300 border-0 shadow-lg">
                  <CardHeader>
                    <div className="flex items-center mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <StarIcon key={i} className="w-5 h-5 text-orange-400 fill-current" />
                      ))}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 dark:text-gray-300 mb-6 italic leading-relaxed">
                      "{testimonial.content}"
                    </p>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-gray-100">
                          {testimonial.name}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {testimonial.role}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section bg-gradient-primary text-white">
        <div className="container text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl lg:text-4xl font-bold mb-6">
              Prêt à transformer votre business ?
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Rejoignez des milliers d'entrepreneurs qui font confiance à Mangoo Tech 
              pour leur transformation digitale.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="btn-secondary text-lg px-8 py-4 hover-lift"
              >
                Commencer gratuitement
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
              <Link
                to="/contact"
                className="btn-outline border-white text-white hover:bg-white hover:text-primary-600 text-lg px-8 py-4"
              >
                Parler à un expert
                <MessageCircle className="w-5 h-5 ml-2" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

export default Home