import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { NOSTR_CONFIG } from '@/config/nostr';
import type { NostrEvent } from '@nostrify/nostrify';

/**
 * Hook zum Laden von Longform Artikeln (NIP-23, kind 30023)
 * Lädt alle Artikel der konfigurierten Autoren
 */
export function useLongformArticles() {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['longform-articles', NOSTR_CONFIG.authorPubkeys],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(3000)]);
      
      const events = await nostr.query(
        [
          {
            kinds: [NOSTR_CONFIG.kinds.longform],
            authors: NOSTR_CONFIG.authorPubkeys,
            limit: 100,
          },
        ],
        { signal }
      );

      // Validiere und sortiere Artikel
      const validArticles = events.filter(validateLongformArticle);
      
      // Sortiere nach Datum (neueste zuerst)
      return validArticles.sort((a, b) => b.created_at - a.created_at);
    },
    staleTime: NOSTR_CONFIG.cache.staleTime,
    gcTime: NOSTR_CONFIG.cache.maxAge,
  });
}

/**
 * Hook zum Laden eines einzelnen Artikels anhand seiner ID (d-tag)
 */
export function useLongformArticle(identifier: string, authorPubkey: string) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['longform-article', identifier, authorPubkey],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(3000)]);
      
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
  });
}

/**
 * Validiert ein Longform Artikel Event (NIP-23)
 */
function validateLongformArticle(event: NostrEvent): boolean {
  if (event.kind !== NOSTR_CONFIG.kinds.longform) return false;

  // Benötigte Tags: d (identifier), title
  const d = event.tags.find(([name]) => name === 'd')?.[1];
  const title = event.tags.find(([name]) => name === 'title')?.[1];

  if (!d || !title) return false;

  // Content sollte vorhanden sein
  if (!event.content || event.content.trim().length === 0) return false;

  return true;
}

/**
 * Extrahiert Metadaten aus einem Longform Artikel
 */
export function extractArticleMetadata(event: NostrEvent) {
  const d = event.tags.find(([name]) => name === 'd')?.[1] || '';
  const title = event.tags.find(([name]) => name === 'title')?.[1] || 'Ohne Titel';
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
