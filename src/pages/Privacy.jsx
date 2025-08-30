import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { 
  Shield, 
  Eye, 
  Database, 
  Users, 
  Settings, 
  Lock, 
  Globe, 
  Mail, 
  Phone, 
  MapPin,
  CheckCircle,
  AlertTriangle,
  FileText,
  Server,
  Smartphone,
  MessageCircle,
  CreditCard,
  UserCheck
} from 'lucide-react'

const Privacy = () => {
  const { t } = useTranslation()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const sections = [
    {
      id: 'introduction',
      title: 'Introduction',
      icon: Shield,
      content: [
        'Nous avons créé cette déclaration de confidentialité afin de démontrer notre engagement envers vous, notre client. Cette politique de confidentialité explique nos pratiques en matière d\'information et décrit comment nous collectons, utilisons, protégeons et traitons vos informations personnelles.',
        'Mangoo Technology propose des services d\'appels vocaux, d\'appels vidéo, de messagerie et autres à des utilisateurs du monde entier. Cette politique s\'applique à toutes nos applications, services, fonctionnalités, logiciels et sites Web, sauf indication contraire.',
        'Veuillez lire attentivement notre politique de confidentialité pour bien comprendre comment nous traitons vos données conformément au RGPD et aux réglementations en vigueur.'
      ]
    },
    {
      id: 'information-collection',
      title: 'Informations que nous collectons',
      icon: Database,
      content: [
        'Mangoo Technology reçoit ou collecte des informations lorsque nous exploitons et fournissons nos services, y compris lorsque vous installez, accédez ou utilisez nos applications et logiciels.',
        'Nous collectons uniquement les informations nécessaires au bon fonctionnement de nos services et à l\'amélioration de votre expérience utilisateur.',
        'Toutes les données collectées sont traitées de manière sécurisée et conforme aux réglementations en vigueur sur la protection des données.'
      ]
    },
    {
      id: 'user-provided-info',
      title: 'Informations que vous fournissez',
      icon: UserCheck,
      content: [
        '**Informations sur votre compte** : Vous fournissez votre numéro de téléphone portable pour créer un compte. Vous nous fournissez régulièrement les numéros de téléphone de votre carnet d\'adresses mobile, y compris ceux des utilisateurs de nos Services et de vos autres contacts.',
        '**Vos messages** : Nous ne conservons pas vos messages dans le cadre normal de la fourniture de nos Services. Une fois vos messages livrés, ils sont supprimés de nos serveurs. Nous proposons le chiffrement de bout en bout pour nos Services, activé par défaut.',
        '**Vos connexions** : Pour vous aider à organiser la façon dont vous communiquez avec les autres, nous pouvons créer une liste de favoris de vos contacts associée aux informations de votre compte.',
        '**Service client** : Vous pouvez nous fournir des informations relatives à votre utilisation de nos services pour que nous puissions vous fournir une assistance client efficace.'
      ]
    },
    {
      id: 'automatic-collection',
      title: 'Informations collectées automatiquement',
      icon: Server,
      content: [
        '**Informations d\'utilisation et de journal** : Nous collectons des informations relatives aux services, aux diagnostics et aux performances, incluant votre activité et les fichiers journaux.',
        '**Informations transactionnelles** : Si vous payez pour nos Services, nous pouvons recevoir des informations et des confirmations, telles que des reçus de paiement.',
        '**Informations sur l\'appareil et la connexion** : Nous collectons des informations spécifiques à votre appareil, incluant le modèle, le système d\'exploitation, l\'adresse IP et les identifiants de l\'appareil.',
        '**Cookies** : Nous utilisons des cookies pour exploiter et fournir nos Services, améliorer votre expérience et personnaliser nos Services selon vos préférences.',
        '**Informations sur votre statut** : Nous collectons des informations sur votre connexion et les modifications de votre message de statut sur nos Services.'
      ]
    },
    {
      id: 'third-party-info',
      title: 'Informations de tiers',
      icon: Users,
      content: [
        '**Informations fournies par d\'autres personnes** : Nous recevons des informations que d\'autres personnes nous fournissent, notamment des informations vous concernant lorsque d\'autres utilisateurs utilisent nos Services.',
        '**Fournisseurs tiers** : Nous collaborons avec des fournisseurs tiers pour nous aider à exploiter, fournir et améliorer nos Services. Ces fournisseurs peuvent nous fournir des informations vous concernant dans certaines circonstances.',
        '**Services tiers** : Si vous utilisez nos Services en lien avec des services tiers, nous pouvons recevoir des informations vous concernant de leur part selon leurs propres politiques de confidentialité.'
      ]
    },
    {
      id: 'information-usage',
      title: 'Comment nous utilisons les informations',
      icon: Settings,
      content: [
        'Nous utilisons toutes les informations dont nous disposons pour nous aider à exploiter, fournir, améliorer, comprendre, personnaliser, soutenir et commercialiser nos produits et services.',
        '**Nos produits et services** : Nous exploitons et fournissons nos produits et services, notamment en assurant le support client et en améliorant, réparant et personnalisant nos produits.',
        '**Sûreté et sécurité** : Nous vérifions les comptes et les activités, et promouvons la sécurité sur et en dehors de nos Services en enquêtant sur les activités suspectes.',
        '**Bannières publicitaires tierces** : Nous n\'autorisons pas les bannières publicitaires tierces sur nos produits et applications mobiles. Nous n\'avons pas l\'intention de les introduire.'
      ]
    },
    {
      id: 'information-sharing',
      title: 'Informations que vous et nous partageons',
      icon: Globe,
      content: [
        'Vous partagez vos informations lorsque vous utilisez et communiquez via nos produits et applications mobiles, et nous partageons vos informations pour nous aider à exploiter et améliorer nos services.',
        '**Informations sur le compte** : Votre numéro de téléphone, votre nom de profil et votre photo, votre statut en ligne peuvent être accessibles à toute personne qui utilise nos services et se connecte avec vous.',
        '**Vos contacts et autres** : Les utilisateurs avec lesquels vous communiquez peuvent stocker ou partager vos informations. Vous pouvez utiliser les paramètres de vos Services pour gérer ces interactions.',
        '**Fournisseurs tiers** : Nous collaborons avec des fournisseurs tiers pour ajouter des fonctionnalités complémentaires, en exigeant qu\'ils utilisent vos informations conformément à nos instructions.',
        '**Services tiers** : Lorsque vous utilisez des services tiers intégrés, leurs propres conditions et politiques de confidentialité régissent votre utilisation.'
      ]
    },
    {
      id: 'information-management',
      title: 'Gestion de vos informations',
      icon: Lock,
      content: [
        'Si vous souhaitez gérer, modifier, limiter ou supprimer vos informations, nous vous permettons de le faire via les outils suivants :',
        '**Paramètres des services** : Vous pouvez modifier vos paramètres de services pour gérer certaines informations accessibles aux autres utilisateurs.',
        '**Modification de vos informations** : Vous devez modifier votre numéro de téléphone portable via la fonctionnalité intégrée à l\'application. Vous pouvez également modifier votre nom de profil et votre photo à tout moment.',
        '**Suppression de votre compte** : Vous pouvez supprimer votre compte à tout moment. Lorsque vous supprimez votre compte, vos messages non distribués sont supprimés de nos serveurs.',
        '**Droit à l\'oubli** : Conformément au RGPD, vous disposez du droit de demander la suppression de vos données personnelles dans certaines circonstances.'
      ]
    },
    {
      id: 'legal-protection',
      title: 'Loi et protection',
      icon: Shield,
      content: [
        'Nous pouvons collecter, utiliser, conserver et partager vos informations si nous pensons de bonne foi qu\'il est raisonnablement nécessaire de :',
        '• Répondre conformément à la loi ou à la réglementation applicable, à une procédure judiciaire ou à des demandes gouvernementales',
        '• Faire respecter nos Conditions et toutes autres conditions et politiques applicables',
        '• Détecter, enquêter, prévenir et traiter la fraude et autres activités illégales, les problèmes de sécurité ou techniques',
        '• Protéger les droits, la propriété et la sécurité de nos utilisateurs et de notre entreprise'
      ]
    },
    {
      id: 'policy-updates',
      title: 'Mises à jour de notre politique',
      icon: FileText,
      content: [
        'Nous sommes susceptibles de modifier ou de mettre à jour notre Politique de confidentialité pour refléter les changements dans nos pratiques ou pour des raisons légales.',
        'Nous vous informerons de toute modification importante apportée à cette Politique par email ou via une notification sur notre site web.',
        'Si vous n\'acceptez pas notre Politique de confidentialité telle que modifiée, vous devez cesser d\'utiliser nos Services.',
        'Nous vous recommandons de consulter régulièrement notre Politique de confidentialité pour rester informé de nos pratiques en matière de protection des données.'
      ]
    }
  ]

  const contactInfo = {
    company: 'Mangoo Technology',
    address: '3 Rue de Cambrai, 75019 Paris, France',
    email: 'infos@mangootech.com',
    phone: '+33 962014080'
  }

  const dataRights = [
    {
      title: 'Droit d\'accès',
      description: 'Vous pouvez demander une copie des données personnelles que nous détenons à votre sujet.',
      icon: Eye
    },
    {
      title: 'Droit de rectification',
      description: 'Vous pouvez demander la correction de données inexactes ou incomplètes.',
      icon: Settings
    },
    {
      title: 'Droit à l\'effacement',
      description: 'Vous pouvez demander la suppression de vos données personnelles dans certaines circonstances.',
      icon: Lock
    },
    {
      title: 'Droit à la portabilité',
      description: 'Vous pouvez demander le transfert de vos données vers un autre service.',
      icon: Database
    }
  ]

  return (
    <div className="min-h-screen pt-24 bg-gray-50 dark:bg-gray-900">
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
                <Shield className="w-12 h-12 mr-4" />
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                  Politique de confidentialité
                </h1>
              </div>
              <p className="text-xl md:text-2xl text-white/90 mb-8 leading-relaxed">
                Découvrez comment nous protégeons et utilisons vos données personnelles
              </p>
              <div className="flex items-center justify-center text-sm text-white/80">
                <CheckCircle className="w-4 h-4 mr-2" />
                <span>Dernière mise à jour : Janvier 2024</span>
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
                    Votre vie privée est importante
                  </h3>
                  <p className="text-blue-800 dark:text-blue-200 leading-relaxed">
                    Chez Mangoo Technology, nous nous engageons à protéger votre vie privée et à traiter vos données personnelles 
                    de manière transparente et sécurisée. Cette politique explique en détail nos pratiques en matière de collecte, 
                    d'utilisation et de protection de vos informations.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Vos droits RGPD */}
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
                Vos droits en matière de données
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Conformément au RGPD, vous disposez de plusieurs droits concernant vos données personnelles
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {dataRights.map((right, index) => {
                const Icon = right.icon
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
                      {right.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      {right.description}
                    </p>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Sections de la politique */}
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
                                .replace(/•/g, '<span class="text-blue-600 dark:text-blue-400">•</span>')
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
                Questions sur la confidentialité ?
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Contactez notre équipe pour toute question concernant cette politique de confidentialité
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
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

export default Privacy