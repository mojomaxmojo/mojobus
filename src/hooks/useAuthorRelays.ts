/**
 * useAuthorRelays Hook
 * Gibt autor-spezifische Relay-Konfiguration zurück basierend auf dem eingeloggten Benutzer
 */

import { useMemo } from 'react';
import { useNostrLogin } from '@nostrify/react/login';
import { getAuthorRelayConfigByPubkey } from '@/config/relays';
import { DEFAULT_APP_CONFIG } from '@/config/relays';

export interface AuthorRelaysResult {
  /** Relays für Queries (READ) */
  readRelays: string[];
  /** Relays für Publishing (WRITE) */
  writeRelays: string[];
  /** Aktiver Relay */
  activeRelay: string;
  /** Max. Anzahl Relays für Queries */
  readMaxRelays: number;
  /** Max. Anzahl Relays für Publishing */
  writeMaxRelays: number;
  /** Query Timeout */
  queryTimeout: number;
  /** Ob autor-spezifische Konfiguration verwendet wird */
  isAuthorConfig: boolean;
  /** Autor ID (falls bekannt) */
  authorId: string | null;
}

/**
 * Hook für autor-spezifische Relay-Konfiguration
 *
 * @returns Relay-Konfiguration basierend auf dem eingeloggten Benutzer
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { readRelays, writeRelays, activeRelay, isAuthorConfig } = useAuthorRelays();
 *
 *   return (
 *     <div>
 *       <p>Active Relay: {activeRelay}</p>
 *       <p>{isAuthorConfig ? 'Using author-specific config' : 'Using default config'}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function useAuthorRelays(): AuthorRelaysResult {
  const { logins } = useNostrLogin();

  // Hole pubkey vom ersten eingeloggten Benutzer
  const pubkey = logins[0]?.pubkey;

  const result = useMemo(() => {
    // Prüfe ob ein Autor eingeloggt ist
    const authorConfig = getAuthorRelayConfigByPubkey(pubkey);

    if (authorConfig) {
      // Autor-spezifische Konfiguration
      return {
        readRelays: authorConfig.read,
        writeRelays: authorConfig.write,
        activeRelay: authorConfig.activeRelay,
        readMaxRelays: authorConfig.read.length,
        writeMaxRelays: authorConfig.write.length,
        queryTimeout: 3000, // Standard Timeout
        isAuthorConfig: true,
        authorId: authorConfig.authorId,
      };
    }

    // Default-Konfiguration
    return {
      readRelays: DEFAULT_APP_CONFIG.read.relayUrls,
      writeRelays: DEFAULT_APP_CONFIG.write.relayUrls,
      activeRelay: DEFAULT_APP_CONFIG.write.activeRelay,
      readMaxRelays: DEFAULT_APP_CONFIG.read.maxRelays,
      writeMaxRelays: DEFAULT_APP_CONFIG.write.maxRelays,
      queryTimeout: DEFAULT_APP_CONFIG.read.queryTimeout,
      isAuthorConfig: false,
      authorId: null,
    };
  }, [pubkey]);

  return result;
}

export default useAuthorRelays;
