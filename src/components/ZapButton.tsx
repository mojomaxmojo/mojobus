import { ZapDialog } from '@/components/ZapDialog';
import { useZaps } from '@/hooks/useZaps';
import { useWallet } from '@/hooks/useWallet';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useAuthor } from '@/hooks/useAuthor';
import { Zap, Lock, LogIn, ZapOff } from 'lucide-react';
import type { Event } from 'nostr-tools';

interface ZapButtonProps {
  target: Event;
  className?: string;
  showCount?: boolean;
  zapData?: { count: number; totalSats: number; isLoading?: boolean };
}

export function ZapButton({
  target,
  className = "text-xs",
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

  // Check if zap button is enabled
  const canZap = user && target && user.pubkey !== target.pubkey && (author?.metadata?.lud16 || author?.metadata?.lud06);
  const isLoggedIn = !!user;
  const hasLightningAddress = author?.metadata?.lud16 || author?.metadata?.lud06;
  const isAuthor = user && target && user.pubkey === target.pubkey;

  // Use external data if provided, otherwise use fetched data
  const totalSats = externalZapData?.totalSats ?? fetchedTotalSats;
  const showLoading = externalZapData?.isLoading || isLoading;

  // Show different states based on availability
  if (!isLoggedIn) {
    return (
      <div className={`flex items-center gap-1 ${className} text-muted-foreground opacity-70`}>
        <LogIn className="h-4 w-4" />
        <span className="text-xs">Login zum Zappen</span>
      </div>
    );
  }

  if (isAuthor) {
    return (
      <div className={`flex items-center gap-1 ${className} text-muted-foreground opacity-50`}>
        <Lock className="h-4 w-4" />
        <span className="text-xs">Eigener Post</span>
      </div>
    );
  }

  if (!hasLightningAddress) {
    return (
      <div className={`flex items-center gap-1 ${className} text-muted-foreground opacity-70`}>
        <ZapOff className="h-4 w-4" />
        <span className="text-xs">Keine LN-Adresse</span>
      </div>
    );
  }

  return (
    <ZapDialog target={target}>
      <div className={`flex items-center gap-1 ${className} hover:text-ocean-600 transition-colors cursor-pointer`}>
        <Zap className="h-4 w-4" />
        <span className="text-xs">
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