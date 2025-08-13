import React from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { 
  Mail, 
  Phone, 
  MapPin, 
  Facebook, 
  Twitter, 
  Linkedin, 
  Instagram,
  Globe,
  Heart
} from 'lucide-react'
import MangoLogo from '../ui/MangoLogo'

const Footer = () => {
  const { t } = useTranslation()
  const currentYear = new Date().getFullYear()

  const services = [
    { name: 'Mini-sites', href: '/services#mini-sites' },
    { name: 'Mini-boutiques', href: '/services#mini-boutiques' },
    { name: 'Mangoo Pay+', href: '/services#mangoo-pay' },
    { name: 'Mangoo Express+', href: '/services#mangoo-express' },
    { name: 'Mangoo Connect+', href: '/services#mangoo-connect' },
    { name: 'Mangoo Analytics+', href: '/services#mangoo-analytics' }
  ]

  const company = [
    { name: t('nav.about'), href: '/about' },
    { name: 'Notre équipe', href: '/about#team' },
    { name: 'Carrières', href: '/careers' },
    { name: 'Partenaires', href: '/partners' },
    { name: 'Blog', href: '/blog' },
    { name: t('nav.contact'), href: '/contact' }
  ]

  const support = [
    { name: 'Centre d\'aide', href: '/help' },
    { name: 'Documentation', href: '/docs' },
    { name: 'API', href: '/api' },
    { name: 'Statut des services', href: '/status' },
    { name: 'Signaler un bug', href: '/report-bug' },
    { name: 'Demande de fonctionnalité', href: '/feature-request' }
  ]

  const legal = [
    { name: 'Conditions d\'utilisation', href: '/terms' },
    { name: 'Politique de confidentialité', href: '/privacy' },
    { name: 'Politique de cookies', href: '/cookies' },
    { name: 'Mentions légales', href: '/legal' },
    { name: 'RGPD', href: '/gdpr' }
  ]

  const socialLinks = [
    { 
      name: 'Facebook', 
      href: 'https://facebook.com/mangootech', 
      icon: Facebook,
      color: 'hover:text-blue-600'
    },
    { 
      name: 'Twitter', 
      href: 'https://twitter.com/mangootech', 
      icon: Twitter,
      color: 'hover:text-blue-400'
    },
    { 
      name: 'LinkedIn', 
      href: 'https://linkedin.com/company/mangootech', 
      icon: Linkedin,
      color: 'hover:text-blue-700'
    },
    { 
      name: 'Instagram', 
      href: 'https://instagram.com/mangootech', 
      icon: Instagram,
      color: 'hover:text-pink-600'
    }
  ]

  return (
    <footer className="bg-dark-900 dark:bg-gray-950 text-white">
      {/* Section principale */}
      <div className="container py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Logo et description */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center space-x-3 mb-6">
              <MangoLogo className="w-12 h-12" />
              <div>
                <span className="text-2xl font-bold text-gradient">
                  Mangoo Tech
                </span>
                <p className="text-sm text-gray-400 dark:text-gray-500 -mt-1">
                  Solutions Numériques
                </p>
              </div>
            </Link>
            
            <p className="text-gray-300 dark:text-gray-400 mb-6 leading-relaxed">
              Solutions technologiques modulaires pour l'Afrique et au-delà. 
              Nous démocratisons la digitalisation pour tous les acteurs économiques 
              avec des outils accessibles, sécurisés et innovants.
            </p>
            
            {/* Informations de contact */}
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-gray-300">
                <Mail className="w-5 h-5 text-primary-400" />
                <a href="mailto:contact@mangoo.tech" className="hover:text-primary-400 transition-colors">
                  contact@mangoo.tech
                </a>
              </div>
              <div className="flex items-center space-x-3 text-gray-300">
                <Phone className="w-5 h-5 text-primary-400" />
                <a href="tel:+221123456789" className="hover:text-primary-400 transition-colors">
                  +221 12 345 67 89
                </a>
              </div>
              <div className="flex items-center space-x-3 text-gray-300">
                <MapPin className="w-5 h-5 text-primary-400" />
                <span>Dakar, Sénégal</span>
              </div>
              <div className="flex items-center space-x-3 text-gray-300">
                <Globe className="w-5 h-5 text-primary-400" />
                <a href="https://mangoo.tech" className="hover:text-primary-400 transition-colors">
                  www.mangoo.tech
                </a>
              </div>
            </div>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-lg font-semibold mb-6 text-white">
              Services
            </h3>
            <ul className="space-y-3">
              {services.map((service) => (
                <li key={service.name}>
                  <a 
                    href={service.href}
                    className="text-gray-300 hover:text-primary-400 transition-colors text-sm"
                  >
                    {service.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Entreprise */}
          <div>
            <h3 className="text-lg font-semibold mb-6 text-white">
              Entreprise
            </h3>
            <ul className="space-y-3">
              {company.map((item) => (
                <li key={item.name}>
                  <Link 
                    to={item.href}
                    className="text-gray-300 hover:text-primary-400 transition-colors text-sm"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-lg font-semibold mb-6 text-white">
              Support
            </h3>
            <ul className="space-y-3">
              {support.map((item) => (
                <li key={item.name}>
                  <a 
                    href={item.href}
                    className="text-gray-300 hover:text-primary-400 transition-colors text-sm"
                  >
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Newsletter */}
        <div className="mt-12 pt-8 border-t border-gray-700">
          <div className="max-w-md">
            <h3 className="text-lg font-semibold mb-4 text-white">
              Restez informé
            </h3>
            <p className="text-gray-300 mb-4 text-sm">
              Recevez les dernières actualités et mises à jour de Mangoo Tech.
            </p>
            <form className="flex space-x-3">
              <input
                type="email"
                placeholder="Votre adresse e-mail"
                className="flex-1 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
              />
              <button
                type="submit"
                className="btn-primary px-6 py-2 text-sm"
              >
                S'abonner
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Section du bas */}
      <div className="border-t border-gray-700">
        <div className="container py-6">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            {/* Copyright */}
            <div className="flex items-center space-x-2 text-gray-400 text-sm">
              <span>© {currentYear} Mangoo Tech. Tous droits réservés.</span>
              <span className="hidden md:inline">•</span>
              <span className="flex items-center space-x-1">
                <span>Fait avec</span>
                <Heart className="w-4 h-4 text-red-500" />
                <span>en Afrique</span>
              </span>
            </div>

            {/* Liens légaux */}
            <div className="flex items-center space-x-6">
              {legal.slice(0, 3).map((item) => (
                <Link 
                  key={item.name}
                  to={item.href}
                  className="text-gray-400 hover:text-primary-400 transition-colors text-sm"
                >
                  {item.name}
                </Link>
              ))}
            </div>

            {/* Réseaux sociaux */}
            <div className="flex items-center space-x-4">
              {socialLinks.map((social) => {
                const Icon = social.icon
                return (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`text-gray-400 ${social.color} transition-colors`}
                    aria-label={social.name}
                  >
                    <Icon className="w-5 h-5" />
                  </a>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer