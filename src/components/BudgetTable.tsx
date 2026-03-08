import React, { useState } from 'react';
import { BudgetEntry } from '@/types/budget';
import { formatAmount } from '@/types/budget';
import { getCategoryById, getCategoryName, getCategoryColor, getCategoryIcon } from '@/config/budget';
import { useBudget } from '@/hooks/useBudget';
import { Calendar, Tag, User, Share2, FileImage, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface BudgetTableProps {
  entries: BudgetEntry[];
  isLoading?: boolean;
  onEdit?: (entry: BudgetEntry) => void;
  onDelete?: (entry: BudgetEntry) => void;
}

export function BudgetTable({ entries, isLoading, onEdit, onDelete }: BudgetTableProps) {
  const { formatAmount } = useBudget();
  const [deleteEntry, setDeleteEntry] = useState<BudgetEntry | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getPayerIcon = (payer: 'mojo' | 'susanne') => {
    return payer === 'mojo' ? '👨' : '👩';
  };

  const getPayerColor = (payer: 'mojo' | 'susanne') => {
    return payer === 'mojo' ? 'text-blue-600 bg-blue-50' : 'text-pink-600 bg-pink-50';
  };

  const getPayerName = (payer: 'mojo' | 'susanne') => {
    return payer === 'mojo' ? 'Mojo' : 'Susanne';
  };

  const handleDeleteClick = (entry: BudgetEntry) => {
    setDropdownOpen(null);
    // Kleine Verzögerung damit Dropdown erst schließt
    setTimeout(() => {
      setDeleteEntry(entry);
    }, 100);
  };

  const handleDeleteConfirm = () => {
    if (deleteEntry) {
      onDelete?.(deleteEntry);
      setDeleteEntry(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-6 w-20" />
          </div>
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
          <Calendar className="h-12 w-12" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Keine Einträge gefunden</h3>
        <p className="text-gray-500">
          Füge deine ersten Budget-Einträge hinzu, um sie hier zu sehen.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Datum & Beschreibung
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Kategorie
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Bezahlt von
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Betrag
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Aktionen
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {entries.map((entry) => {
              const isIncome = entry.amount >= 0;
              const category = getCategoryById(entry.category);
              const categoryColor = getCategoryColor(entry.category);
              const payerColor = getPayerColor(entry.payer);
              
              return (
                <tr key={entry.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center ${isIncome ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                          {isIncome ? '➕' : '➖'}
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {entry.description}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatDate(entry.date)}
                          {entry.attachment && (
                            <span className="ml-2 inline-flex items-center text-blue-600">
                              <FileImage className="h-3 w-3 mr-1" />
                              Beleg
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge className={`${categoryColor} font-medium`}>
                      <Tag className="h-3 w-3 mr-1" />
                      {category?.name || getCategoryName(entry.category)}
                    </Badge>
                    {entry.shared && (
                      <Badge variant="outline" className="ml-2">
                        <Share2 className="h-3 w-3 mr-1" />
                        Gemeinschaft
                      </Badge>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge className={`${payerColor} font-medium`}>
                      <User className="h-3 w-3 mr-1" />
                      {getPayerIcon(entry.payer)} {getPayerName(entry.payer)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm font-medium ${isIncome ? 'text-green-600' : 'text-red-600'}`}>
                      {formatAmount(entry.amount, entry.currency)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <DropdownMenu open={dropdownOpen === entry.id} onOpenChange={(open) => setDropdownOpen(open ? entry.id : null)}>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => {
                          setDropdownOpen(null);
                          onEdit?.(entry);
                        }}>
                          <Edit className="h-4 w-4 mr-2" />
                          Bearbeiten
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteClick(entry)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Löschen
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-gray-50">
            <tr>
              <td colSpan={3} className="px-6 py-4 text-right text-sm font-medium text-gray-700">
                Gesamt:
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div className="text-gray-900">
                  {formatAmount(
                    entries.reduce((sum, entry) => sum + entry.amount, 0),
                    entries[0]?.currency || 'EUR'
                  )}
                </div>
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <AlertDialog open={!!deleteEntry} onOpenChange={(open) => !open && setDeleteEntry(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eintrag löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchtest du den Eintrag "{deleteEntry?.description}" wirklich löschen?
              Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700">
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default BudgetTable;
