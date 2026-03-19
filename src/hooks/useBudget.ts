/**
 * Hook für Haushaltsbuch-Funktionalität
 * Nutzt das private Relay wss://relay.mojobus.co/private
 */

import { useCallback, useMemo } from 'react';
import { useNostr } from './useNostr';
import { useNostrPublish } from './useNostrPublish';
import { useToast } from './useToast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import {
  BudgetEntry,
  BudgetFilter,
  BudgetStats,
  BUDGET_KINDS,
  BUDGET_TAGS,
  isValidBudgetEntry,
  createBudgetEntryId,
  getMonthKey,
  getDateRangeForMonth,
  formatAmount,
} from '@/types/budget';
import {
  BUDGET_CONFIG,
  DEFAULT_CATEGORIES,
  getCategoryById,
} from '@/config/budget';
import { AUTHORS } from '@/config/nostr';
import { RELAY_PRESETS } from '@/config/relays';

// Helper function to create d-tag
function createDTag(year?: number, month?: number): string {
  if (year && month) {
    return `budget:${year}-${String(month).padStart(2, '0')}`;
  }
  return 'budget';
}

// Export individual hooks for direct usage
export function useBudgetCategories() {
  return useQuery({
    queryKey: ['budget', 'categories'],
    queryFn: async () => {
      return DEFAULT_CATEGORIES;
    },
    staleTime: Infinity,
  });
}

export function useBudget() {
  const { query } = useNostr();
  const publishMutation = useNostrPublish();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Autoren-Pubkeys für Filterung
  const authorPubkeys = useMemo(() => {
    return AUTHORS.map(a => a.pubkey);
  }, []);

  // Private Relay-Konfiguration aus zentraler Config
  const budgetRelayConfig = useMemo(() => {
    return {
      relayUrls: RELAY_PRESETS.budget.relayUrls,
      maxRelays: RELAY_PRESETS.budget.maxRelays,
      queryTimeout: RELAY_PRESETS.budget.queryTimeout,
    };
  }, []);

  // Budget-Einträge abrufen
  const useBudgetEntries = (filter?: BudgetFilter) => {
    return useQuery({
      queryKey: ['budget', 'entries', filter],
      queryFn: async () => {
        try {
          console.log('Fetching budget entries from relay...');
          
          // Query für Budget-Einträge mit Fallback
          let events = [];
          try {
            events = await query([
              {
                kinds: [BUDGET_CONFIG.KINDS.ENTRY],
                authors: authorPubkeys,
                limit: 1000,
              }
            ], budgetRelayConfig) || [];
          } catch (queryError: any) {
            console.warn('Query failed (expected AbortSignal error):', queryError?.message);
            // Bei AbortSignal-Fehler: Leeres Array zurückgeben
            // Die Einträge werden durch Cache-Updates hinzugefügt
            return [];
          }

          console.log('Received events:', events.length);

          const entries: BudgetEntry[] = [];
          
          for (const event of events) {
            try {
              const content = JSON.parse(event.content);
              
              if (isValidBudgetEntry(content)) {
                entries.push(content);
              }
            } catch (error) {
              console.warn('Failed to parse budget entry:', error);
            }
          }

          // Filter anwenden
          let filteredEntries = entries;
          
          if (filter?.startDate && filter?.endDate) {
            filteredEntries = filteredEntries.filter(
              entry => entry.date >= filter.startDate! && entry.date <= filter.endDate!
            );
          }
          
          if (filter?.categories && filter.categories.length > 0) {
            filteredEntries = filteredEntries.filter(
              entry => filter.categories!.includes(entry.category)
            );
          }

          // Soft-deleted Einträge filtern
          filteredEntries = filteredEntries.filter(entry => !entry.deleted);

          // Sortieren nach Datum (neueste zuerst)
          return filteredEntries.sort((a, b) => b.date - a.date);
        } catch (error) {
          console.error('Failed to fetch budget entries:', error);
          return [];
        }
      },
      staleTime: 30000, // 30 Sekunden
      gcTime: 300000, // 5 Minuten
      enabled: authorPubkeys.length > 0,
      retry: false, // Nicht erneut versuchen bei Fehlern
    });
  };

  // Budget-Eintrag erstellen
  const useCreateBudgetEntry = () => {
    const mutation = useMutation({
      mutationFn: async (entry: Omit<BudgetEntry, 'id' | 'createdAt'>) => {
        try {
          const newEntry: BudgetEntry = {
            ...entry,
            id: createBudgetEntryId(),
            createdAt: Math.floor(Date.now() / 1000),
          };

          console.log('Creating budget entry:', newEntry);

          // d-Tag für monatliche Gruppierung
          const dTag = createDTag(
            new Date(entry.date * 1000).getFullYear(),
            new Date(entry.date * 1000).getMonth() + 1
          );

          // Tags für das Event
          const tags: string[][] = [
            ['d', dTag],
            ['category', entry.category],
            ['currency', entry.currency],
          ];

          // Event publizieren
          const event = await publishMutation.mutateAsync({
            kind: BUDGET_CONFIG.KINDS.ENTRY,
            content: JSON.stringify(newEntry),
            tags,
          });

          if (!event) {
            throw new Error('Failed to publish budget entry');
          }

          console.log('Published budget entry to relay:', event.id);
          
          // WICHTIG: Das komplette newEntry Object zurückgeben
          return newEntry;
        } catch (error) {
          console.error('Failed to create budget entry:', error);
          throw error;
        }
      },
      onSuccess: (newEntry) => {
        // Invalidiere ALLE budget entries queries
        queryClient.invalidateQueries({ queryKey: ['budget', 'entries'] });
        queryClient.invalidateQueries({ queryKey: ['budget', 'stats'] });
        toast({ title: 'Erfolg', description: 'Budget-Eintrag gespeichert' });
      },
      onError: (error) => {
        console.error('Failed to create budget entry:', error);
        toast({ title: 'Fehler', description: 'Fehler beim Speichern des Budget-Eintrags', variant: 'destructive' });
      },
    });

    return mutation;
  };

  // Budget-Eintrag aktualisieren
  const useUpdateBudgetEntry = () => {
    const mutation = useMutation({
      mutationFn: async (entry: BudgetEntry) => {
        try {
          // Aktualisierten Eintrag erstellen
          const updatedEntry: BudgetEntry = {
            ...entry,
            updatedAt: Math.floor(Date.now() / 1000),
          };

          // d-Tag für monatliche Gruppierung
          const dTag = createDTag(
            new Date(updatedEntry.date * 1000).getFullYear(),
            new Date(updatedEntry.date * 1000).getMonth() + 1
          );

          // Tags für das Event
          const tags: string[][] = [
            ['d', dTag],
            ['category', updatedEntry.category],
            ['currency', updatedEntry.currency],
          ];

          // Event publizieren
          const event = await publishMutation.mutateAsync({
            kind: BUDGET_CONFIG.KINDS.ENTRY,
            content: JSON.stringify(updatedEntry),
            tags,
          });

          if (!event) {
            throw new Error('Failed to publish updated budget entry');
          }

          console.log('Updated budget entry on relay:', event.id);

          return updatedEntry;
        } catch (error) {
          console.error('Failed to update budget entry:', error);
          throw error;
        }
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['budget'] });
        toast({ title: 'Erfolg', description: 'Budget-Eintrag aktualisiert' });
      },
      onError: (error) => {
        console.error('Failed to update budget entry:', error);
        toast({ title: 'Fehler', description: 'Fehler beim Aktualisieren des Budget-Eintrags', variant: 'destructive' });
      },
    });

    return mutation;
  };

  // Budget-Eintrag löschen (soft delete)
  const useDeleteBudgetEntry = () => {
    const mutation = useMutation({
      mutationFn: async (entry: BudgetEntry) => {
        console.log('[useDeleteBudgetEntry] mutationFn called with entry:', entry);
        
        try {
          // Als gelöscht markieren
          const deletedEntry: BudgetEntry = {
            ...entry,
            deleted: true,
            updatedAt: Math.floor(Date.now() / 1000),
          };

          console.log('[useDeleteBudgetEntry] Deleted entry to publish:', deletedEntry);

          // d-Tag für monatliche Gruppierung
          const dTag = createDTag(
            new Date(deletedEntry.date * 1000).getFullYear(),
            new Date(deletedEntry.date * 1000).getMonth() + 1
          );

          // Tags für das Event
          const tags: string[][] = [
            ['d', dTag],
            ['category', deletedEntry.category],
            ['currency', deletedEntry.currency],
            ['deleted', 'true'],
          ];

          console.log('[useDeleteBudgetEntry] Publishing with tags:', tags);

          // Event publizieren
          const event = await publishMutation.mutateAsync({
            kind: BUDGET_CONFIG.KINDS.ENTRY,
            content: JSON.stringify(deletedEntry),
            tags,
          });

          if (!event) {
            throw new Error('Failed to publish deleted budget entry');
          }

          console.log('[useDeleteBudgetEntry] Deleted budget entry on relay:', event.id);

          return entry.id;
        } catch (error) {
          console.error('[useDeleteBudgetEntry] Failed to delete budget entry:', error);
          throw error;
        }
      },
      onSuccess: () => {
        console.log('[useDeleteBudgetEntry] onSuccess - invalidating queries');
        queryClient.invalidateQueries({ queryKey: ['budget'] });
        toast({ title: 'Erfolg', description: 'Budget-Eintrag gelöscht' });
      },
      onError: (error) => {
        console.error('[useDeleteBudgetEntry] onError:', error);
        toast({ title: 'Fehler', description: 'Fehler beim Löschen des Budget-Eintrags', variant: 'destructive' });
      },
    });

    return mutation;
  };

  // Statistiken berechnen
  const useBudgetStats = (year?: number, month?: number) => {
    const { data: entries, isLoading, error } = useBudgetEntries(
      year && month ? {
        startDate: getDateRangeForMonth(year, month).start,
        endDate: getDateRangeForMonth(year, month).end,
      } : undefined
    );

    const stats = useMemo(() => {
      if (!entries) return null;

      const stats: BudgetStats = {
        totalIncome: 0,
        totalExpenses: 0,
        balance: 0,
        categoryBreakdown: {},
        monthlyTrend: [],
      };

      // Nach Monaten gruppieren für Trend
      const monthlyData: Record<string, { income: number; expenses: number }> = {};

      entries.forEach(entry => {
        const amount = entry.amount;
        const monthKey = getMonthKey(entry.date);

        // Monatliche Daten initialisieren
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { income: 0, expenses: 0 };
        }

        if (amount >= 0) {
          // Einnahme
          stats.totalIncome += amount;
          monthlyData[monthKey].income += amount;
        } else {
          // Ausgabe
          const expense = Math.abs(amount);
          
          // Gesundheit wird NICHT zum Budget-Total addiert
          if (entry.category !== 'gesundheit') {
            stats.totalExpenses += expense;
            monthlyData[monthKey].expenses += expense;

            // Kategorie-Breakdown (ohne Gesundheit)
            if (!stats.categoryBreakdown[entry.category]) {
              stats.categoryBreakdown[entry.category] = 0;
            }
            stats.categoryBreakdown[entry.category] += expense;
          }
        }
      });

      // Balance berechnen
      stats.balance = stats.totalIncome - stats.totalExpenses;

      // Monatlichen Trend erstellen
      stats.monthlyTrend = Object.entries(monthlyData)
        .map(([month, data]) => ({
          month,
          income: data.income,
          expenses: data.expenses,
          balance: data.income - data.expenses,
        }))
        .sort((a, b) => a.month.localeCompare(b.month));

      return stats;
    }, [entries]);

    return {
      data: stats,
      isLoading,
      error,
    };
  };

  // Einträge nach Kategorie filtern
  const useEntriesByCategory = (categoryId: string) => {
    const { data: entries, isLoading, error } = useBudgetEntries({
      categories: [categoryId],
    });

    return {
      data: entries,
      isLoading,
      error,
    };
  };

  // Einträge nach Zeitraum filtern
  const useEntriesByDateRange = (startDate: number, endDate: number) => {
    const { data: entries, isLoading, error } = useBudgetEntries({
      startDate,
      endDate,
    });

    return {
      data: entries,
      isLoading,
      error,
    };
  };

  return {
    // Queries
    useBudgetEntries,
    useBudgetStats,
    useEntriesByCategory,
    useEntriesByDateRange,
    
    // Mutations
    useCreateBudgetEntry,
    useUpdateBudgetEntry,
    useDeleteBudgetEntry,
    
    // Utilities
    formatAmount,
  };
}
