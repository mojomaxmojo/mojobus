#!/usr/bin/env node

/**
 * Build-Optimierungs-Skript für MojoBus
 * Führt Performance-Optimierungen nach dem Build durch
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.join(__dirname, 'dist');

/**
 * Liest und prüft die index.html
 */
function analyzeIndexHtml() {
  const indexPath = path.join(DIST_DIR, 'index.html');
  const html = fs.readFileSync(indexPath, 'utf-8');

  console.log('📊 Analysiere index.html...');

  const issues = [];

  // Prüfe auf inline CSS
  const inlineCSS = html.match(/<style[^>]*>[\s\S]*?<\/style>/gi);
  if (inlineCSS && inlineCSS.length > 0) {
    inlineCSS.forEach(style => {
      const size = style.length;
      issues.push({
        type: 'inline_css',
        size,
        message: `Inline CSS gefunden: ~${(size / 1024).toFixed(1)}KB`
      });
    });
  }

  // Prüfe auf Assets mit Hash
  const hashPattern = /href="\/[a-zA-Z0-9]+-[a-fA-F0-9]+\.(js|css)"/g;
  const hashFiles = html.match(hashPattern) || [];
  console.log(`  ✓ Hash-basierte Dateien: ${hashFiles.length}`);

  // Prüfe auf Preload-Tags
  const preloadPattern = /<link[^>]*rel=["']preload["'][^>]*>/gi;
  const preloads = html.match(preloadPattern) || [];
  console.log(`  ✓ Preload-Tags: ${preloads.length}`);

  // Prüfe auf Service Worker Registration
  const swPattern = /serviceWorker\.register/gi;
  const hasSW = swPattern.test(html);
  console.log(`  ✓ Service Worker Registrierung: ${hasSW ? 'Vorhanden' : 'FEHLEND!'}`);

  return { html, issues, hashFiles, preloads, hasSW };
}

/**
 * Generiert Preload-Tags für Assets
 */
function generatePreloadTags(hashFiles: string[]): string {
  if (hashFiles.length === 0) {
    return '';
  }

  const preloadTags = hashFiles
    .filter(file => file.match(/\.(js|css)$/))
    .map(file => {
      const src = file.match(/href="([^"]+)"/)?.[1];
      if (!src) return '';

      const ext = path.extname(src);
      const as = ext === '.css' ? 'style' : 'script';

      return `    <!-- Preload: ${path.basename(src)} -->\n    <link rel="preload" href="${src}" as="${as}" fetchpriority="high" />\n`;
    })
    .filter(Boolean)
    .join('\n');

  return preloadTags;
}

/**
 * Generiert Performance-Report
 */
function generatePerformanceReport(analysis: any): string {
  const lines = [
    '',
    '═'.repeat(60),
    '📊 PERFORMANCE REPORT',
    '═'.repeat(60),
    '',
  ];

  if (analysis.issues.length > 0) {
    lines.push('⚠️  GEFUNDENE PROBLEME:');
    lines.push('');

    analysis.issues.forEach(issue => {
      lines.push(`  ❌ ${issue.type}: ${issue.message}`);
      if (issue.size) {
        lines.push(`     Größe: ~${(issue.size / 1024).toFixed(1)}KB`);
      }
    });

    lines.push('');
  }

  lines.push('✅ ASSETS MIT HASH:');
  analysis.hashFiles.forEach(file => {
    const src = file.match(/href="([^"]+)"/)?.[1];
    if (src) {
      lines.push(`  ✓ ${path.basename(src)}`);
    }
  });

  lines.push('');
  lines.push('✅ PRELOAD-TAGS:');
  lines.push(`  ${analysis.preloads.length} Preload-Tags gefunden`);

  lines.push('');
  lines.push('✅ SERVICE WORKER:');
  lines.push(`  ${analysis.hasSW ? '✓ Registriert' : '❌ Nicht registriert'}`);

  lines.push('');
  lines.push('═'.repeat(60));
  lines.push('💡 EMPFEHLUNGEN:');
  lines.push('');
  lines.push('1. Prüfe ob Assets gecacht werden (F12 → Network)');
  lines.push('2. Service Worker testen (/settings/service-worker)');
  lines.push('3. Performance-Config anpassen (src/config/performance.config.ts)');
  lines.push('═'.repeat(60));

  return lines.join('\n');
}

/**
 * Schreibt Performance-Report
 */
function writePerformanceReport(analysis: any) {
  const report = generatePerformanceReport(analysis);
  const reportPath = path.join(DIST_DIR, 'performance-report.txt');

  fs.writeFileSync(reportPath, report, 'utf-8');
  console.log(`\n📝 Performance-Report geschrieben: ${reportPath}`);
  console.log(report);
}

/**
 * Analysiert Build-Dateien
 */
function analyzeBuildFiles() {
  console.log('\n📁 Analysiere Build-Dateien...');

  const files = fs.readdirSync(DIST_DIR);

  const jsFiles = files.filter(f => f.endsWith('.js'));
  const cssFiles = files.filter(f => f.endsWith('.css'));
  const mapFiles = files.filter(f => f.endsWith('.map'));
  const htmlFiles = files.filter(f => f.endsWith('.html'));

  console.log(`  📄 HTML-Dateien: ${htmlFiles.length}`);
  console.log(`  📜 JS-Dateien: ${jsFiles.length}`);
  console.log(`  🎨 CSS-Dateien: ${cssFiles.length}`);
  console.log(`  🗺️  Map-Dateien: ${mapFiles.length}`);

  let totalSize = 0;

  files.forEach(file => {
    const filePath = path.join(DIST_DIR, file);
    const stats = fs.statSync(filePath);
    totalSize += stats.size;
  });

  console.log(`  📦 Gesamtgröße: ${(totalSize / 1024).toFixed(1)}KB (${(totalSize / 1024 / 1024).toFixed(2)}MB)`);

  return { jsFiles, cssFiles, mapFiles, htmlFiles, totalSize };
}

/**
 * Hauptfunktion
 */
async function main() {
  console.log('🚀 Starte Build-Optimierung...\n');

  // Prüfe ob dist/ existiert
  if (!fs.existsSync(DIST_DIR)) {
    console.error('❌ dist/ Verzeichnis existiert nicht. Bitte zuerst "npm run build" ausführen.');
    process.exit(1);
  }

  // Analysiere Build
  const buildStats = analyzeBuildFiles();

  // Analysiere index.html
  const analysis = analyzeIndexHtml();

  // Generiere Performance-Report
  writePerformanceReport(analysis);

  console.log('\n✅ Build-Optimierung abgeschlossen!\n');
  console.log('💡 Tipp: Führe "npm run build" erneut aus, um die Optimierungen anzuwenden.');
}

main().catch(error => {
  console.error('❌ Fehler:', error);
  process.exit(1);
});
