import React, { useEffect, useRef } from 'react';
import { NostrEvent, NPool, NRelay1 } from '@nostrify/nostrify';
import { NostrContext } from '@nostrify/react';
import { useQueryClient } from '@tanstack/react-query';
import { useAppContext } from '@/hooks/useAppContext';

interface NostrProviderProps {
  children: React.ReactNode;
}

const NostrProvider: React.FC<NostrProviderProps> = (props) => {
  const { children } = props;
  const { config } = useAppContext();
  const queryClient = useQueryClient();

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

  // Initialize refs when config changes
  useEffect(() => {
    // READ configuration (queries)
    readRelayUrls.current = config.read?.relayUrls || [];
    readMaxRelays.current = config.read?.maxRelays || 3;
    readQueryTimeout.current = config.read?.queryTimeout || 3000;

    // WRITE configuration (publishing)
    writeRelayUrls.current = config.write?.relayUrls || [];
    writeMaxRelays.current = config.write?.maxRelays || 3;
    activeRelay.current = config.write?.activeRelay || "";

    // Shared configuration
    enableDeduplication.current = config.enableDeduplication || false;

    queryClient.resetQueries();

    console.log('[NostrProvider] Config updated:', {
      read: {
        relayUrls: readRelayUrls.current,
        maxRelays: readMaxRelays.current,
        queryTimeout: readQueryTimeout.current,
      },
      write: {
        relayUrls: writeRelayUrls.current,
        maxRelays: writeMaxRelays.current,
        activeRelay: activeRelay.current,
      },
      shared: {
        enableDeduplication: enableDeduplication.current,
      },
    });
  }, [config.read, config.write, config.enableDeduplication, queryClient]);

  // Create NPool instance only once
  const pool = useRef<NPool | undefined>(undefined);

  // Initialize NPool only once
  if (!pool.current) {
    pool.current = new NPool({
      open(url: string) {
        return new NRelay1(url);
      },
      reqRouter(filters) {
        // READ: Use readRelayUrls for queries (FAST preset)
        const urlsToUse = readRelayUrls.current && readRelayUrls.current.length > 0
          ? readRelayUrls.current
          : ["wss://nos.lol"];

        const selectedRelays = urlsToUse.slice(0, readMaxRelays.current);
        const relayMap = new Map<string, typeof filters>();

        selectedRelays.forEach(relayUrl => {
          relayMap.set(relayUrl, filters);
        });

        console.log('[NostrProvider] Querying relays (READ - FAST):', selectedRelays);
        return relayMap;
      },
      eventRouter(_event: NostrEvent) {
        // WRITE: Use writeRelayUrls for publishing (ULTRA RELIABLE preset)
        const urlsToUse = writeRelayUrls.current && writeRelayUrls.current.length > 0
          ? writeRelayUrls.current
          : ["wss://nos.lol"];

        const allRelays = new Set<string>([
          activeRelay.current,
          ...urlsToUse
        ]);
        const publishRelays = Array.from(allRelays).slice(0, writeMaxRelays.current);

        console.log('[NostrProvider] Publishing to relays (WRITE - ULTRA RELIABLE):', publishRelays);
        return publishRelays;
      },
    });

    console.log('[NostrProvider] NPool initialized with', {
      readRelays: readRelayUrls.current.length,
      writeRelays: writeRelayUrls.current.length,
    });
  }

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
      } else {
        console.log('[NostrProvider] Duplicate event filtered:', event.id);
      }
    }

    const duplicates = events.length - uniqueEvents.length;
    if (duplicates > 0) {
      console.log(`[NostrProvider] Filtered ${duplicates} duplicate events`);
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

        console.log('[NostrProvider] Executing query with timeout:', readQueryTimeout.current);

        try {
          const events = await pool.current!.query(filters, { signal: abortSignal });

          // Deduplicate events
          return deduplicateEvents(events);
        } catch (error: any) {
          if (error.name === 'AbortError') {
            console.log('[NostrProvider] Query timeout:', readQueryTimeout.current);
          } else {
            console.error('[NostrProvider] Query error:', error);
          }
          throw error;
        }
      },
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
