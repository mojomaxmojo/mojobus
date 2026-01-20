import { useNostr } from '@nostrify/react';
import { useToast } from '@/hooks/useToast';

// Service für die Verwaltung von replaceable content
export class ContentManagerService {
  private nostr: any;

  constructor() {
    this.nostr = useNostr();
  }

  /**
   * Erstellt neuen replaceable content
   * Nutzt Kind 30000+30+dTag für maximale Kompatibilität
   */
  async createContent(dTag: string, content: string, additionalTags: string[] = []) {
    const event = await this.nostr.event({
      kind: 30000 + 30 + dTag,
      content,
      tags: [
        ['d', dTag], // Spezifischer d-tag für diesen Inhalt
        ['t', 'replaceable'], // Markiert als ersetzbarer Inhalt
        'created_at', Date.now().toString(),
        ...additionalTags.map(tag => ['t', tag])
      ],
      created_at: Math.floor(Date.now() / 1000)
    });

    await this.nostr.publish(event);
    console.log(`Created replaceable content with d-tag: ${dTag}`);

    return event;
  }

  /**
   * Aktualisiert existierenden replaceable content
   * Erstellt neues Event mit höherem timestamp und u-tag
   */
  async updateContent(
    oldEventId: string,
    newContent: string,
    additionalTags: string[] = []
  ) {
    const updateTag = `u:${Date.now()}`;
    const updatedEvent = await this.nostr.event({
      kind: 30000 + 30,
      content: newContent,
      tags: [
        ['d', oldEventId], // Referenz zum originalen Event
        ['u', updateTag], // Update-Tag mit Timestamp
        'updated_at', Date.now().toString(),
        ...additionalTags.map(tag => ['t', tag])
      ],
      created_at: Math.floor(Date.now() / 1000)
    });

    await this.nostr.publish(updatedEvent);

    // Broadcast für Live-Updates
    if (typeof window !== 'undefined' && window.webkit?.messageHandlers) {
      window.webkit.messageHandlers['nostr-broadcast'].postMessage({
        type: 'content-updated',
        dTag: oldEventId,
        uTag: updateTag
      });
    }

    return updatedEvent;
  }

  /**
   * Fragt replaceable content mit Pagination
   */
  async getContentList(dTag: string, limit = 50, until?: string) {
    const events = await this.nostr.query([
      {
        kinds: [30000 + 30 + dTag], // Nur replaceable Inhalte
        limit,
        order: 'created_at_desc'
      }
    ]);

    // Optional: Bis zu einem bestimmten Timestamp fragen
    let filteredEvents = events;
    if (until) {
      const untilTimestamp = new Date(until).getTime() / 1000;
      filteredEvents = events.filter(event => event.created_at <= untilTimestamp);
    }

    return {
      events: filteredEvents,
      hasMore: events.length === limit
    };
  }

  /**
   * Erstellt automatisch ein neues Event wenn manuell bearbeitet (de-bounced)
   */
  createAutoUpdate = (() => {
    let timeoutId: NodeJS.Timeout;
    const saveFn = async (dTag: string, content: string, additionalTags: string[] = []) => {
      clearTimeout(timeoutId);
      
      timeoutId = setTimeout(async () => {
        await this.createContent(dTag, content, additionalTags);
      }, 1000); // 1 Sekunde Verzögerung

      return saveFn;
    };

    return saveFn;
  })();

  /**
   * Konvertiert Events zu einem Display-Format
   */
  formatContentForDisplay(events: any[]) {
    return events.map(event => ({
      id: event.id,
      content: event.content,
      created_at: event.created_at,
      updated_at: event.tags.find(tag => tag[0] === 'updated_at')?.[1],
      isLatestVersion: !event.tags.some(tag => tag[0] === 'u')
    }));
  }

  /**
   * Validiert, ob ein Event replaceable ist
   */
  static isReplaceableEvent(event: any) {
    return event?.tags?.some(tag => 
      tag[0] === 't' && tag[1] === 'replaceable'
    );
  }

  /**
   * Findet die aktuellste Version eines Events
   */
  static getLatestVersion(events: any[]) {
    return events
      .filter(event => this.isReplaceableEvent(event))
      .sort((a, b) => {
        const aTime = parseInt(a.tags.find(tag => tag[0] === 'u')?.[1] || '0');
        const bTime = parseInt(b.tags.find(tag => tag[0] === 'u')?.[1] || '0');
        return bTime - aTime;
      })[0];
  }
}