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
        manualChunks: (id) => {
          // CRITICAL: Bundle ALL React-related libs together to prevent load order issues
          if (id.includes('node_modules')) {
            // Bundle React + ALL React-dependent libraries together
            if (id.includes('react') || 
                id.includes('react-dom') || 
                id.includes('react-router') || 
                id.includes('react-i18next') || 
                id.includes('i18next') ||
                id.includes('framer-motion') ||
                id.includes('@radix-ui') ||
                id.includes('lucide-react')) {
              return 'vendor-react';
            }
            if (id.includes('recharts')) {
              return 'vendor-charts';
            }
            if (id.includes('@supabase')) {
              return 'vendor-supabase';
            }
            // Everything else
            return 'vendor-other';
          }
          
          // Dashboard chunks
          if (id.includes('/dashboard/')) {
            if (id.includes('/admin/')) {
              return 'dashboard-admin';
            }
            return 'dashboard';
          }
          
          // Marketplace chunks
          if (id.includes('/marketplace') || id.includes('/products') || id.includes('/productdetails')) {
            return 'marketplace';
          }
          
          // Countries page chunk
          if (id.includes('/pages/countries')) {
            return 'countries';
          }
        },
      },
    },
    chunkSizeWarningLimit: 1000,
    minify: 'esbuild',
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
  },
});

