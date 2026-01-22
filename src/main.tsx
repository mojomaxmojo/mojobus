// 🔥 CRITICAL: Node.js Polyfills - MUST be first
// Define polyfills before any other imports

// Global polyfill
if (typeof globalThis === 'undefined') {
  (globalThis as any) = self;
}

// Process polyfill
if (typeof process === 'undefined') {
  (self as any).process = {
    env: {},
    version: '',
    nextTick: (fn: Function) => setTimeout(fn, 0),
    cwd: () => '/',
    platform: 'browser' as const,
    browser: true,
  };
}

// Require polyfill - define globally before any imports
if (typeof require === 'undefined') {
  const cache: Record<string, any> = {};

  (self as any).require = function(id: string): any {
    console.warn('[Polyfill] require() called in browser for:', id);
    return cache[id];
  };

  (self as any).require.cache = cache;
  (self as any).require.resolve = function(id: string): string {
    return id;
  };

  (self as any).require.extensions = {};
}

// Module polyfill
if (typeof module === 'undefined') {
  (self as any).module = {
    exports: {},
    children: [],
    parent: null,
  };
}

// Exports polyfill
if (typeof exports === 'undefined') {
  (self as any).exports = {};
}

import { createRoot } from 'react-dom/client';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import App from './App.tsx';
import './index.css';

// Register Service Worker
import '@/lib/serviceWorker';

import '@fontsource-variable/inter';
import '@fontsource-variable/playfair-display';

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
