import React from 'react';
import { BudgetStats as BudgetStatsType } from '@/types/budget';
import { useBudget } from '@/hooks/useBudget';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TrendingDown, PiggyBank, Calendar } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface BudgetOverviewProps {
  stats: BudgetStatsType;
  monthlyBudget?: number;
  isLoading?: boolean;
  entryCount?: number;
}

export function BudgetOverview({ stats, monthlyBudget, isLoading, entryCount }: BudgetOverviewProps) {
  const { formatAmount } = useBudget();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const budgetUsage = monthlyBudget ? (stats.totalExpenses / monthlyBudget) * 100 : 0;
  const remainingBudget = monthlyBudget ? monthlyBudget - stats.totalExpenses : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Ausgaben */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center">
            <TrendingDown className="h-4 w-4 mr-2" />
            Ausgaben
          </CardTitle>
          <CardDescription>Gesamtausgaben diesen Monat</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            {formatAmount(stats.totalExpenses, 'EUR')}
          </div>
          {monthlyBudget && (
            <div className="text-sm text-gray-500 mt-1">
              {budgetUsage.toFixed(1)}% des Budgets
            </div>
          )}
        </CardContent>
      </Card>

      {/* Restbudget */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center">
            <PiggyBank className="h-4 w-4 mr-2" />
            Restbudget
          </CardTitle>
          <CardDescription>Noch verfügbar</CardDescription>
        </CardHeader>
        <CardContent>
          {monthlyBudget ? (
            <>
              <div className={`text-2xl font-bold ${remainingBudget >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatAmount(remainingBudget, 'EUR')}
              </div>
              <div className="mt-2">
                <Progress value={Math.min(budgetUsage, 100)} className="h-2" />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>{formatAmount(stats.totalExpenses, 'EUR')}</span>
                  <span>{formatAmount(monthlyBudget, 'EUR')}</span>
                </div>
              </div>
            </>
          ) : (
            <div className="text-lg font-medium text-gray-500">
              Kein Budget festgelegt
            </div>
          )}
        </CardContent>
      </Card>

      {/* Einträge */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center">
            <Calendar className="h-4 w-4 mr-2" />
            Einträge
          </CardTitle>
          <CardDescription>Diesen Monat</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {entryCount ?? 0}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            Transaktionen
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default BudgetOverview;
