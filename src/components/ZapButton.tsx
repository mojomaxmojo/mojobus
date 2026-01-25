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