import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { usePlaces, extractArticleMetadata } from '@/hooks/useLongformArticles';
import { useNotes } from '@/hooks/useNotes';
import { useNostr } from '@nostrify/react';
import { NOSTR_CONFIG } from '@/config/nostr';
import { DEFAULT_PERFORMANCE_CONFIG } from '@/config/performance';
import { useHead } from '@unhead/react';
import {
  MapPin,
  BarChart3,
  Map as MapIcon,
  FileText,
  Home,
  Image,
  MessageCircle,
  Globe,
  Calendar,
  Camera,
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

type FilterType = 'all' | 'articles' | 'places' | 'images' | 'notes';

/**
 * Main Map Page - Hero + Stats with Filter + Full Width Map
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
  const [showRoute, setShowRoute] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  // Fetch places
  const { data: places, isLoading } = usePlaces();
  const { data: notes } = useNotes();

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

  // Filter places based on active filter
  const filteredPlaceData = useMemo(() => {
    if (activeFilter === 'all') return placeData;

    // For map, we show all places regardless of filter
    // The filter controls what stats are shown
    return placeData;
  }, [placeData, activeFilter]);

  // Route points for polyline
  const routePoints = useMemo(() => {
    return filteredPlaceData.map(place => [place.lat, place.lng] as [number, number]);
  }, [filteredPlaceData]);

  // Current location
  const currentLocation = useMemo(() => {
    if (filteredPlaceData.length === 0) return null;
    return filteredPlaceData[filteredPlaceData.length - 1];
  }, [filteredPlaceData]);

  // Statistics
  const stats = useMemo(() => {
    const countries = new Set<string>();
    const totalDays = filteredPlaceData.reduce((sum, p) => sum + (p.duration || 1), 0);
    const totalPhotos = filteredPlaceData.reduce((sum, p) => sum + (p.photoCount || 0), 0);
    const totalArticles = filteredPlaceData.reduce((sum, p) => sum + (p.articleCount || 0), 0);

    filteredPlaceData.forEach(p => {
      if (p.country) countries.add(p.country);
    });

    return {
      countries: countries.size,
      totalDays,
      totalPhotos,
      totalArticles,
      totalPlaces: filteredPlaceData.length,
      totalNotes: notes?.length || 0,
    };
  }, [filteredPlaceData, notes]);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current).setView(center, zoom);
    mapInstanceRef.current = map;

    // Add tiles (OpenStreetMap only)
    tileLayerRef.current = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
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

  // Update markers
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Remove existing markers
    markersRef.current.forEach(marker => {
      mapInstanceRef.current!.removeLayer(marker);
    });
    markersRef.current = [];

    // Add new markers
    filteredPlaceData.forEach((place) => {
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
    if (filteredPlaceData.length > 0) {
      const bounds = L.latLngBounds(filteredPlaceData.map(p => [p.lat, p.lng] as [number, number]));
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
    }

  }, [filteredPlaceData, currentLocation, showRoute, routePoints]);

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
    <div className="min-h-screen">
      {/* Hero Section - 100px height */}
      <section className="relative h-[100px] flex items-center justify-center overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-accent/20 to-background" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/40 to-background" />

        {/* Content */}
        <div className="relative z-10 container mx-auto px-4">
          <div className="max-w-5xl mx-auto text-center">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight">
              <span className="gradient-text">GPS-aktivierte Beiträge auf einer interaktiven Karte</span>
            </h1>
          </div>
        </div>
      </section>

      {/* Stats Section with Filter */}
      <section className="py-8 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            {/* Filter Tabs */}
            <div className="flex flex-wrap justify-center gap-3 mb-4">
              <Button
                variant={activeFilter === 'all' ? 'default' : 'outline'}
                size="lg"
                onClick={() => setActiveFilter('all')}
                className="gap-2"
              >
                <BarChart3 className="h-5 w-5" />
                Alle ({stats.totalPlaces})
              </Button>
              <Button
                variant={activeFilter === 'articles' ? 'default' : 'outline'}
                size="lg"
                onClick={() => setActiveFilter('articles')}
                className="gap-2"
              >
                <FileText className="h-5 w-5" />
                Artikel ({stats.totalArticles})
              </Button>
              <Button
                variant={activeFilter === 'places' ? 'default' : 'outline'}
                size="lg"
                onClick={() => setActiveFilter('places')}
                className="gap-2"
              >
                <Home className="h-5 w-5" />
                Plätze ({stats.totalPlaces})
              </Button>
              <Button
                variant={activeFilter === 'images' ? 'default' : 'outline'}
                size="lg"
                onClick={() => setActiveFilter('images')}
                className="gap-2"
              >
                <Image className="h-5 w-5" />
                Bilder ({stats.totalPhotos})
              </Button>
              <Button
                variant={activeFilter === 'notes' ? 'default' : 'outline'}
                size="lg"
                onClick={() => setActiveFilter('notes')}
                className="gap-2"
              >
                <MessageCircle className="h-5 w-5" />
                Notes ({stats.totalNotes})
              </Button>
            </div>

            {/* Stats - Icons only with badges */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              <div className="relative group cursor-pointer">
                <div className="p-3 bg-primary/5 rounded-lg hover:bg-primary/10 transition-colors">
                  <MapPin className="h-6 w-6 text-primary" />
                </div>
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {stats.totalPlaces}
                </Badge>
              </div>
              <div className="relative group cursor-pointer">
                <div className="p-3 bg-primary/5 rounded-lg hover:bg-primary/10 transition-colors">
                  <Globe className="h-6 w-6 text-primary" />
                </div>
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {stats.countries}
                </Badge>
              </div>
              <div className="relative group cursor-pointer">
                <div className="p-3 bg-primary/5 rounded-lg hover:bg-primary/10 transition-colors">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {stats.totalDays}
                </Badge>
              </div>
              <div className="relative group cursor-pointer">
                <div className="p-3 bg-primary/5 rounded-lg hover:bg-primary/10 transition-colors">
                  <Camera className="h-6 w-6 text-primary" />
                </div>
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {stats.totalPhotos}
                </Badge>
              </div>
              <div className="relative group cursor-pointer">
                <div className="p-3 bg-primary/5 rounded-lg hover:bg-primary/10 transition-colors">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {stats.totalArticles}
                </Badge>
              </div>
            </div>

            {/* Route Toggle */}
            <div className="flex justify-center">
              <div className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg">
                <Switch
                  id="show-route"
                  checked={showRoute}
                  onCheckedChange={setShowRoute}
                />
                <Label htmlFor="show-route" className="text-sm font-medium cursor-pointer">
                  Route anzeigen
                </Label>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Full Width Map */}
      <section className="h-[60vh] w-full">
        <div ref={mapRef} className="h-full w-full" />
      </section>
    </div>
  );
}

export default MapPage;
