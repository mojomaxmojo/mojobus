import { useState } from 'react';
import { Heart } from 'lucide-react';
import { useNostr } from '@nostrify/react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useToast } from '@/hooks/useToast';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useQuery } from '@tanstack/react-query';
import { DEFAULT_PERFORMANCE_CONFIG } from '@/config/performance';

interface LikeButtonProps {
  target: any;
  className?: string;
}

export function LikeButton({ target, className = '' }: LikeButtonProps) {
  const { user } = useCurrentUser();
  const { nostr } = useNostr();
  const { toast } = useToast();
  const { mutate: publishEvent } = useNostrPublish();
  const [isPending, setIsPending] = useState(false);

  // Fetch existing reactions for this event
  const { data: reactions = [], isLoading } = useQuery({
    queryKey: ['reactions', target.id],
    queryFn: async ({ signal }) => {
      const events = await nostr.query(
        [{
          kinds: [7], // Kind 7: Reactions
          '#e': [target.id],
          limit: 500,
        }],
        { signal: AbortSignal.any([signal!, AbortSignal.timeout(DEFAULT_PERFORMANCE_CONFIG.relay.queryTimeout)]) }
      );
      return events;
    },
    staleTime: DEFAULT_PERFORMANCE_CONFIG.cache.staleTime,
    enabled: !!target?.id,
  });

  // Count likes (content: "+" or empty string)
  const likeCount = reactions.filter(
    (r: any) => r.content === '+' || r.content === ''
  ).length;

  // Check if current user already liked this
  const hasLiked = reactions.some((r: any) => r.pubkey === user?.pubkey && (r.content === '+' || r.content === ''));

  const handleLike = async () => {
    if (!user) {
      toast({
        title: 'Nicht eingeloggt',
        description: 'Du musst eingeloggt sein, um zu liken.',
        variant: 'destructive',
      });
      return;
    }

    if (isPending) return;

    setIsPending(true);

    try {
      if (hasLiked) {
        // Unlike: Remove the reaction by publishing a delete event
        const userReactions = reactions.filter(
          (r: any) => r.pubkey === user.pubkey && (r.content === '+' || r.content === '')
        );

        for (const reaction of userReactions) {
          await nostr.event({
            kind: 5, // Delete event
            tags: [['e', reaction.id]],
            content: 'Like entfernt',
          });
        }

        toast({
          title: 'Like entfernt',
          description: 'Dein Like wurde entfernt.',
        });
      } else {
        // Like: Create a new reaction
        publishEvent({
          kind: 7, // Reaction
          tags: [
            ['e', target.id],
            ['p', target.pubkey],
          ],
          content: '+',
        });

        toast({
          title: 'Geliked!',
          description: 'Du hast diesen Post geliked.',
        });
      }
    } catch (error) {
      console.error('Like error:', error);
      toast({
        title: 'Fehler',
        description: 'Es ist ein Fehler aufgetreten. Bitte versuche es erneut.',
        variant: 'destructive',
      });
    } finally {
      setIsPending(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <button
      onClick={handleLike}
      disabled={isPending || isLoading}
      className={`flex items-center gap-1 text-xs text-muted-foreground hover:text-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      title={hasLiked ? 'Unlike' : 'Like'}
    >
      <Heart
        className={`h-4 w-4 ${hasLiked ? 'fill-red-500 text-red-500' : ''}`}
      />
      {isLoading ? '...' : likeCount > 0 && <span>{likeCount}</span>}
    </button>
  );
}
