import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { 
  BarChart3, 
  Users, 
  ShoppingCart, 
  TrendingUp, 
  Globe, 
  MessageCircle,
  CreditCard,
  Truck,
  Plus,
  Settings,
  Bell,
  Calendar,
  FileText,
  Eye,
  Edit,
  Trash2,
  Star,
  Activity,
  DollarSign,
  Package,
  Clock
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import LoadingSpinner from '../components/ui/LoadingSpinner'

const Dashboard = () => {
  const { t } = useTranslation()
  const { user, isAdmin, isProfessional } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    totalVisits: 0,
    totalSales: 0,
    activeServices: 0,
    monthlyRevenue: 0
  })
  const [recentActivities, setRecentActivities] = useState([])
  const [services, setServices] = useState([])

  useEffect(() => {
    // Simuler le chargement des données
    const loadDashboardData = async () => {
      try {
        // Ici, vous feriez des appels API réels
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Données simulées
        setStats({
          totalVisits: 12543,
          totalSales: 89,
          activeServices: 3,
          monthlyRevenue: 125000
        })
        
        setRecentActivities([
          {
            id: 1,
            type: 'visit',
            message: 'Nouvelle visite sur votre mini-site',
            time: '2 minutes ago',
            icon: Eye
          },
          {
            id: 2,
            type: 'sale',
            message: 'Nouvelle commande reçue',
            time: '1 heure ago',
            icon: ShoppingCart
          },
          {
            id: 3,
            type: 'message',
            message: 'Nouveau message de contact',
            time: '3 heures ago',
            icon: MessageCircle
          },
          {
            id: 4,
            type: 'payment',
            message: 'Paiement reçu - 25,000 FCFA',
            time: '1 jour ago',
            icon: CreditCard
          }
        ])
        
        setServices([
          {
            id: 1,
            name: 'Mon Mini-site',
            type: 'mini-site',
            status: 'active',
            visits: 1234,
            lastUpdate: '2024-01-15',
            url: 'https://monsite.mangootech.com'
          },
          {
            id: 2,
            name: 'Ma Boutique',
            type: 'mini-boutique',
            status: 'active',
            sales: 45,
            revenue: 75000,
            lastUpdate: '2024-01-14'
          },
          {
            id: 3,
            name: 'Mangoo Analytics',
            type: 'analytics',
            status: 'trial',
            reports: 12,
            lastUpdate: '2024-01-13'
          }
        ])
      } catch (error) {
        console.error('Erreur lors du chargement:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadDashboardData()
  }, [])

  if (isLoading) {
    return <LoadingSpinner variant="fullPage" />
  }

  const quickActions = [
    {
      name: 'Créer un mini-site',
      description: 'Lancez votre présence en ligne',
      icon: Globe,
      color: 'bg-blue-500',
      link: '/services/mini-sites'
    },
    {
      name: 'Ouvrir une boutique',
      description: 'Vendez vos produits en ligne',
      icon: ShoppingCart,
      color: 'bg-green-500',
      link: '/services/mini-boutiques'
    },
    {
      name: 'Voir les analytics',
      description: 'Analysez vos performances',
      icon: BarChart3,
      color: 'bg-purple-500',
      link: '/analytics'
    },
    {
      name: 'Contacter le support',
      description: 'Obtenez de l\'aide',
      icon: MessageCircle,
      color: 'bg-orange-500',
      link: '/contact'
    }
  ]

  const getServiceIcon = (type) => {
    switch (type) {
      case 'mini-site': return Globe
      case 'mini-boutique': return ShoppingCart
      case 'analytics': return BarChart3
      default: return Package
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'trial': return 'bg-yellow-100 text-yellow-800'
      case 'inactive': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return 'Actif'
      case 'trial': return 'Essai'
      case 'inactive': return 'Inactif'
      default: return 'Inconnu'
    }
  }

  return (
    <div className="min-h-screen pt-20 bg-gray-50">
      <div className="container py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Bonjour, {user?.user_metadata?.firstName || user?.email} 👋
              </h1>
              <p className="text-gray-600">
                Voici un aperçu de vos activités et services.
              </p>
            </div>
            <div className="mt-4 lg:mt-0 flex space-x-3">
              <button className="btn-outline flex items-center space-x-2">
                <Bell className="w-4 h-4" />
                <span>Notifications</span>
              </button>
              <Link to="/settings" className="btn-primary flex items-center space-x-2">
                <Settings className="w-4 h-4" />
                <span>Paramètres</span>
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Statistiques */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <div className="card">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Visites totales</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.totalVisits.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Eye className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-green-600 font-medium">+12%</span>
                <span className="text-gray-500 dark:text-gray-400 ml-1">ce mois</span>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Ventes</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.totalSales}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <ShoppingCart className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-green-600 font-medium">+8%</span>
                <span className="text-gray-500 ml-1">ce mois</span>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Services actifs</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.activeServices}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Package className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">Sur 5 disponibles</span>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Revenus mensuels</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.monthlyRevenue.toLocaleString()} FCFA</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-green-600 font-medium">+15%</span>
                <span className="text-gray-500 ml-1">ce mois</span>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Services actifs */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-2"
          >
            <div className="card">
              <div className="card-body">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Mes Services</h2>
                  <Link to="/services" className="btn-primary text-sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Ajouter un service
                  </Link>
                </div>
                
                <div className="space-y-4">
                  {services.map((service) => {
                    const Icon = getServiceIcon(service.type)
                    return (
                      <div key={service.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                              <Icon className="w-5 h-5 text-primary-600" />
                            </div>
                            <div>
                              <h3 className="font-medium text-gray-900 dark:text-gray-100">{service.name}</h3>
                              <div className="flex items-center space-x-3 mt-1">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(service.status)}`}>
                                  {getStatusText(service.status)}
                                </span>
                                <span className="text-sm text-gray-500">
                                  Mis à jour le {new Date(service.lastUpdate).toLocaleDateString('fr-FR')}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            {service.url && (
                              <a
                                href={service.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                                title="Voir le site"
                              >
                                <Eye className="w-4 h-4" />
                              </a>
                            )}
                            <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors" title="Modifier">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button className="p-2 text-gray-400 hover:text-red-600 transition-colors" title="Supprimer">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        
                        {/* Métriques du service */}
                        <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                          {service.visits && (
                            <div className="text-center">
                              <p className="text-lg font-semibold text-gray-900">{service.visits.toLocaleString()}</p>
                              <p className="text-sm text-gray-500">Visites</p>
                            </div>
                          )}
                          {service.sales && (
                            <div className="text-center">
                              <p className="text-lg font-semibold text-gray-900">{service.sales}</p>
                              <p className="text-sm text-gray-500">Ventes</p>
                            </div>
                          )}
                          {service.revenue && (
                            <div className="text-center">
                              <p className="text-lg font-semibold text-gray-900">{service.revenue.toLocaleString()} FCFA</p>
                              <p className="text-sm text-gray-500">Revenus</p>
                            </div>
                          )}
                          {service.reports && (
                            <div className="text-center">
                              <p className="text-lg font-semibold text-gray-900">{service.reports}</p>
                              <p className="text-sm text-gray-500">Rapports</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="space-y-6"
          >
            {/* Actions rapides */}
            <div className="card">
              <div className="card-body">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions rapides</h3>
                <div className="space-y-3">
                  {quickActions.map((action, index) => {
                    const Icon = action.icon
                    return (
                      <Link
                        key={index}
                        to={action.link}
                        className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
                      >
                        <div className={`w-8 h-8 ${action.color} rounded-lg flex items-center justify-center`}>
                          <Icon className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 text-sm">{action.name}</p>
                          <p className="text-xs text-gray-500">{action.description}</p>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Activités récentes */}
            <div className="card">
              <div className="card-body">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Activités récentes</h3>
                <div className="space-y-4">
                  {recentActivities.map((activity) => {
                    const Icon = activity.icon
                    return (
                      <div key={activity.id} className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <Icon className="w-4 h-4 text-gray-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-900">{activity.message}</p>
                          <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <Link
                  to="/activities"
                  className="block text-center text-sm text-primary-600 hover:text-primary-500 mt-4 pt-4 border-t border-gray-200"
                >
                  Voir toutes les activités
                </Link>
              </div>
            </div>

            {/* Prochains événements */}
            <div className="card">
              <div className="card-body">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Prochains événements</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-blue-900">Renouvellement d'abonnement</p>
                      <p className="text-xs text-blue-700">Dans 5 jours</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                    <FileText className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-green-900">Rapport mensuel disponible</p>
                      <p className="text-xs text-green-700">Prêt à télécharger</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard