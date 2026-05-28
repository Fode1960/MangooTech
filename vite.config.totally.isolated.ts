import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Configuration ultra-isolée sans Supabase
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3010,
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
        main: './src/main.totally.isolated.jsx'
      }
    }
  }
})