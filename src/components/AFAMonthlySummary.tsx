import React from 'react';
import { AFAMonthlyRate } from '@/types/budget';
import { getCategoryName, getCategoryIcon, getCategoryColor } from '@/config/budget';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Layers } from 'lucide-react';

interface AFAMonthlySummaryProps {
  total: number;
  details: Array<{
    entry: {
      id: string;
      description: string;
      date: number;
      amount: number;
      months: number;
      category: string;
    };
    monthKey: string;
    monthlyAmount: number;
    isFirstMonth: boolean;
    isLastMonth: boolean;
  }>;
  byCategory: Record<string, number>;
}

export function AFAMonthlySummary({ total, details, byCategory }: AFAMonthlySummaryProps) {
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
    }).format(amount / 100);
  };

  if (details.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center">
          <Layers className="h-4 w-4 mr-2 text-blue-600" />
          Abschreibungen (AFA)
        </CardTitle>
        <CardDescription>
          Monatliche Raten aus abgeschriebenen Anschaffungen
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Gesamtsumme */}
        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
          <span className="font-medium text-blue-900">AFA gesamt</span>
          <span className="text-lg font-bold text-blue-700">
            {formatAmount(Math.round(total))}
          </span>
        </div>

        {/* Aufschlüsselung nach Kategorien */}
        {Object.keys(byCategory).length > 1 && (
          <div>
            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
              Nach Kategorie
            </h4>
            <div className="space-y-1">
              {Object.entries(byCategory)
                .sort((a, b) => b[1] - a[1])
                .map(([catId, amount]) => (
                  <div key={catId} className="flex items-center justify-between py-1">
                    <span className="text-sm">
                      {getCategoryIcon(catId)} {getCategoryName(catId)}
                    </span>
                    <span className="text-sm font-medium text-gray-700">
                      {formatAmount(Math.round(amount))}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Details aller AFA-Einträge */}
        <div>
          <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
            Einzelne Abschreibungen
          </h4>
          <div className="space-y-2">
            {details.map((detail) => (
              <div key={detail.entry.id} className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-lg">{getCategoryIcon(detail.entry.category)}</span>
                  <div className="min-w-0">
                    <span className="text-sm font-medium truncate block">
                      {detail.entry.description}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatAmount(detail.entry.amount)} / {detail.entry.months} Mon.
                    </span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                  <span className="text-sm font-semibold text-blue-700">
                    {formatAmount(Math.round(detail.monthlyAmount))}
                  </span>
                  {detail.isFirstMonth && (
                    <Badge variant="secondary" className="ml-1 text-xs">
                      Start
                    </Badge>
                  )}
                  {detail.isLastMonth && (
                    <Badge variant="secondary" className="ml-1 text-xs">
                      Ende
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default AFAMonthlySummary;
