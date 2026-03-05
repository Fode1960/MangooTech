import { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { Store, RefreshCw, Search, Filter } from 'lucide-react';

interface Shop {
  id: string;
  name: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  country: string;
  city: string;
  category: string;
  status: 'pending' | 'approved' | 'rejected';
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export default function AdminShopsViewer() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadShops();
  }, []);

  const loadShops = async () => {
    try {
      setLoading(true);
      console.log('🔄 Chargement des boutiques...');
      
      // Récupérer les boutiques depuis Supabase
      const { data, error } = await supabase
        .from('shops')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Erreur Supabase:', error);
        alert('Erreur lors du chargement des boutiques: ' + error.message);
        return;
      }

      if (data && data.length > 0) {
        console.log('✅ Boutiques trouvées:', data.length);
        console.log('📋 Première boutique:', data[0]);
        setShops(data as Shop[]);
      } else {
        console.log('ℹ️ Aucune boutique trouvée');
        setShops([]);
      }
    } catch (error) {
      console.error('❌ Erreur:', error);
      alert('Erreur: ' + error);
    } finally {
      setLoading(false);
    }
  };

  const filteredShops = shops.filter(shop => {
    const matchesSearch = shop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         shop.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         shop.city.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || shop.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        <span className="ml-2 text-gray-600">Chargement des boutiques...</span>
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
                <p className="text-sm text-gray-600 dark:text-gray-400">Approuvées</p>
                <p className="text-2xl font-bold text-green-600">{shops.filter(s => s.status === 'approved').length}</p>
              </div>
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-sm font-bold">✓</span>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">En attente</p>
                <p className="text-2xl font-bold text-yellow-600">{shops.filter(s => s.status === 'pending').length}</p>
              </div>
              <div className="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <span className="text-yellow-600 text-sm font-bold">⏳</span>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Vérifiées</p>
                <p className="text-2xl font-bold text-blue-600">{shops.filter(s => s.is_verified).length}</p>
              </div>
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-sm font-bold">★</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filtres */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-6 shadow-sm">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher une boutique..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tous les statuts</option>
                <option value="approved">Approuvées</option>
                <option value="pending">En attente</option>
                <option value="rejected">Rejetées</option>
              </select>
            </div>
          </div>
        </div>

        {/* Liste des boutiques */}
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
                    Date de création
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredShops.map((shop) => (
                  <tr key={shop.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                            <Store className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {shop.name}
                          </div>
                          <div className="text-xs text-gray-400 dark:text-gray-500">
                            ID: {shop.id}
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
                      <div className="text-sm text-gray-900 dark:text-white">
                        {shop.description}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Catégorie: {shop.category}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        <div className="flex items-center space-x-1">
                          <span>📞</span>
                          <span>{shop.phone}</span>
                        </div>
                        <div className="flex items-center space-x-1 mt-1">
                          <span>✉️</span>
                          <span className="text-xs">{shop.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        <div className="flex items-center space-x-1">
                          <span>📍</span>
                          <span>{shop.city}</span>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{shop.country}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(shop.status)}`}>
                        {shop.status === 'approved' && '✓'}
                        {shop.status === 'pending' && '⏳'}
                        {shop.status === 'rejected' && '✗'}
                        <span className="ml-1 capitalize">{shop.status}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(shop.created_at).toLocaleDateString('fr-FR')}
                      <div className="text-xs">
                        {new Date(shop.created_at).toLocaleTimeString('fr-FR')}
                      </div>
                    </td>
                  </tr>
                ))}
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
                  <>Aucune boutique trouvée avec ces filtres</>
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