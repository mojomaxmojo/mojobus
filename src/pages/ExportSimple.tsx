/**
 * Export Page - Simple version without Dialog to avoid Radix errors
 * Allows users to export their content as GPX or KMZ
 */

import { useState, useEffect } from 'react';
import { useNostr } from '@nostrify/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { MapPin, Download, Globe, FileText, Image as ImageIcon, Filter, Calendar, Loader2, Info } from 'lucide-react';
import type { NostrEvent } from '@nostrify/nostrify';
import { exportEventsToGPX } from '@/lib/gpxExporter';
import { exportEventsToKMZ, type KMZExportOptions } from '@/lib/kmzExporter';

export default function ExportSimple() {
  const { nostr } = useNostr();

  // State with explicit defaults
  const [events, setEvents] = useState<NostrEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<NostrEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [exporting, setExporting] = useState<boolean>(false);

  // Export options
  const [includeImages, setIncludeImages] = useState<boolean>(true);
  const [includePosts, setIncludePosts] = useState<boolean>(true);
  const [includeTimestamps, setIncludeTimestamps] = useState<boolean>(true);
  const [maxImages, setMaxImages] = useState<number>(50);
  const [includeFullResImages, setIncludeFullResImages] = useState<boolean>(false);

  // Filter options
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['article', 'image', 'note']);
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'year' | 'all'>('all');
  const [countryFilter, setCountryFilter] = useState<string>('');

  // Load events on mount
  useEffect(() => {
    const loadEvents = async () => {
      setLoading(true);
      try {
        const fetchedEvents = await nostr.query([
          {
            kinds: [30023, 30024, 1],
            limit: 1000,
          }
        ]);

        setEvents(fetchedEvents || []);
        setFilteredEvents(fetchedEvents || []);
      } catch (error) {
        console.error('Error loading events:', error);
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, [nostr]);

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

  // Filter events
  const applyFilters = () => {
    let filtered = [...(events || [])];

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

    // Filter by country
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

  // Calculate stats
  const imageCount = (filteredEvents || []).reduce((count, event) => {
    return count + event.tags.filter(([name]) => name === 'image').length;
  }, 0);

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

  // Handle GPX export
  const handleGPXExport = async () => {
    setExporting(true);
    try {
      await exportEventsToGPX(filteredEvents || [], {
        includeImages,
        includePosts,
        includeTimestamps,
        includeElevation: false
      });
      console.log('✅ GPX Export erfolgreich!');
      alert('✅ GPX Export erfolgreich!');
    } catch (error) {
      console.error('GPX Export error:', error);
      alert('❌ Export fehlgeschlagen');
    } finally {
      setExporting(false);
    }
  };

  // Handle KMZ export
  const handleKMZExport = async () => {
    setExporting(true);
    try {
      const options: KMZExportOptions = {
        includeImages,
        includePosts,
        includeTimestamps,
        includeElevation: false,
        includeFullResImages,
        includeThumbnails: true,
        maxImageCount: maxImages
      };

      await exportEventsToKMZ(filteredEvents || [], options);
      console.log('✅ KMZ Export erfolgreich!');
      alert('✅ KMZ Export erfolgreich!');
    } catch (error) {
      console.error('KMZ Export error:', error);
      alert('❌ Export fehlgeschlagen');
    } finally {
      setExporting(false);
    }
  };

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
                  <p className="text-2xl font-bold">{(filteredEvents || []).length}</p>
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

        {/* Export Options */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Export-Optionen</CardTitle>
            <CardDescription>
              Wähle, was du exportieren möchtest
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="images" className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" />
                  Bilder
                </Label>
                <Checkbox
                  id="images"
                  checked={includeImages}
                  onCheckedChange={(checked) => setIncludeImages(checked as boolean)}
                />
              </div>

              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="posts" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Posts/Texte
                </Label>
                <Checkbox
                  id="posts"
                  checked={includePosts}
                  onCheckedChange={(checked) => setIncludePosts(checked as boolean)}
                />
              </div>

              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="timestamps" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Zeitstempel
                </Label>
                <Checkbox
                  id="timestamps"
                  checked={includeTimestamps}
                  onCheckedChange={(checked) => setIncludeTimestamps(checked as boolean)}
                />
              </div>

              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="fullres" className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Vollauflösung (KMZ)
                </Label>
                <Checkbox
                  id="fullres"
                  checked={includeFullResImages}
                  onCheckedChange={(checked) => setIncludeFullResImages(checked as boolean)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Maximale Bilder (KMZ)</Label>
                <Badge variant="outline">{maxImages} von {imageCount}</Badge>
              </div>
              <input
                type="range"
                min="1"
                max={Math.min(imageCount, 100)}
                value={maxImages}
                onChange={(e) => setMaxImages(parseInt(e.target.value))}
                className="w-full"
                disabled={!includeImages}
              />
            </div>
          </CardContent>
        </Card>

        {/* Export Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-cyan-600" />
                GPX Export
              </CardTitle>
              <CardDescription>
                Für Google Earth Studio - kleine Datei
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleGPXExport}
                disabled={exporting || (filteredEvents || []).length === 0}
                className="w-full"
                size="lg"
              >
                {exporting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Exportiere GPX...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    GPX herunterladen
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                ~10-100 KB • Fotos als Links • Schneller Download
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-purple-600" />
                KMZ Export
              </CardTitle>
              <CardDescription>
                Für Google Earth Pro - mit allen Fotos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleKMZExport}
                disabled={exporting || (filteredEvents || []).length === 0}
                variant="outline"
                className="w-full"
                size="lg"
              >
                {exporting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Lade Bilder & Exportiere...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    KMZ herunterladen
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                ~10-50 MB • Alle Fotos lokal • Für Google Earth Pro
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Info */}
        <Card>
          <CardHeader>
            <CardTitle>Google Earth Studio Tutorial</CardTitle>
            <CardDescription>
              Schritt-für-Schritt Anleitung
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-cyan-100 dark:bg-cyan-900 flex items-center justify-center font-bold text-cyan-600">1</div>
                <div>
                  <p className="font-medium">GPX exportieren</p>
                  <p className="text-sm text-muted-foreground">Klicke oben auf GPX herunterladen</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-cyan-100 dark:bg-cyan-900 flex items-center justify-center font-bold text-cyan-600">2</div>
                <div>
                  <p className="font-medium">Google Earth Studio öffnen</p>
                  <p className="text-sm text-muted-foreground">earthstudio.google.com</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-cyan-100 dark:bg-cyan-900 flex items-center justify-center font-bold text-cyan-600">3</div>
                <div>
                  <p className="font-medium">GPX importieren</p>
                  <p className="text-sm text-muted-foreground">Importiere die GPX-Datei</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-cyan-100 dark:bg-cyan-900 flex items-center justify-center font-bold text-cyan-600">4</div>
                <div>
                  <p className="font-medium">Video erstellen</p>
                  <p className="text-sm text-muted-foreground">Exportiere als 4K MP4</p>
                </div>
              </div>
            </div>

            <Button
              variant="ghost"
              onClick={() => window.open('https://earthstudio.google.com', '_blank')}
              className="w-full mt-4"
            >
              <Globe className="mr-2 h-4 w-4" />
              Google Earth Studio öffnen
            </Button>
          </CardContent>
        </Card>

        {(filteredEvents || []).length === 0 && (
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
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
      </div>
    </div>
  );
}
