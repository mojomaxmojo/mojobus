import React, { useEffect, useRef } from 'react';
import { NostrEvent, NPool, NRelay1 } from '@nostrify/nostrify';
import { NostrContext } from '@nostrify/react';
import { useQueryClient } from '@tanstack/react-query';
import { useAppContext } from '@/hooks/useAppContext';
import { useAuthorRelays } from '@/hooks/useAuthorRelays';

interface NostrProviderProps {
  children: React.ReactNode;
}

const NostrProvider: React.FC<NostrProviderProps> = (props) => {
  const { children } = props;
  const { config } = useAppContext();
  const queryClient = useQueryClient();

  // Autor-spezifische Relay-Konfiguration
  const authorRelays = useAuthorRelays();

  // Create refs for config values
  // READ configuration (queries)
  const readRelayUrls = useRef<string[]>([]);
  const readMaxRelays = useRef<number>(3);
  const readQueryTimeout = useRef<number>(3000);

  // WRITE configuration (publishing)
  const writeRelayUrls = useRef<string[]>([]);
  const writeMaxRelays = useRef<number>(3);
  const activeRelay = useRef<string>("");

  // Shared configuration
  const enableDeduplication = useRef<boolean>(false);

  // Track seen event IDs for deduplication
  const seenEvents = useRef<Map<string, NostrEvent>>(new Map());

  // Initialize NPool for Nostr queries
  const pool = useRef<NPool | null>(null);

  // Initialize refs and pool when config changes
  useEffect(() => {
    // Create NPool instance
    pool.current = new NPool([
      ...readRelayUrls.current.map((url) => new NRelay1(url)),
      ...writeRelayUrls.current.map((url) => new NRelay1(url)),
    ]);

    // Verwende autor-spezifische Konfiguration, falls verfügbar
    // Sonst verwende globale Konfiguration
    const useAuthorConfig = authorRelays.isAuthorConfig;

    // READ configuration (queries)
    // IMMER öffentliche Relays für Queries verwenden (nicht nur private author-relays!)
    // Damit werden ALLE Artikel/Notes angezeigt, egal ob eingeloggt oder nicht
    readRelayUrls.current = config.read?.relayUrls || [];
    readMaxRelays.current = config.read?.maxRelays || 3;
    readQueryTimeout.current = config.read?.queryTimeout || 3000;

    // WRITE configuration (publishing)
    writeRelayUrls.current = useAuthorConfig
      ? authorRelays.writeRelays
      : config.write?.relayUrls || [];
    writeMaxRelays.current = useAuthorConfig
      ? authorRelays.writeMaxRelays
      : config.write?.maxRelays || 3;
    activeRelay.current = useAuthorConfig
      ? authorRelays.activeRelay
      : config.write?.activeRelay || "";

    // Shared configuration
    enableDeduplication.current = config.enableDeduplication || false;

    queryClient.resetQueries();
  }, [config, authorRelays]);

  // Deduplication filter for queries
  const deduplicateEvents = (events: NostrEvent[]): NostrEvent[] => {
    if (!enableDeduplication.current) {
      return events;
    }

    const uniqueEvents: NostrEvent[] = [];
    const seenIds = new Set<string>();

    for (const event of events) {
      if (!seenIds.has(event.id)) {
        seenIds.add(event.id);
        uniqueEvents.push(event);
      }
    }

    return uniqueEvents;
  };

  // Custom query function with deduplication and timeout
  const createQueryFunction = () => {
    return {
      query: async (filters: any[], signal?: AbortSignal) => {
        const abortSignal = AbortSignal.any([
          signal!,
          AbortSignal.timeout(readQueryTimeout.current) // READ timeout (FAST preset)
        ]);

        try {
          const events = await pool.current!.query(filters, { signal: abortSignal });

          // Deduplicate events
          return deduplicateEvents(events);
        } catch (error: any) {
          if (error.name === 'AbortError') {
          } else {
            console.error('[NostrProvider] Query error:', error);
          }
          throw error;
        }
      },
      // eventRouter(_event: NostrEvent) => {
      //   WRITE: Use writeRelayUrls for publishing (ULTRA RELIABLE preset)
      //   const urlsToUse = writeRelayUrls.current && writeRelayUrls.current.length > 0
      //     ? writeRelayUrls.current
      //     : ["wss://nos.lol"];

      //   const allRelays = new Set<string>([
      //     activeRelay.current,
      //     ...urlsToUse
      //   ]);
      //   const publishRelays = Array.from(allRelays).slice(0, writeMaxRelays.current);

      //   return publishRelays;
      // },
    };
  };

  return (
    <NostrContext.Provider value={{
      nostr: pool.current,
      ...createQueryFunction(),
    }}>
      {children}
    </NostrContext.Provider>
  );
};

export default NostrProvider;
