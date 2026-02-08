/**
 * MapPreview Component
 *
 * Simple map preview using static maps
 * Lazy-loaded to reduce initial bundle size
 */

import { useState } from 'react';
import { MapPin, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export interface MapPreviewProps {
  /** Latitude */
  lat: number;
  /** Longitude */
  lon: number;
  /** Location name for display */
  location?: string;
  /** Called when user clicks on location in map */
  onLocationClick?: (location: string) => void;
  /** Zoom level (1-20) */
  zoom?: number;
  /** Map height */
  height?: string;
  /** Custom class name */
  className?: string;
}

export function MapPreview({
  lat,
  lon,
  location,
  onLocationClick,
  zoom = 15,
  height = '256px',
  className = ''
}: MapPreviewProps) {
  const [mapError, setMapError] = useState(false);

  // Using OpenStreetMap static map (free, no API key required)
  const mapImageUrl = `https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lon}&zoom=${zoom}&size=600x400&maptype=mapnik&markers=${lat},${lon},red`;

  const googleMapsUrl = `https://www.google.com/maps?q=${lat},${lon}`;

  const handleMapError = () => {
    setMapError(true);
  };

  return (
    <Card className={`${className}`}>
      <CardContent className="p-0">
        <div className="relative" style={{ height }}>
          {/* Map Image */}
          {!mapError ? (
            <img
              src={mapImageUrl}
              alt={`Map of ${location || `${lat}, ${lon}`}`}
              className="w-full h-full object-cover"
              onError={handleMapError}
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <div className="text-center space-y-2 p-4">
                <MapPin className="h-8 w-8 mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Karte konnte nicht geladen werden
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(googleMapsUrl, '_blank')}
                  className="text-xs"
                >
                  In Google Maps öffnen
                </Button>
              </div>
            </div>
          )}

          {/* Location Marker Overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative">
              <div className="absolute -inset-4 bg-red-500/30 rounded-full animate-ping" />
              <div className="relative">
                <MapPin className="h-8 w-8 text-red-500 drop-shadow-lg" />
              </div>
            </div>
          </div>

          {/* Info Overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
            <div className="text-white space-y-1">
              {location && (
                <p className="font-medium text-sm">{location}</p>
              )}
              <p className="text-xs text-white/80 font-mono">
                {lat.toFixed(4)}°, {lon.toFixed(4)}°
              </p>
            </div>
          </div>

          {/* External Link Button */}
          <div className="absolute top-2 right-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => window.open(googleMapsUrl, '_blank')}
              className="h-8 w-8 p-0 bg-white/90 hover:bg-white"
              title="In Google Maps öffnen"
            >
              <ExternalLink className="h-4 w-4 text-gray-700" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
