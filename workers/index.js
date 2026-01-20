/**
 * Cloudflare Service Worker für MojoBus
 * Edge-Caching mit KV Namespaces und R2 Storage
 * Performance: 10-100x schneller als Deno Deploy
 */

// ============================================================================
// CACHING STRATEGIE (Cloudflare Edge)
// ============================================================================

const CACHE_VERSION = 6; // Cache Version erhöhen für Invalidation
const CACHE_NAME = `mojobus-v${CACHE_VERSION}`;
const CACHE_TTL = 3600; // 1 Stunde (Cloudflare Edge Cache)

// ============================================================================
// ENVIRONMENT VARIABLES (Cloudflare Secrets/Variables)
// ============================================================================

// Diese werden beim Deploy via Wrangler konfiguriert
const {
  R2_BUCKET_NAME = 'mojobus-assets',
  KV_NAMESPACE = 'mojobus-cache',
  API_BASE_URL = 'https://mojobus.deno.dev',
} = env;

// ============================================================================
// ASSET CACHING (KV Namespace)
// ============================================================================

/**
 * Asset aus KV Cache abrufen
 * @param {Request} request - HTTP Request
 * @param {string} key - Cache Key (z.B. "main-TWY2LFXF.js")
 * @returns {Promise<Response|null>} - Cached Response oder null
 */
async function getCachedAsset(request, key) {
  try {
    const cached = await KV_NAMESPACE.get(key, { type: 'json' });

    if (!cached) {
      return null;
    }

    console.log(`[Cloudflare] Cache Hit: ${key}`);

    return new Response(cached.body, {
      status: cached.status || 200,
      headers: new Headers(cached.headers)
    });
  } catch (error) {
    console.error(`[Cloudflare] KV Error:`, error);
    return null;
  }
}

/**
 * Asset in KV Cache speichern
 * @param {string} key - Cache Key
 * @param {Response} response - HTTP Response
 * @param {number} ttl - Time To Live in Sekunden
 */
async function setCachedAsset(key, response, ttl = CACHE_TTL) {
  try {
    const body = await response.text();
    const headers = Object.fromEntries(response.headers.entries());

    await KV_NAMESPACE.put(key, {
      value: JSON.stringify({
        status: response.status,
        headers: headers,
        body: body,
        cached_at: Date.now() / 1000
      }),
      expirationTtl: ttl
    });

    console.log(`[Cloudflare] Cached: ${key} (${response.status})`);
  } catch (error) {
    console.error(`[Cloudflare] KV Error:`, error);
  }
}

/**
 * Cache invalidieren (alle Assets löschen)
 */
async function invalidateCache() {
  try {
    const keys = await KV_NAMESPACE.list();
    
    for (const key of keys.keys) {
      await KV_NAMESPACE.delete(key.name);
    }

    console.log(`[Cloudflare] Cache Invalidated: ${keys.keys.length} items deleted`);
    
    return { success: true, count: keys.keys.length };
  } catch (error) {
    console.error(`[Cloudflare] Cache Invalidation Error:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Cache-Version abrufen
 */
async function getCacheVersion() {
  try {
    const version = await KV_NAMESPACE.get('cache-version', { type: 'json' });
    return version ? version.value : { version: CACHE_VERSION, name: CACHE_NAME };
  } catch (error) {
    return { version: CACHE_VERSION, name: CACHE_NAME };
  }
}

// ============================================================================
// ROUTING (Cloudflare Pages Functions)
// ============================================================================

/**
 * API Request an Backend weiterleiten
 * @param {Request} request - HTTP Request
 * @returns {Promise<Response>} - Backend Response
 */
async function proxyToBackend(request) {
  const backendUrl = new URL(request.url);
  backendUrl.hostname = 'mojobus.deno.dev';

  console.log(`[Cloudflare] Proxying to Backend: ${backendUrl.hostname}`);

  const response = await fetch(backendUrl.toString(), {
    method: request.method,
    headers: request.headers,
    body: request.body,
    cf: { cacheEverything: true, cacheTtl: CACHE_TTL }
  });

  // Cloudflare-Caching-Header hinzufügen
  const newHeaders = new Headers(response.headers);
  newHeaders.set('CF-Cache-Status', 'HIT');
  newHeaders.set('X-Cloudflare-Edge', 'true');

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders
  });
}

/**
 * Cache-Strategie auswählen
 * @param {Request} request - HTTP Request
 * @param {string} url - Request URL
 * @returns {Promise<Response>} - Response
 */
async function handleRequest(request, url) {
  const { pathname } = new URL(url);

  console.log(`[Cloudflare] Handling: ${pathname}`);

  // ============================================================================
  // 1. API Requests (an Backend proxyen)
  // ============================================================================

  if (pathname.startsWith('/api/')) {
    return proxyToBackend(request);
  }

  // ============================================================================
  // 2. Nostr Relays (Network-Only)
  // ============================================================================

  if (url.includes('nos.lol') || url.includes('relay.') || url.includes('wss://')) {
    return fetch(url);
  }

  // ============================================================================
  // 3. Assets mit Hash (Cache-First aus KV)
  // ============================================================================

  if (pathname.match(/\.(js|css|woff|woff2|ttf|eot|otf|png|jpg|jpeg|webp|gif|svg)$/i)) {
    // Hash aus Filename extrahieren
    const filename = pathname.split('/').pop();
    const hashMatch = filename.match(/-[a-fA-F0-9]{8,}\./);
    
    if (hashMatch) {
      const hash = hashMatch[0].substring(1);
      const cacheKey = `${pathname}-${hash}`;

      // Zuerst aus KV Cache laden
      const cachedResponse = await getCachedAsset(request, cacheKey);

      if (cachedResponse) {
        // Cloudflare Edge Cache Header hinzufügen
        const headers = new Headers(cachedResponse.headers);
        headers.set('CF-Cache-Status', 'HIT');
        headers.set('X-KV-Cache', 'true');

        return cachedResponse;
      }

      // Cache Miss: Vom Backend laden und in KV speichern
      const response = await proxyToBackend(request);

      if (response.ok) {
        // Hintergrund: In KV speichern (ohne zu warten)
        const ctx = waitUntil(setCachedAsset(cacheKey, response, 3600)); // 1 Stunde TTL
        ctx.catch(error => console.error('[Cloudflare] Cache Error:', error));
      }

      const headers = new Headers(response.headers);
      headers.set('CF-Cache-Status', 'MISS');
      headers.set('X-KV-Cache', 'false');

      return new Response(response.body, {
        status: response.status,
        headers: headers
      });
    }
  }

  // ============================================================================
  // 4. HTML-Seiten (Network-First)
  // ============================================================================

  if (pathname.match(/\.html$/) || pathname === '/') {
    const response = await proxyToBackend(request);
    
    const headers = new Headers(response.headers);
    headers.set('CF-Cache-Status', 'PASS');
    headers.set('X-Cloudflare-Edge', 'true');

    return new Response(response.body, {
      status: response.status,
      headers: headers
    });
  }

  // ============================================================================
  // 5. Sonstige Requests (Network-Only)
  // ============================================================================

  const response = await proxyToBackend(request);
  
  const headers = new Headers(response.headers);
  headers.set('CF-Cache-Status', 'PASS');

  return new Response(response.body, {
    status: response.status,
    headers: headers
  });
}

// ============================================================================
// MAIN EVENT LISTENER
// ============================================================================

export default {
  async fetch(request, env, ctx) {
    // Environment Variables global verfügbar machen
    global.env = env;

    const url = new URL(request.url);
    const { pathname } = url;

    console.log(`[Cloudflare] Request: ${request.method} ${pathname}`);

    // ============================================================================
    // API ENDPOINTS (Message Handling)
    // ============================================================================

    if (pathname === '/api/cache-version') {
      const cacheVersion = await getCacheVersion();
      return new Response(JSON.stringify(cacheVersion), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'X-Cache-Version': cacheVersion.version.toString()
        },
        cf: { cacheTtl: 0 } // Kein Cache für API-Endpoints
      });
    }

    if (pathname === '/api/clear-cache' && request.method === 'POST') {
      const result = await invalidateCache();
      return new Response(JSON.stringify(result), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        cf: { cacheTtl: 0 }
      });
    }

    if (pathname === '/api/health') {
      return new Response(JSON.stringify({
        status: 'ok',
        version: CACHE_VERSION,
        platform: 'cloudflare',
        region: request.cf?.colo || 'unknown',
        timestamp: Date.now()
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        cf: { cacheTtl: 10 } // 10 Sekunden Cache
      });
    }

    // ============================================================================
    // STATIC ASSETS (KV Caching)
    // ============================================================================

    return handleRequest(request, url.href);
  }
};
