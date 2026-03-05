import { create } from 'zustand'

export const useProductStore = create((set) => ({
  products: [],
  categories: [],
  loading: false,
  
  setProducts: (products) => set({ products }),
  setCategories: (categories) => set({ categories }),
  setLoading: (loading) => set({ loading })
}))