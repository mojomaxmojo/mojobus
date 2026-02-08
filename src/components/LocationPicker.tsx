/**
 * LocationPicker Component
 *
 * Interactive location picker with map preview
 * Lazy-loaded to reduce initial bundle size
 */

import { useState, lazy, Suspense } from 'react';
import { MapPin, Search, Globe, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { GpsStatusIndicator } from '@/components/GpsStatusIndicator';
import { GpsEditor } from '@/components/GpsEditor';
import type { GpsData, GpsStatus } from '@/lib/gpsExtraction';

// Lazy load map components to reduce initial bundle size
const MapPreview = lazy(() => import('./MapPreview'));

export interface LocationPickerProps {
  /** Current location text */
  location: string;
  /** Called when location changes */
  onLocationChange: (location: string) => void;
  /** Current GPS data */
  gps?: GpsData | null;
  /** Current GPS status */
  gpsStatus?: GpsStatus;
  /** Called when GPS changes */
  onGpsChange: (gps: GpsData | null) => void;
  /** Called when GPS status changes */
  onGpsStatusChange: (status: GpsStatus) => void;
  /** Show map preview */
  showMap?: boolean;
  /** Disable editing */
  disabled?: boolean;
  /** Custom class name */
  className?: string;
}

export function LocationPicker({
  location,
  onLocationChange,
  gps,
  gpsStatus = 'not_found',
  onGpsChange,
  onGpsStatusChange,
  showMap = true,
  disabled = false,
  className = ''
}: LocationPickerProps) {
  const [showGpsEditor, setShowGpsEditor] = useState(false);
  const [showMapPreview, setShowMapPreview] = useState(false);

  const handleGpsSave = (newGps: GpsData) => {
    onGpsChange(newGps);
    onGpsStatusChange('manual');
    setShowGpsEditor(false);
  };

  const handleGpsRemove = () => {
    onGpsChange(null);
    onGpsStatusChange('not_found');
    setShowGpsEditor(false);
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation wird von diesem Browser nicht unterstützt.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const newGps: GpsData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          altitude: position.coords.altitude || undefined,
          precision: 'high'
        };
        onGpsChange(newGps);
        onGpsStatusChange('detected');
        setShowGpsEditor(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        alert('Standort konnte nicht abgerufen werden. Bitte erlaube den Zugriff auf deinen Standort.');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Location Input */}
      <div className="space-y-2">
        <Label htmlFor="location-input" className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          Standort
        </Label>
        <div className="flex gap-2">
          <Input
            id="location-input"
            type="text"
            value={location}
            onChange={(e) => onLocationChange(e.target.value)}
            placeholder="z.B. Sagres, Portugal"
            disabled={disabled}
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleUseMyLocation}
            disabled={disabled}
            title="Mein Standort verwenden"
          >
            <Globe className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Stadt, Region oder vollständige Adresse eingeben
        </p>
      </div>

      {/* GPS Status and Editor */}
      <div className="space-y-2">
        <Label>GPS-Koordinaten</Label>
        <div className="flex items-center gap-2">
          <GpsStatusIndicator
            status={gpsStatus}
            coordinates={gps || undefined}
            showCoordinates={!!gps}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowGpsEditor(!showGpsEditor)}
            disabled={disabled}
            className="ml-auto"
          >
            {showGpsEditor ? 'Schließen' : gps ? 'Bearbeiten' : 'Hinzufügen'}
          </Button>
        </div>

        {showGpsEditor && (
          <GpsEditor
            gps={gps || null}
            gpsStatus={gpsStatus}
            isOpen={showGpsEditor}
            onSave={handleGpsSave}
            onCancel={() => setShowGpsEditor(false)}
            onRemove={handleGpsRemove}
            disabled={disabled}
          />
        )}
      </div>

      {/* Map Preview Toggle */}
      {showMap && gps && (
        <div className="space-y-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowMapPreview(!showMapPreview)}
            disabled={disabled}
            className="w-full"
          >
            <MapPin className="h-4 w-4 mr-2" />
            {showMapPreview ? 'Karte ausblenden' : 'Karte anzeigen'}
          </Button>

          {showMapPreview && (
            <Suspense
              fallback={
                <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                  <p className="text-sm text-muted-foreground">Lade Karte...</p>
                </div>
              }
            >
              <MapPreview
                lat={gps.latitude}
                lon={gps.longitude}
                location={location}
                onLocationClick={onLocationChange}
              />
            </Suspense>
          )}
        </div>
      )}

      {/* Quick Actions */}
      {gps && location && (
        <div className="flex flex-wrap gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              const coords = `${gps.latitude.toFixed(6)}, ${gps.longitude.toFixed(6)}`;
              navigator.clipboard.writeText(coords);
              alert('Koordinaten in die Zwischenablage kopiert!');
            }}
            disabled={disabled}
          >
            <Search className="h-3 w-3 mr-1" />
            Koordinaten kopieren
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              const url = `https://www.google.com/maps?q=${gps.latitude},${gps.longitude}`;
              window.open(url, '_blank');
            }}
            disabled={disabled}
          >
            <ArrowRight className="h-3 w-3 mr-1" />
              In Google Maps öffnen
          </Button>
        </div>
      )}
    </div>
  );
}
