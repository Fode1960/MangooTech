import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { create } from 'zustand';
import { useThemeStore } from './stores/themeStore';
import { ThemeToggle } from './components/ThemeToggle';
import { PaymentMethods } from './components/PaymentMethodsStable';
import { ErrorBoundary } from './components/ErrorBoundary';
import { PaymentAnalyticsDashboard } from './components/PaymentAnalyticsDashboardSimple';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import AdminDashboard from './pages/AdminDashboard';
import AdminShops from './pages/AdminShops';
import AdminCommissions from './pages/AdminCommissions';
import AdminUsers from './pages/AdminUsers';
import AdminCreateShop from './pages/AdminCreateShop';
import AdminPayments from './pages/AdminPayments';
import AdminWallet from './pages/AdminWallet';
import AdminNavigation from './components/AdminNavigation';
import SimpleTest from './pages/SimpleTest';
import ProductCard from './components/OptimizedProductCard';
import MarketplaceFilters from './components/MarketplaceFilters';
import PerformanceMonitor from './components/PerformanceMonitor';
import AfricanInnovationHub from './components/AfricanInnovationHub';

// Store optimisé avec Zustand
const useStore = create((set, get) => ({
  user: null,
  currentRole: 'client',
  products: [],
  vendors: [],
  orders: [],
  cart: [],
  wishlist: [],
  
  // Filtres et recherche
  searchQuery: '',
  selectedCategory: 'all',
  priceRange: [0, 200000],
  selectedRating: 0,
  selectedSort: 'name',
  
  // Actions optimisées
  setUser: (user) => set({ user, currentRole: user?.role || 'client' }),
  setProducts: (products) => set({ products }),
  setVendors: (vendors) => set({ vendors }),
  setOrders: (orders) => set({ orders }),
  
  addToCart: (product) => set((state) => {
    const existing = state.cart.find(item => item.id === product.id);
    if (existing) {
      return {
        cart: state.cart.map(item => 
          item.id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      };
    }
    return { cart: [...state.cart, { ...product, quantity: 1 }] };
  }),
  
  removeFromCart: (productId) => set((state) => ({
    cart: state.cart.filter(item => item.id !== productId)
  })),
  
  updateCartQuantity: (productId, quantity) => set((state) => {
    if (quantity <= 0) {
      return { cart: state.cart.filter(item => item.id !== productId) };
    }
    return {
      cart: state.cart.map(item => 
        item.id === productId ? { ...item, quantity } : item
      )
    };
  }),
  
  toggleWishlist: (productId) => set((state) => {
    const isInWishlist = state.wishlist.includes(productId);
    if (isInWishlist) {
      return { wishlist: state.wishlist.filter(id => id !== productId) };
    }
    return { wishlist: [...state.wishlist, productId] };
  }),
  
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSelectedCategory: (selectedCategory) => set({ selectedCategory }),
  setPriceRange: (priceRange) => set({ priceRange }),
  setSelectedRating: (selectedRating) => set({ selectedRating }),
  setSelectedSort: (selectedSort) => set({ selectedSort }),
  
  clearFilters: () => set({
    searchQuery: '',
    selectedCategory: 'all',
    priceRange: [0, 200000],
    selectedRating: 0,
    selectedSort: 'name'
  })
}));

// Composant de connexion optimisé
const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { isDark } = useThemeStore();

  const handleLogin = useCallback((e) => {
    e.preventDefault();
    
    const normalizedEmail = email.toLowerCase().trim();
    
    const demoUsers = {
      'admin@mangoo.tech': { 
        id: 1, 
        name: 'Administrateur', 
        role: 'admin', 
        email: 'admin@mangoo.tech',
        avatar: '👨‍💼'
      },
      'vendor@example.com': { 
        id: 2, 
        name: 'Commerçant Demo', 
        role: 'vendor', 
        email: 'vendor@example.com',
        shopName: 'Boutique Demo',
        avatar: '👨‍🎨'
      },
      'client@example.com': { 
        id: 3, 
        name: 'Client Demo', 
        role: 'client', 
        email: 'client@example.com',
        avatar: '🧑‍💻'
      },
      'vendeur@exemple.com': { 
        id: 2, 
        name: 'Commerçant Demo', 
        role: 'vendor', 
        email: 'vendor@example.com',
        shopName: 'Boutique Demo',
        avatar: '👨‍🎨'
      },
      'vendeur@example.com': { 
        id: 2, 
        name: 'Commerçant Demo', 
        role: 'vendor', 
        email: 'vendor@example.com',
        shopName: 'Boutique Demo',
        avatar: '👨‍🎨'
      }
    };

    const user = demoUsers[normalizedEmail];
    if (user && (password === 'admin123' || password === 'vendor123' || password === 'client123')) {
      onLogin(user);
      setError('');
    } else {
      setError('Identifiants incorrects');
    }
  }, [email, password]);

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-300 ${
      isDark 
        ? 'bg-gradient-to-br from-gray-900 to-gray-800' 
        : 'bg-gradient-to-br from-orange-50 to-green-50'
    }`}>
      <div className={`max-w-md w-full rounded-2xl shadow-2xl p-8 transition-colors duration-300 ${
        isDark 
          ? 'bg-gray-800 border border-gray-700' 
          : 'bg-white'
      }`}>
        <div className="text-center mb-8">
          <div className="text-6xl mb-4 animate-bounce">🛍️</div>
          <h1 className={`text-3xl font-bold bg-gradient-to-r from-orange-500 to-green-600 bg-clip-text text-transparent`}>
            MangooTech
          </h1>
          <p className={`text-sm mt-2 transition-colors duration-300 ${
            isDark ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Connectez-vous pour accéder à la plateforme
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full px-4 py-3 rounded-lg border transition-colors duration-300 ${
                isDark 
                  ? 'bg-gray-700 border-gray-600 text-white focus:ring-orange-500 focus:border-orange-500' 
                  : 'bg-white border-gray-300 text-gray-900 focus:ring-orange-500 focus:border-orange-500'
              }`}
              placeholder="admin@mangoo.tech"
              required
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full px-4 py-3 rounded-lg border transition-colors duration-300 ${
                isDark 
                  ? 'bg-gray-700 border-gray-600 text-white focus:ring-orange-500 focus:border-orange-500' 
                  : 'bg-white border-gray-300 text-gray-900 focus:ring-orange-500 focus:border-orange-500'
              }`}
              placeholder="admin123"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-orange-500 to-green-600 text-white py-3 px-4 rounded-lg font-medium hover:from-orange-600 hover:to-green-700 transition-all duration-300 transform hover:scale-105"
          >
            Se connecter
          </button>
        </form>

        <div className={`mt-6 text-center text-xs transition-colors duration-300 ${
          isDark ? 'text-gray-400' : 'text-gray-500'
        }`}>
          <p className="mb-2">Comptes de démonstration :</p>
          <div className="space-y-1">
            <p><span className="font-mono">admin@mangoo.tech</span> / admin123</p>
            <p><span className="font-mono">vendor@example.com</span> / vendor123</p>
            <p><span className="font-mono">client@example.com</span> / client123</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Interface Vendeur optimisée
const VendorDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [VendorStats, setVendorStats] = useState(null);
  const [VendorStockManager, setVendorStockManager] = useState(null);
  const [VendorOrderHistory, setVendorOrderHistory] = useState(null);
  const [VendorNotifications, setVendorNotifications] = useState(null);
  const { isDark } = useThemeStore();

  // Chargement dynamique des composants
  useEffect(() => {
    const loadComponents = async () => {
      try {
        const statsModule = await import('./components/VendorStats');
        setVendorStats(() => statsModule.default);
        
        const stockModule = await import('./components/VendorStockManager');
        setVendorStockManager(() => stockModule.default);
        
        const ordersModule = await import('./components/VendorOrderHistory');
        setVendorOrderHistory(() => ordersModule.default);
        
        const notificationsModule = await import('./components/VendorNotifications');
        setVendorNotifications(() => notificationsModule.default);
      } catch (error) {
        console.error('Erreur lors du chargement des composants:', error);
      }
    };

    loadComponents();
  }, []);

  const tabs = [
    { id: 'overview', name: 'Vue d\'ensemble', icon: '📊' },
    { id: 'stock', name: 'Gestion Stock', icon: '📦' },
    { id: 'orders', name: 'Commandes', icon: '🛒' },
    { id: 'notifications', name: 'Notifications', icon: '🔔' }
  ];

  const renderTabContent = useCallback(() => {
    switch (activeTab) {
      case 'overview':
        return VendorStats ? <VendorStats vendorId="vendor-demo" /> : <div>Chargement...</div>;
      case 'stock':
        return VendorStockManager ? <VendorStockManager vendorId="vendor-demo" /> : <div>Chargement...</div>;
      case 'orders':
        return VendorOrderHistory ? <VendorOrderHistory vendorId="vendor-demo" /> : <div>Chargement...</div>;
      case 'notifications':
        return VendorNotifications ? <VendorNotifications vendorId="vendor-demo" /> : <div>Chargement...</div>;
      default:
        return VendorStats ? <VendorStats vendorId="vendor-demo" /> : <div>Chargement...</div>;
    }
  }, [activeTab, VendorStats, VendorStockManager, VendorOrderHistory, VendorNotifications]);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className={`text-3xl font-bold mb-4 transition-colors duration-300 ${
          isDark ? 'text-white' : 'text-gray-900'
        }`}>
          Tableau de bord vendeur
        </h1>
        
        <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-orange-500 text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6">
        {renderTabContent()}
      </div>
    </div>
  );
};

// Interface Client optimisée
const ClientMarketplace = () => {
  const { products, cart, wishlist, searchQuery, selectedCategory, priceRange, selectedRating, selectedSort } = useStore();
  const [showPayment, setShowPayment] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const { isDark } = useThemeStore();

  const categories = useMemo(() => [
    { id: 'all', name: 'Tous', icon: '🛍️' },
    { id: 'electronics', name: 'Électronique', icon: '📱' },
    { id: 'fashion', name: 'Mode', icon: '👕' },
    { id: 'food', name: 'Alimentation', icon: '🍲' },
    { id: 'handicraft', name: 'Artisanat', icon: '🎨' }
  ], []);

  // Fonctions optimisées avec useCallback
  const parsePrice = useCallback((priceStr) => {
    return parseFloat(priceStr.replace(/[^\d]/g, ''));
  }, []);

  const addToCart = useCallback((product) => {
    useStore.getState().addToCart(product);
  }, []);

  const removeFromCart = useCallback((productId) => {
    useStore.getState().removeFromCart(productId);
  }, []);

  const updateQuantity = useCallback((productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    useStore.getState().updateCartQuantity(productId, quantity);
  }, [removeFromCart]);

  const toggleWishlist = useCallback((productId) => {
    useStore.getState().toggleWishlist(productId);
  }, []);

  const handleQuickView = useCallback((product) => {
    setSelectedProduct(product);
  }, []);

  const clearFilters = useCallback(() => {
    useStore.getState().clearFilters();
  }, []);

  // Calcul optimisé du total du panier
  const cartTotal = useMemo(() => {
    return cart.reduce((total, item) => {
      const price = parseFloat(item.price.replace(/[^\d]/g, ''));
      return total + (price * item.quantity);
    }, 0);
  }, [cart, parsePrice]);

  // Filtrage et tri optimisés
  const filteredProducts = useMemo(() => {
    if (!products || products.length === 0) return [];

    return products
      .filter(product => {
        if (selectedCategory !== 'all' && product.category !== selectedCategory) return false;
        if (searchQuery && !product.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
            !product.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        const price = parsePrice(product.price);
        if (price < priceRange[0] || price > priceRange[1]) return false;
        if (selectedRating > 0 && product.rating < selectedRating) return false;
        return true;
      })
      .sort((a, b) => {
        switch (selectedSort) {
          case 'price-low':
            return parsePrice(a.price) - parsePrice(b.price);
          case 'price-high':
            return parsePrice(b.price) - parsePrice(a.price);
          case 'rating':
            return b.rating - a.rating;
          case 'name':
          default:
            return a.name.localeCompare(b.name);
        }
      });
  }, [products, searchQuery, selectedCategory, priceRange, selectedRating, selectedSort, parsePrice]);

  // Calcul optimisé du nombre de filtres actifs
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchQuery) count++;
    if (selectedCategory !== 'all') count++;
    if (priceRange[0] > 0 || priceRange[1] < 200000) count++;
    if (selectedRating > 0) count++;
    if (selectedSort !== 'name') count++;
    return count;
  }, [searchQuery, selectedCategory, priceRange, selectedRating, selectedSort]);

  const handlePaymentSuccess = useCallback((transaction) => {
    alert(`Paiement réussi! Transaction ID: ${transaction.id}`);
    useStore.getState().setCart([]);
    setShowPayment(false);
  }, []);

  const handlePaymentError = useCallback((error) => {
    alert(`Erreur de paiement: ${error.message}`);
  }, []);

  return (
    <div className="p-6">
      {/* En-tête avec panier */}
      <div className="flex justify-between items-center mb-8">
        <div className="text-center flex-1">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-orange-500 to-green-600 bg-clip-text text-transparent">
            Marketplace MangooTech
          </h1>
          <p className={`text-lg transition-colors duration-300 ${
            isDark ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Découvrez les meilleurs produits des commerçants africains
          </p>
        </div>
        
        {/* Panier */}
        <div className={`relative rounded-xl shadow-lg p-4 transition-colors duration-300 ${
          isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white'
        }`}>
          <div className="flex items-center space-x-2">
            <span className="text-2xl">🛒</span>
            <div>
              <p className={`font-medium transition-colors duration-300 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>Panier</p>
              <p className={`text-sm transition-colors duration-300 ${
                isDark ? 'text-gray-400' : 'text-gray-600'
              }`}>{cart.length} articles</p>
            </div>
          </div>
          {cart.length > 0 && (
            <div className="mt-2">
              <p className={`text-lg font-bold text-orange-600`}>
                {cartTotal.toLocaleString()} FCFA
              </p>
              <button
                onClick={() => setShowPayment(true)}
                className="w-full mt-2 bg-gradient-to-r from-orange-500 to-green-600 text-white py-2 px-4 rounded-lg font-medium hover:from-orange-600 hover:to-green-700 transition-all text-sm"
              >
                Payer maintenant
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Interface de paiement */}
      {showPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto transition-colors duration-300 ${
            isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white'
          }`}>
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className={`text-2xl font-bold transition-colors duration-300 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>Finaliser votre commande</h2>
                <button
                  onClick={() => setShowPayment(false)}
                  className={`text-2xl transition-colors duration-300 ${
                    isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  ✕
                </button>
              </div>
              
              {/* Résumé du panier */}
              <div className={`rounded-lg p-4 mb-6 transition-colors duration-300 ${
                isDark ? 'bg-gray-700 border border-gray-600' : 'bg-gray-50 border border-gray-200'
              }`}>
                <h3 className={`font-semibold mb-3 transition-colors duration-300 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>Votre commande:</h3>
                <div className="space-y-2">
                  {cart.map((item) => (
                    <div key={item.id} className="flex justify-between items-center">
                      <div>
                        <span className={`font-medium transition-colors duration-300 ${
                          isDark ? 'text-white' : 'text-gray-900'
                        }`}>{item.name}</span>
                        <span className={`text-sm transition-colors duration-300 ${
                          isDark ? 'text-gray-400' : 'text-gray-600'
                        }`}> × {item.quantity}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-orange-600">
                          {(parseFloat(item.price.replace(/[^\d]/g, '')) * item.quantity).toLocaleString()} FCFA
                        </span>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="pt-3 mt-3 border-t border-gray-300">
                  <div className="flex justify-between items-center">
                    <span className={`font-bold transition-colors duration-300 ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}>Total:</span>
                    <span className="font-bold text-xl text-orange-600">
                      {cartTotal.toLocaleString()} FCFA
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Méthodes de paiement */}
              <ErrorBoundary>
                <PaymentMethods
                  amount={cartTotal}
                  currency="XOF"
                  country="CI"
                  onPaymentSuccess={handlePaymentSuccess}
                  onPaymentError={handlePaymentError}
                />
              </ErrorBoundary>
            </div>
          </div>
        </div>
      )}

      {/* Système de filtres avancés */}
      <MarketplaceFilters
        categories={categories}
        priceRange={priceRange}
        selectedCategory={selectedCategory}
        selectedPriceRange={priceRange}
        selectedRating={selectedRating}
        selectedSort={selectedSort}
        searchQuery={searchQuery}
        onCategoryChange={(category) => useStore.getState().setSelectedCategory(category)}
        onPriceRangeChange={(range) => useStore.getState().setPriceRange(range)}
        onRatingChange={(rating) => useStore.getState().setSelectedRating(rating)}
        onSortChange={(sort) => useStore.getState().setSelectedSort(sort)}
        onSearchChange={(query) => useStore.getState().setSearchQuery(query)}
        onClearFilters={clearFilters}
        activeFiltersCount={activeFiltersCount}
      />

      {/* Grille de produits professionnelle */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-8">
        {filteredProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onAddToCart={addToCart}
            onQuickView={handleQuickView}
            onToggleWishlist={toggleWishlist}
            isInWishlist={wishlist.includes(product.id)}
            isInCart={cart.some(item => item.id === product.id)}
          />
        ))}
      </div>

      {/* Message si aucun produit trouvé */}
      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className={`text-xl font-semibold mb-2 ${
            isDark ? 'text-gray-300' : 'text-gray-700'
          }`}>
            Aucun produit trouvé
          </h3>
          <p className={`${
            isDark ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Essayez d'ajuster vos filtres de recherche
          </p>
        </div>
      )}

      {/* Modal d'aperçu rapide */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto transition-colors duration-300 ${
            isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white'
          }`}>
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className={`text-2xl font-bold transition-colors duration-300 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>{selectedProduct.name}</h2>
                <button
                  onClick={() => setSelectedProduct(null)}
                  className={`text-2xl transition-colors duration-300 ${
                    isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  ✕
                </button>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className={`h-64 flex items-center justify-center rounded-lg ${
                  isDark 
                    ? 'bg-gradient-to-br from-gray-700 to-gray-600' 
                    : 'bg-gradient-to-br from-orange-100 to-green-100'
                }`}>
                  <span className="text-8xl">{selectedProduct.icon}</span>
                </div>
                
                <div>
                  <p className={`text-lg mb-4 transition-colors duration-300 ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>{selectedProduct.description}</p>
                  
                  <div className="flex items-center mb-4">
                    <div className="flex text-yellow-400">
                      {'★'.repeat(selectedProduct.rating)}
                    </div>
                    <span className={`text-sm ml-2 transition-colors duration-300 ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>({selectedProduct.reviews} avis)</span>
                  </div>
                  
                  <div className="mb-4">
                    <span className="text-3xl font-bold text-orange-600">{selectedProduct.price}</span>
                  </div>
                  
                  <div className="mb-4">
                    <span className={`text-sm transition-colors duration-300 ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>Vendeur: {selectedProduct.vendor}</span>
                  </div>
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={() => {
                        addToCart(selectedProduct);
                        setSelectedProduct(null);
                      }}
                      className="flex-1 bg-gradient-to-r from-orange-500 to-green-600 text-white py-3 px-6 rounded-lg font-medium hover:from-orange-600 hover:to-green-700 transition-all"
                    >
                      Ajouter au panier
                    </button>
                    <button
                      onClick={() => toggleWishlist(selectedProduct.id)}
                      className={`px-4 py-3 rounded-lg border transition-all ${
                        wishlist.includes(selectedProduct.id)
                          ? 'bg-red-50 border-red-200 text-red-600'
                          : isDark
                          ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                          : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      ♥
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Layout Admin avec React Router
const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark } = useThemeStore();

  return (
    <div className={`min-h-screen flex transition-colors duration-300 ${
      isDark 
        ? 'bg-gradient-to-br from-gray-900 to-gray-800' 
        : 'bg-gray-50'
    }`}>
      <AdminNavigation />
      
      <div className="flex-1 flex flex-col">
        {/* Barre d'outils */}
        <div className={`shadow-sm border-b transition-colors duration-300 ${
          isDark 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center justify-between p-4">
            <h1 className={`text-xl font-semibold transition-colors duration-300 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              {location.pathname === '/admin/dashboard' && 'Tableau de bord'}
              {location.pathname === '/admin/shops' && 'Commerces'}
              {location.pathname === '/admin/commissions' && 'Commissions'}
              {location.pathname === '/admin/users' && 'Utilisateurs'}
              {location.pathname === '/admin/payments' && 'Paiements'}
              {location.pathname === '/admin/create-shop' && 'Créer un commerce'}
            </h1>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
            </div>
          </div>
        </div>

        {/* Contenu principal */}
        <main className="flex-1 p-6 overflow-auto">
          <Routes>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/shops" element={<AdminShops />} />
            <Route path="/admin/commissions" element={<AdminCommissions />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/payments" element={<AdminPayments />} />
            <Route path="/admin/wallet" element={<AdminWallet />} />
            <Route path="/admin/create-shop" element={<AdminCreateShop />} />
            <Route path="/admin/simple-test" element={<SimpleTest />} />
            <Route path="/" element={<AdminDashboard />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

// Composant principal avec optimisation
function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { isDark } = useThemeStore();

  // Optimisation du changement de thème
  useEffect(() => {
    localStorage.setItem('mangoo-theme', isDark ? 'dark' : 'light');
    document.body.classList.toggle('dark', isDark);
  }, [isDark]);

  // Chargement initial optimisé
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000); // Réduit de 1500ms à 1000ms

    return () => clearTimeout(timer);
  }, []);

  // Gestion de la connexion optimisée
  const handleLogin = useCallback(async (userData) => {
    setUser(userData);
    
    if (userData.email === 'admin@mangoo.tech') {
      localStorage.setItem('admin-demo-user', JSON.stringify({
        id: 'admin-demo-123',
        email: userData.email,
        role: 'admin'
      }));
    }

    // Données de démonstration optimisées
    const mockProducts = [
      {
        id: 1,
        name: 'Cocomm DT740',
        description: 'Téléphone intelligent haut de gamme avec caméra exceptionnelle',
        price: '150.000 FCFA',
        category: 'electronics',
        rating: 5,
        reviews: 128,
        icon: '📱',
        vendor: 'Commerçant Demo',
        stock: 15
      },
      {
        id: 2,
        name: 'Pagne Traditionnel',
        description: 'Tissu wax authentique aux motifs traditionnels',
        price: '25.000 FCFA',
        category: 'fashion',
        rating: 4,
        reviews: 89,
        icon: '👕',
        vendor: 'Commerçant Demo',
        stock: 25
      },
      {
        id: 3,
        name: 'Mafé Maison',
        description: 'Plat traditionnel préparé avec amour',
        price: '3.500 FCFA',
        category: 'food',
        rating: 5,
        reviews: 156,
        icon: '🍲',
        vendor: 'Commerçant Demo',
        stock: 50
      },
      {
        id: 4,
        name: 'Collier Artisanal',
        description: 'Bijou unique fabriqué à la main',
        price: '15.000 FCFA',
        category: 'handicraft',
        rating: 5,
        reviews: 67,
        icon: '🎨',
        vendor: 'Commerçant Demo',
        stock: 8
      }
    ];

    const mockVendors = [
      { id: 1, name: 'Boutique Tradition', category: 'fashion', rating: 4.8, sales: 245 },
      { id: 2, name: 'Tech Africa', category: 'electronics', rating: 4.9, sales: 189 },
      { id: 3, name: 'Saveurs du Terroir', category: 'food', rating: 4.7, sales: 312 }
    ];

    const mockOrders = [
      { id: 1, customer: 'Jean Dupont', amount: '45.000 FCFA', status: 'completed', date: '2024-01-15' },
      { id: 2, customer: 'Marie Kouassi', amount: '23.500 FCFA', status: 'pending', date: '2024-01-16' },
      { id: 3, customer: 'Paul Traoré', amount: '67.000 FCFA', status: 'processing', date: '2024-01-17' }
    ];

    useStore.getState().setProducts(mockProducts);
    useStore.getState().setVendors(mockVendors);
    useStore.getState().setOrders(mockOrders);
  }, []);

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${
        isDark 
          ? 'bg-gradient-to-br from-gray-900 to-gray-800' 
          : 'bg-gradient-to-br from-orange-50 to-green-50'
      }`}>
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">🛍️</div>
          <div className={`text-xl font-semibold transition-colors duration-300 ${
            isDark ? 'text-gray-300' : 'text-gray-700'
          }`}>
            Chargement de la plateforme...
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    // Si pas d'utilisateur, montrer le Hub d'Innovation qui contient les fonctionnalités publiques
    // avec un bouton pour se connecter au dashboard
    return (
      <>
        <div className="absolute top-4 right-4 z-50">
          <button 
            onClick={() => setUser({ role: 'login_request' })}
            className="bg-white text-orange-600 px-4 py-2 rounded-full font-bold shadow-lg hover:bg-gray-100 transition-colors"
          >
            Connexion Dashboard
          </button>
        </div>
        <AfricanInnovationHub />
      </>
    );
  }

  if (user.role === 'login_request') {
    return <Login onLogin={handleLogin} />;
  }

  // Admin avec React Router
  if (user.role === 'admin') {
    return (
      <Router>
        <Routes>
          <Route path="/*" element={<AdminLayout />} />
        </Routes>
      </Router>
    );
  }

  // Interface pour vendeurs et clients
  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDark 
        ? 'bg-gradient-to-br from-gray-900 to-gray-800' 
        : 'bg-gray-50'
    }`}>
      {/* Navigation optimisée */}
      <nav className={`shadow-lg border-b-4 border-orange-500 transition-colors duration-300 ${
        isDark 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="text-2xl">🛍️</div>
              <h1 className={`text-xl font-bold bg-gradient-to-r from-orange-500 to-green-600 bg-clip-text text-transparent`}>
                MangooTech
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors duration-300 ${
                isDark 
                  ? 'bg-gray-700 text-white' 
                  : 'bg-gray-100 text-gray-900'
              }`}>
                <span className="text-lg">{user.avatar}</span>
                <span className="text-sm font-medium">{user.name}</span>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  user.role === 'admin' 
                    ? 'bg-red-100 text-red-800' 
                    : user.role === 'vendor'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-green-100 text-green-800'
                }`}>
                  {user.role}
                </span>
              </div>
              <ThemeToggle />
              <button 
                onClick={() => setUser(null)}
                className="text-gray-500 hover:text-red-500"
                title="Déconnexion"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Contenu principal */}
      <main className="max-w-7xl mx-auto">
        {user.role === 'vendor' && <VendorDashboard />}
        {user.role === 'client' && <ClientMarketplace />}
      </main>
      
      {/* Moniteur de performance */}
      <PerformanceMonitor />
    </div>
  );
}

export default App;
