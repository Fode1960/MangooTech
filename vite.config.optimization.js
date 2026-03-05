import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import { compression } from 'vite-plugin-compression2';

// Optimisations de build
export default defineConfig({
  plugins: [
    react({
      // Optimisations React
      babel: {
        plugins: [
          // Optimisation des conditions
          ['babel-plugin-transform-remove-console', { exclude: ['error', 'warn'] }],
          // Optimisation des imports
          'babel-plugin-import',
          // Minification
          'minify-dead-code-elimination'
        ]
      }
    }),
    // Visualisation du bundle
    visualizer({
      filename: 'dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true
    }),
    // Compression des assets
    compression({
      algorithm: 'gzip',
      ext: '.gz',
      threshold: 1024
    }),
    compression({
      algorithm: 'brotliCompress',
      ext: '.br',
      threshold: 1024
    })
  ],
  
  // Optimisations de build
  build: {
    // Minification avancée
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug']
      },
      mangle: {
        toplevel: true
      }
    },
    
    // Code splitting automatique
    rollupOptions: {
      output: {
        manualChunks: {
          // Séparer les gros modules
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['lucide-react', 'recharts'],
          'utils': ['date-fns', 'clsx'],
          'charts': ['recharts'],
          'payment': ['@stripe/stripe-js']
        },
        // Optimiser les noms de fichiers
        entryFileNames: 'js/[name]-[hash].js',
        chunkFileNames: 'js/[name]-[hash].js',
        assetFileNames: '[ext]/[name]-[hash].[ext]'
      }
    },
    
    // Optimiser la taille du bundle
    chunkSizeWarningLimit: 1000, // 1MB
    
    // Pré-chargement des modules critiques
    modulePreload: {
      polyfill: true
    }
  },
  
  // Optimisations du serveur de développement
  server: {
    // HMR plus rapide
    hmr: {
      overlay: true
    },
    // Optimiser le rechargement
    watch: {
      usePolling: false,
      interval: 1000
    }
  },
  
  // Optimisations de dépendances
  optimizeDeps: {
    include: [
      'react',
      'react-dom', 
      'react-router-dom',
      'zustand',
      'lucide-react',
      'recharts',
      'date-fns'
    ],
    exclude: []
  },
  
  // Configuration pour les images
  assetsInclude: ['**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.gif', '**/*.svg'],
  
  // Optimisations spécifiques
  esbuild: {
    // Minification plus agressive
    minifyIdentifiers: true,
    minifySyntax: true,
    minifyWhitespace: true,
    // Supprimer les commentaires
    legalComments: 'none'
  }
});