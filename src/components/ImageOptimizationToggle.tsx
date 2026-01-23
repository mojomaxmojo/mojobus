import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Image as ImageIcon, Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useImageOptimization } from '@/hooks/useImageOptimization';

interface ImageOptimizationToggleProps {
  className?: string;
}

/**
 * Toggle-Komponente für Bildoptimierung
 *
 * Zeigt einen Switch zum Aktivieren/Deaktivieren der Bildoptimierung
 * mit Tooltip für zusätzliche Informationen
 */
export function ImageOptimizationToggle({ className }: ImageOptimizationToggleProps) {
  const { enabled, toggleOptimization, info } = useImageOptimization();

  return (
    <div className={className}>
      <div className="flex items-center justify-between space-x-2">
        <div className="flex items-center space-x-2 flex-1">
          <ImageIcon className="h-4 w-4 text-muted-foreground" />
          <Label
            htmlFor="image-optimization"
            className="cursor-pointer flex-1"
          >
            Bilder optimieren
          </Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                <div className="space-y-2 text-xs">
                  <p className="font-semibold">Bildoptimierung</p>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>Max. Größe: {info.maxWidth}x{info.maxHeight}px</li>
                    <li>Format: {info.format}</li>
                    <li>Qualität: {(info.quality * 100).toFixed(0)}%</li>
                    <li>Komprimierung: Reduziert Dateigröße bis zu 90%</li>
                  </ul>
                  <p className="text-muted-foreground mt-2">
                    GIFs und sehr große Dateien (&gt;50MB) werden ausgeschlossen.
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Switch
          id="image-optimization"
          checked={enabled}
          onCheckedChange={toggleOptimization}
        />
      </div>
    </div>
  );
}
