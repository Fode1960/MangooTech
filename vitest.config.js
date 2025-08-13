import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  esbuild: {
    loader: 'jsx',
    include: /src.*\.[tj]sx?$/,
    exclude: []
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    css: true,
    
    // Patterns de fichiers de test
    include: [
      'src/**/*.{test,spec}.{js,jsx,ts,tsx}',
      'tests/**/*.{test,spec}.{js,jsx,ts,tsx}'
    ],
    
    // Timeout pour les tests
    testTimeout: 10000,
    
    // Configuration des mocks
    mockReset: true,
    clearMocks: true,
    restoreMocks: true,
    
    // Configuration du coverage
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.{js,ts}',
        '**/vite.config.{js,ts}',
        '**/vitest.config.{js,ts}',
        '**/.eslintrc.{js,cjs}',
        'dist/',
        'build/',
        '**/*.test.{js,jsx,ts,tsx}',
        '**/*.spec.{js,jsx,ts,tsx}'
      ],
      // Seuils de coverage minimum
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        },
        // Seuils plus stricts pour les composants critiques
        'src/components/auth/**': {
          branches: 90,
          functions: 90,
          lines: 90,
          statements: 90
        },
        'src/hooks/**': {
          branches: 85,
          functions: 85,
          lines: 85,
          statements: 85
        }
      }
    },
    
    // Configuration pour les tests en parallèle
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        isolate: true
      }
    },
    
    // Configuration des reporters
    reporter: ['default', 'json', 'html'],
    
    // Configuration pour les retries en cas d'échec
    retry: 2,
    
    // Configuration pour les snapshots
    snapshotFormat: {
      escapeString: true,
      printBasicPrototype: true
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@components': resolve(__dirname, './src/components'),
      '@hooks': resolve(__dirname, './src/hooks'),
      '@utils': resolve(__dirname, './src/utils'),
      '@contexts': resolve(__dirname, './src/contexts'),
      '@pages': resolve(__dirname, './src/pages'),
      '@assets': resolve(__dirname, './src/assets')
    }
  }
})