import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

// Store optimisé avec sélecteurs pour éviter les re-rendus inutiles
export const useOptimizedStore = create(
  subscribeWithSelector((set, get) => ({
    // État initial
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
    
    // État de chargement
    loading: {
      products: false,
      vendors: false,
      orders: false,
      cart: false
    },
    
    // Actions optimisées
    setUser: (user) => set({ user, currentRole: user?.role || 'client' }),
    
    setProducts: (products) => set({ products }),
    
    setVendors: (vendors) => set({ vendors }),
    
    setOrders: (orders) => set({ orders }),
    
    // Actions pour le panier avec validation
    addToCart: (product) => set((state) => {
      const existing = state.cart.find(item => item.id === product.id);
      if (existing) {
        return {
          cart: state.cart.map(item => 
            item.id === product.id 
              ? { ...item, quantity: (item.quantity || 1) + 1 }
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
    
    clearCart: () => set({ cart: [] }),
    
    // Actions pour la wishlist
    toggleWishlist: (productId) => set((state) => {
      const isInWishlist = state.wishlist.includes(productId);
      if (isInWishlist) {
        return { wishlist: state.wishlist.filter(id => id !== productId) };
      }
      return { wishlist: [...state.wishlist, productId] };
    }),
    
    // Actions pour les filtres
    setSearchQuery: (searchQuery) => set({ searchQuery }),
    
    setSelectedCategory: (selectedCategory) => set({ selectedCategory }),
    
    setPriceRange: (priceRange) => set({ priceRange }),
    
    setSelectedRating: (selectedRating) => set({ selectedRating }),
    
    setSelectedSort: (selectedSort) => set({ selectedSort }),
    
    // Action pour réinitialiser tous les filtres
    clearFilters: () => set({
      searchQuery: '',
      selectedCategory: 'all',
      priceRange: [0, 200000],
      selectedRating: 0,
      selectedSort: 'name'
    }),
    
    // Actions de chargement
    setLoading: (key, value) => set((state) => ({
      loading: { ...state.loading, [key]: value }
    })),
    
    // Sélecteurs optimisés
    getProductById: (id) => {
      const state = get();
      return state.products.find(p => p.id === id);
    },
    
    getProductsByCategory: (category) => {
      const state = get();
      return category === 'all' 
        ? state.products 
        : state.products.filter(p => p.category === category);
    },
    
    getCartItemCount: () => {
      const state = get();
      return state.cart.reduce((total, item) => total + (item.quantity || 1), 0);
    },
    
    getCartTotal: () => {
      const state = get();
      return state.cart.reduce((total, item) => {
        const price = parseFloat(item.price.replace(/[^\d]/g, ''));
        return total + (price * (item.quantity || 1));
      }, 0);
    }
  }))
);

// Sélecteurs spécifiques pour éviter les re-rendus
export const useProductsSelector = () => useOptimizedStore(state => state.products);
export const useCartSelector = () => useOptimizedStore(state => state.cart);
export const useWishlistSelector = () => useOptimizedStore(state => state.wishlist);
export const useFiltersSelector = () => useOptimizedStore(state => ({
  searchQuery: state.searchQuery,
  selectedCategory: state.selectedCategory,
  priceRange: state.priceRange,
  selectedRating: state.selectedRating,
  selectedSort: state.selectedSort
}));
export const useLoadingSelector = () => useOptimizedStore(state => state.loading);