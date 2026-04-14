import React, { useState } from 'react';
import { AFAEntry } from '@/types/budget';
import { getCategoryName, getCategoryColor } from '@/config/budget';
import { Calendar, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { Skeleton } from '@/components/ui/skeleton';

interface AFATableProps {
  entries: AFAEntry[];
  isLoading?: boolean;
  onEdit?: (entry: AFAEntry) => void;
  onDelete?: (entry: AFAEntry) => void;
}

export function AFATable({ entries, isLoading, onEdit, onDelete }: AFATableProps) {
  const [deleteEntry, setDeleteEntry] = useState<AFAEntry | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
    }).format(amount / 100);
  };

  const getEndDate = (entry: AFAEntry) => {
    const startDate = new Date(entry.date * 1000);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + entry.months);
    return endDate.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const handleDeleteClick = (entry: AFAEntry) => {
    setDropdownOpen(null);
    setTimeout(() => setDeleteEntry(entry), 100);
  };

  const handleDeleteConfirm = () => {
    if (deleteEntry) {
      onDelete?.(deleteEntry);
      setDeleteEntry(null);
    }
  };

  // Berechne verbleibende Monate für einen Eintrag
  const getRemainingMonths = (entry: AFAEntry) => {
    const startDate = new Date(entry.date * 1000);
    const now = new Date();
    const monthsPassed = (now.getFullYear() - startDate.getFullYear()) * 12 + (now.getMonth() - startDate.getMonth());
    const remaining = entry.months - monthsPassed;
    return Math.max(0, remaining);
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
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
        <h3 className="text-lg font-medium text-gray-900 mb-2">Keine AFA-Einträge</h3>
        <p className="text-gray-500">
          Füge deine erste Abschreibung hinzu, um sie hier zu sehen.
        </p>
      </div>
    );
  }

  const totalMonthly = entries.reduce((sum, e) => sum + e.amount / e.months, 0);
  const totalAmount = entries.reduce((sum, e) => sum + e.amount, 0);

  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Datum & Beschreibung
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Kategorie
              </th>
              <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Gesamtbetrag
              </th>
              <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Monate
              </th>
              <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                / Monat
              </th>
              <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Verbleibend
              </th>
              <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Aktionen
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {entries.map((entry) => {
              const monthlyAmount = entry.amount / entry.months;
              const remaining = getRemainingMonths(entry);
              const categoryColor = getCategoryColor(entry.category);

              return (
                <tr key={entry.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 max-w-xs">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {entry.description}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatDate(entry.date)} – {getEndDate(entry)}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <Badge className={`${categoryColor} font-medium`}>
                      {getCategoryName(entry.category)}
                    </Badge>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {formatAmount(entry.amount)}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-center">
                    <span className="text-sm text-gray-700 font-mono">
                      {entry.months}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-right">
                    <div className="text-sm font-semibold text-blue-700">
                      {formatAmount(Math.round(monthlyAmount))}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-center">
                    <span className={`text-sm font-medium ${remaining <= 3 ? 'text-red-600' : 'text-green-600'}`}>
                      {remaining} Mon.
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-right">
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
              <td colSpan={2} className="px-4 py-3 text-right text-sm font-medium text-gray-700">
                Summe ({entries.length} Einträge):
              </td>
              <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                {formatAmount(totalAmount)}
              </td>
              <td></td>
              <td className="px-4 py-3 text-right text-sm font-bold text-blue-700">
                {formatAmount(Math.round(totalMonthly))}
              </td>
              <td></td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <AlertDialog open={!!deleteEntry} onOpenChange={(open) => !open && setDeleteEntry(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>AFA-Eintrag löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchtest du "{deleteEntry?.description}" wirklich löschen?
              Die Abschreibung wird ab dem nächsten Monat nicht mehr berücksichtigt.
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

export default AFATable;
