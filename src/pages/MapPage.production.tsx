/**
 * Europa Reviews Map Page
 *
 * Displays all GPS-enabled posts from /veroeffentlichen on a Europe map
 * Using direct Leaflet API (no react-leaflet wrapper)
 */

import { useMemo, useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useGpsContent, type MapMarker } from '@/hooks/useGpsContent';
import { MapMarkerPopup } from '@/components/MapMarkerPopup';
import { getMarkerIcon } from '@/lib/markerIcons';
import { EUROPA_BOUNDS, EUROPA_CENTER, ZOOM_SETTINGS } from '@/lib/mapConfig';
import { MapPin, RefreshCw, Loader2, Map as MapIcon, BarChart3 } from 'lucide-react';

import L from 'leaflet';

/**
 * Main Map Page Component
 */
export default function MapPage() {
  const { data: markers = [], isLoading, error, refetch } = useGpsContent();
  const [activeFilter, setActiveFilter] = useState<'all' | 'media' | 'note' | 'place' | 'article'>('all');
  const [showRoute, setShowRoute] = useState(true);
  const [showStats, setShowStats] = useState(true);

  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const routePolylineRef = useRef<L.Polyline | null>(null);

  // Filter markers to Europe only
  const europeMarkers = useMemo(() => {
    return markers.filter(marker => {
      return (
        marker.lat >= EUROPA_BOUNDS.south &&
        marker.lat <= EUROPA_BOUNDS.north &&
        marker.lon >= EUROPA_BOUNDS.west &&
        marker.lon <= EUROPA_BOUNDS.east
      );
    });
  }, [markers]);

  // Filter markers by type
  const filteredMarkers = useMemo(() => {
    if (activeFilter === 'all') return europeMarkers;
    return europeMarkers.filter(m => m.type === activeFilter);
  }, [europeMarkers, activeFilter]);

  // Sort markers chronologically for route
  const sortedMarkers = useMemo(() => {
    return [...filteredMarkers].sort((a, b) => a.createdAt - b.createdAt);
  }, [filteredMarkers]);

  // Count markers by type
  const counts = useMemo(() => ({
    media: europeMarkers.filter(m => m.type === 'media').length,
    note: europeMarkers.filter(m => m.type === 'note').length,
    place: europeMarkers.filter(m => m.type === 'place').length,
    article: europeMarkers.filter(m => m.type === 'article').length,
    total: europeMarkers.length,
  }), [europeMarkers]);

  // Calculate route statistics
  const routeStats = useMemo(() => {
    if (sortedMarkers.length < 2) {
      return { totalDistance: 0, firstDate: null, lastDate: null, daysBetween: 0 };
    }

    // Calculate total distance using Haversine formula
    let totalDistance = 0;
    for (let i = 1; i < sortedMarkers.length; i++) {
      const from = sortedMarkers[i - 1];
      const to = sortedMarkers[i];
      const distance = calculateDistance(from.lat, from.lon, to.lat, to.lon);
      totalDistance += distance;
    }

    const firstDate = new Date(sortedMarkers[0].createdAt * 1000);
    const lastDate = new Date(sortedMarkers[sortedMarkers.length - 1].createdAt * 1000);
    const daysBetween = Math.floor((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24));

    return { totalDistance, firstDate, lastDate, daysBetween };
  }, [sortedMarkers]);

  // Calculate distance between two coordinates (Haversine formula)
  function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [EUROPA_CENTER.lat, EUROPA_CENTER.lng],
      zoom: ZOOM_SETTINGS.default,
      minZoom: ZOOM_SETTINGS.min,
      maxZoom: ZOOM_SETTINGS.max,
      maxBounds: [
        [EUROPA_BOUNDS.south, EUROPA_BOUNDS.west],
        [EUROPA_BOUNDS.north, EUROPA_BOUNDS.east],
      ],
      zoomControl: true,
    });

    mapRef.current = map;

    // Add tile layer
    const tileLayer = L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }
    );

    tileLayer.addTo(map);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update markers when filteredMarkers or showRoute changes
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => mapRef.current!.removeLayer(marker));
    markersRef.current.clear();

    // Clear route polyline
    if (routePolylineRef.current) {
      mapRef.current.removeLayer(routePolylineRef.current);
      routePolylineRef.current = null;
    }

    // Add route polyline
    if (showRoute && sortedMarkers.length > 1) {
      const polyline = L.polyline(
        sortedMarkers.map(m => [m.lat, m.lon]),
        {
          color: '#0891B2',
          weight: 3,
          opacity: 0.8,
          lineCap: 'round',
          lineJoin: 'round',
        }
      );

      polyline.addTo(mapRef.current);
      routePolylineRef.current = polyline;
    }

    // Add markers
    filteredMarkers.forEach((marker) => {
      const leafletMarker = L.marker([marker.lat, marker.lon], {
        icon: getMarkerIcon(marker.type),
      });

      // Create popup content
      const popupContent = document.createElement('div');
      const root = document.createElement('div');
      popupContent.appendChild(root);

      leafletMarker.bindPopup(popupContent);

      // Custom popup content
      const popup = leafletMarker.getPopup();
      popup?.on('open', () => {
        // Create a temporary element for MapMarkerPopup to render into
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = `
          <div class="p-3 min-w-[250px] max-w-[300px]">
            <div class="flex items-center gap-2 mb-2">
              <span class="text-xl">${getMarkerEmoji(marker.type)}</span>
              <h3 class="font-bold text-sm line-clamp-1 flex-1">${marker.title}</h3>
            </div>
            ${marker.image ? `<img src="${marker.image}" alt="${marker.title}" class="w-full h-auto max-h-[150px] object-cover rounded-lg mb-2" />` : ''}
            ${marker.location ? `<div class="mb-2 text-sm text-muted-foreground">📍 ${marker.location}</div>` : ''}
            <div class="mb-3 text-xs text-muted-foreground">
              <div class="flex items-center gap-1">🌐 ${marker.lat.toFixed(6)}° N</div>
              <div class="flex items-center gap-1">🌐 ${marker.lon.toFixed(6)}° E</div>
            </div>
            <a href="/${getMarkerLink(marker)}" class="inline-block w-full text-center px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:opacity-90">Details anzeigen</a>
          </div>
        `;
        root.innerHTML = tempDiv.innerHTML;
      });

      leafletMarker.addTo(mapRef.current!);
      markersRef.current.set(marker.id, leafletMarker);
    });
  }, [filteredMarkers, showRoute, sortedMarkers]);

  function getMarkerEmoji(type: string): string {
    const emojis: Record<string, string> = {
      media: '📷',
      note: '📝',
      place: '📍',
      article: '📄',
    };
    return emojis[type] || '📍';
  }

  function getMarkerLink(marker: MapMarker): string {
    if (marker.kind === 1) {
      return marker.id; // Use note ID directly
    }
    // For articles, use naddr (simplified)
    return marker.id;
  }

  function getFilterLabel(filter: 'media' | 'note' | 'place' | 'article'): string {
    const labels = {
      media: 'Bilder',
      note: 'Notizen',
      place: 'Plätze',
      article: 'Artikel'
    };
    return labels[filter];
  }

  // Handle loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              🗺️ Europa Map
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Skeleton className="w-full h-[600px] rounded-lg" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="border-dashed">
          <CardContent className="py-12 px-8 text-center">
            <div className="max-w-sm mx-auto space-y-6">
              <MapPin className="w-12 h-12 text-gray-400 mx-auto" />
              <div>
                <h3 className="text-lg font-medium mb-2">Karte konnte nicht geladen werden</h3>
                <p className="text-muted-foreground">
                  Bitte versuche es erneut.
                </p>
              </div>
              <Button onClick={() => refetch()}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Neu laden
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Handle empty state
  if (europeMarkers.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="border-dashed">
          <CardContent className="py-12 px-8 text-center">
            <div className="max-w-sm mx-auto space-y-6">
              <MapPin className="w-12 h-12 text-gray-400 mx-auto" />
              <div>
                <h3 className="text-lg font-medium mb-2">Noch keine Beiträge mit GPS</h3>
                <p className="text-muted-foreground">
                  Veröffentliche Beiträge mit Standortinformationen, um sie auf der Karte anzuzeigen.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      {/* Page Header mit Gradient Background */}
      <section className="relative py-6 overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-accent/20 to-background" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/40 to-background" />

        {/* Content */}
        <div className="relative z-10 container mx-auto px-4">
          <div className="text-center space-y-2">
            <h1 className="text-4xl md:text-6xl font-bold">
              <span className="gradient-text">🗺️ Europa Map</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              GPS-aktivierte Beiträge auf einer interaktiven Karte
            </p>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 pb-8">
        {/* Map Card mit integrierter Filter-Bar */}
        <Card className="overflow-hidden">
          {/* Filter Bar - Teil der Map-Card */}
          <div className="p-4 h-[70px] bg-muted/50 border-b flex items-center justify-between">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                <span className="text-sm text-muted-foreground">
                  <strong>{filteredMarkers.length}</strong> {activeFilter === 'all' ? 'Beiträge' : getFilterLabel(activeFilter)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Filter:</span>
                <div className="flex items-center gap-1">
                  <FilterButton
                    emoji="📷"
                    count={counts.media}
                    isActive={activeFilter === 'media'}
                    onClick={() => setActiveFilter(activeFilter === 'media' ? 'all' : 'media')}
                  />
                  <FilterButton
                    emoji="📝"
                    count={counts.note}
                    isActive={activeFilter === 'note'}
                    onClick={() => setActiveFilter(activeFilter === 'note' ? 'all' : 'note')}
                  />
                  <FilterButton
                    emoji="📍"
                    count={counts.place}
                    isActive={activeFilter === 'place'}
                    onClick={() => setActiveFilter(activeFilter === 'place' ? 'all' : 'place')}
                  />
                  <FilterButton
                    emoji="📄"
                    count={counts.article}
                    isActive={activeFilter === 'article'}
                    onClick={() => setActiveFilter(activeFilter === 'article' ? 'all' : 'article')}
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 mr-2">
                <Label htmlFor="show-route" className="text-sm cursor-pointer">Route</Label>
                <Switch id="show-route" checked={showRoute} onCheckedChange={setShowRoute} />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowStats(!showStats)}
              >
                <BarChart3 className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Neu laden
              </Button>
            </div>
          </div>

          {/* Map */}
          <div style={{ height: '600px', width: '100%' }}>
            <div ref={mapContainerRef} style={{ height: '100%', width: '100%', zIndex: 0 }} />
          </div>

          {/* Route Statistics Panel */}
          {showStats && routeStats.totalDistance > 0 && (
            <div className="p-4 border-t bg-muted/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapIcon className="w-5 h-5 text-primary" />
                  <span className="font-semibold">Route-Statistiken</span>
                </div>
                <div className="flex gap-6 text-sm">
                  <div>
                    <span className="text-muted-foreground">Gesamtdistanz:</span>
                    <span className="ml-2 font-semibold text-primary">
                      {routeStats.totalDistance.toFixed(0)} km
                    </span>
                  </div>
                  {routeStats.daysBetween > 0 && (
                    <div>
                      <span className="text-muted-foreground">Zeitraum:</span>
                      <span className="ml-2 font-semibold">
                        {routeStats.daysBetween} Tage
                      </span>
                    </div>
                  )}
                  {routeStats.firstDate && (
                    <div>
                      <span className="text-muted-foreground">Erster Ort:</span>
                      <span className="ml-2">
                        {routeStats.firstDate.toLocaleDateString('de-DE')}
                      </span>
                    </div>
                  )}
                  {routeStats.lastDate && (
                    <div>
                      <span className="text-muted-foreground">Letzter Ort:</span>
                      <span className="ml-2">
                        {routeStats.lastDate.toLocaleDateString('de-DE')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}

/**
 * Filter Button Component
 */
function FilterButton({ emoji, count, isActive, onClick }: { emoji: string; count: number; isActive: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1 px-2 py-1 rounded-md transition-colors ${
        isActive
          ? 'bg-primary text-primary-foreground font-medium'
          : 'hover:bg-muted text-muted-foreground hover:text-foreground'
      }`}
    >
      <span>{emoji}</span>
      <span>{count}</span>
    </button>
  );
}
