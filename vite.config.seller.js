import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { resolve } from 'path'

export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/MangooTech/seller/' : '/seller/',
  
  server: {
    port: 3003,
    host: 'localhost',
    open: '/seller/dashboard'
  },
  
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Mangoo Tech - Espace Vendeur',
        short_name: 'Mangoo Seller',
        description: 'Gérez votre boutique Mangoo Tech',
        theme_color: '#1a5f3f',
        background_color: '#ffffff',
        display: 'standalone',
        scope: process.env.NODE_ENV === 'production' ? '/MangooTech/seller/' : '/seller/',
        start_url: process.env.NODE_ENV === 'production' ? '/MangooTech/seller/dashboard' : '/seller/dashboard',
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
      }
    })
  ],
  
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@components': resolve(__dirname, 'src/components'),
      '@pages': resolve(__dirname, 'src/pages'),
      '@lib': resolve(__dirname, 'src/lib'),
      '@contexts': resolve(__dirname, 'src/contexts'),
      '@hooks': resolve(__dirname, 'src/hooks'),
      '@utils': resolve(__dirname, 'src/utils'),
      '@assets': resolve(__dirname, 'src/assets'),
      '@styles': resolve(__dirname, 'src/styles')
    }
  },
  
  css: {
    postcss: './postcss.config.js'
  },
  
  build: {
    outDir: 'dist/seller',
    rollupOptions: {
      input: {
        seller: resolve(__dirname, 'index.html')
      }
    }
  }
})