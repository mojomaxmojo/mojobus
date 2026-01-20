#!/usr/bin/env node

import { execSync, spawn } from 'child_process';
import { existsSync, readFileSync, writeFileSync } from 'fs';

const CURRENT_SOURCE_HASH = execSync('node vite.analyze.js --analyze', { encoding: 'utf8' })
  .match(/Source Hash: ([a-f0-9]+)/)?.[1];

console.log('🔍 Intelligent Build System');
console.log(`Current Source Hash: ${CURRENT_SOURCE_HASH}`);

// Check if we have a previous successful build
const LAST_BUILD_HASH = process.env.LAST_BUILD_HASH;
const FORCE_REBUILD = process.env.FORCE_REBUILD === 'true';

if (FORCE_REBUILD) {
  console.log('🔄 Force rebuild requested');
  execSync('vite build', { stdio: 'inherit' });
  process.exit(0);
}

// Check if source has changed
if (CURRENT_SOURCE_HASH !== LAST_BUILD_HASH) {
  console.log('📝 Source changes detected - building...');
  execSync('vite build', { stdio: 'inherit' });

  // Set environment variable for next build
  process.env.LAST_BUILD_HASH = CURRENT_SOURCE_HASH;
} else {
  console.log('✅ No source changes detected');

  // Only build if dist doesn't exist
  if (!existsSync('dist')) {
    console.log('🏗️ No build directory exists - building...');
    execSync('vite build', { stdio: 'inherit' });
  } else {
    console.log('📦 Using existing build (no changes detected)');
  }
}

// Analyze build size
if (existsSync('dist')) {
  try {
    const { execSync } = require('child_process');
    const duOutput = execSync('du -sh dist', { encoding: 'utf8' });
    console.log(`📦 Build Size: ${duOutput.trim()}`);

    // Count files
    const { execSync: execSync2 } = require('child_process');
    const fileCount = execSync2('find dist -type f | wc -l', { encoding: 'utf8' });
    console.log(`📄 Files Generated: ${fileCount.trim()}`);

  } catch (error) {
    console.log('📦 Build directory exists');
  }
}

console.log('✨ Build complete!');