import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { usePlaces, extractArticleMetadata } from '@/hooks/useLongformArticles';
import { useNostr } from '@nostrify/react';
import { NOSTR_CONFIG } from '@/config/nostr';
import { DEFAULT_PERFORMANCE_CONFIG } from '@/config/performance';
import { useHead } from '@unhead/react';
import {
  MapPin,
  BarChart3,
  Map as MapIcon,
  Globe,
  Maximize2,
  Minimize2,
} from 'lucide-react';

// Use plain Leaflet (imported globally in main.tsx)
import L from 'leaflet';

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

/**
 * Main Map Page with CartoDB Support
 */
function MapPage() {
  const { nostr } = useNostr();

  // Refs
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const polylineRef = useRef<L.Polyline | null>(null);

  // State
  const [center, setCenter] = useState<[number, number]>([39.3999, -8.2245]);
  const [zoom, setZoom] = useState(6);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showStats, setShowStats] = useState(true);
  const [showRoute, setShowRoute] = useState(true);
  const [mapType, setMapType] = useState<'normal' | 'satellite'>('normal');

  // Fetch places
  const { data: places, isLoading } = usePlaces();

  // Extract GPS data from places
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

  // Route points for polyline
  const routePoints = useMemo(() => {
    return placeData.map(place => [place.lat, place.lng] as [number, number]);
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

  // Get tile URL based on map type
  const getTileUrl = () => {
    switch (mapType) {
      case 'satellite':
        return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      default: // normal
        return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    }
  };

  // Get attribution based on map type
  const getAttribution = () => {
    switch (mapType) {
      case 'satellite':
        return '&copy; Esri';
      default:
        return '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
    }
  };

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current).setView(center, zoom);

    mapInstanceRef.current = map;

    // Add tiles
    tileLayerRef.current = L.tileLayer(getTileUrl(), {
      attribution: getAttribution(),
      maxZoom: 19
    }).addTo(map);

    // Event listeners
    map.on('moveend', () => {
      const center = map.getCenter();
      setCenter([center.lat, center.lng]);
    });

    map.on('zoomend', () => {
      setZoom(map.getZoom());
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update tile layer when map type changes
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;

    // Remove old tile layer and add new one
    mapInstanceRef.current.removeLayer(tileLayerRef.current);
    tileLayerRef.current = L.tileLayer(getTileUrl(), {
      attribution: getAttribution(),
      maxZoom: 19
    }).addTo(mapInstanceRef.current);
  }, [mapType]);

  // Update markers
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Remove existing markers
    markersRef.current.forEach(marker => {
      mapInstanceRef.current!.removeLayer(marker);
    });
    markersRef.current = [];

    // Add new markers
    placeData.forEach((place) => {
      const isCurrentLocation = currentLocation?.id === place.id;

      const marker = L.marker([place.lat, place.lng], {
        icon: L.icon({
          iconUrl: isCurrentLocation
            ? 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png'
            : 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41]
        })
      });

      // Create popup content
      const popupContent = document.createElement('div');
      popupContent.className = 'space-y-2 min-w-[200px] p-2';

      const title = document.createElement('div');
      title.className = 'font-bold flex items-center gap-2';
      title.innerHTML = `${place.name}${isCurrentLocation ? '<span class="bg-red-500 text-white px-2 py-0.5 rounded text-xs ml-2">AKTUELL</span>' : ''}`;

      const date = document.createElement('p');
      date.className = 'text-sm text-gray-600 dark:text-gray-400';
      date.textContent = new Date(place.date * 1000).toLocaleDateString('de-DE');

      popupContent.appendChild(title);
      popupContent.appendChild(date);

      if (place.description) {
        const desc = document.createElement('p');
        desc.className = 'text-sm';
        desc.textContent = place.description;
        popupContent.appendChild(desc);
      }

      const badges = document.createElement('div');
      badges.className = 'flex gap-1 flex-wrap';

      if (place.duration && place.duration > 1) {
        const badge = document.createElement('span');
        badge.className = 'bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded text-xs';
        badge.textContent = `⏱️ ${place.duration} Tage`;
        badges.appendChild(badge);
      }

      if (place.photoCount && place.photoCount > 0) {
        const badge = document.createElement('span');
        badge.className = 'bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded text-xs';
        badge.textContent = `📸 ${place.photoCount}`;
        badges.appendChild(badge);
      }

      if (place.articleCount && place.articleCount > 0) {
        const badge = document.createElement('span');
        badge.className = 'bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded text-xs';
        badge.textContent = `📝 ${place.articleCount}`;
        badges.appendChild(badge);
      }

      popupContent.appendChild(badges);

      marker.bindPopup(popupContent);
      marker.addTo(mapInstanceRef.current);
      markersRef.current.push(marker);
    });

    // Update polyline
    if (polylineRef.current) {
      mapInstanceRef.current.removeLayer(polylineRef.current);
    }

    if (showRoute && routePoints.length > 1) {
      polylineRef.current = L.polyline(routePoints, {
        color: '#0891B2',
        weight: 3,
        opacity: 0.8
      }).addTo(mapInstanceRef.current);
    }

    // Fit bounds to show all markers
    if (placeData.length > 0) {
      const bounds = L.latLngBounds(placeData.map(p => [p.lat, p.lng] as [number, number]));
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
    }

  }, [placeData, currentLocation, showRoute, routePoints]);

  // SEO Meta Tags
  useHead({
    title: 'Reise-Karte - MojoBus',
    meta: [
      { name: 'description', content: 'Interaktive Karte unserer Reiseroute durch Europa.' },
      { property: 'og:title', content: 'Reise-Karte - MojoBus' },
      { property: 'og:description', content: 'Folge unserer Reise auf der interaktiven Karte!' },
      { property: 'og:type', content: 'website' }
    ],
    link: [
      { rel: 'canonical', href: 'https://mojobus.co/map' }
    ]
  });

  if (isLoading) {
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
                <p className="text-sm text-muted-foreground">Interaktive Route</p>
              </div>
            </div>

            {currentLocation && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="gap-1">
                  <MapPin className="h-3 w-3" />
                  {currentLocation.name}
                </Badge>
                <Badge variant="secondary" className="gap-1">
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
        <div className="w-72 border-r bg-background overflow-y-auto p-4 space-y-6">
          <div>
            <Label className="text-sm font-semibold mb-3 block">Kartentyp</Label>
            <div className="flex flex-col gap-2">
              {[
                { value: 'normal' as const, label: 'OpenStreetMap', icon: MapIcon },
                { value: 'satellite' as const, label: 'Satellit', icon: Globe },
              ].map((type) => (
                <Button
                  key={type.value}
                  variant={mapType === type.value ? 'default' : 'outline'}
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => setMapType(type.value)}
                >
                  <type.icon className="h-4 w-4 mr-2" />
                  {type.label}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-sm font-semibold mb-3 block">Einstellungen</Label>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="show-route" className="text-sm">Route anzeigen</Label>
                <Switch id="show-route" checked={showRoute} onCheckedChange={setShowRoute} />
              </div>
            </div>
          </div>
        </div>

        {/* Map */}
        <div className="flex-1 relative">
          <div ref={mapRef} className="h-full w-full" />
        </div>

        {/* Stats Panel */}
        {showStats && (
          <div className="w-80 border-l bg-background overflow-y-auto p-4 space-y-6">
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
                  <div className="text-xs text-muted-foreground">Tage</div>
                </div>
                <div className="bg-primary/10 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-primary">{stats.totalPhotos}</div>
                  <div className="text-xs text-muted-foreground">Fotos</div>
                </div>
              </div>
            </div>

            {/* Current Location */}
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
                      if (mapInstanceRef.current) {
                        mapInstanceRef.current.setView([place.lat, place.lng], 12);
                      }
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
        )}
      </div>
    </div>
  );
}

export default MapPage;
