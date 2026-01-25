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

  // EINFACHER RENDER - immer ⚡ Icon, nur Text und Farbe ändern
  let stateColor = 'bg-gray-100 dark:bg-gray-800';
  let stateText = 'Zap';

  if (!isLoggedIn) {
    stateColor = 'bg-red-100 dark:bg-red-900/20';
    stateText = 'Login zum Zappen';
  } else if (isAuthor) {
    stateColor = 'bg-yellow-100 dark:bg-yellow-900/20';
    stateText = 'Eigener Post';
  } else if (!hasLightningAddress) {
    stateColor = 'bg-gray-100 dark:bg-gray-800';
    stateText = 'Keine LN-Adresse';
  } else {
    stateColor = 'bg-green-100 dark:bg-green-900/20';
    stateText = showLoading ? '...' : showCount && totalSats > 0 ? `${totalSats.toLocaleString()} sats` : 'Zap';
  }

  return (
    <ZapDialog target={target}>
      <div className={`flex items-center gap-1 ${className} ${stateColor} p-2 rounded hover:opacity-80 transition-opacity`}>
        <span className="text-xl">⚡</span>
        <span className="text-xs font-medium">{stateText}</span>
      </div>
    </ZapDialog>
  );
}