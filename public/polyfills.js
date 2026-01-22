// Node.js Polyfills for CommonJS compatibility
// Must be loaded BEFORE any other scripts to prevent require() errors

(function() {
  'use strict';

  // Polyfill global and process
  if (typeof globalThis === 'undefined') {
    self.globalThis = self;
  }

  // Process polyfill
  if (typeof process === 'undefined') {
    self.process = {
      env: {},
      version: '',
      nextTick: function(fn) { return setTimeout(fn, 0); },
      cwd: function() { return '/'; },
      platform: 'browser',
      browser: true,
    };
  }

  // Buffer polyfill stub (full buffer will be loaded later)
  if (typeof Buffer === 'undefined') {
    self.Buffer = {
      isBuffer: function() { return false; },
      from: function() { return []; },
      alloc: function() { return []; },
    };
  }

  // Require polyfill with proper caching
  if (typeof require === 'undefined') {
    var requireCache = {};

    self.require = function(id) {
      console.warn('[Polyfill] require() called in browser for:', id);
      return requireCache[id];
    };

    self.require.cache = requireCache;
    self.require.resolve = function(id) {
      console.warn('[Polyfill] require.resolve() called for:', id);
      return id;
    };

    self.require.extensions = {};
  }

  // Module polyfill
  if (typeof module === 'undefined') {
    self.module = {
      exports: {},
      children: [],
      parent: null,
    };
  }

  // Exports polyfill
  if (typeof exports === 'undefined') {
    self.exports = {};
  }

  console.log('[Polyfill] Node.js polyfills loaded successfully');
})();
