import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ZapButton } from '@/components/ZapButton';
import { MessageSquare, Repeat2, Heart, Share2 } from 'lucide-react';
import { useSocialCounts } from '@/hooks/useSocialCounts';
import { useLikeActions, useRepostActions } from '@/hooks/useSocialActions';
import { useComments } from '@/hooks/useComments';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import type { NostrEvent } from '@nostrify/nostrify';
import { cn } from '@/lib/utils';
import { nip19 } from 'nostr-tools';

interface SocialBarProps {
  /** The target event to interact with */
  event: NostrEvent;
  /** Compact mode for card views (smaller buttons, horizontal layout) */
  compact?: boolean;
  /** Optional custom className */
  className?: string;
}

/**
 * SocialBar component showing and handling all social interactions
 * - Comments (NIP-22, Kind 1111)
 * - Reposts (Kind 6)
 * - Zaps (Lightning payments)
 * - Likes (Kind 7 reactions)
 */
export function SocialBar({ event, compact = false, className }: SocialBarProps) {
  const { user } = useCurrentUser();
  const { like } = useLikeActions();
  const { repost } = useRepostActions();

  // Fetch social counts
  const { data: counts, isLoading } = useSocialCounts(event);

  // Fetch comments for count (useComments returns structure with allComments)
  const { data: commentsData } = useComments(event);
  const commentCount = commentsData?.allComments?.length || 0;

  // Local state for like and repost interactions (optimistic UI)
  const [isLiking, setIsLiking] = useState(false);
  const [isReposting, setIsReposting] = useState(false);

  const handleShare = async () => {
    // Generate nip19 identifier for sharing
    let shareUrl = '';
    if ([1, 1111].includes(event.kind)) {
      shareUrl = `${window.location.origin}/${nip19.noteEncode(event.id)}`;
    } else {
      const naddr = nip19.naddrEncode({
        kind: event.kind,
        pubkey: event.pubkey,
        identifier: event.tags.find(([name]) => name === 'd')?.[1] || '',
      });
      shareUrl = `${window.location.origin}/${naddr}`;
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Post von MojoBus',
          text: event.content?.substring(0, 100) || 'Schau dir diesen Post an!',
          url: shareUrl,
        });
      } catch (error) {
        // User cancelled or share failed
        console.error('Share error:', error);
      }
    } else {
      // Fallback: Copy to clipboard
      await navigator.clipboard.writeText(shareUrl);
    }
  };

  const handleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);
    await like(event);
    setIsLiking(false);
  };

  const handleRepost = async () => {
    if (isReposting) return;
    setIsReposting(true);
    await repost(event);
    setIsReposting(false);
  };

  if (compact) {
    // Compact version for card views
    return (
      <div className={cn("flex items-center justify-between px-4 py-2 border-t", className)}>
        {/* Comments */}
        <Button
          variant="ghost"
          size="sm"
          className="flex-1 gap-1 h-8 text-muted-foreground hover:text-foreground"
          asChild
        >
          <a href={`/${event.id}`}>
            <MessageSquare className="h-4 w-4" />
            <span className="text-xs">
              {isLoading ? '...' : commentCount}
            </span>
          </a>
        </Button>

        {/* Reposts */}
        <Button
          variant="ghost"
          size="sm"
          className="flex-1 gap-1 h-8 text-muted-foreground hover:text-foreground"
          onClick={handleRepost}
          disabled={isReposting || !user}
        >
          <Repeat2 className={cn("h-4 w-4", isReposting && "animate-pulse")} />
          <span className="text-xs">
            {isReposting ? '...' : (isLoading ? '...' : counts?.reposts ?? 0)}
          </span>
        </Button>

        {/* Zaps */}
        <div className="flex-1">
          <ZapButton
            target={event}
            showCount={true}
            className="flex items-center gap-1 text-xs ml-1 text-muted-foreground hover:text-foreground"
          />
        </div>

        {/* Likes */}
        <Button
          variant="ghost"
          size="sm"
          className="flex-1 gap-1 h-8 text-muted-foreground hover:text-foreground hover:text-red-500"
          onClick={handleLike}
          disabled={isLiking || !user}
        >
          <Heart className={cn("h-4 w-4", isLiking && "animate-pulse")} />
          <span className="text-xs">
            {isLiking ? '...' : (isLoading ? '...' : counts?.likes ?? 0)}
          </span>
        </Button>

        {/* Share */}
        <Button
          variant="ghost"
          size="sm"
          className="flex-1 gap-1 h-8 text-muted-foreground hover:text-foreground"
          onClick={handleShare}
        >
          <Share2 className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  // Full version for detail views
  return (
    <div className={cn("flex items-center justify-between px-4 py-2 border-t", className)}>
      {/* Comments */}
      <Button
        variant="ghost"
        size="sm"
        className="flex-1 gap-1 h-8 text-muted-foreground hover:text-foreground"
        asChild
      >
        <a href={`#comments`}>
          <MessageSquare className="h-4 w-4" />
          <span className="text-xs">
            {isLoading ? '...' : commentCount}
          </span>
        </a>
      </Button>

      {/* Reposts */}
      <Button
        variant="ghost"
        size="sm"
        className="flex-1 gap-1 h-8 text-muted-foreground hover:text-foreground"
        onClick={handleRepost}
        disabled={isReposting || !user}
      >
        <Repeat2 className={cn("h-4 w-4", isReposting && "animate-pulse")} />
        <span className="text-xs">
          {isReposting ? '...' : (isLoading ? '...' : counts?.reposts ?? 0)}
        </span>
      </Button>

      {/* Zaps */}
      <div className="flex-1">
        <ZapButton
          target={event}
          showCount={true}
          className="flex items-center gap-1 text-xs ml-1 text-muted-foreground hover:text-foreground"
        />
      </div>

      {/* Likes */}
      <Button
        variant="ghost"
        size="sm"
        className="flex-1 gap-1 h-8 text-muted-foreground hover:text-foreground hover:text-red-500"
        onClick={handleLike}
        disabled={isLiking || !user}
      >
        <Heart className={cn("h-4 w-4", isLiking && "animate-pulse")} />
        <span className="text-xs">
          {isLiking ? '...' : (isLoading ? '...' : counts?.likes ?? 0)}
        </span>
      </Button>

      {/* Share */}
      <Button
        variant="ghost"
        size="sm"
        className="flex-1 gap-1 h-8 text-muted-foreground hover:text-foreground"
        onClick={handleShare}
      >
        <Share2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
