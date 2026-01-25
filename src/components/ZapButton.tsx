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

  // Debug: Log props
  if (target) {
    console.log('[ZapButton] Rendered with:', {
      targetId: target.id,
      targetKind: target.kind,
      user: user?.pubkey,
      isAuthor: user?.pubkey === target.pubkey,
      showCount,
    });
  }

  // Only fetch data if not provided externally
  const { totalSats: fetchedTotalSats, isLoading } = useZaps(
    externalZapData ? [] : target ?? [], // Empty array prevents fetching if external data provided
    webln,
    activeNWC
  );

  // Don't show zap button if target is missing
  if (!target) {
    console.log('[ZapButton] No target provided, returning null');
    return null;
  }

  // ZapButton ist jetzt für alle User sichtbar (auch Autor)
  // if (user && user.pubkey === target.pubkey) {
  //   console.log('[ZapButton] User is author, hiding zap button');
  //   return null;
  // }

  if (user && user.pubkey === target.pubkey) {
    console.log('[ZapButton] User is author, hiding zap button');
    return null;
  }

  // Use external data if provided, otherwise use fetched data
  const totalSats = externalZapData?.totalSats ?? fetchedTotalSats;
  const showLoading = externalZapData?.isLoading || isLoading;

  console.log('[ZapButton] Rendering zap button:', { totalSats, showLoading });

  return (
    <ZapDialog target={target}>
      <div className={`flex items-center gap-1 ${className}`}>
        <Zap className="h-4 w-4" />
        <span className="text-xs">
          {showLoading ? (
            '...'
          ) : showCount ? (
            totalSats > 0 ? `${totalSats.toLocaleString()}` : 'Zap'
          ) : (
            null
          )}
        </span>
      </div>
    </ZapDialog>
  );
}