import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { usePlaces, extractArticleMetadata } from '@/hooks/useLongformArticles';
import { useNotes } from '@/hooks/useNotes';
import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { NOSTR_CONFIG } from '@/config/nostr';
import { DEFAULT_PERFORMANCE_CONFIG } from '@/config/performance';
import { nip19 } from 'nostr-tools';
import { useHead } from '@unhead/react';
import L from 'leaflet';
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
  duration?: number;
  photoCount?: number;
  articleCount?: number;
  date: number;
  description?: string;
}

function MapPage() {
  const { nostr } = useNostr();
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const circleMarkersRef = useRef<L.CircleMarker[]>([]);
  const routePolylineRef = useRef<L.Polyline | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

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
  const [showCamping, setShowCamping] = useState(false);
  const [showWater, setShowWater] = useState(false);

  // Map type
  const [mapType, setMapType] = useState<'normal' | 'satellite' | 'terrain'>('normal');

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

  // Current location
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

  // Create custom marker icon
  const createMarkerIcon = (isCurrent: boolean, isPlayback: boolean) => {
    return L.icon({
      iconUrl: isCurrent || isPlayback
        ? 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png'
        : 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });
  };

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center,
      zoom,
      zoomControl: false,
    });

    mapRef.current = map;

    // Add tile layer
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

    const tileLayer = L.tileLayer(getTileUrl(), {
      attribution: getAttribution(),
      maxZoom: 19,
    });

    tileLayer.addTo(map);
    tileLayerRef.current = tileLayer;

    // Handle map events
    map.on('moveend', () => {
      const c = map.getCenter();
      setCenter([c.lat, c.lng]);
      setZoom(map.getZoom());
    });

    map.on('zoomend', () => {
      setZoom(map.getZoom());
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []); // Only run on mount

  // Update map center and zoom
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setView(center, zoom, { animate: true });
    }
  }, [center, zoom]);

  // Update tile layer when map type changes
  useEffect(() => {
    if (!mapRef.current || !tileLayerRef.current) return;

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

    tileLayerRef.current.setUrl(getTileUrl());
    tileLayerRef.current.setAttribution(getAttribution());
  }, [mapType]);

  // Update markers when placeData changes
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => mapRef.current!.removeLayer(marker));
    markersRef.current.clear();

    // Clear circle markers
    circleMarkersRef.current.forEach(cm => mapRef.current!.removeLayer(cm));
    circleMarkersRef.current = [];

    // Clear route polyline
    if (routePolylineRef.current) {
      mapRef.current.removeLayer(routePolylineRef.current);
      routePolylineRef.current = null;
    }

    // Add route polyline
    if (showRoute && routePoints.length > 1) {
      const polyline = L.polyline(
        routePoints.map(p => [p.lat, p.lng]),
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
    placeData.forEach((place, index) => {
      const isCurrentLocation = currentLocation?.id === place.id;
      const isPlaybackPoint = currentPlaybackIndex === index;

      // Duration Circle
      if (showDuration && (place.duration || 1) > 1) {
        const circleMarker = L.circleMarker([place.lat, place.lng], {
          radius: Math.min((place.duration || 1) * 2, 50),
          color: isCurrentLocation ? '#ef4444' : '#0891B2',
          fillColor: isCurrentLocation ? '#ef4444' : '#0891B2',
          fillOpacity: 0.2,
          weight: 1,
        });

        circleMarker.addTo(mapRef.current!);
        circleMarkersRef.current.push(circleMarker);
      }

      // Photo Spot Marker
      if (showPhotoSpots && (place.photoCount || 0) > 0) {
        const photoCircle = L.circleMarker([place.lat, place.lng], {
          radius: 8 + Math.min(place.photoCount!, 20),
          color: '#f59e0b',
          fillColor: '#f59e0b',
          fillOpacity: 0.4,
          weight: 1,
        });

        const popup = L.popup()
          .setContent(`
            <div class="space-y-2">
              <h3 class="font-semibold">${place.name}</h3>
              ${place.description ? `<p class="text-sm">${place.description}</p>` : ''}
              <div class="flex gap-2 text-sm">
                <span class="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">📸 ${place.photoCount}</span>
                <span class="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">📝 ${place.articleCount || 1}</span>
              </div>
            </div>
          `);

        photoCircle.bindPopup(popup);
        photoCircle.addTo(mapRef.current!);
        circleMarkersRef.current.push(photoCircle);
      }

      // Main Marker
      const marker = L.marker([place.lat, place.lng], {
        icon: createMarkerIcon(isCurrentLocation, isPlaybackPoint),
      });

      const popup = L.popup()
        .setContent(`
          <div class="space-y-2 min-w-[200px]">
            <div class="flex items-center gap-2">
              <h3 class="font-bold">${place.name}</h3>
              ${isCurrentLocation ? `
                <span class="bg-red-500 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                  📍 AKTUELL
                </span>
              ` : ''}
            </div>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              ${new Date(place.date * 1000).toLocaleDateString('de-DE')}
            </p>
            ${place.description ? `<p class="text-sm">${place.description}</p>` : ''}
            <div class="flex flex-wrap gap-2">
              ${(place.duration || 1) > 1 ? `
                <span class="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm">
                  ⏱️ ${place.duration} Tage
                </span>
              ` : ''}
              ${(place.photoCount || 0) > 0 ? `
                <span class="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm">
                  📸 ${place.photoCount}
                </span>
              ` : ''}
              ${(place.articleCount || 0) > 0 ? `
                <span class="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm">
                  📝 ${place.articleCount}
                </span>
              ` : ''}
            </div>
          </div>
        `);

      marker.bindPopup(popup);
      marker.addTo(mapRef.current!);
      markersRef.current.set(place.id, marker);
    });
  }, [placeData, showRoute, showDuration, showPhotoSpots, currentLocation, currentPlaybackIndex]);

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

  // Smooth zoom to current playback point
  useEffect(() => {
    if (currentPlaybackIndex !== null && currentPlaybackIndex >= 0 && currentPlaybackIndex < routePoints.length) {
      const point = routePoints[currentPlaybackIndex];
      if (mapRef.current) {
        mapRef.current.flyTo([point.lat, point.lng], 10, { duration: 1 });
      }
    }
  }, [currentPlaybackIndex, routePoints]);

  // Zoom controls
  const zoomIn = () => {
    if (mapRef.current) {
      const newZoom = Math.min(zoom + 1, 19);
      mapRef.current.setZoom(newZoom);
    }
  };

  const zoomOut = () => {
    if (mapRef.current) {
      const newZoom = Math.max(zoom - 1, 1);
      mapRef.current.setZoom(newZoom);
    }
  };

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
                    { value: 'normal', label: 'Normal', icon: MapIcon },
                    { value: 'satellite', label: 'Satellit', icon: Globe },
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
          <div ref={mapContainerRef} style={{ height: '100%', width: '100%' }} />

          {/* Zoom Controls */}
          <div className="absolute top-4 left-4 flex flex-col gap-1 z-[1000]">
            <Button onClick={zoomIn} variant="outline" size="sm" className="w-8 h-8 p-0 bg-white dark:bg-gray-800">
              <Maximize2 className="h-4 w-4" />
            </Button>
            <Button onClick={zoomOut} variant="outline" size="sm" className="w-8 h-8 p-0 bg-white dark:bg-gray-800">
              <Minimize2 className="h-4 w-4" />
            </Button>
          </div>
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
