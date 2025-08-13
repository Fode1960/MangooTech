import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { resolve } from 'path'
import { visualizer } from 'rollup-plugin-visualizer'
export default defineConfig({
  // Configuration pour GitHub Pages
  base: process.env.NODE_ENV === 'production' ? '/MangooTech/' : '/',
  
  plugins: [
    react(),
    // Analyseur de bundle (généré seulement en build)
    process.env.ANALYZE && visualizer({
      filename: 'dist/stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true
    }),
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
  ].filter(Boolean),
  
  // Configuration des alias
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@components': resolve(__dirname, 'src/components'),
      '@pages': resolve(__dirname, 'src/pages'),
      '@utils': resolve(__dirname, 'src/utils'),
      '@contexts': resolve(__dirname, 'src/contexts'),
      '@hooks': resolve(__dirname, 'src/hooks'),
      '@assets': resolve(__dirname, 'src/assets')
    }
  },
  
  server: {
    port: 3000,
    open: true,
    cors: true,
    // Préchargement des modules
    warmup: {
      clientFiles: [
        './src/App.jsx',
        './src/main.jsx',
        './src/components/layout/Navbar.jsx',
        './src/components/layout/Footer.jsx'
      ]
    }
  },

  // Configuration de preview
  preview: {
    port: 4173,
    open: true
  },
  
  // Optimisations pour le build
  build: {
    target: 'es2015',
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: process.env.NODE_ENV === 'development',
    minify: 'terser',
    
    // Configuration Terser pour une meilleure compression
    terserOptions: {
      compress: {
        drop_console: process.env.NODE_ENV === 'production',
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info']
      },
      mangle: {
        safari10: true
      }
    },

    rollupOptions: {
      output: {
        // Stratégie de chunking optimisée
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom'],
          'router-vendor': ['react-router-dom'],
          'ui-vendor': ['framer-motion', '@headlessui/react', '@heroicons/react'],
          'supabase-vendor': ['@supabase/supabase-js'],
          'i18n-vendor': ['react-i18next', 'i18next'],
          
          // Feature chunks
          'auth': [
            './src/contexts/AuthContext.jsx',
            './src/pages/Login.jsx',
            './src/pages/Register.jsx'
          ],
          'admin': [
            './src/pages/admin/AdminDashboard.jsx'
          ],
          'utils': [
             './src/utils/seo.js',
             './src/utils/performance.js',
             './src/utils/imageOptimization.jsx',
             './src/utils/errorHandling.jsx'
           ]
        },
        
        // Nommage des chunks
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
          if (facadeModuleId) {
            const fileName = facadeModuleId.split('/').pop().replace('.jsx', '').replace('.js', '')
            return `js/${fileName}-[hash].js`
          }
          return 'js/[name]-[hash].js'
        },
        
        // Nommage des assets
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.')
          const ext = info[info.length - 1]
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `images/[name]-[hash][extname]`
          }
          if (/css/i.test(ext)) {
            return `css/[name]-[hash][extname]`
          }
          return `assets/[name]-[hash][extname]`
        },
        
        // Nommage des entry points
        entryFileNames: 'js/[name]-[hash].js'
      }
    },

    // Taille limite des chunks
    chunkSizeWarningLimit: 1000,
    
    // Optimisations CSS
    cssCodeSplit: true,
    cssMinify: true,
    
    // Optimisations des assets
    assetsInlineLimit: 4096, // 4kb
    
    // Configuration pour le cache
    emptyOutDir: true,
    
    // Optimisations pour les navigateurs modernes
    modulePreload: {
      polyfill: true
    }
  },

  // Configuration des dépendances à optimiser
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@supabase/supabase-js',
      'react-i18next',
      'i18next',
      'framer-motion'
    ]
  },

  // Configuration CSS
  css: {
    devSourcemap: true,
    modules: {
      localsConvention: 'camelCase'
    }
  },

  // Configuration des variables d'environnement
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString())
  },

  // Configuration pour les tests
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.test.{js,jsx}',
        '**/*.spec.{js,jsx}'
      ]
    }
  },

  // Configuration pour le mode développement
  esbuild: {
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : []
  }
})