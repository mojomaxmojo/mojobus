import { ZapDialog } from '@/components/ZapDialog';
import { useZaps } from '@/hooks/useZaps';
import { useWallet } from '@/hooks/useWallet';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useAuthor } from '@/hooks/useAuthor';
import { Zap } from 'lucide-react';
import type { Event } from 'nostr-tools';

interface ZapButtonProps {
  target: Event;
  className?: string;
  showCount?: boolean;
  zapData?: { count: number; totalSats: number; isLoading?: boolean };
}

export function ZapButton({
  target,
  className = "text-xs ml-1",
  showCount = true,
  zapData: externalZapData
}: ZapButtonProps) {
  const { user } = useCurrentUser();
  const { data: author } = useAuthor(target?.pubkey || '');
  const { webln, activeNWC } = useWallet();

  // Only fetch data if not provided externally
  const { totalSats: fetchedTotalSats, isLoading } = useZaps(
    externalZapData ? [] : target ?? [], // Empty array prevents fetching if external data provided
    webln,
    activeNWC
  );

  // Use external data if provided, otherwise use fetched data
  const totalSats = externalZapData?.totalSats ?? fetchedTotalSats;
  const showLoading = externalZapData?.isLoading || isLoading;

  // Don't show zap button if target is missing, is the author, or author has no lightning address
  // (but show it for non-logged-in users)
  if (!target || (user && user.pubkey === target.pubkey) || (!author?.metadata?.lud16 && !author?.metadata?.lud06)) {
    return null;
  }

  const handleZapClick = (e: React.MouseEvent) => {
    if (!user) {
      // Show login dialog for non-logged-in users
      e.preventDefault();
      e.stopPropagation();
      window.dispatchEvent(new CustomEvent('show-login'));
    }
  };

  return (
    <ZapDialog target={target}>
      <div
        className={`flex items-center gap-1 group ${className}`}
        onClick={handleZapClick}
      >
        <Zap className="h-4 w-4 group-hover:fill-yellow-500 group-hover:text-yellow-500 transition-colors" />
        <span className="text-xs group-hover:text-yellow-500 transition-colors">
          {showLoading ? (
            '...'
          ) : showCount && totalSats > 0 ? (
            `${totalSats.toLocaleString()}`
          ) : (
            'Zap'
          )}
        </span>
      </div>
    </ZapDialog>
  );
}
