/**
 * Nostr Konfiguration für MojoBus Blog
 * Legacy-Konfiguration - Neue Konfigurationen unter ./relays.ts und ./app.ts
 */

import { Author } from '@/config/types';
import { AUTHORS, RELAYS as RELAYS_NEW } from './relays';

// Re-export AUTHORS aus relays.ts für Kompatibilität
export { AUTHORS, Author };

export const NOSTR_CONFIG = {
  // Autoren NPUBs (Legacy-Support)
  authors: Object.fromEntries(AUTHORS.map(a => [a.id, a.npub])),

  // Autoren NIP-05 Identifiers
  nip05: Object.fromEntries(AUTHORS.map(a => [a.id, a.nip05])),

  // Autoren Pubkeys (hex format für Nostr queries)
  authorPubkeys: AUTHORS.map(a => a.pubkey),

  // Event Kinds
  kinds: {
    note: 1,        // Short notes
    longform: 30023, // Long-form articles (NIP-23)
    metadata: 0,     // Profile metadata
  },

  // Cache settings - optimiert für Performance
  cache: {
    maxAge: 1000 * 60 * 60, // 1 hour
    staleTime: 1000 * 60 * 10, // 10 minutes (erhöht für bessere Performance)
  },
};

// Default Relay configuration - Import aus relays.ts
// Dies ist für Legacy-Unterstützung
export const DEFAULT_RELAYS = RELAYS_NEW;

export default NOSTR_CONFIG;