import React, { useState, useEffect } from 'react'
import { Store, User, ShoppingCart, Settings, LogOut, Globe, Menu, X } from 'lucide-react'
import { create } from 'zustand'

// Store global pour la gestion d'état
const useStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  currentRole: 'client',
  language: 'fr',
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setCurrentRole: (role) => set({ currentRole: role }),
  setLanguage: (lang) => set({ language: lang }),
  logout: () => set({ user: null, isAuthenticated: false, currentRole: 'client' })
}))

// Composants des interfaces
const AdminDashboard = () => {
  const { user, language } = useStore()
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Tableau de Bord Administrateur</h1>
          <p className="text-gray-600 mt-2">Gérez les vendeurs et la plateforme</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Store className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Vendeurs Actifs</p>
                <p className="text-2xl font-bold text-gray-900">24</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <ShoppingCart className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Produits Totaux</p>
                <p className="text-2xl font-bold text-gray-900">156</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Clients</p>
                <p className="text-2xl font-bold text-gray-900">1,234</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Gestion des Vendeurs</h2>
          </div>
          <div className="p-6">
            <div className="mb-4">
              <button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium">
                + Ajouter un vendeur
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produits</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Boutique Mamadou</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">mamadou@example.com</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Actif
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">12</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-orange-600 hover:text-orange-900 mr-3">Modifier</button>
                      <button className="text-red-600 hover:text-red-900">Désactiver</button>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Artisan Fatou</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">fatou@example.com</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Actif
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">8</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-orange-600 hover:text-orange-900 mr-3">Modifier</button>
                      <button className="text-red-600 hover:text-red-900">Désactiver</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const VendorDashboard = () => {
  const { user, language } = useStore()
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Tableau de Bord Vendeur</h1>
          <p className="text-gray-600 mt-2">Gérez votre boutique et vos produits</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Store className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Produits</p>
                <p className="text-2xl font-bold text-gray-900">12</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <ShoppingCart className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Ventes</p>
                <p className="text-2xl font-bold text-gray-900">24</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Clients</p>
                <p className="text-2xl font-bold text-gray-900">156</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Settings className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Revenu</p>
                <p className="text-2xl font-bold text-gray-900">450€</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Mes Produits</h2>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium">
                  + Ajouter un produit
                </button>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gray-200 rounded-lg mr-4"></div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">Cocomm DT740</h3>
                      <p className="text-sm text-gray-500">150€ • Stock: 10</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button className="text-orange-600 hover:text-orange-900">Modifier</button>
                    <button className="text-red-600 hover:text-red-900">Supprimer</button>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gray-200 rounded-lg mr-4"></div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">Téléphone Samsung</h3>
                      <p className="text-sm text-gray-500">250€ • Stock: 5</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button className="text-orange-600 hover:text-orange-900">Modifier</button>
                    <button className="text-red-600 hover:text-red-900">Supprimer</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Configuration de la Boutique</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nom de la boutique</label>
                  <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" value="Boutique Mamadou" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" rows="3">Votre boutique de confiance pour les produits électroniques</textarea>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Logo</label>
                  <div className="w-24 h-24 bg-gray-200 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:bg-gray-100">
                    <span className="text-gray-500 text-sm">+ Logo</span>
                  </div>
                </div>
                <button className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium">
                  Sauvegarder les modifications
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const ClientMarketplace = () => {
  const { user, language } = useStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [cart, setCart] = useState([])
  
  const products = [
    {
      id: 1,
      name: 'Cocomm DT740',
      price: 150,
      category: 'Électronique',
      vendor: 'Boutique Mamadou',
      image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Modern%20electronic%20device%20DT740%20minimalist%20design%20on%20white%20background%20professional%20product%20photography&image_size=square_hd',
      rating: 4.8,
      reviews: 24
    },
    {
      id: 2,
      name: 'Téléphone Samsung',
      price: 250,
      category: 'Téléphonie',
      vendor: 'Artisan Fatou',
      image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Samsung%20smartphone%20modern%20design%20on%20white%20background%20professional%20product%20photography&image_size=square_hd',
      rating: 4.6,
      reviews: 18
    },
    {
      id: 3,
      name: 'Ordinateur Portable',
      price: 450,
      category: 'Informatique',
      vendor: 'Boutique Mamadou',
      image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Laptop%20computer%20modern%20design%20on%20white%20background%20professional%20product%20photography&image_size=square_hd',
      rating: 4.7,
      reviews: 32
    }
  ]
  
  const categories = ['all', 'Électronique', 'Téléphonie', 'Informatique', 'Maison', 'Mode']
  
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.vendor.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory
    return matchesSearch && matchesCategory
  })
  
  const addToCart = (product) => {
    setCart(prev => [...prev, { ...product, quantity: 1 }])
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">MangooTech Marketplace</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Rechercher des produits..."
                  className="w-64 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button className="relative p-2 text-gray-600 hover:text-gray-900">
                <ShoppingCart className="h-6 w-6" />
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {cart.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Catégories */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg font-medium ${
                  selectedCategory === category
                    ? 'bg-orange-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                }`}
              >
                {category === 'all' ? 'Tous' : category}
              </button>
            ))}
          </div>
        </div>
        
        {/* Produits */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map(product => (
            <div key={product.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
              <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-t-lg bg-gray-200">
                <img
                  src={product.image}
                  alt={product.name}
                  className="h-48 w-full object-cover"
                />
              </div>
              <div className="p-4">
                <div className="mb-2">
                  <h3 className="text-lg font-medium text-gray-900">{product.name}</h3>
                  <p className="text-sm text-gray-500">par {product.vendor}</p>
                </div>
                <div className="flex items-center mb-2">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className={`text-sm ${i < Math.floor(product.rating) ? 'text-yellow-400' : 'text-gray-300'}`}>
                        ★
                      </span>
                    ))}
                    <span className="ml-2 text-sm text-gray-600">({product.reviews})</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-gray-900">{product.price}€</span>
                  <button
                    onClick={() => addToCart(product)}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium"
                  >
                    Ajouter
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const LoginForm = ({ onLogin }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  
  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    
    // Utilisateurs de démonstration
    const demoUsers = {
      'admin@mangoo.tech': { name: 'Administrateur', role: 'admin', email: 'admin@mangoo.tech' },
      'vendor@example.com': { name: 'Commerçant Demo', role: 'vendor', email: 'vendor@example.com' },
      'client@example.com': { name: 'Client Demo', role: 'client', email: 'client@example.com' }
    }
    
    if (demoUsers[email] && password === 'demo123') {
      onLogin(demoUsers[email])
    } else {
      setError('Email ou mot de passe incorrect')
    }
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-green-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-500 rounded-full mb-4">
            <Store className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">MangooTech</h1>
          <p className="text-gray-600 mt-2">Plateforme de Mini-Boutiques</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Connexion</h2>
          
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="admin@mangoo.tech"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mot de passe
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="demo123"
                required
              />
            </div>
            
            <button
              type="submit"
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Se connecter
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 mb-4">Comptes de démonstration :</p>
            <div className="space-y-2 text-xs text-gray-500">
              <div>Admin: admin@mangoo.tech / demo123</div>
              <div>Vendeur: vendor@example.com / demo123</div>
              <div>Client: client@example.com / demo123</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const Header = ({ user, onLogout }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center mr-3">
                  <Store className="h-5 w-5 text-white" />
                </div>
                <h1 className="text-xl font-bold text-gray-900">MangooTech</h1>
              </div>
            </div>
          </div>
          
          <div className="hidden md:block">
            <div className="ml-4 flex items-center md:ml-6">
              <div className="relative">
                <button className="bg-gray-100 rounded-full p-1 text-gray-400 hover:text-gray-500">
                  <Globe className="h-5 w-5" />
                </button>
              </div>
              
              <div className="ml-3 relative">
                <div className="flex items-center">
                  <div className="text-sm text-gray-700 mr-3">
                    <span className="font-medium">{user?.name}</span>
                    <span className="text-xs text-gray-500 block capitalize">{user?.role}</span>
                  </div>
                  <button
                    onClick={onLogout}
                    className="bg-gray-100 rounded-full p-2 text-gray-400 hover:text-gray-500"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="-mr-2 flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="bg-gray-100 inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-200"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>
      
      {mobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t border-gray-200">
            <div className="px-3 py-2">
              <div className="text-sm text-gray-700">
                <span className="font-medium">{user?.name}</span>
                <span className="text-xs text-gray-500 block capitalize">{user?.role}</span>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
            >
              Déconnexion
            </button>
          </div>
        </div>
      )}
    </header>
  )
}

function App() {
  const { user, isAuthenticated, currentRole, setUser, logout } = useStore()
  
  const handleLogin = (userData) => {
    setUser(userData)
  }
  
  const handleLogout = () => {
    logout()
  }
  
  // Si l'utilisateur n'est pas connecté, afficher le formulaire de connexion
  if (!isAuthenticated) {
    return <LoginForm onLogin={handleLogin} />
  }
  
  // Rendre l'interface appropriée selon le rôle
  const renderDashboard = () => {
    switch (user?.role) {
      case 'admin':
        return <AdminDashboard />
      case 'vendor':
        return <VendorDashboard />
      case 'client':
        return <ClientMarketplace />
      default:
        return <ClientMarketplace />
    }
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} onLogout={handleLogout} />
      {renderDashboard()}
    </div>
  )
}

export default App