/**
 * Nostr Konfiguration für MojoBus Blog
 */

// Autoren-Daten (zentralisiert für einfache Verwaltung)
export const AUTHORS = [
  {
    id: 'mojo',
    name: 'Mojo',
    npub: 'npub1f4vym2mu3q9fsz08muz8d469hl568l5358qx90qlaspyuz67ru0sfxvupf',
    pubkey: '4d584dab7c880a9809e7df0476d745bfe9a3fe91a1c062bc1fec024e0b5e1f1f',
  },
  {
    id: 'susanne',
    name: 'Susanne',
    npub: 'npub1jn4arsy5pzqausut0u79x2mnur2dd34szcxnlc5c5407f828002qd3jm5n',
    pubkey: '94afa1cfb1c7e23f00c27e0705ae628703f0e084b391e278fb3f8fd0ffc1e400',
  },
] as const;

export const NOSTR_CONFIG = {
  // Autoren NPUBs (Legacy-Support)
  authors: Object.fromEntries(AUTHORS.map(a => [a.id, a.npub])),
  
  // Autoren Pubkeys (hex format für Nostr queries)
  authorPubkeys: AUTHORS.map(a => a.pubkey),

  // Event Kinds
  kinds: {
    note: 1,        // Short notes
    longform: 30023, // Long-form articles (NIP-23)
    metadata: 0,     // Profile metadata
  },

  // Cache settings
  cache: {
    maxAge: 1000 * 60 * 60, // 1 hour
    staleTime: 1000 * 60 * 5, // 5 minutes
  },
};

export default NOSTR_CONFIG;
