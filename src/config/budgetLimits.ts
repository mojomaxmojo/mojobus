/**
 * Haushaltsbuch - Budget-Limits Konfiguration
 * 
 * Standard-Budget-Limits pro Kategorie (monatlich)
 * Diese werden in den Einstellungen überschreibbar sein
 */

export interface BudgetLimit {
  categoryId: string;
  limit: number;
  warningThreshold: number; // Prozent (z.B. 80 = Warnung bei 80%)
  currency: string;
}

export interface BudgetLimitsConfig {
  categories: BudgetLimit[];
  total: number;
  totalWarningThreshold: number;
  currency: string;
}

/**
 * Standard-Budget-Limits (monatlich)
 * Werden in den Einstellungen überschreibbar
 */
export const DEFAULT_BUDGET_LIMITS: BudgetLimitsConfig = {
  categories: [
    { categoryId: 'essen', limit: 500, warningThreshold: 80, currency: 'EUR' },
    { categoryId: 'sprit', limit: 400, warningThreshold: 80, currency: 'EUR' },
    { categoryId: 'camping', limit: 300, warningThreshold: 80, currency: 'EUR' },
    { categoryId: 'reparatur', limit: 200, warningThreshold: 80, currency: 'EUR' },
    { categoryId: 'gesundheit', limit: 100, warningThreshold: 80, currency: 'EUR' },
    { categoryId: 'freizeit', limit: 150, warningThreshold: 80, currency: 'EUR' },
    { categoryId: 'kommunikation', limit: 50, warningThreshold: 80, currency: 'EUR' },
    { categoryId: 'versicherung', limit: 100, warningThreshold: 80, currency: 'EUR' },
    { categoryId: 'ausruestung', limit: 100, warningThreshold: 80, currency: 'EUR' },
    { categoryId: 'sonstiges', limit: 100, warningThreshold: 80, currency: 'EUR' }
  ],
  total: 2000,
  totalWarningThreshold: 90,
  currency: 'EUR'
};

/**
 * Hilfsfunktion: Limit für eine Kategorie holen
 */
export const getCategoryLimit = (categoryId: string): BudgetLimit | undefined => {
  return DEFAULT_BUDGET_LIMITS.categories.find(limit => limit.categoryId === categoryId);
};

/**
 * Hilfsfunktion: Berechnen wie viel vom Budget verbraucht ist
 */
export const calculateBudgetUsage = (spent: number, limit: number): {
  percentage: number;
  remaining: number;
  isOverBudget: boolean;
  isWarning: boolean;
  status: 'safe' | 'warning' | 'danger';
} => {
  const percentage = Math.round((spent / limit) * 100);
  const remaining = limit - spent;
  const isOverBudget = spent > limit;
  const isWarning = percentage >= 80 && !isOverBudget;
  
  let status: 'safe' | 'warning' | 'danger' = 'safe';
  if (isOverBudget) status = 'danger';
  else if (isWarning) status = 'warning';

  return {
    percentage,
    remaining,
    isOverBudget,
    isWarning,
    status
  };
};

export default DEFAULT_BUDGET_LIMITS;
