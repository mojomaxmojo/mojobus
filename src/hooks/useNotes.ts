import { useInfiniteQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { NOSTR_CONFIG } from '@/config/nostr';
import type { NostrEvent } from '@nostrify/nostrify';

/**
 * Hook zum Laden von Notes (kind 1) mit Infinite Scroll
 * Lädt alle Notes der konfigurierten Autoren
 */
export function useNotes() {
  const { nostr } = useNostr();

  return useInfiniteQuery({
    queryKey: ['notes', NOSTR_CONFIG.authorPubkeys],
    queryFn: async ({ pageParam, signal }) => {
      const filter: any = {
        kinds: [NOSTR_CONFIG.kinds.note],
        authors: NOSTR_CONFIG.authorPubkeys,
        limit: 20,
      };
      
      if (pageParam) {
        filter.until = pageParam;
      }

      const events = await nostr.query([filter], {
        signal: AbortSignal.any([signal, AbortSignal.timeout(3000)]),
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
  });
}

/**
 * Hook zum Laden eines einzelnen Note anhand seiner Event ID
 */
export function useNote(eventId: string) {
  const { nostr } = useNostr();

  return useInfiniteQuery({
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
    getNextPageParam: () => undefined,
    initialPageParam: undefined,
    staleTime: NOSTR_CONFIG.cache.staleTime,
    gcTime: NOSTR_CONFIG.cache.maxAge,
    enabled: !!eventId,
  });
}

/**
 * Extrahiert Hashtags aus einem Note
 */
export function extractNoteTags(event: NostrEvent): string[] {
  return event.tags.filter(([name]) => name === 't').map(([, value]) => value);
}

/**
 * Extrahiert URLs aus dem Note Content
 */
export function extractNoteUrls(content: string): string[] {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return content.match(urlRegex) || [];
}

/**
 * Extrahiert Bild-URLs aus einem Note (aus content und imeta tags)
 */
export function extractNoteImages(event: NostrEvent): string[] {
  const images: string[] = [];
  
  // Aus content extrahieren
  const urls = extractNoteUrls(event.content);
  const imageUrls = urls.filter(url => 
    /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url)
  );
  images.push(...imageUrls);
  
  // Aus imeta tags extrahieren
  const imetaTags = event.tags.filter(([name]) => name === 'imeta');
  imetaTags.forEach(tag => {
    const urlPart = tag.find(part => part.startsWith('url '));
    if (urlPart) {
      const url = urlPart.replace('url ', '');
      images.push(url);
    }
  });
  
  return [...new Set(images)]; // Duplikate entfernen
}
