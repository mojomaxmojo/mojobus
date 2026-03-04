/**
 * Haushaltsbuch Seite
 * 
 * Verwaltet Einnahmen und Ausgaben für beide Autoren
 * - Übersicht mit Monatsansicht
 * - Budget-Tracking pro Kategorie
 * - Statistiken und Diagramme
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useBudget } from '@/hooks/useBudget';
import { BUDGET_CATEGORIES } from '@/config/budgetCategories';
import { DEFAULT_BUDGET_LIMITS } from '@/config/budgetLimits';
import { 
  ChevronLeft, ChevronRight, Plus, Download, Settings, 
  TrendingUp, TrendingDown, Wallet, Loader2
} from '@/lib/icons';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

// ============================================================================
// MONATS-NAME HELPER
// ============================================================================

const getMonthName = (month: number): string => {
  const date = new Date(2024, month - 1, 1);
  return format(date, 'MMMM yyyy', { locale: de });
};

// ============================================================================
// HAUSHALTSBUCH SEITE
// ============================================================================

export default function Haushaltsbuch() {
  const {
    transactions,
    currentMonth,
    stats,
    isLoading,
    isSaving,
    addTransaction,
    goToPreviousMonth,
    goToNextMonth,
    getCategoryById,
    getCategoryUsage,
    exportToCSV
  } = useBudget();

  // State für Dialog
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [transactionType, setTransactionType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleSaveTransaction = async () => {
    if (!amount || !category || !date) {
      return;
    }

    try {
      await addTransaction({
        type: transactionType,
        amount: parseFloat(amount),
        category,
        description,
        date,
        currency: 'EUR'
      });

      // Reset form
      setAmount('');
      setCategory('');
      setDescription('');
      setDate(new Date().toISOString().split('T')[0]);
      setShowAddDialog(false);
    } catch (error) {
      console.error('Save failed:', error);
    }
  };

  const handleExportCSV = () => {
    const csv = exportToCSV();
    if (!csv) {
      alert('Keine Daten zum Exportieren');
      return;
    }

    // Download CSV
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `haushaltsbuch-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-ocean-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            💰 Haushaltsbuch
          </h1>
          <p className="text-muted-foreground">
            Geteiltes Budget für Mojo & Susanne
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={() => setShowSettingsDialog(true)}>
            <Settings className="h-4 w-4 mr-2" />
            Einstellungen
          </Button>
        </div>
      </div>

      {/* Letzte Buchungen - GANZ OBEN */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">📋 Letzte Buchungen</CardTitle>
              <CardDescription>
                Die letzten 5 Einträge
              </CardDescription>
            </div>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Neue
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {currentMonth?.transactions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Noch keine Buchungen in diesem Monat
            </p>
          ) : (
            <div className="space-y-2">
              {currentMonth?.transactions.slice(0, 5).map(transaction => {
                const category = getCategoryById(transaction.category, transaction.type);
                
                return (
                  <div 
                    key={transaction.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{category?.icon}</span>
                      <div>
                        <p className="font-medium">{transaction.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(transaction.date), 'dd.MM.yyyy')}
                        </p>
                      </div>
                    </div>
                    <div className={`text-right font-bold ${
                      transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'income' ? '+' : '-'}{transaction.amount.toFixed(2)} €
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Monats-Navigation */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={goToPreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-center">
              <CardTitle>{currentMonth ? getMonthName(currentMonth.month) : 'Laden...'}</CardTitle>
              <CardDescription>
                {currentMonth?.year}
              </CardDescription>
            </div>
            <Button variant="ghost" onClick={goToNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Übersicht: Einnahmen, Ausgaben, Saldo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Einnahmen */}
            <div className="bg-green-50 dark:bg-green-950 rounded-lg p-4 border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <TrendingUp className="h-5 w-5" />
                <span className="font-medium">Einnahmen</span>
              </div>
              <p className="text-2xl font-bold text-green-700 dark:text-green-300 mt-2">
                +{currentMonth?.totalIncome.toFixed(2) || '0.00'} €
              </p>
            </div>

            {/* Ausgaben */}
            <div className="bg-red-50 dark:bg-red-950 rounded-lg p-4 border border-red-200 dark:border-red-800">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <TrendingDown className="h-5 w-5" />
                <span className="font-medium">Ausgaben</span>
              </div>
              <p className="text-2xl font-bold text-red-700 dark:text-red-300 mt-2">
                -{currentMonth?.totalExpense.toFixed(2) || '0.00'} €
              </p>
            </div>

            {/* Saldo */}
            <div className={`rounded-lg p-4 border ${
              (currentMonth?.balance ?? 0) >= 0 
                ? 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800' 
                : 'bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800'
            }`}>
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                <Wallet className="h-5 w-5" />
                <span className="font-medium">Saldo</span>
              </div>
              <p className={`text-2xl font-bold mt-2 ${
                (currentMonth?.balance ?? 0) >= 0 
                  ? 'text-blue-700 dark:text-blue-300' 
                  : 'text-orange-700 dark:text-orange-300'
              }`}>
                {(currentMonth?.balance ?? 0) >= 0 ? '+' : ''}{currentMonth?.balance.toFixed(2) || '0.00'} €
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Budget-Fortschritt & Statistiken */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Budget-Fortschritt */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">📊 Budget-Fortschritt</CardTitle>
            <CardDescription>
              Monatliche Limits pro Kategorie
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {DEFAULT_BUDGET_LIMITS.categories.slice(0, 5).map(limitConfig => {
              const category = getCategoryById(limitConfig.categoryId, 'expense');
              const usage = getCategoryUsage(limitConfig.categoryId);
              
              if (!category) return null;

              return (
                <div key={limitConfig.categoryId} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span>{category.icon}</span>
                      <span className="font-medium">{category.label}</span>
                    </div>
                    <div className="text-sm">
                      <span className={usage?.isOverBudget ? 'text-red-600 font-bold' : ''}>
                        {usage?.percentage || 0}%
                      </span>
                      <span className="text-muted-foreground">
                        {' '}({limitConfig.limit}€)
                      </span>
                    </div>
                  </div>
                  <Progress 
                    value={Math.min(usage?.percentage || 0, 100)}
                    className={`h-2 ${
                      usage?.status === 'danger' ? 'bg-red-100' : 
                      usage?.status === 'warning' ? 'bg-yellow-100' : 'bg-gray-100'
                    }`}
                  />
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Statistiken */}
        {stats && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">📈 Statistiken</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Tagesdurchschnitt (Ausgaben)</p>
                  <p className="text-2xl font-bold">{stats.dailyAverage.expense.toFixed(2)} €</p>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Tagesdurchschnitt (Einnahmen)</p>
                  <p className="text-2xl font-bold">{stats.dailyAverage.income.toFixed(2)} €</p>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Sparquote</p>
                  <p className="text-2xl font-bold">
                    {stats.totalIncome > 0 
                      ? Math.round((stats.balance / stats.totalIncome) * 100) 
                      : 0}%
                  </p>
                </div>
              </div>

              {/* Top Kategorien */}
              {stats.topExpenses.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-medium mb-3">🏆 Top Ausgaben-Kategorien</h4>
                  <div className="space-y-2">
                    {stats.topExpenses.map((item, index) => {
                      const category = getCategoryById(item.category, 'expense');
                      const percentage = stats.byCategory[item.category]?.percentage || 0;
                      
                      return (
                        <div key={item.category} className="flex items-center gap-3">
                          <span className="font-bold text-lg text-muted-foreground w-6">
                            {index + 1}.
                          </span>
                          <span className="text-xl">{category?.icon}</span>
                          <span className="flex-1">{category?.label}</span>
                          <span className="font-medium">{item.total.toFixed(2)} €</span>
                          <Badge variant="secondary">{percentage}%</Badge>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Neue Buchung Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>➕ Neue Buchung</DialogTitle>
            <DialogDescription>
              Erfasse eine neue Einnahme oder Ausgabe
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Typ-Auswahl */}
            <div className="flex gap-2">
              <Button
                variant={transactionType === 'income' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => {
                  setTransactionType('income');
                  setCategory('');
                }}
              >
                💰 Einnahme
              </Button>
              <Button
                variant={transactionType === 'expense' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => {
                  setTransactionType('expense');
                  setCategory('');
                }}
              >
                💸 Ausgabe
              </Button>
            </div>

            {/* Betrag */}
            <div className="space-y-2">
              <Label htmlFor="amount">Betrag (€)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            {/* Kategorie */}
            <div className="space-y-2">
              <Label>Kategorie</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Kategorie wählen" />
                </SelectTrigger>
                <SelectContent className="z-[9999]" position="popper" sideOffset={5}>
                  {BUDGET_CATEGORIES[transactionType].map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.icon} {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Beschreibung */}
            <div className="space-y-2">
              <Label htmlFor="description">Beschreibung</Label>
              <Textarea
                id="description"
                placeholder="z.B. REWE Einkauf, Tankstelle Shell..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>

            {/* Datum */}
            <div className="space-y-2">
              <Label htmlFor="date">Datum</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-2 pt-4">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setShowAddDialog(false)}
              >
                Abbrechen
              </Button>
              <Button 
                className="flex-1"
                onClick={handleSaveTransaction}
                disabled={!amount || !category || isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Speichert...
                  </>
                ) : (
                  '💾 Speichern'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Einstellungen Dialog */}
      <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>⚙️ Haushaltsbuch-Einstellungen</DialogTitle>
            <DialogDescription>
              Budget-Limits pro Kategorie festlegen
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-3">
              {DEFAULT_BUDGET_LIMITS.categories.map(limitConfig => {
                const category = getCategoryById(limitConfig.categoryId, 'expense');
                if (!category) return null;

                return (
                  <div 
                    key={limitConfig.categoryId} 
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{category.icon}</span>
                      <div>
                        <p className="font-medium">{category.label}</p>
                        <p className="text-sm text-muted-foreground">
                          Warnung bei {limitConfig.warningThreshold}%
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        className="w-24"
                        value={limitConfig.limit}
                        disabled
                      />
                      <span className="text-sm text-muted-foreground">€</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                💡 Die Budget-Limits können in einer zukünftigen Version angepasst werden. 
                Aktuell werden die Standard-Werte verwendet.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSettingsDialog(false)}>
              Schließen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
