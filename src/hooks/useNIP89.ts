/**
 * useNIP89 – Hook für NIP-89 Application Handler Registration
 *
 * Publiziert:
 *   kind:31990 – Handler-Registrierung (welche Kinds kann mojobus.org verarbeiten)
 *   kind:31989 – Eigene Empfehlung der App für die registrierten Kinds
 *
 * Spec: https://github.com/nostr-protocol/nips/blob/master/89.md
 */

import { useNostr } from '@nostrify/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from './useCurrentUser';
import { useToast } from './useToast';

// ============================================================================
// KONFIGURATION
// ============================================================================

const APP_URL = 'https://mojobus.org';
const APP_NAME = 'MojoBus';
const APP_ABOUT = 'Perpetual Travelers Blog – Artikel, Notes, Profile & Video';
const APP_PICTURE = 'https://mojobus.org/mojobuslogo.png';
const HANDLER_D_TAG = 'mojobus-handler-v1';

/** Relays auf denen die Handler-Events publiziert werden (öffentliche, bekannte Relays) */
const PUBLISH_RELAYS = [
  'wss://nos.lol',
  'wss://relay.nostr.band',
  'wss://relay.damus.io',
  'wss://relay.snort.social',
  'wss://relay.primal.net',
  'wss://nostr.mom',
  'wss://relay.nos.social',
  'wss://relay.nosflare.com',
  'wss://relay.mojobus.co',
];

/**
 * Event-Kinds die MojoBus verarbeiten kann:
 *   0  – Profile (npub / nprofile)
 *   1  – Short Notes
 *   30023 – Long-form Articles (NIP-23)
 */
const SUPPORTED_KINDS = [0, 1, 30023];

// ============================================================================
// TYPEN
// ============================================================================

export interface NIP89Status {
  handler: {
    exists: boolean;
    eventId?: string;
    createdAt?: number;
  };
  recommendation: {
    exists: boolean;
    eventId?: string;
    createdAt?: number;
  };
}

// ============================================================================
// HOOK
// ============================================================================

export function useNIP89() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // --------------------------------------------------------------------------
  // STATUS: Prüft ob kind:31990 und kind:31989 bereits publiziert wurden
  // --------------------------------------------------------------------------
  const statusQuery = useQuery({
    queryKey: ['nip89-status', user?.pubkey],
    enabled: !!user?.pubkey,
    staleTime: 1000 * 60 * 5, // 5 Minuten Cache
    queryFn: async ({ signal }): Promise<NIP89Status> => {
      if (!user?.pubkey) {
        return {
          handler: { exists: false },
          recommendation: { exists: false },
        };
      }

      const timeout = AbortSignal.timeout(8000);
      const combined = AbortSignal.any([signal, timeout]);

      // Beide Queries parallel ausführen
      const [handlerEvents, recommendationEvents] = await Promise.all([
        // kind:31990 – Handler-Registrierung
        nostr.query(
          [{ kinds: [31990], authors: [user.pubkey], '#d': [HANDLER_D_TAG], limit: 1 }],
          { signal: combined }
        ).catch(() => [] as any[]),

        // kind:31989 – Empfehlung für kind:30023 (Artikel als primärer Kind)
        nostr.query(
          [{ kinds: [31989], authors: [user.pubkey], '#d': ['30023'], limit: 1 }],
          { signal: combined }
        ).catch(() => [] as any[]),
      ]);

      const handlerEvent = handlerEvents[0];
      const recommendationEvent = recommendationEvents[0];

      return {
        handler: {
          exists: !!handlerEvent,
          eventId: handlerEvent?.id,
          createdAt: handlerEvent?.created_at,
        },
        recommendation: {
          exists: !!recommendationEvent,
          eventId: recommendationEvent?.id,
          createdAt: recommendationEvent?.created_at,
        },
      };
    },
  });

  // --------------------------------------------------------------------------
  // PUBLISH: Publiziert kind:31990 + kind:31989 auf allen öffentlichen Relays
  // --------------------------------------------------------------------------
  const publishMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Nicht eingeloggt');

      // ------------------------------------------------------------------
      // Event 1: kind:31990 – Handler-Registrierung
      // ------------------------------------------------------------------
      const handlerContent = JSON.stringify({
        name: APP_NAME,
        about: APP_ABOUT,
        picture: APP_PICTURE,
        website: APP_URL,
      });

      const handlerTags: string[][] = [
        ['d', HANDLER_D_TAG],
        // Unterstützte Event-Kinds
        ...SUPPORTED_KINDS.map((k) => ['k', String(k)]),
        // Web-Handler-URLs mit Bech32-Platzhalter
        ['web', `${APP_URL}/<bech32>`, 'naddr'],    // kind:30023 Artikel
        ['web', `${APP_URL}/<bech32>`, 'nevent'],   // generische Events
        ['web', `${APP_URL}/<bech32>`, 'note'],     // kind:1 Notes
        ['web', `${APP_URL}/<bech32>`, 'npub'],     // Profile
        ['web', `${APP_URL}/<bech32>`, 'nprofile'], // Profile mit Relays
      ];

      const handlerEvent = await user.signer.signEvent({
        kind: 31990,
        content: handlerContent,
        tags: handlerTags,
        created_at: Math.floor(Date.now() / 1000),
      });

      // ------------------------------------------------------------------
      // Event 2: kind:31989 – Eigene Empfehlung für jeden supported Kind
      // ------------------------------------------------------------------
      // Wir publizieren eine Empfehlung pro Kind (best practice)
      const recommendationEvents = await Promise.all(
        SUPPORTED_KINDS.map((kind) =>
          user.signer.signEvent({
            kind: 31989,
            content: '',
            tags: [
              ['d', String(kind)],
              [
                'a',
                `31990:${user.pubkey}:${HANDLER_D_TAG}`,
                'wss://relay.mojobus.co',
                'web',
              ],
            ],
            created_at: Math.floor(Date.now() / 1000),
          })
        )
      );

      // ------------------------------------------------------------------
      // Auf allen öffentlichen Relays publishen
      // ------------------------------------------------------------------
      const allEvents = [handlerEvent, ...recommendationEvents];

      const publishResults = await Promise.allSettled(
        PUBLISH_RELAYS.map(async (relayUrl) => {
          try {
            // Direkten WebSocket-Publish für jeden Relay
            const ws = new WebSocket(relayUrl);
            await new Promise<void>((resolve, reject) => {
              const timeout = setTimeout(() => {
                ws.close();
                reject(new Error(`Timeout: ${relayUrl}`));
              }, 10000);

              ws.onopen = async () => {
                try {
                  for (const event of allEvents) {
                    ws.send(JSON.stringify(['EVENT', event]));
                  }
                  // Kurz warten damit die Events ankommen
                  setTimeout(() => {
                    clearTimeout(timeout);
                    ws.close();
                    resolve();
                  }, 1500);
                } catch (err) {
                  clearTimeout(timeout);
                  ws.close();
                  reject(err);
                }
              };

              ws.onerror = () => {
                clearTimeout(timeout);
                ws.close();
                reject(new Error(`WebSocket Fehler: ${relayUrl}`));
              };
            });
            return { relay: relayUrl, success: true };
          } catch (err) {
            return { relay: relayUrl, success: false, error: String(err) };
          }
        })
      );

      const successCount = publishResults.filter(
        (r) => r.status === 'fulfilled' && r.value.success
      ).length;

      console.log('[NIP-89] Publish Ergebnisse:', publishResults);
      console.log(`[NIP-89] Erfolgreich auf ${successCount}/${PUBLISH_RELAYS.length} Relays publiziert`);

      if (successCount === 0) {
        throw new Error('Konnte auf keinem Relay publizieren. Bitte Verbindung prüfen.');
      }

      return { handlerEvent, recommendationEvents, successCount };
    },

    onSuccess: ({ successCount }) => {
      toast({
        title: 'NIP-89 erfolgreich registriert!',
        description: `MojoBus wurde auf ${successCount} Relays als App-Handler registriert.`,
      });
      // Cache invalidieren damit Status aktualisiert wird
      queryClient.invalidateQueries({ queryKey: ['nip89-status'] });
    },

    onError: (error: Error) => {
      console.error('[NIP-89] Publish Fehler:', error);
      toast({
        title: 'Fehler beim Registrieren',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // --------------------------------------------------------------------------
  // UPDATE: Republiziert (aktualisiert) die bestehenden Handler-Events
  // --------------------------------------------------------------------------
  const updateMutation = useMutation({
    mutationFn: async () => {
      // Gleiche Logik wie publish – da kind:31990 addressable ist (30000er Range)
      // wird das bestehende Event automatisch ersetzt (same d-tag)
      return publishMutation.mutateAsync();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nip89-status'] });
    },
  });

  return {
    // Status
    status: statusQuery.data,
    isLoadingStatus: statusQuery.isLoading,
    isRegistered:
      statusQuery.data?.handler.exists && statusQuery.data?.recommendation.exists,

    // Aktionen
    publish: publishMutation.mutate,
    isPublishing: publishMutation.isPending,

    update: updateMutation.mutate,
    isUpdating: updateMutation.isPending,

    // Konfiguration (für Anzeige)
    config: {
      appName: APP_NAME,
      appUrl: APP_URL,
      supportedKinds: SUPPORTED_KINDS,
      publishRelays: PUBLISH_RELAYS,
      handlerDTag: HANDLER_D_TAG,
    },
  };
}
