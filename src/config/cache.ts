/**
 * Cache-Konfiguration für MojoBus Blog
 * Granulare Cache-Zeiten für optimale Performance
 *
 * STRATEGIE: 24H Cache für alles (außer Profile)
 * - Persönliches Blog/Diary: Wenige Updates pro Tag
 * - Maximale Performance: Minimale Nostr Queries
 * - Manuell Refresh möglich für frische Inhalte
 */

// ============================================================================
// CACHE-ZEITEN (in Millisekunden)
// ============================================================================

export const CACHE_TIMES = {
  // ============================================================================
  // PROFILE CACHE (länger - ändern sich fast nie)
  // ============================================================================
  profile: {
    // Profil-Metadaten (kind 0): 7 Tage
    // Namen, Bilder, NIP-05 ändern sich extrem selten
    staleTime: 1000 * 60 * 60 * 24 * 7,  // 7 Tage
    gcTime: 1000 * 60 * 60 * 24 * 14,     // 14 Tage

    // Relay Lists (kind 10002): 30 Tage
    // Relay-Konfigurationen ändern sich fast nie
    staleTime: 1000 * 60 * 60 * 24 * 30,  // 30 Tage
    gcTime: 1000 * 60 * 60 * 24 * 45,     // 45 Tage
  },

  // ============================================================================
  // LISTEN CACHE (24h - 1-2 Updates pro Tag)
  // ============================================================================
  lists: {
    // Artikel-Listen: 24 Stunden
    // Neue Artikel kommen nicht öfter als 1-2x pro Tag
    staleTime: 1000 * 60 * 60 * 24,  // 24 Stunden
    gcTime: 1000 * 60 * 60 * 24 * 3, // 3 Tage

    // Note-Listen: 24 Stunden
    // Neue Notes kommen nicht öfter als 1-2x pro Tag
    staleTime: 1000 * 60 * 60 * 24,  // 24 Stunden
    gcTime: 1000 * 60 * 60 * 24 * 3, // 3 Tage

    // Platz-Listen: 24 Stunden
    // Neue Plätze kommen selten hinzu
    staleTime: 1000 * 60 * 60 * 24,  // 24 Stunden
    gcTime: 1000 * 60 * 60 * 24 * 3, // 3 Tage

    // Bild-Listen: 24 Stunden
    // Neue Bilder kommen nicht oft hinzu
    staleTime: 1000 * 60 * 60 * 24,  // 24 Stunden
    gcTime: 1000 * 60 * 60 * 24 * 3, // 3 Tage

    // Tag-Listen (Kategorien): 24 Stunden
    // Tag-basierte Listen
    staleTime: 1000 * 60 * 60 * 24,  // 24 Stunden
    gcTime: 1000 * 60 * 60 * 24 * 3, // 3 Tage
  },

  // ============================================================================
  // EINZELNE ITEMS CACHE (24h - 1-2 Updates pro Tag)
  // ============================================================================
  items: {
    // Einzelne Artikel: 24 Stunden
    // Artikel werden selten aktualisiert
    staleTime: 1000 * 60 * 60 * 24,  // 24 Stunden
    gcTime: 1000 * 60 * 60 * 24 * 3, // 3 Tage

    // Einzelne Notes: 24 Stunden
    // Notes werden selten aktualisiert
    staleTime: 1000 * 60 * 60 * 24,  // 24 Stunden
    gcTime: 1000 * 60 * 60 * 24 * 3, // 3 Tage

    // Einzelne Plätze: 24 Stunden
    // Plätze werden selten aktualisiert
    staleTime: 1000 * 60 * 60 * 24,  // 24 Stunden
    gcTime: 1000 * 60 * 60 * 24 * 3, // 3 Tage

    // Einzelne Bilder: 24 Stunden
    // Bilder ändern sich nie (immutable URLs)
    staleTime: 1000 * 60 * 60 * 24 * 365, // 1 Jahr (immutable)
    gcTime: 1000 * 60 * 60 * 24 * 730,    // 2 Jahre
  },

  // ============================================================================
  // INTERAKTIONEN CACHE (12h - selten, aber öfter als Content)
  // ============================================================================
  interactions: {
    // Reaktionen (Likes, Reposts, Zaps): 12 Stunden
    // Reaktionen kommen öfter vor als Content-Updates
    staleTime: 1000 * 60 * 60 * 12,  // 12 Stunden
    gcTime: 1000 * 60 * 60 * 24,     // 24 Stunden

    // Kommentare: 12 Stunden
    // Kommentare kommen öfter vor als Content-Updates
    staleTime: 1000 * 60 * 60 * 12,  // 12 Stunden
    gcTime: 1000 * 60 * 60 * 24,     // 24 Stunden
  },

  // ============================================================================
  // KOMBINIERTE QUERY CACHE (useContent Hook)
  // ============================================================================
  combined: {
    // Kombinierte Content-Listen (Notes + Articles): 24 Stunden
    staleTime: 1000 * 60 * 60 * 24,  // 24 Stunden
    gcTime: 1000 * 60 * 60 * 24 * 3, // 3 Tage
  },
} as const;

// ============================================================================
// DEFAULT CACHE-KONFIGURATION
// ============================================================================

/**
 * Standard-Cache-Zeiten für TanStack Query
 * Kann in einzelnen Hooks überschrieben werden
 */
export const DEFAULT_CACHE_CONFIG = {
  // Profile (länger - ändern sich fast nie)
  profile: {
    staleTime: CACHE_TIMES.profile.staleTime,
    gcTime: CACHE_TIMES.profile.gcTime,
  },

  // Listen (24h - 1-2 Updates pro Tag)
  lists: {
    staleTime: CACHE_TIMES.lists.staleTime,
    gcTime: CACHE_TIMES.lists.gcTime,
  },

  // Einzelne Items (24h - 1-2 Updates pro Tag)
  items: {
    staleTime: CACHE_TIMES.items.staleTime,
    gcTime: CACHE_TIMES.items.gcTime,
  },

  // Interaktionen (12h - seltener als Content, aber öfter als Profile)
  interactions: {
    staleTime: CACHE_TIMES.interactions.staleTime,
    gcTime: CACHE_TIMES.interactions.gcTime,
  },

  // Kombinierte Query (useContent Hook)
  combined: {
    staleTime: CACHE_TIMES.combined.staleTime,
    gcTime: CACHE_TIMES.combined.gcTime,
  },
} as const;

// ============================================================================
// HELPER-FUNKTIONEN
// ============================================================================

/**
 * Formatiert Millisekunden in lesbaren String
 * @param ms - Zeit in Millisekunden
 * @returns Formatierte Zeit (z.B. "24 Stunden", "7 Tage")
 */
export function formatCacheTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(weeks / 4);
  const years = Math.floor(days / 365);

  if (years > 0) {
    return `${years} Jahr${years > 1 ? 'e' : ''}`;
  }
  if (months > 0) {
    return `${months} Monat${months > 1 ? 'e' : ''}`;
  }
  if (weeks > 0) {
    return `${weeks} Woche${weeks > 1 ? 'n' : ''}`;
  }
  if (days > 0) {
    return `${days} Stunde${days > 1 ? 'n' : ''}`;
  }
  if (hours > 0) {
    return `${hours} Stunde${hours > 1 ? 'n' : ''}`;
  }
  if (minutes > 0) {
    return `${minutes} Minute${minutes > 1 ? 'n' : ''}`;
  }
  return `${seconds} Sekunde${seconds > 1 ? 'n' : ''}`;
}

/**
 * Prüft ob ein Cache-Eintrag abgelaufen ist
 * @param cachedAt - Timestamp wann gecacht wurde (Unix Timestamp in Sekunden)
 * @param staleTime - Stale Time in Millisekunden
 * @returns true wenn abgelaufen, false wenn noch frisch
 */
export function isStale(cachedAt: number, staleTime: number): boolean {
  const now = Math.floor(Date.now() / 1000); // Unix Timestamp in Sekunden
  const ageInSeconds = now - cachedAt;
  const staleTimeInSeconds = staleTime / 1000;
  return ageInSeconds > staleTimeInSeconds;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default DEFAULT_CACHE_CONFIG;
