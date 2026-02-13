/**
 * Cost Tracker Types
 *
 * TypeScript interfaces for the Vanlife cost tracking system
 */

/**
 * Cost categories for Vanlife expenses
 */
export const COST_CATEGORIES = {
  diesel: {
    id: 'diesel',
    name: 'Diesel/Benzin',
    emoji: '🚗',
    description: 'Tanken, Dieselkraftstoff',
  },
  food: {
    id: 'food',
    name: 'Lebensmittel',
    emoji: '🍎',
    description: 'Supermarkt, Bäcker, Restaurants',
  },
  camping: {
    id: 'camping',
    name: 'Campingplätze',
    emoji: '⛺',
    description: 'Stellplätze mit Kosten',
  },
  repair: {
    id: 'repair',
    name: 'Reparaturen',
    emoji: '🔧',
    description: 'Bus-Wartung, Ersatzteile, Versicherung',
  },
  other: {
    id: 'other',
    name: 'Sonstiges',
    emoji: '📦',
    description: 'Internet, Ausrüstung, etc.',
  },
  sanitary: {
    id: 'sanitary',
    name: 'Sanitär',
    emoji: '🚿',
    description: 'Duschen, WC, Wasser',
  },
  heating: {
    id: 'heating',
    name: 'Heizung',
    emoji: '💨',
    description: 'Gasflaschen, Heizung',
  },
  power: {
    id: 'power',
    name: 'Strom',
    emoji: '⚡',
    description: 'Strom/Solar-Komponenten',
  },
  health: {
    id: 'health',
    name: 'Gesundheit',
    emoji: '💊',
    description: 'Vitamine, Medikamente',
  },
} as const;

export type CostCategoryId = keyof typeof COST_CATEGORIES;

/**
 * Cost entry interface
 */
export interface CostEntry {
  id: string;
  /** Encrypted content (only readable by authorized users) */
  encryptedContent?: string;
  /** Decrypted content (only available after decryption) */
  content?: {
    title: string;
    description?: string;
    receiptImage?: string;
    notes?: string;
  };
  /** Category ID */
  category: CostCategoryId;
  /** Amount in EUR */
  amount: number;
  /** Currency (default: EUR) */
  currency: string;
  /** Location name */
  location?: string;
  /** GPS coordinates (optional) */
  gps_lat?: number;
  gps_lon?: number;
  /** Date string (YYYY-MM-DD) */
  date: string;
  /** Unix timestamp */
  createdAt: number;
  /** Author pubkey */
  author: string;
}

/**
 * Monthly statistics
 */
export interface MonthlyStats {
  year: number;
  month: number;
  total: number;
  categoryTotals: Record<CostCategoryId, number>;
  entryCount: number;
}

/**
 * Category statistics
 */
export interface CategoryStats {
  category: CostCategoryId;
  total: number;
  count: number;
  average: number;
  percentage: number;
}

/**
 * Form data for new cost entry
 */
export interface CostFormData {
  title: string;
  amount: number;
  category: CostCategoryId;
  location?: string;
  date: string;
  description?: string;
  receiptImage?: string;
  notes?: string;
  gps_lat?: number;
  gps_lon?: number;
}

/**
 * Nostr event structure for cost entries
 */
export interface CostEvent {
  kind: number;
  created_at: number;
  tags: string[][];
  content: string;
  pubkey: string;
  id: string;
  sig: string;
}

/**
 * Cost tracker configuration
 */
export const COST_TRACKER_CONFIG = {
  /** Nostr event kind for cost entries */
  kind: 30001, // Replaceable parameterized replaceable event

  /** Event identifier */
  d: 'vanlife-cost-tracker',

  /** Allowed authors (Mojo and Susanne only) */
  allowedPubkeys: [
    '4d584dab7c880a9809e7df0476d745bfe9a3fe91a1c062bc1fec024e0b5e1f1f', // Mojo
    '94ebd1c0940881de438b7f3c532b73e0d4d6c6b0160d3fe0b8a55fe49d477bd4', // Susanne
  ],

  /** Encryption version */
  encryptionVersion: 'nip44',
} as const;
