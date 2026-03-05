import { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { Store, RefreshCw, Search, Filter, CheckCircle, XCircle, AlertCircle, Edit, Eye, Trash2 } from 'lucide-react';

// Version ultra-stable avec gestion d'erreur complète
export default function AdminShopsUltraStable() {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [error, setError] = useState(null);
  const [lastAction, setLastAction] = useState('');

  useEffect(() => {
    loadShops();
  }, []);

  const loadShops = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Chargement des boutiques...');
      
      // Récupérer les boutiques depuis Supabase
      const { data, error: supabaseError } = await supabase
        .from('shops')
        .select('*')
        .order('created_at', { ascending: false });

      if (supabaseError) {
        console.error('❌ Erreur Supabase:', supabaseError);
        setError(supabaseError.message);
        return;
      }

      if (data) {
        console.log('✅ Boutiques récupérées:', data.length);
        console.log('📋 Première boutique:', data[0]);
        setShops(data);
      } else {
        console.log('ℹ️ Aucune boutique trouvée');
        setShops([]);
      }
    } catch (err) {
      console.error('❌ Erreur inattendue:', err);
      setError(err.message || 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour changer le statut d'une boutique
  const changeShopStatus = async (shopId: string, newStatus: 'approved' | 'rejected' | 'pending') => {
    try {
      console.log(`🔄 Changement du statut de la boutique ${shopId} vers ${newStatus}`);
      
      const { error } = await supabase
        .from('shops')
        .update({ status: newStatus })
        .eq('id', shopId);

      if (error) {
        console.error('❌ Erreur lors du changement de statut:', error);
        alert('Erreur lors du changement de statut: ' + error.message);
        return;
      }

      console.log('✅ Statut changé avec succès');
      
      // Mettre à jour l'état local
      setShops(prevShops => 
        prevShops.map(shop => 
          shop.id === shopId ? { ...shop, status: newStatus } : shop
        )
      );

      setLastAction(`Statut changé en "${newStatus}"`);
      alert(`Statut de la boutique changé en "${newStatus}" avec succès !`);
    } catch (err) {
      console.error('❌ Erreur lors du changement de statut:', err);
      alert('Erreur lors du changement de statut: ' + err.message);
    }
  };

  // Fonction pour éditer un champ d'une boutique
  const editShopField = async (shopId: string, field: string, value: any) => {
    try {
      console.log(`✏️ Édition du champ ${field} de la boutique ${shopId}:`, value);
      
      const { error } = await supabase
        .from('shops')
        .update({ [field]: value })
        .eq('id', shopId);

      if (error) {
        console.error('❌ Erreur lors de l\'édition:', error);
        alert('Erreur lors de l\'édition: ' + error.message);
        return;
      }

      console.log('✅ Champ modifié avec succès');
      
      // Mettre à jour l'état local
      setShops(prevShops => 
        prevShops.map(shop => 
          shop.id === shopId ? { ...shop, [field]: value } : shop
        )
      );

      setLastAction(`${field} modifié`);
      alert(`${field} modifié avec succès !`);
    } catch (err) {
      console.error('❌ Erreur lors de l\'édition:', err);
      alert('Erreur lors de l\'édition: ' + err.message);
    }
  };

  // Fonction pour supprimer une boutique
  const deleteShop = async (shopId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette boutique ? Cette action est irréversible.')) {
      return;
    }

    try {
      console.log(`🗑️ Suppression de la boutique ${shopId}`);
      
      const { error } = await supabase
        .from('shops')
        .delete()
        .eq('id', shopId);

      if (error) {
        console.error('❌ Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression: ' + error.message);
        return;
      }

      console.log('✅ Boutique supprimée avec succès');
      
      // Mettre à jour l'état local
      setShops(prevShops => prevShops.filter(shop => shop.id !== shopId));

      setLastAction('Boutique supprimée');
      alert('Boutique supprimée avec succès !');
    } catch (err) {
      console.error('❌ Erreur lors de la suppression:', err);
      alert('Erreur lors de la suppression: ' + err.message);
    }
  };

  // Filtre ultra-sécurisé avec vérification de chaque propriété
  const filteredShops = shops.filter(shop => {
    try {
      if (!shop) return false;
      
      // Filtre par statut
      if (statusFilter !== 'all' && shop.status !== statusFilter) {
        return false;
      }
      
      // Filtre par recherche (si un terme est entré)
      if (searchTerm.trim()) {
        const searchLower = searchTerm.toLowerCase().trim();
        
        // Vérifier chaque propriété avant de l'utiliser
        const name = (shop.name || '').toString().toLowerCase();
        const description = (shop.description || '').toString().toLowerCase();
        const city = (shop.city || '').toString().toLowerCase();
        
        return name.includes(searchLower) || 
               description.includes(searchLower) || 
               city.includes(searchLower);
      }
      
      return true; // Si pas de terme de recherche, inclure la boutique
    } catch (err) {
      console.error('Erreur lors du filtrage d\'une boutique:', err, shop);
      return false; // Exclure la boutique en cas d'erreur
    }
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        <span className="ml-2 text-gray-600">Chargement des boutiques...</span>
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
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Vos Boutiques
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Visualisez toutes les boutiques créées
              </p>
              {lastAction && (
                <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 animate-pulse">
                  <span className="mr-1">✅</span>
                  {lastAction}
                </div>
              )}
            </div>
            <button
              onClick={loadShops}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              title="Rafraîchir la liste"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Rafraîchir</span>
            </button>
          </div>
        </div>

        {/* Barre de recherche - avec gestion d'erreur */}
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
                    try {
                      setSearchTerm(e.target.value);
                    } catch (err) {
                      console.error('Erreur lors de la mise à jour du terme de recherche:', err);
                    }
                  }}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <select
                value={statusFilter}
                onChange={(e) => {
                  try {
                    setStatusFilter(e.target.value);
                  } catch (err) {
                    console.error('Erreur lors de la mise à jour du filtre de statut:', err);
                  }
                }}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tous les statuts</option>
                <option value="approved">Approuvées</option>
                <option value="pending">En attente</option>
                <option value="rejected">Rejetées</option>
              </select>
            </div>
            <div className="flex items-center">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {filteredShops.length} / {shops.length} boutiques
              </span>
            </div>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{shops.length}</p>
              </div>
              <Store className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Filtrées</p>
                <p className="text-2xl font-bold text-green-600">{filteredShops.length}</p>
              </div>
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-sm font-bold">🔍</span>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">En ligne</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {shops.filter(s => s.status === 'approved').length}
                </p>
              </div>
              <div className="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <span className="text-yellow-600 text-sm font-bold">🟢</span>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Vérifiées</p>
                <p className="text-2xl font-bold text-blue-600">
                  {shops.filter(s => s.is_verified).length}
                </p>
              </div>
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-sm font-bold">✓</span>
              </div>
            </div>
          </div>
        </div>

        {/* Liste des boutiques - avec gestion d'erreur par boutique */}
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
                {filteredShops.map((shop, index) => {
                  try {
                    return (
                      <tr key={shop.id || index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
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
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {shop.status === 'approved' && '✓'}
                            {shop.status === 'pending' && '⏳'}
                            {shop.status === 'rejected' && '✗'}
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
                          <div className="flex items-center space-x-2">
                            {/* Boutons d'action selon le statut actuel */}
                            {shop.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => {
                                    console.log(`✅ Approuver boutique ${shop.id}`);
                                    changeShopStatus(shop.id, 'approved');
                                  }}
                                  className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs flex items-center space-x-1 transition-colors"
                                  title="Approuver cette boutique"
                                >
                                  <CheckCircle className="h-3 w-3" />
                                  <span>Approuver</span>
                                </button>
                                <button
                                  onClick={() => {
                                    console.log(`❌ Rejeter boutique ${shop.id}`);
                                    changeShopStatus(shop.id, 'rejected');
                                  }}
                                  className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs flex items-center space-x-1 transition-colors"
                                  title="Rejeter cette boutique"
                                >
                                  <XCircle className="h-3 w-3" />
                                  <span>Rejeter</span>
                                </button>
                              </>
                            )}
                            {shop.status === 'approved' && (
                              <button
                                onClick={() => {
                                  console.log(`⏸️ Remettre en attente boutique ${shop.id}`);
                                  changeShopStatus(shop.id, 'pending');
                                }}
                                className="bg-yellow-600 hover:bg-yellow-700 text-white px-2 py-1 rounded text-xs flex items-center space-x-1 transition-colors"
                                title="Remettre cette boutique en attente"
                              >
                                <AlertCircle className="h-3 w-3" />
                                <span>En attente</span>
                              </button>
                            )}
                            {shop.status === 'rejected' && (
                              <button
                                onClick={() => {
                                  console.log(`🔄 Réviser boutique ${shop.id}`);
                                  changeShopStatus(shop.id, 'pending');
                                }}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs flex items-center space-x-1 transition-colors"
                                title="Réviser cette boutique"
                              >
                                <AlertCircle className="h-3 w-3" />
                                <span>Réviser</span>
                              </button>
                            )}
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
                              className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-2 py-1 rounded text-xs transition-colors"
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
                                    // Fonction pour éditer le nom
                                    editShopField(shop.id, 'name', newName);
                                  }
                                } catch (err) {
                                  console.error('Erreur lors de l\'édition:', err);
                                  alert('Erreur lors de l\'édition');
                                }
                              }}
                              className="bg-green-100 hover:bg-green-200 text-green-800 px-2 py-1 rounded text-xs transition-colors"
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
                              className="bg-red-100 hover:bg-red-200 text-red-800 px-2 py-1 rounded text-xs transition-colors"
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
                    console.error(`Erreur lors du rendu de la boutique ${shop.id}:`, err);
                    return (
                      <tr key={shop.id || index} className="bg-red-50 dark:bg-red-900/20">
                        <td colSpan={6} className="px-6 py-4 text-sm text-red-600 dark:text-red-400">
                          ❌ Erreur lors du rendu de cette boutique (ID: {shop.id || 'inconnu'})
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
                {shops.length === 0 ? (
                  <>Aucune boutique créée pour le moment</>
                ) : (
                  <>Aucune boutique trouvée avec le filtre "{searchTerm}"</>
                )}
              </p>
              {shops.length === 0 && (
                <button
                  onClick={() => window.location.hash = '#/admin/shops/create'}
                  className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                >
                  Créer votre première boutique
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}