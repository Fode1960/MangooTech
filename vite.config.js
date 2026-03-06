import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3007,
    strictPort: true,
    host: true, // Listen on all local IPs
    // hmr: {
    //   clientPort: 3007 // Force client to connect to this port
    // }
  },
  resolve: {
    alias: {}
  },
  optimizeDeps: {
    exclude: []
  }
})
