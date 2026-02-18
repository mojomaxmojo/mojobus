import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { usePlaces, extractArticleMetadata } from '@/hooks/useLongformArticles';
import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { NOSTR_CONFIG } from '@/config/nostr';
import { DEFAULT_PERFORMANCE_CONFIG } from '@/config/performance';
import { useHead } from '@unhead/react';
import { VanillaMap, TILE_LAYERS, type MapMarker, type MapPolyline } from '@/components/VanillaMap';
import {
  MapPin,
  Camera,
  Play,
  Pause,
  RefreshCw,
  Layers,
  BarChart3,
  Map as MapIcon,
  Globe,
  Maximize2,
  Minimize2,
  Sun,
} from 'lucide-react';

interface PlaceData {
  id: string;
  lat: number;
  lng: number;
  name: string;
  country: string;
  duration?: number; // in days
  photoCount?: number;
  articleCount?: number;
  date: number;
  description?: string;
}

interface RoutePoint {
  lat: number;
  lng: number;
  placeId: string;
  timestamp: number;
  name: string;
}

function MapPage() {
  const { nostr } = useNostr();

  // State
  const [center, setCenter] = useState<[number, number]>([39.3999, -8.2245]); // Portugal center
  const [zoom, setZoom] = useState(6);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showLayers, setShowLayers] = useState(true);
  const [showStats, setShowStats] = useState(true);

  // Layers
  const [showRoute, setShowRoute] = useState(true);
  const [showDuration, setShowDuration] = useState(true);
  const [showPhotoSpots, setShowPhotoSpots] = useState(true);
  const [showCamping, setShowCamping] = useState(false);
  const [showWater, setShowWater] = useState(false);

  // Map type
  const [mapType, setMapType] = useState<'default' | 'satellite' | 'terrain' | 'cartoVoyager'>('cartoVoyager');

  // Playback
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [currentPlaybackIndex, setCurrentPlaybackIndex] = useState<number | null>(null);

  // Fetch places
  const { data: places, isLoading: placesLoading } = usePlaces();

  // Fetch media events for GPS data
  const { data: mediaEvents = [] } = useQuery({
    queryKey: ['map-media', NOSTR_CONFIG.authorPubkeys],
    queryFn: async ({ signal }) => {
      const events = await nostr.query([
        {
          kinds: [1, 30023],
          authors: NOSTR_CONFIG.authorPubkeys,
          '#t': ['medien', 'media', 'bilder', 'images'],
          limit: 100,
        }
      ], { signal: AbortSignal.any([signal!, AbortSignal.timeout(DEFAULT_PERFORMANCE_CONFIG.relay.queryTimeout)]) });

      return events;
    },
    staleTime: DEFAULT_PERFORMANCE_CONFIG.cache.staleTime,
  });

  // Extract GPS data from places and media
  const placeData = useMemo(() => {
    const data: PlaceData[] = [];

    places?.forEach((place) => {
      const metadata = extractArticleMetadata(place);
      const locationTag = place.tags?.find(tag => tag[0] === 'location');
      const publishedAtTag = place.tags?.find(tag => tag[0] === 'published_at');

      if (locationTag && locationTag[1]) {
        // Try to extract coordinates from location tag
        const coords = locationTag[1].match(/lat=([0-9.-]+),lon=([0-9.-]+)/);

        if (coords) {
          data.push({
            id: place.id,
            lat: parseFloat(coords[1]),
            lng: parseFloat(coords[2]),
            name: metadata.title || locationTag[1],
            country: locationTag[1],
            date: publishedAtTag ? parseInt(publishedAtTag[1]) : place.created_at,
            description: metadata.summary,
            articleCount: 1,
          });
        }
      }
    });

    return data.sort((a, b) => a.date - b.date);
  }, [places]);

  // Current location (most recent place)
  const currentLocation = useMemo(() => {
    if (placeData.length === 0) return null;
    return placeData[placeData.length - 1];
  }, [placeData]);

  // Convert places to map markers
  const mapMarkers: MapMarker[] = useMemo(() => {
    return placeData.map((place, index) => ({
      id: place.id,
      lat: place.lat,
      lng: place.lng,
      title: place.name,
      description: place.description || `${new Date(place.date * 1000).toLocaleDateString('de-DE')}`,
      isCurrent: currentLocation?.id === place.id || currentPlaybackIndex === index,
    }));
  }, [placeData, currentLocation, currentPlaybackIndex]);

  // Convert places to route polyline
  const routePolylines: MapPolyline[] = useMemo(() => {
    if (!showRoute || placeData.length < 2) return [];
    
    return [{
      points: placeData.map(p => [p.lat, p.lng] as [number, number]),
      color: '#0891B2',
      weight: 3,
      opacity: 0.8,
    }];
  }, [placeData, showRoute]);

  // Extract route points chronologically for playback
  const routePoints = useMemo(() => {
    return placeData.map(place => ({
      lat: place.lat,
      lng: place.lng,
      placeId: place.id,
      timestamp: place.date,
      name: place.name,
    }));
  }, [placeData]);

  // Statistics
  const stats = useMemo(() => {
    const countries = new Set<string>();
    const totalDays = placeData.reduce((sum, p) => sum + (p.duration || 1), 0);
    const totalPhotos = placeData.reduce((sum, p) => sum + (p.photoCount || 0), 0);
    const totalArticles = placeData.reduce((sum, p) => sum + (p.articleCount || 0), 0);

    placeData.forEach(p => {
      if (p.country) countries.add(p.country);
    });

    return {
      countries: countries.size,
      totalDays,
      totalPhotos,
      totalArticles,
      totalPlaces: placeData.length,
    };
  }, [placeData]);

  // Playback logic
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentPlaybackIndex(prev => {
        if (prev === null) return 0;
        if (prev >= routePoints.length - 1) return 0;
        return prev + 1;
      });
    }, 1000 / playbackSpeed);

    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed, routePoints.length]);

  // Update map center during playback
  useEffect(() => {
    if (currentPlaybackIndex !== null && currentPlaybackIndex >= 0 && currentPlaybackIndex < routePoints.length) {
      const point = routePoints[currentPlaybackIndex];
      setCenter([point.lat, point.lng]);
      setZoom(10);
    }
  }, [currentPlaybackIndex, routePoints]);

  // Get tile layer config
  const tileConfig = TILE_LAYERS[mapType];

  // SEO Meta Tags
  useHead({
    title: 'Reise-Karte - MojoBus',
    meta: [
      { name: 'description', content: 'Interaktive Karte unserer Reiseroute durch Europa. Live-Tracking, Routen-Animation und Reisestatistiken.' },
      { property: 'og:title', content: 'Reise-Karte - MojoBus' },
      { property: 'og:description', content: 'Folge unserer Reise auf der interaktiven Karte!' },
      { property: 'og:type', content: 'website' }
    ],
    link: [
      { rel: 'canonical', href: 'https://mojobus.co/map' }
    ]
  });

  if (placesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Lade Karte..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MapIcon className="h-6 w-6 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">Reise-Karte</h1>
                <p className="text-sm text-muted-foreground">Interaktive Route & Statistiken</p>
              </div>
            </div>

            {currentLocation && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="gap-1">
                  <MapPin className="h-3 w-3" />
                  {currentLocation.name}
                </Badge>
                <Badge variant="secondary" className="gap-1">
                  <Camera className="h-3 w-3" />
                  {stats.totalPlaces} Orte
                </Badge>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowStats(!showStats)}
                title="Statistiken"
              >
                <BarChart3 className="h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowLayers(!showLayers)}
                title="Layer"
              >
                <Layers className="h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsFullscreen(!isFullscreen)}
                title={isFullscreen ? "Verkleinern" : "Vollbild"}
              >
                {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-80px)]">
        {/* Layer Control */}
        {showLayers && (
          <div className="w-72 border-r bg-background overflow-y-auto">
            <div className="p-4 space-y-6">
              {/* Map Type */}
              <div>
                <Label className="text-sm font-semibold mb-3 block">Kartentyp</Label>
                <div className="flex flex-col gap-2">
                  {[
                    { value: 'cartoVoyager', label: 'Standard', icon: MapIcon },
                    { value: 'satellite', label: 'Satellit', icon: Globe },
                    { value: 'terrain', label: 'Gelände', icon: Sun },
                  ].map((type) => (
                    <Button
                      key={type.value}
                      variant={mapType === type.value ? 'default' : 'outline'}
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => setMapType(type.value as typeof mapType)}
                    >
                      <type.icon className="h-4 w-4 mr-2" />
                      {type.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Layers */}
              <div>
                <Label className="text-sm font-semibold mb-3 block">Layer anzeigen</Label>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="show-route" className="text-sm">Route</Label>
                    <Switch id="show-route" checked={showRoute} onCheckedChange={setShowRoute} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="show-duration" className="text-sm">Aufenthaltsdauer</Label>
                    <Switch id="show-duration" checked={showDuration} onCheckedChange={setShowDuration} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="show-photos" className="text-sm">Foto-Hotspots</Label>
                    <Switch id="show-photos" checked={showPhotoSpots} onCheckedChange={setShowPhotoSpots} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="show-camping" className="text-sm">Campingplätze</Label>
                    <Switch id="show-camping" checked={showCamping} onCheckedChange={setShowCamping} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="show-water" className="text-sm">Wasser-Points</Label>
                    <Switch id="show-water" checked={showWater} onCheckedChange={setShowWater} />
                  </div>
                </div>
              </div>

              {/* Animation Controls */}
              <div>
                <Label className="text-sm font-semibold mb-3 block">Route-Replay</Label>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={isPlaying ? "default" : "outline"}
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="flex-1"
                    >
                      {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      {isPlaying ? 'Pause' : 'Play'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setCurrentPlaybackIndex(null)}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex gap-2">
                    {[1, 2, 4, 8].map(speed => (
                      <Button
                        key={speed}
                        size="sm"
                        variant={playbackSpeed === speed ? 'default' : 'outline'}
                        onClick={() => setPlaybackSpeed(speed)}
                        className="flex-1"
                      >
                        {speed}x
                      </Button>
                    ))}
                  </div>

                  {currentPlaybackIndex !== null && (
                    <div className="text-center text-sm text-muted-foreground">
                      {currentPlaybackIndex + 1} / {routePoints.length}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Map */}
        <div className="flex-1 relative">
          <VanillaMap
            center={center}
            zoom={zoom}
            markers={mapMarkers}
            polylines={routePolylines}
            height="100%"
            className="rounded-none"
            onCenterChange={setCenter}
            onZoomChange={setZoom}
            tileUrl={tileConfig.url}
            tileAttribution={tileConfig.attribution}
          />
        </div>

        {/* Stats Panel */}
        {showStats && (
          <div className="w-80 border-l bg-background overflow-y-auto">
            <div className="p-4 space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">📊 Statistiken</h3>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-primary/10 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-primary">{stats.totalPlaces}</div>
                    <div className="text-xs text-muted-foreground">Orte</div>
                  </div>
                  <div className="bg-primary/10 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-primary">{stats.countries}</div>
                    <div className="text-xs text-muted-foreground">Länder</div>
                  </div>
                  <div className="bg-primary/10 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-primary">{stats.totalDays}</div>
                    <div className="text-xs text-muted-foreground">Gesamttage</div>
                  </div>
                  <div className="bg-primary/10 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-primary">{stats.totalPhotos}</div>
                    <div className="text-xs text-muted-foreground">Fotos</div>
                  </div>
                </div>
              </div>

              {/* Current Location Card */}
              {currentLocation && (
                <Card className="p-4">
                  <div className="space-y-3">
                    <h4 className="font-semibold flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      Aktuelle Position
                    </h4>
                    <div>
                      <div className="font-semibold">{currentLocation.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(currentLocation.date * 1000).toLocaleDateString('de-DE')}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {currentLocation.photoCount && (
                        <Badge variant="secondary">📸 {currentLocation.photoCount}</Badge>
                      )}
                      {currentLocation.articleCount && (
                        <Badge variant="secondary">📝 {currentLocation.articleCount}</Badge>
                      )}
                    </div>
                  </div>
                </Card>
              )}

              {/* Recent Places */}
              <div>
                <h4 className="font-semibold mb-3">📍 Letzte Orte</h4>
                <div className="space-y-2">
                  {placeData.slice(-5).reverse().map(place => (
                    <div
                      key={place.id}
                      className="p-2 rounded-lg hover:bg-muted cursor-pointer transition-colors"
                      onClick={() => {
                        setCenter([place.lat, place.lng]);
                        setZoom(12);
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{place.name}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(place.date * 1000).toLocaleDateString('de-DE')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MapPage;
