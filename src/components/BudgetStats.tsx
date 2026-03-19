import React, { useState, useMemo } from 'react';
import { BudgetStats as BudgetStatsType, BudgetEntry } from '@/types/budget';
import { useBudget } from '@/hooks/useBudget';
import { getCategoryById, getCategoryName, getCategoryColor } from '@/config/budget';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart3 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { FuelConsumptionStats } from '@/components/FuelConsumptionStats';

interface BudgetStatsProps {
  stats: BudgetStatsType;
  isLoading?: boolean;
  allEntries?: BudgetEntry[];
}

const MONTHS_SHORT = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];

export function BudgetStats({ stats, isLoading, allEntries }: BudgetStatsProps) {
  const { formatAmount } = useBudget();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Verfügbare Jahre aus den Einträgen extrahieren
  const availableYears = useMemo(() => {
    if (!allEntries || allEntries.length === 0) {
      return [new Date().getFullYear()];
    }
    const years = new Set(allEntries.map(e => new Date(e.date * 1000).getFullYear()));
    return Array.from(years).sort((a, b) => b - a);
  }, [allEntries]);

  // Monatliche Daten für das ausgewählte Jahr berechnen
  const monthlyData = useMemo(() => {
    const data: Array<{ month: number; expenses: number; entries: number }> = [];
    
    for (let month = 0; month < 12; month++) {
      const monthEntries = allEntries?.filter(e => {
        const date = new Date(e.date * 1000);
        return date.getFullYear() === selectedYear && date.getMonth() === month;
      }) || [];
      
      const expenses = monthEntries
        .filter(e => e.category !== 'gesundheit')
        .reduce((sum, e) => sum + Math.abs(e.amount), 0);
      
      data.push({
        month,
        expenses,
        entries: monthEntries.length,
      });
    }
    
    return data;
  }, [allEntries, selectedYear]);

  // Maximaler Wert für Skalierung
  const maxExpenses = useMemo(() => {
    return Math.max(...monthlyData.map(d => d.expenses), 1);
  }, [monthlyData]);

  // Jahres-Summen
  const yearTotal = useMemo(() => {
    return monthlyData.reduce((sum, d) => sum + d.expenses, 0);
  }, [monthlyData]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Top-Kategorien sortieren
  const topCategories = Object.entries(stats.categoryBreakdown)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Monatliches Balkendiagramm - VERTIKAL */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Monatliche Ausgaben
              </CardTitle>
              <CardDescription>
                Ausgaben pro Monat für {selectedYear} — Gesamt: {formatAmount(yearTotal, 'EUR')}
              </CardDescription>
            </div>
            <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableYears.map(year => (
                  <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {/* Vertikales Säulendiagramm */}
          <div className="relative h-64 flex items-end justify-between gap-1 pt-4">
            {monthlyData.map((data, index) => {
              const percentage = (data.expenses / maxExpenses) * 100;
              const isCurrentMonth = new Date().getFullYear() === selectedYear && index === new Date().getMonth();
              
              return (
                <div key={index} className="flex-1 flex flex-col items-center h-full justify-end">
                  {/* Betrag über dem Balken */}
                  <div className={`text-xs font-bold mb-1 ${data.expenses > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                    {data.expenses > 0 ? formatAmount(data.expenses, 'EUR').replace('€', '') : '-'}
                  </div>
                  
                  {/* Der Balken */}
                  <div 
                    className={`w-full rounded-t transition-all duration-300 min-h-[4px] ${isCurrentMonth ? 'bg-blue-500' : 'bg-red-400'}`}
                    style={{ height: `${Math.max(percentage, 2)}%` }}
                    title={`${MONTHS_SHORT[index]}: ${formatAmount(data.expenses, 'EUR')} (${data.entries} Einträge)`}
                  />
                  
                  {/* Monatsname */}
                  <div className={`text-xs mt-2 text-center ${isCurrentMonth ? 'font-bold text-blue-700' : 'text-gray-600'}`}>
                    {MONTHS_SHORT[index]}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Top-Kategorien */}
      {topCategories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Top Ausgaben-Kategorien
            </CardTitle>
            <CardDescription>
              Die meisten Ausgaben nach Kategorie
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topCategories.map(([categoryId, amount]) => {
                const category = getCategoryById(categoryId);
                const categoryColor = getCategoryColor(categoryId);
                const percentage = (amount / stats.totalExpenses) * 100;
                
                return (
                  <div key={categoryId} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-2 ${categoryColor.split(' ')[1]}`} />
                        <span className="font-medium">{category?.name || getCategoryName(categoryId)}</span>
                      </div>
                      <div className="font-medium">
                        {formatAmount(amount, 'EUR')}
                        <span className="ml-2 text-gray-500">
                          ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Kraftstoffverbrauch */}
      <FuelConsumptionStats allEntries={allEntries} />
    </div>
  );
}

export default BudgetStats;
