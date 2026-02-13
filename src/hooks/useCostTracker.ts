/**
 * useCostTracker Hook
 *
 * Loads and manages cost tracker data from Nostr with encryption
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { useNostrEncryption, decryptCostEntry } from './useNostrEncryption';
import { useNostrPublish } from './useNostrPublish';
import { useCurrentUser } from './useCurrentUser';
import { COST_TRACKER_CONFIG, type CostEntry, type CostFormData, type MonthlyStats, type CategoryStats, COST_CATEGORIES } from '@/types/costs';
import { DEFAULT_CACHE_CONFIG } from '@/config/cache';
import type { NostrEvent } from '@nostrify/nostrify';

/**
 * Parse Nostr event to CostEntry
 */
function parseEventToCostEntry(event: any): CostEntry | null {
  try {
    const dTag = event.tags?.find((t: string[]) => t[0] === 'd')?.[1];
    if (dTag !== COST_TRACKER_CONFIG.d) return null;

    const categoryTag = event.tags?.find((t: string[]) => t[0] === 'category')?.[1];
    const amountTag = event.tags?.find((t: string[]) => t[0] === 'amount')?.[1];
    const currencyTag = event.tags?.find((t: string[]) => t[0] === 'currency')?.[1];
    const locationTag = event.tags?.find((t: string[]) => t[0] === 'location')?.[1];
    const dateTag = event.tags?.find((t: string[]) => t[0] === 'date')?.[1];
    const gpsLatTag = event.tags?.find((t: string[]) => t[0] === 'gps_lat')?.[1];
    const gpsLonTag = event.tags?.find((t: string[]) => t[0] === 'gps_lon')?.[1];

    if (!categoryTag || !amountTag || !dateTag) return null;

    // Verify author is allowed
    if (!COST_TRACKER_CONFIG.allowedPubkeys.includes(event.pubkey)) {
      console.warn('Cost entry from unauthorized author:', event.pubkey);
      return null;
    }

    return {
      id: event.id,
      encryptedContent: event.content, // Will be decrypted separately
      category: categoryTag as any,
      amount: parseFloat(amountTag),
      currency: currencyTag || 'EUR',
      location: locationTag,
      gps_lat: gpsLatTag ? parseFloat(gpsLatTag) : undefined,
      gps_lon: gpsLonTag ? parseFloat(gpsLonTag) : undefined,
      date: dateTag,
      createdAt: event.created_at,
      author: event.pubkey,
    };
  } catch (error) {
    console.error('Failed to parse cost entry:', error);
    return null;
  }
}

/**
 * Main hook for cost tracker data
 */
export function useCostTracker() {
  const { nostr } = useNostr();
  const { decrypt } = useNostrEncryption();
  const { mutate: publishEvent } = useNostrPublish();
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();

  // Query cost entries from Nostr
  const { data: events = [], isLoading, error, refetch } = useQuery({
    queryKey: ['cost-tracker-events'],
    queryFn: async ({ signal }) => {
      const abortSignal = AbortSignal.any([signal!, AbortSignal.timeout(10000)]);

      // Query events from both authors
      const events = await nostr.query([
        {
          kinds: [COST_TRACKER_CONFIG.kind],
          authors: COST_TRACKER_CONFIG.allowedPubkeys,
          '#d': [COST_TRACKER_CONFIG.d],
          limit: 500,
        }
      ], { signal: abortSignal });

      console.log('📍 Cost Tracker: Loaded', events.length, 'events');
      return events;
    },
    staleTime: DEFAULT_CACHE_CONFIG.lists.staleTime,
    gcTime: DEFAULT_CACHE_CONFIG.lists.gcTime,
  });

  // Decrypt entries
  const { data: decryptedEntries = [], isLoading: isDecrypting } = useQuery({
    queryKey: ['cost-tracker-decrypted', events.map(e => e.id)],
    queryFn: async () => {
      const entries: CostEntry[] = [];

      for (const event of events) {
        const entry = parseEventToCostEntry(event);
        if (!entry) continue;

        // Decrypt content
        try {
          if (entry.encryptedContent && entry.encryptedContent !== '') {
            const decrypted = await decrypt(entry.encryptedContent, event.pubkey);
            const content = JSON.parse(decrypted);
            entry.content = content;
          }
          entries.push(entry);
        } catch (error) {
          console.warn('Failed to decrypt entry:', entry.id, error);
          // Still add entry without decrypted content
          entries.push(entry);
        }
      }

      console.log('✅ Cost Tracker: Decrypted', entries.length, 'entries');
      return entries;
    },
    enabled: events.length > 0,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Mutation to add new cost entry
  const addCostMutation = useMutation({
    mutationFn: async (formData: CostFormData) => {
      if (!nostr) {
        console.error('❌ Cost Tracker: Nostr nicht verfügbar');
        throw new Error('Nostr nicht verfügbar');
      }

      // Check if user is authorized
      if (!user) {
        console.error('❌ Cost Tracker: User nicht eingeloggt');
        throw new Error('Nicht eingeloggt: Bitte mit deinem Nostr-Account (Mojo oder Susanne) einloggen');
      }

      const userPubkey = user.pubkey;
      console.log('🔑 User pubkey:', userPubkey);

      if (!COST_TRACKER_CONFIG.allowedPubkeys.includes(userPubkey)) {
        console.error('❌ Cost Tracker: User nicht autorisiert:', userPubkey);
        console.error('❌ Erlaubte Pubkeys:', COST_TRACKER_CONFIG.allowedPubkeys);
        throw new Error('Nicht autorisiert: Nur Mojo und Susanne können Kosten eintragen');
      }

      // Prepare content for encryption
      const content = {
        title: formData.title,
        description: formData.description,
        receiptImage: formData.receiptImage,
        notes: formData.notes,
      };

      // Encrypt content using NIP-44
      let encryptedContent: string;
      try {
        if (!nostr.nip44 || !nostr.nip44.encrypt) {
          console.error('❌ Cost Tracker: NIP-44 nicht verfügbar');
          throw new Error('NIP-44 Verschlüsselung nicht verfügbar');
        }

        // Encrypt for self (the other user can decrypt it when reading their copy)
        encryptedContent = await nostr.nip44.encrypt(JSON.stringify(content), userPubkey);
        console.log('✅ Cost Tracker: Content verschlüsselt');
      } catch (error) {
        console.error('❌ Cost Tracker: Verschlüsselung fehlgeschlagen:', error);
        throw new Error('Verschlüsselung fehlgeschlagen: ' + (error as Error).message);
      }

      // Create tags
      const tags = [
        ['d', COST_TRACKER_CONFIG.d],
        ['category', formData.category],
        ['amount', formData.amount.toString()],
        ['currency', 'EUR'],
        ['date', formData.date],
      ];

      if (formData.location) {
        tags.push(['location', formData.location]);
      }
      if (formData.gps_lat) {
        tags.push(['gps_lat', formData.gps_lat.toString()]);
      }
      if (formData.gps_lon) {
        tags.push(['gps_lon', formData.gps_lon.toString()]);
      }

      // Publish event using useNostrPublish hook
      console.log('📤 Cost Tracker: Publishing event...');
      const event = await publishEvent({
        kind: COST_TRACKER_CONFIG.kind,
        content: encryptedContent,
        tags,
      });

      console.log('✅ Cost Tracker: Published new entry', event.id);
      return event;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cost-tracker-events'] });
    },
  });

      console.log('✅ Cost Tracker: Published new entry', event.id);
      return event;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cost-tracker-events'] });
    },
  });

  // Calculate monthly statistics
  const monthlyStats = useQuery({
    queryKey: ['cost-tracker-monthly-stats', decryptedEntries.map(e => e.id)],
    queryFn: () => {
      const stats: Record<string, MonthlyStats> = {};

      decryptedEntries.forEach(entry => {
        const date = new entry.createdAt * 1000;
        const year = date.getFullYear();
        const month = date.getMonth();
        const key = `${year}-${month}`;

        if (!stats[key]) {
          stats[key] = {
            year,
            month,
            total: 0,
            categoryTotals: {} as any,
            entryCount: 0,
          };
        }

        stats[key].total += entry.amount;
        stats[key].entryCount++;

        if (!stats[key].categoryTotals[entry.category]) {
          stats[key].categoryTotals[entry.category] = 0;
        }
        stats[key].categoryTotals[entry.category] += entry.amount;
      });

      return Object.values(stats).sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.month - a.month;
      });
    },
    enabled: decryptedEntries.length > 0,
  });

  // Calculate category statistics
  const categoryStats = useQuery({
    queryKey: ['cost-tracker-category-stats', decryptedEntries.map(e => e.id)],
    queryFn: () => {
      const stats: Record<string, CategoryStats> = {};
      let grandTotal = 0;

      decryptedEntries.forEach(entry => {
        if (!stats[entry.category]) {
          stats[entry.category] = {
            category: entry.category,
            total: 0,
            count: 0,
            average: 0,
            percentage: 0,
          };
        }

        stats[entry.category].total += entry.amount;
        stats[entry.category].count++;
        grandTotal += entry.amount;
      });

      // Calculate averages and percentages
      Object.values(stats).forEach(stat => {
        stat.average = stat.total / stat.count;
        stat.percentage = grandTotal > 0 ? (stat.total / grandTotal) * 100 : 0;
      });

      return Object.values(stats).sort((a, b) => b.total - a.total);
    },
    enabled: decryptedEntries.length > 0,
  });

  return {
    entries: decryptedEntries,
    isLoading: isLoading || isDecrypting,
    error,
    refetch,
    addEntry: addCostMutation.mutateAsync,
    isAdding: addCostMutation.isPending,
    monthlyStats: monthlyStats.data || [],
    categoryStats: categoryStats.data || [],
  };
}

/**
 * Hook for filtering entries
 */
export function useFilteredCosts(
  entries: CostEntry[],
  filters: {
    category?: string;
    year?: number;
    month?: number;
    startDate?: string;
    endDate?: string;
  }
) {
  return entries.filter(entry => {
    if (filters.category && entry.category !== filters.category) return false;
    if (filters.year || filters.month) {
      const date = new Date(entry.createdAt * 1000);
      if (filters.year && date.getFullYear() !== filters.year) return false;
      if (filters.month !== undefined && date.getMonth() !== filters.month) return false;
    }
    if (filters.startDate && entry.date < filters.startDate) return false;
    if (filters.endDate && entry.date > filters.endDate) return false;
    return true;
  });
}
