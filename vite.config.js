import react from '@vitejs/plugin-react'
import path from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    hmr: {
      // Only attempt HMR when the dev server is actually running
      overlay: true,
      // Use the same port to avoid cross-origin WebSocket issues
      host: 'localhost',
      port: 5173,
    },
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('error', (err, _req, res) => {
            console.error('[Proxy /api] Backend unavailable:', err.message);
            if (res && !res.headersSent) {
              res.writeHead(503, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                error: 'Backend server unavailable',
                message: 'Laravel is not running on port 8000. Start with: npm run dev',
              }));
            }
          });
        },
      },
      '/sanctum': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('error', (err, _req, res) => {
            console.error('[Proxy /sanctum] Backend unavailable:', err.message);
            if (res && !res.headersSent) {
              res.writeHead(503, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                error: 'Backend server unavailable',
                message: 'Laravel is not running on port 8000. Start with: npm run dev',
              }));
            }
          });
        },
      },
    },
  },
  build: {
    outDir: 'dist',
  },
})
