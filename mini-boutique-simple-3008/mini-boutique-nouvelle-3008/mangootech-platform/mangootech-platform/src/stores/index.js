import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Store pour l'authentification
export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: (user) => set({ user, isAuthenticated: true }),
      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    {
      name: 'auth-storage',
    }
  )
)

// Store pour les vendeurs
export const useVendorStore = create((set) => ({
  vendors: [],
  selectedVendor: null,
  setVendors: (vendors) => set({ vendors }),
  setSelectedVendor: (vendor) => set({ selectedVendor: vendor }),
  addVendor: (vendor) => set((state) => ({ vendors: [...state.vendors, vendor] })),
  updateVendor: (vendorId, updates) => set((state) => ({
    vendors: state.vendors.map(v => v.id === vendorId ? { ...v, ...updates } : v)
  })),
}))

// Store pour les produits
export const useProductStore = create((set) => ({
  products: [],
  categories: [],
  selectedCategory: 'all',
  searchQuery: '',
  cart: [],
  setProducts: (products) => set({ products }),
  setCategories: (categories) => set({ categories }),
  setSelectedCategory: (category) => set({ selectedCategory: category }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  addToCart: (product) => set((state) => ({ cart: [...state.cart, product] })),
  removeFromCart: (productId) => set((state) => ({
    cart: state.cart.filter(item => item.id !== productId)
  })),
  clearCart: () => set({ cart: [] }),
}))

// Store pour les commandes
export const useOrderStore = create((set) => ({
  orders: [],
  currentOrder: null,
  setOrders: (orders) => set({ orders }),
  setCurrentOrder: (order) => set({ currentOrder: order }),
  addOrder: (order) => set((state) => ({ orders: [order, ...state.orders] })),
  updateOrderStatus: (orderId, status) => set((state) => ({
    orders: state.orders.map(o => o.id === orderId ? { ...o, status } : o)
  })),
}))

// Store pour le thème et la langue
export const useUIStore = create(
  persist(
    (set) => ({
      theme: 'light',
      language: 'fr',
      sidebarOpen: false,
      toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
      setLanguage: (lang) => set({ language: lang }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
    }),
    {
      name: 'ui-storage',
    }
  )
)