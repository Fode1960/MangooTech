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
    allowedHosts: ['.trycloudflare.com', 'localhost', '127.0.0.1', '192.168.0.0/16', '10.0.0.0/8', '172.16.0.0/12'],
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
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('Connection', 'close');
          });
        },
      }
    }
  },
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      const url = String(req.url || '');
      if (url.endsWith('.html') || url === '/' || url.endsWith('/') || url === '/index.html' || url.endsWith('.js') || url.endsWith('.css')) {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
      }
      // Force clear service worker cache on HTML requests
      if (url.endsWith('.html') || url === '/' || url === '/index.html') {
        res.setHeader('Clear-Site-Data', '"cache"');
      }
      next();
    });
  }
})
