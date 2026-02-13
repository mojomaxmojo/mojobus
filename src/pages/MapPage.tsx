import { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Skeleton } from '@/components/ui/skeleton';
import { usePlaces, extractArticleMetadata } from '@/hooks/useLongformArticles';
import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import { NOSTR_CONFIG } from '@/config/nostr';
import { DEFAULT_PERFORMANCE_CONFIG } from '@/config/performance';
import { nip19 } from 'nostr-tools';
import { useHead } from '@unhead/react';
import {
  MapPin,
  Camera,
  Play,
  Pause,
  RefreshCw,
  Layers,
  BarChart3,
  Map as MapIcon,
  Maximize2,
  Minimize2,
  Sun,
} from 'lucide-react';

// Lazy load Leaflet components to reduce initial bundle size
const MapContainer = lazy(() => import('react-leaflet').then(mod => ({ default: mod.MapContainer })));
const TileLayer = lazy(() => import('react-leaflet').then(mod => ({ default: mod.TileLayer })));
const Marker = lazy(() => import('react-leaflet').then(mod => ({ default: mod.Marker })));
const Popup = lazy(() => import('react-leaflet').then(mod => ({ default: mod.Popup })));
const Polyline = lazy(() => import('react-leaflet').then(mod => ({ default: mod.Polyline })));
const CircleMarker = lazy(() => import('react-leaflet').then(mod => ({ default: mod.CircleMarker })));
const useMap = lazy(() => import('react-leaflet').then(mod => ({ default: mod.useMap })));

// Dynamic import for Leaflet CSS
const loadLeafletCSS = () => {
  if (!document.getElementById('leaflet-css')) {
    const link = document.createElement('link');
    link.id = 'leaflet-css';
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);
  }
};

// Dynamic import for Leaflet icons fix
const fixLeafletIcons = async () => {
  const L = await import('leaflet');
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
};

interface PlaceData {
  id: string;
  lat: number;
  lng: number;
  name: string;
  country: string;
  duration?: number;
  photoCount?: number;
  articleCount?: number;
  date: number;
  description?: string;
  type: 'place' | 'article' | 'image' | 'note';
  event: any;
}

interface RoutePoint {
  lat: number;
  lng: number;
  placeId: string;
  timestamp: number;
  name: string;
}

const MapController = ({
  center,
  zoom,
  routePoints,
  currentPlaybackIndex,
  onCenterChange,
  onZoomChange
}: {
  center: [number, number];
  zoom: number;
  routePoints: RoutePoint[];
  currentPlaybackIndex: number | null;
  onCenterChange: (center: [number, number]) => void;
  onZoomChange: (zoom: number) => void;
}) => {
  const map = (useMap as any)();

  useEffect(() => {
    map.setView(center, zoom);
  }, [map, center, zoom]);

  useEffect(() => {
    map.on('moveend', () => {
      const center = map.getCenter();
      onCenterChange([center.lat, center.lng]);
    });
    map.on('zoomend', () => {
      onZoomChange(map.getZoom());
    });
  }, [map, onCenterChange, onZoomChange]);

  useEffect(() => {
    if (currentPlaybackIndex !== null && currentPlaybackIndex >= 0 && currentPlaybackIndex < routePoints.length) {
      const point = routePoints[currentPlaybackIndex];
      map.flyTo([point.lat, point.lng], 10, {
        duration: 1
      });
    }
  }, [map, currentPlaybackIndex, routePoints]);

  return null;
};

function MapPage() {
  const { nostr } = useNostr();

  // Load Leaflet CSS and fix icons only when component mounts
  useEffect(() => {
    loadLeafletCSS();
    fixLeafletIcons();
  }, []);

  // State
  const [center, setCenter] = useState<[number, number]>([39.3999, -8.2245]);
  const [zoom, setZoom] = useState(6);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showLayers, setShowLayers] = useState(true);
  const [showStats, setShowStats] = useState(true);

  // Layers
  const [showRoute, setShowRoute] = useState(true);
  const [showDuration, setShowDuration] = useState(true);
  const [showPhotoSpots, setShowPhotoSpots] = useState(true);
  const [showArticles, setShowArticles] = useState(true);
  const [showNotes, setShowNotes] = useState(true);
  const [showImages, setShowImages] = useState(true);

  // Map type
  const [mapType, setMapType] = useState<'normal' | 'satellite' | 'terrain'>('normal');

  // Playback
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [currentPlaybackIndex, setCurrentPlaybackIndex] = useState<number | null>(null);

  // Fetch places
  const { data: places, isLoading: placesLoading } = usePlaces();

  // Fetch all articles (longform) - INCREASED LIMIT TO 200
  const { data: articles } = useQuery({
    queryKey: ['map-articles', NOSTR_CONFIG.authorPubkeys],
    queryFn: async ({ signal }) => {
      const events = await nostr.query([
        {
          kinds: [30023],
          authors: NOSTR_CONFIG.authorPubkeys,
          limit: 200,
        }
      ], { signal: AbortSignal.any([signal!, AbortSignal.timeout(DEFAULT_PERFORMANCE_CONFIG.relay.queryTimeout)]) });
      return events;
    },
    staleTime: DEFAULT_PERFORMANCE_CONFIG.cache.staleTime,
  });

  // Fetch notes - INCREASED LIMIT TO 200
  const { data: notes } = useQuery({
    queryKey: ['map-notes', NOSTR_CONFIG.authorPubkeys],
    queryFn: async ({ signal }) => {
      const events = await nostr.query([
        {
          kinds: [1],
          authors: NOSTR_CONFIG.authorPubkeys,
          '#t': ['note', 'notiz'],
          limit: 200,
        }
      ], { signal: AbortSignal.any([signal!, AbortSignal.timeout(DEFAULT_PERFORMANCE_CONFIG.relay.queryTimeout)]) });
      return events;
    },
    staleTime: DEFAULT_PERFORMANCE_CONFIG.cache.staleTime,
  });

  // Fetch media events for GPS data - INCREASED LIMIT TO 200
  const { data: mediaEvents = [] } = useQuery({
    queryKey: ['map-media', NOSTR_CONFIG.authorPubkeys],
    queryFn: async ({ signal }) => {
      const events = await nostr.query([
        {
          kinds: [1, 30023],
          authors: NOSTR_CONFIG.authorPubkeys,
          '#t': ['medien', 'media', 'bilder', 'images'],
          limit: 200,
        }
      ], { signal: AbortSignal.any([signal!, AbortSignal.timeout(DEFAULT_PERFORMANCE_CONFIG.relay.queryTimeout)]) });
      return events;
    },
    staleTime: DEFAULT_PERFORMANCE_CONFIG.cache.staleTime,
  });

  // Extract GPS data from all event types
  const extractGPSFromEvent = (event: any, type: 'place' | 'article' | 'image' | 'note') => {
    const metadata = extractArticleMetadata(event);
    const locationTag = event.tags?.find(tag => tag[0] === 'location');
    const publishedAtTag = event.tags?.find(tag => tag[0] === 'published_at');

    if (!locationTag || !locationTag[1]) return null;

    // Try to extract coordinates from location tag
    const coords = locationTag[1].match(/lat=([0-9.-]+),lon=([0-9.-]+)/);
    if (!coords) return null;

    return {
      id: event.id,
      lat: parseFloat(coords[1]),
      lng: parseFloat(coords[2]),
      name: metadata.title || locationTag[1].split(',').slice(0, 2).join(','),
      country: locationTag[1],
      date: publishedAtTag ? parseInt(publishedAtTag[1]) : event.created_at,
      description: metadata.summary || event.content?.substring(0, 100),
      type,
      event,
      photoCount: metadata.image ? 1 : 0,
      articleCount: 1,
    };
  };

  const placeData = useMemo(() => {
    const data: PlaceData[] = [];

    // Process places
    places?.forEach(place => {
      const gps = extractGPSFromEvent(place, 'place');
      if (gps) {
        data.push(gps);
      }
    });

    // Process articles (that are not already in places)
    articles?.forEach(article => {
      const gps = extractGPSFromEvent(article, 'article');
      if (gps && !data.some(p => p.id === gps.id)) {
        data.push(gps);
      }
    });

    // Process notes
    notes?.forEach(note => {
      const gps = extractGPSFromEvent(note, 'note');
      if (gps && !data.some(p => p.id === gps.id)) {
        data.push(gps);
      }
    });

    // Process media events with images
    mediaEvents.forEach(media => {
      // Check if it has images
      const hasImage = media.content?.match(/https?:\/\/[^\s]+\.(jpg|jpeg|png|webp|gif)/gi);
      if (!hasImage) return;

      const gps = extractGPSFromEvent(media, 'image');
      if (gps && !data.some(p => p.id === gps.id)) {
        data.push({ ...gps, photoCount: 1 });
      }
    });

    return data.sort((a, b) => a.date - b.date);
  }, [places, articles, notes, mediaEvents]);

  // Extract route points chronologically
  const routePoints = useMemo(() => {
    return placeData.map(place => ({
      lat: place.lat,
      lng: place.lng,
      placeId: place.id,
      timestamp: place.date,
      name: place.name,
    }));
  }, [placeData]);

  // Current location (most recent place)
  const currentLocation = useMemo(() => {
    if (placeData.length === 0) return null;
    return placeData[placeData.length - 1];
  }, [placeData]);

  // Statistics
  const stats = useMemo(() => {
    const countries = new Set<string>();
    const totalDays = placeData.reduce((sum, p) => sum + (p.duration || 1), 0);
    const totalPhotos = placeData.reduce((sum, p) => sum + (p.photoCount || 0), 0);
    const totalArticles = placeData.reduce((sum, p) => sum + (p.articleCount || 0), 0);

    const totalPlaces = placeData.filter(p => p.type === 'place').length;
    const totalImages = placeData.filter(p => p.type === 'image').length;
    const totalNotes = placeData.filter(p => p.type === 'note').length;
    const totalArticlesCount = placeData.filter(p => p.type === 'article').length;

    placeData.forEach(p => {
      if (p.country) countries.add(p.country);
    });

    return {
      countries: countries.size,
      totalDays,
      totalPhotos,
      totalArticles: totalArticlesCount,
      totalPlaces,
      totalImages,
      totalNotes,
      totalContent: placeData.length,
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

  // Custom map tile layer based on type
  const getTileUrl = () => {
    switch (mapType) {
      case 'satellite':
        return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      case 'terrain':
        return 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png';
      default:
        return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    }
  };

  const getAttribution = () => {
    switch (mapType) {
      case 'satellite':
        return '&copy; Esri';
      case 'terrain':
        return '&copy; OpenTopoMap';
      default:
        return '&copy; OpenStreetMap';
    }
  };

  // SEO Meta Tags
  useHead({
    title: 'Interaktive Map - Alle Artikel, Plätze, Bilder & Notes',
    meta: [
      { name: 'description', content: 'Interaktive Map mit allen MojoBus Inhalten: Artikel, Plätze, Bilder und Notes auf einer Karte.' },
      { property: 'og:title', content: 'Interaktive Map - MojoBus' },
      { property: 'og:description', content: 'Alle Inhalte auf einer Karte!' },
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
                <h1 className="text-2xl font-bold">Interaktive Map</h1>
                <p className="text-sm text-muted-foreground">Alle Inhalte auf einer Karte</p>
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
                  {stats.totalContent} Inhalte
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
                    { value: 'normal', label: 'Normal', icon: MapIcon },
                    { value: 'satellite', label: 'Satellit', icon: MapIcon },
                    { value: 'terrain', label: 'Gelände', icon: Sun },
                  ].map((type) => (
                    <Button
                      key={type.value}
                      variant={mapType === type.value ? 'default' : 'outline'}
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => setMapType(type.value as any)}
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
                    <Label htmlFor="show-articles" className="text-sm">Artikel</Label>
                    <Switch id="show-articles" checked={showArticles} onCheckedChange={setShowArticles} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="show-notes" className="text-sm">Notes</Label>
                    <Switch id="show-notes" checked={showNotes} onCheckedChange={setShowNotes} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="show-images" className="text-sm">Bilder</Label>
                    <Switch id="show-images" checked={showImages} onCheckedChange={setShowImages} />
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
          <Suspense fallback={
            <div className="flex items-center justify-center h-full">
              <LoadingSpinner text="Lade Karte..." />
            </div>
          }>
            <MapContainer
              center={center}
              zoom={zoom}
              style={{ height: '100%', width: '100%' }}
            >
              <Suspense fallback={null}>
                <MapController
                  center={center}
                  zoom={zoom}
                  routePoints={routePoints}
                  currentPlaybackIndex={currentPlaybackIndex}
                  onCenterChange={setCenter}
                  onZoomChange={setZoom}
                />

                <TileLayer
                  url={getTileUrl()}
                  attribution={getAttribution()}
                />

                {/* Route Line */}
                {showRoute && routePoints.length > 1 && (
                  <Polyline
                    positions={routePoints.map(p => [p.lat, p.lng])}
                    color="#0891B2"
                    weight={3}
                    opacity={0.8}
                    lineCap="round"
                    lineJoin="round"
                  />
                )}

                {/* Place Markers with Duration Circles */}
                {placeData.map((place, index) => {
                  const isCurrentLocation = currentLocation?.id === place.id;
                  const isPlaybackPoint = currentPlaybackIndex === index;

                  return (
                    <div key={place.id}>
                      {/* Duration Circle */}
                      {showDuration && (place.duration || 1) > 1 && (
                        <CircleMarker
                          center={[place.lat, place.lng]}
                          radius={Math.min((place.duration || 1) * 2, 50)}
                          pathOptions={{
                            color: isCurrentLocation ? '#ef4444' : '#0891B2',
                            fillColor: isCurrentLocation ? '#ef4444' : '#0891B2',
                            fillOpacity: 0.2,
                            weight: 1,
                          }}
                        />
                      )}

                      {/* Photo Spot Marker */}
                      {showPhotoSpots && (place.photoCount || 0) > 0 && (
                        <CircleMarker
                          center={[place.lat, place.lng]}
                          radius={8 + Math.min(place.photoCount!, 20)}
                          pathOptions={{
                            color: '#f59e0b',
                            fillColor: '#f59e0b',
                            fillOpacity: 0.4,
                            weight: 1,
                          }}
                        >
                          <Popup>
                            <div className="space-y-2">
                              <h3 className="font-semibold">{place.name}</h3>
                              {place.description && <p className="text-sm">{place.description}</p>}
                              <div className="flex gap-2 text-sm">
                                <Badge variant="secondary">📸 {place.photoCount}</Badge>
                                <Badge variant="secondary">📝 {place.articleCount || 1}</Badge>
                              </div>
                            </div>
                          </Popup>
                        </CircleMarker>
                      )}

                      {/* Main Marker - Different icons for different types */}
                      {(showArticles && place.type === 'article') ||
                       (showNotes && place.type === 'note') ||
                       (showImages && place.type === 'image') ||
                       (showArticles && place.type === 'place')} && (
                        <Suspense fallback={null}>
                          <Marker
                            position={[place.lat, place.lng]}
                            icon={(window as any).L?.icon({
                              // Different colors for different types
                              iconUrl: isCurrentLocation || isPlaybackPoint
                                ? 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png'
                                : place.type === 'place'
                                  ? 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png'
                                  : place.type === 'article'
                                    ? 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png'
                                    : place.type === 'image'
                                      ? 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png'
                                      : 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-yellow.png',
                              iconSize: [25, 41],
                              iconAnchor: [12, 41],
                              popupAnchor: [1, -34],
                              shadowSize: [41, 41]
                            })}
                          >
                            <Popup>
                              <div className="space-y-2 min-w-[200px]">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-bold">{place.name}</h3>
                                  {isCurrentLocation && (
                                    <Badge variant="destructive" className="gap-1">
                                      <MapPin className="h-3 w-3" />
                                      AKTUELL
                                    </Badge>
                                  )}
                                  <Badge variant="outline" className="gap-1 text-xs">
                                    {place.type === 'place' ? '📍 Ort' : place.type === 'article' ? '📝 Artikel' : place.type === 'image' ? '📷 Bild' : '📝 Note'}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(place.date * 1000).toLocaleDateString('de-DE')}
                                </p>
                                {place.description && (
                                  <p className="text-sm">{place.description}</p>
                                )}
                                <div className="flex gap-2">
                                  {(place.duration || 1) > 1 && (
                                    <Badge variant="secondary">
                                      ⏱️ {place.duration} Tage
                                    </Badge>
                                  )}
                                  {(place.photoCount || 0) > 0 && (
                                    <Badge variant="secondary">
                                      📸 {place.photoCount}
                                    </Badge>
                                  )}
                                  {(place.articleCount || 0) > 0 && (
                                    <Badge variant="secondary">
                                      📝 {place.articleCount}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </Popup>
                          </Marker>
                        </Suspense>
                      )}
                    </div>
                  );
                })}
              </Suspense>
            </MapContainer>
          </Suspense>
        </div>

        {/* Stats Panel */}
        {showStats && (
          <div className="w-80 border-l bg-background overflow-y-auto">
            <div className="p-4 space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">📊 Statistiken</h3>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-primary/10 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-primary">{stats.totalContent}</div>
                    <div className="text-xs text-muted-foreground">Gesamt</div>
                  </div>
                  <div className="bg-primary/10 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-primary">{stats.countries}</div>
                    <div className="text-xs text-muted-foreground">Länder</div>
                  </div>
                  <div className="bg-primary/10 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-primary">{stats.totalDays}</div>
                    <div className="text-xs text-muted-foreground">Tage</div>
                  </div>
                  <div className="bg-primary/10 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-primary">{stats.totalPlaces}</div>
                    <div className="text-xs text-muted-foreground">Orte</div>
                  </div>
                  <div className="bg-primary/10 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-primary">{stats.totalArticles}</div>
                    <div className="text-xs text-muted-foreground">Artikel</div>
                  </div>
                  <div className="bg-primary/10 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-primary">{stats.totalImages}</div>
                    <div className="text-xs text-muted-foreground">Bilder</div>
                  </div>
                  <div className="bg-primary/10 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-primary">{stats.totalNotes}</div>
                    <div className="text-xs text-muted-foreground">Notes</div>
                  </div>
                  <div className="bg-primary/10 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-primary">{stats.totalPhotos}</div>
                    <div className="text-xs text-muted-foreground">Medien</div>
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
                      onClick={() => setCenter([place.lat, place.lng])}
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
