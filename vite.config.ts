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
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    // 🔥 PERFORMANCE: Detaillierte Vendor-Chunk Optimierung
      // Strategie: Gruppieren nach Änderungshäufigkeit für maximales Caching
      manualChunks: (id) => {
        // ============================================================================
        // STABLE VENDOR CHUNKS (ändern sich sehr selten)
        // ============================================================================

        // React & React DOM - Kern-Bibliothek, sehr stabil
        if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
          return 'react-vendor';
        }

        // Lucide Icons - Ändern sich nie, nur wenn Icons hinzugefügt werden
        // Perfekt für Long-Term-Caching
        if (id.includes('node_modules/lucide')) {
          return 'icons-vendor';
        }

        // TanStack Query - Ändert sich selten, kleines Paket
        if (id.includes('node_modules/@tanstack')) {
          return 'query-vendor';
        }

        // ============================================================================
        // SEMI-STABLE VENDOR CHUNKS (ändern sich selten)
        // ============================================================================

        // Radix UI - Ändert sich selten, konsolidiert für Caching
        if (id.includes('node_modules/@radix-ui')) {
          return 'radix-vendor';
        }

        // class-variance-authority - Für UI-Variants, sehr stabil
        if (id.includes('node_modules/class-variance-authority')) {
          return 'cv-vendor';
        }

        // clsx & tailwind-merge - Für CSS-Klassen, sehr stabil
        if (id.includes('node_modules/clsx') || id.includes('node_modules/tailwind-merge')) {
          return 'css-utils-vendor';
        }

        // ============================================================================
        // FEATURE VENDOR CHUNKS (ändern sich manchmal)
        // ============================================================================

        // Nostr-Bibliotheken - Domain-spezifisch, ändern sich bei Updates
        if (id.includes('node_modules/@nostrify') || id.includes('node_modules/nostr-tools')) {
          return 'nostr-vendor';
        }

        // ============================================================================
        // CONDITIONAL VENDOR CHUNKS (werden nur geladen wenn benötigt)
        // ============================================================================

        // Tiptap Editor - Nur auf /veroeffentlichen und Editor-Pages benötigt
        if (id.includes('node_modules/@tiptap')) {
          return 'tiptap-vendor';
        }

        // React Router - Kann sich bei Version-Updates ändern
        if (id.includes('node_modules/react-router')) {
          return 'router-vendor';
        }

        // React Markdown - Nur für markdown rendering
        if (id.includes('node_modules/react-markdown')) {
          return 'markdown-vendor';
        }

        // Recharts - Nur für Diagramme/Charts
        if (id.includes('node_modules/recharts')) {
          return 'charts-vendor';
        }

        // Embla Carousel - Nur für Karussell-Komponenten
        if (id.includes('node_modules/embla-carousel')) {
          return 'carousel-vendor';
        }

        // React Day Picker - Nur für Kalender-Komponenten
        if (id.includes('node_modules/react-day-picker')) {
          return 'datepicker-vendor';
        }

        // React Syntax Highlighter - Nur für Code-Highlighting
        if (id.includes('node_modules/react-syntax-highlighter')) {
          return 'syntax-vendor';
        }

        // Qrcode - Nur für QR-Codes
        if (id.includes('node_modules/qrcode')) {
          return 'qrcode-vendor';
        }

        // ============================================================================
        // APP-SPECIFIC CHUNKS (änderungshäufigkeit wie App-Code)
        // ============================================================================

        // Hooks - Werden oft geändert
        if (id.includes('/hooks/') && !id.includes('node_modules')) {
          return 'hooks';
        }

        // App Components (außer UI) - Werden oft geändert
        if (id.includes('/components/') && !id.includes('/ui') && !id.includes('node_modules')) {
          return 'app-components';
        }

        // UI Components - Shadcn UI Komponenten, relativ stabil
        if (id.includes('/components/ui') && !id.includes('node_modules')) {
          return 'ui-components';
        }

        // Pages - Lazy-loaded, jeder Page ein separater Chunk
        if (id.includes('/pages/') && !id.includes('node_modules')) {
          // Extrahiere Page-Name für benannte Chunks
          const pageMatch = id.match(/pages\/([^/]+)\.tsx?/);
          if (pageMatch) {
            return `page-${pageMatch[1]}`;
          }
          return 'pages';
        }

        // Utils & Lib - Hilfsfunktionen
        if (id.includes('/lib/') && !id.includes('node_modules')) {
          return 'utils';
        }

        // Services - API-Aufrufe, Daten-Processing
        if (id.includes('/services/') && !id.includes('node_modules')) {
          return 'services';
        }

        // Contexts - React Context Provider
        if (id.includes('/contexts/') && !id.includes('node_modules')) {
          return 'contexts';
        }

        // Config - Konfigurationen
        if (id.includes('/config/') && !id.includes('node_modules')) {
          return 'config';
        }

        // ============================================================================
        // FALLBACK
        // ============================================================================

        // Node polyfills
        if (id.includes('node_modules/buffer') || id.includes('node_modules/process')) {
          return 'polyfills';
        }

        // Default fallback - eigener Chunk
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