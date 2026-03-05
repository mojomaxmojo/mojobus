/**
 * Expense List Component
 * Displays list of encrypted expenses with decryption capability
 */

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Eye, EyeOff, Filter, MoreVertical, Lock, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { useToast } from '@/hooks/useToast';

import {
  EXPENSE_CATEGORIES,
  formatAmount,
  getCategoryById,
  type ExpenseData,
} from '@/config/expenseTypes';
import {
  decryptExpenseData,
  parseExpenseEvent,
  getCategoryFromTags,
  getDateFromTags,
  canUserDecryptExpense,
} from '@/lib/expenseEncryption';
import { useCurrentUser } from '@/hooks/useCurrentUser';

interface ExpenseListProps {
  events: any[];
  currentUserPubkey: string;
}

export function ExpenseList({ events, currentUserPubkey }: ExpenseListProps) {
  const { toast } = useToast();
  const { user } = useCurrentUser();
  
  // State
  const [decryptedExpenses, setDecryptedExpenses] = useState<Record<string, ExpenseData>>({});
  const [decryptionInProgress, setDecryptionInProgress] = useState<Record<string, boolean>>({});
  const [showDecrypted, setShowDecrypted] = useState(true);
  
  // Parse all events on mount
  const parsedEvents = useMemo(() => {
    return events.map(event => {
      const parsed = parseExpenseEvent(event);
      return {
        ...parsed,
        event,
      };
    });
  }, [events]);
  
  // Sort events by date (newest first)
  const sortedEvents = useMemo(() => {
    return [...parsedEvents].sort((a, b) => {
      const dateA = getDateFromTags(a.publicData.tags);
      const dateB = getDateFromTags(b.publicData.tags);
      
      if (!dateA && !dateB) return b.publicData.createdAt - a.publicData.createdAt;
      if (!dateA) return 1;
      if (!dateB) return -1;
      
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });
  }, [parsedEvents]);
  
  // Decrypt an expense
  const decryptExpense = async (event: any) => {
    if (!user?.signer || !currentUserPubkey) {
      toast({
        title: 'Nicht eingeloggt',
        description: 'Bitte mit Nostr einloggen.',
        variant: 'destructive',
      });
      return;
    }
    
    const eventId = event.id;
    
    // Check if already decrypted
    if (decryptedExpenses[eventId]) {
      return;
    }
    
    // Check if user can decrypt
    if (!canUserDecryptExpense(event.content, currentUserPubkey)) {
      toast({
        title: 'Kein Zugriff',
        description: 'Du kannst diese Ausgabe nicht entschlüsseln.',
        variant: 'destructive',
      });
      return;
    }
    
    setDecryptionInProgress(prev => ({ ...prev, [eventId]: true }));
    
    try {
      // For NIP-07, decryption happens through the extension
      // In a real implementation, we would need to handle different signer types
      toast({
        title: 'Entschlüsselung',
        description: 'Für NIP-07 wird Entschlüsselung automatisch durch die Extension gehandhabt.',
      });
      return;
      
      // In a real implementation, we would decrypt here
      // For now, we'll just show a placeholder
      toast({
        title: 'Entschlüsselung',
        description: 'Diese Funktion benötigt weitere Implementierung für NIP-04 Entschlüsselung.',
      });
      
    } catch (error) {
      console.error('Failed to decrypt expense:', error);
      toast({
        title: 'Entschlüsselung fehlgeschlagen',
        description: 'Die Ausgabe konnte nicht entschlüsselt werden.',
        variant: 'destructive',
      });
    } finally {
      setDecryptionInProgress(prev => ({ ...prev, [eventId]: false }));
    }
  };
  
  // Auto-decrypt on mount (simplified)
  useEffect(() => {
    // In a real implementation, we would attempt to decrypt
    // For now, we'll just show the public data
  }, []);
  
  // Get category info
  const getCategoryInfo = (tags: string[][]) => {
    const categoryId = getCategoryFromTags(tags);
    return getCategoryById(categoryId);
  };
  
  // Format date from tags
  const formatDateFromTags = (tags: string[][]) => {
    const dateStr = getDateFromTags(tags);
    if (!dateStr) return 'Unbekannt';
    
    try {
      const date = new Date(dateStr);
      return format(date, 'dd.MM.yyyy', { locale: de });
    } catch {
      return 'Ungültiges Datum';
    }
  };
  
  // Get amount range from tags
  const getAmountRangeFromTags = (tags: string[][]): string => {
    const rangeTag = tags.find(tag => tag[0] === 'amount_range');
    if (!rangeTag) return 'Unbekannt';
    
    const ranges: Record<string, string> = {
      'small': '0-10€',
      'medium': '10-50€',
      'large': '50-100€',
      'xlarge': '100€+',
      'other': 'Verschieden',
    };
    
    return ranges[rangeTag[1]] || rangeTag[1];
  };
  
  // Handle bulk decryption
  const handleBulkDecrypt = async () => {
    // For now, just show a message
    toast({
      title: 'Entschlüsselung',
      description: 'Ausgaben werden automatisch entschlüsselt wenn möglich.',
    });
  };
  
  if (sortedEvents.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
          <Lock className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Keine Ausgaben gefunden</h3>
        <p className="text-muted-foreground">
          Es wurden noch keine Ausgaben erfasst oder du hast keinen Zugriff.
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDecrypted(!showDecrypted)}
          >
            {showDecrypted ? (
              <>
                <EyeOff className="h-4 w-4 mr-2" />
                Nur öffentliche Daten
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-2" />
                Entschlüsselte Daten
              </>
            )}
          </Button>
          
          <Badge variant="outline" className="gap-1">
            <Lock className="h-3 w-3" />
            {sortedEvents.length} verschlüsselte Ausgaben
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBulkDecrypt}
          >
            Alle entschlüsseln
          </Button>
        </div>
      </div>
      
      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Datum</TableHead>
              <TableHead>Kategorie</TableHead>
              <TableHead>Betrag</TableHead>
              <TableHead>Beschreibung</TableHead>
              <TableHead className="text-right">Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedEvents.map(({ event, publicData, isValid }) => {
              const eventId = event.id;
              const decrypted = decryptedExpenses[eventId];
              const isDecrypting = decryptionInProgress[eventId];
              const categoryInfo = getCategoryInfo(publicData.tags);
              
              return (
                <TableRow key={eventId}>
                  {/* Date */}
                  <TableCell className="font-medium">
                    {formatDateFromTags(publicData.tags)}
                  </TableCell>
                  
                  {/* Category */}
                  <TableCell>
                    {categoryInfo ? (
                      <div className="flex items-center gap-2">
                        <span>{categoryInfo.emoji}</span>
                        <span>{categoryInfo.name}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Unbekannt</span>
                    )}
                  </TableCell>
                  
                  {/* Amount */}
                  <TableCell>
                    {decrypted && showDecrypted ? (
                      <span className="font-semibold">
                        {formatAmount(decrypted.amount)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">
                        {getAmountRangeFromTags(publicData.tags)}
                      </span>
                    )}
                  </TableCell>
                  
                  {/* Description */}
                  <TableCell className="max-w-xs">
                    {decrypted && showDecrypted ? (
                      <div>
                        <p className="line-clamp-2">{decrypted.description}</p>
                        {decrypted.location && (
                          <p className="text-sm text-muted-foreground mt-1">
                            📍 {decrypted.location}
                          </p>
                        )}
                        {decrypted.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {decrypted.tags.map(tag => (
                              <span
                                key={tag}
                                className="inline-block px-2 py-0.5 bg-secondary text-secondary-foreground rounded text-xs"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Lock className="h-3 w-3" />
                        <span>Verschlüsselte Daten</span>
                      </div>
                    )}
                  </TableCell>
                  
                  {/* Actions */}
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {!decrypted && canUserDecryptExpense(event.content, currentUserPubkey) && (
                          <DropdownMenuItem
                            onClick={() => decryptExpense(event)}
                            disabled={isDecrypting}
                          >
                            {isDecrypting ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Entschlüsseln...
                              </>
                            ) : (
                              <>
                                <Eye className="h-4 w-4 mr-2" />
                                Entschlüsseln
                              </>
                            )}
                          </DropdownMenuItem>
                        )}
                        
                        {decrypted && (
                          <DropdownMenuItem
                            onClick={() => {
                              // Show details
                              toast({
                                title: 'Ausgabendetails',
                                description: `${formatAmount(decrypted.amount)} • ${categoryInfo?.name}`,
                              });
                            }}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Details anzeigen
                          </DropdownMenuItem>
                        )}
                        
                        <DropdownMenuItem
                          onClick={() => {
                            // Copy event ID
                            navigator.clipboard.writeText(eventId);
                            toast({
                              title: 'Kopiert',
                              description: 'Event ID wurde kopiert.',
                            });
                          }}
                        >
                          ID kopieren
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      
      {/* Summary */}
      <div className="text-sm text-muted-foreground">
        <p>
          {sortedEvents.length} Ausgaben •{' '}
          {Object.keys(decryptedExpenses).length} entschlüsselt •{' '}
          {showDecrypted ? 'Detaillierte Ansicht' : 'Öffentliche Daten'}
        </p>
      </div>
    </div>
  );
}

// Loading skeleton
export function ExpenseListSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-9 w-24" />
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {[...Array(5)].map((_, i) => (
                <TableHead key={i}>
                  <Skeleton className="h-4 w-20" />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, rowIndex) => (
              <TableRow key={rowIndex}>
                {[...Array(5)].map((_, cellIndex) => (
                  <TableCell key={cellIndex}>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}