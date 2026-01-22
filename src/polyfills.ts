// Polyfill Buffer for nostr-tools
import { Buffer } from 'buffer';

// Make Buffer available globally on multiple levels
if (typeof globalThis !== 'undefined') {
  (globalThis as any).Buffer = Buffer;
  (globalThis as any).global = globalThis;
}

// Also set on window object for browsers
if (typeof window !== 'undefined') {
  (window as any).Buffer = Buffer;
  (window as any).global = window;
}

// Polyfill process for nostr-tools if needed
const processPolyfill = {
  env: {},
  version: '',
  nextTick: (fn: Function) => setTimeout(fn, 0),
  cwd: () => '/',
  platform: 'browser' as const,
  browser: true,
};

if (typeof globalThis !== 'undefined') {
  (globalThis as any).process = processPolyfill;
}

if (typeof window !== 'undefined') {
  (window as any).process = processPolyfill;
}

// Polyfill require to prevent errors from CommonJS packages
// This is a minimal implementation that returns undefined for all requires
const createRequireStub = () => {
  const cache: Record<string, any> = {};

  const requireStub = (id: string): any => {
    console.warn(`require() called in browser context for: ${id}`);
    return cache[id];
  };

  requireStub.cache = cache;
  requireStub.resolve = (id: string) => {
    console.warn(`require.resolve() called in browser context for: ${id}`);
    return id;
  };

  return requireStub;
};

if (typeof globalThis !== 'undefined') {
  (globalThis as any).require = createRequireStub();
}

if (typeof window !== 'undefined') {
  (window as any).require = createRequireStub();
}