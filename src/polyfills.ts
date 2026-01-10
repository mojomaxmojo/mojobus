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
};

if (typeof globalThis !== 'undefined') {
  (globalThis as any).process = processPolyfill;
}

if (typeof window !== 'undefined') {
  (window as any).process = processPolyfill;
}