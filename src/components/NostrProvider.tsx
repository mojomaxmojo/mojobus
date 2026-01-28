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

  // Initialize refs when config changes
  useEffect(() => {
    // Verwende autor-spezifische Konfiguration, falls verfügbar
    // Sonst verwende globale Konfiguration
    const useAuthorConfig = authorRelays.isAuthorConfig;

    // READ configuration (queries)
    // IMMER öffentliche Relays für Queries verwenden (niemals nur private author-relays!)
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
