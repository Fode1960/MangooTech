import { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye, 
  CheckCircle, 
  XCircle,
  Store,
  MapPin,
  Phone,
  Mail,
  Globe,
  Star,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

interface Shop {
  id: string;
  name: string;
  slug: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  country: string;
  city: string;
  category: string;
  status: 'pending' | 'approved' | 'rejected';
  is_verified: boolean;
  rating: number;
  review_count: number;
  created_at: string;
  updated_at: string;
}

export default function AdminShopsSimple() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [countryFilter, setCountryFilter] = useState<string>('all');

  useEffect(() => {
    fetchShops();
  }, []);

  const fetchShops = async () => {
    try {
      setLoading(true);
      
      // Récupérer les boutiques depuis Supabase
      const { data, error } = await supabase
        .from('shops')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erreur lors de la récupération des boutiques:', error);
        alert('Erreur lors de la récupération des boutiques: ' + error.message);
      } else if (data && data.length > 0) {
        // Transformer les données Supabase en format Shop
        const shopsData = data.map(shop => ({
          id: shop.id,
          name: shop.name,
          slug: shop.slug || shop.name.toLowerCase().replace(/\s+/g, '-'),
          description: shop.description || 'Aucune description',
          address: shop.address || 'Adresse non spécifiée',
          phone: shop.phone || 'Non spécifié',
          email: shop.email || 'Non spécifié',
          website: shop.website || '',
          country: shop.country || 'Non spécifié',
          city: shop.city || 'Non spécifié',
          category: shop.category || 'general',
          status: shop.status || 'pending',
          is_verified: shop.is_verified || false,
          rating: shop.rating || 0,
          review_count: shop.review_count || 0,
          created_at: shop.created_at,
          updated_at: shop.updated_at
        }));
        setShops(shopsData);
        console.log('✅ Boutiques récupérées:', shopsData.length);
      } else {
        console.log('ℹ️ Aucune boutique trouvée');
        setShops([]);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des boutiques:', error);
      alert('Erreur lors de la récupération des boutiques: ' + error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateShop = () => {
    window.location.hash = '#/admin/shops/create';
  };

  const filteredShops = shops.filter(shop => {
    const matchesSearch = shop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         shop.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         shop.city.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || shop.status === statusFilter;
    const matchesCountry = countryFilter === 'all' || shop.country === countryFilter;
    
    return matchesSearch && matchesStatus && matchesCountry;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'pending': return <AlertCircle className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      default: return null;
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
      <div className="px-0">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Gestion des Boutiques
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Gérez toutes les boutiques de la plateforme
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={fetchShops}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                title="Rafraîchir la liste"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Rafraîchir</span>
              </button>
              <button
                onClick={handleCreateShop}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Créer une boutique</span>
              </button>
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
            <div>
              <select
                value={countryFilter}
                onChange={(e) => setCountryFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tous les pays</option>
                <option value="Côte d'Ivoire">Côte d'Ivoire</option>
                <option value="Mali">Mali</option>
                <option value="Sénégal">Sénégal</option>
              </select>
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
                <p className="text-sm text-gray-600 dark:text-gray-400">Approuvées</p>
                <p className="text-2xl font-bold text-green-600">{shops.filter(s => s.status === 'approved').length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">En attente</p>
                <p className="text-2xl font-bold text-yellow-600">{shops.filter(s => s.status === 'pending').length}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-yellow-500" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Vérifiées</p>
                <p className="text-2xl font-bold text-blue-600">{shops.filter(s => s.is_verified).length}</p>
              </div>
              <Star className="h-8 w-8 text-blue-500" />
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
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Localisation
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
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
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {shop.category} • {shop.slug}
                          </div>
                          <div className="text-xs text-gray-400 dark:text-gray-500">
                            ID: {shop.id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        <div className="flex items-center space-x-1">
                          <Phone className="h-3 w-3 text-gray-400" />
                          <span>{shop.phone}</span>
                        </div>
                        <div className="flex items-center space-x-1 mt-1">
                          <Mail className="h-3 w-3 text-gray-400" />
                          <span className="text-xs">{shop.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-3 w-3 text-gray-400" />
                          <span>{shop.city}</span>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{shop.country}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(shop.status)}`}>
                        {getStatusIcon(shop.status)}
                        <span className="ml-1">{shop.status}</span>
                      </span>
                      {shop.is_verified && (
                        <div className="mt-1">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium text-blue-600 bg-blue-100">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Vérifié
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => console.log('Voir boutique:', shop.id)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          title="Voir"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => console.log('Éditer boutique:', shop.id)}
                          className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                          title="Éditer"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Êtes-vous sûr de vouloir supprimer cette boutique ?')) {
                              console.log('Supprimer boutique:', shop.id);
                            }
                          }}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
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
                {shops.length === 0 ? 'Aucune boutique créée' : 'Aucune boutique trouvée avec ces filtres'}
              </p>
              {shops.length === 0 && (
                <button
                  onClick={handleCreateShop}
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