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
    externalZapData ? [] : target ?? [], // Empty array prevents fetching if external data provided
    webln,
    activeNWC
  );

  // Prüfe Bedingungen - IMMER etwas returnen (niemals null)
  const isLoggedIn = !!user;
  const isAuthor = user && target && user.pubkey === target.pubkey;
  const hasLightningAddress = author?.metadata?.lud16 || author?.metadata?.lud06;
  const canZap = isLoggedIn && !isAuthor && hasLightningAddress;

  // Text bestimmen
  let text = 'Zap';
  if (!isLoggedIn) text = 'Login zum Zappen';
  else if (isAuthor) text = 'Eigener Post';
  else if (!hasLightningAddress) text = 'Keine LN-Adresse';
  else if (showLoading) text = '...';
  else if (showCount && fetchedTotalSats > 0) text = `${fetchedTotalSats.toLocaleString()} sats`;

  // Hintergrundfarbe bestimmen
  let bgColor = 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700';
  if (!isLoggedIn) bgColor = 'bg-red-100 dark:bg-red-900/20 hover:bg-red-200 dark:hover:bg-red-900/30';
  else if (isAuthor) bgColor = 'bg-yellow-100 dark:bg-yellow-900/20 hover:bg-yellow-200 dark:hover:bg-yellow-900/30';
  else if (!hasLightningAddress) bgColor = 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700';
  else bgColor = 'bg-green-100 dark:bg-green-900/20 hover:bg-green-200 dark:hover:bg-green-900/30';

  // IMMER rendern, niemals null
  return (
    <ZapDialog target={canZap ? target : null}>
      <div
        className={`flex items-center gap-1 ${className} ${bgColor} p-2 rounded transition-colors cursor-${canZap ? 'pointer' : 'default'}`}
      >
        <span className="text-xl">⚡</span>
        <span className="text-xs font-medium">{text}</span>
      </div>
    </ZapDialog>
  );
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

  // DEBUGGING: Immer rendern ohne Bedingungen
  console.log('[ZapButton SIMPLE DEBUG]', {
    target: target ? 'EXISTS' : 'NULL',
    user: user ? 'EXISTS' : 'NULL',
    author: author ? 'EXISTS' : 'NULL',
    userPubkey: user?.pubkey,
    targetPubkey: target?.pubkey,
  });

  return (
    <div className="bg-blue-500 text-white p-4 rounded mt-2 border-4 border-yellow-400">
      <div className="text-xl font-bold">⚡ ZAP BUTTON TEST</div>
      <div className="text-sm mt-2">
        {target ? 'Target: ' + target.id.substring(0, 8) + '...' : 'Target: NULL'}
      </div>
      <div className="text-sm">
        {user ? 'User: ' + user.pubkey.substring(0, 8) + '...' : 'User: NULL'}
      </div>
      <div className="text-sm">
        {author?.metadata?.lud16 ? 'LN: lud16=' + author.metadata.lud16.substring(0, 20) + '...' : 'LN: KEIN lud16'}
      </div>
    </div>
  );
}