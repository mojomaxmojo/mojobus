import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { useNostr } from '@/hooks/useNostr';
import { NOSTR_CONFIG } from '@/config/nostr';
import { DEFAULT_PERFORMANCE_CONFIG } from '@/config/performance';
import type { NostrEvent } from '@nostrify/nostrify';

/**
 * Validiert ein Longform Artikel Event (NIP-23) oder Platz Event
 */
function validateLongformArticle(event: NostrEvent): boolean {
  if (event.kind !== NOSTR_CONFIG.kinds.longform) return false;

  // Benötigte Tags: d (identifier)
  const d = event.tags.find(([name]) => name === 'd')?.[1];

  if (!d) return false;

  // Content sollte vorhanden sein
  if (!event.content || event.content.trim().length === 0) return false;

  // STRIKTERE VALIDIERUNG: Prüfe auf MojoBus-spezifische Tags
  // Option 1: title-Tag muss vorhanden sein
  const title = event.tags.find(([name]) => name === 'title')?.[1] ||
                event.tags.find(([name]) => name === 'name')?.[1]; // Auch name-Tag akzeptieren für Plätze

  if (!title) {
    console.log('⚠️ Event ohne title- oder name-Tag ignoriert:', event.id);
    return false;
  }

  // Option 2: type=article, type=place oder #t artikel/places Tag
  const typeTag = event.tags.find(([name]) => name === 'type')?.[1];
  const articleTag = event.tags.some(([name, value]) => name === 't' && value === 'artikel');
  const placesTag = event.tags.some(([name, value]) => name === 't' && value === 'places');

  // Akzeptiere Artikel (type=article oder #t artikel) ODER Plätze (type=place oder #t places)
  const isValidType = typeTag === 'article' || articleTag || typeTag === 'place' || placesTag;

  if (!isValidType) {
    console.log('⚠️ Event ohne gültigen type ignoriert:', event.id, {
      typeTag,
      hasArticleTag: articleTag,
      hasPlacesTag: placesTag
    });
    return false;
  }

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

      console.log('🔍 useLongformArticles: Found total events:', events.length);

      // Validiere und filtere Artikel (Plätze ausschließen)
      const validArticles = events.filter(event => {
        const isValid = validateLongformArticle(event);
        const isPlace = isPlaceEvent(event);

        const eventInfo = {
          kind: event.kind,
          identifier: event.tags.find(([name]) => name === 'd')?.[1],
          type: event.tags.find(([name]) => name === 'type')?.[1],
          title: event.tags.find(([name]) => name === 'title')?.[1],
          name: event.tags.find(([name]) => name === 'name')?.[1],
          isValid,
          isPlace,
          willInclude: isValid && !isPlace
        };

        if (!isValid) {
          console.log('❌ Event failed validation:', event.id, eventInfo);
        } else if (isPlace) {
          console.log('📍 Event is a place (excluded from articles):', event.id, eventInfo);
        } else {
          console.log('✅ Event included in articles:', event.id, eventInfo);
        }

        return isValid && !isPlace;
      });

      console.log('📦 useLongformArticles: Valid articles after filtering:', validArticles.length);

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
        console.log('🔄 Infinite Scroll: Fetching next page', { until: pageParam });
      } else {
        console.log('📄 Infinite Scroll: Fetching first page');
      }

      // Füge Tag-Filter hinzu wenn vorhanden
      if (options?.['#t'] && options['#t'].length > 0) {
        filter['#t'] = options['#t'];
      }

      const events = await nostr.query([filter], { signal: abortSignal });

      console.log('📦 Infinite Scroll: Received', events.length, 'events from relay (limit was', DEFAULT_PERFORMANCE_CONFIG.infiniteScroll.itemsPerPage, ')');

      // Validiere und filtere Artikel (Plätze ausschließen)
      const validArticles = events.filter(event => {
        const isValid = validateLongformArticle(event);
        const isPlace = isPlaceEvent(event);
        return isValid && !isPlace;
      });

      console.log('✅ Infinite Scroll: After filtering', validArticles.length, 'valid articles');

      // Sortiere nach Datum (neueste zuerst)
      const sorted = validArticles.sort((a, b) => b.created_at - a.created_at);

      // Log pagination info
      if (sorted.length > 0) {
        const firstCreated = sorted[0].created_at;
        const lastCreated = sorted[sorted.length - 1].created_at;
        console.log('📊 Infinite Scroll: Date range', {
          first: new Date(firstCreated * 1000).toISOString(),
          last: new Date(lastCreated * 1000).toISOString(),
          count: sorted.length
        });
      }

      return sorted;
    },
    getNextPageParam: (lastPage, allPages) => {
      // Wenn keine Artikel mehr zurückgegeben wurden, sind wir fertig
      if (lastPage.length === 0) {
        console.log('🚫 Infinite Scroll: No more articles (empty page)');
        return undefined;
      }

      // Wenn wir weniger als 50% der erwarteten Anzahl erhalten, könnte das das Ende sein
      const expectedCount = DEFAULT_PERFORMANCE_CONFIG.infiniteScroll.itemsPerPage;
      const isPartialPage = lastPage.length < expectedCount * 0.5;

      if (isPartialPage) {
        console.log('⚠️ Infinite Scroll: Partial page received', {
          received: lastPage.length,
          expected: expectedCount,
          ratio: lastPage.length / expectedCount
        });
        // Wir versuchen trotzdem noch eine Seite mehr, falls es noch mehr Artikel gibt
      }

      // Berechne nächsten Timestamp (1 Sekunde vor dem letzten Event)
      const lastCreated = lastPage[lastPage.length - 1].created_at;
      const nextPageParam = lastCreated - 1;

      console.log('➡️ Infinite Scroll: Next page param', {
        lastPageLength: lastPage.length,
        lastCreated: lastCreated,
        lastCreatedDate: new Date(lastCreated * 1000).toISOString(),
        nextPageParam,
        totalPagesSoFar: allPages.length,
        totalArticles: allPages.reduce((sum, page) => sum + page.length, 0)
      });

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

      console.log('Querying for places...');
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

      console.log('🔍 usePlaces: Found total longform events:', events.length);

      // Validiere und filtere Plätze
      const validPlaces = events.filter(event => {
        const isValid = validateLongformArticle(event);
        const isPlace = isPlaceEvent(event);

        const eventInfo = {
          kind: event.kind,
          identifier: event.tags.find(([name]) => name === 'd')?.[1],
          type: event.tags.find(([name]) => name === 'type')?.[1],
          name: event.tags.find(([name]) => name === 'name')?.[1],
          title: event.tags.find(([name]) => name === 'title')?.[1],
          tTags: event.tags.filter(([name]) => name === 't').map(([, value]) => value),
          isValid,
          isPlace,
          willInclude: isValid && isPlace
        };

        console.log('📍 Place check for event:', event.id, eventInfo);

        return isValid && isPlace;
      });

      console.log('✅ usePlaces: Valid places after filtering:', validPlaces.length);
      if (validPlaces.length > 0) {
        console.log('📋 Places:', validPlaces.map(e => ({
          id: e.id,
          name: e.tags.find(([name]) => name === 'name')?.[1],
          type: e.tags.find(([name]) => name === 'type')?.[1]
        })));
      }

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