import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useNostr } from '@/hooks/useNostr';
import { NOSTR_CONFIG } from '@/config/nostr';
import { getValidAuthorPubkeys } from '@/lib/authors';
import type { NostrEvent } from '@nostrify/nostrify';

/**
 * Hook zum Laden von Notes mit Infinite Scroll
 */
export function useNotes() {
  const { nostr } = useNostr();

  return useInfiniteQuery({
    queryKey: ['notes'],
    queryFn: async ({ pageParam, signal }) => {
      const filter: any = {
        kinds: [NOSTR_CONFIG.kinds.note],
        limit: 30,
      };
      
      // Hole gültige Autoren-Pubkeys
      const authorPubkeys = getValidAuthorPubkeys();
      
      if (authorPubkeys.length > 0) {
        filter.authors = authorPubkeys;
      }
      
      if (pageParam) {
        filter.until = pageParam;
      }

      const events = await nostr.query([filter], {
        signal: AbortSignal.any([signal, AbortSignal.timeout(5000)]),
      });

      return events;
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.length === 0) return undefined;
      // Subtract 1 since 'until' is inclusive
      return lastPage[lastPage.length - 1].created_at - 1;
    },
    initialPageParam: undefined,
    staleTime: NOSTR_CONFIG.cache.staleTime,
    gcTime: NOSTR_CONFIG.cache.maxAge,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

/**
 * Hook zum Laden eines einzelnen Note anhand seiner Event ID
 */
export function useNote(eventId: string) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['note', eventId],
    queryFn: async ({ signal }) => {
      const events = await nostr.query(
        [
          {
            ids: [eventId],
            limit: 1,
          },
        ],
        {
          signal: AbortSignal.any([signal, AbortSignal.timeout(3000)]),
        }
      );

      return events[0] || null;
    },
    staleTime: NOSTR_CONFIG.cache.staleTime,
    gcTime: NOSTR_CONFIG.cache.maxAge,
    enabled: !!eventId,
  });
}

/**
 * Extrahiert Tags aus einem Note Event
 */
export function extractNoteTags(event: NostrEvent): string[] {
  return event.tags
    .filter(tag => tag[0] === 't')
    .map(tag => tag[1] as string);
}

/**
 * Extrahiert Bild-URLs aus einem Note Event
 */
export function extractNoteImages(event: NostrEvent): string[] {
  const images: string[] = [];
  
  // Suche nach Bildern im Content
  const urlRegex = /(https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp))/gi;
  const matches = event.content.match(urlRegex);
  if (matches) {
    images.push(...matches);
  }
  
  // Suche nach imeta Tags
  event.tags.forEach(tag => {
    if (tag[0] === 'imeta') {
      tag.forEach((item, index) => {
        if (item.startsWith('url ')) {
          images.push(item.substring(4));
        }
      });
    }
  });
  
  return [...new Set(images)]; // Entferne Duplikate
}