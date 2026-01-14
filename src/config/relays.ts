/**
 * Relay-Konfiguration für MojoBus Blog
 * Zentrale Verwaltung aller Relay-Einstellungen für manuelle Anpassungen
 */

import { Author } from './types';

// ============================================================================
// AUTOR-KONFIGURATION
// ============================================================================

export const AUTHORS: Author[] = [
  {
    id: 'mojo',
    name: 'Mojo',
    npub: 'npub1f4vym2mu3q9fsz08muz8d469hl568l5358qx90qlaspyuz67ru0sfxvupf',
    pubkey: '4d584dab7c880a9809e7df0476d745bfe9a3fe91a1c062bc1fec024e0b5e1f1f',
    nip05: 'mojo@mojobus.cc',
  },
  {
    id: 'susanne',
    name: 'Susanne',
    npub: 'npub1jn4arsy5pzqausut0u79x2mnur2dd34szcxnlc9c5407f828002qdls5wz',
    pubkey: '94ebd1c0940881de438b7f3c532b73e0d4d6c6b0160d3fe0b8a55fe49d477bd4',
    nip05: 'susanne@mojobus.cc',
  },
] as const;

// ============================================================================
// RELAY-KATEGORIEN
// ============================================================================

export type RelayCategory = 'fast' | 'reliable' | 'stable' | 'search' | 'nip11';

export interface RelayConfig {
  name: string;
  url: string;
  category: RelayCategory;
  description?: string;
  read?: boolean;
  write?: boolean;
  search?: boolean;
  nips?: number[];
}

// ============================================================================
// VERFÜGBARE RELAYS
// ============================================================================

export const RELAYS: RelayConfig[] = [
  // Schnelle Relays (Low Latency)
  {
    name: 'Damus',
    url: 'wss://relay.damus.io',
    category: 'fast',
    description: 'Reliable and fast relay by Damus team',
    read: true,
    write: true,
    search: true,
    nips: [1, 2, 9, 11, 12, 15, 16, 20, 22, 26, 40, 42, 50, 57, 70, 90],
  },
  {
    name: 'Nostr.Band',
    url: 'wss://relay.nostr.band',
    category: 'fast',
    description: 'Fast search relay with excellent indexing',
    read: true,
    write: true,
    search: true,
    nips: [1, 2, 9, 11, 12, 15, 16, 20, 22, 26, 40, 42, 50, 57, 70],
  },
  {
    name: 'Strfry',
    url: 'wss://nostr.strfry.net',
    category: 'fast',
    description: 'High-performance strfry relay',
    read: true,
    write: true,
    search: false,
    nips: [1, 2, 9, 11, 12, 15, 16, 20, 22, 26, 40, 42, 50, 57, 70, 90],
  },

  // Zuverlässige Relays (High Uptime)
  {
    name: 'Primal',
    url: 'wss://relay.primal.net',
    category: 'reliable',
    description: 'Enterprise-grade relay with excellent reliability',
    read: true,
    write: true,
    search: true,
    nips: [1, 2, 9, 11, 12, 15, 16, 20, 22, 26, 40, 42, 50, 57, 70],
  },
  {
    name: 'Ditto',
    url: 'wss://nos.lol',
    category: 'reliable',
    description: 'Popular relay with good performance',
    read: true,
    write: true,
    search: true,
    nips: [1, 2, 9, 11, 12, 15, 16, 20, 22, 26, 40, 42, 50, 57, 70],
  },

  // Stabile Relays (Long-term storage)
  {
    name: 'Relayer',
    url: 'wss://relay.le.nos.social',
    category: 'stable',
    description: 'French relay with good storage',
    read: true,
    write: true,
    search: false,
    nips: [1, 2, 9, 11, 12, 15, 16, 20, 22, 26, 40, 42, 50, 57, 70],
  },

  // Such-Relays (Spezialisiert für Search)
  {
    name: 'Nostr.Bitcoiner',
    url: 'wss://nostr.bitcoiner.social',
    category: 'search',
    description: 'Search relay for Bitcoin community',
    read: true,
    write: true,
    search: true,
    nips: [1, 2, 9, 11, 12, 15, 16, 20, 22, 26, 40, 42, 50, 57, 70],
  },

  // NIP-11 Relays (Mit Metadaten)
  {
    name: 'NIP-11 Demo',
    url: 'wss://relay.nips.co',
    category: 'nip11',
    description: 'NIP-11 compliant relay with metadata',
    read: true,
    write: true,
    search: false,
    nips: [1, 2, 9, 11, 12, 15, 16, 20, 22, 26, 40, 42, 50, 57, 70, 90],
  },
] as const;

// ============================================================================
// PRESET RELAY-KONFIGURATIONEN
// ============================================================================

export const RELAY_PRESETS = {
  // Schnelle Konfiguration (ein Relay für maximale Performance)
  fast: {
    name: 'Fast',
    description: 'Ein schneller Relay für maximale Performance',
    relayUrls: ['wss://nos.lol'],
    maxRelays: 1,
    queryTimeout: 2000,
  },

  // Balanced Konfiguration (Performance & Reliability)
  balanced: {
    name: 'Balanced',
    description: 'Ausgewogene Konfiguration für gute Performance und Zuverlässigkeit',
    relayUrls: [
      'wss://nos.lol',
      'wss://relay.primal.net',
    ],
    maxRelays: 2,
    queryTimeout: 3000,
  },

  // Reliable Konfiguration (maximale Zuverlässigkeit)
  reliable: {
    name: 'Reliable',
    description: 'Mehrere Relays für maximale Zuverlässigkeit',
    relayUrls: [
      'wss://nos.lol',
      'wss://relay.damus.io',
      'wss://relay.primal.net',
    ],
    maxRelays: 3,
    queryTimeout: 4000,
  },

  // Search-optimiert (für Such-Queries)
  search: {
    name: 'Search Optimized',
    description: 'Optimiert für Such-Queries mit Search-Relays',
    relayUrls: [
      'wss://nos.lol',
      'wss://nostr.bitcoiner.social',
    ],
    maxRelays: 2,
    queryTimeout: 5000,
  },

  // ========================================================================
  // NEUE PRESETS - Ohne relay.nostr.band
  // ========================================================================

  // Ultra-Fast (schnellster einzelner Relay)
  ultrafast: {
    name: 'Ultra Fast',
    description: 'Schnellster Relay für maximale Performance',
    relayUrls: ['wss://nos.lol'],
    maxRelays: 1,
    queryTimeout: 1500,
  },

  // Ultra-Reliable (maximale Redundanz - 4 Relays)
  ultrareliable: {
    name: 'Ultra Reliable',
    description: 'Maximale Redundanz mit 4 zuverlässigen Relays',
    relayUrls: [
      'wss://nos.lol',           // Ditto - schnell, zuverlässig
      'wss://relay.damus.io',    // Damus - etabliert, zuverlässig
      'wss://relay.primal.net',  // Primal - Enterprise-Grade
      'wss://nostr.strfry.net', // Strfry - High-Performance
    ],
    maxRelays: 4,
    queryTimeout: 3000,
  },

  // Storage-Optimiert (beste Langzeit-Speicherung)
  storage: {
    name: 'Storage Optimized',
    description: 'Optimiert für Langzeit-Speicherung der Events',
    relayUrls: [
      'wss://relay.damus.io',    // Damus - gute Speicherung
      'wss://relay.le.nos.social', // Relayer - spezialisiert auf Speicherung
      'wss://nos.lol',           // Ditto - zuverlässige Speicherung
    ],
    maxRelays: 3,
    queryTimeout: 4000,
  },
} as const;

// ============================================================================
// KATEGORIE-FILTER
// ============================================================================

export const getRelaysByCategory = (category: RelayCategory): RelayConfig[] => {
  return RELAYS.filter(relay => relay.category === category);
};

export const getRelaysByMultipleCategories = (categories: RelayCategory[]): RelayConfig[] => {
  return RELAYS.filter(relay => categories.includes(relay.category));
};

export const getRelayUrlsByCategory = (category: RelayCategory): string[] => {
  return getRelaysByCategory(category).map(relay => relay.url);
};

// ============================================================================
// RELAY SUCHEN
// ============================================================================

export const getRelayByName = (name: string): RelayConfig | undefined => {
  return RELAYS.find(relay => relay.name === name);
};

export const getRelayByUrl = (url: string): RelayConfig | undefined => {
  return RELAYS.find(relay => relay.url === url);
};

export const getRelayUrls = (): string[] => {
  return RELAYS.map(relay => relay.url);
};

// ============================================================================
// RELAY-FUNKTIONALITÄTSFILTER
// ============================================================================

export const getReadRelays = (): RelayConfig[] => {
  return RELAYS.filter(relay => relay.read !== false);
};

export const getWriteRelays = (): RelayConfig[] => {
  return RELAYS.filter(relay => relay.write !== false);
};

export const getSearchRelays = (): RelayConfig[] => {
  return RELAYS.filter(relay => relay.search === true);
};

// ============================================================================
// DEFAULT APP-KONFIGURATION (Relay-spezifisch)
// ============================================================================

/**
 * Default Konfiguration für MojoBus Blog (Relay-spezifisch)
 * Kann durch localStorage überschrieben werden
 *
 * KONFIGURATION:
 * - READ (Abrufen/Queries): FAST Preset - maximale Performance beim Lesen
 * - WRITE (Veröffentlichen): ULTRA RELIABLE Preset - maximale Redundanz beim Posten
 *
 * ÄNDERUNGEN HIER:
 * - readRelayUrls: Liste der Relays für Queries (Lesen)
 * - readMaxRelays: Max. Anzahl Relays für Queries
 * - readQueryTimeout: Timeout in ms für Queries
 * - writeRelayUrls: Liste der Relays für Publishing (Schreiben)
 * - writeMaxRelays: Max. Anzahl Relays für Publishing
 * - activeRelay: Relay für das aktive Publishing (aus writeRelayUrls)
 */
export const DEFAULT_APP_CONFIG = {
  // ============================================================================
  // READ KONFIGURATION (Abrufen/Queries) - FAST Preset
  // ============================================================================
  read: {
    relayUrls: RELAY_PRESETS.ultrafast.relayUrls, // Nur nos.lol (Ditto) für maximale Performance
    maxRelays: RELAY_PRESETS.ultrafast.maxRelays, // Nur einen Relay verwenden
    queryTimeout: RELAY_PRESETS.ultrafast.queryTimeout, // 1500ms - schneller Timeout
  },

  // ============================================================================
  // WRITE KONFIGURATION (Veröffentlichen) - ULTRA RELIABLE Preset
  // ============================================================================
  write: {
    relayUrls: RELAY_PRESETS.ultrareliable.relayUrls, // 4 Relays für maximale Redundanz
    maxRelays: RELAY_PRESETS.ultrareliable.maxRelays, // Alle 4 Relays verwenden
    activeRelay: RELAY_PRESETS.ultrareliable.relayUrls[0], // nos.lol als aktiver Relay
  },

  // ============================================================================
  // GEMEINSAME OPTIONEN
  // ============================================================================
  enableDeduplication: true, // Deduplizierung von Events aktivieren
} as const;

// ============================================================================
// EXPORT KONSTANTEN FÜR KOMPATIBILITÄT
// ============================================================================

// Legacy support - Alias für alten Code
export const DEFAULT_RELAYS = RELAYS;

export default RELAYS;
