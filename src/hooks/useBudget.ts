/**
 * Haushaltsbuch Hook
 * 
 * Haupt-Hook für alle Haushaltsbuch-Operationen:
 * - Transaktionen laden/speichern
 * - Statistiken berechnen
 * - Budget-Verfolgung
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  type BudgetTransaction, 
  type BudgetStats, 
  type BudgetMonth,
  BUDGET_EVENT_KIND,
  BUDGET_TAG,
  DEFAULT_CURRENCY,
  BUDGET_RELAYS,
  BUDGET_AUTHORIZED_PUBKEYS
} from '@/config/budget';
import { BUDGET_CATEGORIES, type BudgetCategory } from '@/config/budgetCategories';
import { DEFAULT_BUDGET_LIMITS, calculateBudgetUsage, type BudgetLimit } from '@/config/budgetLimits';
import { useBudgetEncryption } from './useBudgetEncryption';
import { useNostr } from './useNostr';
import { useToast } from './useToast';

// Simple ID generator
const generateEventId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

// ============================================================================
// TYPES
// ============================================================================

interface UseBudgetOptions {
  year?: number;
  month?: number;  // 1-12
}

interface UseBudgetReturn {
  // Daten
  transactions: BudgetTransaction[];
  currentMonth: BudgetMonth | null;
  stats: BudgetStats | null;
  
  // Loading States
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  
  // Aktionen
  addTransaction: (transaction: Omit<BudgetTransaction, 'id' | 'createdAt' | 'createdBy'>) => Promise<void>;
  updateTransaction: (id: string, updates: Partial<BudgetTransaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  
  // Navigation
  goToMonth: (year: number, month: number) => void;
  goToPreviousMonth: () => void;
  goToNextMonth: () => void;
  goToCurrentMonth: () => void;
  
  // Helpers
  getCategoryById: (id: string, type: 'expense' | 'income') => BudgetCategory | undefined;
  getCategoryLimit: (categoryId: string) => BudgetLimit | undefined;
  getCategoryUsage: (categoryId: string) => ReturnType<typeof calculateBudgetUsage> | null;
  
  // Export
  exportToCSV: () => string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

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

export function useBudget(options: UseBudgetOptions = {}): UseBudgetReturn {
  const { year: initialYear, month: initialMonth } = options;
  
  // State
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(initialYear || currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(initialMonth || currentDate.getMonth() + 1);
  const [error, setError] = useState<string | null>(null);
  
  // Hooks
  const { toast } = useToast();
  const { user, ndk } = useNostr();
  const queryClient = useQueryClient();
  const { encryptForAllAuthors, decryptFromEvent } = useBudgetEncryption();
  
  // Prüfe ob User berechtigt ist
  const isAuthorized = user?.pubkey && BUDGET_AUTHORIZED_PUBKEYS.includes(user.pubkey);

  // ============================================================================
  // QUERY: Transaktionen laden
  // ============================================================================

  const { 
    data: transactions = [], 
    isLoading,
    refetch 
  } = useQuery({
    queryKey: ['budget', selectedYear, selectedMonth],
    queryFn: async (): Promise<BudgetTransaction[]> => {
      if (!ndk || !user?.pubkey || !user?.privkey) {
        throw new Error('Nicht eingeloggt');
      }

      if (!isAuthorized) {
        throw new Error('Nicht berechtigt');
      }

      try {
        // Alle Budget-Events abrufen
        const filter = {
          kinds: [BUDGET_EVENT_KIND],
          '#t': [BUDGET_TAG],
          authors: BUDGET_AUTHORIZED_PUBKEYS,
          limit: 1000
        };

        const events = await ndk.fetchEvents(filter);
        const allTransactions: BudgetTransaction[] = [];

        for (const event of events) {
          try {
            // Verschlüsselten Content parsen
            const encryptedMap = JSON.parse(event.content);
            
            // Entschlüsseln
            const decrypted = decryptFromEvent<BudgetTransaction>(
              encryptedMap,
              user.pubkey,
              user.privkey,
              event.pubkey
            );

            if (decrypted) {
              allTransactions.push({
                ...decrypted,
                id: event.dTag || event.id,
                createdBy: event.pubkey,
                createdAt: event.created_at
              });
            }
          } catch (err) {
            console.warn('[Budget] Failed to decrypt event:', event.id, err);
          }
        }

        // Nach Datum sortieren (neueste zuerst)
        allTransactions.sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        return allTransactions;
      } catch (err) {
        console.error('[Budget] Load error:', err);
        throw err;
      }
    },
    enabled: !!ndk && !!user?.pubkey && isAuthorized,
    staleTime: 30000, // 30 Sekunden
  });

  // ============================================================================
  // MUTATION: Transaktion speichern
  // ============================================================================

  const saveMutation = useMutation({
    mutationFn: async (transaction: BudgetTransaction) => {
      if (!ndk || !user?.pubkey || !user?.privkey) {
        throw new Error('Nicht eingeloggt');
      }

      if (!isAuthorized) {
        throw new Error('Nicht berechtigt');
      }

      // Für alle Autoren verschlüsseln
      const encryptedContent = encryptForAllAuthors(transaction, user.privkey);

      // Event erstellen
      const event = {
        kind: BUDGET_EVENT_KIND,
        content: JSON.stringify(encryptedContent),
        tags: [
          ['t', BUDGET_TAG],
          ['d', transaction.id],
          ['type', transaction.type],
          ['category', transaction.category],
          ['date', transaction.date],
          ...BUDGET_AUTHORIZED_PUBKEYS.map(pk => ['p', pk])
        ],
        created_at: Math.floor(Date.now() / 1000)
      };

      // Publish
      // TODO: NDK publish implementieren
      
      return event;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget'] });
      toast({
        title: 'Gespeichert',
        description: 'Buchung wurde gespeichert'
      });
    },
    onError: (err: Error) => {
      toast({
        title: 'Fehler',
        description: err.message,
        variant: 'destructive'
      });
    }
  });

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
  // AKTIONEN
  // ============================================================================

  const addTransaction = useCallback(async (
    transactionData: Omit<BudgetTransaction, 'id' | 'createdAt' | 'createdBy'>
  ) => {
    if (!user?.pubkey) {
      throw new Error('Nicht eingeloggt');
    }

    const transaction: BudgetTransaction = {
      ...transactionData,
      id: generateEventId(),
      createdAt: Math.floor(Date.now() / 1000),
      createdBy: user.pubkey
    };

    await saveMutation.mutateAsync(transaction);
  }, [user?.pubkey, saveMutation]);

  const updateTransaction = useCallback(async (id: string, updates: Partial<BudgetTransaction>) => {
    const existing = transactions.find(t => t.id === id);
    if (!existing) {
      throw new Error('Transaktion nicht gefunden');
    }

    const updated: BudgetTransaction = {
      ...existing,
      ...updates,
      updatedAt: Math.floor(Date.now() / 1000)
    };

    await saveMutation.mutateAsync(updated);
  }, [transactions, saveMutation]);

  const deleteTransaction = useCallback(async (id: string) => {
    // TODO: Delete implementieren (replaceable event mit leerem content)
    console.log('Delete transaction:', id);
  }, []);

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
    isSaving: saveMutation.isPending,
    error,
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
