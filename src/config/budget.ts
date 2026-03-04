/**
 * Haushaltsbuch - Hauptkonfiguration
 * 
 * Zentrale Konfiguration für das Haushaltsbuch
 */

import { AUTHORS } from './relays';

// ============================================================================
// HAUSHALTSBUCH KONSTANTEN
// ============================================================================

/**
 * Nostr Event Kind für verschlüsselte Budget-Einträge
 * 37375 = Private Datenspeicherung (Parameterized Replaceable)
 */
export const BUDGET_EVENT_KIND = 37375;

/**
 * Tag-Bezeichner für Budget-Einträge
 */
export const BUDGET_TAG = 'haushaltsbuch';

/**
 * Währung
 */
export const DEFAULT_CURRENCY = 'EUR';

/**
 * Datum-Format für Anzeige
 */
export const DATE_FORMAT = 'dd.MM.yyyy';

/**
 * Monat-Format für Anzeige
 */
export const MONTH_FORMAT = 'MMMM yyyy';

// ============================================================================
// BERECHTIGTE AUTOREN (AUS RELAYS.TS)
// ============================================================================

/**
 * Pubkeys der berechtigten Autoren für das Haushaltsbuch
 * Diese können sowohl lesen als auch schreiben
 */
export const BUDGET_AUTHORIZED_PUBKEYS = AUTHORS.map(author => author.pubkey);

/**
 * Npubs der berechtigten Autoren
 */
export const BUDGET_AUTHORIZED_NPUBS = AUTHORS.map(author => author.npub);

/**
 * Prüft ob ein pubkey berechtigt ist
 */
export const isBudgetAuthorized = (pubkey: string): boolean => {
  return BUDGET_AUTHORIZED_PUBKEYS.includes(pubkey);
};

// ============================================================================
// RELAY-KONFIGURATION FÜR HAUSHALTSBUCH
// ============================================================================

/**
 * Relays für Haushaltsbuch (verwendet privates Relay)
 */
export const BUDGET_RELAYS = [
  'wss://relay.mojobus.co'
];

// ============================================================================
// TYPES
// ============================================================================

export type TransactionType = 'expense' | 'income';

export interface BudgetTransaction {
  id: string;           // Eindeutige ID
  type: TransactionType;
  amount: number;       // Positiv bei Einnahme, positiv bei Ausgabe (wird durch type unterschieden)
  category: string;     // Kategorie-ID
  description: string;
  date: string;         // ISO-String (YYYY-MM-DD)
  currency: string;
  imageUrl?: string;    // Optional: Beleg-Foto
  createdBy: string;    // pubkey des Erstellers
  createdAt: number;    // Unix-Timestamp
  updatedAt?: number;   // Unix-Timestamp (bei Bearbeitung)
}

export interface BudgetMonth {
  year: number;
  month: number;  // 1-12
  transactions: BudgetTransaction[];
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

export interface BudgetStats {
  period: {
    start: string;
    end: string;
  };
  totalIncome: number;
  totalExpense: number;
  balance: number;
  byCategory: Record<string, {
    total: number;
    count: number;
    percentage: number;
  }>;
  dailyAverage: {
    income: number;
    expense: number;
  };
  topExpenses: Array<{
    category: string;
    total: number;
  }>;
}

export default {
  BUDGET_EVENT_KIND,
  BUDGET_TAG,
  DEFAULT_CURRENCY,
  BUDGET_AUTHORIZED_PUBKEYS,
  BUDGET_AUTHORIZED_NPUBS,
  BUDGET_RELAYS
};
