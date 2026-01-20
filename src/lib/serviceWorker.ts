/**
 * Service Worker Registration
 * Registriert und verwaltet den Service Worker
 */

const SW_VERSION = '5.0.0';
const SW_URL = `/sw.js?v=${SW_VERSION}`;

let registration: ServiceWorkerRegistration | null = null;

/**
 * Prüft ob Service Worker unterstützt wird
 */
export function isServiceWorkerSupported(): boolean {
  return 'serviceWorker' in navigator && 'caches' in window;
}

/**
 * Registriert den Service Worker
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!isServiceWorkerSupported()) {
    console.warn('⚠️ Service Worker wird nicht unterstützt');
    return null;
  }

  try {
    // Prüfe ob bereits registriert
    if (registration) {
      console.log('ℹ️ Service Worker bereits registriert');
      return registration;
    }

    // Registriere Service Worker
    registration = await navigator.serviceWorker.register(SW_URL, {
      scope: '/',
    });

    console.log('✅ Service Worker registriert:', registration);

    // Warte auf Service Worker Activation
    if (registration.waiting) {
      console.log('ℹ️ Service Worker wartet auf Activation');
      sendMessageToSW({ type: 'SKIP_WAITING' });
    }

    // Überwache Service Worker Updates
    registration.addEventListener('updatefound', () => {
      console.log('ℹ️ Service Worker Update gefunden');
      const newWorker = registration!.installing;

      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          console.log('ℹ️ Service Worker Status:', newWorker.state);
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('✨ Neuer Service Worker verfügbar - Bitte Seite neu laden');
          }
        });
      }
    });

    return registration;
  } catch (error) {
    console.error('❌ Service Worker Registrierung fehlgeschlagen:', error);
    return null;
  }
}

/**
 * Unregistriert den Service Worker
 */
export async function unregisterServiceWorker(): Promise<void> {
  if (!registration) {
    try {
      registration = await navigator.serviceWorker.getRegistration();
    } catch (error) {
      console.warn('⚠️ Keine Service Worker Registrierung gefunden');
      return;
    }
  }

  if (registration) {
    await registration.unregister();
    console.log('✅ Service Worker unregistriert');
    registration = null;
  }
}

/**
 * Sendet eine Nachricht an den Service Worker
 */
export function sendMessageToSW(message: any): Promise<any> {
  return new Promise((resolve, reject) => {
    if (!navigator.serviceWorker.controller) {
      reject(new Error('Kein Service Worker Controller aktiv'));
      return;
    }

    // Erstelle Message Channel für Antwort
    const messageChannel = new MessageChannel();
    messageChannel.port1.onmessage = (event) => {
      resolve(event.data);
    };

    navigator.serviceWorker.controller.postMessage(message, [messageChannel.port2]);
  });
}

/**
 * Leert alle Caches
 */
export async function clearCaches(): Promise<void> {
  try {
    await sendMessageToSW({ type: 'CACHE_CLEAR' });
    console.log('✅ Alle Caches geleert');
  } catch (error) {
    console.error('❌ Caches leeren fehlgeschlagen:', error);
  }
}

/**
 * Holt die aktuelle Cache-Version
 */
export async function getCacheVersion(): Promise<number> {
  try {
    const response = await sendMessageToSW({ type: 'CACHE_VERSION' });
    return response?.version || 1;
  } catch (error) {
    console.error('❌ Cache-Version abrufen fehlgeschlagen:', error);
    return 1;
  }
}

/**
 * Prüft ob ein neuer Service Worker verfügbar ist
 */
export async function hasUpdate(): Promise<boolean> {
  if (!registration || !registration.waiting) {
    return false;
  }
  return true;
}

/**
 * Aktiviert den neuen Service Worker sofort
 */
export function activateUpdate(): void {
  if (registration && registration.waiting) {
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    window.location.reload();
  }
}

/**
 * Prüft ob das Gerät online ist
 */
export function isOnline(): boolean {
  return navigator.onLine;
}

/**
 * Fügt Online/Offline Event Listener hinzu
 */
export function addOnlineStatusListener(
  onOnline?: () => void,
  onOffline?: () => void
): () => void {
  const handleOnline = () => {
    console.log('🌐 Gerät ist jetzt online');
    if (onOnline) onOnline();
  };

  const handleOffline = () => {
    console.log('📡 Gerät ist jetzt offline');
    if (onOffline) onOffline();
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Cleanup Funktion
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}

/**
 * Prüft ob ein Request im Cache ist
 */
export async function isCached(url: string): Promise<boolean> {
  try {
    const cache = await caches.open('mojobus-v1');
    const cachedResponse = await cache.match(url);
    return cachedResponse !== undefined;
  } catch (error) {
    console.error('❌ Cache-Prüfung fehlgeschlagen:', error);
    return false;
  }
}

/**
 * Holt eine URL aus dem Cache
 */
export async function getFromCache(url: string): Promise<Response | null> {
  try {
    const cache = await caches.open('mojobus-v1');
    const cachedResponse = await cache.match(url);
    return cachedResponse || null;
  } catch (error) {
    console.error('❌ Cache-Abruf fehlgeschlagen:', error);
    return null;
  }
}

/**
 * Fügt eine URL zum Cache hinzu
 */
export async function addToCache(url: string): Promise<void> {
  try {
    const response = await fetch(url);
    if (response.ok) {
      const cache = await caches.open('mojobus-v1');
      await cache.put(url, response);
      console.log('✅ URL zum Cache hinzugefügt:', url);
    }
  } catch (error) {
    console.error('❌ URL zum Cache hinzufügen fehlgeschlagen:', error);
  }
}

// Automatische Registrierung bei Import
if (typeof window !== 'undefined') {
  if (isServiceWorkerSupported()) {
    // Registriere Service Worker wenn DOM geladen ist
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', registerServiceWorker);
    } else {
      registerServiceWorker();
    }
  }
}

export default {
  register: registerServiceWorker,
  unregister: unregisterServiceWorker,
  sendMessage: sendMessageToSW,
  clearCaches,
  getCacheVersion,
  hasUpdate,
  activateUpdate,
  isOnline,
  addOnlineStatusListener,
  isCached,
  getFromCache,
  addToCache,
};
