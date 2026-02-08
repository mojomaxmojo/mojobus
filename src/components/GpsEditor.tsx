/**
 * GpsEditor Component
 *
 * Reusable GPS editing component for all upload forms
 * Supports manual GPS entry, editing detected GPS, and removing GPS
 */

import { useState } from 'react';
import { MapPin, Trash2, Copy, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { GpsStatusIndicator } from '@/components/GpsStatusIndicator';
import type { GpsData, GpsStatus } from '@/lib/gpsExtraction';

export interface GpsEditorProps {
  /** Current GPS data */
  gps: GpsData | null;
  /** Current GPS status */
  gpsStatus: GpsStatus;
  /** Whether the editor is open/visible */
  isOpen: boolean;
  /** Called when GPS coordinates are saved */
  onSave: (gps: GpsData) => void;
  /** Called when editor is closed */
  onCancel: () => void;
  /** Called when GPS is removed */
  onRemove?: () => void;
  /** Called to apply GPS to all images (for batch operations) */
  onApplyToAll?: () => void;
  /** Show "Apply to All" button */
  showApplyToAll?: boolean;
  /** Disable editing */
  disabled?: boolean;
}

export function GpsEditor({
  gps,
  gpsStatus,
  isOpen,
  onSave,
  onCancel,
  onRemove,
  onApplyToAll,
  showApplyToAll = false,
  disabled = false
}: GpsEditorProps) {
  const [latitude, setLatitude] = useState(gps?.latitude || 0);
  const [longitude, setLongitude] = useState(gps?.longitude || 0);
  const [altitude, setAltitude] = useState(gps?.altitude || 0);

  // Update local state when GPS prop changes
  if (gps && (gps.latitude !== latitude || gps.longitude !== longitude)) {
    setLatitude(gps.latitude);
    setLongitude(gps.longitude);
    setAltitude(gps.altitude || 0);
  }

  const handleSave = () => {
    if (latitude === 0 && longitude === 0) {
      alert('Bitte gib GPS-Koordinaten ein.');
      return;
    }

    const gpsData: GpsData = {
      latitude,
      longitude,
      altitude: altitude || undefined,
      precision: 'medium'
    };

    onSave(gpsData);
  };

  const handleRemove = () => {
    onRemove?.();
    onCancel();
  };

  const handleApplyToAll = () => {
    if (latitude === 0 && longitude === 0) {
      alert('Bitte gib GPS-Koordinaten ein.');
      return;
    }

    const gpsData: GpsData = {
      latitude,
      longitude,
      altitude: altitude || undefined,
      precision: 'medium'
    };

    onSave(gpsData);
    onApplyToAll?.();
  };

  const copyToClipboard = () => {
    const coords = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    navigator.clipboard.writeText(coords);

    // Visual feedback
    const btn = document.activeElement as HTMLButtonElement;
    if (btn) {
      const originalIcon = btn.innerHTML;
      btn.innerHTML = '<Check className="h-4 w-4" />';
      setTimeout(() => {
        btn.innerHTML = originalIcon;
      }, 1000);
    }
  };

  if (!isOpen) {
    // Collapsed state - just show status indicator
    return (
      <div className="flex items-center gap-2">
        <GpsStatusIndicator
          status={gpsStatus}
          coordinates={gps || undefined}
          showCoordinates={!!gps}
        />
        <Button
          size="sm"
          variant="ghost"
          className="h-6 px-2 text-xs"
          onClick={() => {}}
          disabled={disabled}
        >
          <MapPin className="h-3 w-3 mr-1" />
          {gps ? 'Edit GPS' : 'Add GPS'}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
      {/* Header with status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
            GPS-Koordinaten
          </span>
        </div>
        <GpsStatusIndicator status={gpsStatus} compact />
      </div>

      {/* Coordinate inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Breitengrad (Latitude)</Label>
          <Input
            type="number"
            step="0.000001"
            value={latitude || ''}
            onChange={(e) => setLatitude(parseFloat(e.target.value) || 0)}
            placeholder="z.B. 37.7749"
            className="h-8 text-sm font-mono"
            disabled={disabled}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Längengrad (Longitude)</Label>
          <Input
            type="number"
            step="0.000001"
            value={longitude || ''}
            onChange={(e) => setLongitude(parseFloat(e.target.value) || 0)}
            placeholder="z.B. -122.4194"
            className="h-8 text-sm font-mono"
            disabled={disabled}
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Höhe (Altitude) - Optional</Label>
        <Input
          type="number"
          step="1"
          value={altitude || ''}
          onChange={(e) => setAltitude(parseFloat(e.target.value) || 0)}
          placeholder="z.B. 120"
          className="h-8 text-sm font-mono"
          disabled={disabled}
        />
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2 pt-2">
        <Button
          size="sm"
          className="flex-1 min-w-[80px] h-8"
          onClick={handleSave}
          disabled={disabled}
        >
          <Check className="h-3 w-3 mr-1" />
          Speichern
        </Button>

        <Button
          size="sm"
          variant="outline"
          className="flex-1 min-w-[80px] h-8"
          onClick={onCancel}
          disabled={disabled}
        >
          Abbrechen
        </Button>

        {showApplyToAll && (
          <Button
            size="sm"
            variant="secondary"
            className="flex-1 min-w-[80px] h-8"
            onClick={handleApplyToAll}
            disabled={disabled}
            title="Auf alle Bilder anwenden"
          >
            <Copy className="h-3 w-3 mr-1" />
            Alle
          </Button>
        )}

        {gps && (
          <Button
            size="sm"
            variant="destructive"
            className="h-8 px-2"
            onClick={handleRemove}
            disabled={disabled}
            title="GPS entfernen"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        )}

        {gps && (
          <Button
            size="sm"
            variant="outline"
            className="h-8 px-2"
            onClick={copyToClipboard}
            disabled={disabled}
            title="Koordinaten kopieren"
          >
            <Copy className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
}
