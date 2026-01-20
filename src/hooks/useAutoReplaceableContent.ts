import { useState, useCallback, useRef } from 'react';
import { useNostr } from '@nostrify/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/useToast';

// Smart Replaceable Content Hook mit automatischer Konfliktlösung
export interface AutoReplaceableContent {
  id: string;
  content: string;
  dTag: string; // Spezifischer d-tag
  kind: number;
  address: string; // d-tag identifier
  created_at: number;
  updated_at?: number;
  // Meta-Daten für Konfliktlösung
  lastSync?: number;
  conflictResolution?: 'auto' | 'manual';
  isActive?: boolean; // Ist dies die aktuell aktive Version
}

interface UseAutoReplaceableContentOptions {
  dTag: string;
  autoResolveConflicts?: boolean;
  conflictThreshold?: number; // Minuten bevor Auto-Resolution
}

/**
 * Intelligenter Hook für replaceable content
 * Verhindert 5x Events und ermöglicht Versionskontrolle
 */
export function useAutoReplaceableContent({
  dTag,
  autoResolveConflicts = true,
  conflictThreshold = 5
}: UseAutoReplaceableContentOptions) {
  const { nostr } = useNostr();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [activeContentId, setActiveContentId] = useState<string>('');
  const [conflictResolution, setConflictResolution] = useState<'auto' | 'manual'>('auto');

  // Query für replaceable content
  const { data: content, isLoading, error } = useQuery<AutoReplaceableContent[]>({
    queryKey: ['auto-replaceable-content', dTag],
    queryFn: async ({ signal }) => {
      const abortSignal = AbortSignal.any([signal, AbortSignal.timeout(3000)]);

      const events = await nostr.query([
        {
          kinds: [30000 + 30 + dTag], // Replaceable Kind mit spezifischem d-tag
          limit: 100,
          order: 'created_at_desc'
        }
      ], { signal: abortSignal });

      // Konvertiere zu AutoReplaceableContent-Format mit Konfliktlösung
      return events.map((event) => {
        const dTagFromEvent = event.tags.find(t => t[0] === 'd' && t[1] === dTag)?.[1] || '';
        const lastSyncTag = event.tags.find(t => t[0] === 'last_sync' && t[1])?.[1] || '';

        return {
          id: event.id,
          content: event.content,
          kind: event.kind,
          dTag: dTagFromEvent,
          address: event.tags.find(t => t[0] === 'd' && t[1] === dTag)?.[1] || '',
          created_at: event.created_at,
          updated_at: event.tags.find(t => t[0] === 'u' && t[1] === 'updated_at')?.[1] ? parseInt(t[1]) : undefined,
          lastSync: lastSyncTag ? parseInt(lastSyncTag[1]) : undefined,
          conflictResolution: lastSyncTag === 'auto' ? 'auto' : 'manual',
          isActive: false // Wird später berechnet
        };
      });
    },
    staleTime: 30000,
    initialPageParam: () => null
  });

  // Prüfe ob ein Inhalt aktiv ist (letzte synchronisierte Version)
  const getActiveContent = useCallback(() => {
    return content.find(c => 
      c.conflictResolution === 'auto' && 
      c.lastSync && 
      !c.isActive
    );
  }, [content]);

  // Auto-Update-Timeout bei Konflikten
  const updateTimeoutRef = useRef<NodeJS.Timeout>();

  // Mutation für intelligente Aktualisierungen
  const updateMutation = useMutation({
    mutationFn: async ({ 
      content: newContent, 
      address,
      additionalTags = [],
      conflictResolution: 'auto'
    }: {
      content: string;
      address?: string;
      additionalTags?: string[];
      conflictResolution?: string;
    }) => {
      const now = Math.floor(Date.now() / 1000);
      
      // Prüfe ob innerhalb des Konflikt-Thresholds existiert
      const conflictingContent = content.find(existingContent => {
        return existingContent.dTag === dTag && 
          existingContent.lastSync && 
          (now - existingContent.lastSync) < conflictThreshold * 60
      });

      let event;
      if (conflictingContent && autoResolveConflicts) {
        // Konflikt-Protokoll: Markiere alten Inhalt als inaktiv
        const archiveEvent = await nostr.event({
          kind: 30000 + 30 + dTag,
          content: conflictingContent.content,
          tags: [
            ['d', dTag],
            ['t', 'archived'],
            ['t', 'conflict'],
            ['t', 'archived_at', now.toString()],
            ['t', 'archived_reason', 'auto-resolution'],
            ['t', 'original_id', conflictingContent.id]
          ],
          created_at: now
        });

        // Erstelle neuen Event
        event = await nostr.event({
          kind: 30000 + 30 + dTag,
          content: newContent,
          tags: [
            ['d', dTag],
            ['t', 'replaceable'],
            ['t', 'conflict'],
            ['t', 'archived_id', conflictingContent.id],
            ['t', 'last_sync', now.toString()],
            ['t', 'conflict_resolution', 'auto'],
            ...additionalTags
          ],
          created_at: now
        });

        toast({
          title: 'Konflikt aufgelöst',
          description: `Ein bestehender Konflikt wurde automatisch aufgelöst und ${conflictingContent.id} archiviert.`,
          duration: 3000,
          variant: 'default'
        });

        // Markiere Konflikt als aufgelöst
        clearTimeout(updateTimeoutRef.current);
      } else {
        // Normale Aktualisierung ohne Konflikt
        event = await nostr.event({
          kind: 30000 + 30 + dTag,
          content: newContent,
          tags: [
            ['d', dTag],
            ['t', 'replaceable'],
            ['t', 'last_sync', now.toString()],
            ['t', 'conflict', 'none'],
            ...additionalTags
          ],
          created_at: now
        });
      }

      await nostr.publish(event);

      // Broadcast Update
      if (typeof window !== 'undefined' && window.webkit?.messageHandlers) {
        window.webkit.messageHandlers['nostr-broadcast'].postMessage({
          type: 'content-updated',
          dTag,
          action: 'intelligent-update',
          conflictResolution: conflictResolution,
          archivedId: conflictingContent ? conflictingContent.id : null
        });
      }

      // Invalidiere Queries
      queryClient.invalidateQueries({ queryKey: ['auto-replaceable-content', dTag] });

      return event;
    },
    onSuccess: () => {
      toast({
        title: 'Inhalt aktualisiert',
        description: 'Der Inhalt wurde erfolgreich mit Konfliktlösung gespeichert.',
        duration: 3000,
        variant: 'default'
      });
    },
    onError: (error) => {
      toast({
        title: 'Fehler bei Aktualisierung',
        description: error.message || 'Der Inhalt konnte nicht aktualisiert werden.',
        duration: 5000,
        variant: 'destructive'
      });
    }
  });

  // Konflikt-Lösungsoption
  const resolveConflict = useCallback(async (conflictId: string, resolution: 'auto' | 'manual') => {
    const conflictingContent = content.find(c => c.id === conflictId);
    if (!conflictingContent) return;

    try {
      const now = Math.floor(Date.now() / 1000);
      
      if (resolution === 'auto') {
        // Automatische Konfliktlösung
        const archiveEvent = await nostr.event({
          kind: 30000 + 30 + dTag,
          content: conflictingContent.content,
          tags: [
            ['d', dTag],
            ['t', 'archived'],
            ['t', 'conflict'],
            ['t', 'archived_at', now.toString()],
            ['t', 'archived_reason', 'auto-resolution'],
            ['t', 'original_id', conflictingContent.id]
          ],
          created_at: now
        });

        const newEvent = await nostr.event({
          kind: 30000 + 30 + dTag,
          content: 'Konflikt aufgelöst - ' + new Date().toLocaleTimeString(),
          tags: [
            ['d', dTag],
            ['t', 'archived'],
            ['t', 'conflict'],
            ['t', 'archived_id', conflictingContent.id],
            ['t', 'last_sync', now.toString()],
            ['t', 'conflict_resolution', 'auto']
          ],
          created_at: now
        });

        await nostr.publish(archiveEvent);
        await nostr.publish(newEvent);

        setConflictResolution('auto');

        toast({
          title: 'Konflikt automatisch aufgelöst',
          description: `Der Konflikt für ${conflictId} wurde automatisch aufgelöst.`,
          duration: 3000,
          variant: 'default'
        });
      } else {
        // Manuelle Konfliktlösung
        setConflictResolution('manual');
        toast({
          title: 'Konflikt markiert',
          description: `Der Konflikt für ${conflictId} wurde zur manuellen Bearbeitung markiert.`,
          duration: 3000,
          variant: 'default'
        });
      }

      // Invalidiere Queries
      queryClient.invalidateQueries({ queryKey: ['auto-replaceable-content', dTag] });

    } catch (error) {
      toast({
        title: 'Fehler bei Konfliktlösung',
        description: error.message || 'Der Konflikt konnte nicht aufgelöst werden.',
        duration: 5000,
        variant: 'destructive'
      });
    }
  }, [content, dTag]);

  // Aktiven Content updaten
  useEffect(() => {
    const activeContent = getActiveContent();
    if (activeContent) {
      setActiveContentId(activeContent.id);
    } else {
      setActiveContentId('');
    }
  }, [content]);

  return {
    content: content || [],
    isLoading,
    error,
    activeContent: getActiveContent(),
    activeContentId,
    updateContent: updateMutation.mutate,
    resolveConflict,
    conflictResolution,
    refetch: () => queryClient.invalidateQueries({ queryKey: ['auto-replaceable-content', dTag] })
  };
}