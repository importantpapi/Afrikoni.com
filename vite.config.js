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
          // Vendor chunks
          if (id.includes('node_modules')) {
            // Keep React core together to prevent load order issues
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router') || id.includes('react-i18next') || id.includes('i18next')) {
              return 'vendor-react';
            }
            if (id.includes('framer-motion') || id.includes('lucide-react') || id.includes('@radix-ui')) {
              return 'vendor-ui';
            }
            if (id.includes('recharts')) {
              return 'vendor-charts';
            }
            if (id.includes('@supabase')) {
              return 'vendor-supabase';
            }
            if (id.includes('date-fns') || id.includes('sonner')) {
              return 'vendor-utils';
            }
            // Other node_modules
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
    chunkSizeWarningLimit: 800, // Increased for dashboard chunk (acceptable for admin features)
    minify: 'esbuild', // Faster than terser, already included
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
  },
});

