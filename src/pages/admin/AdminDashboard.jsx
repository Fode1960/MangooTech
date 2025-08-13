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
  RefreshCw
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import AdminUserManagement from '../../components/admin/AdminUserManagement'

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
  const [services, setServices] = useState([])
  const [searchTerm, setSearchTerm] = useState('')

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
        
        setServices([
          {
            id: 1,
            name: 'Mini-site Pro',
            type: 'mini-site',
            users: 1234,
            revenue: 450000,
            status: 'active',
            growth: 12.5
          },
          {
            id: 2,
            name: 'Mini-boutique',
            type: 'e-commerce',
            users: 856,
            revenue: 680000,
            status: 'active',
            growth: 25.3
          },
          {
            id: 3,
            name: 'Mangoo Pay+',
            type: 'payment',
            users: 2341,
            revenue: 890000,
            status: 'active',
            growth: 18.7
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
    { id: 'services', label: 'Services', icon: Package },
    { id: 'analytics', label: 'Analytics', icon: Activity },
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
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="card"
              >
                <div className="card-body">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Utilisateurs totaux</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalUsers.toLocaleString()}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center text-sm">
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-green-600 font-medium">+12%</span>
                    <span className="text-gray-500 dark:text-gray-400 ml-1">ce mois</span>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="card"
              >
                <div className="card-body">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Utilisateurs actifs</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.activeUsers.toLocaleString()}</p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <UserCheck className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center text-sm">
                    <span className="text-gray-500 dark:text-gray-400">{((stats.activeUsers / stats.totalUsers) * 100).toFixed(1)}% du total</span>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="card"
              >
                <div className="card-body">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Revenus totaux</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalRevenue.toLocaleString()} FCFA</p>
                    </div>
                    <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-yellow-600" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center text-sm">
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-green-600 font-medium">+{stats.monthlyGrowth}%</span>
                    <span className="text-gray-500 dark:text-gray-400 ml-1">ce mois</span>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="card"
              >
                <div className="card-body">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">En attente d'approbation</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pendingApprovals}</p>
                    </div>
                    <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                      <AlertTriangle className="w-6 h-6 text-orange-600" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <button className="text-sm text-primary hover:text-primary-dark font-medium">
                      Voir les détails
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="card"
              >
                <div className="card-body">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Activité récente</h3>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Nouvel utilisateur inscrit</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Il y a 5 minutes</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <ShoppingCart className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Nouvelle commande</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Il y a 12 minutes</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                        <Package className="w-4 h-4 text-yellow-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Service activé</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Il y a 1 heure</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="card"
              >
                <div className="card-body">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Services populaires</h3>
                  <div className="space-y-4">
                    {services.map((service) => (
                      <div key={service.id} className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{service.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{service.users} utilisateurs</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {service.revenue.toLocaleString()} FCFA
                          </p>
                          <p className="text-xs text-green-600">+{service.growth}%</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <AdminUserManagement />
        )}

        {/* Autres onglets peuvent être ajoutés ici */}
        {activeTab === 'services' && (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Gestion des services</h3>
            <p className="text-gray-500 dark:text-gray-400">Cette section sera bientôt disponible.</p>
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