import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// ✅ TOTAL SYSTEM SYNC: Force cache break with timestamp versioning
const BUILD_TIMESTAMP = Date.now();

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // ✅ TOTAL SYSTEM SYNC: Define build version for cache busting
  define: {
    __BUILD_VERSION__: JSON.stringify(BUILD_TIMESTAMP),
  },
  build: {
    chunkSizeWarningLimit: 1000,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        // ✅ TOTAL SYSTEM SYNC: Force cache break with timestamp in filenames
        entryFileNames: `assets/[name]-${BUILD_TIMESTAMP}.[hash].js`,
        chunkFileNames: `assets/[name]-${BUILD_TIMESTAMP}.[hash].js`,
        assetFileNames: (assetInfo) => {
          // Keep favicon files in root, don't hash them for better caching
          const faviconFiles = ['favicon', 'apple-touch-icon', 'android-chrome', 'mstile', 'site.webmanifest'];
          const isFavicon = faviconFiles.some(name => assetInfo.name?.includes(name));
          if (isFavicon) {
            return '[name][extname]';
          }
          return `assets/[name]-${BUILD_TIMESTAMP}.[hash].[ext]`;
        },
      },
    },
  },
  // ✅ TOTAL SYSTEM SYNC: Disable caching in dev mode
  server: {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  },
  // Ensure public directory files are served correctly
  publicDir: 'public',
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
    // ✅ TOTAL SYSTEM SYNC: Force re-optimization
    force: true,
  },
});

