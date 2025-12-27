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
    chunkSizeWarningLimit: 1000,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        // Ensure content hashing for cache busting
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: (assetInfo) => {
          // Keep favicon files in root, don't hash them for better caching
          const faviconFiles = ['favicon', 'apple-touch-icon', 'android-chrome', 'mstile', 'site.webmanifest'];
          const isFavicon = faviconFiles.some(name => assetInfo.name?.includes(name));
          if (isFavicon) {
            return '[name][extname]';
          }
          return 'assets/[name].[hash].[ext]';
        },
      },
    },
  },
  // Ensure public directory files are served correctly
  publicDir: 'public',
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
  },
});

