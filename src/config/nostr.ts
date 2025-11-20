/**
 * Nostr Konfiguration für MojoBus Blog
 */

export const NOSTR_CONFIG = {
  // Autoren NPUBs
  authors: {
    mojo: 'npub1f4vym2mu3q9fsz08muz8d469hl568l5358qx90qlaspyuz67ru0sfxvupf',
    // TODO: Partner-NPUB hinzufügen, wenn verfügbar
  },

  // Autoren Pubkeys (hex format für Nostr queries)
  authorPubkeys: [
    '4d584dab7c880a9809e7df0476d745bfe9a3fe91a1c062bc1fec024e0b5e1f1f', // Mojo
    // TODO: Partner-Pubkey hinzufügen, wenn verfügbar
  ],

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
