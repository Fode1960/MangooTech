import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ['.trycloudflare.com', 'localhost', '127.0.0.1'],
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
        target: 'ws://127.0.0.1:3008',
        ws: true,
        changeOrigin: true,
        secure: false,
      },
      '/socket.io': {
        target: 'http://127.0.0.1:3045',
        ws: true,
        changeOrigin: true,
        secure: false,
      },
      '/api': {
        target: 'http://127.0.0.1:3045',
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
