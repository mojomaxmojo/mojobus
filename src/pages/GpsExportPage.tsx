/**
 * GPS Export Page
 *
 * Allows exporting multiple locations/places as GPX or KMZ files.
 * Useful for exporting trips with multiple stops for Google Earth Studio.
 */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { GpsExportDialog } from '@/components/gps/GpsExportDialog';
import { usePlaces, extractArticleMetadata } from '@/hooks/useLongformArticles';
import { MapPin, Calendar, Image as ImageIcon, Filter, CheckCircle2, ArrowLeft, ExternalLink, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useHead } from '@unhead/react';

export default function GpsExportPage() {
  // Load places (locations with GPS data)
  const { data: places, isLoading } = usePlaces({ limit: 200 });

  // All events are places (already filtered for GPS data later)
  const allEvents = useMemo(() => {
    return places || [];
  }, [places]);

  // Filter events with location data
  const eventsWithLocation = useMemo(() => {
    return allEvents.filter(event => {
      const locationTag = event.tags.find(([name]) => name === 'location')?.[1];
      return locationTag !== undefined && locationTag !== '';
    });
  }, [allEvents]);

  // Selection state
  const [selectedEventIds, setSelectedEventIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<{ start?: Date; end?: Date }>({});

  // Filter events
  const filteredEvents = useMemo(() => {
    let filtered = [...eventsWithLocation];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(event => {
        const metadata = extractArticleMetadata(event);
        return (
          metadata.title.toLowerCase().includes(query) ||
          metadata.summary.toLowerCase().includes(query)
        );
      });
    }

    // Date range filter
    if (dateRange.start) {
      filtered = filtered.filter(event => event.created_at >= Math.floor(dateRange.start.getTime() / 1000));
    }
    if (dateRange.end) {
      filtered = filtered.filter(event => event.created_at <= Math.floor(dateRange.end.getTime() / 1000));
    }

    return filtered.sort((a, b) => b.created_at - a.created_at);
  }, [eventsWithLocation, searchQuery, dateRange]);

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedEventIds(new Set(filteredEvents.map(e => e.id)));
    } else {
      setSelectedEventIds(new Set());
    }
  };

  const handleSelectEvent = (eventId: string, checked: boolean) => {
    const newSet = new Set(selectedEventIds);
    if (checked) {
      newSet.add(eventId);
    } else {
      newSet.delete(eventId);
    }
    setSelectedEventIds(newSet);
  };

  // Get selected events
  const selectedEvents = useMemo(() => {
    return filteredEvents.filter(e => selectedEventIds.has(e.id));
  }, [filteredEvents, selectedEventIds]);

  // SEO
  useHead(() => {
    return {
      title: 'GPS Export - MojoBus',
      meta: [
        { name: 'description', content: 'Exportiere GPS-Daten für Google Earth Studio und andere Kartentools' },
      ],
    };
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-muted/30 border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <Button asChild variant="ghost" size="sm">
                <Link to="/">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Zurück zur Startseite
                </Link>
              </Button>
            </div>

            <div className="space-y-2">
              <h1 className="text-4xl font-bold flex items-center gap-3">
                <MapPin className="h-10 w-10 text-ocean-600" />
                GPS Export
              </h1>
              <p className="text-xl text-muted-foreground">
                Exportiere deine GPS-Daten für Google Earth Studio, Google Earth Pro oder andere Kartentools
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Info Alert */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Google Earth Studio Tutorial</AlertTitle>
            <AlertDescription>
              Erfahre, wie du GPX-Dateien in Google Earth Studio importierst und professionelle Videos erstellst.
              <br />
              <a
                href="https://docs.mojobus.org/google-earth-studio-tutorial"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline inline-flex items-center gap-1 mt-2"
              >
                Tutorial öffnen <ExternalLink className="h-3 w-3" />
              </a>
            </AlertDescription>
          </Alert>

          {/* Export Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Locations mit GPS</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{eventsWithLocation.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Ausgewählt</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{selectedEventIds.size}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Export bereit</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedEvents.length > 0 ? (
                  <GpsExportDialog
                    events={selectedEvents}
                    trackName={`MojoBus Trip - ${new Date().toLocaleDateString('de-DE')}`}
                  >
                    <Button className="w-full">
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Exportieren ({selectedEvents.length})
                    </Button>
                  </GpsExportDialog>
                ) : (
                  <Button disabled className="w-full">
                    Wähle Locations aus
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filter
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Suche</label>
                  <Input
                    placeholder="Nach Titel oder Beschreibung suchen..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Von</label>
                    <Input
                      type="date"
                      value={dateRange.start ? dateRange.start.toISOString().split('T')[0] : ''}
                      onChange={(e) => setDateRange({
                        ...dateRange,
                        start: e.target.value ? new Date(e.target.value) : undefined,
                      })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Bis</label>
                    <Input
                      type="date"
                      value={dateRange.end ? dateRange.end.toISOString().split('T')[0] : ''}
                      onChange={(e) => setDateRange({
                        ...dateRange,
                        end: e.target.value ? new Date(e.target.value) : undefined,
                      })}
                    />
                  </div>
                </div>
              </div>

              {dateRange.start || dateRange.end ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDateRange({})}
                >
                  Datumsfilter zurücksetzen
                </Button>
              ) : null}
            </CardContent>
          </Card>

          {/* Events List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : filteredEvents.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Keine Locations gefunden</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery || dateRange.start || dateRange.end
                    ? 'Versuche andere Filter'
                    : 'Du hast noch keine Locations mit GPS-Daten erstellt.'}
                </p>
                {!searchQuery && !dateRange.start && !dateRange.end && (
                  <Button asChild>
                    <Link to="/veroeffentlich?tab=place">
                      Erste Location erstellen
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Select All */}
              <div className="flex items-center space-x-2 p-4 bg-muted rounded-lg">
                <Checkbox
                  id="select-all"
                  checked={selectedEventIds.size === filteredEvents.length && filteredEvents.length > 0}
                  onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                />
                <Label htmlFor="select-all" className="flex-1 cursor-pointer font-medium">
                  Alle auswählen ({filteredEvents.length})
                </Label>
              </div>

              {/* Events */}
              {filteredEvents.map((event) => {
                const metadata = extractArticleMetadata(event);
                const isSelected = selectedEventIds.has(event.id);

                return (
                  <Card
                    key={event.id}
                    className={`cursor-pointer transition-all ${
                      isSelected ? 'border-ocean-500 bg-ocean-50 dark:bg-ocean-950' : ''
                    }`}
                    onClick={() => handleSelectEvent(event.id, !isSelected)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => handleSelectEvent(event.id, checked as boolean)}
                          onClick={(e) => e.stopPropagation()}
                        />

                        {metadata.image && (
                          <img
                            src={metadata.image}
                            alt={metadata.title}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h3 className="font-semibold line-clamp-1">{metadata.title}</h3>
                            <Badge variant="outline" className="flex-shrink-0">
                              {event.kind === 30023 ? 'Artikel' : 'Notiz'}
                            </Badge>
                          </div>

                          {metadata.summary && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                              {metadata.summary}
                            </p>
                          )}

                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(metadata.publishedAt * 1000).toLocaleDateString('de-DE')}
                            </div>
                            {event.tags.some(tag => tag[0] === 'image') && (
                              <div className="flex items-center gap-1">
                                <ImageIcon className="h-3 w-3" />
                                Mit Bildern
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              GPS
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
