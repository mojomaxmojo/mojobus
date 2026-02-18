/**
 * Europa Reviews Map Page
 *
 * Displays all GPS-enabled posts from /veroeffentlichen on a Europe map
 * Uses VanillaMap for Shakespeare-Build compatibility
 */

import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { VanillaMap, TILE_LAYERS, type MapMarker, type MapPolyline } from '@/components/VanillaMap';
import { useGpsContent, type MapMarker as GpsMapMarker } from '@/hooks/useGpsContent';
import { MapPin, RefreshCw, Loader2, Map as MapIcon, BarChart3 } from 'lucide-react';

// World bounds - alle Marker anzeigen
const WORLD_CENTER = {
  lat: 20,
  lng: 0,
};

const ZOOM_SETTINGS = {
  default: 2,
  min: 2,
  max: 18,
};

/**
 * Main Map Page Component
 */
export default function MapPage() {
  const { data: markers = [], isLoading, error, refetch } = useGpsContent();
  const [activeFilter, setActiveFilter] = useState<'all' | 'media' | 'note' | 'place' | 'article'>('all');
  const [showRoute, setShowRoute] = useState(true);
  const [showStats, setShowStats] = useState(true);

  // Alle Marker (nicht mehr auf Europa beschränkt)
  const allMarkers = markers;

  // Filter markers by type
  const filteredMarkers = useMemo(() => {
    if (activeFilter === 'all') return allMarkers;
    return allMarkers.filter(m => m.type === activeFilter);
  }, [allMarkers, activeFilter]);

  // Sort markers chronologically for route
  const sortedMarkers = useMemo(() => {
    return [...filteredMarkers].sort((a, b) => a.createdAt - b.createdAt);
  }, [filteredMarkers]);
  
  // Count markers by type (alle Marker)
  const counts = useMemo(() => ({
    media: allMarkers.filter(m => m.type === 'media').length,
    note: allMarkers.filter(m => m.type === 'note').length,
    place: allMarkers.filter(m => m.type === 'place').length,
    article: allMarkers.filter(m => m.type === 'article').length,
    total: allMarkers.length,
  }), [allMarkers]);

  // Calculate bounds to fit all markers
  const mapBounds = useMemo(() => {
    if (allMarkers.length === 0) return null;
    
    let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
    
    allMarkers.forEach(m => {
      if (m.lat < minLat) minLat = m.lat;
      if (m.lat > maxLat) maxLat = m.lat;
      if (m.lon < minLng) minLng = m.lon;
      if (m.lon > maxLng) maxLng = m.lon;
    });
    
    return { minLat, maxLat, minLng, maxLng };
  }, [allMarkers]);

  // Calculate center from bounds
  const mapCenter: [number, number] = useMemo(() => {
    if (!mapBounds) return [WORLD_CENTER.lat, WORLD_CENTER.lng];
    return [
      (mapBounds.minLat + mapBounds.maxLat) / 2,
      (mapBounds.minLng + mapBounds.maxLng) / 2
    ];
  }, [mapBounds]);

  // Convert GPS markers to VanillaMap markers
  const mapMarkers: MapMarker[] = useMemo(() => {
    return sortedMarkers.map((m) => ({
      id: m.id,
      lat: m.lat,
      lng: m.lon,
      title: m.title,
      description: m.location || undefined,
      isCurrent: false,
    }));
  }, [sortedMarkers]);

  // Create route polyline
  const routePolylines: MapPolyline[] = useMemo(() => {
    if (!showRoute || sortedMarkers.length < 2) return [];
    
    return [{
      points: sortedMarkers.map(m => [m.lat, m.lon] as [number, number]),
      color: '#0891B2',
      weight: 3,
      opacity: 0.8,
    }];
  }, [sortedMarkers, showRoute]);

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

  // Handle loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5" />
            <span className="text-lg font-semibold">🗺️ Europa Map</span>
          </div>
          <Skeleton className="w-full h-[600px] rounded-lg" />
        </Card>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="border-dashed p-8">
          <div className="max-w-sm mx-auto text-center space-y-6">
            <MapPin className="w-12 h-12 text-gray-400 mx-auto" />
            <div>
              <h3 className="text-lg font-medium mb-2">Karte konnte nicht geladen werden</h3>
              <p className="text-muted-foreground">Bitte versuche es erneut.</p>
            </div>
            <Button onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Neu laden
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Handle empty state
  if (allMarkers.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="border-dashed p-8">
          <div className="max-w-sm mx-auto text-center space-y-6">
            <MapPin className="w-12 h-12 text-gray-400 mx-auto" />
            <div>
              <h3 className="text-lg font-medium mb-2">Noch keine Beiträge mit GPS</h3>
              <p className="text-muted-foreground">
                Veröffentliche Beiträge mit Standortinformationen, um sie auf der Karte anzuzeigen.
              </p>
            </div>
          </div>
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
              <span className="gradient-text">🗺️ Reise-Karte</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              GPS-aktivierte Beiträge auf einer interaktiven Weltkarte
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
            <VanillaMap
              center={mapCenter}
              zoom={ZOOM_SETTINGS.default}
              minZoom={ZOOM_SETTINGS.min}
              maxZoom={ZOOM_SETTINGS.max}
              markers={mapMarkers}
              polylines={routePolylines}
              height="600px"
              className="rounded-none"
              tileUrl={TILE_LAYERS.cartoVoyager.url}
              tileAttribution={TILE_LAYERS.cartoVoyager.attribution}
              fitToMarkers={true}
            />
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
 * Get filter label in German
 */
function getFilterLabel(filter: 'media' | 'note' | 'place' | 'article'): string {
  const labels = {
    media: 'Bilder',
    note: 'Notizen',
    place: 'Plätze',
    article: 'Artikel'
  };
  return labels[filter];
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
