/**
 * Autor-Utility-Funktionen für MojoBus Blog
 * Hilfsfunktionen zur Identifikation und Konfiguration von Autoren
 */

import { getAuthorRelayConfigByPubkey } from '@/config/relays';
import { getBlossomConfigByPubkey } from '@/config/blossom';

// ============================================================================
// AUTOR-IDENTIFIKATION
// ============================================================================

/**
 * Autor-Konfiguration
 */
export interface AuthorConfig {
  /** Autor ID */
  id: string;
  /** Nostr npub */
  npub: string;
  /** Nostr pubkey (hex) */
  pubkey: string;
  /** Relays für diesen Autor */
  readRelays: string[];
  writeRelays: string[];
  activeRelay: string;
  /** Blossom-Server für diesen Autor */
  blossomServers: string[];
  preferredBlossomServer: string;
}

/**
 * Alle bekannten Autoren
 */
export const KNOWN_AUTHORS = {
  mojo: {
    id: 'mojo',
    npub: 'npub1f4vym2mu3q9fsz08muz8d469hl568l5358qx90qlaspyuz67ru0sfxvupf',
    pubkey: '4d584dab7c880a9809e7df0476d745bfe9a3fe91a1c062bc1fec024e0b5e1f1f',
  },
  susanne: {
    id: 'susanne',
    npub: 'npub1jn4arsy5pzqausut0u79x2mnur2dd34szcxnlc9c5407f828002qdls5wz',
    pubkey: '94ebd1c0940881de438b7f3c532b73e0d4d6c6b0160d3fe0b8a55fe49d477bd4',
  },
} as const;

// ============================================================================
// AUTOR-LOOKUP FUNKTIONEN
// ============================================================================

/**
 * Prüft ob eine pubkey einem bekannten Autor gehört
 */
export const isKnownAuthor = (pubkey?: string): boolean => {
  if (!pubkey) return false;

  return Object.values(KNOWN_AUTHORS).some(
    (author) => author.pubkey === pubkey
  );
};

/**
 * Holt die Autor-ID basierend auf pubkey
 */
export const getAuthorIdByPubkey = (pubkey?: string): string | null => {
  if (!pubkey) return null;

  const author = Object.values(KNOWN_AUTHORS).find(
    (author) => author.pubkey === pubkey
  );

  return author?.id || null;
};

/**
 * Holt die Autor-ID basierend auf npub
 */
export const getAuthorIdByNpub = (npub: string): string | null => {
  const author = Object.values(KNOWN_AUTHORS).find(
    (author) => author.npub === npub
  );

  return author?.id || null;
};

// ============================================================================
// AUTOR-KONFIGURATION FUNKTIONEN
// ============================================================================

/**
 * Holt die vollständige Konfiguration für einen Autor basierend auf pubkey
 * Kombiniert Relay- und Blossom-Konfiguration
 */
export const getAuthorConfigByPubkey = (pubkey?: string): AuthorConfig | null => {
  if (!pubkey) return null;

  // Hole Relay-Konfiguration
  const relayConfig = getAuthorRelayConfigByPubkey(pubkey);
  if (!relayConfig) return null;

  // Hole Blossom-Konfiguration
  const blossomConfig = getBlossomConfigByPubkey(pubkey);

  return {
    id: relayConfig.authorId,
    npub: relayConfig.npub,
    pubkey: relayConfig.pubkey,
    readRelays: relayConfig.read,
    writeRelays: relayConfig.write,
    activeRelay: relayConfig.activeRelay,
    blossomServers: blossomConfig?.servers || [],
    preferredBlossomServer: blossomConfig?.preferred || '',
  };
};

/**
 * Holt die vollständige Konfiguration für einen Autor basierend auf npub
 */
export const getAuthorConfigByNpub = (npub: string): AuthorConfig | null => {
  const author = Object.values(KNOWN_AUTHORS).find(
    (author) => author.npub === npub
  );

  if (!author) return null;

  return getAuthorConfigByPubkey(author.pubkey);
};

// ============================================================================
// HELPER FUNKTIONEN
// ============================================================================

/**
 * Generiert einen Namen aus einer npub (für unbekannte Autoren)
 */
export const generateNameFromNpub = (npub: string): string => {
  const last7 = npub.slice(-7);
  return `anon_${last7}`;
};

/**
 * Generiert einen Namen aus einer pubkey (für unbekannte Autoren)
 */
export const generateNameFromPubkey = (pubkey: string): string => {
  return `anon_${pubkey.slice(-7)}`;
};

// ============================================================================
// EXPORTS
// ============================================================================

export type { AuthorConfig };
export default KNOWN_AUTHORS;
