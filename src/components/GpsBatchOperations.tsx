/**
 * GpsBatchOperations Component
 *
 * Advanced batch GPS operations for multiple images
 * Supports copy, clear, average, and apply operations
 */

import { useState } from 'react';
import { Copy, Trash2, Calculator, ArrowDown, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useGpsBatchOperations, type GpsImage } from '@/hooks/useGpsImage';
import type { GpsData } from '@/lib/gpsExtraction';

export interface GpsBatchOperationsProps {
  /** Images with GPS data */
  images: GpsImage[];
  /** Called when images are updated */
  onImagesUpdate: (images: GpsImage[]) => void;
  /** Show compact mode */
  compact?: boolean;
  /** Disable operations */
  disabled?: boolean;
}

export function GpsBatchOperations({
  images,
  onImagesUpdate,
  compact = false,
  disabled = false
}: GpsBatchOperationsProps) {
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [showAveragePreview, setShowAveragePreview] = useState(false);

  const { copyFirstToAll, copyFromSource, clearAll, averageCoordinates, applyToAll } = useGpsBatchOperations();

  const gpsEnabledImages = images.filter(img => img.gps);
  const hasGpsImages = gpsEnabledImages.length > 0;

  const handleCopyFirstToAll = () => {
    const updated = copyFirstToAll(images);
    onImagesUpdate(updated);
  };

  const handleCopyFromSource = () => {
    if (!selectedSourceId) return;
    const updated = copyFromSource(selectedSourceId, images);
    onImagesUpdate(updated);
    setSelectedSourceId(null);
  };

  const handleClearAll = () => {
    if (!confirm('Möchtest du wirklich alle GPS-Daten von allen Bildern entfernen?')) {
      return;
    }
    const updated = clearAll(images);
    onImagesUpdate(updated);
  };

  const handleAverageCoordinates = () => {
    const avg = averageCoordinates(images);
    if (!avg) {
      alert('Keine GPS-Daten zum Berechnen des Durchschnitts vorhanden.');
      return;
    }

    if (!confirm(`Durchschnittskoordinaten anwenden?\nLat: ${avg.lat.toFixed(4)}°\nLon: ${avg.lon.toFixed(4)}°`)) {
      return;
    }

    const gpsData: GpsData = {
      latitude: avg.lat,
      longitude: avg.lon,
      precision: 'medium'
    };

    const updated = applyToAll(gpsData, images);
    onImagesUpdate(updated);
    setShowAveragePreview(false);
  };

  if (!hasGpsImages && images.length === 0) {
    return (
      <Alert className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
        <AlertDescription className="text-sm">
          Keine Bilder zum Bearbeiten vorhanden.
        </AlertDescription>
      </Alert>
    );
  }

  if (compact) {
    return (
      <div className="flex flex-wrap gap-2">
        {hasGpsImages && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleCopyFirstToAll}
            disabled={disabled}
            className="h-8"
          >
            <Copy className="h-3 w-3 mr-1" />
            Erste kopieren
          </Button>
        )}
        {hasGpsImages && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowAveragePreview(!showAveragePreview)}
            disabled={disabled}
            className="h-8"
          >
            <Calculator className="h-3 w-3 mr-1" />
            Durchschnitt
          </Button>
        )}
        <Button
          size="sm"
          variant="destructive"
          onClick={handleClearAll}
          disabled={disabled}
          className="h-8"
        >
          <Trash2 className="h-3 w-3 mr-1" />
          Alle löschen
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* GPS Statistics */}
      {hasGpsImages && (
        <div className="flex items-center gap-2 text-sm">
          <Badge variant="outline">
            {gpsEnabledImages.length} / {images.length} Bilder mit GPS
          </Badge>
          {!hasGpsImages && images.length > 0 && (
            <Badge variant="secondary" className="text-yellow-700 dark:text-yellow-300">
              Keine GPS-Daten vorhanden
            </Badge>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        {hasGpsImages && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleCopyFirstToAll}
            disabled={disabled}
            className="h-9"
          >
            <Copy className="h-4 w-4 mr-2" />
            Erste auf alle anwenden
          </Button>
        )}
        {hasGpsImages && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowAveragePreview(!showAveragePreview)}
            disabled={disabled}
            className="h-9"
          >
            <Calculator className="h-4 w-4 mr-2" />
            Durchschnitt berechnen
          </Button>
        )}
        <Button
          size="sm"
          variant="destructive"
          onClick={handleClearAll}
          disabled={disabled}
          className="h-9"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Alle GPS löschen
        </Button>
      </div>

      {/* Source Selection for Copy */}
      {hasGpsImages && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Quellbild auswählen zum Kopieren:</p>
          <div className="flex flex-wrap gap-2">
            {gpsEnabledImages.map((image) => (
              <Button
                key={image.id}
                size="sm"
                variant={selectedSourceId === image.id ? 'default' : 'outline'}
                onClick={() => setSelectedSourceId(selectedSourceId === image.id ? null : image.id)}
                disabled={disabled}
                className="h-9 text-xs"
              >
                {image.file.name}
                {selectedSourceId === image.id && <Check className="h-3 w-3 ml-2" />}
              </Button>
            ))}
          </div>
          {selectedSourceId && (
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleCopyFromSource}
                disabled={disabled}
                className="h-9"
              >
                <ArrowDown className="h-4 w-4 mr-2" />
                Auf alle anwenden
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedSourceId(null)}
                disabled={disabled}
                className="h-9"
              >
                <X className="h-4 w-4 mr-2" />
                Abbrechen
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Average Coordinates Preview */}
      {showAveragePreview && (
        <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <AlertDescription className="space-y-3">
            <div>
              <p className="font-medium text-sm">Durchschnittskoordinaten:</p>
              <p className="text-xs text-muted-foreground">
                Berechnet aus {gpsEnabledImages.length} Bildern mit GPS
              </p>
            </div>
            <div className="space-y-2">
              {(() => {
                const avg = averageCoordinates(images);
                return avg ? (
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Breitengrad:</span>
                      <span className="ml-2 font-mono">{avg.lat.toFixed(4)}°</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Längengrad:</span>
                      <span className="ml-2 font-mono">{avg.lon.toFixed(4)}°</span>
                    </div>
                  </div>
                ) : null;
              })()}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleAverageCoordinates}
                  disabled={disabled}
                  className="h-9"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Anwenden
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowAveragePreview(false)}
                  disabled={disabled}
                  className="h-9"
                >
                  <X className="h-4 w-4 mr-2" />
                  Abbrechen
                </Button>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
