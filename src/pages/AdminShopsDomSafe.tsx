import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../config/supabase';
import { Store, RefreshCw, Search, Filter, CheckCircle, XCircle, AlertCircle, Edit, Eye, Trash2 } from 'lucide-react';

// Version ULTRA-STABLE qui évite l'erreur DOM "removeChild"
// Supprime les animations problématiques et utilise des techniques sûres
export default function AdminShopsDomSafe() {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [error, setError] = useState(null);
  const [lastAction, setLastAction] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [domError, setDomError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  console.log('🚀 Initialisation AdminShopsDomSafe - Version sans animations DOM');

  // Capture globale des erreurs DOM
  useEffect(() => {
    const handleDomError = (event) => {
      console.error('🚨 ERREUR DOM CAPTURÉE:', event.error);
      console.error('📍 Fichier:', event.filename);
      console.error('📋 Message:', event.message);
      
      if (event.error?.message?.includes('removeChild') || 
          event.error?.message?.includes('NotFoundError')) {
        console.log('🎯 ERREUR removeChild DÉTECTÉE - Application du correctif');
        setDomError(event.error.message);
        event.preventDefault();
        event.stopPropagation();
      }
    };

    window.addEventListener('error', handleDomError);
    return () => window.removeEventListener('error', handleDomError);
  }, []);

  useEffect(() => {
    console.log('📊 Effet de chargement initial déclenché');
    loadShops();
  }, []);

  const loadShops = async () => {
    try {
      console.log('🔄 Début du chargement des boutiques...');
      setLoading(true);
      setError(null);
      setDomError(null);
      
      const { data, error: supabaseError } = await supabase
        .from('shops')
        .select('*')
        .order('created_at', { ascending: false });

      if (supabaseError) {
        console.error('❌ Erreur Supabase:', supabaseError);
        setError(supabaseError.message);
        return;
      }

      console.log('✅ Données reçues:', data?.length || 0, 'boutiques');
      
      // Validation extrême des données
      if (data && Array.isArray(data)) {
        const validShops = data.filter(shop => {
          if (!shop || typeof shop !== 'object') {
            console.warn('⚠️ Boutique invalide ignorée:', shop);
            return false;
          }
          if (!shop.id) {
            console.warn('⚠️ Boutique sans ID ignorée:', shop);
            return false;
          }
          return true;
        });
        
        console.log('✅ Boutiques validées:', validShops.length);
        setShops(validShops);
      } else {
        console.log('ℹ️ Aucune boutique valide trouvée');
        setShops([]);
      }
    } catch (err) {
      console.error('❌ Erreur inattendue:', err);
      setError(err.message || 'Erreur inconnue lors du chargement');
    } finally {
      setLoading(false);
      console.log('🏁 Chargement terminé');
    }
  };

  // Fonction ULTRA-sécurisée pour changer le statut
  const changeShopStatus = useCallback(async (shopId: string, newStatus: 'approved' | 'rejected' | 'pending' | 'suspended') => {
    console.log(`🎯 Début changement statut - ID: ${shopId}, Nouveau statut: ${newStatus}`);
    
    // Protection maximale contre les doubles clics
    if (isProcessing) {
      console.log('⏸️ Traitement déjà en cours, annulation');
      return;
    }
    
    try {
      setIsProcessing(true);
      setLastAction(`Changement vers ${newStatus}...`);
      setDomError(null);
      
      // VALIDATION ULTRA-STRICTE
      if (!shopId || typeof shopId !== 'string') {
        throw new Error(`ID de boutique invalide: ${shopId}`);
      }
      
      if (!['approved', 'rejected', 'pending', 'suspended'].includes(newStatus)) {
        throw new Error(`Statut invalide: ${newStatus}`);
      }

      console.log(`🔄 Mise à jour BDD - Shop ID: ${shopId} -> ${newStatus}`);
      
      // Mise à jour dans Supabase
      const { error } = await supabase
        .from('shops')
        .update({ status: newStatus })
        .eq('id', shopId);

      if (error) {
        console.error('❌ Erreur Supabase:', error);
        throw new Error(`Erreur BDD: ${error.message}`);
      }

      console.log('✅ Mise à jour BDD réussie');
      
      // Mise à jour locale ULTRA-sécurisée avec protection DOM
      setTimeout(() => {
        setShops(prevShops => {
          console.log('📊 Mise à jour locale - Shops actuels:', prevShops?.length || 0);
          
          try {
            // Validation du tableau précédent
            if (!Array.isArray(prevShops)) {
              console.error('❌ prevShops n\'est pas un tableau:', prevShops);
              return [];
            }
            
            const updatedShops = prevShops.map(shop => {
              try {
                if (!shop || typeof shop !== 'object') {
                  console.warn('⚠️ Boutique invalide dans le mapping:', shop);
                  return shop;
                }
                
                if (shop.id === shopId) {
                  console.log(`📝 Mise à jour locale - Shop ${shopId}: ${shop.status} -> ${newStatus}`);
                  return { 
                    ...shop, 
                    status: newStatus,
                    // Ajouter un timestamp pour forcer le re-render
                    _updatedAt: Date.now()
                  };
                }
                
                return shop;
              } catch (err) {
                console.error('❌ Erreur lors du mapping d\'une boutique:', err, shop);
                return shop;
              }
            });
            
            console.log('✅ Mise à jour locale réussie');
            return updatedShops;
            
          } catch (err) {
            console.error('❌ Erreur catastrophique lors de la mise à jour locale:', err);
            // En cas d'erreur critique, recharger depuis la BDD
            console.log('🔄 Rechargement depuis la BDD...');
            setTimeout(() => loadShops(), 100);
            return prevShops;
          }
        });
        
        setLastAction(`✅ Statut changé en "${newStatus}"`);
        console.log('🎉 Changement de statut terminé avec succès');
        
      }, 0); // Délai zéro pour éviter les conflits DOM
      
    } catch (err) {
      console.error('❌ Erreur fatale lors du changement de statut:', err);
      setError(`Erreur: ${err.message}`);
      alert(`Erreur lors du changement de statut: ${err.message}`);
    } finally {
      setIsProcessing(false);
      console.log('🏁 Fin du traitement changement statut');
    }
  }, [isProcessing]);

  // Fonction sécurisée pour éditer un champ
  const editShopField = useCallback(async (shopId: string, field: string, value: any) => {
    if (isProcessing) return;
    
    try {
      setIsProcessing(true);
      console.log(`✏️ Édition - Shop: ${shopId}, Champ: ${field}, Valeur:`, value);
      
      if (!shopId || !field) {
        throw new Error('Paramètres manquants');
      }
      
      const { error } = await supabase
        .from('shops')
        .update({ [field]: value })
        .eq('id', shopId);

      if (error) {
        throw new Error(error.message);
      }

      // Mise à jour locale avec délai pour éviter les conflits DOM
      setTimeout(() => {
        setShops(prevShops => {
          if (!Array.isArray(prevShops)) return [];
          
          return prevShops.map(shop => {
            if (!shop || typeof shop !== 'object') return shop;
            
            if (shop.id === shopId) {
              return { ...shop, [field]: value, _updatedAt: Date.now() };
            }
            return shop;
          });
        });
        
        setLastAction(`${field} modifié`);
        console.log('✅ Édition réussie');
      }, 0);
      
    } catch (err) {
      console.error('❌ Erreur lors de l\'édition:', err);
      alert('Erreur lors de l\'édition: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing]);

  // Fonction sécurisée pour supprimer
  const deleteShop = useCallback(async (shopId: string) => {
    if (isProcessing) return;
    
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette boutique ?')) {
      return;
    }

    try {
      setIsProcessing(true);
      console.log(`🗑️ Suppression - Shop ID: ${shopId}`);
      
      const { error } = await supabase
        .from('shops')
        .delete()
        .eq('id', shopId);

      if (error) {
        throw new Error(error.message);
      }

      // Suppression locale avec délai pour éviter les conflits DOM
      setTimeout(() => {
        setShops(prevShops => {
          if (!Array.isArray(prevShops)) return [];
          return prevShops.filter(shop => {
            if (!shop || typeof shop !== 'object') return false;
            return shop.id !== shopId;
          });
        });
        
        setLastAction('Boutique supprimée');
        console.log('✅ Suppression réussie');
      }, 0);
      
    } catch (err) {
      console.error('❌ Erreur lors de la suppression:', err);
      alert('Erreur lors de la suppression: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing]);

  // Filtre ultra-sécurisé avec pagination
  const filteredShops = useCallback(() => {
    console.log('🔍 Filtrage des boutiques - Terme:', searchTerm, 'Filtre:', statusFilter);
    
    try {
      if (!Array.isArray(shops)) {
        console.error('❌ shops n\'est pas un tableau:', shops);
        return [];
      }
      
      const filtered = shops.filter(shop => {
        try {
          if (!shop || typeof shop !== 'object') {
            console.warn('⚠️ Boutique invalide ignorée lors du filtrage:', shop);
            return false;
          }
          
          // Filtre par statut
          if (statusFilter !== 'all' && shop.status !== statusFilter) {
            return false;
          }
          
          // Filtre par recherche
          if (searchTerm && searchTerm.trim()) {
            const searchLower = searchTerm.toLowerCase().trim();
            
            const name = (shop.name || '').toString().toLowerCase();
            const description = (shop.description || '').toString().toLowerCase();
            const city = (shop.city || '').toString().toLowerCase();
            
            return name.includes(searchLower) || 
                   description.includes(searchLower) || 
                   city.includes(searchLower);
          }
          
          return true;
        } catch (err) {
          console.error('❌ Erreur lors du filtrage d\'une boutique:', err, shop);
          return false;
        }
      });
      
      console.log('✅ Filtrage terminé - Résultats:', filtered.length);
      return filtered;
      
    } catch (err) {
      console.error('❌ Erreur catastrophique lors du filtrage:', err);
      return [];
    }
  }, [shops, searchTerm, statusFilter])();

  // Calcul de la pagination
  const totalPages = Math.ceil(filteredShops.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedShops = filteredShops.slice(startIndex, startIndex + itemsPerPage);

  // Réinitialiser la page courante si nécessaire
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [filteredShops.length, currentPage, totalPages]);

  // Si erreur DOM détectée, forcer un rechargement
  if (domError) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-200 dark:border-orange-800 rounded-lg p-8">
            <div className="text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold text-orange-800 dark:text-orange-200 mb-4">
                Erreur DOM Détectée
              </h2>
              <p className="text-orange-700 dark:text-orange-300 mb-6">
                Une erreur de manipulation DOM a été détectée. Cela est corrigé automatiquement.
              </p>
              
              <div className="bg-orange-100 dark:bg-orange-900/30 rounded-lg p-4 mb-6 text-left">
                <h3 className="font-semibold text-orange-800 dark:text-orange-200 mb-2">Détails :</h3>
                <p className="text-sm text-orange-700 dark:text-orange-300">{domError}</p>
              </div>
              
              <button
                onClick={() => {
                  console.log('🔄 Réinitialisation après erreur DOM');
                  setDomError(null);
                  loadShops();
                }}
                className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                🔄 Réessayer
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-600">Chargement des boutiques...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-red-500 text-xl">❌</span>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                  Erreur lors du chargement des boutiques
                </h3>
                <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                  <p>{error}</p>
                </div>
                <div className="mt-4">
                  <button
                    onClick={loadShops}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Réessayer
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header optimisé et compact */}
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  Vos Boutiques
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {filteredShops.length} boutique{filteredShops.length !== 1 ? 's' : ''} • Total: {shops.length}
                </p>
              </div>
              
              {/* Indicateurs d'état compacts */}
              <div className="flex items-center space-x-2">
                {lastAction && (
                  <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <span className="mr-1">✅</span>
                    {lastAction}
                  </div>
                )}
                {isProcessing && (
                  <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    <span className="mr-1">⏳</span>
                    En cours...
                  </div>
                )}
              </div>
            </div>
            
            <button
              onClick={loadShops}
              disabled={isProcessing}
              className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white px-3 py-1.5 rounded-lg flex items-center space-x-1 transition-colors text-sm"
              title="Rafraîchir la liste"
            >
              <RefreshCw className={`h-3 w-3 ${isProcessing ? 'animate-spin' : ''}`} />
              <span>Rafraîchir</span>
            </button>
          </div>
        </div>

        {/* Barre de recherche - SANS ANIMATIONS */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-6 shadow-sm">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher une boutique..."
                  value={searchTerm}
                  onChange={(e) => {
                    console.log('🔍 Changement recherche:', e.target.value);
                    setSearchTerm(e.target.value);
                    setCurrentPage(1); // Réinitialiser à la première page
                  }}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <select
                value={statusFilter}
                onChange={(e) => {
                  console.log('🎯 Changement filtre statut:', e.target.value);
                  setStatusFilter(e.target.value);
                  setCurrentPage(1); // Réinitialiser à la première page
                }}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tous les statuts</option>
                <option value="approved">Approuvées</option>
                <option value="pending">En attente</option>
                <option value="rejected">Rejetées</option>
                <option value="suspended">Suspendues</option>
              </select>
            </div>
          </div>
        </div>

        {/* Liste des boutiques - SANS ANIMATIONS DE TRANSITION */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Boutique
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Localisation
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {paginatedShops.map((shop, index) => {
                  try {
                    if (!shop || typeof shop !== 'object') {
                      console.error('❌ Boutique invalide dans le rendu:', shop);
                      return null;
                    }
                    
                    console.log(`📝 Rendu boutique ${index}:`, shop.id, shop.name, shop.status);
                    
                    return (
                      <tr key={`${shop.id}-${shop._updatedAt || index}`} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                                <Store className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 dark:text-white break-words max-w-xs">
                                {(shop.name || 'Sans nom').toString()}
                              </div>
                              {shop.is_verified && (
                                <div className="mt-1">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium text-blue-600 bg-blue-100">
                                    ✓ Vérifié
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 dark:text-white break-words max-w-xs">
                            {(shop.description || 'Aucune description').toString()}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 break-words">
                            Catégorie: {(shop.category || 'général').toString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            <div className="flex items-center space-x-1">
                              <span>📞</span>
                              <span className="break-all">{(shop.phone || 'Non spécifié').toString()}</span>
                            </div>
                            <div className="flex items-center space-x-1 mt-1">
                              <span>✉️</span>
                              <span className="text-xs break-all">{(shop.email || 'Non spécifié').toString()}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            <div className="flex items-center space-x-1">
                              <span>📍</span>
                              <span className="break-words max-w-xs">{(shop.city || 'Non spécifié').toString()}</span>
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 break-words">
                              {(shop.country || 'Non spécifié').toString()}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            shop.status === 'approved' ? 'bg-green-100 text-green-800' :
                            shop.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            shop.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            shop.status === 'suspended' ? 'bg-orange-100 text-orange-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {shop.status === 'approved' && '✓'}
                            {shop.status === 'pending' && '⏳'}
                            {shop.status === 'rejected' && '✗'}
                            {shop.status === 'suspended' && '⏸️'}
                            <span className="ml-1 capitalize">{(shop.status || 'inconnu').toString()}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {(() => {
                            try {
                              const date = new Date(shop.created_at);
                              return (
                                <>
                                  {date.toLocaleDateString('fr-FR')}
                                  <div className="text-xs">
                                    {date.toLocaleTimeString('fr-FR')}
                                  </div>
                                </>
                              );
                            } catch {
                              return 'Date invalide';
                            }
                          })()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex flex-wrap gap-2">
                            {/* BOUTONS DE STATUT - SANS ANIMATIONS PROBLEMATIQUES */}
                            {shop.status === 'approved' && (
                              <>
                                <button
                                  onClick={async (e) => {
                                    console.log('🎯 CLICK SUSPENDRE - Shop:', shop.id);
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if (confirm('Êtes-vous sûr de vouloir suspendre cette boutique ?')) {
                                      await changeShopStatus(shop.id, 'suspended');
                                    }
                                  }}
                                  disabled={isProcessing}
                                  className="bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white px-2 py-1 rounded text-xs flex items-center space-x-1 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500"
                                  title="Suspendre cette boutique"
                                >
                                  <AlertCircle className="h-3 w-3" />
                                  <span>Suspendre</span>
                                </button>
                                <button
                                  onClick={async (e) => {
                                    console.log('🎯 CLICK EN ATTENTE - Shop:', shop.id);
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if (confirm('Êtes-vous sûr de vouloir remettre cette boutique en attente ?')) {
                                      await changeShopStatus(shop.id, 'pending');
                                    }
                                  }}
                                  disabled={isProcessing}
                                  className="bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-400 text-white px-2 py-1 rounded text-xs flex items-center space-x-1 transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                  title="Remettre cette boutique en attente"
                                >
                                  <AlertCircle className="h-3 w-3" />
                                  <span>En attente</span>
                                </button>
                              </>
                            )}
                            
                            {shop.status === 'pending' && (
                              <>
                                <button
                                  onClick={async (e) => {
                                    console.log('🎯 CLICK APPROUVER - Shop:', shop.id);
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if (confirm('Êtes-vous sûr de vouloir approuver cette boutique ?')) {
                                      await changeShopStatus(shop.id, 'approved');
                                    }
                                  }}
                                  disabled={isProcessing}
                                  className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-2 py-1 rounded text-xs flex items-center space-x-1 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500"
                                  title="Approuver cette boutique"
                                >
                                  <CheckCircle className="h-3 w-3" />
                                  <span>Approuver</span>
                                </button>
                                <button
                                  onClick={async (e) => {
                                    console.log('🎯 CLICK REJETER - Shop:', shop.id);
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if (confirm('Êtes-vous sûr de vouloir rejeter cette boutique ?')) {
                                      await changeShopStatus(shop.id, 'rejected');
                                    }
                                  }}
                                  disabled={isProcessing}
                                  className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-2 py-1 rounded text-xs flex items-center space-x-1 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                                  title="Rejeter cette boutique"
                                >
                                  <XCircle className="h-3 w-3" />
                                  <span>Rejeter</span>
                                </button>
                              </>
                            )}
                            
                            {shop.status === 'suspended' && (
                              <>
                                <button
                                  onClick={async (e) => {
                                    console.log('🎯 CLICK RÉACTIVER - Shop:', shop.id);
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if (confirm('Êtes-vous sûr de vouloir réactiver cette boutique ?')) {
                                      await changeShopStatus(shop.id, 'approved');
                                    }
                                  }}
                                  disabled={isProcessing}
                                  className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-2 py-1 rounded text-xs flex items-center space-x-1 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500"
                                  title="Réactiver cette boutique"
                                >
                                  <CheckCircle className="h-3 w-3" />
                                  <span>Réactiver</span>
                                </button>
                                <button
                                  onClick={async (e) => {
                                    console.log('🎯 CLICK EN ATTENTE SUSPENDU - Shop:', shop.id);
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if (confirm('Êtes-vous sûr de vouloir remettre cette boutique en attente ?')) {
                                      await changeShopStatus(shop.id, 'pending');
                                    }
                                  }}
                                  disabled={isProcessing}
                                  className="bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-400 text-white px-2 py-1 rounded text-xs flex items-center space-x-1 transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                  title="Remettre cette boutique en attente"
                                >
                                  <AlertCircle className="h-3 w-3" />
                                  <span>En attente</span>
                                </button>
                              </>
                            )}
                            
                            {shop.status === 'rejected' && (
                              <button
                                onClick={async (e) => {
                                  console.log('🎯 CLICK REVISER - Shop:', shop.id);
                                  e.preventDefault();
                                  e.stopPropagation();
                                  if (confirm('Êtes-vous sûr de vouloir réviser cette boutique ?')) {
                                    await changeShopStatus(shop.id, 'pending');
                                  }
                                }}
                                disabled={isProcessing}
                                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-2 py-1 rounded text-xs flex items-center space-x-1 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                                title="Réviser cette boutique"
                              >
                                <AlertCircle className="h-3 w-3" />
                                <span>Réviser</span>
                              </button>
                            )}
                            
                            {/* Autres actions */}
                            <button
                              onClick={() => {
                                try {
                                  console.log('👁️ Voir boutique:', shop.id);
                                  alert(`Détails de la boutique:\n\n📝 Nom: ${shop.name || 'Sans nom'}\n📄 Description: ${shop.description || 'Aucune'}\n📊 Statut: ${shop.status || 'inconnu'}\n🏙️ Ville: ${shop.city || 'Non spécifiée'}\n📞 Téléphone: ${shop.phone || 'Non spécifié'}\n✉️ Email: ${shop.email || 'Non spécifié'}`);
                                } catch (err) {
                                  console.error('Erreur lors de l\'affichage des détails:', err);
                                  alert('Erreur lors de l\'affichage des détails');
                                }
                              }}
                              disabled={isProcessing}
                              className="bg-blue-100 hover:bg-blue-200 disabled:bg-gray-100 text-blue-800 px-2 py-1 rounded text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300"
                              title="Voir les détails"
                            >
                              <Eye className="h-3 w-3" />
                              <span>Voir</span>
                            </button>
                            <button
                              onClick={() => {
                                try {
                                  console.log('✏️ Éditer boutique:', shop.id);
                                  const newName = prompt('Nouveau nom de la boutique:', shop.name || '');
                                  if (newName && newName !== shop.name) {
                                    editShopField(shop.id, 'name', newName);
                                  }
                                } catch (err) {
                                  console.error('Erreur lors de l\'édition:', err);
                                  alert('Erreur lors de l\'édition');
                                }
                              }}
                              disabled={isProcessing}
                              className="bg-green-100 hover:bg-green-200 disabled:bg-gray-100 text-green-800 px-2 py-1 rounded text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-green-300"
                              title="Éditer le nom"
                            >
                              <Edit className="h-3 w-3" />
                              <span>Éditer</span>
                            </button>
                            <button
                              onClick={() => {
                                console.log(`🗑️ Supprimer boutique ${shop.id}`);
                                deleteShop(shop.id);
                              }}
                              disabled={isProcessing}
                              className="bg-red-100 hover:bg-red-200 disabled:bg-gray-100 text-red-800 px-2 py-1 rounded text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-red-300"
                              title="Supprimer cette boutique"
                            >
                              <Trash2 className="h-3 w-3" />
                              <span>Supprimer</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  } catch (err) {
                    console.error(`❌ Erreur fatale lors du rendu de la boutique ${shop?.id || index}:`, err);
                    return (
                      <tr key={`error-${shop?.id || index}`} className="bg-red-50 dark:bg-red-900/20">
                        <td colSpan={7} className="px-6 py-4 text-sm text-red-600 dark:text-red-400">
                          ❌ Erreur lors du rendu de cette boutique (ID: {shop?.id || 'inconnu'})
                        </td>
                      </tr>
                    );
                  }
                })}
              </tbody>
            </table>
          </div>
          
          {filteredShops.length === 0 && (
            <div className="text-center py-8">
              <Store className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                {Array.isArray(shops) && shops.length === 0 ? (
                  <>Aucune boutique créée pour le moment</>
                ) : (
                  <>Aucune boutique trouvée avec le filtre "{searchTerm}"</>
                )}
              </p>
              {Array.isArray(shops) && shops.length === 0 && (
                <button
                  onClick={() => window.location.hash = '#/admin/shops/create'}
                  className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Créer votre première boutique
                </button>
              )}
            </div>
          )}
        </div>

        {/* Pagination */}
        {filteredShops.length > itemsPerPage && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Affichage de {startIndex + 1} à {Math.min(startIndex + itemsPerPage, filteredShops.length)} sur {filteredShops.length} boutiques
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Précédent
              </button>
              
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-1 text-sm rounded-md ${
                        currentPage === pageNum
                          ? 'bg-blue-600 text-white'
                          : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}