#!/usr/bin/env node

import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createHash } from 'crypto';

// Configuration
const BUILD_DIR = 'dist';
const CACHE_FILE = '.build-cache.json';
const ASSETS_CACHE_FILE = '.assets-cache.json';

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create hash for file content
function getFileHash(filePath) {
  try {
    const content = readFileSync(filePath, 'utf8');
    return createHash('sha256').update(content).digest('hex');
  } catch (error) {
    return null;
  }
}

// Get hash for all source files
function getSourceHash() {
  const sourceFiles = [
    'src/main.tsx',
    'src/App.tsx',
    'src/AppRouter.tsx',
    'vite.config.ts',
    'package.json',
    'tailwind.config.ts',
    'tsconfig.json',
  ];

  const sourceHashes = {};
  sourceFiles.forEach(file => {
    if (existsSync(file)) {
      sourceHashes[file] = getFileHash(file);
    }
  });

  // Hash all source files together
  const allHashes = Object.values(sourceHashes).filter(Boolean).sort().join('');
  return createHash('sha256').update(allHashes).digest('hex');
}

// Read existing cache
function readCache() {
  try {
    if (existsSync(CACHE_FILE)) {
      return JSON.parse(readFileSync(CACHE_FILE, 'utf8'));
    }
  } catch (error) {
    return null;
  }
}

// Write cache
function writeCache(cacheData) {
  try {
    mkdirSync(dirname(CACHE_FILE), { recursive: true });
    writeFileSync(CACHE_FILE, JSON.stringify(cacheData, null, 2));
  } catch (error) {
    console.warn('Could not write cache file:', error);
  }
}

// Check if full rebuild is needed
function needsFullRebuild() {
  const currentSourceHash = getSourceHash();
  const cache = readCache();

  if (!cache || cache.sourceHash !== currentSourceHash) {
    console.log('🔄 Full rebuild needed - source files changed');
    writeCache({
      sourceHash: currentSourceHash,
      timestamp: Date.now()
    });
    return true;
  }

  console.log('✅ No source changes detected');
  return false;
}

// Analyze current build
function analyzeBuild() {
  if (!existsSync(BUILD_DIR)) {
    console.log('❌ No build directory found');
    return;
  }

  try {
    const manifestPath = join(BUILD_DIR, 'manifest.json');
    const indexPath = join(BUILD_DIR, 'index.html');

    const manifestStats = existsSync(manifestPath) ?
      JSON.parse(readFileSync(manifestPath, 'utf8')) : {};

    const indexStats = existsSync(indexPath) ?
      readFileSync(indexPath, 'utf8').length : 0;

    console.log('📊 Build Analysis:');
    console.log(`   Source Hash: ${getSourceHash()}`);
    console.log(`   Index HTML Size: ${(indexStats / 1024).toFixed(2)} KB`);
    console.log(`   PWA Ready: ${existsSync(manifestPath) ? '✅' : '❌'}`);

    // Count JS files
    const jsFiles = manifestStats.icons ?
      manifestStats.icons.length : 0;

    if (jsFiles > 0) {
      console.log(`   Icons: ${jsFiles}`);
    }

  } catch (error) {
    console.warn('Could not analyze build:', error);
  }
}

// Main execution
function main() {
  const args = process.argv.slice(2);

  if (args.includes('--analyze')) {
    analyzeBuild();
  } else {
    const needsRebuild = needsFullRebuild();
    process.exit(needsRebuild ? 1 : 0);
  }
}

main();