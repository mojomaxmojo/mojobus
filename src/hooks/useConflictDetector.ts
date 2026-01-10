import { useState, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { useToast } from '@/hooks/useToast';

/**
 * Intelligenter Konflikt-Detektor für replaceable content
 * Erkennt Konflikte wenn mehrere Benutzer gleichzeitig bearbeiten
 * Bietet verschiedene Lösungsstrategien
 */
export function useConflictDetector(dTag: string, currentEventId?: string) {
  const { nostr } = useNostr();
  const { toast } = useToast();
  const [conflictInfo, setConflictInfo] = useState<{
    hasConflict: boolean;
    conflictingEvent?: any;
    conflictingUser?: string;
    conflictType: 'concurrent' | 'version' | 'none';
    resolution: 'auto' | 'manual' | 'none';
  }>({
    hasConflict: false,
    conflictType: 'none',
    resolution: 'auto'
  });

  // Prüfe auf Konflikte mit aktivem Editier-Modus
  const checkConflicts = useCallback(async () => {
    const abortSignal = AbortSignal.any([AbortSignal.timeout(5000)]);
    
    // Lade alle replaceable Events mit d-tag in den letzten 10 Minuten
    const allEvents = await nostr.query([
      {
        kinds: [30000 + 30 + dTag],
        limit: 100,
        order: 'created_at_desc',
        since: Math.floor((Date.now() - 10 * 60 * 1000) / 1000) // Letzte 10 Minuten
      }
    ], { signal: abortSignal });

    // Konvertiere zu einfache Events
    const replaceableEvents = allEvents.map(event => ({
      id: event.id,
      content: event.content,
      address: event.tags.find(t => t[0] === 'd' && t[1] === dTag)?.[1] || '',
      created_at: event.created_at,
      updated_at: event.tags.find(t => t[0] === 'u' && t[1] === 'updated_at')?.[1] ? parseInt(t[1]) : undefined,
      user: event.pubkey
    }));

    // Erkennen von Konflikten
    const currentPubkey = await nostr.getPublicKey(); // Current user pubkey
    const concurrentUsers = new Map<string, any>(); // Users mit zeitgleichen Änderungen
    const addressMap = new Map<string, any>(); // D-tag addresses und zugehörige Events

    replaceableEvents.forEach(event => {
      if (!event.address) return;
      addressMap.set(event.address, event);
    });

    // Analysiere Konflikte
    for (const [address, event] of addressMap) {
      const usersWithSameAddress = replaceableEvents.filter(
        e => e.address === address && e.user !== currentPubkey
      );

      if (usersWithSameAddress.length > 1) {
        // Sortiere nach User und Zeit
        usersWithSameAddress.sort((a, b) => 
          (b.updated_at || b.created_at) - (a.updated_at || a.created_at)
        );

        const latestEvent = usersWithSameAddress[usersWithSameAddress.length - 1];
        const otherEvents = usersWithSameAddress.slice(0, -1);

        // Prüfe ob aktueller User unter den Konflikt-Users ist
        const currentUserEvents = otherEvents.filter(e => e.user === currentPubkey);

        if (currentUserEvents.length > 0) {
          const conflictUser = latestEvent.user;
          const conflictType = latestEvent.user === currentPubkey ? 'concurrent' : 'version';

          setConflictInfo({
            hasConflict: true,
            conflictingEvent: latestEvent,
            conflictingUser: conflictUser,
            conflictType,
            resolution: 'auto'
          });

          // Konsole für Debugging
          console.warn(`Conflict detected for ${dTag}:`, {
            address,
            conflictingEvent: latestEvent.id,
            conflictingUser: conflictUser,
            conflictType,
            currentUserEventsCount: currentUserEvents.length
          });

          return true;
        }
      }
    }

    // Prüfe Versionskonflikte (derselbe User hat späte Version)
    replaceableEvents.forEach(event => {
      if (!event.address) return;
      
      const userEvents = replaceableEvents.filter(e => e.address === event.address);
      if (userEvents.length > 1) {
        userEvents.sort((a, b) => (b.updated_at || b.created_at) - (a.updated_at || a.created_at));
        const latestEvent = userEvents[userEvents.length - 1];
        const olderEvents = userEvents.slice(0, -1);

        // Prüfe ob ein aktueller Editier-Modus späte Version hat
        if (currentEventId && currentEventId === latestEvent.id) {
          const conflictUser = olderEvents[0].user;
          
          setConflictInfo({
            hasConflict: true,
            conflictingEvent: latestEvent,
            conflictingUser: conflictUser,
            conflictType: 'version',
            resolution: 'manual' // Bei Versionskonflikt manuelle Lösung
          });

          console.warn(`Version conflict detected for ${dTag}:`, {
            address,
            conflictingEvent: latestEvent.id,
            conflictingUser: conflictUser,
            conflictType: 'version',
            olderEventsCount: olderEvents.length
          });

          return true;
        }
      }
    }

    return conflictInfo;
  }, [dTag, currentEventId]);

  // Automatische Konfliktlösung
  const autoResolveConflict = useCallback(async () => {
    if (!conflictInfo.hasConflict) return;
    if (conflictInfo.conflictType !== 'concurrent') return;

    toast({
      title: 'Konflikt wird aufgelöst',
      description: 'Eine automatische Konfliktlösung wird ausgeführt...',
      duration: 3000,
      variant: 'default'
    });

    // Hier könnte intelligente Logik implementiert werden
    // z.B. Zusammenführen von Inhalten, Wahl der besseren Version etc.
    setConflictInfo(prev => ({
      ...prev,
      resolution: 'resolved',
      conflictType: 'none'
    }));
  }, [conflictInfo]);

  // Manuelleses Konflikt-Lösen
  const manualResolveConflict = useCallback(() => {
    if (!conflictInfo.hasConflict) return;

    setConflictInfo(prev => ({
      ...prev,
      resolution: 'resolved',
      conflictType: 'none'
    }));

    toast({
      title: 'Konflikt manuell aufgelöst',
      description: 'Der Konflikt wurde zur manuellen Lösung markiert.',
      duration: 3000,
      variant: 'default'
    });
  }, [conflictInfo]);

  // Visual-Feedback
  const ConflictBanner = () => {
    if (!conflictInfo.hasConflict) return null;

    const getConflictMessage = () => {
      switch (conflictInfo.conflictType) {
        case 'concurrent':
          return `⚠️ Gleichzeitige Bearbeitung durch ${conflictInfo.conflictingUser?.substring(0, 8)}... wird erkannt.`;
        case 'version':
          return `⚠️ Versionskonflikt mit ${conflictInfo.conflictingUser?.substring(0, 8)}... wird erkannt.`;
        default:
          return `⚠️ Konflikt mit ${conflictInfo.conflictingUser?.substring(0, 8)}... wird erkannt.`;
      }
    };

    return (
      <div className="bg-yellow-50 border-l-4 border-yellow-200 p-4 rounded-md mb-4">
        <div className="flex items-center gap-2">
          <span className="text-yellow-800">⚠️</span>
          <span className="text-sm font-medium text-yellow-900">
            {getConflictMessage()}
          </span>
        </div>
        <div className="flex gap-2 mt-2">
          <Button
            size="sm"
            variant="outline"
            onClick={autoResolveConflict}
            disabled={conflictInfo.resolution === 'resolved'}
          >
            {conflictInfo.resolution === 'resolved' ? 'Gelöst' : 'Auto-lösen'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={manualResolveConflict}
            disabled={conflictInfo.resolution === 'resolved'}
          >
            {conflictInfo.resolution === 'resolved' ? 'Gelöst' : 'Manuell'}
          </Button>
        </div>
      </div>
    );
  };

  return {
    conflictInfo,
    ConflictBanner,
    autoResolveConflict,
    manualResolveConflict,
    hasConflict: conflictInfo.hasConflict
  };
}