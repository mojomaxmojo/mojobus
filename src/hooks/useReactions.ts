import { NKinds, NostrEvent, NostrFilter } from '@nostrify/nostrify';
import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';

/**
 * Hook to fetch reaction counts for an event
 * Supports Kind 7 (reactions) and filters by content (emoji)
 */
export function useReactions(root: NostrEvent, emoji?: string) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['reactions', root.id, emoji],
    queryFn: async ({ signal }) => {
      const filter: NostrFilter = {
        kinds: [7],
        '#e': [root.id],
        limit: 500,
      };

      // Optional: Filter by specific emoji (e.g., "❤️" for likes)
      if (emoji) {
        filter.content = emoji;
      }

      const events = await nostr.query([filter], {
        signal: AbortSignal.any([signal, AbortSignal.timeout(3000)]),
      });

      // Filter for unique pubkeys (one reaction per user)
      const uniqueUsers = new Set<string>();
      const uniqueEvents = events.filter(event => {
        if (uniqueUsers.has(event.pubkey)) {
          return false;
        }
        uniqueUsers.add(event.pubkey);
        return true;
      });

      return uniqueEvents;
    },
    enabled: !!root,
    staleTime: 60000, // 1 minute
  });
}

/**
 * Hook to get like count (❤️ reactions) for an event
 */
export function useLikes(root: NostrEvent) {
  return useReactions(root, '❤️');
}
