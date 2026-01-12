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
        if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
          return 'react-vendor';
        }
        if (id.includes('node_modules/nostr') || id.includes('node_modules/@nostrify') || id.includes('node_modules/nostr-tools')) {
          return 'nostr-vendor';
        }
        if (id.includes('node_modules/@tanstack')) {
          return 'query-vendor';
        }
        if (id.includes('node_modules/lucide-react')) {
          return 'icons-vendor';
        }
        if (id.includes('node_modules/@radix-ui')) {
          return 'radix-vendor';
        }
        if (id.includes('node_modules/date-fns')) {
          return 'date-vendor';
        }
        if (id.includes('node_modules/')) {
          return 'vendor';
        }

        // App-specific chunks
        if (id.includes('/hooks/')) {
          return 'hooks';
        }
        if (id.includes('/components/')) {
          return 'components';
        }
        if (id.includes('/pages/')) {
          return 'pages';
        }
        if (id.includes('/lib/') || id.includes('/utils')) {
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
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
      },
      mangle: {
        safari10: true,
      },
    },
    // Optimize chunk splitting
    chunkSizeWarningLimit: 800,
    minChunkSize: 10000,
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