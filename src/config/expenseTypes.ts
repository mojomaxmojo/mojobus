/**
 * Expense Types for MojoBus Household Book
 * Secure, encrypted expense tracking for Mojo & Susanne
 */

import { AUTHORS } from './relays';

// ============================================================================
// EXPENSE EVENT KINDS
// ============================================================================

export const EXPENSE_KINDS = {
  EXPENSE: 40000,          // Encrypted expense entry
  CATEGORY: 40001,         // Category definition (parameterized replaceable)
  BUDGET: 40002,           // Budget plan (replaceable)
} as const;

// ============================================================================
// EXPENSE DATA INTERFACES
// ============================================================================

export interface ExpenseData {
  /** Amount in EUR (always EUR for simplicity) */
  amount: number;
  
  /** Category ID (references EXPENSE_CATEGORIES) */
  category: string;
  
  /** Detailed description */
  description: string;
  
  /** Date in ISO format: "2025-03-05" */
  date: string;
  
  /** Optional location as text (no GPS) */
  location?: string;
  
  /** Optional receipt image as NIP-19 identifier */
  receiptImage?: string;
  
  /** Private tags for categorization */
  tags: string[];
  
  /** Created timestamp (Unix) */
  createdAt: number;
  
  /** Updated timestamp (Unix) */
  updatedAt: number;
}

export interface ExpenseEvent {
  /** Nostr event ID */
  id: string;
  
  /** Expense data (encrypted in actual event) */
  data: ExpenseData;
  
  /** Author pubkey who created this */
  author: string;
  
  /** When the event was created */
  createdAt: number;
  
  /** When the event was published */
  publishedAt?: number;
}

export interface ExpenseCategory {
  /** Unique category ID */
  id: string;
  
  /** Display name */
  name: string;
  
  /** Emoji for visual representation */
  emoji: string;
  
  /** CSS color for charts */
  color: string;
  
  /** Optional description */
  description?: string;
  
  /** Sort order */
  order: number;
}

export interface BudgetPlan {
  /** Month in "YYYY-MM" format */
  month: string;
  
  /** Total budget for the month */
  total: number;
  
  /** Budget per category */
  categories: {
    [categoryId: string]: number;
  };
  
  /** Notes about this budget */
  notes?: string;
}

// ============================================================================
// EXPENSE CATEGORIES (Vanlife-focused)
// ============================================================================

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  // 🚐 TRANSPORT
  {
    id: 'transport',
    name: 'Transport',
    emoji: '🚐',
    color: '#3B82F6', // Blue
    description: 'Diesel, Reparaturen, Versicherung, Steuer',
    order: 1,
  },
  {
    id: 'fuel',
    name: 'Diesel/Benzin',
    emoji: '⛽',
    color: '#60A5FA',
    description: 'Kraftstoffkosten',
    order: 2,
  },
  
  // 🏕️ CAMPING & UNTERKUNFT
  {
    id: 'camping',
    name: 'Camping & Stellplatz',
    emoji: '🏕️',
    color: '#10B981', // Green
    description: 'Stellplatzgebühren, Wohnmobilstellplatz',
    order: 3,
  },
  {
    id: 'accommodation',
    name: 'Übernachtung',
    emoji: '🏨',
    color: '#34D399',
    description: 'Hotel, Ferienwohnung, andere Unterkünfte',
    order: 4,
  },
  
  // 🍔 VERPFLEGUNG
  {
    id: 'groceries',
    name: 'Supermarkt',
    emoji: '🛒',
    color: '#F59E0B', // Amber
    description: 'Lebensmitteleinkäufe',
    order: 5,
  },
  {
    id: 'restaurant',
    name: 'Restaurant/Café',
    emoji: '🍽️',
    color: '#FBBF24',
    description: 'Essen gehen, Café-Besuche',
    order: 6,
  },
  
  // 📱 KOMMUNIKATION & ENERGIE
  {
    id: 'communication',
    name: 'Kommunikation',
    emoji: '📱',
    color: '#8B5CF6', // Violet
    description: 'SIM-Karten, Internet, Mobilfunk',
    order: 7,
  },
  {
    id: 'energy',
    name: 'Energie',
    emoji: '⚡',
    color: '#A78BFA',
    description: 'Strom, Solar, Gas, Heizung',
    order: 8,
  },
  
  // 🎟️ AKTIVITÄTEN
  {
    id: 'activities',
    name: 'Aktivitäten',
    emoji: '🎟️',
    color: '#EC4899', // Pink
    description: 'Eintritte, Touren, Ausflüge, Freizeit',
    order: 9,
  },
  
  // 🛠️ WARTUNG & REPARATUR
  {
    id: 'maintenance',
    name: 'Wartung & Reparatur',
    emoji: '🛠️',
    color: '#6B7280', // Gray
    description: 'Wohnmobil-Wartung, Reparaturen',
    order: 10,
  },
  
  // 💰 SONSTIGES
  {
    id: 'shopping',
    name: 'Einkäufe',
    emoji: '🛍️',
    color: '#F97316', // Orange
    description: 'Kleidung, Haushalt, andere Einkäufe',
    order: 11,
  },
  {
    id: 'health',
    name: 'Gesundheit',
    emoji: '🏥',
    color: '#EF4444', // Red
    description: 'Apotheke, Arzt, Medikamente',
    order: 12,
  },
  {
    id: 'other',
    name: 'Sonstiges',
    emoji: '💰',
    color: '#94A3B8', // Slate
    description: 'Verschiedene Ausgaben',
    order: 99,
  },
];

// ============================================================================
// AUTHOR CONFIGURATION
// ============================================================================

export const MOJO_PUBKEY = '4d584dab7c880a9809e7df0476d745bfe9a3fe91a1c062bc1fec024e0b5e1f1f';
export const SUSANNE_PUBKEY = '94ebd1c0940881de438b7f3c532b73e0d4d6c6b0160d3fe0b8a55fe49d477bd4';

export const AUTHOR_PUBKEYS = [MOJO_PUBKEY, SUSANNE_PUBKEY] as const;

export type AuthorId = 'mojo' | 'susanne';

export function getAuthorPubkey(authorId: AuthorId): string {
  const author = AUTHORS.find(a => a.id === authorId);
  if (!author) {
    throw new Error(`Author ${authorId} not found`);
  }
  return author.pubkey;
}

export function isAuthorizedUser(pubkey: string): boolean {
  return AUTHOR_PUBKEYS.includes(pubkey as any);
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

export function isExpenseData(data: any): data is ExpenseData {
  return (
    data &&
    typeof data === 'object' &&
    typeof data.amount === 'number' &&
    typeof data.category === 'string' &&
    typeof data.description === 'string' &&
    typeof data.date === 'string' &&
    Array.isArray(data.tags) &&
    typeof data.createdAt === 'number'
  );
}

export function isExpenseCategory(category: any): category is ExpenseCategory {
  return (
    category &&
    typeof category === 'object' &&
    typeof category.id === 'string' &&
    typeof category.name === 'string' &&
    typeof category.emoji === 'string' &&
    typeof category.color === 'string' &&
    typeof category.order === 'number'
  );
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function getCategoryById(id: string): ExpenseCategory | undefined {
  return EXPENSE_CATEGORIES.find(cat => cat.id === id);
}

export function formatAmount(amount: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function getMonthFromDate(date: string): string {
  return date.substring(0, 7); // "YYYY-MM"
}

export function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export default {
  EXPENSE_KINDS,
  EXPENSE_CATEGORIES,
  MOJO_PUBKEY,
  SUSANNE_PUBKEY,
  AUTHOR_PUBKEYS,
  getAuthorPubkey,
  isAuthorizedUser,
  isExpenseData,
  isExpenseCategory,
  getCategoryById,
  formatAmount,
  getMonthFromDate,
  getCurrentMonth,
};