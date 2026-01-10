import { useState } from 'react';
import { useNostr } from '@nostrify/react';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Super-einfacher Replaceable Content Hook
 * Löst das 5x Events Problem mit minimalem Code
 */
export function useReplaceableContentSimple({ dTag }: { dTag: string }) {
  const { nostr } = useNostr();
  const queryClient = useQueryClient();

  const [isPublishing, setIsPublishing] = useState(false);

  const updateContent = async (content: string) => {
    setIsPublishing(true);

    try {
      const event = await nostr.event({
        kind: 30000 + 30 + dTag, // Replaceable Kind
        content,
        tags: [
          ['d', dTag], // Spezifischer d-tag
          ['t', 'replaceable'], // Markiert als ersetzbar
          ['created_at', Date.now().toString()]
        ],
        created_at: Math.floor(Date.now() / 1000)
      });

      await nostr.publish(event);

      // Query invalidieren um UI zu aktualisieren
      queryClient.invalidateQueries({ 
        queryKey: ['replaceable-content', dTag] 
      });

      console.log(`Replaceable content published for d-tag: ${dTag}`);
      return event;
    } catch (error) {
      console.error('Failed to publish replaceable content:', error);
      setIsPublishing(false);
      throw error;
    } finally {
      setIsPublishing(false);
    }
  };

  return {
    updateContent,
    isPublishing
  };
}