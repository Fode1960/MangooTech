import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from "vite-tsconfig-paths";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(), // Configuration React standard sans plugins Babel exotiques
    tsconfigPaths(),
  ],
  server: {
    port: 3015,
    strictPort: false,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://localhost:3045',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
