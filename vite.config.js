import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['framer-motion', 'lucide-react'],
          'vendor-utils': ['date-fns', 'sonner'],
          'dashboard': [
            './src/pages/dashboard/index.jsx',
            './src/pages/dashboard/DashboardHome.jsx'
          ],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
});

