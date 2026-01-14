import path from "node:path";

import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vitest/config";
import { visualizer } from "rollup-plugin-visualizer";

// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    // Generate bundle visualization for performance analysis
    visualizer({
      filename: 'stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  // Node.js polyfills for nostr-tools
  define: {
    global: 'globalThis',
    'global.Buffer': 'Buffer',
    'global.process': '({ env: {} })',
  },
  optimizeDeps: {
    include: ['nostr-tools', 'buffer'],
    force: true,
  },
  build: {
    rollupOptions: {
      output: {
        // Add hash to filenames for cache busting
        entryFileNames: `assets/[name]-[hash].js`,
        chunkFileNames: `assets/[name]-[hash].js`,
        assetFileNames: `assets/[name]-[hash].[ext]`,
      },
      // Optimized chunking strategy for better caching
      manualChunks: (id) => {
        // Vendor chunks - rarely change

        // React & React DOM zusammen
        if (id.includes('react') || id.includes('react-dom')) {
          return 'react-vendor';
        }

        // 🔥 PERFORMANCE: Icons separater Chunk (klein, selten ändert sich)
        // Besseres Caching - Icons werden nicht bei jedem Build neu heruntergeladen
        if (id.includes('lucide') || id.includes('lucide-react')) {
          return 'icons-vendor';
        }

        // Nostr-Bibliotheken separat
        if (id.includes('@nostrify') || id.includes('nostr-tools')) {
          return 'nostr-vendor';
        }

        // TanStack Query separat (klein, selten ändert sich)
        if (id.includes('@tanstack') || id.includes('tanstack')) {
          return 'query-vendor';
        }

        // 🔥 PERFORMANCE: Radix UI zusammen (wird oft gemeinsam verwendet)
        if (id.includes('@radix-ui')) {
          return 'radix-vendor';
        }

        // 🔥 PERFORMANCE: Tiptap separater Chunk (nur im Editor benötigt)
        if (id.includes('@tiptap')) {
          return 'tiptap-vendor';
        }

        // App-specific chunks
        if (id.includes('hooks') || id.includes('useNostr') || id.includes('useAuthor')) {
          return 'hooks';
        }
        if (id.includes('components') && !id.includes('ui')) {
          return 'app-components';
        }
        if (id.includes('ui')) {
          return 'ui-components';
        }
        if (id.includes('pages')) {
          return 'pages';
        }
        if (id.includes('lib') || id.includes('utils')) {
          return 'utils';
        }

        // Default fallback
        return undefined;
      },
      // Optimize chunk sizes for caching
      chunkSizeWarningLimit: 1000,
    },
    // Asset optimization for better caching
    assetsInlineLimit: 4096, // Inline small assets < 4KB
    cssCodeSplit: true, // Split CSS into separate files

    // Enable source maps for debugging but don't bundle them
    sourcemap: false,

    // Minify and optimize
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
      mangle: {
        safari10: true,
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    onConsoleLog(log) {
      return !log.includes("React Router Future Flag Warning");
    },
    env: {
      DEBUG_PRINT_LIMIT: '0', // Suppress DOM output that exceeds AI context windows
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      buffer: 'buffer',
    },
  },
}));