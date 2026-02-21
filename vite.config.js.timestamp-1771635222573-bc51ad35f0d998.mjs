// vite.config.js
import { defineConfig } from "file:///Users/youba/AFRIKONI%20V8/Afrikoni.com-1/node_modules/vite/dist/node/index.js";
import react from "file:///Users/youba/AFRIKONI%20V8/Afrikoni.com-1/node_modules/@vitejs/plugin-react/dist/index.js";
import path from "path";
import fs from "fs";
var __vite_injected_original_dirname = "/Users/youba/AFRIKONI V8/Afrikoni.com-1";
var BUILD_TIMESTAMP = Date.now();
var vite_config_default = defineConfig({
  plugins: [react()],
  base: "/",
  // ✅ KERNEL ROUTING: Ensure base path is '/' to prevent folder name in URL
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  },
  // ✅ TOTAL SYSTEM SYNC: Define build version for cache busting
  define: {
    __BUILD_VERSION__: JSON.stringify(BUILD_TIMESTAMP)
  },
  build: {
    chunkSizeWarningLimit: 1e3,
    minify: "esbuild",
    rollupOptions: {
      output: {
        // ✅ TOTAL SYSTEM SYNC: Force cache break with timestamp in filenames
        entryFileNames: `assets/[name]-${BUILD_TIMESTAMP}.[hash].js`,
        chunkFileNames: `assets/[name]-${BUILD_TIMESTAMP}.[hash].js`,
        assetFileNames: (assetInfo) => {
          const faviconFiles = ["favicon", "apple-touch-icon", "android-chrome", "mstile", "site.webmanifest"];
          const isFavicon = faviconFiles.some((name) => assetInfo.name?.includes(name));
          if (isFavicon) {
            return "[name][extname]";
          }
          return `assets/[name]-${BUILD_TIMESTAMP}.[hash].[ext]`;
        },
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom"],
          ui: ["framer-motion", "lucide-react", "clsx", "tailwind-merge"],
          supabase: ["@supabase/supabase-js"],
          charts: ["recharts"]
        }
      }
    }
  },
  // ✅ TOTAL SYSTEM SYNC: Disable caching in dev mode
  server: {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      "Pragma": "no-cache",
      "Expires": "0"
    }
  },
  // Ensure public directory files are served correctly
  publicDir: "public",
  // ✅ TOTAL SYSTEM SYNC: Enable caching in dev mode for faster refreshes
  optimizeDeps: {
    force: false
  }
});
try {
  const meta = { version: BUILD_TIMESTAMP };
  const publicDir = path.resolve(__vite_injected_original_dirname, "public");
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir);
  }
  fs.writeFileSync(path.join(publicDir, "meta.json"), JSON.stringify(meta));
  console.log("[Vite] Generated public/meta.json with version:", BUILD_TIMESTAMP);
} catch (err) {
  console.error("[Vite] Failed to generate meta.json:", err);
}
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMveW91YmEvQUZSSUtPTkkgVjgvQWZyaWtvbmkuY29tLTFcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9Vc2Vycy95b3ViYS9BRlJJS09OSSBWOC9BZnJpa29uaS5jb20tMS92aXRlLmNvbmZpZy5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vVXNlcnMveW91YmEvQUZSSUtPTkklMjBWOC9BZnJpa29uaS5jb20tMS92aXRlLmNvbmZpZy5qc1wiO2ltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gJ3ZpdGUnO1xuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0JztcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IGZzIGZyb20gJ2ZzJztcblxuLy8gXHUyNzA1IFRPVEFMIFNZU1RFTSBTWU5DOiBGb3JjZSBjYWNoZSBicmVhayB3aXRoIHRpbWVzdGFtcCB2ZXJzaW9uaW5nXG5jb25zdCBCVUlMRF9USU1FU1RBTVAgPSBEYXRlLm5vdygpO1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBwbHVnaW5zOiBbcmVhY3QoKV0sXG4gIGJhc2U6ICcvJywgLy8gXHUyNzA1IEtFUk5FTCBST1VUSU5HOiBFbnN1cmUgYmFzZSBwYXRoIGlzICcvJyB0byBwcmV2ZW50IGZvbGRlciBuYW1lIGluIFVSTFxuICByZXNvbHZlOiB7XG4gICAgYWxpYXM6IHtcbiAgICAgICdAJzogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJy4vc3JjJyksXG4gICAgfSxcbiAgfSxcbiAgLy8gXHUyNzA1IFRPVEFMIFNZU1RFTSBTWU5DOiBEZWZpbmUgYnVpbGQgdmVyc2lvbiBmb3IgY2FjaGUgYnVzdGluZ1xuICBkZWZpbmU6IHtcbiAgICBfX0JVSUxEX1ZFUlNJT05fXzogSlNPTi5zdHJpbmdpZnkoQlVJTERfVElNRVNUQU1QKSxcbiAgfSxcbiAgYnVpbGQ6IHtcbiAgICBjaHVua1NpemVXYXJuaW5nTGltaXQ6IDEwMDAsXG4gICAgbWluaWZ5OiAnZXNidWlsZCcsXG4gICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgb3V0cHV0OiB7XG4gICAgICAgIC8vIFx1MjcwNSBUT1RBTCBTWVNURU0gU1lOQzogRm9yY2UgY2FjaGUgYnJlYWsgd2l0aCB0aW1lc3RhbXAgaW4gZmlsZW5hbWVzXG4gICAgICAgIGVudHJ5RmlsZU5hbWVzOiBgYXNzZXRzL1tuYW1lXS0ke0JVSUxEX1RJTUVTVEFNUH0uW2hhc2hdLmpzYCxcbiAgICAgICAgY2h1bmtGaWxlTmFtZXM6IGBhc3NldHMvW25hbWVdLSR7QlVJTERfVElNRVNUQU1QfS5baGFzaF0uanNgLFxuICAgICAgICBhc3NldEZpbGVOYW1lczogKGFzc2V0SW5mbykgPT4ge1xuICAgICAgICAgIC8vIEtlZXAgZmF2aWNvbiBmaWxlcyBpbiByb290LCBkb24ndCBoYXNoIHRoZW0gZm9yIGJldHRlciBjYWNoaW5nXG4gICAgICAgICAgY29uc3QgZmF2aWNvbkZpbGVzID0gWydmYXZpY29uJywgJ2FwcGxlLXRvdWNoLWljb24nLCAnYW5kcm9pZC1jaHJvbWUnLCAnbXN0aWxlJywgJ3NpdGUud2VibWFuaWZlc3QnXTtcbiAgICAgICAgICBjb25zdCBpc0Zhdmljb24gPSBmYXZpY29uRmlsZXMuc29tZShuYW1lID0+IGFzc2V0SW5mby5uYW1lPy5pbmNsdWRlcyhuYW1lKSk7XG4gICAgICAgICAgaWYgKGlzRmF2aWNvbikge1xuICAgICAgICAgICAgcmV0dXJuICdbbmFtZV1bZXh0bmFtZV0nO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gYGFzc2V0cy9bbmFtZV0tJHtCVUlMRF9USU1FU1RBTVB9LltoYXNoXS5bZXh0XWA7XG4gICAgICAgIH0sXG4gICAgICAgIG1hbnVhbENodW5rczoge1xuICAgICAgICAgIHZlbmRvcjogWydyZWFjdCcsICdyZWFjdC1kb20nLCAncmVhY3Qtcm91dGVyLWRvbSddLFxuICAgICAgICAgIHVpOiBbJ2ZyYW1lci1tb3Rpb24nLCAnbHVjaWRlLXJlYWN0JywgJ2Nsc3gnLCAndGFpbHdpbmQtbWVyZ2UnXSxcbiAgICAgICAgICBzdXBhYmFzZTogWydAc3VwYWJhc2Uvc3VwYWJhc2UtanMnXSxcbiAgICAgICAgICBjaGFydHM6IFsncmVjaGFydHMnXVxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICB9LFxuICB9LFxuICAvLyBcdTI3MDUgVE9UQUwgU1lTVEVNIFNZTkM6IERpc2FibGUgY2FjaGluZyBpbiBkZXYgbW9kZVxuICBzZXJ2ZXI6IHtcbiAgICBoZWFkZXJzOiB7XG4gICAgICAnQ2FjaGUtQ29udHJvbCc6ICduby1zdG9yZSwgbm8tY2FjaGUsIG11c3QtcmV2YWxpZGF0ZSwgcHJveHktcmV2YWxpZGF0ZScsXG4gICAgICAnUHJhZ21hJzogJ25vLWNhY2hlJyxcbiAgICAgICdFeHBpcmVzJzogJzAnLFxuICAgIH0sXG4gIH0sXG4gIC8vIEVuc3VyZSBwdWJsaWMgZGlyZWN0b3J5IGZpbGVzIGFyZSBzZXJ2ZWQgY29ycmVjdGx5XG4gIHB1YmxpY0RpcjogJ3B1YmxpYycsXG4gIC8vIFx1MjcwNSBUT1RBTCBTWVNURU0gU1lOQzogRW5hYmxlIGNhY2hpbmcgaW4gZGV2IG1vZGUgZm9yIGZhc3RlciByZWZyZXNoZXNcbiAgb3B0aW1pemVEZXBzOiB7XG4gICAgZm9yY2U6IGZhbHNlLFxuICB9XG59KTtcblxuLy8gXHUyNzA1IEVOVEVSUFJJU0UgUkVTSUxJRU5DRTogR2VuZXJhdGUgbWV0YS5qc29uIGZvciB2ZXJzaW9uIGNoZWNraW5nXG50cnkge1xuICBjb25zdCBtZXRhID0geyB2ZXJzaW9uOiBCVUlMRF9USU1FU1RBTVAgfTtcbiAgY29uc3QgcHVibGljRGlyID0gcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJ3B1YmxpYycpO1xuICBpZiAoIWZzLmV4aXN0c1N5bmMocHVibGljRGlyKSkge1xuICAgIGZzLm1rZGlyU3luYyhwdWJsaWNEaXIpO1xuICB9XG4gIGZzLndyaXRlRmlsZVN5bmMocGF0aC5qb2luKHB1YmxpY0RpciwgJ21ldGEuanNvbicpLCBKU09OLnN0cmluZ2lmeShtZXRhKSk7XG4gIGNvbnNvbGUubG9nKCdbVml0ZV0gR2VuZXJhdGVkIHB1YmxpYy9tZXRhLmpzb24gd2l0aCB2ZXJzaW9uOicsIEJVSUxEX1RJTUVTVEFNUCk7XG59IGNhdGNoIChlcnIpIHtcbiAgY29uc29sZS5lcnJvcignW1ZpdGVdIEZhaWxlZCB0byBnZW5lcmF0ZSBtZXRhLmpzb246JywgZXJyKTtcbn1cblxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUF5UyxTQUFTLG9CQUFvQjtBQUN0VSxPQUFPLFdBQVc7QUFDbEIsT0FBTyxVQUFVO0FBQ2pCLE9BQU8sUUFBUTtBQUhmLElBQU0sbUNBQW1DO0FBTXpDLElBQU0sa0JBQWtCLEtBQUssSUFBSTtBQUVqQyxJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixTQUFTLENBQUMsTUFBTSxDQUFDO0FBQUEsRUFDakIsTUFBTTtBQUFBO0FBQUEsRUFDTixTQUFTO0FBQUEsSUFDUCxPQUFPO0FBQUEsTUFDTCxLQUFLLEtBQUssUUFBUSxrQ0FBVyxPQUFPO0FBQUEsSUFDdEM7QUFBQSxFQUNGO0FBQUE7QUFBQSxFQUVBLFFBQVE7QUFBQSxJQUNOLG1CQUFtQixLQUFLLFVBQVUsZUFBZTtBQUFBLEVBQ25EO0FBQUEsRUFDQSxPQUFPO0FBQUEsSUFDTCx1QkFBdUI7QUFBQSxJQUN2QixRQUFRO0FBQUEsSUFDUixlQUFlO0FBQUEsTUFDYixRQUFRO0FBQUE7QUFBQSxRQUVOLGdCQUFnQixpQkFBaUIsZUFBZTtBQUFBLFFBQ2hELGdCQUFnQixpQkFBaUIsZUFBZTtBQUFBLFFBQ2hELGdCQUFnQixDQUFDLGNBQWM7QUFFN0IsZ0JBQU0sZUFBZSxDQUFDLFdBQVcsb0JBQW9CLGtCQUFrQixVQUFVLGtCQUFrQjtBQUNuRyxnQkFBTSxZQUFZLGFBQWEsS0FBSyxVQUFRLFVBQVUsTUFBTSxTQUFTLElBQUksQ0FBQztBQUMxRSxjQUFJLFdBQVc7QUFDYixtQkFBTztBQUFBLFVBQ1Q7QUFDQSxpQkFBTyxpQkFBaUIsZUFBZTtBQUFBLFFBQ3pDO0FBQUEsUUFDQSxjQUFjO0FBQUEsVUFDWixRQUFRLENBQUMsU0FBUyxhQUFhLGtCQUFrQjtBQUFBLFVBQ2pELElBQUksQ0FBQyxpQkFBaUIsZ0JBQWdCLFFBQVEsZ0JBQWdCO0FBQUEsVUFDOUQsVUFBVSxDQUFDLHVCQUF1QjtBQUFBLFVBQ2xDLFFBQVEsQ0FBQyxVQUFVO0FBQUEsUUFDckI7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFBQTtBQUFBLEVBRUEsUUFBUTtBQUFBLElBQ04sU0FBUztBQUFBLE1BQ1AsaUJBQWlCO0FBQUEsTUFDakIsVUFBVTtBQUFBLE1BQ1YsV0FBVztBQUFBLElBQ2I7QUFBQSxFQUNGO0FBQUE7QUFBQSxFQUVBLFdBQVc7QUFBQTtBQUFBLEVBRVgsY0FBYztBQUFBLElBQ1osT0FBTztBQUFBLEVBQ1Q7QUFDRixDQUFDO0FBR0QsSUFBSTtBQUNGLFFBQU0sT0FBTyxFQUFFLFNBQVMsZ0JBQWdCO0FBQ3hDLFFBQU0sWUFBWSxLQUFLLFFBQVEsa0NBQVcsUUFBUTtBQUNsRCxNQUFJLENBQUMsR0FBRyxXQUFXLFNBQVMsR0FBRztBQUM3QixPQUFHLFVBQVUsU0FBUztBQUFBLEVBQ3hCO0FBQ0EsS0FBRyxjQUFjLEtBQUssS0FBSyxXQUFXLFdBQVcsR0FBRyxLQUFLLFVBQVUsSUFBSSxDQUFDO0FBQ3hFLFVBQVEsSUFBSSxtREFBbUQsZUFBZTtBQUNoRixTQUFTLEtBQUs7QUFDWixVQUFRLE1BQU0sd0NBQXdDLEdBQUc7QUFDM0Q7IiwKICAibmFtZXMiOiBbXQp9Cg==
