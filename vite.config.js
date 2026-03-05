import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3007,
    strictPort: true,
    host: '0.0.0.0'
  },
  resolve: {
    alias: {}
  },
  optimizeDeps: {
    exclude: []
  }
})