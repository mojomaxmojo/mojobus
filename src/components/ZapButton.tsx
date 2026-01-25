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

  console.log('[ZapButton Debug]', {
    isLoggedIn,
    isAuthor,
    hasLightningAddress,
    canZap,
    targetId: target?.id,
    authorPubkey: target?.pubkey,
    userPubkey: user?.pubkey,
    hasLud16: !!author?.metadata?.lud16,
    hasLud06: !!author?.metadata?.lud06,
  });

  // Show different states based on availability
  if (!isLoggedIn) {
    return (
      <div className={`flex items-center gap-1 ${className} text-muted-foreground bg-red-100 dark:bg-red-900/20 p-2 rounded`}>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
          <polyline points="10 17 15 21 15 21"/>
          <line x1="15" x2="3" y1="12" y2="12"/>
        </svg>
        <span className="text-xs">Login zum Zappen</span>
      </div>
    );
  }

  if (isAuthor) {
    return (
      <div className={`flex items-center gap-1 ${className} text-muted-foreground bg-yellow-100 dark:bg-yellow-900/20 p-2 rounded`}>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
        <span className="text-xs">Eigener Post</span>
      </div>
    );
  }

  if (!hasLightningAddress) {
    return (
      <div className={`flex items-center gap-1 ${className} text-muted-foreground bg-gray-100 dark:bg-gray-800 p-2 rounded`}>
        <span className="text-xl">⚡❌</span>
        <span className="text-xs">Keine LN-Adresse</span>
      </div>
    );
  }

  return (
    <ZapDialog target={target}>
      <div className={`flex items-center gap-1 ${className} bg-green-100 dark:bg-green-900/20 p-2 rounded hover:bg-green-200 dark:hover:bg-green-900/30 transition-colors cursor-pointer`}>
        <span className="text-xl">⚡</span>
        <span className="text-xs font-medium">
          {showLoading ? (
            '...'
          ) : showCount && totalSats > 0 ? (
            `${totalSats.toLocaleString()} sats`
          ) : (
            'Zap'
          )}
        </span>
      </div>
    </ZapDialog>
  );
}