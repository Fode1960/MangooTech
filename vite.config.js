import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3015,
    strictPort: false,
    host: '0.0.0.0',
    hmr: false,
    watch: {
      ignored: [
        '**/server/data/**',
        '**/dist/**',
        '**/.version-backups/**',
      ],
    },
    proxy: {
      '/webrtc-ws': {
        target: 'ws://localhost:3008',
        ws: true,
        changeOrigin: true,
        secure: false,
      },
      '/socket.io': {
        target: 'http://localhost:3045',
        ws: true,
        changeOrigin: true,
        secure: false,
      },
      '/api': {
        target: 'http://localhost:3045',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  resolve: {
    alias: {}
  },
  optimizeDeps: {
    exclude: []
  }
})
