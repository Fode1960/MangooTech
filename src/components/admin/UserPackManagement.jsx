// Composant d'administration pour la gestion des packs utilisateurs

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Edit, 
  Save, 
  X, 
  User, 
  Package, 
  Calendar,
  Users,
  TrendingUp
} from 'lucide-react';
import {
  getAllPacks,
  getUserPack,
  assignPackToUser,
  getUserServices
} from '../../lib/services.js';

const UserPackManagement = () => {
  const [users, setUsers] = useState([]);
  const [packs, setPacks] = useState([]);
  const [userPacks, setUserPacks] = useState({});
  const [userServices, setUserServices] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPackFilter, setSelectedPackFilter] = useState('all');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedPack, setSelectedPack] = useState('');

  // Charger les données
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Charger les packs
      const packsData = await getAllPacks();
      setPacks(packsData);
      
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
      
      // Charger les packs et services pour chaque utilisateur
      const userPacksData = {};
      const userServicesData = {};
      
      for (const user of mockUsers) {
        try {
          const userPack = await getUserPack(user.id);
          if (userPack) {
            userPacksData[user.id] = userPack;
          }
          
          const services = await getUserServices(user.id);
          userServicesData[user.id] = services;
        } catch (err) {
          console.warn(`Erreur lors du chargement des données pour l'utilisateur ${user.id}:`, err);
        }
      }
      
      setUserPacks(userPacksData);
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

  // Filtrer les utilisateurs
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (selectedPackFilter === 'all') return matchesSearch;
    
    const userPack = userPacks[user.id];
    return matchesSearch && userPack && userPack.pack_id === selectedPackFilter;
  });

  // Assigner un pack à un utilisateur
  const handleAssignPack = async () => {
    if (!selectedUser || !selectedPack) return;
    
    try {
      await assignPackToUser(selectedUser.id, selectedPack);
      setShowAssignModal(false);
      setSelectedUser(null);
      setSelectedPack('');
      await loadData();
    } catch (err) {
      console.error('Erreur lors de l\'attribution du pack:', err);
      setError('Impossible d\'attribuer le pack');
    }
  };

  const openAssignModal = (user) => {
    setSelectedUser(user);
    const currentPack = userPacks[user.id];
    setSelectedPack(currentPack ? currentPack.pack_id : '');
    setShowAssignModal(true);
  };

  const getPackName = (packId) => {
    const pack = packs.find(p => p.id === packId);
    return pack ? pack.name : 'Pack inconnu';
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
            Gestion des Packs Utilisateurs
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gérez l'attribution des packs aux utilisateurs
          </p>
        </div>
        
        {/* Statistiques rapides */}
        <div className="flex space-x-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center">
              <Users className="w-5 h-5 text-blue-600 mr-2" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total utilisateurs</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{users.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center">
              <Package className="w-5 h-5 text-green-600 mr-2" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Packs actifs</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {users.length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Messages d'erreur */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-2" />
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        </div>
      )}

      {/* Filtres et recherche */}
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
          
          {/* Filtre par pack */}
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={selectedPackFilter}
              onChange={(e) => setSelectedPackFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">Tous les packs</option>
              {packs.map(pack => (
                <option key={pack.id} value={pack.id}>{pack.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Liste des utilisateurs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Utilisateur
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Pack actuel
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Services actifs
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Dernière connexion
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredUsers.map((user) => {
                const userPack = userPacks[user.id];
                const services = userServices[user.id] || [];
                const activeServices = services.filter(s => s.status === 'active');
                
                return (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                            <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {user.full_name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {userPack ? (
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {getPackName(userPack.pack_id)}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Depuis {new Date(userPack.assigned_at).toLocaleDateString()}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="text-sm font-medium text-orange-600 dark:text-orange-400">
                            Pack Découverte (Gratuit)
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Pack par défaut
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {activeServices.length}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">
                          / {services.length}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {user.last_sign_in_at ? (
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {new Date(user.last_sign_in_at).toLocaleDateString()}
                        </div>
                      ) : (
                        'Jamais connecté'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => openAssignModal(user)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 flex items-center space-x-1"
                      >
                        <Edit className="w-4 h-4" />
                        <span>{userPack ? 'Modifier' : 'Changer'}</span>
                      </button>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {filteredUsers.length === 0 && (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              Aucun utilisateur trouvé
            </p>
          </div>
        )}
      </div>

      {/* Modal d'attribution de pack */}
      {showAssignModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  {userPacks[selectedUser?.id] ? 'Modifier le pack' : 'Changer de pack'}
                </h3>
                <button
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedUser(null);
                    setSelectedPack('');
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Utilisateur
                  </label>
                  <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <User className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {selectedUser.full_name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {selectedUser.email}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nouveau pack
                  </label>
                  <select
                    value={selectedPack}
                    onChange={(e) => setSelectedPack(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Sélectionner un nouveau pack</option>
                    {packs.map(pack => (
                      <option key={pack.id} value={pack.id}>
                        {pack.name} - {pack.price.toLocaleString()} {pack.currency}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedPack && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                    <div className="flex items-center mb-2">
                      <Package className="w-4 h-4 text-blue-600 dark:text-blue-400 mr-2" />
                      <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                        Services inclus:
                      </span>
                    </div>
                    <div className="text-sm text-blue-800 dark:text-blue-200">
                      {packs.find(p => p.id === selectedPack)?.services?.map(service => (
                        <div key={service.id} className="flex items-center">
                          <Check className="w-3 h-3 mr-1" />
                          {service.name}
                        </div>
                      )) || 'Aucun service configuré'}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex space-x-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-600">
                <button
                  onClick={handleAssignPack}
                  disabled={!selectedPack}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>{userPacks[selectedUser?.id] ? 'Modifier' : 'Attribuer'}</span>
                </button>
                <button
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedUser(null);
                    setSelectedPack('');
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Annuler
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default UserPackManagement;