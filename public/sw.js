/**
 * Service Worker for MojoBus Blog
 * Provides offline-first caching with stale-while-revalidate pattern
 */

const CACHE_VERSION = 'v1';
const CACHE_NAME = `mojobus-${CACHE_VERSION}`;

// Assets to cache immediately on install
const STATIC_CACHE_URLS = [
  '/',
  '/artikel',
  '/plaetze',
  '/bilder',
  '/notes',
  '/about',
  '/manifest.webmanifest',
  '/mojobuslogo.png',
];

// Cache strategies
const CACHE_STRATEGIES = {
  // Cache First: Static assets (CSS, JS, images)
  CACHE_FIRST: 'cache-first',
  
  // Network First: API calls and dynamic content
  NETWORK_FIRST: 'network-first',
  
  // Stale While Revalidate: Articles, notes, places
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate',
  
  // Network Only: Real-time data
  NETWORK_ONLY: 'network-only',
};

// Cache configurations for different resource types
const CACHE_CONFIGS = {
  // Static assets - long cache
  static: {
    maxAge: 60 * 60 * 24 * 30, // 30 days
    strategy: CACHE_STRATEGIES.CACHE_FIRST,
  },
  
  // API responses - short cache
  api: {
    maxAge: 60 * 5, // 5 minutes
    strategy: CACHE_STRATEGIES.STALE_WHILE_REVALIDATE,
  },
  
  // Images - medium cache
  images: {
    maxAge: 60 * 60 * 24 * 7, // 7 days
    strategy: CACHE_STRATEGIES.CACHE_FIRST,
  },
  
  // HTML - very short cache
  html: {
    maxAge: 60, // 1 minute
    strategy: CACHE_STRATEGIES.NETWORK_FIRST,
  },
};

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      console.log('[Service Worker] Caching static assets...');
      
      // Cache static URLs
      await cache.addAll(STATIC_CACHE_URLS);
      
      console.log('[Service Worker] Static assets cached successfully');
    })()
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  
  event.waitUntil(
    (async () => {
      // Clean up old caches
      const cacheNames = await caches.keys();
      const oldCaches = cacheNames.filter(name => name.startsWith('mojobus-') && name !== CACHE_NAME);
      
      console.log('[Service Worker] Cleaning up old caches:', oldCaches);
      
      await Promise.all(
        oldCaches.map(name => caches.delete(name))
      );
      
      console.log('[Service Worker] Old caches cleaned up successfully');
    })()
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip external requests (except images and API)
  if (url.origin !== self.location.origin) {
    // Cache external images
    if (url.pathname.match(/\.(jpg|jpeg|png|webp|gif|svg|ico)$/i)) {
      event.respondWith(cacheWithStrategy(request, CACHE_CONFIGS.images));
      return;
    }
    return;
  }

  // Determine cache strategy based on URL
  let strategy;
  
  // HTML pages
  if (request.headers.get('accept')?.includes('text/html')) {
    strategy = CACHE_CONFIGS.html;
  }
  // Static assets (CSS, JS, fonts)
  else if (url.pathname.match(/\.(css|js|woff|woff2|ttf|eot)$/i)) {
    strategy = CACHE_CONFIGS.static;
  }
  // Images
  else if (url.pathname.match(/\.(jpg|jpeg|png|webp|gif|svg|ico)$/i)) {
    strategy = CACHE_CONFIGS.images;
  }
  // API calls (Nostr relays, etc.)
  else if (url.pathname.includes('/api/')) {
    strategy = CACHE_CONFIGS.api;
  }
  // Default to stale-while-revalidate for content pages
  else {
    strategy = CACHE_CONFIGS.api;
  }

  event.respondWith(cacheWithStrategy(request, strategy));
});

/**
 * Cache with specific strategy
 */
async function cacheWithStrategy(request, config) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);

  switch (config.strategy) {
    case CACHE_STRATEGIES.CACHE_FIRST:
      return cacheFirst(cache, request);
    
    case CACHE_STRATEGIES.NETWORK_FIRST:
      return networkFirst(cache, request);
    
    case CACHE_STRATEGIES.STALE_WHILE_REVALIDATE:
      return staleWhileRevalidate(cache, request, config.maxAge);
    
    case CACHE_STRATEGIES.NETWORK_ONLY:
      return fetch(request);
    
    default:
      return networkFirst(cache, request);
  }
}

/**
 * Cache First strategy - try cache, then network
 */
async function cacheFirst(cache, request) {
  const cached = await cache.match(request);
  
  if (cached) {
    console.log('[Service Worker] Cache Hit:', request.url);
    return cached;
  }
  
  console.log('[Service Worker] Cache Miss:', request.url);
  const response = await fetch(request);
  
  if (response.ok) {
    cache.put(request, response.clone());
  }
  
  return response;
}

/**
 * Network First strategy - try network, then cache
 */
async function networkFirst(cache, request) {
  try {
    console.log('[Service Worker] Network First:', request.url);
    const response = await fetch(request);
    
    if (response.ok) {
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.log('[Service Worker] Network Error, falling back to cache:', request.url);
    const cached = await cache.match(request);
    
    if (cached) {
      return cached;
    }
    
    throw error;
  }
}

/**
 * Stale While Revalidate strategy - serve from cache, update in background
 */
async function staleWhileRevalidate(cache, request, maxAge) {
  const cached = await cache.match(request);
  
  // Check if cache is stale
  let isStale = false;
  if (cached) {
    const cacheDate = cached.headers.get('date');
    if (cacheDate) {
      const cacheTime = new Date(cacheDate).getTime();
      const currentTime = Date.now();
      const age = (currentTime - cacheTime) / 1000; // in seconds
      
      if (age > maxAge) {
        isStale = true;
      }
    }
  }
  
  // Return cached version immediately
  if (cached) {
    console.log('[Service Worker] Stale While Revalidate - Cache:', request.url, isStale ? '(stale)' : '(fresh)');
    
    // Fetch and update in background
    if (!cached.headers.get('x-sw-updating')) {
      fetchAndCache(cache, request);
    }
    
    // Add header to indicate staleness
    const headers = new Headers(cached.headers);
    headers.set('X-SW-Cache', isStale ? 'stale' : 'fresh');
    headers.set('X-SW-Updating', 'false');
    
    return new Response(cached.body, {
      status: cached.status,
      statusText: cached.statusText,
      headers,
    });
  }
  
  // No cache, fetch from network
  console.log('[Service Worker] Stale While Revalidate - Network:', request.url);
  return fetchAndCache(cache, request);
}

/**
 * Fetch and cache response
 */
async function fetchAndCache(cache, request) {
  try {
    const response = await fetch(request.clone(), {
      headers: {
        'X-SW-Updating': 'true',
      },
    });
    
    if (response.ok) {
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.error('[Service Worker] Fetch error:', error);
    throw error;
  }
}

// Message event - handle messages from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.delete(CACHE_NAME).then(() => {
      console.log('[Service Worker] Cache cleared');
    });
  }
});

console.log('[Service Worker] Loaded');
