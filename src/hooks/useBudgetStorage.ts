/**
 * Lokale Speicherung für Haushaltsbuch
 * Speichert Einträge in localStorage und synchronisiert mit Relay
 */

import { useState, useEffect, useCallback } from 'react';
import { BudgetEntry } from '@/types/budget';

const STORAGE_KEY = 'mojobus-budget-entries';

export function useBudgetStorage() {
  const [entries, setEntries] = useState<BudgetEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Sort by date (newest first)
        const sorted = parsed.sort((a: BudgetEntry, b: BudgetEntry) => b.date - a.date);
        setEntries(sorted);
        console.log(`[BudgetStorage] Loaded ${sorted.length} entries from localStorage`);
      }
    } catch (error) {
      console.error('[BudgetStorage] Failed to load from localStorage:', error);
    }
    setIsLoading(false);
  }, []);

  // Save to localStorage whenever entries change
  const saveToStorage = useCallback((newEntries: BudgetEntry[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newEntries));
      console.log(`[BudgetStorage] Saved ${newEntries.length} entries to localStorage`);
    } catch (error) {
      console.error('[BudgetStorage] Failed to save to localStorage:', error);
    }
  }, []);

  // Add new entry
  const addEntry = useCallback((entry: BudgetEntry) => {
    setEntries(prev => {
      // Check for duplicates
      const exists = prev.some(e => e.id === entry.id);
      if (exists) return prev;

      // Add and sort
      const newEntries = [entry, ...prev].sort((a, b) => b.date - a.date);
      saveToStorage(newEntries);
      return newEntries;
    });
  }, [saveToStorage]);

  // Update entry
  const updateEntry = useCallback((id: string, updates: Partial<BudgetEntry>) => {
    setEntries(prev => {
      const newEntries = prev.map(e => 
        e.id === id ? { ...e, ...updates, updatedAt: Math.floor(Date.now() / 1000) } : e
      ).sort((a, b) => b.date - a.date);
      saveToStorage(newEntries);
      return newEntries;
    });
  }, [saveToStorage]);

  // Delete entry (soft delete)
  const deleteEntry = useCallback((id: string) => {
    setEntries(prev => {
      const newEntries = prev.filter(e => e.id !== id);
      saveToStorage(newEntries);
      return newEntries;
    });
  }, [saveToStorage]);

  // Get filtered entries
  const getFilteredEntries = useCallback((
    startDate?: number,
    endDate?: number,
    categories?: string[]
  ) => {
    return entries.filter(entry => {
      // Filter deleted entries
      if (entry.deleted) return false;

      // Date range filter
      if (startDate && entry.date < startDate) return false;
      if (endDate && entry.date > endDate) return false;

      // Category filter
      if (categories && categories.length > 0) {
        if (!categories.includes(entry.category)) return false;
      }

      return true;
    });
  }, [entries]);

  // Clear all entries
  const clearAllEntries = useCallback(() => {
    setEntries([]);
    localStorage.removeItem(STORAGE_KEY);
    console.log('[BudgetStorage] Cleared all entries');
  }, []);

  return {
    entries,
    isLoading,
    addEntry,
    updateEntry,
    deleteEntry,
    getFilteredEntries,
    clearAllEntries,
  };
}
