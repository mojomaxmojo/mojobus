import { CheckCircle, Upload, Image, AlertCircle, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { UploadProgress } from '@/hooks/useUploadWithProgress';

interface UploadProgressIndicatorProps {
  progress: UploadProgress[];
  className?: string;
}

/**
 * Fortschrittsanzeige für Upload-Vorgänge
 *
 * Zeigt den Status von mehreren Uploads mit detaillierter Progress-Bar
 */
export function UploadProgressIndicator({ progress, className }: UploadProgressIndicatorProps) {
  if (progress.length === 0) return null;

  // Berechne Gesamtfortschritt
  const totalProgress = progress.reduce((sum, p) => {
    if (p.stage === 'complete' || p.stage === 'error') return sum + 100;
    if (p.stage === 'optimizing') return sum + (p.optimizationProgress || 0);
    if (p.stage === 'uploading') return sum + (p.uploadProgress || 0);
    if (p.stage === 'backup') return sum + 60 + (p.backupProgress || 0) * 0.4; // Backup ist 40% des Gesamtfortschritts
    return sum;
  }, 0) / progress.length;

  // Aktive Dateien (nicht abgeschlossen oder Fehler)
  const activeFiles = progress.filter(p => !['complete', 'error'].includes(p.stage));

  // Abgeschlossene Dateien
  const completedFiles = progress.filter(p => p.stage === 'complete');

  // Fehlerhafte Dateien
  const errorFiles = progress.filter(p => p.stage === 'error');

  return (
    <div className={cn('space-y-3', className)}>
      {/* Gesamtfortschritt */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">
            {activeFiles.length > 0
              ? `Verarbeite ${activeFiles.length}/${progress.length} Dateien...`
              : progress.length === completedFiles.length
              ? 'Alle Dateien erfolgreich hochgeladen'
              : 'Upload abgeschlossen'}
          </span>
          <span className="text-muted-foreground">{totalProgress.toFixed(0)}%</span>
        </div>
        <Progress value={totalProgress} className="h-2" />
      </div>

      {/* Einzelne Datei-Progress */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {progress.map((p, idx) => (
          <FileProgress key={`${p.fileName}-${idx}`} progress={p} />
        ))}
      </div>

      {/* Zusammenfassung */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-1">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <span>{completedFiles.length} erfolgreich</span>
        </div>
        {errorFiles.length > 0 && (
          <div className="flex items-center gap-1">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <span className="text-red-500">{errorFiles.length} fehlerhaft</span>
          </div>
        )}
        <div className="flex items-center gap-1">
          <span>{(completedFiles.reduce((sum, p) => sum + (p.optimizedSize || 0), 0) / (1024 * 1024)).toFixed(2)} MB hochgeladen</span>
        </div>
      </div>
    </div>
  );
}

interface FileProgressProps {
  progress: UploadProgress;
}

function FileProgress({ progress }: FileProgressProps) {
  const getProgressValue = (): number => {
    if (progress.stage === 'complete') return 100;
    if (progress.stage === 'error') return 0;
    if (progress.stage === 'optimizing') return (progress.optimizationProgress || 0) * 0.3; // Optimierung ist 30%
    if (progress.stage === 'uploading') return 30 + ((progress.uploadProgress || 0) * 0.6); // Upload ist 60%
    if (progress.stage === 'backup') return 90 + ((progress.backupProgress || 0) * 0.1); // Backup ist 10%
    return 0;
  };

  const getStageLabel = (): string => {
    switch (progress.stage) {
      case 'optimizing':
        return 'Optimiere...';
      case 'uploading':
        return 'Upload...';
      case 'backup':
        return 'Backup...';
      case 'complete':
        return 'Fertig';
      case 'error':
        return 'Fehler';
      default:
        return '';
    }
  };

  const getStageIcon = () => {
    switch (progress.stage) {
      case 'optimizing':
        return <Image className="h-4 w-4 animate-pulse" />;
      case 'uploading':
        return <Upload className="h-4 w-4 animate-pulse" />;
      case 'backup':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'complete':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getFileSize = (bytes?: number) => {
    if (!bytes) return '';
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  const getCompressionRatio = () => {
    if (!progress.originalSize || !progress.optimizedSize) return null;
    const ratio = ((1 - progress.optimizedSize / progress.originalSize) * 100).toFixed(0);
    return parseInt(ratio) > 0 ? `${ratio}%` : null;
  };

  const compressionRatio = getCompressionRatio();

  return (
    <div
      className={cn(
        'p-3 rounded-lg border bg-card transition-all',
        progress.stage === 'error' && 'border-red-200 bg-red-50 dark:bg-red-950/20',
        progress.stage === 'complete' && 'border-green-200 bg-green-50 dark:bg-green-950/20'
      )}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="mt-0.5">{getStageIcon()}</div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-1">
          {/* File Name & Stage */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium truncate flex-1">
              {progress.fileName}
            </span>
            <Badge variant="outline" className="text-xs shrink-0">
              {getStageLabel()}
            </Badge>
          </div>

          {/* Progress Bar */}
          {progress.stage !== 'complete' && progress.stage !== 'error' && (
            <Progress value={getProgressValue()} className="h-1.5" />
          )}

          {/* Info */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              {progress.stage === 'optimizing' && progress.originalSize && (
                <>
                  <span>{getFileSize(progress.originalSize)}</span>
                  <span>→</span>
                  <span className="font-medium">
                    {getFileSize(progress.optimizedSize || progress.originalSize)}
                  </span>
                </>
              )}
              {compressionRatio && (
                <Badge variant="secondary" className="text-xs">
                  -{compressionRatio}
                </Badge>
              )}
            </div>
            {progress.stage !== 'complete' && progress.stage !== 'error' && (
              <span>{getProgressValue().toFixed(0)}%</span>
            )}
          </div>

          {/* Error Message */}
          {progress.stage === 'error' && progress.error && (
            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
              {progress.error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
