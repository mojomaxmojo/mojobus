import { type NostrEvent, type NostrMetadata, NSchema as n } from '@nostrify/nostrify';
import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';

/**
 * Batching Hook für mehrere Autoren
 * Lädt alle Autoren-Profile in einem einzigen Query statt pro Artikel
 * Reduziert 15 separate Queries zu 1 Query für eine Seite mit 15 Artikeln
 *
 * @param pubkeys - Array von pubkeys (max 50 für beste Performance)
 * @returns Map von pubkey zu {event?, metadata?}
 */
export function useAuthors(pubkeys: string[]) {
  const { nostr } = useNostr();

  // Dedupliziere pubkeys um unnötige Queries zu vermeiden
  const uniquePubkeys = useMemo(() => {
    const set = new Set(pubkeys);
    return Array.from(set).slice(0, 50); // Max 50 Autoren pro Query
  }, [pubkeys]);

  return useQuery<Map<string, { event?: NostrEvent; metadata?: NostrMetadata }>>({
    queryKey: ['authors', uniquePubkeys],
    queryFn: async ({ signal }) => {
      if (uniquePubkeys.length === 0) {
        return new Map();
      }

      // Alle Autoren in einem einzigen Query abrufen
      const events = await nostr.query(
        [{ kinds: [0], authors: uniquePubkeys, limit: 50 }],
        { signal: AbortSignal.any([signal, AbortSignal.timeout(1500)]) },
      );

      // Erstelle eine Map von pubkey zu {event, metadata}
      const authorsMap = new Map<string, { event?: NostrEvent; metadata?: NostrMetadata }>();

      for (const event of events) {
        try {
          const metadata = n.json().pipe(n.metadata()).parse(event.content);
          authorsMap.set(event.pubkey, { metadata, event });
        } catch {
          // Fallback: Event ohne metadata speichern
          authorsMap.set(event.pubkey, { event });
        }
      }

      return authorsMap;
    },
    retry: 3,
    staleTime: 5 * 60 * 1000, // 5 Minuten
    gcTime: 10 * 60 * 1000, // 10 Minuten
    enabled: uniquePubkeys.length > 0,
  });
}

// Importiere useMemo
import { useMemo } from 'react';
