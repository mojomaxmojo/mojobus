import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GpsData } from '@/lib/gpsExtraction';

/**
 * Props for GpsEditor Component
 */
export interface GpsEditorProps {
  /** GPS data to edit (optional for adding new GPS) */
  gps?: GpsData;
  /** Callback when GPS is saved */
  onSave: (gps: GpsData) => void;
  /** Callback when editing is cancelled */
  onCancel: () => void;
  /** Callback when GPS is removed (optional) */
  onRemove?: () => void;
  /** Callback when GPS is applied to all images (optional) */
  onApplyToAll?: () => void;
}

/**
 * GpsEditor Component
 *
 * A reusable inline GPS editor for editing GPS coordinates.
 * Supports adding new GPS data or editing existing GPS data.
 *
 * @example
 * ```tsx
 * <GpsEditor
 *   gps={file.gps}
 *   onSave={(gps) => setFileGps(gps)}
 *   onCancel={() => setEditing(false)}
 *   onRemove={() => setFileGps(undefined)}
 *   onApplyToAll={() => applyGpsToAll(file.id)}
 * />
 * ```
 */
export function GpsEditor({
  gps,
  onSave,
  onCancel,
  onRemove,
  onApplyToAll,
}: GpsEditorProps) {
  const [latitude, setLatitude] = useState(gps?.latitude || 0);
  const [longitude, setLongitude] = useState(gps?.longitude || 0);
  const [altitude, setAltitude] = useState(gps?.altitude || 0);

  const handleSave = () => {
    if (latitude === 0 && longitude === 0) {
      alert('Bitte gib GPS-Koordinaten ein.');
      return;
    }

    onSave({
      latitude,
      longitude,
      altitude: altitude || undefined,
      precision: 'medium', // Default precision for manual entries
    });
  };

  return (
    <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
      <div className="grid grid-cols-1 gap-2">
        <div>
          <Label className="text-xs">Breitengrad (Latitude)</Label>
          <Input
            type="number"
            step="0.0001"
            value={latitude || ''}
            onChange={(e) => setLatitude(parseFloat(e.target.value) || 0)}
            placeholder="z.B. 37.7749"
            className="h-8 text-sm"
          />
        </div>
        <div>
          <Label className="text-xs">Längengrad (Longitude)</Label>
          <Input
            type="number"
            step="0.0001"
            value={longitude || ''}
            onChange={(e) => setLongitude(parseFloat(e.target.value) || 0)}
            placeholder="z.B. -122.4194"
            className="h-8 text-sm"
          />
        </div>
        <div>
          <Label className="text-xs">Höhe (Altitude) - Optional</Label>
          <Input
            type="number"
            step="1"
            value={altitude || ''}
            onChange={(e) => setAltitude(parseFloat(e.target.value) || 0)}
            placeholder="z.B. 120"
            className="h-8 text-sm"
          />
        </div>
        <div className="flex gap-1 pt-1">
          <Button size="sm" className="flex-1 h-7" onClick={handleSave}>
            💾 Speichern
          </Button>
          <Button size="sm" variant="outline" className="flex-1 h-7" onClick={onCancel}>
            Abbrechen
          </Button>
          {gps && onRemove && (
            <Button size="sm" variant="destructive" className="h-7" onClick={onRemove}>
              🗑️
            </Button>
          )}
          {gps && onApplyToAll && (
            <Button
              size="sm"
              variant="outline"
              className="h-7"
              onClick={onApplyToAll}
              title="Auf alle Bilder anwenden"
            >
              📋
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
