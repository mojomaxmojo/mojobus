import { NKinds, NostrEvent, NostrFilter } from '@nostrify/nostrify';
import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';

/**
 * Hook to fetch reposts (Kind 6 and Kind 16) for an event
 */
export function useReposts(root: NostrEvent) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['reposts', root.id],
    queryFn: async ({ signal }) => {
      // Query both kind 6 (repost) and kind 16 (generic repost)
      const filter: NostrFilter = {
        kinds: [6, 16],
        '#e': [root.id],
        limit: 500,
      };

      const events = await nostr.query([filter], {
        signal: AbortSignal.any([signal, AbortSignal.timeout(3000)]),
      });

      // Filter for unique pubkeys (one repost per user)
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
