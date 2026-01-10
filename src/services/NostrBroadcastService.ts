import { useNostr } from '@nostrify/react';
import { useToast } from '@/hooks/useToast';

/**
 * Service für Broadcasting von Nostr-Events
 * Ermöglicht Live-Updates und Notifications
 */
export class NostrBroadcastService {
  private nostr: any;

  constructor() {
    this.nostr = useNostr();
  }

  /**
   * Broadcast für Content-Updates
   */
  async broadcastContentUpdate(dTag: string, action: string = 'update') {
    const message = {
      type: 'content-updated',
      dTag,
      action,
      timestamp: Date.now(),
      data: {
        title: 'Content aktualisiert',
        message: `Ein Inhalt wurde aktualisiert`
      }
    };

    // Sendet an alle offenen WebSockets
    if (typeof window !== 'undefined' && window.webkit?.messageHandlers) {
      try {
        window.webkit.messageHandlers['nostr-broadcast'].postMessage(
          JSON.stringify(message)
        );
        console.log(`Broadcasted content update for ${dTag}`);
      } catch (error) {
        console.error('Failed to broadcast content update:', error);
      }
    }

    // Sendet auch als Nostr-Event für Cross-Device-Synchronisation
    await this.nostr.event({
      kind: 30079, // Notification Event
      content: JSON.stringify(message),
      tags: [
        ['d', dTag],
        ['t', 'broadcast'],
        ['t', 'content-update'],
        ['t', action]
      ],
      created_at: Math.floor(Date.now() / 1000)
    });

    return message;
  }

  /**
   * Broadcast für Edit-Session
   */
  async broadcastEditSessionStart(dTag: string, contentId: string) {
    const message = {
      type: 'edit-session-start',
      dTag,
      contentId,
      timestamp: Date.now(),
      data: {
        title: 'Edit-Session gestartet',
        message: `Ein Benutzer beginnt mit der Bearbeitung von ${contentId}`
      }
    };

    if (typeof window !== 'undefined' && window.webkit?.messageHandlers) {
      try {
        window.webkit.messageHandlers['nostr-broadcast'].postMessage(
          JSON.stringify(message)
        );
        console.log(`Broadcasted edit session start for ${contentId}`);
      } catch (error) {
        console.error('Failed to broadcast edit session start:', error);
      }
    }

    return message;
  }

  /**
   * Broadcast für Edit-Session-Ende
   */
  async broadcastEditSessionEnd(dTag: string, contentId: string) {
    const message = {
      type: 'edit-session-end',
      dTag,
      contentId,
      timestamp: Date.now(),
      data: {
        title: 'Edit-Session beendet',
        message: `Ein Benutzer hat die Bearbeitung von ${contentId} beendet`
      }
    };

    if (typeof window !== 'undefined' && window.webkit?.messageHandlers) {
      try {
        window.webkit.messageHandlers['nostr-broadcast'].postMessage(
          JSON.stringify(message)
        );
        console.log(`Broadcasted edit session end for ${contentId}`);
      } catch (error) {
        console.error('Failed to broadcast edit session end:', error);
      }
    }

    return message;
  }

  /**
   * Broadcast für neue Erstellung
   */
  async broadcastContentCreated(dTag: string, contentId: string) {
    const message = {
      type: 'content-created',
      dTag,
      contentId,
      timestamp: Date.now(),
      data: {
        title: 'Neuer Inhalt erstellt',
        message: `Ein neuer replaceable Inhalt mit ID ${contentId} wurde erstellt`
      }
    };

    if (typeof window !== 'undefined' && window.webkit?.messageHandlers) {
      try {
        window.webkit.messageHandlers['nostr-broadcast'].postMessage(
          JSON.stringify(message)
        );
        console.log(`Broadcasted content created for ${contentId}`);
      } catch (error) {
        console.error('Failed to broadcast content created:', error);
      }
    }

    return message;
  }
}