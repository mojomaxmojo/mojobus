/**
 * Performance-Konfiguration für MojoBus
 * Manuelle Anpassungsmöglichkeiten für Caching, Preloading und Optimierung
 */

export interface PerformanceConfig {
  // ============================================================================
  // ASSET PRELOADING
  // ============================================================================

  /**
   * Aktiviert Preloading für kritische Assets
   * @default true
   */
  enablePreloading: boolean;

  /**
   * Liste der Assets die vorab geladen werden sollen
   * Pfade relativ zu /assets/
   */
  preloadAssets: string[];

  // ============================================================================
  // CSS OPTIMIERUNG
  // ============================================================================

  /**
   * Aktiviert CSS-Splitting in separate Dateien
   * @default true
   */
  enableCSSCodeSplit: boolean;

  /**
   * Maximale Größe für inline Assets (in Bytes)
   * Assets unter dieser Größe werden inline statt als separate Datei
   * @default 4096 (4KB)
   */
  assetsInlineLimit: number;

  // ============================================================================
  // CACHING
  // ============================================================================

  /**
   * Aktiviert Hash-basiertes File-Naming (Cache Busting)
   * @default true
   */
  enableHashedFilenames: boolean;

  /**
   * Maximale Größe für Chunks bevor gewarnt wird (in Bytes)
   * @default 1000000 (1MB)
   */
  chunkSizeWarningLimit: number;

  // ============================================================================
  // BUNDLE OPTIMIERUNG
  // ============================================================================

  /**
   * Aktiviert Minification des JS-Codes
   * @default true
   */
  minify: boolean;

  /**
   * Aktiviert Source Maps für Debugging (nicht Production)
   * @default false
   */
  sourceMaps: boolean;

  /**
   * Entfernt console.log() im Production-Build
   * @default true
   */
  dropConsole: boolean;

  /**
   * Entfernt debugger statements im Production-Build
   * @default true
   */
  dropDebugger: boolean;

  // ============================================================================
  // SERVICE WORKER
  // ============================================================================

  /**
   * Service Worker Cache-Strategie
   * 'cache-first' - Prüft zuerst Cache, dann Network
   * 'network-first' - Prüft zuerst Network, dann Cache
   * 'stale-while-revalidate' - Cache sofort, aktualisiert im Hintergrund
   * @default 'stale-while-revalidate'
   */
  serviceWorkerCacheStrategy: 'cache-first' | 'network-first' | 'stale-while-revalidate';

  /**
   * Cache-Version für Service Worker Cache Invalidation
   * Inkrementieren bei großen Änderungen
   * @default 6
   */
  serviceWorkerCacheVersion: number;
}

// ============================================================================
// DEFAULT KONFIGURATION
// ============================================================================

export const DEFAULT_PERFORMANCE_CONFIG: PerformanceConfig = {
  // Asset Preloading
  enablePreloading: true,
  preloadAssets: [
    'main-[hash].js',  // Haupt-JS-Chunk
    'main-[hash].css', // Haupt-CSS-Chunk
  ],

  // CSS Optimierung
  enableCSSCodeSplit: true,
  assetsInlineLimit: 4096, // 4KB

  // Caching
  enableHashedFilenames: true,
  chunkSizeWarningLimit: 1000000, // 1MB

  // Bundle Optimierung
  minify: true,
  sourceMaps: false,
  dropConsole: true,
  dropDebugger: true,

  // Service Worker
  serviceWorkerCacheStrategy: 'stale-while-revalidate',
  serviceWorkerCacheVersion: 6, // Erhöht von 5 auf 6 für Cache-Invalidierung
} as const;

// ============================================================================
// EXPORTS
// ============================================================================

export default DEFAULT_PERFORMANCE_CONFIG;
