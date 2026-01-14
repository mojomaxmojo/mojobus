/**
 * Service Worker für MojoBus
 * Offline-Fähigkeit und verbessertes Caching mit Workbox
 */

const CACHE_NAME = 'mojobus-v1';
const CACHE_VERSION = 1;

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
 * Für dynamische Inhalte und API-Requests
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
    // Network fehlschlägt, versuche Cache
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Kein Cache verfügbar, return offline fallback
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
 * Gibt sofort Cache zurück, aktualisiert im Hintergrund
 * Für dynamische Inhalte die schnell geladen werden sollen
 */
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);

  // Asynchrones Update im Hintergrund
  const fetchPromise = fetch(request).then(networkResponse => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  });

  // Return sofort den Cache, falls vorhanden
  if (cachedResponse) {
    return cachedResponse;
  }

  // Warte auf Network wenn kein Cache
  return fetchPromise;
}

/**
 * Network-Only Strategie
 * Nur Network, kein Cache
 * Für Nostr-Queries und WebSocket-Verbindungen
 */
function networkOnly(request) {
  return fetch(request);
}

// ============================================================================
// INSTALLATION
// ============================================================================

self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installation gestartet');

  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      console.log('[Service Worker] Cache geöffnet:', CACHE_NAME);

      // Kritische Assets vorab cachen
      const criticalAssets = [
        '/',
        '/index.html',
        '/mojobuslogo.png',
      ];

      // Versuche Assets zu cachen, aber nicht blockieren
      const cachePromises = criticalAssets.map(async (asset) => {
        try {
          await cache.add(asset);
          console.log('[Service Worker] Gecacht:', asset);
        } catch (error) {
          console.warn('[Service Worker] Konnte nicht cachen:', asset, error);
        }
      });

      await Promise.allSettled(cachePromises);
    })
  );

  // Service Worker sofort aktivieren
  self.skipWaiting();

  console.log('[Service Worker] Installation abgeschlossen');
});

// ============================================================================
// AKTIVIERUNG
// ============================================================================

self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Aktivierung gestartet');

  event.waitUntil(
    caches.keys().then(async (cacheNames) => {
      // Lösche alte Caches
      const oldCaches = cacheNames.filter(
        (cacheName) => cacheName !== CACHE_NAME
      );

      await Promise.all(
        oldCaches.map((cacheName) => {
          console.log('[Service Worker] Lösche alten Cache:', cacheName);
          return caches.delete(cacheName);
        })
      );

      console.log('[Service Worker] Alle Caches bereinigt');
    })
  );

  // Service Worker sofort kontrollieren
  self.clients.claim();

  console.log('[Service Worker] Aktivierung abgeschlossen');
});

// ============================================================================
// FETCH HANDLING
// ============================================================================

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // ============================================================================
  // STRATEGIE-AUSWAHL
  // ============================================================================

  // 1. Cache-First für Assets (sehr selten ändernde Dateien)
  if (
    url.pathname.startsWith('/assets/') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.js')
  ) {
    // CSS/JS Files und Assets
    event.respondWith(cacheFirst(request));
    return;
  }

  // 2. Cache-First für statische Images
  if (
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.jpeg') ||
    url.pathname.endsWith('.webp') ||
    url.pathname.endsWith('.gif') ||
    url.pathname.endsWith('.svg')
  ) {
    // Bilder (außer Nostr Profile Images die dynamisch sind)
    if (!url.hostname.includes('blossom') && !url.hostname.includes('primal')) {
      event.respondWith(cacheFirst(request));
      return;
    }
  }

  // 3. Cache-First für Font-Dateien
  if (
    url.pathname.endsWith('.woff') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.ttf') ||
    url.pathname.endsWith('.eot')
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // 4. Cache-First für Vendor Chunks
  if (
    url.pathname.includes('react-vendor') ||
    url.pathname.includes('icons-vendor') ||
    url.pathname.includes('query-vendor') ||
    url.pathname.includes('radix-vendor') ||
    url.pathname.includes('cv-vendor') ||
    url.pathname.includes('css-utils-vendor') ||
    url.pathname.includes('polyfills')
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // 5. Network-First für App Code Chunks
  if (
    url.pathname.includes('hooks') ||
    url.pathname.includes('app-components') ||
    url.pathname.includes('ui-components') ||
    url.pathname.includes('pages') ||
    url.pathname.includes('utils') ||
    url.pathname.includes('services') ||
    url.pathname.includes('contexts') ||
    url.pathname.includes('config')
  ) {
    event.respondWith(networkFirst(request));
    return;
  }

  // 6. Network-Only für Nostr-Queries und WebSocket
  if (
    url.protocol === 'ws:' ||
    url.protocol === 'wss:' ||
    url.hostname.includes('relay.') ||
    url.hostname.includes('nos.lol') ||
    url.hostname.includes('damus.io') ||
    url.hostname.includes('primal.net') ||
    url.hostname.includes('nostr.band') ||
    url.hostname.includes('strfry.net')
  ) {
    // Nicht cachen - immer frische Daten
    return;
  }

  // 7. Network-First für API-Requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // 8. Stale-While-Revalidate für HTML-Seiten
  if (url.pathname.endsWith('.html') || url.pathname === '/') {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // ============================================================================
  // DEFAULT STRATEGIE
  // ============================================================================

  // Für alles andere: Network-First mit Fallback auf Cache
  event.respondWith(networkFirst(request));
});

// ============================================================================
// MESSAGE HANDLING
// ============================================================================

self.addEventListener('message', (event) => {
  console.log('[Service Worker] Nachricht erhalten:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    // Service Worker sofort aktualisieren
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CACHE_CLEAR') {
    // Alle Caches leeren
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      })
    );
  }

  if (event.data && event.data.type === 'CACHE_VERSION') {
    // Cache-Version zurückgeben
    event.ports[0].postMessage({ version: CACHE_VERSION });
  }
});

// ============================================================================
// SYNC HANDLING (Background Sync)
// ============================================================================

self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background Sync:', event.tag);

  if (event.tag === 'sync-posts') {
    event.waitUntil(
      // Hier könnte man synchronisieren, wenn das Gerät wieder online ist
      Promise.resolve()
    );
  }
});

// ============================================================================
// PUSH HANDLING (für Benachrichtigungen)
// ============================================================================

self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push Notification erhalten');

  if (event.data) {
    const data = event.data.json();

    event.waitUntil(
      self.registration.showNotification(data.title || 'MojoBus', {
        body: data.body || 'Neue Inhalte verfügbar!',
        icon: '/mojobuslogo.png',
        badge: '/mojobuslogo.png',
        data: data.url || '/',
      })
    );
  }
});

// ============================================================================
// NOTIFICATION CLICK HANDLING
// ============================================================================

self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification Click:', event);

  event.notification.close();

  event.waitUntil(
    clients.openWindow(event.notification.data || '/')
  );
});
