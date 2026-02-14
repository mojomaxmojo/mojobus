import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useGpsContent, type MapMarker } from '@/hooks/useGpsContent';
import { useHead } from '@unhead/react';
import {
  BarChart3,
  FileText,
  Home,
  Image,
  MessageCircle,
} from 'lucide-react';

// Use plain Leaflet (imported globally in main.tsx)
import L from 'leaflet';

type FilterType = 'all' | 'articles' | 'places' | 'images' | 'notes';

/**
 * Main Map Page - Hero + Stats with Filter + Full Width Map
 */
function MapPage() {
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

  // Fetch GPS content
  const { data: markers = [], isLoading } = useGpsContent();

  // Filter markers based on active filter
  const filteredMarkers = useMemo(() => {
    if (activeFilter === 'all') return markers;

    switch (activeFilter) {
      case 'articles':
        return markers.filter(m => m.type === 'article');
      case 'places':
        return markers.filter(m => m.type === 'place');
      case 'images':
        return markers.filter(m => m.type === 'media');
      case 'notes':
        return markers.filter(m => m.type === 'note');
      default:
        return markers;
    }
  }, [markers, activeFilter]);

  // Always show all GPS markers on map (filter only affects stats)
  const mapMarkers = useMemo(() => markers, [markers]);

  // Route points for polyline
  const routePoints = useMemo(() => {
    return mapMarkers.map(marker => [marker.lat, marker.lon] as [number, number]);
  }, [mapMarkers]);

  // Current location (most recent marker)
  const currentLocation = useMemo(() => {
    if (mapMarkers.length === 0) return null;
    return mapMarkers[mapMarkers.length - 1];
  }, [mapMarkers]);

  // Statistics based on filtered markers
  const stats = useMemo(() => {
    const countries = new Set<string>();

    filteredMarkers.forEach(m => {
      if (m.location) countries.add(m.location);
    });

    return {
      countries: countries.size,
      totalDays: 0, // Not tracked in current implementation
      totalPhotos: filteredMarkers.filter(m => m.type === 'media').length,
      totalArticles: filteredMarkers.filter(m => m.type === 'article').length,
      totalPlaces: filteredMarkers.filter(m => m.type === 'place').length,
      totalNotes: filteredMarkers.filter(m => m.type === 'note').length,
    };
  }, [filteredMarkers]);

  // Initialize map immediately
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    console.log('🗺️ Map: Initializing...');

    const map = L.map(mapRef.current).setView(center, zoom);
    mapInstanceRef.current = map;

    // Add tiles (OpenStreetMap only)
    tileLayerRef.current = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    }).addTo(map);

    // Event listeners
    map.on('moveend', () => {
      const mapCenter = map.getCenter();
      setCenter([mapCenter.lat, mapCenter.lng]);
    });

    map.on('zoomend', () => {
      setZoom(map.getZoom());
    });

    // Always invalidate map size on window resize
    map.invalidateSize();

    console.log('✅ Map: Initialized');

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update markers
  useEffect(() => {
    if (!mapInstanceRef.current) {
      console.log('⚠️ Map: Map instance not ready');
      return;
    }

    console.log('🗺️ Map: Updating', mapMarkers.length, 'markers');

    // Remove existing markers
    markersRef.current.forEach(marker => {
      mapInstanceRef.current!.removeLayer(marker);
    });
    markersRef.current = [];

    // Add new markers
    mapMarkers.forEach((marker) => {
      const isCurrentLocation = currentLocation?.id === marker.id;

      const leafletMarker = L.marker([marker.lat, marker.lon], {
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
      title.innerHTML = `${marker.title || 'Beitrag'}${isCurrentLocation ? '<span class="bg-red-500 text-white px-2 py-0.5 rounded text-xs ml-2">AKTUELL</span>' : ''}`;

      const date = document.createElement('p');
      date.className = 'text-sm text-gray-600 dark:text-gray-400';
      date.textContent = new Date(marker.createdAt * 1000).toLocaleDateString('de-DE');

      popupContent.appendChild(title);
      popupContent.appendChild(date);

      if (marker.summary) {
        const desc = document.createElement('p');
        desc.className = 'text-sm';
        desc.textContent = marker.summary;
        popupContent.appendChild(desc);
      }

      const badges = document.createElement('div');
      badges.className = 'flex gap-1 flex-wrap';

      const typeIcons: Record<string, string> = {
        'media': '📸',
        'note': '💬',
        'place': '📍',
        'article': '📝',
      };

      if (marker.type) {
        const badge = document.createElement('span');
        badge.className = 'bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded text-xs';
        badge.textContent = typeIcons[marker.type] || '📝';
        badges.appendChild(badge);
      }

      popupContent.appendChild(badges);

      leafletMarker.bindPopup(popupContent);
      leafletMarker.addTo(mapInstanceRef.current);
      markersRef.current.push(leafletMarker);
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
    if (mapMarkers.length > 0) {
      const bounds = L.latLngBounds(mapMarkers.map(m => [m.lat, m.lon] as [number, number]));
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
      console.log('✅ Map: Fitted bounds to', mapMarkers.length, 'markers');
    } else {
      console.log('ℹ️ Map: No markers to show, using default view');
    }

  }, [mapMarkers, currentLocation, showRoute, routePoints]);

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
            {/* Filter Tabs - Icons with badges and Route Toggle */}
            <div className="flex flex-wrap items-center justify-center gap-4 mb-4">
              <Button
                variant={activeFilter === 'all' ? 'default' : 'outline'}
                size="lg"
                onClick={() => setActiveFilter('all')}
                className="relative p-3"
              >
                <BarChart3 className="h-6 w-6" />
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {mapMarkers.length}
                </Badge>
              </Button>
              <Button
                variant={activeFilter === 'articles' ? 'default' : 'outline'}
                size="lg"
                onClick={() => setActiveFilter('articles')}
                className="relative p-3"
              >
                <FileText className="h-6 w-6" />
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {stats.totalArticles}
                </Badge>
              </Button>
              <Button
                variant={activeFilter === 'places' ? 'default' : 'outline'}
                size="lg"
                onClick={() => setActiveFilter('places')}
                className="relative p-3"
              >
                <Home className="h-6 w-6" />
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {stats.totalPlaces}
                </Badge>
              </Button>
              <Button
                variant={activeFilter === 'images' ? 'default' : 'outline'}
                size="lg"
                onClick={() => setActiveFilter('images')}
                className="relative p-3"
              >
                <Image className="h-6 w-6" />
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {stats.totalPhotos}
                </Badge>
              </Button>
              <Button
                variant={activeFilter === 'notes' ? 'default' : 'outline'}
                size="lg"
                onClick={() => setActiveFilter('notes')}
                className="relative p-3"
              >
                <MessageCircle className="h-6 w-6" />
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {stats.totalNotes}
                </Badge>
              </Button>

              {/* Separator */}
              <div className="w-px h-8 bg-border mx-2"></div>

              {/* Route Toggle */}
              <div className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg">
                <Switch
                  id="show-route"
                  checked={showRoute}
                  onCheckedChange={setShowRoute}
                />
                <Label htmlFor="show-route" className="text-sm font-medium cursor-pointer whitespace-nowrap">
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
