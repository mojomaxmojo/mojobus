/**
 * Service Worker für MojoBus
 * Offline-Fähigkeit und verbessertes Caching
 */

// ============================================================================
// CACHE-KONFIGURATION
// ============================================================================
const CACHE_VERSION = 7; // Cache Version erhöhen (war 6, jetzt 7) - für Image Service Änderung
const CACHE_NAME = `mojobus-v${CACHE_VERSION}`; // Version aus Konfiguration

console.log('[Service Worker] Cache Version:', CACHE_VERSION);
console.log('[Service Worker] Cache Name:', CACHE_NAME);

// ============================================================================
// CACHE-STRATEGIEN
// ============================================================================

/**
 * Cache-First Strategie
 * Versucht zuerst Cache, dann Network
 * Für Assets die sich selten ändern (CSS, JS, Icons)
 */
async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    // Wenn Network fehlschlägt und nichts im Cache, return offline fallback
    return new Response('Offline - Keine Verbindung', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: new Headers({
        'Content-Type': 'text/plain'
      })
    });
  }
}

/**
 * Network-First Strategie
 * Versucht zuerst Network, dann Cache
 * Für HTML und API-Requests (immer frische Daten)
 */
async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    // Wenn Network fehlschlägt und nichts im Cache, return offline fallback
    return new Response('Offline - Keine Verbindung', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: new Headers({
        'Content-Type': 'text/plain'
      })
    });
  }
}

/**
 * Stale-While-Revalidate Strategie
 * Liefert sofort aus Cache, aktualisiert im Hintergrund
 * Für dynamische Inhalte (HTML-Seiten)
 */
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);

  const fetchPromise = fetch(request).then(networkResponse => {
    cache.put(request, networkResponse.clone());
    return networkResponse;
  }).catch(error => {
    console.log('[Service Worker] Fetch error:', error);
    return cachedResponse || new Response('Offline - Keine Verbindung', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: new Headers({
        'Content-Type': 'text/plain'
      })
    });
  });

  if (cachedResponse) {
    return cachedResponse;
  }

  return fetchPromise;
}

/**
 * Network-Only Strategie
 * Lädt immer frisch vom Network
 * Für Nostr-Relays und WebSockets
 */
async function networkOnly(request) {
  try {
    return await fetch(request);
  } catch (error) {
    return new Response('Offline - Keine Verbindung', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: new Headers({
        'Content-Type': 'text/plain'
      })
    });
  }
}

// ============================================================================
// INSTALL EVENT (Cache-Invalidierung)
// ============================================================================

self.addEventListener('install', (event) => {
  console.log('[Service Worker] Install Event - Cache Version:', CACHE_VERSION);

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Cache opened:', cache);
      // Cache Version speichern
      const cacheVersionRequest = new Request('/api/cache-version');
      const cacheVersionResponse = new Response(
        JSON.stringify({ version: CACHE_VERSION, name: CACHE_NAME }),
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Cache-Version': CACHE_VERSION.toString(),
            'Cache-Control': 'no-cache, no-store, must-revalidate'
          }
        }
      );
      return cache.put(cacheVersionRequest, cacheVersionResponse);
    }).then(() => {
      // Keepalive starten (verhindert, dass Browser SW killt)
      startKeepAlive();
      console.log('[Service Worker] Keepalive started');
    }).catch((error) => {
      console.error('[Service Worker] Install failed:', error);
    })
  );
});

// ============================================================================
// ACTIVATE EVENT
// ============================================================================

self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activate Event - Cache Version:', CACHE_VERSION);

  // Keepalive starten (falls er noch nicht läuft)
  stopKeepAlive();
  startKeepAlive();
  console.log('[Service Worker] Keepalive restarted on activate');

  // Alte Caches leeren
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .map((cacheName) => {
            // Nur alte Caches leeren (nicht den aktuellen)
            if (cacheName !== CACHE_NAME) {
              console.log('[Service Worker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
            return Promise.resolve();
          })
      );
    }).then(() => {
      // Alle Clients benachrichtigen
      return self.clients.claim();
    }).catch((error) => {
      console.error('[Service Worker] Activate failed:', error);
    })
  );
});

// ============================================================================
// DEACTIVATE EVENT
// ============================================================================

self.addEventListener('deactivate', (event) => {
  console.log('[Service Worker] Deactivate Event - stopping keepalive');
  stopKeepAlive();
});

// ============================================================================
// MESSAGE EVENT (Client-Kommunikation)
// ============================================================================

self.addEventListener('message', (event) => {
  const { data } = event;
  console.log('[Service Worker] Message received:', data);

  // Cache leeren
  if (data.type === 'CLEAR_CACHE') {
    console.log('[Service Worker] Clearing cache...');
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.keys().then((keys) => {
          return Promise.all(
            keys.map((key) => cache.delete(key))
          );
        }).then(() => {
          // Cache Version zurücksetzen
          const cacheVersionRequest = new Request('/api/cache-version');
          const cacheVersionResponse = new Response(
            JSON.stringify({ version: CACHE_VERSION, name: CACHE_NAME, cleared: true }),
            {
              headers: {
                'Content-Type': 'application/json',
                'X-Cache-Version': CACHE_VERSION.toString(),
                'Cache-Control': 'no-cache, no-store, must-revalidate'
              }
            }
          );
          return cache.put(cacheVersionRequest, cacheVersionResponse);
        });
      }).then(() => {
        // Erfolgsmeldung an Client
        event.ports[0].postMessage({
          type: 'CLEAR_CACHE_SUCCESS',
          version: CACHE_VERSION
        });
      }).catch((error) => {
        console.error('[Service Worker] Clear cache failed:', error);
        event.ports[0].postMessage({
          type: 'CLEAR_CACHE_ERROR',
          error: error.message
        });
      })
    );
  }

  // Cache-Version abrufen
  if (data.type === 'GET_CACHE_VERSION') {
    console.log('[Service Worker] Getting cache version...');
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match('/api/cache-version');
      }).then((response) => {
        if (response) {
          return response.json().then((data) => {
            event.ports[0].postMessage({
              type: 'CACHE_VERSION',
              version: data.version,
              name: data.name,
              cleared: data.cleared || false
            });
          });
        } else {
          event.ports[0].postMessage({
            type: 'CACHE_VERSION',
            version: CACHE_VERSION,
            name: CACHE_NAME,
            cleared: false
          });
        }
      }).catch((error) => {
        console.error('[Service Worker] Get cache version failed:', error);
        event.ports[0].postMessage({
          type: 'CACHE_VERSION',
          version: CACHE_VERSION,
          name: CACHE_NAME,
          cleared: false
        });
      })
    );
  }

  // Cache invalidieren
  if (data.type === 'INVALIDATE_CACHE') {
    console.log('[Service Worker] Invalidating cache...');
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.keys().then((keys) => {
          return Promise.all(
            keys.map((key) => cache.delete(key))
          );
        });
      }).then(() => {
        event.ports[0].postMessage({
          type: 'INVALIDATE_CACHE_SUCCESS',
          version: CACHE_VERSION
        });
      }).catch((error) => {
        console.error('[Service Worker] Invalidate cache failed:', error);
        event.ports[0].postMessage({
          type: 'INVALIDATE_CACHE_ERROR',
          error: error.message
        });
      })
    );
  }
});

// ============================================================================
// SKIP WAITING (beschleunigt Service Worker Updates)
// ============================================================================

// skipWaiting() entfernt - kann Service Worker killen
// Der Service Worker wird automatisch bei Änderungen aktiviert
console.log('[Service Worker] Skip waiting deaktiviert');

// ============================================================================
// GLOBAL ERROR HANDLING
// ============================================================================

// Alle globalen Errors abfangen
self.addEventListener('error', (error) => {
  console.error('[Service Worker] Global error:', error);
  console.error('[Service Worker] Error message:', error.message);
  console.error('[Service Worker] Error filename:', error.filename);
  console.error('[Service Worker] Error lineno:', error.lineno);
  console.error('[Service Worker] Error colno:', error.coleno);
});

// Alle unhandled rejections abfangen
self.addEventListener('unhandledrejection', (event) => {
  console.error('[Service Worker] Unhandled rejection:', event.reason);
});

// ============================================================================
// KEEPALIVE (verhindert, dass Browser den SW killt)
// ============================================================================

let keepAliveTimer = null;

function startKeepAlive() {
  // Jede 30 Sekunden einen leeren fetch ausführen
  keepAliveTimer = setInterval(async () => {
    try {
      // Leere Anfrage, um den SW am Leben zu erhalten
      await fetch('https://test.mojobus.co/?keepalive=' + Date.now());
      console.log('[Service Worker] Keepalive ping sent');
    } catch (error) {
      console.error('[Service Worker] Keepalive error:', error);
    }
  }, 30000); // 30 Sekunden
}

function stopKeepAlive() {
  if (keepAliveTimer) {
    clearInterval(keepAliveTimer);
    keepAliveTimer = null;
    console.log('[Service Worker] Keepalive stopped');
  }
}

// ============================================================================
// FETCH EVENT (Cache-Strategien)
// ============================================================================

// skipWaiting() entfernt - kann Service Worker killen
// Der Service Worker wird automatisch bei Änderungen aktiviert
console.log('[Service Worker] Skip waiting deaktiviert');
