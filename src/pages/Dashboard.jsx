import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useServices, useServiceStats } from '../contexts/ServicesContext'
import { migrateUserPack } from '../lib/services'
import { supabase } from '../lib/supabase'
import {
  Eye,
  Users,
  TrendingUp,
  DollarSign,
  Bell,
  Settings,
  Crown,
  Shield,
  Calendar,
  Phone,
  Mail,
  MessageSquare,
  Plus,
  ExternalLink
} from 'lucide-react'

const Dashboard = () => {
  const { user, isAdmin, isSuperAdmin } = useAuth()
  const { userServices, allServicesWithStatus, userPack, loading: servicesLoading, error: servicesError, refreshUserServices } = useServices();
  const serviceStats = useServiceStats()
  const navigate = useNavigate()
  const [showPackManagement, setShowPackManagement] = useState(false)
  const [migrationLoading, setMigrationLoading] = useState(false)
  const [migrationError, setMigrationError] = useState('')
  const [retryCount, setRetryCount] = useState(0)

  // Rediriger automatiquement les admins vers leur dashboard spécialisé
  useEffect(() => {
    if (user && (isAdmin() || isSuperAdmin())) {
      navigate('/admin', { replace: true })
    }
  }, [user, isAdmin, isSuperAdmin, navigate])
  
  // Utiliser les statistiques réelles des services
  const stats = {
    totalVisits: serviceStats.totalVisits,
    totalUsers: serviceStats.totalUsers || 1247,
    conversionRate: serviceStats.conversionRate || 3.2,
    revenue: serviceStats.totalRevenue
  }

  // Utiliser les données réelles du pack et des services
  const currentPack = userPack ? {
    id: userPack.packs?.id || 0,
    name: userPack.packs?.name || 'Aucun pack',
    price: userPack.packs?.price?.toString() || '0',
    priceUnit: 'FCFA/mois',
    nextBilling: userPack.next_billing_date || 'Non défini',
    services: userServices
  } : null

  // Mapping des IDs de la base de données vers les IDs du Dashboard
  const packIdMapping = {
    '0a85e74a-4aec-480a-8af1-7b57391a80d2': 0, // Pack Découverte
    '209a0b0e-7888-41a3-9cd1-45907705261a': 1, // Pack Visibilité
    'e444b213-6a11-4793-b30d-e55a8fbf3403': 2, // Pack Professionnel
    '9e026c33-1c2a-49aa-8cc2-e2c9d392c303': 3  // Pack Premium
  }

  // Tous les packs disponibles
  const allPacks = [
    {
      id: 0,
      dbId: '0a85e74a-4aec-480a-8af1-7b57391a80d2',
      name: "Pack Découverte",
      price: "Gratuit",
      priceUnit: "",
      description: "Nouveaux artisans",
      features: [
        "Mini-site",
        "Mini-boutique",
        "Espace personnel",
        "Fiche visible",
        "Accès Mangoo Connect+"
      ]
    },
    {
      id: 1,
      dbId: '209a0b0e-7888-41a3-9cd1-45907705261a',
      name: "Pack Visibilité",
      price: "5 000",
      priceUnit: "FCFA/mois",
      description: "Artisans en phase de croissance",
      popular: true,
      features: [
        "Pack découverte",
        "Référencement Mangoo Market",
        "Showroom360 simplifié"
      ]
    },
    {
      id: 2,
      dbId: 'e444b213-6a11-4793-b30d-e55a8fbf3403',
      name: "Pack Professionnel",
      price: "10 000",
      priceUnit: "FCFA/mois",
      description: "Artisans organisés, organisations, PME",
      features: [
        "Pack Visibilité",
        "Mangoo Express",
        "Référencement pro"
      ]
    },
    {
      id: 3,
      dbId: '9e026c33-1c2a-49aa-8cc2-e2c9d392c303',
      name: "Pack Premium",
      price: "15 000",
      priceUnit: "FCFA/mois",
      description: "PME structurées et entrepreneurs avancés",
      features: [
        "Pack Professionnel",
        "CRM/ERP simplifié",
        "Showroom360 complet",
        "Support personnalisé"
      ]
    }
  ]

  // Fonction pour déterminer le type de migration et filtrer les packs disponibles
  const getAvailablePacksForMigration = () => {
    // Vérifier si currentPack existe avant d'accéder à ses propriétés
    if (!currentPack) {
      return allPacks.filter(pack => pack.id !== 0) // Retourner tous les packs sauf le gratuit par défaut
    }
    
    // Convertir l'ID de la base de données en ID du Dashboard pour la comparaison
    const currentPackDbId = currentPack.id // ID de la base de données (UUID)
    const currentPackDashboardId = packIdMapping[currentPackDbId] ?? -1 // ID du Dashboard (numérique)
    
    return allPacks
      .filter(pack => pack.id !== currentPackDashboardId) // Exclure le pack actuel
      .map(pack => {
        let type = 'upgrade'
        let canMigrate = true
        let migrationMessage = ''
        
        if (pack.id < currentPackDashboardId) {
          type = 'downgrade'
          // Empêcher le downgrade depuis le pack gratuit (id: 0)
          if (currentPackDashboardId === 0) {
            canMigrate = false
            migrationMessage = 'Aucune rétrogradation possible depuis le pack gratuit'
          }
        }
        
        return {
          ...pack,
          type,
          canMigrate,
          migrationMessage
        }
      })
      .filter(pack => pack.canMigrate) // Filtrer les packs non disponibles
  }

  const availablePacksForMigration = getAvailablePacksForMigration()

  // Fonction pour gérer la migration de pack
  // Dans la fonction handlePackMigration, remplacer par :
  const handlePackMigration = async (newPackDbId) => {
    setMigrationLoading(true)
    setMigrationError(null)
    
    try {
      const targetPack = allPacks.find(p => p.dbId === newPackDbId)
      if (!targetPack) {
        throw new Error('Pack cible non trouvé')
      }
  
      const changeType = currentPack.id === 0 ? 'new' : 
                    targetPack.id > currentPack.id ? 'upgrade' : 'downgrade'
  
      // Utiliser le nouveau composant PaymentButton ou la logique de paiement
      const { data, error } = await supabase.functions.invoke('change-pack-with-payment', {
        body: {
          newPackId: newPackDbId,
          changeType,
          successUrl: `${window.location.origin}/dashboard?success=true&pack=${newPackDbId}`,
          cancelUrl: `${window.location.origin}/dashboard?canceled=true`,
        },
      })
  
      if (error) throw error
  
      if (data.direct_migration) {
        // Migration directe réussie (downgrade vers gratuit)
        window.location.reload()
      } else if (data.url) {
        // Redirection vers Stripe
        window.location.href = data.url
      }
    } catch (error) {
      setMigrationError(error.message)
    } finally {
      setMigrationLoading(false)
    }
  }

  // Auto-retry logic to reload data if no pack is detected after a delay
   useEffect(() => {
    if (!servicesLoading && !userPack && retryCount < 3) {
      const timer = setTimeout(() => {
        console.log(`Retry attempt ${retryCount + 1}: Refreshing user services...`)
        refreshUserServices()
        setRetryCount(prev => prev + 1)
      }, 2000 + (retryCount * 1000)) // Increasing delay: 2s, 3s, 4s
      
      return () => clearTimeout(timer)
    }
  }, [servicesLoading, userPack, retryCount, refreshUserServices])

  // Reset retry count when pack is successfully loaded
  useEffect(() => {
    if (userPack) {
      setRetryCount(0)
    }
  }, [userPack])

  // Removed automatic stats update as it requires specific parameters

  // Gestion des erreurs de chargement
  if (servicesError) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20">
        <div className="container py-8">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-800 dark:text-red-200">
              Erreur lors du chargement des services: {servicesError}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <motion.div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20">
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
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Bonjour, {user?.user_metadata?.firstName || user?.email} ✨
                </h1>
                {isSuperAdmin() && (
                  <div className="flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    <Crown className="w-4 h-4" />
                    <span>Super Admin</span>
                  </div>
                )}
                {isAdmin() && !isSuperAdmin() && (
                  <div className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    <Shield className="w-4 h-4" />
                    <span>Administrateur</span>
                  </div>
                )}
              </div>
              <p className="text-gray-600 dark:text-gray-300">
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
              <div className="mt-4 flex items-center">
                <span className="text-green-500 text-sm font-medium">+12%</span>
                <span className="text-gray-500 ml-1">ce mois</span>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Utilisateurs</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.totalUsers.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <span className="text-green-500 text-sm font-medium">+8%</span>
                <span className="text-gray-500 ml-1">ce mois</span>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Taux de conversion</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.conversionRate}%</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <span className="text-green-500 text-sm font-medium">+2.1%</span>
                <span className="text-gray-500 ml-1">ce mois</span>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Revenus</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.revenue.toLocaleString()} FCFA</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <span className="text-green-500 text-sm font-medium">+15%</span>
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
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Mon Pack Actuel</h2>
                  <button 
                    onClick={() => setShowPackManagement(true)}
                    className="btn-primary text-sm"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Gérer mon pack
                  </button>
                </div>
                
                {currentPack ? (
                  <div className="space-y-6">
                    {/* Informations du pack actuel */}
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{currentPack.name}</h3>
                          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            {currentPack.price} {currentPack.priceUnit}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500 dark:text-gray-400">Prochaine facturation</p>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{currentPack.nextBilling}</p>
                        </div>
                      </div>
                    </div>

                    {/* Services du pack */}
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Tous vos services</h4>
                      {servicesLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {[...Array(3)].map((_, i) => (
                            <div key={i} className="animate-pulse border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2 mb-3"></div>
                              <div className="grid grid-cols-3 gap-4">
                                <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded"></div>
                                <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded"></div>
                                <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded"></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : allServicesWithStatus.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {allServicesWithStatus
                            .sort((a, b) => {
                              const aInactive = !a.isAvailableInPack;
                              const bInactive = !b.isAvailableInPack;
                              if (aInactive && !bInactive) return 1;
                              if (!aInactive && bInactive) return -1;
                              return 0;
                            })
                            .map((service) => {
                            const isInactive = !service.isAvailableInPack;
                            return (
                              <div 
                              key={service.id} 
                              className={`border rounded-lg p-4 transition-all duration-200 ${
                                isInactive 
                                  ? 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 opacity-60 cursor-pointer hover:opacity-80' 
                                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                              }`}
                              onClick={isInactive ? () => setShowPackManagement(true) : undefined}
                            >
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center space-x-2">
                                  <h5 className={`font-medium ${
                                    isInactive 
                                      ? 'text-gray-500 dark:text-gray-400' 
                                      : 'text-gray-900 dark:text-gray-100'
                                  }`}>
                                    {service.service?.name || 'Service'}
                                  </h5>

                                </div>
                                <div className="flex items-center space-x-2">
                                  <div className={`w-2 h-2 rounded-full ${
                                    isInactive ? 'bg-gray-400' :
                                    service.status === 'active' ? 'bg-green-500' :
                                    service.status === 'setup_required' ? 'bg-yellow-500' : 'bg-gray-500'
                                  }`}></div>
                                  <span className={`text-sm ${
                                    isInactive ? 'text-gray-500 dark:text-gray-400' :
                                    service.status === 'active' ? 'text-green-600 dark:text-green-400' :
                                    service.status === 'setup_required' ? 'text-yellow-600 dark:text-yellow-400' :
                                    'text-gray-600 dark:text-gray-400'
                                  }`}>
                                    {isInactive ? 'Non inclus dans votre pack' :
                                     service.status === 'active' ? 'Actif' :
                                     service.status === 'setup_required' ? 'Configuration requise' : 'Inactif'}
                                  </span>
                                </div>
                              </div>
                              
                              {!isInactive && (
                                <div className="grid grid-cols-3 gap-4 text-sm">
                                  <div className="text-center">
                                    <p className="text-gray-500 dark:text-gray-400">Visites</p>
                                    <p className="font-medium text-gray-900 dark:text-gray-100">{service.visits_count || 0}</p>
                                  </div>
                                  <div className="text-center">
                                    <p className="text-gray-500 dark:text-gray-400">Ventes</p>
                                    <p className="font-medium text-gray-900 dark:text-gray-100">{service.sales_count || 0}</p>
                                  </div>
                                  <div className="text-center">
                                    <p className="text-gray-500 dark:text-gray-400">Revenus</p>
                                    <p className="font-medium text-gray-900 dark:text-gray-100">{(service.revenue_amount || 0).toLocaleString()} FCFA</p>
                                  </div>
                                </div>
                              )}
                              
                              {isInactive && (
                                <div className="text-center py-4">
                                  <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">
                                    Ce service n'est pas inclus dans votre pack actuel
                                  </p>
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setShowPackManagement(true);
                                    }}
                                    className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
                                  >
                                    Changer de pack pour l'activer
                                  </button>
                                </div>
                              )}
                              
                              {!isInactive && service.service_url && (
                                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                                  <a href={service.service_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 text-sm flex items-center">
                                    <ExternalLink className="w-4 h-4 mr-1" />
                                    Voir le service
                                  </a>
                                </div>
                              )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-gray-500 dark:text-gray-400">
                            {currentPack ? 
                              'Aucun service actif pour le moment.' :
                              'Aucun pack actif. Contactez l\'administrateur pour activer vos services.'
                            }
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p className="text-blue-800 dark:text-blue-200 mb-2">
                        {retryCount > 0 ? 'Tentative de rechargement...' : 'Chargement de votre pack...'}
                      </p>
                      <p className="text-sm text-blue-600 dark:text-blue-400 mb-4">
                        {retryCount > 0 
                          ? `Tentative ${retryCount}/3 - Configuration de votre pack en cours...`
                          : 'Initialisation de vos services...'}
                      </p>
                      <button 
                        onClick={() => {
                          setRetryCount(0);
                          refreshUserServices();
                        }}
                        className="btn-outline text-sm px-4 py-2"
                        disabled={servicesLoading}
                      >
                        Actualiser maintenant
                      </button>
                    </div>
                  </div>
                )}
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
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Actions rapides</h3>
                <div className="space-y-3">
                  <button className="w-full btn-outline text-left flex items-center justify-between">
                    <span className="flex items-center">
                      <Plus className="w-4 h-4 mr-2" />
                      Nouveau projet
                    </span>
                    <ExternalLink className="w-4 h-4" />
                  </button>
                  <button className="w-full btn-outline text-left flex items-center justify-between">
                    <span className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      Planifier une réunion
                    </span>
                    <ExternalLink className="w-4 h-4" />
                  </button>
                  <button className="w-full btn-outline text-left flex items-center justify-between">
                    <span className="flex items-center">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Support technique
                    </span>
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Informations de contact */}
            <div className="card">
              <div className="card-body">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Besoin d'aide ?</h3>
                <div className="space-y-3">
                  <a 
                    href="mailto:contact@mangootech.com" 
                    className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                  >
                    <Mail className="w-4 h-4" />
                    <span>contact@mangootech.com</span>
                  </a>
                  <a 
                    href="tel:+33962014080" 
                    className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                  >
                    <Phone className="w-4 h-4" />
                    <span>+33 962014080</span>
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
        
        {/* Modal de gestion des packs */}
        {showPackManagement && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Gestion de Pack</h2>
                <button 
                  onClick={() => setShowPackManagement(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <Plus className="w-6 h-6 transform rotate-45" />
                </button>
              </div>
              
              {/* Pack actuel */}
              {currentPack && (
                <div className="mb-8">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Votre pack actuel</h3>
                  <div className="border-2 border-blue-200 dark:border-blue-700 rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{currentPack.name}</h4>
                        <p className="text-lg font-medium text-blue-600 dark:text-blue-400">
                          {currentPack.price} {currentPack.priceUnit}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Prochaine facturation</p>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{currentPack.nextBilling}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Affichage des erreurs de migration */}
              {migrationError && (
                <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <p className="text-red-800 dark:text-red-200">{migrationError}</p>
                </div>
              )}
              
              {/* Options de migration */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Options de migration disponibles</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                  {currentPack.id === 0 
                    ? "Vous pouvez uniquement évoluer vers un pack supérieur depuis le pack gratuit."
                    : "Vous pouvez évoluer vers un pack supérieur ou rétrograder vers un pack inférieur."}
                </p>
                
                {availablePacksForMigration.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {availablePacksForMigration.map((pack) => (
                      <div key={pack.id} className={`border rounded-lg p-4 hover:border-gray-300 dark:hover:border-gray-600 transition-colors relative flex flex-col h-full ${
                        pack.popular ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/10' : 'border-gray-200 dark:border-gray-700'
                      }`}>
                        {pack.popular && (
                          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                            <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                              POPULAIRE
                            </span>
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{pack.name}</h4>
                          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                            pack.type === 'upgrade' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                            'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
                          }`}>
                            {pack.type === 'upgrade' ? 'Évolution' : 'Rétrogradation'}
                          </div>
                        </div>
                        
                        <p className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                          {pack.price} {pack.priceUnit}
                        </p>
                        
                        {pack.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                            {pack.description}
                          </p>
                        )}
                        
                        {/* Affichage du changement de prix */}
                        {pack.type === 'upgrade' && currentPack.price !== "Gratuit" && (
                          <div className="mb-3 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                            <p className="text-xs text-green-700 dark:text-green-400">
                              +{parseInt(pack.price.replace(/\s/g, '')) - parseInt(currentPack.price.replace(/\s/g, ''))} FCFA/mois
                            </p>
                          </div>
                        )}
                        
                        {pack.type === 'downgrade' && pack.price !== "Gratuit" && (
                          <div className="mb-3 p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                            <p className="text-xs text-orange-700 dark:text-orange-400">
                              -{parseInt(currentPack.price.replace(/\s/g, '')) - parseInt(pack.price.replace(/\s/g, ''))} FCFA/mois d'économie
                            </p>
                          </div>
                        )}
                        
                        <div className="mb-4">
                          <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Fonctionnalités:</h5>
                          <div className="space-y-1">
                            {pack.features.map((feature, index) => (
                              <div key={index} className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></div>
                                {feature}
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <button 
                          onClick={() => handlePackMigration(pack.dbId)}
                          disabled={migrationLoading}
                          className={`w-full py-2 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-auto ${
                            pack.id === 0 
                              ? 'bg-gray-600 hover:bg-gray-700 text-white'
                              : pack.type === 'upgrade' 
                              ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                              : 'bg-orange-600 hover:bg-orange-700 text-white'
                          }`}>
                          {migrationLoading ? (
                            <div className="flex items-center justify-center">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Migration en cours...
                            </div>
                          ) : (
                            pack.id === 0 
                              ? 'Passer au gratuit' 
                              : pack.type === 'upgrade' 
                              ? 'Évoluer vers ce pack' 
                              : 'Rétrograder vers ce pack'
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">
                      Aucune option de migration disponible pour le moment.
                    </p>
                  </div>
                )}
              </div>
              
              {/* Actions */}
              <div className="mt-8 flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
                <button className="text-red-600 hover:text-red-700 font-medium">
                  Annuler mon abonnement
                </button>
                <div className="space-x-3">
                  <button 
                    onClick={() => setShowPackManagement(false)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Fermer
                  </button>
                  <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
                    Contacter le support
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default Dashboard