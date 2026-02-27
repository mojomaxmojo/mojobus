import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Maximize2, Minimize2, Check, Map as MapIcon, Crosshair } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GpsData } from '@/lib/gpsExtraction';
import { reverseGeocode, mapCountryCode } from '@/lib/gpsExtraction';

// Type declarations for global Leaflet
declare global {
  interface Window {
    L: typeof import('leaflet');
    __leafletLoading?: boolean;
    __leafletLoaded?: boolean;
  }
}

// Load Leaflet CSS and JS dynamically (shared with VanillaMap)
const loadLeaflet = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Already loaded
    if (window.L && window.__leafletLoaded) {
      resolve();
      return;
    }

    // Already loading - wait for it
    if (window.__leafletLoading) {
      const checkInterval = setInterval(() => {
        if (window.L && window.__leafletLoaded) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 50);
      
      // Timeout after 15 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
        if (!window.L) {
          reject(new Error('Leaflet loading timeout'));
        }
      }, 15000);
      return;
    }

    window.__leafletLoading = true;

    // Load CSS first
    const cssLink = document.createElement('link');
    cssLink.rel = 'stylesheet';
    cssLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    
    // Load JS
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.async = true;

    let cssLoaded = false;
    let jsLoaded = false;

    const checkComplete = () => {
      if (cssLoaded && jsLoaded && window.L) {
        window.__leafletLoaded = true;
        window.__leafletLoading = false;
        resolve();
      }
    };

    cssLink.onload = () => {
      cssLoaded = true;
      checkComplete();
    };
    
    cssLink.onerror = () => {
      cssLoaded = true; // Continue anyway
      checkComplete();
    };

    script.onload = () => {
      jsLoaded = true;
      checkComplete();
    };

    script.onerror = () => {
      window.__leafletLoading = false;
      reject(new Error('Failed to load Leaflet JS'));
    };

    // Add to document
    document.head.appendChild(cssLink);
    document.head.appendChild(script);

    // Timeout after 15 seconds
    setTimeout(() => {
      if (!window.L) {
        window.__leafletLoading = false;
        reject(new Error('Leaflet loading timeout'));
      }
    }, 15000);
  });
};

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
 * LocationPicker Component
 *
 * Interactive map component for picking GPS coordinates
 * Uses Leaflet via CDN for Shakespeare-Build compatibility
 */
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
    // Check if GPS data is valid
    if (gps && gps.latitude !== 0 && gps.longitude !== 0) {
      return [gps.latitude, gps.longitude];
    }
    // Default: Portugal
    return [39.5, -8.0];
  });
  const [zoom, setZoom] = useState(initialZoom);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [manualLat, setManualLat] = useState(position[0].toFixed(6));
  const [manualLon, setManualLon] = useState(position[1].toFixed(6));
  const [manualAlt, setManualAlt] = useState(gps?.altitude?.toFixed(1) || '0');
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  // Load Leaflet dynamically
  useEffect(() => {
    let mounted = true;

    loadLeaflet()
      .then(() => {
        if (mounted) {
          setLeafletLoaded(true);
          setError(null);
        }
      })
      .catch((err) => {
        console.error('Failed to load Leaflet:', err);
        if (mounted) {
          setError('Karte konnte nicht geladen werden. Bitte Internetverbindung prüfen und Seite neu laden.');
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  // Initialize map
  useEffect(() => {
    if (!leafletLoaded || !mapRef.current || !window.L || leafletMapRef.current) return;

    try {
      const L = window.L;

      // Create map
      const map = L.map(mapRef.current, {
        center: position,
        zoom: zoom,
        zoomControl: false,
      });

      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      // Create draggable marker
      const marker = L.marker(position, {
        draggable: true,
      }).addTo(map);

      marker.on('dragend', () => {
        const latlng = marker.getLatLng();
        setPosition([latlng.lat, latlng.lng]);
      });

      // Handle map clicks
      map.on('click', (e: L.LeafletMouseEvent) => {
        setPosition([e.latlng.lat, e.latlng.lng]);
        marker.setLatLng(e.latlng);
      });

      leafletMapRef.current = map;
      markerRef.current = marker;

      // Fix map size - important for dialogs!
      setTimeout(() => {
        map.invalidateSize();
      }, 100);
      // Also fix after a longer delay for animations
      setTimeout(() => {
        map.invalidateSize();
      }, 300);

    } catch (err) {
      console.error('Error initializing map:', err);
      setError('Fehler beim Initialisieren der Karte.');
    }

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
        markerRef.current = null;
      }
    };
  }, [leafletLoaded]);

  // Update marker position when position changes
  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.setLatLng(position);
    }
    if (leafletMapRef.current) {
      leafletMapRef.current.setView(position, zoom);
    }
  }, [position, zoom]);

  // Sync manual inputs with marker position
  useEffect(() => {
    setManualLat(position[0].toFixed(6));
    setManualLon(position[1].toFixed(6));
  }, [position]);

  // Update map size when fullscreen toggles
  useEffect(() => {
    if (leafletMapRef.current) {
      setTimeout(() => {
        leafletMapRef.current?.invalidateSize();
      }, 100);
    }
  }, [isFullscreen]);

  // Get current location from browser/smartphone
  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      alert('Geolocation wird von diesem Browser nicht unterstützt.');
      return;
    }

    setIsLoadingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, altitude } = pos.coords;

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
        setZoom(16);

        // Reverse geocode to get location and country
        reverseGeocode(latitude, longitude).then(locationData => {
          if (locationData) {
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
      (err) => {
        console.error('Geolocation error:', err);
        let errorMessage = 'Standort konnte nicht abgerufen werden.';
        switch (err.code) {
          case err.PERMISSION_DENIED:
            errorMessage = 'Standort-Zugriff verweigert. Bitte erlaube den Zugriff in den Browsereinstellungen.';
            break;
          case err.POSITION_UNAVAILABLE:
            errorMessage = 'Standortinformationen sind nicht verfügbar.';
            break;
          case err.TIMEOUT:
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
  }, [onCountryDetected, onLocationDetected]);

  // Save handler
  const handleSave = useCallback(() => {
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
  }, [manualLat, manualLon, manualAlt, onSave]);

  // Reset to initial GPS
  const handleReset = useCallback(() => {
    if (gps) {
      setPosition([gps.latitude, gps.longitude]);
      setManualLat(gps.latitude.toFixed(6));
      setManualLon(gps.longitude.toFixed(6));
      setManualAlt(gps.altitude?.toFixed(1) || '0');
    }
  }, [gps]);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev);
  }, []);

  // Render loading state
  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg p-8" style={{ height }}>
          <div className="text-center">
            <p className="text-red-500">{error}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button onClick={onCancel} variant="outline" className="flex-1" size="lg">
            Abbrechen
          </Button>
        </div>
      </div>
    );
  }

  if (!leafletLoaded) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg" style={{ height }}>
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Lade Karte...</p>
          </div>
        </div>
      </div>
    );
  }

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

        <div 
          ref={mapRef} 
          className="absolute inset-0"
        />

        {/* Zoom Controls */}
        <div className="absolute top-4 left-4 flex flex-col gap-1 z-[1000]">
          <Button
            onClick={() => setZoom(Math.min(zoom + 1, 19))}
            variant="outline"
            size="sm"
            className="w-8 h-8 p-0 bg-white dark:bg-gray-800"
            title="Vergrößern"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => setZoom(Math.max(zoom - 1, 1))}
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
