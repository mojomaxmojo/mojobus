import path from "node:path";

import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vitest/config";
import { DEFAULT_PERFORMANCE_CONFIG } from "./src/config/performance.config";

// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
  ],
  // Node.js polyfills for nostr-tools
  define: {
    'process.env': '{}',
    'global': 'globalThis',
  },
  optimizeDeps: {
    include: ['nostr-tools', 'buffer'],
    force: true,
  },
  build: {
    rollupOptions: {
      output: {
        // Add hash to filenames for cache busting
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        // Manual chunks to bundle nostr-tools with main bundle
        manualChunks(id) {
          if (id.includes('nostr-tools')) {
            return 'nostr-tools';
          }
        },
      },
      onwarn(warning, warn) {
        // Suppress external import warnings from node_modules
        // These are usually peer dependencies that will be resolved at runtime
        if (warning.code === 'UNRESOLVED_IMPORT' &&
            warning.message.includes('node_modules')) {
          return;
        }
        warn(warning);
      }
    },
    // Asset optimization for better caching
    assetsInlineLimit: DEFAULT_PERFORMANCE_CONFIG.assetsInlineLimit, // Inline small assets < 4KB
    cssCodeSplit: DEFAULT_PERFORMANCE_CONFIG.enableCSSCodeSplit, // Split CSS into separate files

    // Enable source maps for debugging but don't bundle them
    sourcemap: DEFAULT_PERFORMANCE_CONFIG.sourceMaps,

    // Minify and optimize
    minify: DEFAULT_PERFORMANCE_CONFIG.minify ? 'terser' : false,
    terserOptions: {
      compress: {
        drop_console: DEFAULT_PERFORMANCE_CONFIG.dropConsole,
        drop_debugger: DEFAULT_PERFORMANCE_CONFIG.dropDebugger,
      },
      mangle: {
        safari10: true,
      },
    },
    // CommonJS to ESM transform
    commonjsOptions: {
      transformMixedEsModules: true,
      include: [/node_modules/],
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
      // Node.js polyfills
      buffer: 'buffer',
      events: 'events',
      stream: 'stream-browserify',
      util: 'util',
      process: 'process',
    },
  },
  // Additional configuration to handle CommonJS
  css: {
    devSourcemap: true,
  },
}));
