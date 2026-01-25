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

  // Determine text
  let text = 'Zap';
  if (!isLoggedIn) text = 'Login zum Zappen';
  else if (isAuthor) text = 'Eigener Post';
  else if (!hasLightningAddress) text = 'Keine LN-Adresse';
  else if (isLoading) text = '...';
  else if (showCount && fetchedTotalSats > 0) text = `${fetchedTotalSats.toLocaleString()} sats`;

  // Determine background color
  let bgColor = 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700';
  if (!isLoggedIn) bgColor = 'bg-red-100 dark:bg-red-900/20 hover:bg-red-200 dark:hover:bg-red-900/30';
  else if (isAuthor) bgColor = 'bg-yellow-100 dark:bg-yellow-900/20 hover:bg-yellow-200 dark:hover:bg-yellow-900/30';
  else if (!hasLightningAddress) bgColor = 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700';
  else bgColor = 'bg-green-100 dark:bg-green-900/20 hover:bg-green-200 dark:hover:bg-green-900/30';

  // Conditionally render ZapDialog only when we can zap
  if (canZap) {
    return (
      <ZapDialog target={target}>
        <div
          className={`flex items-center gap-1 ${className} ${bgColor} p-2 rounded transition-colors cursor-pointer`}
        >
          <span className="text-xl">⚡</span>
          <span className="text-xs font-medium">{text}</span>
        </div>
      </ZapDialog>
    );
  }

  // Otherwise render disabled button without ZapDialog wrapper
  return (
    <div
      className={`flex items-center gap-1 ${className} ${bgColor} p-2 rounded transition-colors cursor-default`}
    >
      <span className="text-xl">⚡</span>
      <span className="text-xs font-medium">{text}</span>
    </div>
  );
}
