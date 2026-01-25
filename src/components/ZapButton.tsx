import { useState, useEffect } from 'react';
import { Zap } from 'lucide-react';
import { useNostr } from '@nostrify/react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useAuthor } from '@/hooks/useAuthor';
import { useToast } from '@/hooks/useToast';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Sparkle, Sparkles, Star, Rocket } from 'lucide-react';
import { DEFAULT_PERFORMANCE_CONFIG } from '@/config/performance';
import QRCode from 'qrcode';
import { nip19 } from 'nostr-tools';

interface ZapButtonProps {
  target: any;
  className?: string;
  showCount?: boolean;
}

const presetAmounts = [
  { amount: 1, icon: Sparkle },
  { amount: 50, icon: Sparkles },
  { amount: 100, icon: Zap },
  { amount: 250, icon: Star },
  { amount: 1000, icon: Rocket },
];

export function ZapButton({ target, className = '', showCount = true }: ZapButtonProps) {
  const [open, setOpen] = useState(false);
  const { user } = useCurrentUser();
  const { nostr } = useNostr();
  const { data: author } = useAuthor(target?.pubkey || '');
  const { toast } = useToast();

  const [amount, setAmount] = useState<number>(100);
  const [comment, setComment] = useState<string>('Zapped with MojoBus!');
  const [invoice, setInvoice] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);
  const [copied, setCopied] = useState(false);

  // Check for WebLN wallet
  const [hasWebLN, setHasWebLN] = useState(false);
  const [isPaying, setIsPaying] = useState(false);

  useEffect(() => {
    if (target) {
      setComment('Zapped with MojoBus!');
    }
  }, [target]);

  useEffect(() => {
    // Check for WebLN wallet
    setHasWebLN(!!(window as any).webln);
  }, []);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open) {
      setAmount(100);
      setInvoice(null);
      setQrCodeUrl('');
      setCopied(false);
    }
  }, [open]);

  // Generate QR code when invoice is available
  useEffect(() => {
    let isCancelled = false;

    const generateQR = async () => {
      if (!invoice) {
        setQrCodeUrl('');
        return;
      }

      try {
        const url = await QRCode.toDataURL(invoice.toUpperCase(), {
          width: 512,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF',
          },
        });

        if (!isCancelled) {
          setQrCodeUrl(url);
        }
      } catch (err) {
        if (!isCancelled) {
          console.error('Failed to generate QR code:', err);
        }
      }
    };

    generateQR();

    return () => {
      isCancelled = true;
    };
  }, [invoice]);

  // Fetch zap receipts to get total sats
  const { data: zapReceipts = [], isLoading: isLoadingZaps } = useQuery({
    queryKey: ['zaps', target.id],
    queryFn: async ({ signal }) => {
      const events = await nostr.query(
        [{
          kinds: [9735], // Zap receipts
          '#e': [target.id],
          limit: 500,
        }],
        { signal: AbortSignal.any([signal!, AbortSignal.timeout(DEFAULT_PERFORMANCE_CONFIG.relay.queryTimeout)]) }
      );
      return events;
    },
    staleTime: DEFAULT_PERFORMANCE_CONFIG.cache.staleTime,
    enabled: !!target?.id,
  });

  // Calculate total sats from zap receipts
  const totalSats = zapReceipts.reduce((sum: number, receipt: any) => {
    const amountTag = receipt.tags?.find((tag: string[]) => tag[0] === 'amount');
    const amount = amountTag?.[1] ? parseInt(amountTag[1], 10) / 1000 : 0;
    return sum + amount;
  }, 0);

  // Don't show zap button if user is not logged in, is the author, or author has no lightning address
  if (!user || !target || user.pubkey === target.pubkey || (!author?.metadata?.lud16 && !author?.metadata?.lud06)) {
    return null;
  }

  const createInvoice = async () => {
    if (isCreatingInvoice) return;

    setIsCreatingInvoice(true);

    try {
      // Create a Zap Request event (kind 9734)
      const zapRequestEvent = await nostr.event({
        kind: 9734,
        content: comment,
        tags: [
          ['p', target.pubkey],
          ['e', target.id],
          ['relays', 'wss://relay.mojobus.co', 'wss://relay.nostr.band'],
          ['amount', `${amount * 1000}`], // Convert to millisats
        ],
      });

      // Encode the zap request
      const zapRequestNip19 = nip19.neventEncode({
        id: zapRequestEvent.id,
        relays: ['wss://relay.mojobus.co', 'wss://relay.nostr.band'],
        author: user.pubkey,
      });

      // Create LNURL zap request (simplified - in production you'd use a proper LNURL service)
      // For now, we'll show a placeholder invoice
      const mockInvoice = `lnbc${amount * 1000}n1p3xnhl2pp5x4e6x...`;

      setInvoice(mockInvoice);
    } catch (error) {
      console.error('Failed to create invoice:', error);
      toast({
        title: 'Fehler',
        description: 'Konnte Invoice nicht erstellen.',
        variant: 'destructive',
      });
    } finally {
      setIsCreatingInvoice(false);
    }
  };

  const handleWebLNPayment = async () => {
    if (!hasWebLN || !invoice) return;

    setIsPaying(true);

    try {
      const webln = (window as any).webln;
      await webln.sendPayment(invoice);

      toast({
        title: 'Zap gesendet!',
        description: `${amount} sats wurden an ${author?.metadata?.name || 'den Autor'} gesendet.`,
      });

      setOpen(false);
    } catch (error) {
      console.error('WebLN payment error:', error);
      toast({
        title: 'Fehler',
        description: 'Zahlung fehlgeschlagen.',
        variant: 'destructive',
      });
    } finally {
      setIsPaying(false);
    }
  };

  const handleCopy = async () => {
    if (invoice) {
      await navigator.clipboard.writeText(invoice);
      setCopied(true);
      toast({
        title: 'Invoice kopiert',
        description: 'Lightning invoice in die Zwischenablage kopiert.',
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const openInWallet = () => {
    if (invoice) {
      const lightningUrl = `lightning:${invoice}`;
      window.open(lightningUrl, '_blank');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div className={`flex items-center gap-1 text-xs text-muted-foreground hover:text-yellow-500 transition-colors cursor-pointer ${className}`}>
          <Zap className="h-4 w-4" />
          {isLoadingZaps ? (
            <span>...</span>
          ) : showCount && totalSats > 0 ? (
            <span>{totalSats.toLocaleString()}</span>
          ) : (
            <span>Zap</span>
          )}
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] max-h-[95vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-lg break-words">
            {invoice ? 'Lightning Payment' : 'Send a Zap'}
          </DialogTitle>
          <DialogDescription className="text-sm text-center break-words">
            {invoice ? (
              'Zahle mit Bitcoin Lightning Network'
            ) : (
              'Zaps sind kleine Bitcoin-Zahlungen, die den Autor unterstützen. Wenn dir der Inhalt gefällt, erwäge einen Zap!'
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto">
          {invoice ? (
            <div className="flex flex-col h-full min-h-0 space-y-4">
              {/* Payment amount display */}
              <div className="text-center pt-4">
                <div className="text-2xl font-bold">{amount} sats</div>
              </div>

              <Separator />

              {/* QR Code */}
              <div className="flex justify-center">
                <Card className="p-3 max-w-[95vw] mx-auto">
                  <CardContent className="p-0 flex justify-center">
                    {qrCodeUrl ? (
                      <img
                        src={qrCodeUrl}
                        alt="Lightning Invoice QR Code"
                        className="w-full h-auto aspect-square max-w-full object-contain"
                      />
                    ) : (
                      <div className="w-full aspect-square bg-muted animate-pulse rounded" />
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Invoice input */}
              <div className="space-y-2">
                <Label htmlFor="invoice">Lightning Invoice</Label>
                <div className="flex gap-2 min-w-0">
                  <Input
                    id="invoice"
                    value={invoice}
                    readOnly
                    className="font-mono text-xs min-w-0 flex-1 overflow-hidden text-ellipsis"
                    onClick={(e) => e.currentTarget.select()}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopy}
                    className="shrink-0"
                  >
                    {copied ? '✓' : '📋'}
                  </Button>
                </div>
              </div>

              {/* Payment buttons */}
              <div className="space-y-3">
                {hasWebLN && (
                  <Button
                    onClick={handleWebLNPayment}
                    disabled={isPaying}
                    className="w-full"
                    size="lg"
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    {isPaying ? 'Zahle...' : 'Mit WebLN zahlen'}
                  </Button>
                )}

                <Button
                  variant="outline"
                  onClick={openInWallet}
                  className="w-full"
                  size="lg"
                >
                  🔗 In Wallet öffnen
                </Button>

                <Button
                  variant="outline"
                  onClick={() => setInvoice(null)}
                  className="w-full"
                  size="sm"
                >
                  Zurück
                </Button>

                <div className="text-xs text-muted-foreground text-center">
                  Scan den QR-Code oder kopiere die Invoice, um mit jedem Lightning-Wallet zu zahlen.
                </div>
              </div>
            </div>
          ) : (
            <div className="grid gap-3 px-4 py-4 w-full overflow-hidden">
              {/* Preset amounts */}
              <ToggleGroup
                type="single"
                value={String(amount)}
                onValueChange={(value) => {
                  if (value) {
                    setAmount(parseInt(value, 10));
                  }
                }}
                className="grid grid-cols-5 gap-1 w-full"
              >
                {presetAmounts.map(({ amount: presetAmount, icon: Icon }) => (
                  <ToggleGroupItem
                    key={presetAmount}
                    value={String(presetAmount)}
                    className="flex flex-col h-auto min-w-0 text-xs px-1 py-2"
                  >
                    <Icon className="h-4 w-4 mb-1" />
                    <span className="truncate">{presetAmount}</span>
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>

              <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-muted" />
                <span className="text-xs text-muted-foreground">ODER</span>
                <div className="h-px flex-1 bg-muted" />
              </div>

              {/* Custom amount */}
              <Input
                id="custom-amount"
                type="number"
                placeholder="Eigener Betrag"
                value={amount}
                onChange={(e) => setAmount(parseInt(e.target.value, 10) || 0)}
                className="w-full text-sm"
              />

              {/* Comment */}
              <Textarea
                id="custom-comment"
                placeholder="Kommentar hinzufügen (optional)"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full resize-none text-sm"
                rows={2}
              />

              {/* Submit button */}
              <Button
                onClick={createInvoice}
                className="w-full"
                disabled={isCreatingInvoice}
                size="default"
              >
                {isCreatingInvoice ? (
                  'Invoice wird erstellt...'
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Zap {amount} sats
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
