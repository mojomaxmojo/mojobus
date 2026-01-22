import path from "node:path";

import react from "@vitejs/plugin-react-swc";
import { defineConfig, Plugin } from "vitest/config";
import { DEFAULT_PERFORMANCE_CONFIG } from "./src/config/performance.config";

// Custom plugin to inject polyfills at the top of EVERY chunk
function globalPolyfillsPlugin(): Plugin {
  return {
    name: 'global-polyfills',
    renderChunk(code) {
      const polyfills = `// Global Node.js polyfills
if(typeof globalThis==="undefined")self.globalThis=self;
if(typeof process==="undefined"){self.process={env:"",version:"",nextTick:fn=>setTimeout(fn,0),cwd:()=>"/",platform:"browser",browser:true};}
if(typeof require==="undefined"){const cache={};self.require=function(id){console.warn("[Polyfill] require() called:",id);return cache[id]};self.require.cache=cache;self.require.resolve=id=>id;self.require.extensions={};}
if(typeof module==="undefined"){self.module={exports:{},children:[],parent:null};}
if(typeof exports==="undefined"){self.exports={};}
`;
      return {
        code: polyfills + code,
        map: null,
      };
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    globalPolyfillsPlugin(),
  ],
  // Node.js polyfills for nostr-tools
  define: {
    'process.env': '{}',
    'global': 'globalThis',
  },
  optimizeDeps: {
    include: ['nostr-tools', 'buffer'],
    force: true,
    exclude: [],
    // Pre-bundle dependencies with CommonJS issues
    esbuildOptions: {
      banner: {
        js: '// CommonJS polyfills loaded',
      },
      // Inject polyfills into bundled dependencies
      inject: [],
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Add hash to filenames for cache busting
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        // Inline dynamic imports for CommonJS compatibility
        inlineDynamicImports: false,
        // Define globals for Node.js polyfills
        globals: {},
      },
      onwarn(warning, warn) {
        // Suppress external import warnings from node_modules
        // These are usually peer dependencies that will be resolved at runtime
        if (warning.code === 'UNRESOLVED_IMPORT' &&
            warning.message.includes('node_modules')) {
          return;
        }
        // Suppress warnings about dynamic imports in CommonJS
        if (warning.code === 'THIS_IS_UNDEFINED') {
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
      // Don't transform require() in bundled code
      requireReturnsDefault: 'auto',
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
