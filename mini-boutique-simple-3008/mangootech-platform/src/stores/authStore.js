import { create } from 'zustand'

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  currentShop: null,
  
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setCurrentShop: (shop) => set({ currentShop: shop }),
  logout: () => set({ user: null, isAuthenticated: false, currentShop: null })
}))