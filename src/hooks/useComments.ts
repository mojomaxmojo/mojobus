import { NKinds, NostrEvent, NostrFilter } from '@nostrify/nostrify';
import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';

// Public relays that support NIP-22 comments
const COMMENT_RELAYS = [
  'wss://relay.mojobus.co',
  'wss://relays.mojobus.co',
  'wss://relay.primal.net',
  'wss://relay.damus.io',
  'wss://nos.lol',
];

export function useComments(root: NostrEvent | URL, limit?: number) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['comments', root instanceof URL ? root.toString() : root.id, limit],
    queryFn: async (c) => {
      // Force logs to appear in production
      window.console.log('[useComments] Starting query for root:', root instanceof URL ? root.toString() : root.id);
      window.console.log('[useComments] Root kind:', root instanceof URL ? 'URL' : (root as NostrEvent).kind);
      
      const filters: NostrFilter[] = [];
      
      // Build filters to catch comments using different tag formats
      if (root instanceof URL) {
        filters.push({ kinds: [1111], '#I': [root.toString()] });
        filters.push({ kinds: [1111], '#i': [root.toString()] });
      } else if (NKinds.addressable(root.kind)) {
        const d = root.tags.find(([name]) => name === 'd')?.[1] ?? '';
        const addressable = `${root.kind}:${root.pubkey}:${d}`;
        
        // Query by uppercase and lowercase 'a' tags, as well as 'e' tags
        filters.push({ kinds: [1111], '#A': [addressable] });
        filters.push({ kinds: [1111], '#a': [addressable] });
        filters.push({ kinds: [1111], '#E': [root.id] });
        filters.push({ kinds: [1111], '#e': [root.id] });
      } else if (NKinds.replaceable(root.kind)) {
        const addressable = `${root.kind}:${root.pubkey}:`;
        
        // Query by uppercase and lowercase 'a' tags, as well as 'e' tags
        filters.push({ kinds: [1111], '#A': [addressable] });
        filters.push({ kinds: [1111], '#a': [addressable] });
        filters.push({ kinds: [1111], '#E': [root.id] });
        filters.push({ kinds: [1111], '#e': [root.id] });
      } else {
        // For regular events, query both uppercase and lowercase
        filters.push({ kinds: [1111], '#E': [root.id] });
        filters.push({ kinds: [1111], '#e': [root.id] });
      }

      if (typeof limit === 'number') {
        filters.forEach(f => f.limit = limit);
      }

      window.console.log('[useComments] Built filters:', JSON.stringify(filters, null, 2));

      // Query for all kind 1111 comments using all filter variations
      // Use a relay group with public relays that support NIP-22
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(8000)]);
      const commentRelayGroup = nostr.group(COMMENT_RELAYS);
      
      const allEvents = await Promise.all(
        filters.map(filter => commentRelayGroup.query([filter], { signal }))
      );
      
      window.console.log('[useComments] Queried relays:', COMMENT_RELAYS);
      
      window.console.log('[useComments] Query results:', allEvents.map(events => events.length));
      
      // Flatten and deduplicate events by ID
      const eventMap = new Map<string, NostrEvent>();
      for (const events of allEvents) {
        for (const event of events) {
          eventMap.set(event.id, event);
        }
      }
      const events = Array.from(eventMap.values());
      
      window.console.log('[useComments] Total unique events after deduplication:', events.length);

      // Helper function to get tag value (case-insensitive)
      const getTagValue = (event: NostrEvent, tagName: string): string | undefined => {
        const tag = event.tags.find(([name]) => name === tagName);
        return tag?.[1];
      };
      
      // Helper function to check if event has a tag with a specific value (checks both cases)
      const hasTagValue = (event: NostrEvent, tagName: string, value: string): boolean => {
        return event.tags.some(([name, val]) => 
          (name === tagName || name === tagName.toUpperCase() || name === tagName.toLowerCase()) && 
          val === value
        );
      };

      // Filter top-level comments (those with lowercase OR uppercase tag matching the root)
      const topLevelComments = events.filter(comment => {
        if (root instanceof URL) {
          return hasTagValue(comment, 'i', root.toString()) || hasTagValue(comment, 'I', root.toString());
        } else if (NKinds.addressable(root.kind)) {
          const d = getTagValue(root, 'd') ?? '';
          const addressable = `${root.kind}:${root.pubkey}:${d}`;
          // Check for 'a' or 'A' tag, or fallback to 'e'/'E' tag for root matching
          return hasTagValue(comment, 'a', addressable) || 
                 hasTagValue(comment, 'A', addressable) ||
                 (hasTagValue(comment, 'e', root.id) && !getTagValue(comment, 'a') && !getTagValue(comment, 'A'));
        } else if (NKinds.replaceable(root.kind)) {
          const addressable = `${root.kind}:${root.pubkey}:`;
          // Check for 'a' or 'A' tag, or fallback to 'e'/'E' tag for root matching
          return hasTagValue(comment, 'a', addressable) || 
                 hasTagValue(comment, 'A', addressable) ||
                 (hasTagValue(comment, 'e', root.id) && !getTagValue(comment, 'a') && !getTagValue(comment, 'A'));
        } else {
          return hasTagValue(comment, 'e', root.id) || hasTagValue(comment, 'E', root.id);
        }
      });

      // Helper function to get all descendants of a comment
      const getDescendants = (parentId: string): NostrEvent[] => {
        const directReplies = events.filter(comment => {
          // Check both lowercase and uppercase 'e' tags for replies
          return hasTagValue(comment, 'e', parentId) || hasTagValue(comment, 'E', parentId);
        });

        const allDescendants = [...directReplies];
        
        // Recursively get descendants of each direct reply
        for (const reply of directReplies) {
          allDescendants.push(...getDescendants(reply.id));
        }

        return allDescendants;
      };

      // Create a map of comment ID to its descendants
      const commentDescendants = new Map<string, NostrEvent[]>();
      for (const comment of events) {
        commentDescendants.set(comment.id, getDescendants(comment.id));
      }

      // Sort top-level comments by creation time (newest first)
      const sortedTopLevel = topLevelComments.sort((a, b) => b.created_at - a.created_at);
      
      window.console.log('[useComments] Top-level comments found:', sortedTopLevel.length);
      window.console.log('[useComments] All events tags:', events.map(c => ({
        id: c.id.substring(0, 8),
        tags: c.tags
      })));
      window.console.log('[useComments] Top-level comments:', sortedTopLevel.map(c => ({
        id: c.id.substring(0, 8),
        content: c.content.substring(0, 50),
        tags: c.tags
      })));

      return {
        allComments: events,
        topLevelComments: sortedTopLevel,
        getDescendants: (commentId: string) => {
          const descendants = commentDescendants.get(commentId) || [];
          // Sort descendants by creation time (oldest first for threaded display)
          return descendants.sort((a, b) => a.created_at - b.created_at);
        },
        getDirectReplies: (commentId: string) => {
          const directReplies = events.filter(comment => {
            // Check both lowercase and uppercase 'e' tags for replies
            return hasTagValue(comment, 'e', commentId) || hasTagValue(comment, 'E', commentId);
          });
          // Sort direct replies by creation time (oldest first for threaded display)
          return directReplies.sort((a, b) => a.created_at - b.created_at);
        }
      };
    },
    enabled: !!root,
  });
}