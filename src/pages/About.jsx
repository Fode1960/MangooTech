import React from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { 
  Users, 
  Target, 
  Award, 
  Globe, 
  Heart, 
  Lightbulb,
  Shield,
  Zap
} from 'lucide-react'

const About = () => {
  const { t } = useTranslation()

  const values = [
    {
      icon: Heart,
      title: 'Passion',
      description: 'Nous sommes passionnés par la technologie et son impact positif sur l\'Afrique.'
    },
    {
      icon: Lightbulb,
      title: 'Innovation',
      description: 'Nous développons des solutions créatives adaptées aux défis locaux.'
    },
    {
      icon: Shield,
      title: 'Confiance',
      description: 'Nous construisons des relations durables basées sur la transparence.'
    },
    {
      icon: Zap,
      title: 'Excellence',
      description: 'Nous visons l\'excellence dans chaque projet que nous réalisons.'
    }
  ]

  const team = [
    {
      name: 'Amadou Diallo',
      role: 'CEO & Fondateur',
      description: 'Expert en transformation digitale avec 10 ans d\'expérience en Afrique.',
      image: '/images/team/amadou.jpg'
    },
    {
      name: 'Fatima Kone',
      role: 'CTO',
      description: 'Ingénieure logiciel passionnée par les technologies émergentes.',
      image: '/images/team/fatima.jpg'
    },
    {
      name: 'Ibrahim Traore',
      role: 'Head of Product',
      description: 'Designer UX/UI spécialisé dans l\'expérience utilisateur africaine.',
      image: '/images/team/ibrahim.jpg'
    }
  ]

  return (
    <div className="min-h-screen pt-24">
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
              À propos de <span className="text-white">Mangoo Tech</span>
            </h1>
            <p className="text-xl text-white/90 mb-8">
              Nous démocratisons l'accès aux technologies numériques en Afrique 
              avec des solutions innovantes, accessibles et adaptées aux réalités locales.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Notre Mission
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                Chez Mangoo Tech, nous croyons que chaque entrepreneur, artisan ou 
                commerçant africain mérite d'avoir accès aux mêmes outils numériques 
                que les grandes entreprises internationales.
              </p>
              <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                C'est pourquoi nous développons des solutions modulaires, abordables 
                et faciles à utiliser qui permettent à tous de prospérer dans 
                l'économie numérique.
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="grid grid-cols-2 gap-6"
            >
              <div className="card text-center">
                <div className="card-body">
                  <Users className="w-12 h-12 text-primary mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">10,000+</h3>
                  <p className="text-gray-600 dark:text-gray-300">Utilisateurs actifs</p>
                </div>
              </div>
              
              <div className="card text-center">
                <div className="card-body">
                  <Globe className="w-12 h-12 text-secondary mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">15</h3>
                  <p className="text-gray-600 dark:text-gray-300">Pays couverts</p>
                </div>
              </div>
              
              <div className="card text-center">
                <div className="card-body">
                  <Target className="w-12 h-12 text-accent mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">95%</h3>
                  <p className="text-gray-600 dark:text-gray-300">Satisfaction client</p>
                </div>
              </div>
              
              <div className="card text-center">
                <div className="card-body">
                  <Award className="w-12 h-12 text-primary mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">5</h3>
                  <p className="text-gray-600 dark:text-gray-300">Prix remportés</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-6">
              Nos Valeurs
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Ces valeurs guident chacune de nos décisions et façonnent 
              notre approche du développement technologique.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => {
              const IconComponent = value.icon
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="card text-center hover:shadow-lg transition-shadow"
                >
                  <div className="card-body">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <IconComponent className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                      {value.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      {value.description}
                    </p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-6">
              Notre Équipe
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Une équipe passionnée et expérimentée, unie par la vision 
              d'un avenir numérique inclusif pour l'Afrique.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {team.map((member, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="card text-center hover:shadow-lg transition-shadow"
              >
                <div className="card-body">
                  <div className="w-24 h-24 bg-gradient-to-br from-primary to-secondary rounded-full mx-auto mb-4 flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                    {member.name}
                  </h3>
                  <p className="text-primary font-medium mb-3">
                    {member.role}
                  </p>
                  <p className="text-gray-600 dark:text-gray-300">
                    {member.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary-800">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Rejoignez la Révolution Numérique Africaine
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-3xl mx-auto">
              Découvrez comment nos solutions peuvent transformer votre activité 
              et vous aider à atteindre vos objectifs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/services" className="btn-secondary">
                Découvrir nos services
              </a>
              <a href="/contact" className="btn-outline-white">
                Nous contacter
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

export default About