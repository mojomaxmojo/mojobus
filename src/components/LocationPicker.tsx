import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Maximize2, Minimize2, Check, Map as MapIcon, Crosshair } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GpsData } from '@/lib/gpsExtraction';
import { reverseGeocode, mapCountryCode } from '@/lib/gpsExtraction';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for Leaflet default markers in bundled applications
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

/**
 * Props for LocationPicker Component
 */
export interface LocationPickerProps {
  /** Current GPS data */
  gps?: GpsData;
  /** Callback when GPS coordinates are saved */
  onSave: (gps: GpsData) => void;
  /** Callback when editing is cancelled */
  onCancel: () => void;
  /** Initial zoom level */
  initialZoom?: number;
  /** Height of map */
  height?: string;
  /** Callback when country is detected from GPS */
  onCountryDetected?: (country: string) => void;
  /** Callback when location text is detected from GPS */
  onLocationDetected?: (location: string) => void;
}

/**
 * Main LocationPicker Component
 * Uses pure Leaflet instead of react-leaflet
 */
export function LocationPicker({
  gps,
  onSave,
  onCancel,
  initialZoom = 6,
  height = '400px',
  onCountryDetected,
  onLocationDetected,
}: LocationPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  // State
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(
    gps && gps.lat && gps.lon ? { lat: gps.lat, lon: gps.lon } : null
  );
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [locationText, setLocationText] = useState(gps?.location || '');
  const [country, setCountry] = useState(gps?.country || '');
  const [isLoading, setIsLoading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  // Get tile URL
  const getTileUrl = () => {
    return 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
  };

  // Initialize map
  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize map
    const map = L.map(mapRef.current).setView(
      selectedLocation ? [selectedLocation.lat, selectedLocation.lon] : [54.5260, 15.2551],
      selectedLocation ? initialZoom : 4
    );

    mapInstanceRef.current = map;

    // Add tiles
    tileLayerRef.current = L.tileLayer(getTileUrl(), {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 19
    }).addTo(map);

    // Add marker if initial location exists
    if (selectedLocation) {
      const marker = L.marker([selectedLocation.lat, selectedLocation.lon])
        .addTo(map)
        .bindPopup(`📍 Location: ${selectedLocation.lat.toFixed(6)}, ${selectedLocation.lon.toFixed(6)}`)
        .openPopup();
      markerRef.current = marker;
    }

    // Add click handler
    map.on('click', async (e) => {
      const { lat, lng } = e.latlng;

      // Remove existing marker
      if (markerRef.current) {
        map.removeLayer(markerRef.current);
      }

      // Add new marker
      const marker = L.marker([lat, lng])
        .addTo(map)
        .bindPopup(`📍 Selected: ${lat.toFixed(6)}, ${lng.toFixed(6)}`)
        .openPopup();

      markerRef.current = marker;
      setSelectedLocation({ lat, lon: lng });

      // Reverse geocode
      setIsLoading(true);
      try {
        const locationData = await reverseGeocode(lat, lng);
        setLocationText(locationData.location || '');
        setCountry(locationData.country || '');
        onCountryDetected?.(locationData.country || '');
        onLocationDetected?.(locationData.location || '');
      } catch (err) {
        console.warn('[LocationPicker] Reverse geocoding failed:', err);
      } finally {
        setIsLoading(false);
      }
    });

    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []); // Only run on mount

  // Update marker when selectedLocation changes from GPS
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedLocation) return;

    // Remove existing marker
    if (markerRef.current) {
      mapInstanceRef.current.removeLayer(markerRef.current);
    }

    // Add new marker
    const marker = L.marker([selectedLocation.lat, selectedLocation.lon])
      .addTo(mapInstanceRef.current)
      .bindPopup(`📍 Location: ${selectedLocation.lat.toFixed(6)}, ${selectedLocation.lon.toFixed(6)}`)
      .openPopup();

    markerRef.current = marker;

    // Center map on new location
    mapInstanceRef.current.setView([selectedLocation.lat, selectedLocation.lon], initialZoom);
  }, [selectedLocation, initialZoom]);

  // Handle save
  const handleSave = () => {
    if (!selectedLocation) return;

    const gpsData: GpsData = {
      lat: selectedLocation.lat,
      lon: selectedLocation.lon,
      location: locationText,
      country: country,
      accuracy: 10,
      timestamp: Date.now(),
      provider: 'manual'
    };

    onSave(gpsData);
  };

  // Handle current location
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        // Update map
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([latitude, longitude], 15);
        }

        // Update marker
        if (markerRef.current) {
          mapInstanceRef.current?.removeLayer(markerRef.current);
        }

        if (mapInstanceRef.current) {
          const marker = L.marker([latitude, longitude])
            .addTo(mapInstanceRef.current)
            .bindPopup(`📍 Current: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`)
            .openPopup();

          markerRef.current = marker;
        }

        setSelectedLocation({ lat: latitude, lon: longitude });

        // Reverse geocode
        setIsLoading(true);
        try {
          const locationData = await reverseGeocode(latitude, longitude);
          setLocationText(locationData.location || '');
          setCountry(locationData.country || '');
          onCountryDetected?.(locationData.country || '');
          onLocationDetected?.(locationData.location || '');
        } catch (err) {
          console.warn('[LocationPicker] Reverse geocoding failed:', err);
        } finally {
          setIsLoading(false);
        }

        setIsLocating(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        alert('Unable to get your current location. Please check your browser permissions.');
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  return (
    <div className="space-y-4">
      {/* Map Container */}
      <div
        className={cn(
          "relative rounded-lg overflow-hidden border",
          isFullscreen && "fixed inset-0 z-50 rounded-none"
        )}
        style={{ height: isFullscreen ? '100vh' : height }}
      >
        <div ref={mapRef} className="w-full h-full" />

        {/* Controls */}
        <div className="absolute top-4 right-4 flex gap-2 z-[1000]">
          <Button
            size="icon"
            variant="secondary"
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
          </Button>
          <Button
            size="icon"
            variant="secondary"
            onClick={handleGetCurrentLocation}
            disabled={isLocating}
            title="Get Current Location"
          >
            <Crosshair className={cn("h-5 w-5", isLocating && "animate-spin")} />
          </Button>
        </div>

        {/* Instructions */}
        <div className="absolute bottom-4 left-4 right-4 z-[1000]">
          <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-lg p-3 shadow-lg text-sm">
            <p className="font-medium mb-1">📍 Click on the map to select location</p>
            <p className="text-xs text-muted-foreground">
              {selectedLocation
                ? `Selected: ${selectedLocation.lat.toFixed(6)}, ${selectedLocation.lon.toFixed(6)}`
                : 'Click anywhere on the map'}
            </p>
          </div>
        </div>
      </div>

      {/* Location Info */}
      {selectedLocation && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="location-text" className="text-sm font-medium">Location</Label>
              <Input
                id="location-text"
                value={locationText}
                onChange={(e) => setLocationText(e.target.value)}
                placeholder="e.g., Paris, France"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="country" className="text-sm font-medium">Country</Label>
              <Input
                id="country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="e.g., France"
                className="mt-1"
              />
            </div>
          </div>

          {isLoading && (
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
              Reverse geocoding...
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              disabled={!selectedLocation}
              className="flex-1"
            >
              <Check className="h-4 w-4 mr-2" />
              Save Location
            </Button>
            <Button
              onClick={onCancel}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
