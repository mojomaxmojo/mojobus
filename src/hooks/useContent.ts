import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useNostr } from '@/hooks/useNostr';
import { NOSTR_CONFIG } from '@/config/nostr';
import { getValidAuthorPubkeys } from '@/lib/authors';
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

  // STRIKTERE VALIDIERUNG: Prüfe auf MojoBus-spezifische Tags
  const title = event.tags.find(([name]) => name === 'title')?.[1];
  if (!title) {
    console.log('⚠️ Event ohne title-Tag ignoriert:', event.id);
    return false;
  }

  // type=article oder #t artikel Tag
  const typeTag = event.tags.find(([name]) => name === 'type')?.[1];
  const articleTag = event.tags.some(([name, value]) => name === 't' && value === 'artikel');

  if (typeTag !== 'article' && !articleTag) {
    console.log('⚠️ Event ohne type=article oder #t artikel ignoriert:', event.id);
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
 * Prüft ob ein Event eine Note ist (hat #t note oder #t notiz)
 */
function isNoteEvent(event: NostrEvent): boolean {
  return event.tags.some(([name, value]) => name === 't' && ['note', 'notiz'].includes(value));
}

/**
 * Hook zum Laden von kombiniertem Content (Notes + Articles) mit Infinite Scroll
 * 🔥 PERFORMANCE: EIN Query statt zwei separaten Queries!
 * Reduziert Requests um 60-70%
 */
export function useContent() {
  const { nostr } = useNostr();

  return useInfiniteQuery({
    queryKey: ['content-combined', NOSTR_CONFIG.authorPubkeys],
    queryFn: async ({ pageParam, signal }) => {
      const filter: any = {
        // 🔥 PERFORMANCE: Kinds kombinieren in einem Query!
        kinds: [1, 30023], // Notes (1) + Longform Articles (30023)
        limit: 50, // Höheres Limit für kombinierte Query
      };

      // Hole gültige Autoren-Pubkeys
      const authorPubkeys = getValidAuthorPubkeys();
      if (authorPubkeys.length > 0) {
        filter.authors = authorPubkeys;
      }

      // Timestamp-basierte Pagination
      if (pageParam) {
        filter.until = pageParam;
        console.log('🔄 Content Infinite Scroll: Fetching next page', { until: pageParam });
      } else {
        console.log('📄 Content Infinite Scroll: Fetching first page');
      }

      const abortSignal = AbortSignal.any([signal!, AbortSignal.timeout(5000)]);

      console.log('🚀 Combined Query: Fetching kinds [1, 30023] in ONE request');
      const events = await nostr.query([filter], { signal: abortSignal });

      console.log('📦 Content: Received', events.length, 'events total (notes + articles)');

      // Trenne Events nach Typ
      const notes = events.filter(event => {
        if (event.kind !== 1) return false;
        return isNoteEvent(event);
      });

      const articles = events.filter(event => {
        if (event.kind !== 30023) return false;
        const isValid = validateLongformArticle(event);
        const isPlace = isPlaceEvent(event);
        return isValid && !isPlace; // Nur Artikel, keine Plätze
      });

      console.log('✅ Content separated:', {
        notes: notes.length,
        articles: articles.length,
        total: notes.length + articles.length
      });

      // Gib getrennte Ergebnisse zurück
      return {
        notes,
        articles,
        allEvents: [...notes, ...articles].sort((a, b) => b.created_at - a.created_at),
      };
    },
    getNextPageParam: (lastPage) => {
      // Wenn keine Events mehr zurückgegeben wurden, sind wir fertig
      if (lastPage.allEvents.length === 0) {
        console.log('🚫 Content Infinite Scroll: No more events (empty page)');
        return undefined;
      }

      // Berechne nächsten Timestamp (1 Sekunde vor dem letzten Event)
      const lastCreated = lastPage.allEvents[lastPage.allEvents.length - 1].created_at;
      const nextPageParam = lastCreated - 1;

      console.log('➡️ Content Infinite Scroll: Next page param', {
        lastPageLength: lastPage.allEvents.length,
        lastCreated,
        nextPageParam
      });

      return nextPageParam;
    },
    initialPageParam: undefined,
    staleTime: 1000 * 60 * 15, // 15 Minuten - erhöht für bessere Performance
    gcTime: 1000 * 60 * 90, // 90 Minuten - erhöht für bessere Performance
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

/**
 * Hook zum Laden von Content mit Tag-Filter
 * Für Kategorien wie diy, rvlife, etc.
 */
export function useContentByTags(tags: string[]) {
  const { nostr } = useNostr();

  return useInfiniteQuery({
    queryKey: ['content-by-tags', NOSTR_CONFIG.authorPubkeys, tags],
    queryFn: async ({ pageParam, signal }) => {
      const filter: any = {
        kinds: [1, 30023], // Notes + Articles kombinieren
        '#t': tags, // Tag-Filter
        limit: 50,
      };

      // Hole gültige Autoren-Pubkeys
      const authorPubkeys = getValidAuthorPubkeys();
      if (authorPubkeys.length > 0) {
        filter.authors = authorPubkeys;
      }

      if (pageParam) {
        filter.until = pageParam;
      }

      const abortSignal = AbortSignal.any([signal!, AbortSignal.timeout(5000)]);

      console.log('🚀 Tag Query: Fetching kinds [1, 30023] with tags', tags);
      const events = await nostr.query([filter], { signal: abortSignal });

      // Trenne Events nach Typ
      const notes = events.filter(event => {
        if (event.kind !== 1) return false;
        return isNoteEvent(event);
      });

      const articles = events.filter(event => {
        if (event.kind !== 30023) return false;
        const isValid = validateLongformArticle(event);
        const isPlace = isPlaceEvent(event);
        return isValid && !isPlace;
      });

      return {
        notes,
        articles,
        allEvents: [...notes, ...articles].sort((a, b) => b.created_at - a.created_at),
      };
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.allEvents.length === 0) return undefined;
      const lastCreated = lastPage.allEvents[lastPage.allEvents.length - 1].created_at;
      return lastCreated - 1;
    },
    initialPageParam: undefined,
    staleTime: 1000 * 60 * 15,
    gcTime: 1000 * 60 * 90,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    enabled: tags.length > 0,
  });
}

/**
 * Hook zum Laden eines einzelnen Notes oder Artikels
 */
export function useContentEvent(eventId: string) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['content-event', eventId],
    queryFn: async (c) => {
      const events = await nostr.query(
        [
          {
            ids: [eventId],
            limit: 1,
          },
        ],
        {
          signal: AbortSignal.any([c.signal, AbortSignal.timeout(3000)]),
        }
      );

      const event = events[0] || null;

      // Validiere je nach Kind
      if (!event) return null;

      if (event.kind === 1) {
        // Note - prüfe #t Tags
        if (!isNoteEvent(event)) {
          console.warn('⚠️ Event ohne #t note oder #t notiz ignoriert:', eventId);
          return null;
        }
      } else if (event.kind === 30023) {
        // Longform - validiere Artikel
        if (!validateLongformArticle(event) || isPlaceEvent(event)) {
          console.warn('⚠️ Kein gültiger Artikel:', eventId);
          return null;
        }
      }

      return event;
    },
    staleTime: 1000 * 60 * 15,
    gcTime: 1000 * 60 * 90,
    enabled: !!eventId,
  });
}
