import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { 
  FileText, 
  Shield, 
  Users, 
  CreditCard, 
  Globe, 
  Mail, 
  Phone, 
  MapPin,
  CheckCircle,
  AlertTriangle
} from 'lucide-react'

const Terms = () => {
  const { t } = useTranslation()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const sections = [
    {
      id: 'access',
      title: 'Accès au site',
      icon: Globe,
      content: [
        'L\'accès au site www.mangootech.com est gratuit et ouvert à tous les utilisateurs disposant d\'un accès Internet.',
        'Mangoo Technology se réserve le droit de suspendre, modifier ou interrompre l\'accès au site à tout moment et sans préavis.',
        'L\'utilisateur est responsable de la sécurité de ses identifiants de connexion et s\'engage à ne pas les divulguer à des tiers.'
      ]
    },
    {
      id: 'services',
      title: 'Services offerts',
      icon: FileText,
      content: [
        'Mangoo Technology propose une gamme de services numériques incluant la création de sites web, le développement d\'applications, les solutions e-commerce et les services de paiement.',
        'Les caractéristiques et fonctionnalités de chaque service sont détaillées dans les descriptions produits disponibles sur le site.',
        'Mangoo Technology s\'efforce de maintenir la disponibilité de ses services 24h/24 et 7j/7, mais ne peut garantir une disponibilité absolue.',
        'Les mises à jour et améliorations des services peuvent être effectuées sans préavis pour améliorer l\'expérience utilisateur.'
      ]
    },
    {
      id: 'obligations',
      title: 'Obligations des utilisateurs',
      icon: Users,
      content: [
        'L\'utilisateur s\'engage à utiliser les services de manière conforme à la législation en vigueur et aux présentes conditions.',
        'Il est interdit d\'utiliser les services à des fins illégales, frauduleuses ou portant atteinte aux droits de tiers.',
        'L\'utilisateur s\'engage à fournir des informations exactes et à jour lors de son inscription et à les maintenir actualisées.',
        'Toute utilisation abusive ou non conforme peut entraîner la suspension immédiate du compte utilisateur.'
      ]
    },
    {
      id: 'intellectual-property',
      title: 'Propriété intellectuelle',
      icon: Shield,
      content: [
        'Tous les éléments du site (textes, images, logos, design, code source) sont protégés par les droits de propriété intellectuelle.',
        'Toute reproduction, distribution ou utilisation non autorisée de ces éléments est strictement interdite.',
        'Les marques et logos présents sur le site sont la propriété exclusive de Mangoo Technology ou de ses partenaires.',
        'L\'utilisateur conserve la propriété des contenus qu\'il publie mais accorde à Mangoo Technology une licence d\'utilisation nécessaire au fonctionnement des services.'
      ]
    },
    {
      id: 'data-privacy',
      title: 'Confidentialité des données',
      icon: Shield,
      content: [
        'Mangoo Technology s\'engage à protéger la confidentialité des données personnelles de ses utilisateurs conformément au RGPD.',
        'Les données collectées sont utilisées uniquement dans le cadre de la fourniture des services et ne sont pas vendues à des tiers.',
        'L\'utilisateur dispose d\'un droit d\'accès, de rectification et de suppression de ses données personnelles.',
        'Les mesures de sécurité appropriées sont mises en place pour protéger les données contre tout accès non autorisé.'
      ]
    },
    {
      id: 'payments',
      title: 'Paiements et facturation',
      icon: CreditCard,
      content: [
        'Les tarifs des services sont indiqués en francs CFA (FCFA) et sont susceptibles de modification avec un préavis de 30 jours.',
        'Les paiements s\'effectuent via les moyens de paiement sécurisés proposés sur la plateforme.',
        'La facturation est effectuée selon la périodicité choisie (mensuelle, trimestrielle ou annuelle).',
        'En cas de retard de paiement, l\'accès aux services peut être suspendu après mise en demeure restée sans effet.'
      ]
    },
    {
      id: 'liability',
      title: 'Responsabilités et garanties',
      icon: AlertTriangle,
      content: [
        'Mangoo Technology met tout en œuvre pour assurer la qualité et la sécurité de ses services mais ne peut garantir leur fonctionnement sans interruption.',
        'La responsabilité de Mangoo Technology est limitée aux dommages directs et ne peut excéder le montant des sommes versées par l\'utilisateur.',
        'L\'utilisateur est responsable de la sauvegarde de ses données et contenus.',
        'Mangoo Technology ne peut être tenue responsable des dommages résultant d\'une utilisation inappropriée des services.'
      ]
    },
    {
      id: 'modifications',
      title: 'Modifications des conditions',
      icon: FileText,
      content: [
        'Mangoo Technology se réserve le droit de modifier les présentes conditions d\'utilisation à tout moment.',
        'Les utilisateurs seront informés des modifications par email ou via une notification sur le site.',
        'La poursuite de l\'utilisation des services après notification vaut acceptation des nouvelles conditions.',
        'En cas de désaccord avec les modifications, l\'utilisateur peut résilier son compte selon les modalités prévues.'
      ]
    },
    {
      id: 'termination',
      title: 'Résiliation de compte',
      icon: Users,
      content: [
        'L\'utilisateur peut résilier son compte à tout moment depuis son espace personnel ou en contactant le support client.',
        'Mangoo Technology peut résilier un compte en cas de non-respect des présentes conditions après mise en demeure.',
        'En cas de résiliation, l\'accès aux services est immédiatement suspendu et les données peuvent être supprimées après un délai de grâce.',
        'Les sommes déjà versées pour la période en cours ne sont pas remboursables sauf cas particuliers prévus par la loi.'
      ]
    },
    {
      id: 'applicable-law',
      title: 'Droit applicable et juridiction',
      icon: Shield,
      content: [
        'Les présentes conditions sont régies par le droit camerounais.',
        'Tout litige relatif à l\'interprétation ou à l\'exécution des présentes conditions sera soumis aux tribunaux compétents de Douala.',
        'En cas de litige, les parties s\'efforceront de trouver une solution amiable avant tout recours judiciaire.',
        'Si une clause des présentes conditions s\'avérait nulle ou inapplicable, les autres clauses demeureraient en vigueur.'
      ]
    }
  ]

  const contactInfo = {
    company: 'Mangoo Technology',
    address: '3 Rue de Cambrai, 75019 Paris, France',
    email: 'contact@mangootech.com',
    phone: '+33 962014080'
  }

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
                <FileText className="w-12 h-12 mr-4" />
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                  Conditions d'utilisation
                </h1>
              </div>
              <p className="text-xl md:text-2xl text-white/90 mb-8 leading-relaxed">
                Découvrez les conditions qui régissent l'utilisation de nos services
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
                    Information importante
                  </h3>
                  <p className="text-blue-800 dark:text-blue-200 leading-relaxed">
                    En utilisant les services de Mangoo Technology, vous acceptez de vous conformer aux présentes conditions d'utilisation. 
                    Nous vous recommandons de les lire attentivement et de les consulter régulièrement car elles peuvent être mises à jour.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Sections des conditions */}
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
                        <p key={pIndex} className="text-gray-700 dark:text-gray-300 leading-relaxed">
                          {paragraph}
                        </p>
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
                Nous contacter
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Pour toute question concernant ces conditions d'utilisation
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

export default Terms