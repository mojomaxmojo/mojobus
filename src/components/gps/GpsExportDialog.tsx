/**
 * GPS Export Dialog Component
 *
 * Dialog component for exporting GPS data as GPX or KMZ files.
 * Supports export to Google Earth Studio, Google Earth Pro, and other mapping tools.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Download, Globe, Map, Info, ExternalLink, Loader2 } from 'lucide-react';
import type { NostrEvent } from '@nostrify/nostrify';
import {
  exportToGPX,
  exportToKMZ,
  downloadGPX,
  downloadKMZ,
  type GpxExportConfig,
} from '@/lib/gpsExport';

interface GpsExportDialogProps {
  /** Events to export */
  events: NostrEvent[];
  /** Track name (default filename) */
  trackName?: string;
  /** Dialog trigger button */
  children?: React.ReactNode;
}

/**
 * Export format options
 */
type ExportFormat = 'gpx' | 'kmz';

/**
 * Export target options
 */
type ExportTarget = 'google-earth-studio' | 'google-earth-pro' | 'generic';

/**
 * GPS Export Dialog Component
 */
export function GpsExportDialog({ events, trackName = 'MojoBus Trip', children }: GpsExportDialogProps) {
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('gpx');
  const [exportTarget, setExportTarget] = useState<ExportTarget>('google-earth-studio');
  const [includeImages, setIncludeImages] = useState(true);
  const [includeElevation, setIncludeElevation] = useState(true);
  const [simplifyTrack, setSimplifyTrack] = useState(true);
  const [customDescription, setCustomDescription] = useState('');

  // Calculate trip statistics
  const eventCount = events.length;
  const hasImages = events.some(event => {
    return event.tags.some(tag => tag[0] === 'image') ||
           event.content.includes('![') ||
           event.content.match(/https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp)/gi);
  });

  // Handle export
  const handleExport = async () => {
    if (events.length === 0) {
      alert('Keine Events zum Exportieren vorhanden.');
      return;
    }

    setExporting(true);

    try {
      const config: Partial<GpxExportConfig> = {
        includeImages: includeImages,
        includeElevation: includeElevation,
        simplifyDistance: simplifyTrack ? 0.1 : undefined,
        minTimeBetween: simplifyTrack ? 60 : undefined,
      };

      const filename = `${trackName.replace(/[^a-zA-Z0-9]/g, '_')}-${new Date().toISOString().split('T')[0]}`;

      if (exportFormat === 'gpx') {
        const gpxContent = exportToGPX(events, trackName, config);
        downloadGPX(gpxContent, `${filename}.gpx`);
      } else {
        const kmzBlob = await exportToKMZ(events, trackName, config);
        downloadKMZ(kmzBlob, `${filename}.kmz`);
      }

      setOpen(false);
    } catch (error) {
      console.error('[GPS Export] Export failed:', error);
      alert(`Export fehlgeschlagen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
    } finally {
      setExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            GPS Export
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Map className="h-5 w-5" />
            GPS Export
          </DialogTitle>
          <DialogDescription>
            Exportiere GPS-Daten für Google Earth Studio oder andere Kartentools
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Export Statistics */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Zu exportieren</AlertTitle>
            <AlertDescription>
              {eventCount} Location{eventCount !== 1 ? 's' : ''}{' '}
              {hasImages && 'mit Bildern'}
            </AlertDescription>
          </Alert>

          {/* Export Target Selection */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Export-Ziel</Label>
            <RadioGroup value={exportTarget} onValueChange={(v) => setExportTarget(v as ExportTarget)}>
              <div className="space-y-2">
                <div className="flex items-start space-x-2 rounded-lg border p-3 hover:bg-accent">
                  <RadioGroupItem value="google-earth-studio" id="ges" className="mt-1" />
                  <div className="flex-1 space-y-1">
                    <Label htmlFor="ges" className="font-semibold cursor-pointer flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      Google Earth Studio
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Professionelle 3D-Kamera-Animationen im Web. KOSTENLOS, aber manuelle Kamera-Einstellung erforderlich.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-2 rounded-lg border p-3 hover:bg-accent">
                  <RadioGroupItem value="google-earth-pro" id="gep" className="mt-1" />
                  <div className="flex-1 space-y-1">
                    <Label htmlFor="gep" className="font-semibold cursor-pointer flex items-center gap-2">
                      <Map className="h-4 w-4" />
                      Google Earth Pro (Desktop)
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Kostenlose Desktop-App mit Tour-Recorder. Einfacher als Studio für schnelle Videos.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-2 rounded-lg border p-3 hover:bg-accent">
                  <RadioGroupItem value="generic" id="generic" className="mt-1" />
                  <div className="flex-1 space-y-1">
                    <Label htmlFor="generic" className="font-semibold cursor-pointer">
                      Anderes Tool
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Kompatibel mit GPX Viewer, Strava, Garmin BaseCamp, etc.
                    </p>
                  </div>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Export Format */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Export-Format</Label>
            <RadioGroup value={exportFormat} onValueChange={(v) => setExportFormat(v as ExportFormat)}>
              <div className="flex items-start space-x-2 rounded-lg border p-3 hover:bg-accent">
                <RadioGroupItem value="gpx" id="gpx" className="mt-1" />
                <div className="flex-1 space-y-1">
                  <Label htmlFor="gpx" className="font-semibold cursor-pointer">GPX Datei</Label>
                  <p className="text-xs text-muted-foreground">
                    GPS Exchange Format - kompatibel mit fast allen Kartentools. Kleine Dateigröße.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-2 rounded-lg border p-3 hover:bg-accent">
                <RadioGroupItem value="kmz" id="kmz" className="mt-1" />
                <div className="flex-1 space-y-1">
                  <Label htmlFor="kmz" className="font-semibold cursor-pointer">KMZ Datei</Label>
                  <p className="text-xs text-muted-foreground">
                    Google Earth Format mit eingebetteten Bildern. Größere Datei, aber alle Daten enthalten.
                  </p>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Export Options */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Export-Optionen</Label>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeImages"
                  checked={includeImages}
                  onCheckedChange={(checked) => setIncludeImages(checked as boolean)}
                  disabled={!hasImages}
                />
                <Label htmlFor="includeImages" className="cursor-pointer">
                  Bilder einschließen {!hasImages && '(keine Bilder vorhanden)'}
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeElevation"
                  checked={includeElevation}
                  onCheckedChange={(checked) => setIncludeElevation(checked as boolean)}
                />
                <Label htmlFor="includeElevation" className="cursor-pointer">
                  Höhendaten einschließen (wenn verfügbar)
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="simplifyTrack"
                  checked={simplifyTrack}
                  onCheckedChange={(checked) => setSimplifyTrack(checked as boolean)}
                />
                <Label htmlFor="simplifyTrack" className="cursor-pointer">
                  Track vereinfachen (zu nahe Punkte entfernen)
                </Label>
              </div>
            </div>
          </div>

          {/* Custom Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Beschreibung (optional)</Label>
            <Textarea
              id="description"
              placeholder="Füge eine Beschreibung für deine Tour hinzu..."
              value={customDescription}
              onChange={(e) => setCustomDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* Tutorial Link */}
          <Alert>
            <ExternalLink className="h-4 w-4" />
            <AlertTitle>Anleitung verfügbar</AlertTitle>
            <AlertDescription className="space-y-2">
              <p>
                {exportTarget === 'google-earth-studio' && (
                  <>
                    <strong>Google Earth Studio:</strong> Importiere die GPX-Datei, erstelle Kamera-Animationen, und exportiere als Video.
                  </>
                )}
                {exportTarget === 'google-earth-pro' && (
                  <>
                    <strong>Google Earth Pro:</strong> Importiere GPX, nutze den Tour-Recorder, und exportiere als Video.
                  </>
                )}
              </p>
              <a
                href="https://www.google.com/earth/studio/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1"
              >
                Zur Google Earth Studio Website <ExternalLink className="h-3 w-3" />
              </a>
            </AlertDescription>
          </Alert>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={exporting}>
              Abbrechen
            </Button>
            <Button onClick={handleExport} disabled={exporting || events.length === 0}>
              {exporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Exportiere...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Exportieren
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
