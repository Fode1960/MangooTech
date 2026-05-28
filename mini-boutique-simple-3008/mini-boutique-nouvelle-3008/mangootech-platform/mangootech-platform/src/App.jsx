import React, { useState, useEffect } from 'react';
import { create } from 'zustand';

// Store global pour la gestion d'état
const useStore = create((set) => ({
  user: null,
  currentView: 'login',
  setUser: (user) => set({ user }),
  setCurrentView: (view) => set({ currentView: view }),
}));

// Composants d'interface par rôle
const AdminDashboard = () => {
  const { setCurrentView } = useStore();
  
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-mangoo-orange text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">🛍️ MangooTech Admin</h1>
          <button 
            onClick={() => setCurrentView('login')}
            className="bg-white text-mangoo-orange px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors"
          >
            Déconnexion
          </button>
        </div>
      </header>
      
      <div className="container mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">👥 Vendeurs</h3>
            <p className="text-3xl font-bold text-mangoo-green">24</p>
            <p className="text-gray-600">Actifs ce mois</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">🏪 Mini-Boutiques</h3>
            <p className="text-3xl font-bold text-mangoo-orange">18</p>
            <p className="text-gray-600">En ligne</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">💰 Revenus</h3>
            <p className="text-3xl font-bold text-green-600">2.4M FCFA</p>
            <p className="text-gray-600">Ce mois</p>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">📝 Gestion des Vendeurs</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Nom</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Statut</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4">Mamadou Diallo</td>
                  <td className="py-3 px-4">mamadou@boutique.com</td>
                  <td className="py-3 px-4"><span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm">Actif</span></td>
                  <td className="py-3 px-4">
                    <button className="bg-mangoo-orange text-white px-3 py-1 rounded text-sm hover:bg-orange-600 transition-colors">
                      Voir
                    </button>
                  </td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4">Aminata Sow</td>
                  <td className="py-3 px-4">aminata@fashion.sn</td>
                  <td className="py-3 px-4"><span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-sm">En attente</span></td>
                  <td className="py-3 px-4">
                    <button className="bg-mangoo-green text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors">
                      Approuver
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

const VendorDashboard = () => {
  const { setCurrentView } = useStore();
  
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-mangoo-green text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">🏪 Ma Mini-Boutique</h1>
          <button 
            onClick={() => setCurrentView('login')}
            className="bg-white text-mangoo-green px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors"
          >
            Déconnexion
          </button>
        </div>
      </header>
      
      <div className="container mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">📦 Produits</h3>
            <p className="text-3xl font-bold text-mangoo-orange">45</p>
            <p className="text-gray-600">En stock</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">📱 Vues</h3>
            <p className="text-3xl font-bold text-mangoo-green">1,234</p>
            <p className="text-gray-600">Cette semaine</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">💰 Ventes</h3>
            <p className="text-3xl font-bold text-green-600">485K FCFA</p>
            <p className="text-gray-600">Ce mois</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">➕ Ajouter un Produit</h2>
            <form className="space-y-4">
              <input 
                type="text" 
                placeholder="Nom du produit" 
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mangoo-orange focus:border-transparent"
              />
              <textarea 
                placeholder="Description" 
                rows="3" 
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mangoo-orange focus:border-transparent"
              />
              <div className="grid grid-cols-2 gap-4">
                <input 
                  type="number" 
                  placeholder="Prix (FCFA)" 
                  className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mangoo-orange focus:border-transparent"
                />
                <input 
                  type="number" 
                  placeholder="Stock" 
                  className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mangoo-orange focus:border-transparent"
                />
              </div>
              <button className="w-full bg-mangoo-orange text-white py-3 rounded-lg font-medium hover:bg-orange-600 transition-colors">
                📤 Ajouter le Produit
              </button>
            </form>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">📊 Statistiques</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Taux de conversion</span>
                <span className="font-bold text-mangoo-green">3.2%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Panier moyen</span>
                <span className="font-bold text-mangoo-orange">12,500 FCFA</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Clients fidèles</span>
                <span className="font-bold text-mangoo-green">89</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ClientMarketplace = () => {
  const { setCurrentView } = useStore();
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  const categories = [
    { id: 'all', name: 'Tous', icon: '🛍️' },
    { id: 'electronics', name: 'Électronique', icon: '📱' },
    { id: 'fashion', name: 'Mode', icon: '👗' },
    { id: 'food', name: 'Alimentation', icon: '🥘' },
    { id: 'crafts', name: 'Artisanat', icon: '🎨' },
  ];
  
  const products = [
    {
      id: 1,
      name: 'Téléphone Samsung A12',
      price: 125000,
      vendor: 'TechStore Dakar',
      rating: 4.5,
      category: 'electronics',
      image: '📱'
    },
    {
      id: 2,
      name: 'Robe Wax Traditionnelle',
      price: 35000,
      vendor: 'Fashion d\'Afrique',
      rating: 4.8,
      category: 'fashion',
      image: '👗'
    },
    {
      id: 3,
      name: 'Thieboudienne Maison',
      price: 2500,
      vendor: 'Chez Awa',
      rating: 4.9,
      category: 'food',
      image: '🥘'
    },
    {
      id: 4,
      name: 'Collier Perles Traditionnel',
      price: 15000,
      vendor: 'Artisanat Local',
      rating: 4.7,
      category: 'crafts',
      image: '🎨'
    }
  ];
  
  const filteredProducts = selectedCategory === 'all' 
    ? products 
    : products.filter(p => p.category === selectedCategory);
  
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-mangoo-orange to-mangoo-green text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">🛍️ MangooTech Marketplace</h1>
          <div className="flex items-center space-x-4">
            <button className="bg-white text-mangoo-orange px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors">
              🛒 Panier (0)
            </button>
            <button 
              onClick={() => setCurrentView('login')}
              className="bg-white text-mangoo-green px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </header>
      
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">🎯 Catégories</h2>
          <div className="flex flex-wrap gap-4">
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-6 py-3 rounded-xl font-medium transition-all ${
                  selectedCategory === category.id
                    ? 'bg-mangoo-orange text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <span className="text-xl mr-2">{category.icon}</span>
                {category.name}
              </button>
            ))}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map(product => (
            <div key={product.id} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow">
              <div className="p-4 text-center">
                <div className="text-6xl mb-4">{product.image}</div>
                <h3 className="font-bold text-gray-800 mb-2">{product.name}</h3>
                <p className="text-sm text-gray-600 mb-2">par {product.vendor}</p>
                <div className="flex items-center justify-center mb-3">
                  <span className="text-yellow-500">{'⭐'.repeat(Math.floor(product.rating))}</span>
                  <span className="text-sm text-gray-600 ml-1">({product.rating})</span>
                </div>
                <p className="text-xl font-bold text-mangoo-orange mb-4">{product.price.toLocaleString()} FCFA</p>
                <button className="w-full bg-mangoo-green text-white py-2 rounded-lg font-medium hover:bg-green-700 transition-colors">
                  🛒 Ajouter au panier
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const LoginPage = () => {
  const { setUser, setCurrentView } = useStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const demoUsers = {
    'admin@mangoo.tech': { name: 'Administrateur', role: 'admin', password: 'admin123' },
    'vendor@example.com': { name: 'Commerçant Demo', role: 'vendor', password: 'vendor123' },
    'client@example.com': { name: 'Client Demo', role: 'client', password: 'client123' }
  };
  
  const handleLogin = (e) => {
    e.preventDefault();
    setError('');
    
    const user = demoUsers[email];
    if (user && user.password === password) {
      setUser({ ...user, email });
      if (user.role === 'admin') {
        setCurrentView('admin');
      } else if (user.role === 'vendor') {
        setCurrentView('vendor');
      } else {
        setCurrentView('client');
      }
    } else {
      setError('Identifiants incorrects');
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-mangoo-orange via-orange-100 to-mangoo-green flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🛍️</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">MangooTech</h1>
          <p className="text-gray-600">Plateforme de Mini-Boutiques</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-gray-700 font-medium mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mangoo-orange focus:border-transparent"
              placeholder="admin@mangoo.tech"
              required
            />
          </div>
          
          <div>
            <label className="block text-gray-700 font-medium mb-2">Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mangoo-orange focus:border-transparent"
              placeholder="admin123"
              required
            />
          </div>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
          
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-mangoo-orange to-mangoo-green text-white py-3 rounded-lg font-medium hover:shadow-lg transition-all transform hover:scale-105"
          >
            🔐 Se connecter
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 mb-2">📝 Comptes de démonstration :</p>
          <div className="text-xs text-gray-500 space-y-1">
            <p>Admin: admin@mangoo.tech / admin123</p>
            <p>Vendeur: vendor@example.com / vendor123</p>
            <p>Client: client@example.com / client123</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Configuration Tailwind CSS
const GlobalStyles = () => (
  <style jsx global>{`
    :root {
      --mangoo-orange: #ff6b35;
      --mangoo-green: #1a5f3f;
    }
    .bg-mangoo-orange { background-color: var(--mangoo-orange); }
    .bg-mangoo-green { background-color: var(--mangoo-green); }
    .text-mangoo-orange { color: var(--mangoo-orange); }
    .text-mangoo-green { color: var(--mangoo-green); }
    .from-mangoo-orange { --tw-gradient-from: var(--mangoo-orange); }
    .to-mangoo-green { --tw-gradient-to: var(--mangoo-green); }
  `}</style>
);

function App() {
  const { user, currentView } = useStore();
  
  return (
    <div className="App">
      <GlobalStyles />
      {currentView === 'login' && <LoginPage />}
      {currentView === 'admin' && <AdminDashboard />}
      {currentView === 'vendor' && <VendorDashboard />}
      {currentView === 'client' && <ClientMarketplace />}
    </div>
  );
}

export default App;