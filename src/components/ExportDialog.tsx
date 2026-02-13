/**
 * Export Dialog Component
 * Allows exporting content as GPX or KMZ for Google Earth Studio
 */

import { useState } from 'react';
import type { NostrEvent } from '@nostrify/nostrify';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download, FileDown, Map, Image as ImageIcon, FileText, Video, Loader2, Info, MapPin } from "lucide-react";
import { exportEventsToGPX } from "@/lib/gpxExporter";
import { exportEventsToKMZ, type KMZExportOptions } from "@/lib/kmzExporter";

interface ExportDialogProps {
  events: NostrEvent[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exportName?: string;
}

export function ExportDialog({ events, open, onOpenChange, exportName = "MojoBus-Export" }: ExportDialogProps) {
  // Export options
  const [includeImages, setIncludeImages] = useState(true);
  const [includePosts, setIncludePosts] = useState(true);
  const [includeTimestamps, setIncludeTimestamps] = useState(true);
  const [maxImages, setMaxImages] = useState([50]);

  // KMZ-specific options
  const [includeFullResImages, setIncludeFullResImages] = useState(false);

  // Loading state
  const [isExporting, setIsExporting] = useState(false);
  const [exportType, setExportType] = useState<'gpx' | 'kmz' | null>(null);

  // Calculate stats
  const imageCount = events.reduce((count, event) => {
    return count + event.tags.filter(([name]) => name === 'image').length;
  }, 0);

  const postCount = events.length;

  // Handle GPX export
  const handleGPXExport = async () => {
    setIsExporting(true);
    setExportType('gpx');

    try {
      await exportEventsToGPX(events, {
        includeImages,
        includePosts,
        includeTimestamps,
        includeElevation: false
      });

      console.log('✅ GPX Export erfolgreich!');
    } catch (error) {
      console.error('GPX Export error:', error);
      console.error('❌ Export fehlgeschlagen');
    } finally {
      setIsExporting(false);
      setExportType(null);
    }
  };

  // Handle KMZ export
  const handleKMZExport = async () => {
    setIsExporting(true);
    setExportType('kmz');

    try {
      const options: KMZExportOptions = {
        includeImages,
        includePosts,
        includeTimestamps,
        includeElevation: false,
        includeFullResImages,
        includeThumbnails: true,
        maxImageCount: maxImages[0]
      };

      await exportEventsToKMZ(events, options);

      console.log('✅ KMZ Export erfolgreich!');
    } catch (error) {
      console.error('KMZ Export error:', error);
      console.error('❌ Export fehlgeschlagen');
    } finally {
      setIsExporting(false);
      setExportType(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Map className="w-5 h-5" />
            Export für Google Earth Studio
          </DialogTitle>
          <DialogDescription>
            Exportiere "{exportName}" als GPX oder KMZ-Datei für professionelle Video-Erstellung
          </DialogDescription>
        </DialogHeader>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-blue-500" />
            <div>
              <p className="font-medium">{imageCount}</p>
              <p className="text-xs text-muted-foreground">Bilder</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-green-500" />
            <div>
              <p className="font-medium">{postCount}</p>
              <p className="text-xs text-muted-foreground">Posts</p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="gpx" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="gpx" className="flex items-center gap-2">
              <FileDown className="w-4 h-4" />
              GPX Export
            </TabsTrigger>
            <TabsTrigger value="kmz" className="flex items-center gap-2">
              <Video className="w-4 h-4" />
              KMZ Export (mit Fotos)
            </TabsTrigger>
          </TabsList>

          {/* GPX Tab */}
          <TabsContent value="gpx" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">GPX-Datei</CardTitle>
                <CardDescription>
                  Für Google Earth Studio - enthält Route, Bilder und Posts als Referenz
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="gpx-images" className="flex items-center gap-2 cursor-pointer">
                    <ImageIcon className="w-4 h-4" />
                    Bilder einbinden
                  </Label>
                  <Checkbox
                    id="gpx-images"
                    checked={includeImages}
                    onCheckedChange={(checked) => setIncludeImages(checked as boolean)}
                  />
                </div>

                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="gpx-posts" className="flex items-center gap-2 cursor-pointer">
                    <FileText className="w-4 h-4" />
                    Posts/Texte einbinden
                  </Label>
                  <Checkbox
                    id="gpx-posts"
                    checked={includePosts}
                    onCheckedChange={(checked) => setIncludePosts(checked as boolean)}
                  />
                </div>

                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="gpx-timestamps" className="flex items-center gap-2 cursor-pointer">
                    Zeitstempel
                  </Label>
                  <Checkbox
                    id="gpx-timestamps"
                    checked={includeTimestamps}
                    onCheckedChange={(checked) => setIncludeTimestamps(checked as boolean)}
                  />
                </div>

                <div className="pt-4 border-t">
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>GPX ist ideal für Google Earth Studio. Fotos werden als Links eingebunden, nicht heruntergeladen.</span>
                  </div>
                </div>

                <Button
                  onClick={handleGPXExport}
                  disabled={isExporting || exportType === 'kmz'}
                  className="w-full"
                >
                  {isExporting && exportType === 'gpx' ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Exportiere GPX...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      GPX herunterladen
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* KMZ Tab */}
          <TabsContent value="kmz" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">KMZ-Datei</CardTitle>
                <CardDescription>
                  Für Google Earth Pro - enthält KML + heruntergeladene Fotos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Maximale Bilder</Label>
                    <Badge variant="outline">{maxImages[0]} von {imageCount}</Badge>
                  </div>
                  <Slider
                    value={maxImages}
                    onValueChange={setMaxImages}
                    min={1}
                    max={Math.min(imageCount, 100)}
                    step={5}
                    disabled={!includeImages}
                  />
                </div>

                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="kmz-fullres" className="flex items-center gap-2 cursor-pointer">
                    Vollauflösung
                  </Label>
                  <Checkbox
                    id="kmz-fullres"
                    checked={includeFullResImages}
                    onCheckedChange={(checked) => setIncludeFullResImages(checked as boolean)}
                  />
                </div>
                {includeFullResImages && (
                  <p className="text-xs text-muted-foreground">
                    ⚠️ Vollauflösung erhöht die Dateigröße signifikant (10-50MB+)
                  </p>
                )}

                <div className="pt-4 border-t">
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>KMZ enthält alle Bilder lokal. Perfekt für Google Earth Pro Desktop-Anwendung.</span>
                  </div>
                </div>

                <Button
                  onClick={handleKMZExport}
                  disabled={isExporting || exportType === 'gpx'}
                  className="w-full"
                >
                  {isExporting && exportType === 'kmz' ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Lade Bilder & Exportiere...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      KMZ herunterladen
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Abbrechen
          </Button>
          <Button
            variant="ghost"
            onClick={() => window.open('https://earthstudio.google.com', '_blank')}
            className="w-full sm:w-auto"
          >
            <Map className="mr-2 h-4 w-4" />
            Google Earth Studio öffnen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
