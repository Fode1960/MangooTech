import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ['.trycloudflare.com', 'localhost', '127.0.0.1'],
    https: (() => {
      if (String(process.env.DEV_HTTPS || '').trim() !== '1') return undefined
      const pfxPath = String(process.env.DEV_HTTPS_PFX || '').trim()
      const pfxPassphrase = String(process.env.DEV_HTTPS_PFX_PASS || '').trim()
      if (pfxPath && fs.existsSync(pfxPath)) {
        return {
          pfx: fs.readFileSync(pfxPath),
          passphrase: pfxPassphrase || undefined,
        }
      }
      const certPath = String(process.env.DEV_HTTPS_CERT || '').trim()
      const keyPath = String(process.env.DEV_HTTPS_KEY || '').trim()
      if (!certPath || !keyPath) return undefined
      if (!fs.existsSync(certPath) || !fs.existsSync(keyPath)) return undefined
      return {
        cert: fs.readFileSync(certPath),
        key: fs.readFileSync(keyPath),
      }
    })(),
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
