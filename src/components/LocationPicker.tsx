import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Maximize2, Minimize2, Check, Map as MapIcon, Crosshair } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GpsData } from '@/lib/gpsExtraction';
import { reverseGeocode, mapCountryCode } from '@/lib/gpsExtraction';
import L from 'leaflet';

interface LocationPickerProps {
  gps?: GpsData;
  onSave: (gps: GpsData) => void;
  onCancel: () => void;
  initialZoom?: number;
  height?: string;
  onCountryDetected?: (country: string) => void;
  onLocationDetected?: (location: string) => void;
}

export function LocationPicker({
  gps,
  onSave,
  onCancel,
  initialZoom = 13,
  height = '400px',
  onCountryDetected,
  onLocationDetected,
}: LocationPickerProps) {
  const [position, setPosition] = useState<[number, number]>(() => {
    if (gps && gps.latitude !== 0 && gps.longitude !== 0) {
      return [gps.latitude, gps.longitude];
    }
    return [39.5, -8.0]; // Default: Portugal
  });

  const [zoom, setZoom] = useState(initialZoom);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [manualLat, setManualLat] = useState(position[0].toFixed(6));
  const [manualLon, setManualLon] = useState(position[1].toFixed(6));
  const [manualAlt, setManualAlt] = useState(gps?.altitude?.toFixed(1) || '0');
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<L.Marker | null>(null);

  // Create custom marker icon
  const createMarkerIcon = (color: string = '#f59e0b') => {
    return L.icon({
      iconUrl: `data:image/svg+xml;base64,${btoa(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="40" height="60">
          <path d="M12 0C5.4 0 0 5.4 0 12c0 8.4 12 24 12 24s12-15.6 12-24c0-6.6-5.4-12-12-12z" fill="${color}" stroke="white" stroke-width="2"/>
          <circle cx="12" cy="12" r="6" fill="white"/>
        </svg>
      `)}`,
      iconSize: [40, 60],
      iconAnchor: [20, 60],
      popupAnchor: [0, -60],
    });
  };

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: position,
      zoom: zoom,
      zoomControl: false,
    });

    mapRef.current = map;

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    // Add marker
    const marker = L.marker(position, {
      icon: createMarkerIcon('#f59e0b'),
      draggable: true,
    }).addTo(map);

    markerRef.current = marker;

    // Handle marker drag
    marker.on('dragend', (e) => {
      const { lat, lng } = e.target.getLatLng();
      setPosition([lat, lng]);
    });

    // Handle map click
    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      setPosition([lat, lng]);

      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      }
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []); // Only run on mount

  // Update marker when position changes
  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.setLatLng(position);
    }
    if (mapRef.current) {
      mapRef.current.setView(position, zoom);
    }
  }, [position, zoom]);

  // Update map size when fullscreen toggles
  useEffect(() => {
    if (mapRef.current) {
      setTimeout(() => {
        mapRef.current?.invalidateSize();
      }, 100);
    }
  }, [isFullscreen]);

  // Sync manual inputs
  useEffect(() => {
    setManualLat(position[0].toFixed(6));
    setManualLon(position[1].toFixed(6));
  }, [position]);

  // Get current location from browser/smartphone
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation wird von diesem Browser nicht unterstützt.');
      return;
    }

    setIsLoadingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, altitude } = position.coords;

        if (latitude === 0 && longitude === 0) {
          alert('Ungültige Position erhalten. Bitte versuchen Sie es erneut.');
          setIsLoadingLocation(false);
          return;
        }

        const newPosition: [number, number] = [latitude, longitude];
        setPosition(newPosition);
        setManualLat(latitude.toFixed(6));
        setManualLon(longitude.toFixed(6));
        setManualAlt(altitude ? altitude.toFixed(1) : '0');

        if (mapRef.current) {
          mapRef.current.setView(newPosition, 16);
        }

        reverseGeocode(latitude, longitude).then(locationData => {
          if (locationData) {
            console.log('[LocationPicker] Reverse geocoding result:', locationData);

            const internalCountry = mapCountryCode(locationData);
            if (internalCountry && onCountryDetected) {
              onCountryDetected(internalCountry);
            }

            const locationParts = [
              locationData.city,
              locationData.neighbourhood,
              locationData.suburb
            ].filter(Boolean);

            if (locationParts.length > 0 && onLocationDetected) {
              onLocationDetected(locationParts.join(', '));
            }
          }
        }).catch(err => {
          console.warn('[LocationPicker] Reverse geocoding failed:', err);
        });

        setIsLoadingLocation(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        let errorMessage = 'Standort konnte nicht abgerufen werden.';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Standort-Zugriff verweigert. Bitte erlaube den Zugriff in den Browsereinstellungen.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Standortinformationen sind nicht verfügbar.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Timeout beim Abrufen des Standorts.';
            break;
        }
        alert(errorMessage);
        setIsLoadingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  // Save handler
  const handleSave = () => {
    const latitude = parseFloat(manualLat);
    const longitude = parseFloat(manualLon);
    const altitude = parseFloat(manualAlt) || undefined;

    if (latitude === 0 && longitude === 0) {
      alert('Bitte gib GPS-Koordinaten ein oder nutze den Position-Button (🎯).');
      return;
    }

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      alert('Ungültige GPS-Koordinaten. Bitte prüfe deine Eingabe.');
      return;
    }

    onSave({
      latitude,
      longitude,
      altitude,
      precision: 'medium',
    });
  };

  // Reset to initial GPS
  const handleReset = () => {
    if (gps) {
      setPosition([gps.latitude, gps.longitude]);
      setManualLat(gps.latitude.toFixed(6));
      setManualLon(gps.longitude.toFixed(6));
      setManualAlt(gps.altitude?.toFixed(1) || '0');
    }
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className="space-y-4">
      {/* Fullscreen backdrop */}
      {isFullscreen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={toggleFullscreen}
        />
      )}

      {/* Map */}
      <div
        className={cn(
          'relative rounded-lg overflow-hidden border-2',
          isFullscreen
            ? 'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 rounded-none border-gray-300 dark:border-gray-600'
            : 'border-gray-200 dark:border-gray-700'
        )}
        style={isFullscreen ? { width: '800px', height: '800px' } : { height }}
      >
        {isFullscreen && (
          <Button
            onClick={toggleFullscreen}
            variant="outline"
            size="sm"
            className="absolute top-4 right-4 z-[1000] bg-white dark:bg-gray-800"
          >
            <Minimize2 className="h-4 w-4 mr-2" />
            Vollbild schließen
          </Button>
        )}

        <div ref={mapContainerRef} style={{ height: '100%', width: '100%' }} />

        {/* Zoom Controls */}
        <div className="absolute top-4 left-4 flex flex-col gap-1 z-[1000]">
          <Button
            onClick={() => {
              const newZoom = Math.min(zoom + 1, 19);
              setZoom(newZoom);
              if (mapRef.current) {
                mapRef.current.setZoom(newZoom);
              }
            }}
            variant="outline"
            size="sm"
            className="w-8 h-8 p-0 bg-white dark:bg-gray-800"
            title="Vergrößern"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => {
              const newZoom = Math.max(zoom - 1, 1);
              setZoom(newZoom);
              if (mapRef.current) {
                mapRef.current.setZoom(newZoom);
              }
            }}
            variant="outline"
            size="sm"
            className="w-8 h-8 p-0 bg-white dark:bg-gray-800"
            title="Verkleinern"
          >
            <Minimize2 className="h-4 w-4" />
          </Button>
          <Button
            onClick={getCurrentLocation}
            variant="outline"
            size="sm"
            className="w-8 h-8 p-0 bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800"
            title="Aktuelle Position"
            disabled={isLoadingLocation}
          >
            {isLoadingLocation ? (
              <div className="animate-spin h-4 w-4 border-2 border-blue-600 dark:border-blue-400 rounded-full border-t-transparent" />
            ) : (
              <Crosshair className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            )}
          </Button>
        </div>

        {/* Current Coordinates Display */}
        <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-800 px-3 py-2 rounded-lg shadow-lg z-[1000] border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-green-600 dark:text-green-400" />
            <span className="font-mono">
              {position[0].toFixed(6)}° N, {position[1].toFixed(6)}° E
            </span>
          </div>
        </div>

        {/* Toggle Fullscreen Button */}
        {!isFullscreen && (
          <Button
            onClick={toggleFullscreen}
            variant="outline"
            size="sm"
            className="absolute top-4 right-4 z-[1000] bg-white dark:bg-gray-800"
            title="Vollbild anzeigen"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Manual Coordinate Input */}
      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Breitengrad (Latitude)</Label>
            <Input
              type="number"
              step="0.000001"
              value={manualLat}
              onChange={(e) => setManualLat(e.target.value)}
              placeholder="z.B. 37.7749"
              className="font-mono"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Längengrad (Longitude)</Label>
            <Input
              type="number"
              step="0.000001"
              value={manualLon}
              onChange={(e) => setManualLon(e.target.value)}
              placeholder="z.B. -122.4194"
              className="font-mono"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Höhe (Altitude) - Optional</Label>
            <Input
              type="number"
              step="0.1"
              value={manualAlt}
              onChange={(e) => setManualAlt(e.target.value)}
              placeholder="z.B. 120"
              className="font-mono"
            />
          </div>
        </div>

        {/* Instructions */}
        <div className="text-xs text-muted-foreground flex items-start gap-2 bg-muted/50 p-3 rounded-lg">
          <MapIcon className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <ul className="space-y-1">
            <li><strong>🎯 Position</strong> Button für GPS vom Smartphone/Browser</li>
            <li><strong>Klicke</strong> auf die Karte, um die Position zu ändern</li>
            <li><strong>Ziehe</strong> den Marker (MapPin), um ihn zu verschieben</li>
            <li><strong>Gib</strong> Koordinaten manuell in die Felder ein</li>
            <li><strong>Nutze</strong> +/- Buttons oder Mausrad für Zoom</li>
          </ul>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          onClick={handleSave}
          className="flex-1"
          size="lg"
        >
          <Check className="h-4 w-4 mr-2" />
          GPS speichern
        </Button>
        <Button
          onClick={onCancel}
          variant="outline"
          className="flex-1"
          size="lg"
        >
          Abbrechen
        </Button>
        {gps && (
          <Button
            onClick={handleReset}
            variant="outline"
            size="lg"
            title="Auf ursprüngliche GPS zurücksetzen"
          >
            <MapPin className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
