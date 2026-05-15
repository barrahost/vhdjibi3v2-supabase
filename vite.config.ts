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
      // Redirect all firebase imports to Supabase-backed shims
      'firebase/firestore': path.resolve(__dirname, 'src/lib/firebaseCompat.ts'),
      'firebase/auth':      path.resolve(__dirname, 'src/lib/firebaseAuthCompat.ts'),
      // Redirect firebase/app and firebase/storage to empty stubs
      'firebase/app':       path.resolve(__dirname, 'src/lib/firebaseStub.ts'),
      'firebase/storage':   path.resolve(__dirname, 'src/lib/firebaseStub.ts'),
      'firebase/functions': path.resolve(__dirname, 'src/lib/firebaseStub.ts'),
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    sourcemap: true,
    outDir: 'dist',
  },
  server: {
    port: 8080,
    cors: { origin: '*' },
  },
}));
