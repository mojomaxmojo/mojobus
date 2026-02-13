/**
 * Export Page - Allows users to export their content as GPX or KMZ
 * For Google Earth Studio and creating professional travel videos
 */

import { useState, useEffect } from 'react';
import { useNostr } from '@nostrify/react';
import { ExportDialog } from '@/components/ExportDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { PageLoader } from '@/components/ui/loading-spinner';
import { MapPin, Download, Globe, FileText, Image as ImageIcon, Filter, Calendar, Loader2, Info } from 'lucide-react';
import type { NostrEvent } from '@nostrify/nostrify';

export default function Export() {
  const { nostr } = useNostr();

  // State with explicit default values
  const [events, setEvents] = useState<NostrEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<NostrEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [exportDialogOpen, setExportDialogOpen] = useState<boolean>(false);

  // Filter options
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['article', 'image', 'note']);
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'year' | 'all'>('all');
  const [countryFilter, setCountryFilter] = useState<string>('');

  // Load events on mount
  useEffect(() => {
    loadEvents();
  }, []);

  // Show loading state while events are loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-cyan-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <Loader2 className="w-16 h-16 text-cyan-600 animate-spin mb-4" />
            <p className="text-xl text-muted-foreground">Lade Inhalte...</p>
          </div>
        </div>
      </div>
    );
  }

  // Load events
  const loadEvents = async () => {
    setLoading(true);
    try {
      const fetchedEvents = await nostr.query([
        {
          kinds: [30023, 30024, 1], // Articles, Stories, Notes
          limit: 1000,
        }
      ]);

      setEvents(fetchedEvents || []);
      setFilteredEvents(fetchedEvents || []);
    } catch (error) {
      console.error('Error loading events:', error);
      console.error('Fehler beim Laden der Inhalte');
    } finally {
      setLoading(false);
    }
  };

  // Filter events
  const applyFilters = () => {
    let filtered = [...events];

    // Filter by type
    const typeMap: Record<number, string> = {
      30023: 'article',
      30024: 'image',
      1: 'note',
    };

    if (selectedTypes.length > 0) {
      filtered = filtered.filter(event =>
        selectedTypes.includes(typeMap[event.kind] || 'note')
      );
    }

    // Filter by date range
    const now = Date.now();
    const ranges = {
      week: 7 * 24 * 60 * 60,
      month: 30 * 24 * 60 * 60,
      year: 365 * 24 * 60 * 60,
    };

    if (dateRange !== 'all') {
      const cutoff = (now - ranges[dateRange]) / 1000;
      filtered = filtered.filter(event => event.created_at >= cutoff);
    }

    // Filter by country (if specified)
    if (countryFilter) {
      filtered = filtered.filter(event => {
        const country = event.tags.find(([name]) => name === 'location')?.[1] || '';
        return country.toLowerCase().includes(countryFilter.toLowerCase());
      });
    }

    // Filter events with GPS data
    filtered = filtered.filter(event => {
      const hasGPS = event.tags.some(([name]) => name === 'g' || name === 'image');
      return hasGPS;
    });

    setFilteredEvents(filtered);
  };

  // Toggle type filter
  const toggleType = (type: string) => {
    if (selectedTypes.includes(type)) {
      setSelectedTypes(selectedTypes.filter(t => t !== type));
    } else {
      setSelectedTypes([...selectedTypes, type]);
    }
  };

  // Calculate stats (only render when not loading)
  const imageCount = filteredEvents ? filteredEvents.reduce((count, event) => {
    return count + event.tags.filter(([name]) => name === 'image').length;
  }, 0) : 0;

  const uniqueLocations = new Set(
    (filteredEvents || [])
      .map(event => event.tags.find(([name]) => name === 'location')?.[1])
      .filter(Boolean)
  ).size;

  const countryCounts = (filteredEvents || []).reduce((acc, event) => {
    const country = event.tags.find(([name]) => name === 'country')?.[1] || 'unbekannt';
    acc[country] = (acc[country] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="min-h-screen bg-gradient-to-b from-cyan-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <Globe className="w-10 h-10 text-cyan-600" />
            Export für Google Earth Studio
          </h1>
          <p className="text-lg text-muted-foreground">
            Exportiere deine Reisen als GPX oder KMZ und erstelle professionelle YouTube-Videos
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-cyan-100 dark:bg-cyan-900 rounded-lg">
                    <FileText className="w-6 h-6 text-cyan-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{filteredEvents?.length || 0}</p>
                    <p className="text-sm text-muted-foreground">Inhalte</p>
                  </div>
                </div>
              </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <ImageIcon className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{imageCount}</p>
                  <p className="text-sm text-muted-foreground">Bilder</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                  <MapPin className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{uniqueLocations}</p>
                  <p className="text-sm text-muted-foreground">Orte</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <Globe className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{Object.keys(countryCounts).length}</p>
                  <p className="text-sm text-muted-foreground">Länder</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filter
            </CardTitle>
            <CardDescription>
              Wähle, welche Inhalte exportiert werden sollen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="types" className="mb-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="types">Typ</TabsTrigger>
                <TabsTrigger value="date">Zeitraum</TabsTrigger>
              </TabsList>

              <TabsContent value="types" className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <Label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-muted">
                    <Checkbox
                      checked={selectedTypes.includes('article')}
                      onCheckedChange={() => toggleType('article')}
                    />
                    <FileText className="w-5 h-5" />
                    <div>
                      <p className="font-medium">Artikel</p>
                      <p className="text-xs text-muted-foreground">Blogs und Guides</p>
                    </div>
                  </Label>

                  <Label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-muted">
                    <Checkbox
                      checked={selectedTypes.includes('image')}
                      onCheckedChange={() => toggleType('image')}
                    />
                    <ImageIcon className="w-5 h-5" />
                    <div>
                      <p className="font-medium">Bilder</p>
                      <p className="text-xs text-muted-foreground">Fotos und Stories</p>
                    </div>
                  </Label>

                  <Label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-muted">
                    <Checkbox
                      checked={selectedTypes.includes('note')}
                      onCheckedChange={() => toggleType('note')}
                    />
                    <FileText className="w-5 h-5" />
                    <div>
                      <p className="font-medium">Notizen</p>
                      <p className="text-xs text-muted-foreground">Kurze Posts</p>
                    </div>
                  </Label>
                </div>
              </TabsContent>

              <TabsContent value="date" className="space-y-4">
                <div className="grid grid-cols-4 gap-4">
                  <Label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-muted">
                    <Checkbox
                      checked={dateRange === 'week'}
                      onCheckedChange={() => setDateRange(dateRange === 'week' ? 'all' : 'week')}
                    />
                    <Calendar className="w-5 h-5" />
                    <div>
                      <p className="font-medium">Letzte Woche</p>
                      <p className="text-xs text-muted-foreground">7 Tage</p>
                    </div>
                  </Label>

                  <Label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-muted">
                    <Checkbox
                      checked={dateRange === 'month'}
                      onCheckedChange={() => setDateRange(dateRange === 'month' ? 'all' : 'month')}
                    />
                    <Calendar className="w-5 h-5" />
                    <div>
                      <p className="font-medium">Letzter Monat</p>
                      <p className="text-xs text-muted-foreground">30 Tage</p>
                    </div>
                  </Label>

                  <Label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-muted">
                    <Checkbox
                      checked={dateRange === 'year'}
                      onCheckedChange={() => setDateRange(dateRange === 'year' ? 'all' : 'year')}
                    />
                    <Calendar className="w-5 h-5" />
                    <div>
                      <p className="font-medium">Letztes Jahr</p>
                      <p className="text-xs text-muted-foreground">365 Tage</p>
                    </div>
                  </Label>

                  <Label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-muted">
                    <Checkbox
                      checked={dateRange === 'all'}
                      onCheckedChange={() => setDateRange('all')}
                    />
                    <Calendar className="w-5 h-5" />
                    <div>
                      <p className="font-medium">Alle Zeiten</p>
                      <p className="text-xs text-muted-foreground">Komplett</p>
                    </div>
                  </Label>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex gap-4">
              <Button
                onClick={applyFilters}
                disabled={loading}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Lade...
                  </>
                ) : (
                  <>
                    <Filter className="mr-2 h-4 w-4" />
                    Filter anwenden
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedTypes(['article', 'image', 'note']);
                  setDateRange('all');
                  setCountryFilter('');
                }}
              >
                Zurücksetzen
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Export Buttons */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5" />
              Exportieren
            </CardTitle>
            <CardDescription>
              Wähle das Export-Format für deine Reise-Visualisierung
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* GPX Export */}
              <div className="border rounded-lg p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-cyan-100 dark:bg-cyan-900 rounded-lg">
                    <FileText className="w-6 h-6 text-cyan-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">GPX Export</h3>
                    <p className="text-sm text-muted-foreground">Für Google Earth Studio</p>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-green-600">Klein</Badge>
                    <span className="text-muted-foreground">~10-100 KB</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Bilder</Badge>
                    <span className="text-muted-foreground">Als Links</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Zeitstempel</Badge>
                    <span className="text-muted-foreground">Inklusive</span>
                  </div>
                </div>

                <Button
                  onClick={() => setExportDialogOpen(true)}
                  disabled={!filteredEvents || filteredEvents.length === 0}
                  className="w-full"
                >
                  <Download className="mr-2 h-4 w-4" />
                  GPX Exportieren
                </Button>
              </div>

              {/* KMZ Export */}
              <div className="border rounded-lg p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                    <Globe className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">KMZ Export</h3>
                    <p className="text-sm text-muted-foreground">Für Google Earth Pro</p>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-yellow-600">Mittel</Badge>
                    <span className="text-muted-foreground">~10-50 MB</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Bilder</Badge>
                    <span className="text-muted-foreground">Lokal heruntergeladen</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">3D-Terrain</Badge>
                    <span className="text-muted-foreground">Google Earth Pro</span>
                  </div>
                </div>

                <Button
                  onClick={() => setExportDialogOpen(true)}
                  disabled={!filteredEvents || filteredEvents.length === 0}
                  variant="outline"
                  className="w-full"
                >
                  <Download className="mr-2 h-4 w-4" />
                  KMZ Exportieren
                </Button>
              </div>
            </div>

            {!filteredEvents || filteredEvents.length === 0 && (
              <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-yellow-800 dark:text-yellow-200">Keine Inhalte mit GPS-Daten gefunden</p>
                    <p className="text-yellow-700 dark:text-yellow-300 mt-1">
                      Es wurden keine Inhalte mit Geokoordinaten gefunden. Du musst erst Fotos mit GPS-Informationen hochladen.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>Wie erstellt man Videos aus GPX?</CardTitle>
            <CardDescription>
              Schritt-für-Schritt Anleitung für Google Earth Studio
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-cyan-100 dark:bg-cyan-900 flex items-center justify-center font-bold text-cyan-600">1</div>
                <div>
                  <p className="font-medium">GPX exportieren</p>
                  <p className="text-sm text-muted-foreground">Klicke auf "GPX Exportieren" oben und lade die Datei herunter</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-cyan-100 dark:bg-cyan-900 flex items-center justify-center font-bold text-cyan-600">2</div>
                <div>
                  <p className="font-medium">Google Earth Studio öffnen</p>
                  <p className="text-sm text-muted-foreground">Gehe zu earthstudio.google.com und erstelle ein neues Projekt</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-cyan-100 dark:bg-cyan-900 flex items-center justify-center font-bold text-cyan-600">3</div>
                <div>
                  <p className="font-medium">GPX importieren</p>
                  <p className="text-sm text-muted-foreground">Importiere die GPX-Datei und wähle Kamera-Animationen</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-cyan-100 dark:bg-cyan-900 flex items-center justify-center font-bold text-cyan-600">4</div>
                <div>
                  <p className="font-medium">Video exportieren</p>
                  <p className="text-sm text-muted-foreground">Exportiere als 4K MP4 und lade es auf YouTube hoch</p>
                </div>
              </div>
            </div>

            <Button
              variant="ghost"
              onClick={() => window.open('https://earthstudio.google.com', '_blank')}
              className="w-full"
            >
              <Globe className="mr-2 h-4 w-4" />
              Google Earth Studio öffnen
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Export Dialog */}
      <ExportDialog
        events={filteredEvents || []}
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        exportName="MojoBus-Export"
      />
    </div>
  );
}
