import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  Send, 
  MessageCircle, 
  User, 
  Building, 
  Globe,
  Facebook,
  Twitter,
  Linkedin,
  Instagram,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { submitContactForm } from '../lib/supabase'

const Contact = () => {
  const { t } = useTranslation()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    subject: '',
    message: '',
    service: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState(null)

  const services = [
    'Mini-sites',
    'Espaces individuels',
    'Mini-boutiques',
    'Mangoo Pay+',
    'Mangoo Express+',
    'Mangoo Connect+',
    'Mangoo Ads+',
    'Mangoo Analytics+',
    'Mangoo Health+',
    'Mangoo Learning+',
    'Mangoo Agritech+',
    'Pack Découverte',
    'Pack Professionnel',
    'Pack Premium',
    'Autre'
  ]

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus(null)

    try {
      await submitContactForm(formData)
      setSubmitStatus('success')
      setFormData({
        name: '',
        email: '',
        phone: '',
        company: '',
        subject: '',
        message: '',
        service: ''
      })
    } catch (error) {
      console.error('Erreur lors de l\'envoi:', error)
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const contactInfo = [
    {
      icon: Mail,
      title: 'Email',
      value: 'contact@mangootech.com',
      link: 'mailto:contact@mangootech.com'
    },
    {
      icon: Phone,
      title: 'Téléphone',
      value: '+225 07 XX XX XX XX',
      link: 'tel:+22507XXXXXXXX'
    },
    {
      icon: MapPin,
      title: 'Adresse',
      value: 'Abidjan, Côte d\'Ivoire',
      link: null
    },
    {
      icon: Clock,
      title: 'Horaires',
      value: 'Lun - Ven: 8h - 18h',
      link: null
    }
  ]

  const socialLinks = [
    {
      icon: Facebook,
      name: 'Facebook',
      url: 'https://facebook.com/mangootech',
      color: 'text-blue-600 hover:text-blue-700'
    },
    {
      icon: Twitter,
      name: 'Twitter',
      url: 'https://twitter.com/mangootech',
      color: 'text-sky-500 hover:text-sky-600'
    },
    {
      icon: Linkedin,
      name: 'LinkedIn',
      url: 'https://linkedin.com/company/mangootech',
      color: 'text-blue-700 hover:text-blue-800'
    },
    {
      icon: Instagram,
      name: 'Instagram',
      url: 'https://instagram.com/mangootech',
      color: 'text-pink-600 hover:text-pink-700'
    }
  ]

  return (
    <div className="min-h-screen pt-20">
      {/* Hero Section */}
      <section className="bg-gradient-primary text-white py-16">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              {t('contact.title')}
            </h1>
            <p className="text-xl text-white/90 mb-8">
              {t('contact.subtitle')}
            </p>
          </motion.div>
        </div>
      </section>

      <div className="py-16">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Formulaire de contact */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <div className="card">
                <div className="card-body">
                  <h2 className="text-2xl font-bold mb-6 flex items-center text-gray-900 dark:text-gray-100">
                    <MessageCircle className="w-6 h-6 mr-3 text-primary-600" />
                    Envoyez-nous un message
                  </h2>

                  {submitStatus === 'success' && (
                    <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center">
                      <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                      <span className="text-green-800 dark:text-green-200">
                        Votre message a été envoyé avec succès ! Nous vous répondrons dans les plus brefs délais.
                      </span>
                    </div>
                  )}

                  {submitStatus === 'error' && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
                      <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
                      <span className="text-red-800 dark:text-red-200">
                        Une erreur s'est produite. Veuillez réessayer ou nous contacter directement.
                      </span>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Nom complet *
                        </label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            required
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                            placeholder="Votre nom complet"
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Email *
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            required
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                            placeholder="votre@email.com"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Téléphone
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <input
                            type="tel"
                            id="phone"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                            placeholder="+225 XX XX XX XX"
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="company" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Entreprise
                        </label>
                        <div className="relative">
                          <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <input
                            type="text"
                            id="company"
                            name="company"
                            value={formData.company}
                            onChange={handleInputChange}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                            placeholder="Nom de votre entreprise"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="service" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Service d'intérêt
                      </label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <select
                          id="service"
                          name="service"
                          value={formData.service}
                          onChange={handleInputChange}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 appearance-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        >
                          <option value="">Sélectionnez un service</option>
                          {services.map((service) => (
                            <option key={service} value={service}>
                              {service}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Sujet *
                      </label>
                      <input
                        type="text"
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        placeholder="Objet de votre message"
                      />
                    </div>

                    <div>
                      <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Message *
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleInputChange}
                        required
                        rows={6}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-vertical bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        placeholder="Décrivez votre projet ou votre demande en détail..."
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full btn-primary py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                          Envoi en cours...
                        </div>
                      ) : (
                        <div className="flex items-center justify-center">
                          <Send className="w-5 h-5 mr-2" />
                          Envoyer le message
                        </div>
                      )}
                    </button>
                  </form>
                </div>
              </div>
            </motion.div>

            {/* Informations de contact */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              {/* Coordonnées */}
              <div className="card">
                <div className="card-body">
                  <h3 className="text-xl font-bold mb-6 text-gray-900 dark:text-gray-100">Nos coordonnées</h3>
                  <div className="space-y-4">
                    {contactInfo.map((info, index) => {
                      const Icon = info.icon
                      const content = (
                        <div className="flex items-center space-x-4 p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                          <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Icon className="w-6 h-6 text-primary-600" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-gray-100">{info.title}</h4>
                            <p className="text-gray-600 dark:text-gray-300">{info.value}</p>
                          </div>
                        </div>
                      )

                      return info.link ? (
                        <a key={index} href={info.link} className="block">
                          {content}
                        </a>
                      ) : (
                        <div key={index}>
                          {content}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Réseaux sociaux */}
              <div className="card">
                <div className="card-body">
                  <h3 className="text-xl font-bold mb-6 text-gray-900 dark:text-gray-100">Suivez-nous</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {socialLinks.map((social, index) => {
                      const Icon = social.icon
                      return (
                        <a
                          key={index}
                          href={social.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`flex items-center space-x-3 p-3 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 transition-colors ${social.color}`}
                        >
                          <Icon className="w-5 h-5" />
                          <span className="font-medium text-gray-900 dark:text-gray-100">{social.name}</span>
                        </a>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Horaires d'ouverture */}
              <div className="card">
                <div className="card-body">
                  <h3 className="text-xl font-bold mb-6 dark:text-gray-100">Horaires d'ouverture</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                      <span className="font-medium text-gray-900 dark:text-gray-100">Lundi - Vendredi</span>
                      <span className="text-gray-600 dark:text-gray-300">8h00 - 18h00</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                      <span className="font-medium text-gray-900 dark:text-gray-100">Samedi</span>
                      <span className="text-gray-600 dark:text-gray-300">9h00 - 15h00</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="font-medium text-gray-900 dark:text-gray-100">Dimanche</span>
                      <span className="text-red-600">Fermé</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Support d'urgence */}
              <div className="card bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-red-200 dark:border-red-800">
                <div className="card-body">
                  <h3 className="text-xl font-bold mb-4 text-red-800 dark:text-red-400">Support d'urgence</h3>
                  <p className="text-red-700 dark:text-red-300 mb-4">
                    Pour les urgences techniques en dehors des heures d'ouverture :
                  </p>
                  <a
                    href="tel:+22507XXXXXXXX"
                    className="inline-flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <Phone className="w-4 h-4" />
                    <span>+225 07 XX XX XX XX</span>
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <section className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="section-title">
              Questions fréquentes
            </h2>
            <p className="section-subtitle">
              Trouvez rapidement les réponses à vos questions
            </p>
          </motion.div>

          <div className="max-w-3xl mx-auto space-y-4">
            {[
              {
                question: "Combien de temps faut-il pour créer un mini-site ?",
                answer: "En général, un mini-site est livré sous 5 à 7 jours ouvrables après validation du cahier des charges et réception des contenus."
              },
              {
                question: "Puis-je modifier mon pack en cours d'abonnement ?",
                answer: "Oui, vous pouvez upgrader ou downgrader votre pack à tout moment. Les changements prennent effet dès le cycle de facturation suivant."
              },
              {
                question: "Y a-t-il des frais de configuration ?",
                answer: "Non, il n'y a aucun frais de configuration. Vous ne payez que l'abonnement mensuel choisi."
              },
              {
                question: "Proposez-vous un support technique ?",
                answer: "Oui, nous offrons un support technique par email, chat et téléphone selon votre pack. Le support 24/7 est disponible pour les packs Premium."
              },
              {
                question: "Puis-je annuler mon abonnement à tout moment ?",
                answer: "Oui, vous pouvez annuler votre abonnement à tout moment sans frais. L'annulation prend effet à la fin de la période de facturation en cours."
              }
            ].map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="card"
              >
                <div className="card-body">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    {faq.question}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    {faq.answer}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

export default Contact