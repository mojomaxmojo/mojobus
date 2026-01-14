#!/usr/bin/env node

/**
 * Bundle-Größen-Analyse-Skript
 * Analysiert die Build-Outputs und zeigt Informationen zu Chunks
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DIST_DIR = join(__dirname, 'dist', 'assets');

// Chunk-Kategorien für Analyse
const CHUNK_CATEGORIES = {
  'stable-vendor': {
    name: 'Stable Vendor (sehr selten ändernde Bibliotheken)',
    description: 'Long-Term-Caching: Ändert sich fast nie',
    chunks: ['react-vendor', 'icons-vendor', 'query-vendor'],
  },
  'semi-stable-vendor': {
    name: 'Semi-Stable Vendor (selten ändernde Bibliotheken)',
    description: 'Good Caching: Ändert sich nur bei Updates',
    chunks: ['radix-vendor', 'cv-vendor', 'css-utils-vendor'],
  },
  'feature-vendor': {
    name: 'Feature Vendor (feature-spezifische Bibliotheken)',
    description: 'Medium Caching: Ändert sich bei Feature-Updates',
    chunks: ['nostr-vendor'],
  },
  'conditional-vendor': {
    name: 'Conditional Vendor (wird nur bei Bedarf geladen)',
    description: 'On-Demand: Wird nur geladen wenn die Funktion genutzt wird',
    chunks: ['tiptap-vendor', 'router-vendor', 'markdown-vendor', 'charts-vendor', 'carousel-vendor', 'datepicker-vendor', 'syntax-vendor', 'qrcode-vendor'],
  },
  'app-code': {
    name: 'App Code (Anwendungsspezifischer Code)',
    description: 'Frequent Updates: Ändert sich oft',
    chunks: ['hooks', 'app-components', 'ui-components', 'pages', 'utils', 'services', 'contexts', 'config'],
  },
  'polyfills': {
    name: 'Polyfills',
    description: 'Browser-Kompatibilität',
    chunks: ['polyfills'],
  },
};

/**
 * Ermittelt die Größe einer Datei
 */
function getFileSize(filePath) {
  try {
    const stats = statSync(filePath);
    return stats.size;
  } catch (error) {
    return 0;
  }
}

/**
 * Formatiert Byte-Größe für Menschen lesbare Darstellung
 */
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Liest alle JS-Dateien aus dem dist/assets Verzeichnis
 */
function getChunkFiles() {
  try {
    const files = readdirSync(DIST_DIR);
    return files
      .filter(file => file.endsWith('.js') && !file.includes('.map'))
      .map(file => {
        const filePath = join(DIST_DIR, file);
        const size = getFileSize(filePath);

        // Extrahiere Chunk-Namen ohne Hash
        const nameWithoutHash = file.replace(/-[a-f0-9]{8,10}\.js$/, '.js');

        return {
          file,
          nameWithoutHash,
          size,
          formattedSize: formatBytes(size),
        };
      })
      .sort((a, b) => b.size - a.size); // Sortiere nach Größe absteigend
  } catch (error) {
    console.error('Fehler beim Lesen des dist Verzeichnisses:', error);
    return [];
  }
}

/**
 * Gruppiert Chunks nach Kategorie
 */
function groupChunksByCategory(chunks) {
  const grouped = {};

  // Initialisiere Kategorien
  Object.keys(CHUNK_CATEGORIES).forEach(categoryKey => {
    grouped[categoryKey] = {
      ...CHUNK_CATEGORIES[categoryKey],
      chunks: [],
      totalSize: 0,
    };
  });

  // Chunks ohne Kategorie
  grouped['other'] = {
    name: 'Andere',
    description: 'Nicht kategorisierte Chunks',
    chunks: [],
    totalSize: 0,
  };

  // Verteile Chunks auf Kategorien
  chunks.forEach(chunk => {
    let foundCategory = false;

    for (const [categoryKey, category] of Object.entries(CHUNK_CATEGORIES)) {
      if (category.chunks.some(catChunk => chunk.nameWithoutHash.startsWith(catChunk))) {
        grouped[categoryKey].chunks.push(chunk);
        grouped[categoryKey].totalSize += chunk.size;
        foundCategory = true;
        break;
      }
    }

    if (!foundCategory) {
      grouped['other'].chunks.push(chunk);
      grouped['other'].totalSize += chunk.size;
    }
  });

  return grouped;
}

/**
 * Gibt die Analyse aus
 */
function printAnalysis() {
  console.log('\n' + '='.repeat(80));
  console.log('📦 BUNDLE ANALYSE - MojoBus');
  console.log('='.repeat(80) + '\n');

  const chunks = getChunkFiles();

  if (chunks.length === 0) {
    console.log('⚠️  Keine Chunks gefunden. Bitte zuerst `npm run build` ausführen.\n');
    return;
  }

  const totalSize = chunks.reduce((sum, chunk) => sum + chunk.size, 0);
  console.log(`📊 Gesamtgröße: ${formatBytes(totalSize)}\n`);

  // Gruppiere Chunks
  const grouped = groupChunksByCategory(chunks);

  // Gehe durch jede Kategorie
  for (const [categoryKey, category] of Object.entries(grouped)) {
    if (category.chunks.length === 0) continue;

    const percentage = ((category.totalSize / totalSize) * 100).toFixed(1);

    console.log('='.repeat(80));
    console.log(`📁 ${category.name}`);
    console.log(`   ${category.description}`);
    console.log(`   Größe: ${formatBytes(category.totalSize)} (${percentage}% des Gesamtbundles)`);
    console.log('='.repeat(80));

    // Zeige Chunks in dieser Kategorie
    category.chunks.forEach(chunk => {
      const chunkPercentage = ((chunk.size / totalSize) * 100).toFixed(2);
      console.log(`   • ${chunk.nameWithoutHash.padEnd(40)} ${chunk.formattedSize.padStart(10)} (${chunkPercentage}%)`);
    });

    console.log('');
  }

  // Cache-Empfehlungen
  console.log('='.repeat(80));
  console.log('🎯 CACHE-EMPFehLUNGEN');
  console.log('='.repeat(80));
  console.log('');
  console.log('Stable Vendor Chunks (react-vendor, icons-vendor, query-vendor):');
  console.log('   • Cache-Header: max-age=31536000, immutable');
  console.log('   • Ändert sich fast nie → kann für 1 Jahr gecacht werden\n');

  console.log('Semi-Stable Vendor Chunks (radix-vendor, cv-vendor, css-utils-vendor):');
  console.log('   • Cache-Header: max-age=86400');
  console.log('   • Ändert sich nur bei Updates → 24 Stunden Cache\n');

  console.log('Feature Vendor Chunks (nostr-vendor):');
  console.log('   • Cache-Header: max-age=3600');
  console.log('   • Ändert sich bei Updates → 1 Stunde Cache\n');

  console.log('Conditional Vendor Chunks (tiptap-vendor, etc.):');
  console.log('   • Cache-Header: max-age=86400');
  console.log('   • Wird on-demand geladen → 24 Stunden Cache\n');

  console.log('App Code Chunks (hooks, components, pages, etc.):');
  console.log('   • Cache-Header: no-cache');
  console.log('   • Ändert sich oft → Kein langer Cache\n');

  console.log('='.repeat(80));
  console.log('');
}

// Führe die Analyse aus
printAnalysis();
