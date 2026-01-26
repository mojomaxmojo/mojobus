import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ZapButton } from '@/components/ZapButton';
import { MessageSquare, Repeat2, Heart, Share2, Zap as ZapIcon } from 'lucide-react';
import { useSocialCounts } from '@/hooks/useSocialCounts';
import { useLikeActions, useRepostActions } from '@/hooks/useSocialActions';
import { useComments } from '@/hooks/useComments';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useZaps } from '@/hooks/useZaps';
import { useWallet } from '@/hooks/useWallet';
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
  const { webln, activeNWC } = useWallet();

  // Fetch social counts
  const { data: counts, isLoading } = useSocialCounts(event);

  // Fetch comments for count (useComments returns structure with allComments)
  const { data: commentsData } = useComments(event);
  const commentCount = commentsData?.allComments?.length || 0;

  // Fetch zaps for count
  const { zapCount } = useZaps(event, webln, activeNWC);

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

  const handleZap = () => {
    // Open zap dialog
    // This will be handled by ZapDialog trigger
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
      <div className={cn("flex items-center gap-1 px-4 py-2 border-t w-full overflow-visible", className)}>
        {/* Comments */}
        <Button
          variant="ghost"
          size="sm"
          className="flex-1 gap-1 h-8 text-muted-foreground hover:text-gray-700 min-w-0 transition-colors"
          asChild
        >
          <a href={`/${event.id}`} className="group">
            <MessageSquare className="h-4 w-4 flex-shrink-0 group-hover:fill-gray-300 transition-colors" />
            <span className="text-xs truncate group-hover:text-gray-700">
              {isLoading ? '...' : commentCount}
            </span>
          </a>
        </Button>

        {/* Reposts */}
        <Button
          variant="ghost"
          size="sm"
          className="flex-1 gap-1 h-8 text-muted-foreground hover:text-green-600 min-w-0 transition-colors group"
          onClick={handleRepost}
          disabled={isReposting || !user}
        >
          <Repeat2 className={cn("h-4 w-4 flex-shrink-0 group-hover:fill-green-400", isReposting && "animate-pulse")} />
          <span className="text-xs truncate group-hover:text-green-600">
            {isReposting ? '...' : (isLoading ? '...' : counts?.reposts ?? 0)}
          </span>
        </Button>

        {/* Zaps - Custom with yellow lightning on hover */}
        <ZapButton
          target={event}
          showCount={false}
        >
          <div className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground group min-w-0">
            <ZapIcon className="h-4 w-4 flex-shrink-0 text-muted-foreground group-hover:text-yellow-500 transition-colors" />
            <span className="truncate">
              {isLoading ? '...' : zapCount}
            </span>
          </div>
        </ZapButton>

        {/* Likes */}
        <Button
          variant="ghost"
          size="sm"
          className="flex-1 gap-1 h-8 text-muted-foreground hover:text-red-600 min-w-0 transition-colors group"
          onClick={handleLike}
          disabled={isLiking || !user}
        >
          <Heart className={cn("h-4 w-4 flex-shrink-0 group-hover:fill-red-500", isLiking && "animate-pulse")} />
          <span className="text-xs truncate group-hover:text-red-600">
            {isLiking ? '...' : (isLoading ? '...' : counts?.likes ?? 0)}
          </span>
        </Button>

        {/* Share */}
        <Button
          variant="ghost"
          size="sm"
          className="flex-1 gap-1 h-8 text-muted-foreground hover:text-blue-600 min-w-0 transition-colors group"
          onClick={handleShare}
        >
          <Share2 className="h-4 w-4 flex-shrink-0 group-hover:fill-blue-400" />
        </Button>
      </div>
    );
  }

  // Full version for detail views
  return (
    <div className={cn("flex items-center gap-1 px-4 py-2 border-t w-full overflow-visible", className)}>
      {/* Comments */}
      <Button
        variant="ghost"
        size="sm"
        className="flex-1 gap-1 h-8 text-muted-foreground hover:text-gray-700 min-w-0 transition-colors"
        asChild
      >
        <a href={`#comments`} className="group">
          <MessageSquare className="h-4 w-4 flex-shrink-0 group-hover:fill-gray-300 transition-colors" />
          <span className="text-xs truncate group-hover:text-gray-700">
            {isLoading ? '...' : commentCount}
          </span>
        </a>
      </Button>

      {/* Reposts */}
      <Button
        variant="ghost"
        size="sm"
        className="flex-1 gap-1 h-8 text-muted-foreground hover:text-green-600 min-w-0 transition-colors group"
        onClick={handleRepost}
        disabled={isReposting || !user}
      >
        <Repeat2 className={cn("h-4 w-4 flex-shrink-0 group-hover:fill-green-400", isReposting && "animate-pulse")} />
        <span className="text-xs truncate group-hover:text-green-600">
          {isReposting ? '...' : (isLoading ? '...' : counts?.reposts ?? 0)}
        </span>
      </Button>

      {/* Zaps - Custom with yellow lightning on hover */}
      <ZapButton
        target={event}
        showCount={false}
      >
        <div className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground group min-w-0">
          <ZapIcon className="h-4 w-4 flex-shrink-0 text-muted-foreground group-hover:text-yellow-500 transition-colors" />
          <span className="truncate">
            {isLoading ? '...' : zapCount}
          </span>
        </div>
      </ZapButton>

      {/* Likes */}
      <Button
        variant="ghost"
        size="sm"
        className="flex-1 gap-1 h-8 text-muted-foreground hover:text-red-600 min-w-0 transition-colors group"
        onClick={handleLike}
        disabled={isLiking || !user}
      >
        <Heart className={cn("h-4 w-4 flex-shrink-0 group-hover:fill-red-500", isLiking && "animate-pulse")} />
        <span className="text-xs truncate group-hover:text-red-600">
          {isLiking ? '...' : (isLoading ? '...' : counts?.likes ?? 0)}
        </span>
      </Button>

      {/* Share */}
      <Button
        variant="ghost"
        size="sm"
        className="flex-1 gap-1 h-8 text-muted-foreground hover:text-blue-600 min-w-0 flex justify-center transition-colors group"
        onClick={handleShare}
      >
        <Share2 className="h-4 w-4 flex-shrink-0 group-hover:fill-blue-400" />
      </Button>
    </div>
  );
}
