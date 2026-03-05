import { create } from 'zustand'

// Store global simple pour l'application
export const useAppStore = create((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  
  cart: [],
  addToCart: (product) => set((state) => ({
    cart: [...state.cart, product]
  })),
  
  removeFromCart: (productId) => set((state) => ({
    cart: state.cart.filter(item => item.id !== productId)
  })),
  
  clearCart: () => set({ cart: [] })
}))

export default useAppStore;