import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  type BudgetTransaction, 
  type BudgetStats, 
  type BudgetMonth
} from '@/config/budget';
import { BUDGET_CATEGORIES } from '@/config/budgetCategories';
import { DEFAULT_BUDGET_LIMITS, calculateBudgetUsage } from '@/config/budgetLimits';
import { useCurrentUser } from './useCurrentUser';
import { useToast } from './useToast';

// ============================================================================
// LOCAL STORAGE KEY
// ============================================================================

const STORAGE_KEY = 'haushaltsbuch_transactions';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Lädt Transaktionen aus localStorage
 */
function loadTransactions(): BudgetTransaction[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    
    const transactions = JSON.parse(data);
    return transactions.sort((a: BudgetTransaction, b: BudgetTransaction) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  } catch (error) {
    console.error('[Budget] Failed to load transactions:', error);
    return [];
  }
}

/**
 * Speichert Transaktionen in localStorage
 */
function saveTransactions(transactions: BudgetTransaction[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  } catch (error) {
    console.error('[Budget] Failed to save transactions:', error);
  }
}

/**
 * Berechnet Statistiken für eine Liste von Transaktionen
 */
function calculateStats(transactions: BudgetTransaction[]): BudgetStats {
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  // Nach Kategorie gruppieren
  const byCategory: Record<string, { total: number; count: number; percentage: number }> = {};
  
  transactions.filter(t => t.type === 'expense').forEach(t => {
    if (!byCategory[t.category]) {
      byCategory[t.category] = { total: 0, count: 0, percentage: 0 };
    }
    byCategory[t.category].total += t.amount;
    byCategory[t.category].count++;
  });

  // Prozentzahlen berechnen
  Object.keys(byCategory).forEach(cat => {
    byCategory[cat].percentage = totalExpense > 0 
      ? Math.round((byCategory[cat].total / totalExpense) * 100) 
      : 0;
  });

  // Top Expenses
  const topExpenses = Object.entries(byCategory)
    .map(([category, data]) => ({ category, total: data.total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  // Tagesdurchschnitt (basierend auf Tagen im Zeitraum)
  const dates = [...new Set(transactions.map(t => t.date))];
  const daysCount = dates.length || 1;
  
  const dailyAverage = {
    income: Math.round((totalIncome / daysCount) * 100) / 100,
    expense: Math.round((totalExpense / daysCount) * 100) / 100
  };

  // Zeitraum berechnen
  const sortedDates = transactions.map(t => t.date).sort();
  const period = {
    start: sortedDates[0] || new Date().toISOString().split('T')[0],
    end: sortedDates[sortedDates.length - 1] || new Date().toISOString().split('T')[0]
  };

  return {
    period,
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
    byCategory,
    dailyAverage,
    topExpenses
  };
}

/**
 * Berechnet Monats-Zusammenfassung
 */
function calculateMonth(transactions: BudgetTransaction[], year: number, month: number): BudgetMonth {
  const monthTransactions = transactions.filter(t => {
    const date = new Date(t.date);
    return date.getFullYear() === year && date.getMonth() + 1 === month;
  });

  const totalIncome = monthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalExpense = monthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  return {
    year,
    month,
    transactions: monthTransactions,
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense
  };
}

// ============================================================================
// HOOK
// ============================================================================

export function useBudget() {
  // State
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [transactions, setTransactions] = useState<BudgetTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Hooks
  const { toast } = useToast();
  const { user } = useCurrentUser();

  // Transaktionen beim Mounten laden
  useEffect(() => {
    const loaded = loadTransactions();
    setTransactions(loaded);
    setIsLoading(false);
  }, []);

  // ============================================================================
  // AKTIONEN
  // ============================================================================

  const addTransaction = useCallback(async (
    transactionData: Omit<BudgetTransaction, 'id' | 'createdAt' | 'createdBy'>
  ) => {
    if (!user?.pubkey) {
      toast({
        title: 'Nicht eingeloggt',
        description: 'Bitte loggen Sie sich ein, um Buchungen zu speichern.',
        variant: 'destructive'
      });
      throw new Error('Nicht eingeloggt');
    }

    setIsSaving(true);

    try {
      const transaction: BudgetTransaction = {
        ...transactionData,
        id: `budget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: Math.floor(Date.now() / 1000),
        createdBy: user.pubkey
      };

      const updatedTransactions = [transaction, ...transactions];
      setTransactions(updatedTransactions);
      saveTransactions(updatedTransactions);

      toast({
        title: 'Gespeichert',
        description: 'Buchung wurde gespeichert'
      });
    } catch (error) {
      console.error('[Budget] Save failed:', error);
      toast({
        title: 'Fehler',
        description: 'Buchung konnte nicht gespeichert werden.',
        variant: 'destructive'
      });
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [user?.pubkey, transactions, toast]);

  const updateTransaction = useCallback(async (id: string, updates: Partial<BudgetTransaction>) => {
    setIsSaving(true);

    try {
      const updated = transactions.map(t => 
        t.id === id ? { ...t, ...updates, updatedAt: Math.floor(Date.now() / 1000) } : t
      );
      
      setTransactions(updated);
      saveTransactions(updated);

      toast({
        title: 'Aktualisiert',
        description: 'Buchung wurde aktualisiert'
      });
    } catch (error) {
      console.error('[Budget] Update failed:', error);
      toast({
        title: 'Fehler',
        description: 'Buchung konnte nicht aktualisiert werden.',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  }, [transactions, toast]);

  const deleteTransaction = useCallback(async (id: string) => {
    setIsSaving(true);

    try {
      const updated = transactions.filter(t => t.id !== id);
      setTransactions(updated);
      saveTransactions(updated);

      toast({
        title: 'Gelöscht',
        description: 'Buchung wurde gelöscht'
      });
    } catch (error) {
      console.error('[Budget] Delete failed:', error);
      toast({
        title: 'Fehler',
        description: 'Buchung konnte nicht gelöscht werden.',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  }, [transactions, toast]);

  // ============================================================================
  // NAVIGATION
  // ============================================================================

  const goToMonth = useCallback((year: number, month: number) => {
    setSelectedYear(year);
    setSelectedMonth(month);
  }, []);

  const goToPreviousMonth = useCallback(() => {
    if (selectedMonth === 1) {
      setSelectedYear(y => y - 1);
      setSelectedMonth(12);
    } else {
      setSelectedMonth(m => m - 1);
    }
  }, [selectedMonth]);

  const goToNextMonth = useCallback(() => {
    if (selectedMonth === 12) {
      setSelectedYear(y => y + 1);
      setSelectedMonth(1);
    } else {
      setSelectedMonth(m => m + 1);
    }
  }, [selectedMonth]);

  const goToCurrentMonth = useCallback(() => {
    const now = new Date();
    setSelectedYear(now.getFullYear());
    setSelectedMonth(now.getMonth() + 1);
  }, []);

  // ============================================================================
  // ABGELEITETE DATEN
  // ============================================================================

  // Aktueller Monat
  const currentMonth = useMemo(() => {
    return calculateMonth(transactions, selectedYear, selectedMonth);
  }, [transactions, selectedYear, selectedMonth]);

  // Statistiken für aktuellen Monat
  const stats = useMemo(() => {
    if (!currentMonth) return null;
    return calculateStats(currentMonth.transactions);
  }, [currentMonth]);

  // ============================================================================
  // HELPERS
  // ============================================================================

  const getCategoryById = useCallback((id: string, type: 'expense' | 'income') => {
    return BUDGET_CATEGORIES[type].find(cat => cat.id === id);
  }, []);

  const getCategoryLimit = useCallback((categoryId: string) => {
    return DEFAULT_BUDGET_LIMITS.categories.find(l => l.categoryId === categoryId);
  }, []);

  const getCategoryUsage = useCallback((categoryId: string) => {
    if (!currentMonth) return null;
    
    const spent = currentMonth.transactions
      .filter(t => t.type === 'expense' && t.category === categoryId)
      .reduce((sum, t) => sum + t.amount, 0);
    
    const limit = getCategoryLimit(categoryId);
    if (!limit) return null;

    return calculateBudgetUsage(spent, limit.limit);
  }, [currentMonth, getCategoryLimit]);

  // ============================================================================
  // EXPORT
  // ============================================================================

  const exportToCSV = useCallback((): string => {
    if (!transactions.length) return '';

    const headers = ['Datum', 'Typ', 'Kategorie', 'Betrag', 'Währung', 'Beschreibung'];
    const rows = transactions.map(t => {
      const category = getCategoryById(t.category, t.type);
      return [
        t.date,
        t.type === 'income' ? 'Einnahme' : 'Ausgabe',
        category?.label || t.category,
        t.amount.toFixed(2),
        t.currency,
        t.description
      ];
    });

    const csv = [headers, ...rows].map(row => row.join(';')).join('\n');
    return csv;
  }, [transactions, getCategoryById]);

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    transactions,
    currentMonth,
    stats,
    isLoading,
    isSaving,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    goToMonth,
    goToPreviousMonth,
    goToNextMonth,
    goToCurrentMonth,
    getCategoryById,
    getCategoryLimit,
    getCategoryUsage,
    exportToCSV
  };
}

export default useBudget;
