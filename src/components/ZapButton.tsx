import { ZapDialog } from '@/components/ZapDialog';
import { useZaps } from '@/hooks/useZaps';
import { useWallet } from '@/hooks/useWallet';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useAuthor } from '@/hooks/useAuthor';
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
    externalZapData ? [] : target ?? [],
    webln,
    activeNWC
  );

  // Check conditions
  const isLoggedIn = !!user;
  const isAuthor = user && target && user.pubkey === target.pubkey;
  const hasLightningAddress = author?.metadata?.lud16 || author?.metadata?.lud06;
  const canZap = isLoggedIn && !isAuthor && hasLightningAddress;

  // Only render ZapDialog when we can zap, otherwise render simple icon
  if (canZap) {
    return (
      <ZapDialog target={target}>
        <div className={`flex items-center ${className} hover:scale-125 hover:text-yellow-500 transition-all duration-200 cursor-pointer`}>
          <span className="text-xl">⚡</span>
          {showCount && fetchedTotalSats > 0 && (
            <span className="text-xs ml-1 text-muted-foreground">
              {fetchedTotalSats.toLocaleString()}
            </span>
          )}
        </div>
      </ZapDialog>
    );
  }

  // Disabled state - simple icon without click
  return (
    <div className={`flex items-center ${className} opacity-50 cursor-not-allowed`}>
      <span className="text-xl">⚡</span>
    </div>
  );
}
