import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

// ✅ TOTAL SYSTEM SYNC: Force cache break with timestamp versioning
const BUILD_TIMESTAMP = Date.now();

export default defineConfig({
  plugins: [react()],
  base: '/', // ✅ KERNEL ROUTING: Ensure base path is '/' to prevent folder name in URL
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
    chunkSizeWarningLimit: 1400,
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
        manualChunks(id) {
          if (!id) return;

          // Large third-party libraries
          if (id.includes('node_modules/heic2any')) return 'heic2any';
          if (id.includes('node_modules/recharts')) return 'charts';
          if (id.includes('node_modules/@supabase/supabase-js')) return 'supabase';
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/react-router')) return 'vendor-react';
          if (id.includes('node_modules/framer-motion') || id.includes('node_modules/lucide-react')) return 'vendor-ui';
          if (id.includes('node_modules/date-fns')) return 'vendor-date';

          // Internal code partitions to reduce oversized entry chunk
          if (id.includes('/src/pages/dashboard/')) return 'app-dashboard';
          if (id.includes('/src/pages/')) return 'app-pages';
          if (id.includes('/src/components/')) {
            const match = id.match(/\/src\/components\/([^/]+)\//);
            if (match?.[1]) {
              const segment = match[1].replace(/[^a-z0-9_-]/gi, '-').toLowerCase();
              return `app-components-${segment}`;
            }
            return 'app-components';
          }
          if (id.includes('/src/services/')) return 'app-services';
          if (id.includes('/src/hooks/')) return 'app-hooks';
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
  // ✅ TOTAL SYSTEM SYNC: Enable caching in dev mode for faster refreshes
  optimizeDeps: {
    force: false,
  }
});

// ✅ ENTERPRISE RESILIENCE: Generate meta.json for version checking
try {
  const meta = { version: BUILD_TIMESTAMP };
  const publicDir = path.resolve(__dirname, 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir);
  }
  fs.writeFileSync(path.join(publicDir, 'meta.json'), JSON.stringify(meta));
  console.log('[Vite] Generated public/meta.json with version:', BUILD_TIMESTAMP);
} catch (err) {
  console.error('[Vite] Failed to generate meta.json:', err);
}
