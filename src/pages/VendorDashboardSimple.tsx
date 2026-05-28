import React, { useState } from 'react';
import { Package, BarChart3, MessageCircle, Video, Radio, Settings, Plus, Eye, LogOut, Edit, Trash2, Upload } from 'lucide-react';

// Données simulées pour éviter tout chargement
const DEMO_SHOP = {
  id: 'shop-demo-123',
  name: 'Ma Boutique (Mode Simple)',
  slug: 'ma-boutique',
  description: 'Version simplifiée ultra-rapide'
};

const DEMO_PRODUCTS = [
  {
    id: '1',
    name: 'Produit Démo 1',
    description: 'Description du produit démo',
    price: 15000,
    stock_quantity: 10,
    image_url: null
  },
  {
    id: '2',
    name: 'Produit Démo 2',
    description: 'Autre produit',
    price: 25000,
    stock_quantity: 5,
    image_url: null
  }
];

const VendorDashboardSimple = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState('products');
  const [products, setProducts] = useState(DEMO_PRODUCTS);
  const [showProductForm, setShowProductForm] = useState(false);

  // Login immédiat sans async
  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-orange-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Espace Vendeur (Safe Mode)</h2>
          <p className="text-gray-600 mb-6">Version optimisée sans chargement.</p>
          <button
            onClick={handleLogin}
            className="w-full bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors font-semibold"
          >
            Accéder au tableau de bord
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center text-white font-bold">
                M
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{DEMO_SHOP.name}</h1>
                <p className="text-sm text-gray-600">Tableau de bord vendeur</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <nav className="bg-white rounded-xl shadow-sm p-4 sticky top-24">
              <ul className="space-y-2">
                {[
                  { id: 'products', icon: Package, label: 'Produits' },
                  { id: 'analytics', icon: BarChart3, label: 'Statistiques' },
                  { id: 'chat', icon: MessageCircle, label: 'Chat' },
                  { id: 'video', icon: Video, label: 'Appels Vidéo' },
                  { id: 'live', icon: Radio, label: 'Live Shopping' },
                  { id: 'settings', icon: Settings, label: 'Paramètres' },
                ].map((item) => (
                  <li key={item.id}>
                    <button
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center gap-3 ${
                        activeTab === item.id
                          ? 'bg-orange-100 text-orange-700 font-medium'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {activeTab === 'products' && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Vos Produits</h2>
                  <button
                    onClick={() => setShowProductForm(!showProductForm)}
                    className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Ajouter
                  </button>
                </div>

                {showProductForm && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-center text-gray-500">Formulaire simplifié (simulation)</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {products.map((product) => (
                    <div key={product.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="h-32 bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                        <Package className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="font-bold">{product.name}</h3>
                      <p className="text-sm text-gray-600 mb-2">{product.description}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-orange-600 font-bold">{product.price} FCFA</span>
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Stock: {product.stock_quantity}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="bg-white rounded-xl shadow-sm p-6 text-center py-12">
                <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900">Statistiques</h3>
                <p className="text-gray-500">Données en cours de collecte...</p>
              </div>
            )}

            {activeTab === 'video' && (
              <div className="bg-white rounded-xl shadow-sm p-6 h-[600px]">
                 <iframe 
                    src="/video-call-manager" 
                    className="w-full h-full border-0 rounded-lg"
                    title="Video Manager"
                 />
              </div>
            )}
            
            {activeTab === 'live' && (
              <div className="bg-white rounded-xl shadow-sm p-6 h-[600px]">
                 <iframe 
                    src="/live-shopping" 
                    className="w-full h-full border-0 rounded-lg"
                    title="Live Shopping"
                 />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorDashboardSimple;