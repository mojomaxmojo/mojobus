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
    return false;
  }

  // Option 2: type=article, type=place oder #t artikel/places Tag
  const typeTag = event.tags.find(([name]) => name === 'type')?.[1];
  const articleTag = event.tags.some(([name, value]) => name === 't' && value === 'artikel');
  const placesTag = event.tags.some(([name, value]) => name === 't' && value === 'places');

  // Akzeptiere Artikel (type=article oder #t artikel) ODER Plätze (type=place oder #t places)
  const isValidType = typeTag === 'article' || articleTag || typeTag === 'place' || placesTag;

  if (!isValidType) {
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

  // Versuche summary-Tag zu extrahieren, wenn nicht vorhanden, generiere aus Content
  let summary = event.tags.find(([name]) => name === 'summary')?.[1] || '';

  // Wenn kein summary-Tag existiert, generiere aus dem Content (nach dem Titel)
  if (!summary) {
    let contentToExtract = event.content || '';

    // Schritt 1: Entferne HTML-Elemente mit strukturierten Daten
    // H1 Titel
    contentToExtract = contentToExtract.replace(/<h1[^>]*>.*?<\/h1>/gis, '');

    // H2 Überschriften (Bilder etc.)
    contentToExtract = contentToExtract.replace(/<h2[^>]*>.*?<\/h2>/gis, '');

    // Strukturierte Absätze mit fettgedruckten Labels (HTML-Format)
    // z.B. <p><strong>Kategorie:</strong> wildcamping</p>
    const structuredPatterns = [
      /<p><strong>Kategorie:<\/strong>.*?<\/p>/gis,
      /<p><strong>Bewertung:<\/strong>.*?<\/p>/gis,
      /<p><strong>Standort:<\/strong>.*?<\/p>/gis,
      /<p><strong>Koordinaten:<\/strong>.*?<\/p>/gis,
      /<p><strong>Einrichtungen:<\/strong>.*?<\/p>/gis,
      /<p><strong>Geeignet für:<\/strong>.*?<\/p>/gis,
      /<p><strong>Preis:<\/strong>.*?<\/p>/gis,
    ];

    structuredPatterns.forEach(pattern => {
      contentToExtract = contentToExtract.replace(pattern, '');
    });

    // Schritt 2: Entferne alle verbleibenden HTML-Tags
    // Das entfernt auch <p>, </p>, <strong>, </strong> etc.
    contentToExtract = contentToExtract.replace(/<[^>]+>/g, '');

    // Schritt 3: Entferne HTML-Entities
    contentToExtract = contentToExtract.replace(/&nbsp;/g, ' ');
    contentToExtract = contentToExtract.replace(/&amp;/g, '&');
    contentToExtract = contentToExtract.replace(/&lt;/g, '<');
    contentToExtract = contentToExtract.replace(/&gt;/g, '>');

    // Schritt 4: Entferne Markdown-formatierte Zeilen (Fallback für alte Events)
    const cleanedContent = contentToExtract
      .replace(/^\*\*[^:]+:\*\*.*$/gm, '') // **Kategorie:** etc.
      .replace(/^## .+$/gm, '')           // ## Bilder etc.
      .replace(/!\[.*?\]\(.*?\)/g, '')   // Bilder-Markdown
      .replace(/\n\s*\n/g, '\n')          // Entferne doppelte Zeilenumbrüche
      .trim();

    // Schritt 5: Nimm die ersten 200 Zeichen als summary
    if (cleanedContent.length > 0) {
      summary = cleanedContent.length > 200
        ? cleanedContent.substring(0, 197) + '...'
        : cleanedContent;
    }
  }

  // Fallback: Falls die Summary immer noch HTML enthält, nochmal bereinigen
  if (summary && summary.includes('<')) {
    summary = summary
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .trim();
  }

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

      // Sortiere nach Datum (neueste zuerst)
      return validArticles.sort((a, b) => b.created_at - a.created_at);
    },
    getNextPageParam: (lastPage, allPages) => {
      // Wenn keine Artikel mehr zurückgegeben wurden, sind wir fertig
      if (lastPage.length === 0) {
        return undefined;
      }

      // Berechne nächsten Timestamp (1 Sekunde vor dem letzten Event)
      const lastCreated = lastPage[lastPage.length - 1].created_at;
      return lastCreated - 1;
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