import { create } from 'zustand'

export const useShopStore = create((set) => ({
  shops: [],
  currentShop: null,
  loading: false,
  
  setShops: (shops) => set({ shops }),
  setCurrentShop: (shop) => set({ currentShop: shop }),
  setLoading: (loading) => set({ loading })
}))