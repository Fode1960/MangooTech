import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  // Configuration pour GitHub Pages
  base: process.env.NODE_ENV === 'production' ? '/MangooTech/' : '/',
  
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Mangoo Tech - Solutions Numériques Innovantes',
        short_name: 'Mangoo Tech',
        description: 'Solutions technologiques modulaires pour l\'Afrique et au-delà',
        theme_color: '#1a5f3f',
        background_color: '#ffffff',
        display: 'standalone',
        scope: process.env.NODE_ENV === 'production' ? '/MangooTech/' : '/',
        start_url: process.env.NODE_ENV === 'production' ? '/MangooTech/' : '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      }
    })
  ],
  
  server: {
    port: 3000
  },
  
  // Optimisations pour le build
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['framer-motion', '@headlessui/react', '@heroicons/react']
        }
      }
    }
  }
})