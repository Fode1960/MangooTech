import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Configuration minimale pour tester les fonctionnalités
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3007,
    strictPort: false,
    host: '0.0.0.0'
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  build: {
    rollupOptions: {
      input: {
        main: './src/main.minimal.jsx'
      }
    }
  }
})