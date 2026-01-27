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

// Profile Cache (länger - ändern sich fast nie)
export const CACHE_PROFILE_METADATA_STALE_TIME = 1000 * 60 * 60 * 24 * 7; // 7 Tage
export const CACHE_PROFILE_METADATA_GC_TIME = 1000 * 60 * 60 * 24 * 14; // 14 Tage

export const CACHE_PROFILE_RELAY_LISTS_STALE_TIME = 1000 * 60 * 60 * 24 * 30; // 30 Tage
export const CACHE_PROFILE_RELAY_LISTS_GC_TIME = 1000 * 60 * 60 * 24 * 45; // 45 Tage

// Listen Cache (24h - 1-2 Updates pro Tag)
export const CACHE_LISTS_STALE_TIME = 1000 * 60 * 60 * 24; // 24 Stunden
export const CACHE_LISTS_GC_TIME = 1000 * 60 * 60 * 24 * 3; // 3 Tage

// Items Cache (24h - 1-2 Updates pro Tag)
export const CACHE_ITEMS_STALE_TIME = 1000 * 60 * 60 * 24; // 24 Stunden
export const CACHE_ITEMS_GC_TIME = 1000 * 60 * 60 * 24 * 3; // 3 Tage

// Bilder Cache (1 Jahr - immutable URLs)
export const CACHE_IMAGES_STALE_TIME = 1000 * 60 * 60 * 24 * 365; // 1 Jahr
export const CACHE_IMAGES_GC_TIME = 1000 * 60 * 60 * 24 * 730; // 2 Jahre

// Interaktionen Cache (12h - selten, aber öfter als Content)
export const CACHE_INTERACTIONS_STALE_TIME = 1000 * 60 * 60 * 12; // 12 Stunden
export const CACHE_INTERACTIONS_GC_TIME = 1000 * 60 * 60 * 24; // 24 Stunden

// Kombinierte Query Cache (useContent Hook)
export const CACHE_COMBINED_STALE_TIME = 1000 * 60 * 60 * 24; // 24 Stunden
export const CACHE_COMBINED_GC_TIME = 1000 * 60 * 60 * 24 * 3; // 3 Tage

// ============================================================================
// CACHE-ZEITEN GRUPPIERT
// ============================================================================

export const CACHE_TIMES = {
  profile: {
    metadata: {
      staleTime: CACHE_PROFILE_METADATA_STALE_TIME,
      gcTime: CACHE_PROFILE_METADATA_GC_TIME,
    },
    relayLists: {
      staleTime: CACHE_PROFILE_RELAY_LISTS_STALE_TIME,
      gcTime: CACHE_PROFILE_RELAY_LISTS_GC_TIME,
    },
  },
  lists: {
    staleTime: CACHE_LISTS_STALE_TIME,
    gcTime: CACHE_LISTS_GC_TIME,
  },
  items: {
    staleTime: CACHE_ITEMS_STALE_TIME,
    gcTime: CACHE_ITEMS_GC_TIME,
  },
  images: {
    staleTime: CACHE_IMAGES_STALE_TIME,
    gcTime: CACHE_IMAGES_GC_TIME,
  },
  interactions: {
    staleTime: CACHE_INTERACTIONS_STALE_TIME,
    gcTime: CACHE_INTERACTIONS_GC_TIME,
  },
  combined: {
    staleTime: CACHE_COMBINED_STALE_TIME,
    gcTime: CACHE_COMBINED_GC_TIME,
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
    staleTime: CACHE_PROFILE_METADATA_STALE_TIME,
    gcTime: CACHE_PROFILE_METADATA_GC_TIME,
  },

  // Listen (24h - 1-2 Updates pro Tag)
  lists: {
    staleTime: CACHE_LISTS_STALE_TIME,
    gcTime: CACHE_LISTS_GC_TIME,
  },

  // Einzelne Items (24h - 1-2 Updates pro Tag)
  items: {
    staleTime: CACHE_ITEMS_STALE_TIME,
    gcTime: CACHE_ITEMS_GC_TIME,
  },

  // Bilder (1 Jahr - immutable URLs)
  images: {
    staleTime: CACHE_IMAGES_STALE_TIME,
    gcTime: CACHE_IMAGES_GC_TIME,
  },

  // Interaktionen (12h - seltener als Content, aber öfter als Profile)
  interactions: {
    staleTime: CACHE_INTERACTIONS_STALE_TIME,
    gcTime: CACHE_INTERACTIONS_GC_TIME,
  },

  // Kombinierte Query (useContent Hook)
  combined: {
    staleTime: CACHE_COMBINED_STALE_TIME,
    gcTime: CACHE_COMBINED_GC_TIME,
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
