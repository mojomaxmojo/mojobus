import { useState, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Maximize2, Minimize2, Check, Map as MapIcon, Crosshair } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GpsData } from '@/lib/gpsExtraction';
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
  /** Height of the map */
  height?: string;
}

/**
 * Component to handle map clicks
 */
function MapClickHandler({ onMapClick }: { onMapClick: (e: any) => void }) {
  const map = useMap();

  return (
    <div
      onClick={(e) => {
        const { lat, lng } = map.mouseEventToLatLng(e.nativeEvent);
        onMapClick({ lat, lng });
      }}
      style={{ cursor: 'crosshair' }}
      className="absolute inset-0"
    />
  );
}

/**
 * LocationPicker Component
 *
 * Interactive map component for picking GPS coordinates
 * Features:
 * - Drag & Drop marker to pick location
 * - Click on map to move marker
 * - Manual coordinate input
 * - Zoom controls
 * - Auto-center on GPS data
 *
 * @example
 * ```tsx
 * <LocationPicker
 *   gps={currentGps}
 *   onSave={(gps) => setGps(gps)}
 *   onCancel={() => setIsEditing(false)}
 *   initialZoom={13}
 *   height="400px"
 * />
 * ```
 */
export function LocationPicker({
  gps,
  onSave,
  onCancel,
  initialZoom = 13,
  height = '400px',
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
  const mapRef = useRef<L.Map>(null);

  // Sync manual inputs with marker position
  useEffect(() => {
    setManualLat(position[0].toFixed(6));
    setManualLon(position[1].toFixed(6));
  }, [position]);

  // Update map size when fullscreen toggles
  useEffect(() => {
    if (mapRef.current) {
      // Small delay to ensure DOM has updated
      setTimeout(() => {
        mapRef.current?.invalidateSize();
      }, 100);
    }
  }, [isFullscreen]);

  // Handle map click to move marker
  const handleMapClick = ({ lat, lng }: { lat: number; lng: number }) => {
    setPosition([lat, lng]);
  };

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

        // Validate coordinates (should not be 0,0)
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

        // Zoom in and pan to current location
        if (mapRef.current) {
          mapRef.current.setView(newPosition, 16);
        }

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

    // Validate coordinates (should not be 0,0)
    if (latitude === 0 && longitude === 0) {
      alert('Bitte gib GPS-Koordinaten ein oder nutze den Position-Button (🎯).');
      return;
    }

    // Validate coordinate ranges
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      alert('Ungültige GPS-Koordinaten. Bitte prüfe deine Eingabe.');
      return;
    }

    onSave({
      latitude,
      longitude,
      altitude,
      precision: 'medium', // Manual entries get medium precision
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
        />
      )}

      {/* Map */}
      <div
        className={cn(
          'relative rounded-lg overflow-hidden border-2',
          isFullscreen
            ? 'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 rounded-none'
            : 'border-gray-200 dark:border-gray-700'
        )}
        style={isFullscreen ? { width: '800px', height: '800px' } : {}}
        onClick={(e) => {
          // Close fullscreen when clicking outside map (on backdrop)
          if (isFullscreen && e.currentTarget === e.target) {
            toggleFullscreen();
          }
        }}
      >
        {isFullscreen && (
          <Button
            onClick={toggleFullscreen}
            variant="outline"
            size="sm"
            className="absolute top-4 right-4 z-[1000]"
          >
            <Minimize2 className="h-4 w-4 mr-2" />
            Vollbild schließen
          </Button>
        )}

        <MapContainer
          center={position}
          zoom={zoom}
          style={{ height: isFullscreen ? '800px' : height, width: isFullscreen ? '800px' : '100%' }}
          zoomControl={false}
          ref={mapRef}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />
          <Marker
            position={position}
            draggable={true}
            eventHandlers={{
              dragend: (e) => {
                const marker = e.target;
                const { lat, lng } = marker.getLatLng();
                setPosition([lat, lng]);
              },
            }}
          />
          <MapClickHandler onMapClick={handleMapClick} />
        </MapContainer>

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
