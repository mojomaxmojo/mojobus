import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { MapPin, Globe2, Filter, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLongformArticles, extractArticleMetadata } from '@/hooks/useLongformArticles';
import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import { NOSTR_CONFIG } from '@/config/nostr';
import { useHead } from '@unhead/react';
import type { NostrEvent } from '@nostrify/nostrify';
import { nip19 } from 'nostr-tools';

type Place = {
  id: string;
  title: string;
  summary?: string;
  image?: string;
  location?: string;
  country?: string;
  lat?: number;
  lon?: number;
  event: NostrEvent;
  naddr: string;
};

// European SVG coordinates
type MapCoordinates = {
  lat: number;
  lon: number;
  x: number;
  y: number;
};

// Convert GPS coordinates to SVG coordinates for Europe
function convertGPSToSVG(lat: number, lon: number): MapCoordinates {
  // Europe bounds
  const minLat = 34.0;
  const maxLat = 72.0;
  const minLon = -25.0;
  const maxLon = 45.0;

  // SVG viewBox
  const viewBoxWidth = 700;
  const viewBoxHeight = 500;
  const padding = 40;

  // Normalize coordinates
  const normalizedLat = (lat - minLat) / (maxLat - minLat);
  const normalizedLon = (lon - minLon) / (maxLon - minLon);

  // Convert to SVG coordinates (y is inverted)
  const x = padding + normalizedLon * (viewBoxWidth - 2 * padding);
  const y = padding + (1 - normalizedLat) * (viewBoxHeight - 2 * padding);

  return { lat, lon, x, y };
}

export function WorldMap() {
  const { nostr } = useNostr();
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);

  // SEO Meta Tags
  useHead({
    title: 'Europakarte - MojoBus',
    meta: [
      { name: 'description', content: 'Entdecke alle unsere Reiseziele in Europa auf der Karte. Von Portugal bis Spanien - unser Leben als Perpetual Traveler.' },
      { name: 'keywords', content: 'Europakarte, Reisekarte, Portugal, Spanien, Vanlife, Offgrid' },
      { property: 'og:title', content: 'Europakarte - MojoBus' },
      { property: 'og:description', content: 'Entdecke alle unsere Reiseziele in Europa auf der Karte.' },
      { property: 'og:type', content: 'website' }
    ],
      link: [
        { rel: 'canonical', href: 'https://mojobus.co/karte' }
      ]
  });

  // Fetch places with GPS coordinates
  const { data: places, isLoading } = useQuery({
    queryKey: ['places-with-gps', NOSTR_CONFIG.authorPubkeys],
    queryFn: async ({ signal }) => {
      // Query for place events (Kind 30025), articles (Kind 30023), or media notes (Kind 1)
      const events = await nostr.query([
        {
          kinds: [1, 30023, 30025], // Notes with media, Articles, and Places
          authors: NOSTR_CONFIG.authorPubkeys,
          limit: 100,
        }
      ], { signal });

      console.log('[Weltkarte] Events gefetcht:', events.length, 'Events');

      // Extract location data from events
      const placesWithCoords: Place[] = events
        .map((event) => {
          const metadata = extractArticleMetadata(event);
          const d = event.tags.find(([name]) => name === 'd')?.[1] ?? '';
          const location = event.tags.find(([name]) => name === 'location')?.[1];
          const country = event.tags.find(([name]) => name === 'country')?.[1];

          // Try to extract GPS from various tags
          const lat = event.tags.find(([name]) => name === 'lat')?.[1];
          const lon = event.tags.find(([name]) => name === 'lon')?.[1];
          const g = event.tags.find(([name]) => name === 'g')?.[1]; // Geohash

          console.log('[Weltkarte] Event:', event.kind, 'hasGPS:', !!(lat && lon), 'hasCountry:', !!country, 'title:', metadata.title);

          // Parse coordinates if available
          let coords: { lat: number; lon: number } | undefined;

          if (lat && lon) {
            coords = {
              lat: parseFloat(lat),
              lon: parseFloat(lon),
            };
          }

          // If no direct coords, use approximations based on country
          if (!coords && country) {
            coords = getCountryCoords(country);
          }

          if (!coords) return null;

          // Create naddr for linking - different logic for kind 1
          let naddr: string;
          if (event.kind === 1) {
            // For kind 1, use note1 encoding
            naddr = nip19.noteEncode(event.id);
          } else {
            // For other kinds, use naddr encoding
            naddr = nip19.naddrEncode({
              kind: event.kind,
              pubkey: event.pubkey,
              identifier: metadata.identifier || d,
            });
          }

          return {
            id: event.id,
            title: metadata.title || (event.content?.substring(0, 50) || 'Ohne Titel'),
            summary: metadata.summary,
            image: metadata.image,
            location,
            country,
            lat: coords.lat,
            lon: coords.lon,
            event,
            naddr,
          };
        })
        .filter((place): place is Place => place !== null);

      console.log('[Weltkarte] Orte mit GPS:', placesWithCoords.length, 'Orte');

      return placesWithCoords;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Get unique countries for filter
  const countries = places
    ? Array.from(new Set(places.map(p => p.country).filter(Boolean)))
    : [];

  const filteredPlaces = selectedCountry
    ? places?.filter(p => p.country === selectedCountry)
    : places;

  // Convert places to SVG coordinates
  const placeMarkers = filteredPlaces?.map(place => {
    if (place.lat && place.lon) {
      return {
        ...place,
        svgCoords: convertGPSToSVG(place.lat, place.lon),
      };
    }
    return null;
  }).filter(Boolean) || [];

  return (
    <div className="min-h-screen">
      {/* Header Section */}
      <section className="py-12 bg-gradient-to-br from-primary/30 via-accent/20 to-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <div className="flex items-center justify-center gap-3">
              <Globe2 className="h-12 w-12 text-primary" />
              <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
                Unsere <span className="gradient-text">Europakarte</span>
              </h1>
            </div>
            <p className="text-xl md:text-2xl text-muted-foreground font-serif leading-relaxed">
              Alle unsere Reiseziele in Europa auf einen Blick
            </p>
            {places && places.length > 0 && (
              <p className="text-muted-foreground">
                {places.length} {places.length === 1 ? 'Ort' : 'Orte'} besucht
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Country Filter */}
            {countries.length > 1 && (
              <Card className="border-primary/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Filter className="h-5 w-5 text-primary" />
                    <Button
                      variant={selectedCountry === null ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedCountry(null)}
                    >
                      Alle Länder
                    </Button>
                    {countries.map((country) => (
                      <Button
                        key={country}
                        variant={selectedCountry === country ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedCountry(country)}
                      >
                        {country}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Static SVG Map */}
            <Card className="overflow-hidden border-2 border-primary/20">
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="h-[500px] w-full flex items-center justify-center">
                    <LoadingSpinner text="Lade Karte..." />
                  </div>
                ) : placeMarkers.length > 0 ? (
                  <div className="relative w-full" style={{ height: '500px' }}>
                    {/* European SVG Map */}
                    <svg
                      viewBox="0 0 700 500"
                      className="w-full h-full"
                      preserveAspectRatio="xMidYMid meet"
                    >
                      {/* Background */}
                      <rect
                        width="700"
                        height="500"
                        fill="hsl(var(--background))"
                        opacity="0.5"
                      />

                      {/* Simplified European countries outline */}
                      <g
                        stroke="hsl(var(--primary))"
                        strokeWidth="0.5"
                        fill="hsl(var(--accent) / 0.1)"
                        opacity="0.6"
                      >
                        {/* Europe outline - simplified */}
                        <path
                          d="M 50 450
                             L 50 300
                             L 100 250
                             L 150 200
                             L 200 180
                             L 250 160
                             L 300 150
                             L 350 140
                             L 400 130
                             L 450 120
                             L 500 110
                             L 550 100
                             L 600 90
                             L 650 80
                             L 650 50
                             L 600 40
                             L 550 50
                             L 500 60
                             L 450 70
                             L 400 80
                             L 350 90
                             L 300 100
                             L 250 110
                             L 200 120
                             L 150 130
                             L 100 140
                             L 50 150
                             L 50 450 Z"
                          fill="none"
                          strokeWidth="1.5"
                          opacity="0.8"
                        />

                        {/* Portugal */}
                        <path
                          d="M 60 370 L 90 365 L 95 395 L 75 400 L 60 395 Z"
                          fill="hsl(var(--accent) / 0.3)"
                        />

                        {/* Spain */}
                        <path
                          d="M 95 365 L 130 360 L 140 400 L 120 420 L 90 410 L 95 365 Z"
                          fill="hsl(var(--accent) / 0.3)"
                        />

                        {/* France */}
                        <path
                          d="M 140 300 L 180 290 L 200 330 L 180 370 L 140 360 Z"
                          fill="hsl(var(--accent) / 0.3)"
                        />

                        {/* Italy */}
                        <path
                          d="M 280 370 L 300 340 L 310 380 L 300 420 L 280 400 L 270 370 Z"
                          fill="hsl(var(--accent) / 0.3)"
                        />

                        {/* Germany */}
                        <path
                          d="M 250 250 L 300 240 L 320 280 L 300 320 L 250 310 Z"
                          fill="hsl(var(--accent) / 0.3)"
                        />

                        {/* Croatia */}
                        <path
                          d="M 320 330 L 340 320 L 350 350 L 330 360 Z"
                          fill="hsl(var(--accent) / 0.3)"
                        />
                      </g>

                      {/* Country labels */}
                      <g
                        fontSize="14"
                        fontWeight="bold"
                        fill="hsl(var(--muted-foreground))"
                        opacity="0.6"
                      >
                        <text x="75" y="385">Portugal</text>
                        <text x="115" y="390">Spanien</text>
                        <text x="160" y="330">Frankreich</text>
                        <text x="280" y="370">Italien</text>
                        <text x="270" y="280">Deutschland</text>
                        <text x="330" y="340">Kroatien</text>
                      </g>

                      {/* Markers */}
                      {placeMarkers.map((marker, index) => {
                        if (!marker.svgCoords) return null;

                        return (
                          <g
                            key={marker.id}
                            transform={`translate(${marker.svgCoords.x}, ${marker.svgCoords.y})`}
                            onClick={() => setSelectedPlace(marker)}
                            className="cursor-pointer hover:scale-125 transition-transform duration-200"
                          >
                            {/* Marker circle */}
                            <circle
                              r="8"
                              fill="hsl(var(--primary))"
                              stroke="hsl(var(--background))"
                              strokeWidth="2"
                              className="hover:r-10 transition-all duration-200"
                            />
                            {/* Marker icon */}
                            <MapPin
                              x="-6"
                              y="-6"
                              width="12"
                              height="12"
                              fill="white"
                              transform="rotate(45 6 6)"
                            />
                          </g>
                        );
                      })}
                    </svg>

                    {/* Place Detail Popup */}
                    {selectedPlace && (
                      <div
                        className="absolute top-4 left-4 right-4 bg-background/95 backdrop-blur-sm border-2 border-primary/20 rounded-xl shadow-2xl p-4 max-w-sm"
                      >
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <h3 className="font-bold text-lg mb-1">{selectedPlace.title}</h3>
                              {selectedPlace.location && (
                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {selectedPlace.location}
                                </p>
                              )}
                              {selectedPlace.country && (
                                <p className="text-xs text-muted-foreground">{selectedPlace.country}</p>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setSelectedPlace(null)}
                            >
                              ✕
                            </Button>
                          </div>
                          {selectedPlace.image && (
                            <img
                              src={selectedPlace.image}
                              alt={selectedPlace.title}
                              className="w-full h-32 object-cover rounded-lg"
                            />
                          )}
                          {selectedPlace.summary && (
                            <p className="text-sm line-clamp-2">{selectedPlace.summary}</p>
                          )}
                          <Button
                            size="sm"
                            className="w-full"
                            asChild
                          >
                            <a href={`/${selectedPlace.naddr}`}>Zum Artikel</a>
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <Card className="border-dashed m-4">
                    <CardContent className="py-20 text-center">
                      <Globe2 className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                      <p className="text-lg text-muted-foreground mb-2">
                        Keine Orte gefunden
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Wir haben noch keine GPS-Koordinaten zu unseren Reisen hinzugefügt.
                      </p>
                      <p className="text-xs text-muted-foreground mt-4">
                        💡 Upload ein Foto mit GPS-Koordinaten auf /veroeffentlichen
                      </p>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>

            {/* Stats Card */}
            {places && places.length > 0 && (
              <Card className="bg-gradient-to-br from-primary/5 to-accent/5">
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                    <div>
                      <p className="text-4xl font-bold text-primary mb-2">
                        {places.length}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {places.length === 1 ? 'Ort' : 'Orte'}
                      </p>
                    </div>
                    <div>
                      <p className="text-4xl font-bold text-accent mb-2">
                        {countries.length}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {countries.length === 1 ? 'Land' : 'Länder'}
                      </p>
                    </div>
                    <div>
                      <p className="text-4xl font-bold text-primary mb-2">
                        {filteredPlaces.length}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Anzeige
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

// Approximate coordinates for countries
function getCountryCoords(country: string): { lat: number; lon: number } | undefined {
  const coords: Record<string, { lat: number; lon: number }> = {
    'Portugal': { lat: 39.5, lon: -8.0 },
    'Spanien': { lat: 40.0, lon: -3.7 },
    'Frankreich': { lat: 46.0, lon: 2.0 },
    'Deutschland': { lat: 51.0, lon: 10.0 },
    'Italien': { lat: 41.9, lon: 12.5 },
    'Marokko': { lat: 31.8, lon: -7.1 },
    'Griechenland': { lat: 39.0, lon: 22.0 },
    'Türkei': { lat: 39.0, lon: 35.0 },
    'Kroatien': { lat: 45.1, lon: 15.2 },
  };

  return coords[country];
}
