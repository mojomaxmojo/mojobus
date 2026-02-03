import { useEffect, useRef, useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { useNavigate } from 'react-router-dom';
import type { NostrEvent } from '@nostrify/nostrify';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Loader2 } from '@/lib/icons';

// Load Leaflet CSS directly - will be bundled by Vite in leaflet-vendor chunk
import 'leaflet/dist/leaflet.css';

// Country coordinates (fallback for events without GPS)
const COUNTRY_COORDINATES: Record<string, [number, number]> = {
  portugal: [39.3999, -8.2245],      // Lisbon
  spanien: [40.4168, -3.7038],       // Madrid
  frankreich: [48.8566, 2.3522],     // Paris
  belgien: [50.8503, 4.3517],        // Brussels
  luxemburg: [49.8153, 6.1296],      // Luxembourg City
  deutschland: [52.5200, 13.4050],   // Berlin,
};

interface Location {
  lat: number;
  lng: number;
  title: string;
  location?: string;
  country?: string;
  imageUrl?: string;
  description?: string;
  event: NostrEvent;
}

export function MapPage() {
  const { nostr } = useNostr();
  const navigate = useNavigate();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInitializedRef = useRef(false);
  const [isMapReady, setIsMapReady] = useState(false);

  // Query all articles and places with location data
  const { data: events, isLoading } = useQuery({
    queryKey: ['map-events'],
    queryFn: async () => {
      const signal = AbortSignal.any([AbortSignal.timeout(5000)]);

      // Query all media events from /veroeffentlichen (kind 1) and Articles/Places (kind 30023, 30025)
      const results = await nostr.query([
        { kinds: [1, 30023, 30025], limit: 300 },
      ], { signal });

      console.log('Map events loaded:', results?.length, 'events');
      return results;
    },
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Extract locations from events
  const locations = useMemo(() => {
    if (!events) return [];

    const locs: Location[] = [];

    // Country list for matching
    const countryList = ['portugal', 'spanien', 'frankreich', 'belgien', 'deutschland', 'luxemburg'];

    events.forEach((event) => {
      const tags = event.tags;

      // Extract title - for kind 1, title is in content (first line with #)
      // for kind 30023/30025, title is in title tag
      let title = tags.find((t: string[]) => t[0] === 'title')?.[1];
      if (!title && event.kind === 1) {
        const contentLines = event.content.trim().split('\n');
        const titleMatch = contentLines[0]?.match(/^#\s+(.+)$/);
        if (titleMatch) {
          title = titleMatch[1].trim();
        } else {
          title = contentLines[0]?.substring(0, 50) || 'Ohne Titel';
        }
      }

      const location = tags.find((t: string[]) => t[0] === 'location')?.[1];

      // Find image - from image tag or content URLs
      let imageUrl = tags.find((t: string[]) => t[0] === 'image')?.[1];
      if (!imageUrl && event.kind === 1) {
        // Extract first URL from content
        const urlMatch = event.content.match(/https?:\/\/[^\s\n]+/);
        if (urlMatch) {
          imageUrl = urlMatch[0];
        }
      }

      const summary = tags.find((t: string[]) => t[0] === 'summary')?.[1];

      // Find country from 't' tags (used in Publish.tsx)
      const countryTag = tags.find((t: string[]) => t[0] === 't' && countryList.includes(t[1]?.toLowerCase()));
      const country = countryTag?.[1];

      // Extract GPS coordinates from lat/lon tags
      const latTag = tags.find((t: string[]) => t[0] === 'lat')?.[1];
      const lonTag = tags.find((t: string[]) => t[0] === 'lon')?.[1];

      let lat: number | undefined;
      let lng: number | undefined;

      // Use GPS coordinates if available
      if (latTag && lonTag) {
        lat = parseFloat(latTag);
        lng = parseFloat(lonTag);
      } else if (country) {
        // Fallback to country coordinates
        const countryKey = Object.keys(COUNTRY_COORDINATES).find(
          (key) => key === country.toLowerCase() || key.includes(country.toLowerCase())
        );
        if (countryKey) {
          const coords = COUNTRY_COORDINATES[countryKey];
          lat = coords[0];
          lng = coords[1];
        }
      }

      if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
        locs.push({
          lat,
          lng,
          title: title || 'Ohne Titel',
          location,
          country: country ? country.charAt(0).toUpperCase() + country.slice(1) : undefined,
          imageUrl,
          description: summary,
          event,
        });
      } else if (country) {
        // Debug: Log events with country but no coordinates
        console.log('Event with country but no coordinates:', {
          title,
          country,
          latTag,
          lonTag,
          hasLatLon: !!(latTag && lonTag),
        });
      }
    });

    console.log('Extracted locations:', locs.length, 'from', events.length, 'events');
    return locs;
  }, [events]);

  // Initialize map with Leaflet (lazy loaded - only when /map is visited)
  useEffect(() => {
    if (!mapRef.current || mapInitializedRef.current || !isMapReady || locations.length === 0) return;

    const initializeMap = async () => {
      try {
        // Wait a bit for DOM to be ready
        await new Promise(resolve => setTimeout(resolve, 50));

        // Dynamic import of Leaflet - lazy loaded to avoid impacting initial bundle size
        const L = await import('leaflet');

        // Fix default icon issue with Vite
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        });

        // Create map centered on Europe
        const map = L.map(mapRef.current).setView([50.0, 10.0], 4);

        // Add OpenStreetMap tile layer (100% FREE!)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 18,
        }).addTo(map);

        // Add markers for each location
        console.log('Adding markers to map...');
        let markerCount = 0;

        locations.forEach((loc, index) => {
          console.log(`Marker ${index}:`, {
            lat: loc.lat,
            lng: loc.lng,
            title: loc.title,
            hasCountry: !!loc.country,
            hasLocation: !!loc.location,
          });

          const marker = L.marker([loc.lat, loc.lng]).addTo(map);
          markerCount++;

          // Create popup content
          const popupContent = document.createElement('div');
          popupContent.className = 'space-y-3 p-1';
          popupContent.style.minWidth = '250px';
          popupContent.style.maxWidth = '350px';

          if (loc.imageUrl) {
            const img = document.createElement('img');
            img.src = loc.imageUrl;
            img.alt = loc.title;
            img.style.width = '100%';
            img.style.height = '150px';
            img.style.objectFit = 'cover';
            img.style.borderRadius = '8px';
            img.style.marginBottom = '8px';
            popupContent.appendChild(img);
          }

          const titleDiv = document.createElement('div');
          const title = document.createElement('h3');
          title.className = 'font-semibold text-lg mb-1';
          title.textContent = loc.title;
          titleDiv.appendChild(title);

          if (loc.location) {
            const locP = document.createElement('p');
            locP.className = 'text-sm text-muted-foreground flex items-center gap-1';
            locP.textContent = `📍 ${loc.location}`;
            titleDiv.appendChild(locP);
          }

          if (loc.country) {
            const badge = document.createElement('span');
            badge.className = 'inline-block px-2 py-1 text-xs border rounded';
            badge.textContent = loc.country;
            titleDiv.appendChild(badge);
          }

          popupContent.appendChild(titleDiv);

          if (loc.description) {
            const descP = document.createElement('p');
            descP.className = 'text-sm text-muted-foreground';
            descP.style.overflow = 'hidden';
            descP.style.textOverflow = 'ellipsis';
            descP.style.display = '-webkit-box';
            descP.style.webkitLineClamp = '2';
            descP.style.webkitBoxOrient = 'vertical';
            descP.textContent = loc.description;
            popupContent.appendChild(descP);
          }

          const button = document.createElement('button');
          button.className = 'w-full text-center px-3 py-2 bg-[#ec1a58] text-white border-none rounded font-medium text-sm cursor-pointer';
          button.textContent = 'Details anzeigen';
          button.onclick = () => navigate('/artikel');
          popupContent.appendChild(button);

          marker.bindPopup(popupContent);
        });

        console.log('Total markers added:', markerCount);

        mapInitializedRef.current = true;
        console.log('Map initialized with', locations.length, 'markers');

        // Cleanup
        return () => {
          map.remove();
        };
      } catch (error) {
        console.error('Error initializing map:', error);
      }
    };

    initializeMap();
  }, [isMapReady, locations, navigate]);

  // Set map ready after component mounts
  useEffect(() => {
    setIsMapReady(true);
  }, []);

  // Group locations by country
  const countryGroups = useMemo(() => {
    const groups: Record<string, { count: number; flag?: string }> = {};

    locations.forEach((loc) => {
      if (loc.country) {
        const key = loc.country.toLowerCase();
        groups[key] = {
          count: (groups[key]?.count || 0) + 1,
        };
      }
    });

    return groups;
  }, [locations]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Karte wird geladen...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">🌍 Unsere Reise</h1>
            <p className="text-muted-foreground text-lg">
              Alle Orte, die wir auf unserem Perpetual Traveler Abenteuer besucht haben
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-4 flex-wrap">
          <Badge variant="secondary" className="text-sm px-4 py-2">
            <MapPin className="h-4 w-4 mr-2" />
            {locations.length} Orte
          </Badge>
          <Badge variant="secondary" className="text-sm px-4 py-2">
            <span className="mr-2">🌎</span>
            {Object.keys(countryGroups).length} Länder
          </Badge>
        </div>
      </div>

      {/* Map */}
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Europakarte
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div ref={mapRef} className="h-[600px] w-full" style={{ minHeight: '600px' }} />
        </CardContent>
      </Card>

      {/* Empty state */}
      {locations.length === 0 && (
        <Card className="mt-8 border-dashed">
          <CardContent className="py-12 px-8 text-center">
            <div className="max-w-sm mx-auto space-y-4">
              <MapPin className="h-12 w-12 mx-auto text-muted-foreground" />
              <p className="text-muted-foreground">
                Noch keine Orte auf der Karte. Veröffentliche Artikel mit GPS-Koordinaten oder Länder-Tags!
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Country List */}
      {Object.keys(countryGroups).length > 0 && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Besuchte Länder</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {Object.entries(countryGroups).map(([country, data]) => {
                const countryKey = Object.keys(COUNTRY_COORDINATES).find(
                  (k) => k === country || k.includes(country)
                );
                const countryName = countryKey
                  ? countryKey.charAt(0).toUpperCase() + countryKey.slice(1)
                  : country;

                return (
                  <div
                    key={country}
                    className="flex items-center gap-2 p-3 rounded-lg border hover:bg-muted transition-colors"
                  >
                    <span className="text-2xl">🌍</span>
                    <div>
                      <div className="font-medium">{countryName}</div>
                      <div className="text-xs text-muted-foreground">{data.count} Orte</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
