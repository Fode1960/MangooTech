import React, { useState } from 'react';
import { useTheme } from '../hooks/useTheme';
import { 
  Store, 
  Search, 
  Plus, 
  Filter, 
  MoreHorizontal, 
  MapPin, 
  Star, 
  CheckCircle, 
  XCircle,
  Clock,
  Smartphone,
  X,
  Save,
  Image as ImageIcon
} from 'lucide-react';

interface Shop {
  id: string;
  name: string;
  category: string;
  owner: string;
  status: 'active' | 'pending' | 'suspended';
  rating: number;
  orders: number;
  revenue: number;
  location: string;
  date_created: string;
  image: string;
}

export default function AdminShops() {
  const { isDark } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newShop, setNewShop] = useState({
    name: '',
    category: 'Mode & Vêtements',
    owner: '',
    location: '',
  });

  // Données de démonstration
  const [shops, setShops] = useState<Shop[]>([
    {
      id: '1',
      name: 'Boutique Élégance Africaine',
      category: 'Mode & Vêtements',
      owner: 'Marie Koné',
      status: 'active',
      rating: 4.8,
      orders: 156,
      revenue: 2345000,
      location: 'Abidjan, Cocody',
      date_created: '2024-01-15',
      image: 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=100&h=100&fit=crop'
    },
    {
      id: '2',
      name: 'Tech Store CI',
      category: 'Électronique',
      owner: 'Jean-Luc Kouassi',
      status: 'active',
      rating: 4.6,
      orders: 89,
      revenue: 1890000,
      location: 'Abidjan, Marcory',
      date_created: '2024-02-01',
      image: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=100&h=100&fit=crop'
    },
    {
      id: '3',
      name: 'Épicerie Bio du Quartier',
      category: 'Alimentation',
      owner: 'Aminata Diallo',
      status: 'pending',
      rating: 0,
      orders: 0,
      revenue: 0,
      location: 'Bouaké, Centre',
      date_created: '2024-02-27',
      image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=100&h=100&fit=crop'
    },
    {
      id: '4',
      name: 'Artisanat Local',
      category: 'Art & Déco',
      owner: 'Ibrahim Traoré',
      status: 'suspended',
      rating: 3.5,
      orders: 12,
      revenue: 150000,
      location: 'Yamoussoukro',
      date_created: '2023-11-20',
      image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=100&h=100&fit=crop'
    }
  ]);

  const handleCreateShop = (e: React.FormEvent) => {
    e.preventDefault();
    const createdShop: Shop = {
      id: (shops.length + 1).toString(),
      name: newShop.name,
      category: newShop.category,
      owner: newShop.owner,
      status: 'pending',
      rating: 0,
      orders: 0,
      revenue: 0,
      location: newShop.location,
      date_created: new Date().toISOString().split('T')[0],
      image: 'https://images.unsplash.com/photo-1472851294608-415522f96319?w=100&h=100&fit=crop' // Placeholder
    };
    
    setShops([createdShop, ...shops]);
    setShowCreateForm(false);
    setNewShop({ name: '', category: 'Mode & Vêtements', owner: '', location: '' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Actif';
      case 'pending': return 'En attente';
      case 'suspended': return 'Suspendu';
      default: return status;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'} p-6`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Gestion des Boutiques</h1>
            <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} mt-1`}>Gérez les boutiques partenaires et validez les nouvelles inscriptions</p>
          </div>
          <button 
            onClick={() => setShowCreateForm(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus className="h-5 w-5 mr-2" />
            Ajouter une boutique
          </button>
        </div>

        {/* Formulaire de création (Modal) */}
        {showCreateForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className={`w-full max-w-md rounded-xl shadow-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} overflow-hidden`}>
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Nouvelle Boutique</h3>
                <button 
                  onClick={() => setShowCreateForm(false)}
                  className={`p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <form onSubmit={handleCreateShop} className="p-6 space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Nom de la boutique</label>
                  <input
                    type="text"
                    required
                    value={newShop.name}
                    onChange={(e) => setNewShop({...newShop, name: e.target.value})}
                    className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    placeholder="Ex: Ma Super Boutique"
                  />
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Propriétaire</label>
                  <input
                    type="text"
                    required
                    value={newShop.owner}
                    onChange={(e) => setNewShop({...newShop, owner: e.target.value})}
                    className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    placeholder="Nom complet du vendeur"
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Catégorie</label>
                  <select
                    value={newShop.category}
                    onChange={(e) => setNewShop({...newShop, category: e.target.value})}
                    className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="Mode & Vêtements">Mode & Vêtements</option>
                    <option value="Électronique">Électronique</option>
                    <option value="Alimentation">Alimentation</option>
                    <option value="Art & Déco">Art & Déco</option>
                    <option value="Beauté & Santé">Beauté & Santé</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Localisation</label>
                  <input
                    type="text"
                    required
                    value={newShop.location}
                    onChange={(e) => setNewShop({...newShop, location: e.target.value})}
                    className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    placeholder="Ville, Quartier"
                  />
                </div>

                <div className="pt-4 flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className={`flex-1 px-4 py-2 rounded-lg border font-medium ${
                      isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center justify-center"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Créer
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Filters & Search */}
        <div className={`p-4 rounded-xl shadow-sm mb-6 border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
              <input
                type="text"
                placeholder="Rechercher une boutique, un vendeur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-gray-50 border-gray-300 text-gray-900'
                }`}
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className={`h-5 w-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className={`px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
                }`}
              >
                <option value="all">Tous les statuts</option>
                <option value="active">Actif</option>
                <option value="pending">En attente</option>
                <option value="suspended">Suspendu</option>
              </select>
            </div>
          </div>
        </div>

        {/* Shops Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {shops.map((shop) => (
            <div key={shop.id} className={`rounded-xl shadow-sm border overflow-hidden transition-all hover:shadow-md ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-3">
                    <img 
                      src={shop.image} 
                      alt={shop.name} 
                      className="w-12 h-12 rounded-full object-cover border-2 border-gray-100"
                    />
                    <div>
                      <h3 className={`font-semibold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>{shop.name}</h3>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{shop.category}</p>
                    </div>
                  </div>
                  <button className={`p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    <MoreHorizontal className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between text-sm">
                    <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>Vendeur</span>
                    <span className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>{shop.owner}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>Localisation</span>
                    <span className={`font-medium flex items-center ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                      <MapPin className="h-3 w-3 mr-1" />
                      {shop.location}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>Chiffre d'affaires</span>
                    <span className="font-bold text-blue-600">{formatCurrency(shop.revenue)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>Commandes</span>
                    <span className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>{shop.orders}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(shop.status)}`}>
                    {getStatusLabel(shop.status)}
                  </span>
                  <div className="flex items-center text-yellow-500">
                    <Star className="h-4 w-4 fill-current" />
                    <span className={`ml-1 text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{shop.rating > 0 ? shop.rating : '-'}</span>
                  </div>
                </div>
              </div>
              
              <div className={`px-6 py-3 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-100 dark:border-gray-700 flex justify-between`}>
                <button className="text-sm font-medium text-blue-600 hover:text-blue-700">Voir détails</button>
                {shop.status === 'pending' && (
                  <button className="text-sm font-medium text-green-600 hover:text-green-700 flex items-center">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Valider
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Card pour ajouter une nouvelle boutique (visuel) */}
          <div 
            onClick={() => setShowCreateForm(true)}
            className={`rounded-xl border-2 border-dashed flex flex-col items-center justify-center p-8 transition-colors cursor-pointer group ${
            isDark ? 'border-gray-700 hover:border-gray-500 bg-gray-800/50' : 'border-gray-300 hover:border-blue-400 bg-gray-50'
          }`}>
            <div className={`p-4 rounded-full mb-4 group-hover:scale-110 transition-transform ${isDark ? 'bg-gray-700 text-gray-400' : 'bg-white text-gray-400 shadow-sm'}`}>
              <Store className="h-8 w-8" />
            </div>
            <h3 className={`font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Nouvelle Boutique</h3>
            <p className={`text-sm text-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Inscrire un nouveau vendeur sur la plateforme</p>
          </div>
        </div>
      </div>
    </div>
  );
}