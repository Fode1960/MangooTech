import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { 
  Cookie, 
  Shield, 
  Settings, 
  BarChart3, 
  Globe, 
  Mail, 
  Phone, 
  MapPin,
  CheckCircle,
  AlertTriangle,
  Eye,
  Clock,
  Database,
  Smartphone
} from 'lucide-react'

const Cookies = () => {
  const { t } = useTranslation()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const cookieTypes = [
    {
      title: 'Cookies essentiels',
      icon: Shield,
      description: 'Nécessaires au fonctionnement du site',
      color: 'green'
    },
    {
      title: 'Cookies analytiques',
      icon: BarChart3,
      description: 'Nous aident à améliorer notre site',
      color: 'blue'
    },
    {
      title: 'Cookies fonctionnels',
      icon: Settings,
      description: 'Améliorent votre expérience utilisateur',
      color: 'purple'
    },
    {
      title: 'Cookies marketing',
      icon: Eye,
      description: 'Personnalisent la publicité',
      color: 'orange'
    }
  ]

  const sections = [
    {
      id: 'what-are-cookies',
      title: 'Qu\'est-ce que les cookies ?',
      icon: Cookie,
      content: [
        'Les cookies sont de petits fichiers texte stockés sur votre appareil lorsque vous visitez un site web. Ils permettent au site de se souvenir de vos actions et préférences (comme la langue, la taille de police et autres préférences d\'affichage) pendant une période donnée.',
        'Cela évite d\'avoir à ressaisir ces informations à chaque fois que vous revenez sur le site ou naviguez d\'une page à l\'autre. Les cookies peuvent également être utilisés pour établir des statistiques anonymes sur l\'expérience de navigation sur notre site.',
        'Mangoo Technology utilise les cookies pour améliorer votre expérience de navigation et pour analyser l\'utilisation de notre site web afin de l\'optimiser continuellement.'
      ]
    },
    {
      id: 'types-of-cookies',
      title: 'Types de cookies que nous utilisons',
      icon: Database,
      content: [
        '**Cookies strictement nécessaires** : Ces cookies sont essentiels pour vous permettre de naviguer sur le site et d\'utiliser ses fonctionnalités. Sans ces cookies, les services que vous avez demandés ne peuvent pas être fournis.',
        '**Cookies de performance** : Ces cookies collectent des informations sur la façon dont les visiteurs utilisent un site web, par exemple les pages les plus visitées et les messages d\'erreur reçus. Ces cookies ne collectent pas d\'informations permettant d\'identifier un visiteur.',
        '**Cookies de fonctionnalité** : Ces cookies permettent au site web de se souvenir des choix que vous faites et de fournir des fonctionnalités améliorées et plus personnelles.',
        '**Cookies de ciblage/publicitaires** : Ces cookies sont utilisés pour diffuser des publicités plus pertinentes pour vous et vos centres d\'intérêt. Ils sont également utilisés pour limiter le nombre de fois où vous voyez une publicité.'
      ]
    },
    {
      id: 'cookie-duration',
      title: 'Durée de conservation des cookies',
      icon: Clock,
      content: [
        '**Cookies de session** : Ces cookies temporaires sont supprimés lorsque vous fermez votre navigateur. Ils permettent de maintenir votre session active pendant votre visite.',
        '**Cookies persistants** : Ces cookies restent sur votre appareil pendant une période déterminée ou jusqu\'à ce que vous les supprimiez manuellement. Leur durée varie selon leur fonction :',
        '• Cookies de préférences : 1 an maximum',
        '• Cookies analytiques : 2 ans maximum',
        '• Cookies de sécurité : 30 jours maximum',
        'Nous révisons régulièrement la nécessité de conserver ces cookies et supprimons ceux qui ne sont plus nécessaires.'
      ]
    },
    {
      id: 'third-party-cookies',
      title: 'Cookies tiers',
      icon: Globe,
      content: [
        'Notre site peut contenir des cookies provenant de services tiers que nous utilisons pour améliorer votre expérience :',
        '**Google Analytics** : Pour analyser le trafic et l\'utilisation du site (cookies analytiques)',
        '**Services de réseaux sociaux** : Pour partager du contenu sur les réseaux sociaux',
        '**Services de paiement** : Pour traiter les transactions de manière sécurisée',
        'Ces services tiers ont leurs propres politiques de cookies que nous vous encourageons à consulter. Nous n\'avons pas de contrôle sur ces cookies tiers.'
      ]
    },
    {
      id: 'manage-cookies',
      title: 'Gestion de vos cookies',
      icon: Settings,
      content: [
        'Vous avez le contrôle total sur les cookies. Voici comment vous pouvez les gérer :',
        '**Via votre navigateur** : Tous les navigateurs vous permettent de voir, gérer et supprimer les cookies. Les paramètres se trouvent généralement dans le menu "Préférences" ou "Options".',
        '**Via notre centre de préférences** : Vous pouvez modifier vos préférences de cookies à tout moment en cliquant sur le lien "Paramètres des cookies" en bas de page.',
        '**Désactivation complète** : Vous pouvez désactiver tous les cookies, mais cela peut affecter le fonctionnement de certaines parties du site.',
        'Note : La suppression des cookies peut vous déconnecter des sites web et supprimer vos préférences sauvegardées.'
      ]
    },
    {
      id: 'mobile-cookies',
      title: 'Cookies sur appareils mobiles',
      icon: Smartphone,
      content: [
        'Sur les appareils mobiles, les cookies fonctionnent de manière similaire aux ordinateurs de bureau. Cependant, la gestion peut varier selon le navigateur mobile utilisé.',
        '**Safari (iOS)** : Réglages > Safari > Confidentialité et sécurité',
        '**Chrome (Android)** : Menu > Paramètres > Paramètres du site > Cookies',
        '**Firefox Mobile** : Menu > Paramètres > Confidentialité',
        'Nous recommandons de consulter l\'aide de votre navigateur mobile spécifique pour des instructions détaillées sur la gestion des cookies.'
      ]
    },
    {
      id: 'updates',
      title: 'Mises à jour de cette politique',
      icon: AlertTriangle,
      content: [
        'Cette politique de cookies peut être mise à jour périodiquement pour refléter les changements dans nos pratiques ou pour d\'autres raisons opérationnelles, légales ou réglementaires.',
        'Nous vous encourageons à consulter régulièrement cette page pour rester informé de la façon dont nous utilisons les cookies.',
        'La date de dernière mise à jour est indiquée en haut de cette politique. Les modifications importantes seront communiquées par une notification sur notre site web.',
        'En continuant à utiliser notre site après la publication des modifications, vous acceptez la politique de cookies révisée.'
      ]
    }
  ]

  const contactInfo = {
    company: 'Mangoo Technology',
    address: '3 Rue de Cambrai, 75019 Paris, France',
    email: 'privacy@mangootech.com',
    phone: '+33 962014080'
  }

  return (
    <div className="min-h-screen pt-24 bg-white dark:bg-gray-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-hero pt-24 pb-16 lg:pt-32 lg:pb-24">
        <div className="absolute inset-0 bg-black/20"></div>
        
        {/* Éléments décoratifs */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-white/10 rounded-full animate-float"></div>
        <div className="absolute top-40 right-20 w-16 h-16 bg-white/10 rounded-full animate-float delay-200"></div>
        <div className="absolute bottom-20 left-1/4 w-12 h-12 bg-white/10 rounded-full animate-float delay-400"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center text-white">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 30 }}
              transition={{ duration: 0.8 }}
              className="mb-8"
            >
              <div className="flex items-center justify-center mb-6">
                <Cookie className="w-12 h-12 mr-4" />
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                  Politique des Cookies
                </h1>
              </div>
              <p className="text-xl md:text-2xl text-white/90 mb-8 leading-relaxed">
                Découvrez comment nous utilisons les cookies pour améliorer votre expérience sur notre site
              </p>
              <div className="text-sm text-white/80">
                <p>Dernière mise à jour : 15 janvier 2024</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Introduction */}
      <section className="py-12 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-4xl mx-auto"
          >
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-8">
              <div className="flex items-start">
                <AlertTriangle className="w-6 h-6 text-blue-600 dark:text-blue-400 mr-3 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    Transparence sur l'utilisation des cookies
                  </h3>
                  <p className="text-blue-800 dark:text-blue-200 leading-relaxed">
                    Chez Mangoo Technology, nous utilisons des cookies pour améliorer votre expérience de navigation, 
                    analyser l'utilisation de notre site et personnaliser le contenu. Cette politique explique 
                    en détail quels cookies nous utilisons et comment vous pouvez les contrôler.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Types de cookies */}
      <section className="py-12 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="max-w-6xl mx-auto"
          >
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                Types de cookies utilisés
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Nous utilisons différents types de cookies selon leur fonction et leur nécessité
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {cookieTypes.map((type, index) => {
                const Icon = type.icon
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
                    transition={{ duration: 0.6, delay: 0.1 * index }}
                    className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 text-center"
                  >
                    <div className="bg-primary-100 dark:bg-primary-900/30 p-3 rounded-lg w-fit mx-auto mb-4">
                      <Icon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      {type.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      {type.description}
                    </p>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Sections détaillées */}
      <section className="py-12 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-8">
            {sections.map((section, index) => {
              const Icon = section.icon
              return (
                <motion.div
                  key={section.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
                  transition={{ duration: 0.6, delay: 0.1 * index }}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex items-center mb-4">
                      <div className="bg-primary-100 dark:bg-primary-900/30 p-3 rounded-lg mr-4">
                        <Icon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {section.title}
                      </h2>
                    </div>
                    <div className="space-y-4">
                      {section.content.map((paragraph, pIndex) => (
                        <div key={pIndex} className="text-gray-700 dark:text-gray-300 leading-relaxed">
                          {paragraph.includes('**') ? (
                            <div dangerouslySetInnerHTML={{
                              __html: paragraph
                                .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900 dark:text-gray-100">$1</strong>')
                                .replace(/•/g, '<span class="text-primary-600 dark:text-primary-400">•</span>')
                            }} />
                          ) : (
                            <p>{paragraph}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="max-w-4xl mx-auto"
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                Questions sur les cookies ?
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Contactez notre équipe pour toute question concernant notre utilisation des cookies
              </p>
            </div>
            
            <div className="bg-gradient-to-r from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 rounded-lg p-8 border border-primary-200 dark:border-primary-800">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center">
                    <div className="bg-primary-100 dark:bg-primary-900/30 p-2 rounded-lg mr-3">
                      <Globe className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">{contactInfo.company}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <div className="bg-primary-100 dark:bg-primary-900/30 p-2 rounded-lg mr-3">
                      <MapPin className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div>
                      <p className="text-gray-700 dark:text-gray-300">{contactInfo.address}</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center">
                    <div className="bg-primary-100 dark:bg-primary-900/30 p-2 rounded-lg mr-3">
                      <Mail className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div>
                      <a href={`mailto:${contactInfo.email}`} className="text-primary-600 dark:text-primary-400 hover:underline">
                        {contactInfo.email}
                      </a>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <div className="bg-primary-100 dark:bg-primary-900/30 p-2 rounded-lg mr-3">
                      <Phone className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div>
                      <a href={`tel:${contactInfo.phone}`} className="text-primary-600 dark:text-primary-400 hover:underline">
                        {contactInfo.phone}
                      </a>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t border-primary-200 dark:border-primary-700">
                <div className="flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Nous nous engageons à répondre à vos questions dans les 48 heures
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

export default Cookies