/**
 * Leon (Lionhunter) Konfiguration
 * Hunde-Geschichten und Abenteuer
 */

export const LEON_CONFIG = {
  // Automatische Tags für alle Leon-Inhalte
  autoTags: ['leon', 'lionhunter', 'hund', 'dog', 'doglife', 'dog-adventures'],

  // Leon-spezifische Tags
  tags: [
    'leon',
    'lionhunter',
    'hund',
    'dog',
    'doglife',
    'dog-adventures',
    'wohnmobil-hund',
    'camper-dog',
    'traveling-dog',
    'hund-im-wohnmobil',
    'vanlife-dog',
    'beach-dog',
    'hundegeschichten',
    'hundeabenteuer'
  ],

  // Leon's Profil
  authorPubkeys: [] // Add Leon's pubkey when available
} as const;

/**
 * Hilfsfunktion: Gibt alle Leon-Tags zurück
 */
export function getLeonTags(): string[] {
  return [...LEON_CONFIG.tags];
}

export default LEON_CONFIG;
