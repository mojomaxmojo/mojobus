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
  const relayUrls = useRef<string[]>([]);
  const activeRelay = useRef<string>("");
  const maxRelays = useRef<number>(3);
  const enableDeduplication = useRef<boolean>(false);
  const queryTimeout = useRef<number>(3000);
  
  // Track seen event IDs for deduplication
  const seenEvents = useRef<Map<string, NostrEvent>>(new Map());

  // Initialize refs when config changes
  useEffect(() => {
    relayUrls.current = config.relayUrls || [];
    activeRelay.current = config.activeRelay || "";
    maxRelays.current = config.maxRelays || 3;
    enableDeduplication.current = config.enableDeduplication || false;
    queryTimeout.current = config.queryTimeout || 3000;
    queryClient.resetQueries();
    
    console.log('[NostrProvider] Config updated:', {
      relayUrls: relayUrls.current,
      activeRelay: activeRelay.current,
      maxRelays: maxRelays.current,
      enableDeduplication: enableDeduplication.current,
      queryTimeout: queryTimeout.current,
    });
  }, [config.relayUrls, config.activeRelay, config.maxRelays, config.enableDeduplication, config.queryTimeout, queryClient]);

  // Create NPool instance only once
  const pool = useRef<NPool | undefined>(undefined);

  // Initialize NPool only once
  if (!pool.current) {
    pool.current = new NPool({
      open(url: string) {
        return new NRelay1(url);
      },
      reqRouter(filters) {
        // Use relayUrls from config if available, otherwise fallback
        const urlsToUse = relayUrls.current && relayUrls.current.length > 0 
          ? relayUrls.current 
          : [config.activeRelay || "wss://relay.nostr.band"];
        
        const selectedRelays = urlsToUse.slice(0, maxRelays.current);
        const relayMap = new Map<string, typeof filters>();
        
        selectedRelays.forEach(relayUrl => {
          relayMap.set(relayUrl, filters);
        });
        
        console.log('[NostrProvider] Querying relays:', selectedRelays);
        return relayMap;
      },
      eventRouter(_event: NostrEvent) {
        // Publish to active relay and selected relays
        const urlsToUse = relayUrls.current && relayUrls.current.length > 0 
          ? relayUrls.current 
          : [config.activeRelay || "wss://relay.nostr.band"];
        
        const allRelays = new Set<string>([
          activeRelay.current || config.activeRelay, 
          ...urlsToUse
        ]);
        const publishRelays = Array.from(allRelays).slice(0, maxRelays.current);
        
        console.log('[NostrProvider] Publishing to relays:', publishRelays);
        return publishRelays;
      },
    });

    console.log('[NostrProvider] NPool initialized with', relayUrls.current.length, 'relays');
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
          AbortSignal.timeout(queryTimeout.current)
        ]);

        console.log('[NostrProvider] Executing query with timeout:', queryTimeout.current);
        
        try {
          const events = await pool.current!.query(filters, { signal: abortSignal });
          
          // Deduplicate events
          return deduplicateEvents(events);
        } catch (error: any) {
          if (error.name === 'AbortError') {
            console.log('[NostrProvider] Query timeout:', queryTimeout.current);
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
