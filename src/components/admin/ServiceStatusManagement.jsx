// Composant pour la gestion des statuts de services utilisateur

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  User,
  Settings,
  Eye,
  Edit,
  RefreshCw,
  Calendar,
  Activity
} from 'lucide-react';
import {
  getUserServices,
  updateUserServiceStatus,
  getUserPack
} from '../../lib/services.js';

const ServiceStatusManagement = () => {
  const [users, setUsers] = useState([]);
  const [userServices, setUserServices] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [updatingService, setUpdatingService] = useState(null);

  // Charger les données
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Simuler des utilisateurs (à remplacer par une vraie API)
      const mockUsers = [
        {
          id: '1',
          email: 'user1@example.com',
          full_name: 'Jean Dupont',
          created_at: '2024-01-15T10:00:00Z',
          last_sign_in_at: '2024-01-20T14:30:00Z'
        },
        {
          id: '2',
          email: 'user2@example.com',
          full_name: 'Marie Martin',
          created_at: '2024-01-10T09:00:00Z',
          last_sign_in_at: '2024-01-19T16:45:00Z'
        },
        {
          id: '3',
          email: 'user3@example.com',
          full_name: 'Pierre Durand',
          created_at: '2024-01-05T11:00:00Z',
          last_sign_in_at: '2024-01-18T12:15:00Z'
        }
      ];
      setUsers(mockUsers);
      
      // Charger les services pour chaque utilisateur
      const userServicesData = {};
      
      for (const user of mockUsers) {
        try {
          const services = await getUserServices(user.id);
          userServicesData[user.id] = services;
        } catch (err) {
          console.warn(`Erreur lors du chargement des services pour l'utilisateur ${user.id}:`, err);
          userServicesData[user.id] = [];
        }
      }
      
      setUserServices(userServicesData);
    } catch (err) {
      console.error('Erreur lors du chargement des données:', err);
      setError('Impossible de charger les données');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Mettre à jour le statut d'un service
  const handleStatusUpdate = async (userId, serviceId, newStatus) => {
    try {
      setUpdatingService(serviceId);
      
      await updateUserServiceStatus(userId, serviceId, newStatus);
      
      // Mettre à jour l'état local
      setUserServices(prev => ({
        ...prev,
        [userId]: prev[userId].map(service => 
          service.service_id === serviceId 
            ? { ...service, status: newStatus, updated_at: new Date().toISOString() }
            : service
        )
      }));
      
    } catch (err) {
      console.error('Erreur lors de la mise à jour du statut:', err);
      setError('Impossible de mettre à jour le statut du service');
    } finally {
      setUpdatingService(null);
    }
  };

  // Filtrer les utilisateurs et services
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;
    
    if (statusFilter === 'all') return true;
    
    const services = userServices[user.id] || [];
    return services.some(service => service.status === statusFilter);
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'inactive':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'suspended':
        return <Pause className="w-4 h-4 text-orange-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
      case 'inactive':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
      case 'pending':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300';
      case 'suspended':
        return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return 'Actif';
      case 'inactive': return 'Inactif';
      case 'pending': return 'En attente';
      case 'suspended': return 'Suspendu';
      default: return 'Inconnu';
    }
  };

  const getStatusActions = (status) => {
    switch (status) {
      case 'active':
        return [
          { action: 'suspended', icon: Pause, label: 'Suspendre', color: 'text-orange-600' },
          { action: 'inactive', icon: XCircle, label: 'Désactiver', color: 'text-red-600' }
        ];
      case 'inactive':
        return [
          { action: 'active', icon: Play, label: 'Activer', color: 'text-green-600' },
          { action: 'pending', icon: Clock, label: 'En attente', color: 'text-yellow-600' }
        ];
      case 'pending':
        return [
          { action: 'active', icon: CheckCircle, label: 'Approuver', color: 'text-green-600' },
          { action: 'inactive', icon: XCircle, label: 'Rejeter', color: 'text-red-600' }
        ];
      case 'suspended':
        return [
          { action: 'active', icon: Play, label: 'Réactiver', color: 'text-green-600' },
          { action: 'inactive', icon: XCircle, label: 'Désactiver', color: 'text-red-600' }
        ];
      default:
        return [];
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Gestion des Statuts de Services
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gérez l'état des services pour chaque utilisateur
          </p>
        </div>
        
        <button
          onClick={loadData}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Actualiser</span>
        </button>
      </div>

      {/* Messages d'erreur */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-2" />
            <p className="text-red-800 dark:text-red-200">{error}</p>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Filtres */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
          {/* Recherche */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Rechercher un utilisateur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          
          {/* Filtre par statut */}
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">Tous les statuts</option>
              <option value="active">Actif</option>
              <option value="inactive">Inactif</option>
              <option value="pending">En attente</option>
              <option value="suspended">Suspendu</option>
            </select>
          </div>
        </div>
      </div>

      {/* Liste des utilisateurs et leurs services */}
      <div className="space-y-4">
        {filteredUsers.map((user) => {
          const services = userServices[user.id] || [];
          const filteredServices = statusFilter === 'all' 
            ? services 
            : services.filter(service => service.status === statusFilter);
          
          if (filteredServices.length === 0 && statusFilter !== 'all') {
            return null;
          }
          
          return (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              {/* En-tête utilisateur */}
              <div className="p-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {user.full_name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center space-x-1">
                      <Settings className="w-4 h-4" />
                      <span>{services.length} services</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Activity className="w-4 h-4" />
                      <span>{services.filter(s => s.status === 'active').length} actifs</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Services de l'utilisateur */}
              {services.length > 0 ? (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {(statusFilter === 'all' ? services : filteredServices).map((service) => (
                    <div key={service.service_id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            {getStatusIcon(service.status)}
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              {service.service?.name || 'Service inconnu'}
                            </h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {service.service?.description || 'Aucune description'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                          {/* Statut actuel */}
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            getStatusColor(service.status)
                          }`}>
                            {getStatusText(service.status)}
                          </span>
                          
                          {/* Date de mise à jour */}
                          <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center space-x-1">
                            <Calendar className="w-3 h-3" />
                            <span>
                              {new Date(service.updated_at).toLocaleDateString()}
                            </span>
                          </div>
                          
                          {/* Actions */}
                          <div className="flex items-center space-x-1">
                            {getStatusActions(service.status).map((action) => {
                              const ActionIcon = action.icon;
                              return (
                                <button
                                  key={action.action}
                                  onClick={() => handleStatusUpdate(user.id, service.service_id, action.action)}
                                  disabled={updatingService === service.service_id}
                                  className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${action.color}`}
                                  title={action.label}
                                >
                                  <ActionIcon className="w-4 h-4" />
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                      
                      {/* Statistiques du service */}
                      {service.visits !== undefined && (
                        <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                          <div className="text-center">
                            <div className="font-medium text-gray-900 dark:text-white">
                              {service.visits?.toLocaleString() || 0}
                            </div>
                            <div className="text-gray-500 dark:text-gray-400">Visites</div>
                          </div>
                          <div className="text-center">
                            <div className="font-medium text-gray-900 dark:text-white">
                              {service.sales?.toLocaleString() || 0}
                            </div>
                            <div className="text-gray-500 dark:text-gray-400">Ventes</div>
                          </div>
                          <div className="text-center">
                            <div className="font-medium text-gray-900 dark:text-white">
                              {service.revenue?.toLocaleString() || 0} FCFA
                            </div>
                            <div className="text-gray-500 dark:text-gray-400">Revenus</div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    Aucun service attribué à cet utilisateur
                  </p>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
      
      {filteredUsers.length === 0 && (
        <div className="text-center py-12">
          <User className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Aucun utilisateur trouvé
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Essayez de modifier vos critères de recherche
          </p>
        </div>
      )}
    </div>
  );
};

export default ServiceStatusManagement;