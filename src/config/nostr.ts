/**
 * Nostr Konfiguration für MojoBus Blog
 */

export const NOSTR_CONFIG = {
  // Autoren NPUBs
  authors: {
    mojo: 'npub1f4vym2mu3q9fsz08muz8d469hl568l5358qx90qlaspyuz67ru0sfxvupf',
    partner: 'npub1jn4arsy5pzqausut0u79x2mnur2dd34szcxnlc5c5407f828002qdls5wz',
  },
  
  // Autoren Pubkeys (hex format für Nostr queries)
  authorPubkeys: [
    '4d584dab7c880a9809e7df0476d745bfe9a3fe91a1062bc1fec024e0b5e1f1f', // Mojo
    '92708a153ef245d2cf95d037c2ff767393b75d92e4de3a639948e47c7da4c595', // Partner
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
