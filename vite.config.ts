import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react']
  },
  build: {
    sourcemap: true,
    outDir: 'dist'
  },
  server: {
    port: 8080,
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    },
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With'
    },
    proxy: {
      '/_firebase': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
        secure: false,
        ws: true,
        rewrite: (path) => path.replace(/^\/_firebase/, '')
      },
      '/__/auth': {
        target: 'http://127.0.0.1:9099',
        changeOrigin: true,
        secure: false,
        ws: true
      },
      '/_storage': {
        target: 'http://127.0.0.1:9199',
        changeOrigin: true,
        secure: false,
        ws: true
      }
    }
  }
}));