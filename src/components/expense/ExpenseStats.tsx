/**
 * Expense Statistics Component
 * Shows statistics and charts for expenses
 */

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BarChart3, PieChart, TrendingUp, Calendar } from 'lucide-react';

import {
  EXPENSE_CATEGORIES,
  formatAmount,
  getCategoryById,
  getMonthFromDate,
  getCurrentMonth,
} from '@/config/expenseTypes';
import {
  parseExpenseEvent,
  getCategoryFromTags,
  getDateFromTags,
} from '@/lib/expenseEncryption';

interface ExpenseStatsProps {
  events: any[];
  currentUserPubkey: string;
}

export function ExpenseStats({ events, currentUserPubkey }: ExpenseStatsProps) {
  // Parse all events
  const parsedEvents = useMemo(() => {
    return events.map(event => parseExpenseEvent(event));
  }, [events]);
  
  // Filter valid events
  const validEvents = useMemo(() => {
    return parsedEvents.filter(event => event.isValid);
  }, [parsedEvents]);
  
  // Calculate statistics from public tags
  const stats = useMemo(() => {
    // Group by category
    const byCategory: Record<string, number> = {};
    
    // Group by month
    const byMonth: Record<string, number> = {};
    
    // Total count
    let totalCount = 0;
    
    validEvents.forEach(({ publicData }) => {
      totalCount++;
      
      // Category
      const category = getCategoryFromTags(publicData.tags);
      byCategory[category] = (byCategory[category] || 0) + 1;
      
      // Month
      const date = getDateFromTags(publicData.tags);
      if (date) {
        const month = getMonthFromDate(date);
        byMonth[month] = (byMonth[month] || 0) + 1;
      }
    });
    
    // Find top category
    let topCategory = 'other';
    let topCategoryCount = 0;
    
    Object.entries(byCategory).forEach(([category, count]) => {
      if (count > topCategoryCount) {
        topCategory = category;
        topCategoryCount = count;
      }
    });
    
    // Get months sorted
    const sortedMonths = Object.keys(byMonth).sort().reverse();
    
    return {
      totalCount,
      byCategory,
      byMonth,
      topCategory,
      topCategoryCount,
      sortedMonths,
    };
  }, [validEvents]);
  
  // Calculate category percentages
  const categoryPercentages = useMemo(() => {
    return Object.entries(stats.byCategory).map(([categoryId, count]) => {
      const percentage = (count / stats.totalCount) * 100;
      const category = getCategoryById(categoryId);
      
      return {
        id: categoryId,
        name: category?.name || 'Sonstiges',
        emoji: category?.emoji || '💰',
        color: category?.color || '#94A3B8',
        count,
        percentage: Math.round(percentage * 10) / 10,
      };
    }).sort((a, b) => b.count - a.count);
  }, [stats]);
  
  // Get current month stats
  const currentMonth = getCurrentMonth();
  const currentMonthCount = stats.byMonth[currentMonth] || 0;
  
  // Get month with most expenses
  let busiestMonth = 'Keine Daten';
  let busiestMonthCount = 0;
  
  Object.entries(stats.byMonth).forEach(([month, count]) => {
    if (count > busiestMonthCount) {
      busiestMonth = month;
      busiestMonthCount = count;
    }
  });
  
  // Format month for display
  const formatMonth = (month: string) => {
    try {
      const [year, monthNum] = month.split('-');
      const monthNames = [
        'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
        'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
      ];
      return `${monthNames[parseInt(monthNum) - 1]} ${year}`;
    } catch {
      return month;
    }
  };
  
  // Get top 3 categories
  const topCategories = categoryPercentages.slice(0, 3);
  
  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Gesamtausgaben
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalCount}</div>
            <p className="text-sm text-muted-foreground mt-1">
              Verschiedene Ausgaben erfasst
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Top Kategorie
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold flex items-center gap-2">
              {getCategoryById(stats.topCategory)?.emoji || '💰'}
              <span>{getCategoryById(stats.topCategory)?.name || 'Sonstiges'}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {stats.topCategoryCount} Ausgaben ({Math.round((stats.topCategoryCount / stats.totalCount) * 100)}%)
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Aktueller Monat
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{currentMonthCount}</div>
            <p className="text-sm text-muted-foreground mt-1">
              {formatMonth(currentMonth)}
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Detailed Statistics */}
      <Tabs defaultValue="categories">
        <TabsList>
          <TabsTrigger value="categories">Nach Kategorie</TabsTrigger>
          <TabsTrigger value="timeline">Zeitverlauf</TabsTrigger>
          <TabsTrigger value="insights">Einblicke</TabsTrigger>
        </TabsList>
        
        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Verteilung nach Kategorie</CardTitle>
              <CardDescription>
                Wie sich die Ausgaben auf die Kategorien verteilen
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {categoryPercentages.map((cat) => (
                  <div key={cat.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span>{cat.emoji}</span>
                        <span className="font-medium">{cat.name}</span>
                        <Badge variant="outline">{cat.count}</Badge>
                      </div>
                      <span className="text-sm font-medium">{cat.percentage}%</span>
                    </div>
                    <Progress value={cat.percentage} className="h-2" />
                    <div
                      className="h-1 rounded-full"
                      style={{
                        backgroundColor: cat.color,
                        opacity: 0.7,
                        width: `${cat.percentage}%`,
                      }}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          {/* Top Categories Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {topCategories.map((cat, index) => (
              <Card key={cat.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">
                    {index === 0 && '🥇 '}
                    {index === 1 && '🥈 '}
                    {index === 2 && '🥉 '}
                    {cat.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{cat.count} Ausgaben</div>
                  <div className="flex items-center gap-2 mt-2">
                    <div
                      className="h-2 rounded-full flex-1"
                      style={{
                        backgroundColor: cat.color,
                        opacity: 0.3,
                      }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{
                          backgroundColor: cat.color,
                          width: `${cat.percentage}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {cat.percentage}%
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        {/* Timeline Tab */}
        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle>Zeitverlauf</CardTitle>
              <CardDescription>
                Ausgaben über die letzten Monate
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats.sortedMonths.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Keine monatlichen Daten verfügbar</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {stats.sortedMonths.slice(0, 6).map((month) => {
                    const count = stats.byMonth[month];
                    const maxCount = Math.max(...Object.values(stats.byMonth));
                    const percentage = (count / maxCount) * 100;
                    
                    return (
                      <div key={month} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{formatMonth(month)}</span>
                            <Badge variant="outline">{count} Ausgaben</Badge>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {Math.round(percentage)}% vom Maximum
                          </span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
                  
                  {/* Busiest Month Highlight */}
                  {busiestMonthCount > 0 && (
                    <div className="mt-6 p-4 rounded-lg bg-primary/10 border border-primary/20">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="h-5 w-5 text-primary" />
                        <span className="font-semibold">Aktivster Monat</span>
                      </div>
                      <p className="text-sm">
                        <span className="font-medium">{formatMonth(busiestMonth)}</span> war mit{' '}
                        <span className="font-medium">{busiestMonthCount} Ausgaben</span> der aktivste Monat.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Insights Tab */}
        <TabsContent value="insights">
          <Card>
            <CardHeader>
              <CardTitle>Einblicke & Muster</CardTitle>
              <CardDescription>
                Erkenntnisse aus den Ausgabendaten
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Insight 1: Category Diversity */}
                <div className="p-4 rounded-lg bg-secondary/50">
                  <h4 className="font-semibold mb-2">Kategorie-Vielfalt</h4>
                  <p className="text-sm text-muted-foreground">
                    {categoryPercentages.length} verschiedene Kategorien genutzt.
                    {categoryPercentages.length >= 8 && ' Gute Ausgewogenheit!'}
                    {categoryPercentages.length < 5 && ' Konzentration auf wenige Kategorien.'}
                  </p>
                </div>
                
                {/* Insight 2: Monthly Consistency */}
                <div className="p-4 rounded-lg bg-secondary/50">
                  <h4 className="font-semibold mb-2">Monatliche Konsistenz</h4>
                  <p className="text-sm text-muted-foreground">
                    {stats.sortedMonths.length} Monate mit Daten.
                    {stats.sortedMonths.length >= 3 && ' Gute historische Datengrundlage.'}
                    {stats.sortedMonths.length < 2 && ' Mehr Daten über Zeit werden benötigt.'}
                  </p>
                </div>
                
                {/* Insight 3: Top Category */}
                <div className="p-4 rounded-lg bg-secondary/50">
                  <h4 className="font-semibold mb-2">Hauptausgabeposten</h4>
                  <p className="text-sm text-muted-foreground">
                    {getCategoryById(stats.topCategory)?.name || 'Sonstiges'} ist mit{' '}
                    {stats.topCategoryCount} Ausgaben ({Math.round((stats.topCategoryCount / stats.totalCount) * 100)}%){' '}
                    der größte Ausgabenblock.
                  </p>
                </div>
                
                {/* Data Quality Note */}
                <div className="mt-6 p-4 rounded-lg bg-muted/50">
                  <p className="text-sm">
                    <span className="font-medium">Hinweis:</span> Diese Statistiken basieren auf{' '}
                    <span className="font-medium">öffentlichen Metadaten</span> (Monat, Hauptkategorie).
                    Für detaillierte Analysen müssen Ausgaben entschlüsselt werden.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Zusammenfassung</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.totalCount}</div>
              <div className="text-sm text-muted-foreground">Gesamt</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold">{categoryPercentages.length}</div>
              <div className="text-sm text-muted-foreground">Kategorien</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.sortedMonths.length}</div>
              <div className="text-sm text-muted-foreground">Monate</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold">{Math.round(stats.totalCount / Math.max(stats.sortedMonths.length, 1))}</div>
              <div className="text-sm text-muted-foreground">Durchschn./Monat</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Loading skeleton
export function ExpenseStatsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">
                <div className="h-5 w-32 bg-muted rounded animate-pulse" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-muted rounded animate-pulse mb-2" />
              <div className="h-4 w-24 bg-muted rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>
            <div className="h-6 w-48 bg-muted rounded animate-pulse" />
          </CardTitle>
          <CardDescription>
            <div className="h-4 w-64 bg-muted rounded animate-pulse" />
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="h-4 w-32 bg-muted rounded animate-pulse" />
                  <div className="h-4 w-16 bg-muted rounded animate-pulse" />
                </div>
                <div className="h-2 w-full bg-muted rounded animate-pulse" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}