import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    proxy: {
      // Proxy API requests to the backend
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        // Remove the rewrite to keep the /api prefix
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.error('Proxy error:', err);
          });
          proxy.on('proxyReq', (proxyReq) => {
            console.log('Proxying request to:', proxyReq.path);
          });
        }
      },
    },
    cors: {
      origin: 'http://localhost:3001',
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar']
    },
    // Enable HMR (Hot Module Replacement)
    hmr: {
      port: 3001,
      protocol: 'ws',
      host: 'localhost',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  // Optimize dependencies for faster development server start
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
  },
  // Build configuration
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false, // Keep console logs in development
      },
    },
  },
  preview: {
    port: 3001,
    cors: {
      origin: 'http://localhost:3001',
      credentials: true
    }
  }
})
