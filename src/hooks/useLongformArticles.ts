import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { useNostr } from '@/hooks/useNostr';
import { NOSTR_CONFIG } from '@/config/nostr';
import { DEFAULT_PERFORMANCE_CONFIG } from '@/config/performance';
import type { NostrEvent } from '@nostrify/nostrify';

/**
 * Validiert ein Longform Artikel Event (NIP-23)
 */
function validateLongformArticle(event: NostrEvent): boolean {
  if (event.kind !== NOSTR_CONFIG.kinds.longform) return false;

  // Benötigte Tags: d (identifier)
  const d = event.tags.find(([name]) => name === 'd')?.[1];

  if (!d) return false;

  // Content sollte vorhanden sein
  if (!event.content || event.content.trim().length === 0) return false;

  return true;
}

/**
 * Prüft ob ein Event ein Platz ist (hat type=place, #t place, #t places, oder identifier beginnt mit "place-")
 */
function isPlaceEvent(event: NostrEvent): boolean {
  const typeTag = event.tags.find(([name]) => name === 'type')?.[1];
  const placeTag = event.tags.some(([name, value]) => name === 't' && ['place', 'places'].includes(value));
  const identifier = event.tags.find(([name]) => name === 'd')?.[1] || '';
  const hasPlaceIdentifier = identifier.startsWith('place-');

  return typeTag === 'place' || placeTag || hasPlaceIdentifier;
}

/**
 * Extrahiert Metadaten aus einem Longform Artikel oder Platz
 */
export function extractArticleMetadata(event: NostrEvent) {
  const d = event.tags.find(([name]) => name === 'd')?.[1] || '';
  const title = event.tags.find(([name]) => name === 'title')?.[1] ||
                event.tags.find(([name]) => name === 'name')?.[1] ||
                extractTitleFromContent(event.content) || 'Ohne Titel';
  const summary = event.tags.find(([name]) => name === 'summary')?.[1] || '';
  const image = event.tags.find(([name]) => name === 'image')?.[1] || '';
  const published_at = event.tags.find(([name]) => name === 'published_at')?.[1];
  const tags = event.tags.filter(([name]) => name === 't').map(([, value]) => value);

  return {
    identifier: d,
    title,
    summary,
    image,
    publishedAt: published_at ? parseInt(published_at) : event.created_at,
    tags,
    content: event.content,
  };
}

/**
 * Extrahiert Titel aus dem Content (für Markdown-Format mit # Titel)
 */
function extractTitleFromContent(content: string): string | null {
  const lines = content.split('\n');
  const firstLine = lines[0]?.trim();

  if (firstLine?.startsWith('# ')) {
    return firstLine.slice(2).trim();
  }

  return null;
}

/**
 * Hook zum Laden von Longform Artikeln mit optionalen Filtern (NIP-23, kind 30023)
 * Deprecated: Verwende useInfiniteLongformArticles für bessere Performance
 */
export function useLongformArticles(options?: {
  kinds?: number[];
  '#t'?: string[];
  authors?: string[];
  limit?: number;
}) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['longform-articles', NOSTR_CONFIG.authorPubkeys, options?.['#t']],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(DEFAULT_PERFORMANCE_CONFIG.relay.queryTimeout * 2.5)]);

      const filter: any = {
        kinds: options?.kinds || [NOSTR_CONFIG.kinds.longform],
        authors: options?.authors || NOSTR_CONFIG.authorPubkeys,
        limit: options?.limit || 100,
      };

      // Füge Tag-Filter hinzu wenn vorhanden
      if (options?.['#t'] && options['#t'].length > 0) {
        filter['#t'] = options['#t'];
      }

      const events = await nostr.query([filter], { signal });

      // Validiere und filtere Artikel (Plätze ausschließen)
      const validArticles = events.filter(event => {
        const isValid = validateLongformArticle(event);
        const isPlace = isPlaceEvent(event);
        return isValid && !isPlace;
      });

      // Sortiere nach Datum (neueste zuerst)
      return validArticles.sort((a, b) => b.created_at - a.created_at);
    },
    staleTime: DEFAULT_PERFORMANCE_CONFIG.cache.staleTime,
    gcTime: DEFAULT_PERFORMANCE_CONFIG.cache.gcTime,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

/**
 * Hook zum Laden von Longform Artikeln mit Infinite Scroll für bessere Performance
 * Lädt Artikel in Batches (20-30 pro Seite) bei Bedarf
 */
export function useInfiniteLongformArticles(options?: {
  kinds?: number[];
  '#t'?: string[];
  authors?: string[];
}) {
  const { nostr } = useNostr();

  return useInfiniteQuery({
    queryKey: ['infinite-longform-articles', NOSTR_CONFIG.authorPubkeys, options?.['#t']],
    queryFn: async ({ pageParam, signal }) => {
      const abortSignal = AbortSignal.any([signal!, AbortSignal.timeout(DEFAULT_PERFORMANCE_CONFIG.relay.queryTimeout * 2.5)]);

      const filter: any = {
        kinds: options?.kinds || [NOSTR_CONFIG.kinds.longform],
        authors: options?.authors || NOSTR_CONFIG.authorPubkeys,
        limit: DEFAULT_PERFORMANCE_CONFIG.infiniteScroll.itemsPerPage,
      };

      // Timestamp-basierte Pagination
      if (pageParam) {
        filter.until = pageParam;
      }

      // Füge Tag-Filter hinzu wenn vorhanden
      if (options?.['#t'] && options['#t'].length > 0) {
        filter['#t'] = options['#t'];
      }

      const events = await nostr.query([filter], { signal: abortSignal });

      // Validiere und filtere Artikel (Plätze ausschließen)
      const validArticles = events.filter(event => {
        const isValid = validateLongformArticle(event);
        const isPlace = isPlaceEvent(event);
        return isValid && !isPlace;
      });

      // Wenn der Relay zu viele Events zurückgibt, auf max itemsPerPage pro Seite beschränken
      const MAX_PER_PAGE = DEFAULT_PERFORMANCE_CONFIG.infiniteScroll.itemsPerPage;
      const paginatedArticles = validArticles.slice(0, MAX_PER_PAGE);

      // Sortiere nach Datum (neueste zuerst)
      const sorted = paginatedArticles.sort((a, b) => b.created_at - a.created_at);
      return sorted;
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.length === 0) {
        return undefined;
      }

      const lastCreated = lastPage[lastPage.length - 1].created_at;
      const nextPageParam = lastCreated - 1;

      return nextPageParam;
    },
    initialPageParam: undefined,
    staleTime: DEFAULT_PERFORMANCE_CONFIG.cache.staleTime * 2,
    gcTime: DEFAULT_PERFORMANCE_CONFIG.cache.gcTime,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

/**
 * Hook zum Laden von Plätzen (nur Events mit type=place oder #t place)
 */
export function usePlaces() {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['places', NOSTR_CONFIG.authorPubkeys],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(DEFAULT_PERFORMANCE_CONFIG.relay.queryTimeout * 2.5)]);

      const events = await nostr.query(
        [
          {
            kinds: [NOSTR_CONFIG.kinds.longform],
            authors: NOSTR_CONFIG.authorPubkeys,
            limit: DEFAULT_PERFORMANCE_CONFIG.infiniteScroll.itemsPerPage * 4,
          },
        ],
        { signal }
      );

      // Validiere und filtere Plätze
      const validPlaces = events.filter(event => {
        const isValid = validateLongformArticle(event);
        const isPlace = isPlaceEvent(event);
        return isValid && isPlace;
      });

      // Sortiere nach Datum (neueste zuerst)
      return validPlaces.sort((a, b) => b.created_at - a.created_at);
    },
    staleTime: NOSTR_CONFIG.cache.staleTime,
    gcTime: NOSTR_CONFIG.cache.maxAge,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

/**
 * Hook zum Laden eines einzelnen Longform Artikels
 */
export function useLongformArticle(identifier: string, authorPubkey: string) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['longform-article', identifier, authorPubkey],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(DEFAULT_PERFORMANCE_CONFIG.relay.queryTimeout * 2.5)]);

      const events = await nostr.query(
        [
          {
            kinds: [NOSTR_CONFIG.kinds.longform],
            authors: [authorPubkey],
            '#d': [identifier],
            limit: 1,
          },
        ],
        { signal }
      );

      const article = events[0];
      if (!article || !validateLongformArticle(article)) {
        return null;
      }

      return article;
    },
    staleTime: NOSTR_CONFIG.cache.staleTime,
    gcTime: NOSTR_CONFIG.cache.maxAge,
    enabled: !!identifier && !!authorPubkey,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}