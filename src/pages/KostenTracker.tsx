/**
 * Kosten Tracker - Main Dashboard
 *
 * Private cost tracking for Vanlife expenses
 * Only visible to Mojo and Susanne (encrypted via NIP-44)
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Skeleton } from '@/components/ui/skeleton';
import { useCostTracker } from '@/hooks/useCostTracker';
import { COST_CATEGORIES, type CostCategoryId } from '@/types/costs';
import { Plus, RefreshCw, Wallet, TrendingUp, Calendar, BarChart3, MapPin } from '@/lib/icons';
import { useHead } from '@unhead/react';

export default function KostenTracker() {
  const { entries, isLoading, error, refetch, monthlyStats, categoryStats } = useCostTracker();
  const [selectedCategory, setSelectedCategory] = useState<CostCategoryId | 'all'>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

  // SEO Meta Tags
  useHead({
    title: '💰 Kosten-Tracker - MojoBus',
    meta: [
      { name: 'robots', content: 'noindex, nofollow' }, // Private page
    ]
  });

  // Calculate totals
  const totalExpenses = entries.reduce((sum, entry) => sum + entry.amount, 0);
  const currentMonth = new Date().toLocaleString('de-DE', { month: 'long', year: 'numeric' });

  // Filter entries
  const filteredEntries = entries.filter(entry => {
    if (selectedCategory !== 'all' && entry.category !== selectedCategory) return false;
    if (selectedMonth !== 'all') {
      const entryDate = new Date(entry.createdAt * 1000).toLocaleString('de-DE', { month: '2-digit', year: 'numeric' });
      if (entryDate !== selectedMonth) return false;
    }
    return true;
  });

  // Get unique months
  const uniqueMonths = Array.from(new Set(
    entries.map(entry => new Date(entry.createdAt * 1000).toLocaleString('de-DE', { month: '2-digit', year: 'numeric' }))
  )).reverse();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Lade Kosten-Tracker..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="border-dashed">
          <CardContent className="py-12 px-8 text-center">
            <Wallet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Fehler beim Laden</h3>
            <p className="text-muted-foreground mb-4">Die Kosten konnten nicht geladen werden.</p>
            <Button onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Neu laden
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      {/* Page Header */}
      <section className="relative py-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-accent/20 to-background" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/40 to-background" />

        <div className="relative z-10 container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-4xl md:text-6xl font-bold">
                <span className="gradient-text">💰 Kosten-Tracker</span>
              </h1>
              <p className="text-xl text-muted-foreground">
                Private Ausgabenübersicht für Vanlife
              </p>
            </div>

            <Link to="/artikel/rvlife/kosten/neu">
              <Button size="lg" className="gap-2">
                <Plus className="w-5 h-5" />
                Neue Ausgabe
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 pb-8 space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gesamtausgaben</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">€{totalExpenses.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">{entries.length} Einträge</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aktueller Monat</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {monthlyStats[0] ? `€${monthlyStats[0].total.toFixed(2)}` : '€0.00'}
              </div>
              <p className="text-xs text-muted-foreground">{currentMonth}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ø pro Tag</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                €{entries.length > 0 ? (totalExpenses / 30).toFixed(2) : '0.00'}
              </div>
              <p className="text-xs text-muted-foreground">Schätzung (30 Tage)</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Top-Kategorie</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {categoryStats[0] ? `${COST_CATEGORIES[categoryStats[0].category].emoji} ${COST_CATEGORIES[categoryStats[0].category].name}` : '-'}
              </div>
              <p className="text-xs text-muted-foreground">
                {categoryStats[0] ? `${categoryStats[0].percentage.toFixed(1)}%` : '0%'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Filter
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <label className="text-sm font-medium mb-2 block">Kategorie</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value as any)}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="all">Alle Kategorien</option>
                  {Object.entries(COST_CATEGORIES).map(([id, cat]) => (
                    <option key={id} value={id}>{cat.emoji} {cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex-1 min-w-[200px]">
                <label className="text-sm font-medium mb-2 block">Monat</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="all">Alle Monate</option>
                  {uniqueMonths.map(month => (
                    <option key={month} value={month}>{month}</option>
                  ))}
                </select>
              </div>

              <div className="flex-1 min-w-[200px]">
                <label className="text-sm font-medium mb-2 block">Angezeigt</label>
                <div className="p-2 border rounded-md bg-muted">
                  <span className="font-semibold">{filteredEntries.length}</span> Einträge
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Ausgaben nach Kategorien</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {categoryStats.map((stat) => {
                const cat = COST_CATEGORIES[stat.category];
                return (
                  <div key={stat.category} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{cat.emoji}</span>
                        <div>
                          <div className="font-medium">{cat.name}</div>
                          <div className="text-sm text-muted-foreground">{stat.count} Einträge</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">€{stat.total.toFixed(2)}</div>
                        <div className="text-sm text-muted-foreground">{stat.percentage.toFixed(1)}%</div>
                      </div>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${stat.percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recent Entries */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Ausgabenübersicht</span>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredEntries.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Wallet className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Keine Ausgaben gefunden</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredEntries.map((entry) => {
                  const cat = COST_CATEGORIES[entry.category];
                  return (
                    <div key={entry.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="text-3xl">{cat.emoji}</div>
                        <div>
                          <div className="font-semibold">{entry.content?.title || 'Ohne Titel'}</div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(entry.createdAt * 1000).toLocaleDateString('de-DE', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric'
                            })}
                            {entry.location && (
                              <>
                                {' • '}
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {entry.location}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-primary">€{entry.amount.toFixed(2)}</div>
                        {entry.content?.description && (
                          <div className="text-sm text-muted-foreground max-w-[200px] truncate">
                            {entry.content.description}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
