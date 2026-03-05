import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 🎯 CONFIGURATION MINI-BOUTIQUE - Serveur indépendant
export default defineConfig({
  plugins: [react()],
  
  server: {
    port: 3003, // Port différent pour éviter les conflits
    open: true,
    cors: true
  },
  
  build: {
    outDir: 'dist-mini-shop',
    emptyOutDir: true
  },
  
  resolve: {
    alias: {
      '@': '/src'
    }
  }
})