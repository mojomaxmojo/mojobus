/**
 * Haushaltsbuch - Kategorien-Konfiguration
 * 
 * Definiert alle verfügbaren Kategorien für Einnahmen und Ausgaben
 */

export interface BudgetCategory {
  id: string;
  label: string;
  icon: string;
  color: string;
  description?: string;
}

export interface BudgetCategories {
  expense: BudgetCategory[];
  income: BudgetCategory[];
}

export const BUDGET_CATEGORIES: BudgetCategories = {
  expense: [
    { 
      id: 'essen', 
      label: 'Essen & Trinken', 
      icon: '🍔', 
      color: '#f97316',
      description: 'Lebensmittel, Restaurants, Getränke'
    },
    { 
      id: 'sprit', 
      label: 'Sprit & Kraftstoff', 
      icon: '⛽', 
      color: '#3b82f6',
      description: 'Diesel, Benzin, Gas'
    },
    { 
      id: 'camping', 
      label: 'Camping & Übernachtung', 
      icon: '🏕️', 
      color: '#22c55e',
      description: 'Campingplätze, Hotels, Stellplätze'
    },
    { 
      id: 'reparatur', 
      label: 'Reparaturen & Wartung', 
      icon: '🔧', 
      color: '#ef4444',
      description: 'Fahrzeug, Ausrüstung, Werkstatt'
    },
    { 
      id: 'gesundheit', 
      label: 'Gesundheit & Apotheke', 
      icon: '💊', 
      color: '#ec4899',
      description: 'Medikamente, Arzt, Versicherung'
    },
    { 
      id: 'freizeit', 
      label: 'Freizeit & Ausflüge', 
      icon: '🎉', 
      color: '#8b5cf6',
      description: 'Aktivitäten, Eintritte, Unterhaltung'
    },
    { 
      id: 'kommunikation', 
      label: 'Kommunikation & Internet', 
      icon: '📱', 
      color: '#06b6d4',
      description: 'Handy, SIM-Karten, WLAN'
    },
    { 
      id: 'versicherung', 
      label: 'Versicherungen', 
      icon: '🛡️', 
      color: '#f59e0b',
      description: 'KFZ, Haftpflicht, Reiseversicherung'
    },
    { 
      id: 'ausruestung', 
      label: 'Ausrüstung & Zubehör', 
      icon: '🎒', 
      color: '#84cc16',
      description: 'Neue Ausrüstung, Ersatz, Upgrades'
    },
    { 
      id: 'sonstiges', 
      label: 'Sonstiges', 
      icon: '🛒', 
      color: '#6b7280',
      description: 'Alles was sonst nirgends passt'
    }
  ],
  income: [
    { 
      id: 'gehalt', 
      label: 'Gehalt', 
      icon: '💼', 
      color: '#22c55e',
      description: 'Regelmäßiges Einkommen'
    },
    { 
      id: 'geschenk', 
      label: 'Geldgeschenk', 
      icon: '🎁', 
      color: '#f59e0b',
      description: 'Geschenke von Familie & Freunden'
    },
    { 
      id: 'refund', 
      label: 'Rückerstattung', 
      icon: '↩️', 
      color: '#3b82f6',
      description: 'Storno, Garantie, Rückzahlung'
    },
    { 
      id: 'verkauf', 
      label: 'Verkauf', 
      icon: '💰', 
      color: '#8b5cf6',
      description: 'Verkauf von Gegenständen'
    },
    { 
      id: 'rente', 
      label: 'Rente & Sozialleistung', 
      icon: '🏛️', 
      color: '#06b6d4',
      description: 'Rente, Arbeitslosengeld, etc.'
    },
    { 
      id: 'zinsen', 
      label: 'Zinsen & Dividenden', 
      icon: '📈', 
      color: '#ec4899',
      description: 'Kapitalerträge'
    },
    { 
      id: 'sonstiges', 
      label: 'Sonstiges', 
      icon: '💵', 
      color: '#6b7280',
      description: 'Andere Einnahmen'
    }
  ]
};

/**
 * Hilfsfunktion: Kategorie anhand der ID finden
 */
export const getCategoryById = (id: string, type: 'expense' | 'income'): BudgetCategory | undefined => {
  return BUDGET_CATEGORIES[type].find(cat => cat.id === id);
};

/**
 * Hilfsfunktion: Alle Kategorien als flatt Array
 */
export const getAllCategories = (): BudgetCategory[] => {
  return [...BUDGET_CATEGORIES.expense, ...BUDGET_CATEGORIES.income];
};

export default BUDGET_CATEGORIES;
