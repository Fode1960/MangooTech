import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { 
  Users, 
  ShoppingCart, 
  DollarSign, 
  TrendingUp, 
  Activity,
  Settings,
  UserCheck,
  AlertTriangle,
  BarChart3,
  Globe,
  MessageCircle,
  Package,
  Eye,
  Edit,
  Trash2,
  Plus,
  Search,
  Filter,
  Download,
  RefreshCw,
  CheckCircle
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import AdminUserManagement from '../../components/admin/AdminUserManagement'
import PackManagement from '../../components/admin/PackManagement'
import UserPackManagement from '../../components/admin/UserPackManagement'
import ServiceStatusManagement from '../../components/admin/ServiceStatusManagement'
import ServiceAnalytics from '../../components/admin/ServiceAnalytics'

const AdminDashboard = () => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalRevenue: 0,
    monthlyGrowth: 0,
    totalServices: 0,
    pendingApprovals: 0
  })
  const [users, setUsers] = useState([])
  const [packsData, setPacksData] = useState([])
  const [subscriptions, setSubscriptions] = useState([])
  const [searchTerm, setSearchTerm] = useState('')

  const menuItems = [
    {
      id: 'overview',
      name: t('admin.overview'),
      icon: BarChart3,
      description: t('admin.overviewDesc')
    },
    {
      id: 'users',
      name: t('admin.users'),
      icon: Users,
      description: t('admin.usersDesc')
    },
    {
      id: 'packs',
      name: 'Gestion des Packs',
      icon: Package,
      description: 'Créer et modifier les packs et services'
    },
    {
      id: 'user-packs',
      name: 'Attribution Packs',
      icon: UserCheck,
      description: 'Attribuer des packs aux utilisateurs'
    },
    {
      id: 'settings',
      name: t('admin.settings'),
      icon: Settings,
      description: t('admin.settingsDesc')
    }
  ]

  useEffect(() => {
    const loadAdminData = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Données simulées pour l'admin
        setStats({
          totalUsers: 10247,
          activeUsers: 8932,
          totalRevenue: 2450000,
          monthlyGrowth: 18.5,
          totalServices: 156,
          pendingApprovals: 23
        })
        
        setUsers([
          {
            id: 1,
            name: 'Amadou Diallo',
            email: 'amadou@example.com',
            type: 'professionnel',
            status: 'active',
            joinDate: '2024-01-15',
            lastLogin: '2024-01-20',
            services: 3,
            revenue: 125000
          },
          {
            id: 2,
            name: 'Fatima Kone',
            email: 'fatima@example.com',
            type: 'entreprise',
            status: 'active',
            joinDate: '2024-01-10',
            lastLogin: '2024-01-19',
            services: 5,
            revenue: 250000
          },
          {
            id: 3,
            name: 'Ibrahim Traore',
            email: 'ibrahim@example.com',
            type: 'particulier',
            status: 'pending',
            joinDate: '2024-01-18',
            lastLogin: null,
            services: 0,
            revenue: 0
          }
        ])
        
        // Données des packs et abonnements
        setPacksData([
          {
            id: 1,
            name: 'Pack Découverte',
            price: 0,
            subscribers: 3245,
            revenue: 0,
            growth: 15.2,
            status: 'active'
          },
          {
            id: 2,
            name: 'Pack Visibilité',
            price: 5000,
            subscribers: 1856,
            revenue: 9280000,
            growth: 22.8,
            status: 'active'
          },
          {
            id: 3,
            name: 'Pack Professionnel',
            price: 10000,
            subscribers: 892,
            revenue: 8920000,
            growth: 18.5,
            status: 'active'
          },
          {
            id: 4,
            name: 'Pack Premium',
            price: 15000,
            subscribers: 234,
            revenue: 3510000,
            growth: 12.3,
            status: 'active'
          }
        ])
        
        setSubscriptions([
          {
            id: 1,
            userId: 1,
            userName: 'Amadou Diallo',
            packName: 'Pack Visibilité',
            status: 'active',
            startDate: '2024-01-15',
            nextBilling: '2024-02-15',
            amount: 5000
          },
          {
            id: 2,
            userId: 2,
            userName: 'Fatima Kone',
            packName: 'Pack Premium',
            status: 'active',
            startDate: '2024-01-10',
            nextBilling: '2024-02-10',
            amount: 15000
          },
          {
            id: 3,
            userId: 3,
            userName: 'Ibrahim Traore',
            packName: 'Pack Professionnel',
            status: 'pending',
            startDate: '2024-01-18',
            nextBilling: '2024-02-18',
            amount: 10000
          }
        ])
      } catch (error) {
        console.error('Erreur lors du chargement des données admin:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadAdminData()
  }, [])

  if (isLoading) {
    return <LoadingSpinner variant="fullPage" />
  }

  const tabs = [
    { id: 'overview', label: 'Vue d\'ensemble', icon: BarChart3 },
    { id: 'users', label: 'Utilisateurs', icon: Users },
    { id: 'packs', label: 'Gestion des Packs', icon: Package },
    { id: 'user-packs', label: 'Attribution Packs', icon: UserCheck },
    { id: 'service-status', label: 'Statuts Services', icon: Activity },
    { id: 'service-analytics', label: 'Analytics Services', icon: TrendingUp },
    { id: 'analytics', label: 'Analytics Globales', icon: BarChart3 },
    { id: 'settings', label: 'Paramètres', icon: Settings }
  ]

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'suspended': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return 'Actif'
      case 'pending': return 'En attente'
      case 'suspended': return 'Suspendu'
      default: return 'Inconnu'
    }
  }

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen pt-24 bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Tableau de bord Administrateur
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Bienvenue, {user?.user_metadata?.firstName || 'Admin'}. Gérez votre plateforme Mangoo Tech.
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => {
                const IconComponent = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-primary text-primary'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <IconComponent className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'overview' && (
          <div className="space-y-8">

            {/* Enhanced Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="card hover:shadow-lg transition-shadow duration-300"
              >
                <div className="card-body">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Utilisateurs totaux</p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalUsers.toLocaleString()}</p>
                    </div>
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                      <Users className="w-7 h-7 text-white" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center text-sm">
                    <div className="flex items-center bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full">
                      <TrendingUp className="w-3 h-3 text-green-600 mr-1" />
                      <span className="text-green-600 font-medium text-xs">+12%</span>
                    </div>
                    <span className="text-gray-500 dark:text-gray-400 ml-2 text-xs">vs mois dernier</span>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="card hover:shadow-lg transition-shadow duration-300"
              >
                <div className="card-body">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Utilisateurs actifs</p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.activeUsers.toLocaleString()}</p>
                    </div>
                    <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                      <UserCheck className="w-7 h-7 text-white" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">{((stats.activeUsers / stats.totalUsers) * 100).toFixed(1)}% du total</span>
                      <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${(stats.activeUsers / stats.totalUsers) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="card hover:shadow-lg transition-shadow duration-300"
              >
                <div className="card-body">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Revenus mensuels</p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">{(stats.totalRevenue / 12).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} FCFA</p>
                    </div>
                    <div className="w-14 h-14 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                      <DollarSign className="w-7 h-7 text-white" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center text-sm">
                    <div className="flex items-center bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full">
                      <TrendingUp className="w-3 h-3 text-green-600 mr-1" />
                      <span className="text-green-600 font-medium text-xs">+{stats.monthlyGrowth}%</span>
                    </div>
                    <span className="text-gray-500 dark:text-gray-400 ml-2 text-xs">ce mois</span>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="card hover:shadow-lg transition-shadow duration-300"
              >
                <div className="card-body">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Actions requises</p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.pendingApprovals}</p>
                    </div>
                    <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg">
                      <AlertTriangle className="w-7 h-7 text-white" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <button 
                      onClick={() => setActiveTab('users')}
                      className="text-sm text-primary hover:text-primary-dark font-medium transition-colors duration-200 flex items-center"
                    >
                      Traiter maintenant
                      <TrendingUp className="w-3 h-3 ml-1" />
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Enhanced Dashboard Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Recent Activity */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="card hover:shadow-lg transition-shadow duration-300"
              >
                <div className="card-body">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Activités récentes</h3>
                    <button className="text-sm text-primary hover:text-primary-dark transition-colors">
                      Voir tout
                    </button>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <Users className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Nouvel utilisateur inscrit</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Amadou Diallo - Il y a 5 minutes</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <Package className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Pack souscrit</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Pack Premium - Il y a 12 minutes</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                      <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <AlertTriangle className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Demande d'approbation</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Service entreprise - Il y a 1 heure</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Performance Metrics */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="card hover:shadow-lg transition-shadow duration-300"
              >
                <div className="card-body">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Performances</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                          <Activity className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Taux de conversion</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Visiteurs → Clients</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900 dark:text-white">24.5%</p>
                        <p className="text-xs text-green-600">+2.1%</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
                          <Globe className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Satisfaction client</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Note moyenne</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900 dark:text-white">4.8/5</p>
                        <p className="text-xs text-green-600">+0.2</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-pink-500 rounded-lg flex items-center justify-center">
                          <MessageCircle className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Support tickets</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">En attente</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900 dark:text-white">12</p>
                        <p className="text-xs text-red-600">+3</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Top Packs */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="card hover:shadow-lg transition-shadow duration-300"
              >
                <div className="card-body">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Packs les plus rentables</h3>
                    <button 
                      onClick={() => setActiveTab('packs')}
                      className="text-sm text-primary hover:text-primary-dark transition-colors"
                    >
                      Gérer
                    </button>
                  </div>
                  <div className="space-y-3">
                    {packsData.slice(1, 4).map((pack, index) => (
                      <div key={pack.id} className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-700/50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm ${
                            index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-500'
                          }`}>
                            {index + 1}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{pack.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{pack.subscribers} abonnés</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-gray-900 dark:text-white">
                            {(pack.revenue / 1000000).toFixed(1)}M FCFA
                          </p>
                          <div className="flex items-center text-xs">
                            <TrendingUp className="w-3 h-3 text-green-500 mr-1" />
                            <span className="text-green-600 font-medium">+{pack.growth}%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Advanced Analytics Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Revenue Chart */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.7 }}
                className="card hover:shadow-lg transition-shadow duration-300"
              >
                <div className="card-body">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Évolution des revenus</h3>
                    <div className="flex items-center space-x-2">
                      <select className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1 bg-white dark:bg-gray-800">
                        <option>7 derniers jours</option>
                        <option>30 derniers jours</option>
                        <option>3 derniers mois</option>
                      </select>
                    </div>
                  </div>
                  <div className="h-64 flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg">
                    <div className="text-center">
                      <BarChart3 className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                      <p className="text-gray-600 dark:text-gray-400">Graphique des revenus</p>
                      <p className="text-sm text-gray-500 dark:text-gray-500">Croissance de +{stats.monthlyGrowth}% ce mois</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* User Growth Chart */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.8 }}
                className="card hover:shadow-lg transition-shadow duration-300"
              >
                <div className="card-body">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Croissance utilisateurs</h3>
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center bg-green-100 dark:bg-green-900/30 px-3 py-1 rounded-full">
                        <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                        <span className="text-green-600 font-medium text-sm">+12% ce mois</span>
                      </div>
                    </div>
                  </div>
                  <div className="h-64 flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg">
                    <div className="text-center">
                      <Users className="w-16 h-16 text-green-500 mx-auto mb-4" />
                      <p className="text-gray-600 dark:text-gray-400">Graphique de croissance</p>
                      <p className="text-sm text-gray-500 dark:text-gray-500">{stats.totalUsers.toLocaleString()} utilisateurs au total</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.9 }}
              className="card hover:shadow-lg transition-shadow duration-300"
            >
              <div className="card-body">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">Actions rapides</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <button 
                    onClick={() => setActiveTab('users')}
                    className="flex flex-col items-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors duration-200"
                  >
                    <Users className="w-8 h-8 text-blue-600 mb-2" />
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Gérer utilisateurs</span>
                  </button>
                  <button 
                    onClick={() => setActiveTab('packs')}
                    className="flex flex-col items-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors duration-200"
                  >
                    <Package className="w-8 h-8 text-green-600 mb-2" />
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Créer pack</span>
                  </button>
                  <button 
                    onClick={() => setActiveTab('service-status')}
                    className="flex flex-col items-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors duration-200"
                  >
                    <Activity className="w-8 h-8 text-yellow-600 mb-2" />
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Statut services</span>
                  </button>
                  <button 
                    onClick={() => setActiveTab('service-analytics')}
                    className="flex flex-col items-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors duration-200"
                  >
                    <BarChart3 className="w-8 h-8 text-purple-600 mb-2" />
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Analytics</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {activeTab === 'users' && (
          <AdminUserManagement />
        )}

        {activeTab === 'packs' && (
          <PackManagement />
        )}

        {activeTab === 'user-packs' && (
          <UserPackManagement />
        )}

        {activeTab === 'service-status' && (
          <ServiceStatusManagement />
        )}

        {activeTab === 'service-analytics' && (
          <ServiceAnalytics />
        )}

        {/* Ancienne gestion des Packs et Abonnements */}
        {activeTab === 'old-packs' && (
          <div className="space-y-8">
            {/* Stats des packs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card"
              >
                <div className="card-body">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total abonnés</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {packsData.reduce((sum, pack) => sum + pack.subscribers, 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="card"
              >
                <div className="card-body">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Revenus packs</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {packsData.reduce((sum, pack) => sum + pack.revenue, 0).toLocaleString()} FCFA
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="card"
              >
                <div className="card-body">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Abonnements actifs</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {subscriptions.filter(sub => sub.status === 'active').length}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Package className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="card"
              >
                <div className="card-body">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">En attente</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {subscriptions.filter(sub => sub.status === 'pending').length}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                      <AlertTriangle className="w-6 h-6 text-orange-600" />
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
            
            {/* Liste des packs */}
            <div className="card">
              <div className="card-body">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Gestion des Packs</h3>
                  <button className="btn-primary text-sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Nouveau pack
                  </button>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Pack
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Prix
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Abonnés
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Revenus
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Croissance
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                      {packsData.map((pack) => (
                        <tr key={pack.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                                <Package className="w-5 h-5 text-blue-600" />
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{pack.name}</div>
                                <div className={`text-xs px-2 py-1 rounded-full inline-block ${
                                  pack.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {pack.status === 'active' ? 'Actif' : 'Inactif'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            {pack.price === 0 ? 'Gratuit' : `${pack.price.toLocaleString()} FCFA/mois`}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            {pack.subscribers.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            {pack.revenue.toLocaleString()} FCFA
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-green-600 font-medium">+{pack.growth}%</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              <button className="text-blue-600 hover:text-blue-700">
                                <Eye className="w-4 h-4" />
                              </button>
                              <button className="text-gray-600 hover:text-gray-700">
                                <Edit className="w-4 h-4" />
                              </button>
                              <button className="text-red-600 hover:text-red-700">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            
            {/* Liste des abonnements */}
            <div className="card">
              <div className="card-body">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">Abonnements Récents</h3>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Utilisateur
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Pack
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Statut
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Date début
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Prochaine facturation
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Montant
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                      {subscriptions.map((subscription) => (
                        <tr key={subscription.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{subscription.userName}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            {subscription.packName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              subscription.status === 'active' ? 'bg-green-100 text-green-800' :
                              subscription.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {subscription.status === 'active' ? 'Actif' :
                               subscription.status === 'pending' ? 'En attente' : 'Inactif'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            {new Date(subscription.startDate).toLocaleDateString('fr-FR')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            {new Date(subscription.nextBilling).toLocaleDateString('fr-FR')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            {subscription.amount.toLocaleString()} FCFA
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              <button className="text-blue-600 hover:text-blue-700">
                                <Eye className="w-4 h-4" />
                              </button>
                              <button className="text-gray-600 hover:text-gray-700">
                                <Edit className="w-4 h-4" />
                              </button>
                              {subscription.status === 'pending' && (
                                <button className="text-green-600 hover:text-green-700">
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="text-center py-12">
            <BarChart3 className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Analytics avancées</h3>
            <p className="text-gray-500 dark:text-gray-400">Cette section sera bientôt disponible.</p>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="text-center py-12">
            <Settings className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Paramètres système</h3>
            <p className="text-gray-500 dark:text-gray-400">Cette section sera bientôt disponible.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminDashboard