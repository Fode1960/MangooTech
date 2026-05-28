import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from "vite-tsconfig-paths";
import fs from 'node:fs'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(), // Configuration React standard sans plugins Babel exotiques
    tsconfigPaths(),
  ],
  server: {
    https: (() => {
      if (String(process.env.DEV_HTTPS || '').trim() !== '1') return undefined
      const certPath = String(process.env.DEV_HTTPS_CERT || '').trim()
      const keyPath = String(process.env.DEV_HTTPS_KEY || '').trim()
      if (!certPath || !keyPath) return undefined
      if (!fs.existsSync(certPath) || !fs.existsSync(keyPath)) return undefined
      return { cert: fs.readFileSync(certPath), key: fs.readFileSync(keyPath) }
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
      }
    }
  }
})
