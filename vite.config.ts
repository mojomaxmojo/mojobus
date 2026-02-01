import path from "node:path";

import react from "@vitejs/plugin-react-swc";
import { nodePolyfills } from "vite-plugin-node-polyfills";
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
    nodePolyfills({
      // Whether to polyfill specific globals.
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
      // Whether to polyfill `process` and `Buffer` for the `browser` field in package.json
      process: true,
      buffer: true,
    }),
  ],
  // Node.js polyfills for nostr-tools
  define: {
    'process.env': '{}',
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'nostr-tools',
      'buffer',
      '@nostrify/react',
      '@nostrify/nostrify',
      'dijkstrajs',
    ],
    force: true,
  },
  build: {
    rollupOptions: {
      output: {
        // Add hash to filenames for code busting
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        // Disable minification during development to see chunks clearly
        compact: false,
        // Inline dynamic imports to force code splitting
        inlineDynamicImports: false,
        // Ensure proper interop between CJS and ESM modules
        interop: 'auto',
        // Intelligentes Code Splitting für bessere Performance
        manualChunks(id) {
          // React Kernbibliotheken (stable)
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'react-vendor';
          }

          // React Query (stable)
          if (id.includes('node_modules/@tanstack/react-query/')) {
            return 'query-vendor';
          }

          // Icons (stable)
          if (id.includes('node_modules/lucide-react/')) {
            return 'icons-vendor';
          }

          // Radix UI (semi-stable)
          if (id.includes('node_modules/@radix-ui/')) {
            return 'radix-vendor';
          }

          // Nostr Bibliotheken (feature-specific)
          if (id.includes('node_modules/@nostrify/')) {
            return 'nostr-vendor';
          }

          // Tiptap Editor (nur bei Bedarf laden)
          if (id.includes('node_modules/@tiptap/') || id.includes('node_modules/prosemirror/')) {
            return 'tiptap-vendor';
          }

          // Markdown (nur bei Bedarf)
          if (id.includes('node_modules/react-markdown/') ||
              id.includes('node_modules/micromark/') ||
              id.includes('node_modules/remark-') ||
              id.includes('node_modules/mdast-') ||
              id.includes('node_modules/hast-')) {
            return 'markdown-vendor';
          }

          // Date Picker (nur bei Bedarf)
          if (id.includes('node_modules/react-day-picker/')) {
            return 'datepicker-vendor';
          }

          // Carousel (nur bei Bedarf)
          if (id.includes('node_modules/embla-carousel-react/')) {
            return 'carousel-vendor';
          }

          // QR Code (nur bei Bedarf)
          if (id.includes('node_modules/qrcode/')) {
            return 'qrcode-vendor';
          }

          // Router (feature-specific)
          if (id.includes('node_modules/react-router/')) {
            return 'router-vendor';
          }

          // Utils (semi-stable)
          if (id.includes('node_modules/class-variance-authority/') ||
              id.includes('node_modules/clsx/') ||
              id.includes('node_modules/tailwind-merge/')) {
            return 'css-utils-vendor';
          }

          // Node polyfills
          if (id.includes('node_modules/@ungap/structured-clone/') ||
              id.includes('node_modules/base64-js/') ||
              id.includes('node_modules/events/') ||
              id.includes('node_modules/stream-browserify/') ||
              id.includes('node_modules/util/') ||
              id.includes('node_modules/process/') ||
              id.includes('node_modules/buffer/')) {
            return 'polyfills';
          }

          // Alles andere in node_modules
          if (id.includes('node_modules/')) {
            return 'vendor';
          }

          // App-spezifischer Code bleibt im Hauptbundle
          return undefined;
        },
      },
      onwarn(warning, warn) {
        // Suppress external import warnings from node_modules
        // These are usually peer dependencies that will be resolved at runtime
        if (warning.code === 'UNRESOLVED_IMPORT' &&
            (warning.message.includes('node_modules') ||
             warning.message.includes('dijkstrajs'))) {
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
