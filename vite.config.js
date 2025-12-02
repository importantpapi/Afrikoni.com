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
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'vendor-react';
            }
            if (id.includes('framer-motion') || id.includes('lucide-react')) {
              return 'vendor-ui';
            }
            if (id.includes('recharts')) {
              return 'vendor-charts';
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
        },
      },
    },
    chunkSizeWarningLimit: 600,
    minify: 'esbuild', // Faster than terser, already included
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
  },
});

