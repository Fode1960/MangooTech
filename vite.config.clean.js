import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Configuration ultra-minimaliste sans proxy ni plugins complexes
export default defineConfig({
  plugins: [
    react()
  ],
  server: {
    port: 3024,
    host: '0.0.0.0',
    hmr: {
      overlay: false // Désactive l'overlay d'erreur
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'lucide-react'] // Pré-optimisation explicite
  }
})