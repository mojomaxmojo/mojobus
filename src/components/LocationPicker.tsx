/**
 * Location Picker Component
 * Allows users to select a location via search, current position, or manual input
 *
 * Phase 1: Search + Current Position (no map)
 */

import { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, Search, X, CheckCircle, Loader2, AlertCircle } from '@/lib/icons';
import type { GpsData, LocationData } from '@/lib/gpsExtraction';

interface SearchResult {
  lat: number;
  lon: number;
  display_name: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    suburb?: string;
    county?: string;
    country?: string;
    country_code?: string;
  };
}

interface LocationPickerProps {
  /** Callback when location is selected */
  onLocationSelect: (gps: GpsData, locationData: LocationData) => void;
  /** Initial search query */
  initialQuery?: string;
  /** Optional className for styling */
  className?: string;
}

export function LocationPicker({ onLocationSelect, initialQuery = '', className = '' }: LocationPickerProps) {
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounce search to avoid too many API calls
  const performSearch = useCallback(async (query: string) => {
    if (!query || query.length < 3) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1&accept-language=de,en`,
        {
          headers: {
            'User-Agent': 'MojoBus/1.0 (nostr:npub1f4vym2mu3q9fsz08muz8d469hl568l5358qx90qlaspyuz67ru0sfxvupf)'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      setSearchResults(data);
    } catch (err) {
      console.error('[LocationPicker] Search failed:', err);
      setError('Suche fehlgeschlagen. Bitte versuchen Sie es erneut.');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, performSearch]);

  // Get current position using Browser Geolocation API
  const getCurrentPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation wird von diesem Browser nicht unterstützt.');
      return;
    }

    setIsGettingLocation(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        // Reverse geocode to get location name
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1&accept-language=de,en`,
            {
              headers: {
                'User-Agent': 'MojoBus/1.0 (nostr:npub1f4vym2mu3q9fsz08muz8d469hl568l5358qx90qlaspyuz67ru0sfxvupf)'
              }
            }
          );

          if (!response.ok) {
            throw new Error('Reverse geocoding failed');
          }

          const data = await response.json();

          const locationData: LocationData = {
            city: data.address?.city || data.address?.town || data.address?.village || data.address?.suburb,
            country: data.address?.country,
            countryCode: data.address?.country_code?.toUpperCase(),
            county: data.address?.county,
            suburb: data.address?.suburb,
            fullAddress: data.display_name,
            display_name: data.display_name
          };

          const gpsData: GpsData = {
            latitude,
            longitude,
            precision: 'medium',
            altitude: position.coords.altitude || undefined
          };

          onLocationSelect(gpsData, locationData);
          setSearchQuery(data.display_name || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
        } catch (err) {
          console.error('[LocationPicker] Reverse geocoding failed:', err);
          // Even if reverse geocoding fails, we still have the coordinates
          const gpsData: GpsData = {
            latitude,
            longitude,
            precision: 'medium',
            altitude: position.coords.altitude || undefined
          };

          onLocationSelect(gpsData, {
            display_name: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
          });
          setSearchQuery(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
        }
      },
      (err) => {
        console.error('[LocationPicker] Geolocation failed:', err);
        setError('Standort konnte nicht ermittelt werden. Bitte geben Sie einen Ort ein.');
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }, [onLocationSelect]);

  // Handle search result selection
  const handleResultSelect = useCallback((result: SearchResult) => {
    const locationData: LocationData = {
      city: result.address?.city || result.address?.town || result.address?.village || result.address?.suburb,
      country: result.address?.country,
      countryCode: result.address?.country_code?.toUpperCase(),
      county: result.address?.county,
      suburb: result.address?.suburb,
      fullAddress: result.display_name,
      display_name: result.display_name
    };

    const gpsData: GpsData = {
      latitude: result.lat,
      longitude: result.lon,
      precision: 'high'
    };

    onLocationSelect(gpsData, locationData);
    setSearchQuery(result.display_name);
    setSearchResults([]);
  }, [onLocationSelect]);

  return (
    <Card className={className}>
      <CardContent className="pt-6 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Standort auswählen</h3>
        </div>

        {/* Current Position Button */}
        <Button
          type="button"
          variant="outline"
          onClick={getCurrentPosition}
          disabled={isGettingLocation}
          className="w-full"
        >
          {isGettingLocation ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Standort wird ermittelt...
            </>
          ) : (
            <>
              <Navigation className="h-4 w-4 mr-2" />
              Meine Position verwenden
            </>
          )}
        </Button>

        {/* Divider */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="flex-1 h-px bg-border" />
          <span>oder suchen Sie nach einem Ort</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Ort suchen (z.B. Bucharest, Berlin, Strand)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-8"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSearchResults([]);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-start gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            <p className="text-sm text-muted-foreground">
              {isSearching ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Suchen...
                </span>
              ) : (
                `${searchResults.length} Ergebnis${searchResults.length !== 1 ? 'se' : ''} gefunden`
              )}
            </p>

            {searchResults.map((result, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleResultSelect(result)}
                className="w-full text-left p-3 rounded-lg border hover:bg-accent hover:border-accent transition-all"
              >
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {result.address?.city ||
                       result.address?.town ||
                       result.address?.village ||
                       result.display_name.split(',')[0]}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-1">
                      {result.display_name}
                    </p>
                  </div>
                  <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                </div>
              </button>
            ))}
          </div>
        )}

        {/* No Results */}
        {searchQuery.length >= 3 && !isSearching && searchResults.length === 0 && !error && (
          <div className="text-center py-4 text-sm text-muted-foreground">
            <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Keine Ergebnisse für "{searchQuery}" gefunden</p>
            <p className="text-xs mt-1">Versuchen Sie es mit einem anderen Begriff</p>
          </div>
        )}

        {/* Info */}
        <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
          <Search className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <div className="space-y-1">
            <p>
              <strong>Tipp:</strong> Geben Sie Stadt, Land oder einen markanten Ort ein
            </p>
            <p className="opacity-75">
              Die GPS-Koordinaten werden automatisch ermittelt und im Bild gespeichert
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
