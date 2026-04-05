/**
 * SlideshowBlock — wiederverwendbare Komponente
 * Verwendet in: MediaUploadForm, NoteForm, PlaceForm, ArticleForm, TripPublishForm
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Video, Loader2, CheckCircle } from '@/lib/icons';
import { useUploadFile } from '@/hooks/useUploadFile';
import { useToast } from '@/hooks/useToast';

interface SlideshowBlockProps {
  imageUrls: string[];
  lifestyle?: string;
  title?: string;
}

export function SlideshowBlock({
  imageUrls,
  lifestyle = 'vanlife',
  title = 'slideshow',
}: SlideshowBlockProps) {
  const { mutateAsync: uploadFile } = useUploadFile();
  const { toast } = useToast();

  const [enabled, setEnabled] = useState(false);
  const [musicMode, setMusicMode] = useState<'local' | 'elevenlabs'>('local');
  const [aspect, setAspect] = useState<'16:9' | '9:16' | '1:1'>('16:9');
  const [imgDuration, setImgDuration] = useState<3 | 4 | 5>(4);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'idle' | 'running' | 'completed' | 'failed'>('idle');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoInfo, setVideoInfo] = useState<{
    sizeMB: string;
    duration: number;
    music: string | null;
  } | null>(null);

  const totalSec = imageUrls.length * imgDuration;

  const statusText =
    progress < 32
      ? 'Bilder herunterladen...'
      : progress < 40
      ? musicMode === 'elevenlabs'
        ? 'KI-Musik generieren...'
        : 'Musik laden...'
      : progress < 85
      ? 'ffmpeg rendert...'
      : 'Zu Blossom hochladen...';

  const generate = async () => {
    if (imageUrls.length === 0) {
      toast({
        title: 'Keine Bilder',
        description: 'Lade zuerst Bilder hoch.',
        variant: 'destructive',
      });
      return;
    }
    setIsGenerating(true);
    setStatus('running');
    setProgress(0);
    setVideoUrl(null);
    setVideoInfo(null);

    try {
      const res = await fetch('/api/generate-slideshow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrls,
          musicMode,
          lifestyle,
          aspectRatio: aspect,
          imageDuration: imgDuration,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);

      toast({
        title: '🎞️ Slideshow wird erstellt...',
        description: `${data.imageCount} Bilder · ${data.totalDuration}s · ${
          musicMode === 'elevenlabs' ? 'KI-Musik ($0.50)' : 'Lokale Musik (gratis)'
        }`,
      });

      let attempts = 0;
      const poll = async (): Promise<void> => {
        if (attempts++ > 120) throw new Error('Timeout nach 6 Minuten.');
        const pollRes = await fetch(`/api/slideshow-status/${data.jobId}`);
        const pollData = await pollRes.json();
        setProgress(pollData.progress || 0);

        if (pollData.status === 'completed' && pollData.downloadUrl) {
          toast({
            title: '📤 Lade zu Blossom hoch...',
            description: `${pollData.videoSizeMB}MB`,
          });

          const videoRes = await fetch(pollData.downloadUrl);
          if (!videoRes.ok)
            throw new Error(`Download fehlgeschlagen: ${videoRes.status}`);
          const blob = await videoRes.blob();

          const safeName = title
            .replace(/[^a-z0-9]/gi, '-')
            .toLowerCase()
            .slice(0, 40);
          const videoFile = new File([blob], `${safeName}-slideshow.mp4`, {
            type: 'video/mp4',
          });
          const blossomTags = await uploadFile(videoFile);
          const blossomUrl = blossomTags.find(
            (t: string[]) => t[0] === 'url'
          )?.[1];
          if (!blossomUrl) throw new Error('Keine Blossom-URL erhalten.');

          setVideoUrl(blossomUrl);
          setVideoInfo({
            sizeMB: pollData.videoSizeMB,
            duration: pollData.totalDuration,
            music: pollData.musicUsed,
          });
          setStatus('completed');
          setProgress(100);
          toast({
            title: '✅ Slideshow auf Blossom gespeichert!',
            description: `${pollData.totalDuration}s · ${pollData.imageCount} Bilder · Musik: ${
              pollData.musicUsed || 'keine'
            }`,
          });
          return;
        } else if (pollData.status === 'failed') {
          throw new Error(pollData.error || 'Slideshow fehlgeschlagen.');
        } else {
          await new Promise((r) => setTimeout(r, 3000));
          return poll();
        }
      };
      await poll();
    } catch (err: any) {
      setStatus('failed');
      toast({
        title: 'Slideshow Fehler',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
      {/* Header mit Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Video className="h-5 w-5 text-emerald-500" />
          <h3 className="font-semibold">🎞️ Slideshow generieren</h3>
          <span className="text-xs bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full font-medium">
            ffmpeg · Ken Burns · Deep Pan
          </span>
        </div>
        <button
          type="button"
          onClick={() => {
            setEnabled((v) => !v);
            if (enabled) {
              setVideoUrl(null);
              setStatus('idle');
            }
          }}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
            enabled
              ? 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700'
              : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-600 hover:border-emerald-400 hover:text-emerald-600'
          }`}
        >
          {enabled ? (
            <>
              <span className="w-2 h-2 rounded-full bg-white inline-block" />
              Aktiv
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-gray-400 inline-block" />
              Inaktiv
            </>
          )}
        </button>
      </div>

      {/* Bilder-Info immer sichtbar */}
      <p className="text-xs text-muted-foreground">
        {imageUrls.length > 0 ? (
          <>
            🖼️{' '}
            <strong>
              {imageUrls.length} Bild{imageUrls.length !== 1 ? 'er' : ''}
            </strong>{' '}
            verfügbar · ~{totalSec}s Slideshow · Ken Burns + Deep Pan
          </>
        ) : (
          '⚠️ Noch keine Bilder — lade zuerst Bilder hoch.'
        )}
      </p>

      {/* Erweiterter Bereich nur wenn aktiv */}
      {enabled && (
        <div className="space-y-4 pt-2 border-t border-muted">
          {/* Musik-Schalter */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">🎵 Musik</Label>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  {
                    mode: 'local' as const,
                    icon: '🎸',
                    label: 'Lokal',
                    sub: 'Fertige Chill-Tracks',
                    price: '$0.00 — kostenlos',
                    priceClass: 'text-emerald-600',
                  },
                  {
                    mode: 'elevenlabs' as const,
                    icon: '🤖',
                    label: 'KI-Musik',
                    sub: 'ElevenLabs · Lifestyle-passend',
                    price: '$0.50 via ppq.ai',
                    priceClass: 'text-amber-600',
                  },
                ] as const
              ).map(({ mode, icon, label, sub, price, priceClass }) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setMusicMode(mode)}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    musicMode === mode
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-emerald-300'
                  }`}
                >
                  <div className="font-medium text-sm">
                    {icon} {label}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {sub}
                  </div>
                  <div className={`text-xs font-medium mt-1 ${priceClass}`}>
                    {price}
                  </div>
                </button>
              ))}
            </div>
            {musicMode === 'elevenlabs' && (
              <p className="text-xs text-muted-foreground bg-amber-50 dark:bg-amber-900/20 rounded p-2">
                🎵 Musik-Stil wird aus Lifestyle{' '}
                <strong>{lifestyle}</strong> generiert.
              </p>
            )}
          </div>

          {/* Format + Sek. pro Bild */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Format</Label>
              <div className="flex gap-1">
                {(['16:9', '9:16', '1:1'] as const).map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setAspect(a)}
                    className={`flex-1 py-1 text-xs rounded border transition-colors ${
                      aspect === a
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white dark:bg-gray-900 text-gray-500 border-gray-300 dark:border-gray-600 hover:border-emerald-400'
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Sek. pro Bild</Label>
              <div className="flex gap-1">
                {([3, 4, 5] as const).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setImgDuration(d)}
                    className={`flex-1 py-1 text-xs rounded border transition-colors ${
                      imgDuration === d
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white dark:bg-gray-900 text-gray-500 border-gray-300 dark:border-gray-600 hover:border-emerald-400'
                    }`}
                  >
                    {d}s
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Info-Zeile */}
          <div className="flex justify-between text-xs bg-gray-50 dark:bg-gray-800/50 rounded p-2 text-muted-foreground">
            <span>🖼️ {imageUrls.length} Bilder</span>
            <span>⏱️ ~{imageUrls.length * imgDuration}s</span>
            <span>
              💰{' '}
              <strong className="text-emerald-600">
                ${musicMode === 'elevenlabs' ? '0.50' : '0.00'}
              </strong>
            </span>
          </div>

          {/* Server-Hinweis */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-blue-50 dark:bg-blue-900/20 rounded p-2">
            <span>🔒</span>
            <span>ffmpeg läuft auf dem VPS — direkt zu Blossom.</span>
          </div>

          {/* Generieren Button */}
          <Button
            type="button"
            onClick={generate}
            disabled={isGenerating || imageUrls.length === 0}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {progress > 0 ? `${progress}% — ` : ''}
                {statusText}
              </>
            ) : (
              <>
                <Video className="h-4 w-4 mr-2" />
                🎞️ Slideshow generieren
              </>
            )}
          </Button>

          {/* Fortschrittsbalken */}
          {isGenerating && progress > 0 && (
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          {/* Ergebnis */}
          {status === 'completed' && videoUrl && (
            <div className="space-y-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                <CheckCircle className="h-4 w-4" />
                <span className="font-medium text-sm">
                  ✅ Blossom · {videoInfo?.duration}s · {videoInfo?.sizeMB}MB ·
                  🎵 {videoInfo?.music || 'keine Musik'}
                </span>
              </div>
              <video
                src={videoUrl}
                controls
                autoPlay
                muted
                loop
                className="w-full rounded-lg max-h-56 object-cover"
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => navigator.clipboard.writeText(videoUrl)}
                  className="flex-1"
                >
                  📋 URL kopieren
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(videoUrl, '_blank')}
                >
                  Öffnen
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setVideoUrl(null);
                    setStatus('idle');
                    setProgress(0);
                  }}
                >
                  Neu
                </Button>
              </div>
            </div>
          )}

          {/* Fehler */}
          {status === 'failed' && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-lg text-sm text-red-700 dark:text-red-300">
              ❌ Slideshow fehlgeschlagen. Prüfe ob ffmpeg + Musik-Ordner auf
              dem VPS vorhanden sind.
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="mt-2 w-full"
                onClick={() => setStatus('idle')}
              >
                Erneut versuchen
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
