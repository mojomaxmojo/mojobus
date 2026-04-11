/**
 * SlideshowBlock — wiederverwendbare Komponente
 * Verwendet in: MediaUploadForm, NoteForm, PlaceForm, ArticleForm, TripPublishForm
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Video, Loader2, CheckCircle } from '@/lib/icons';
import { useUploadFile } from '@/hooks/useUploadFile';
import { useToast } from '@/hooks/useToast';

interface SlideshowBlockProps {
  imageUrls: string[];
  /** Lokale File-Objekte die noch nicht zu Blossom hochgeladen wurden */
  localFiles?: File[];
  lifestyle?: string;
  title?: string;
  /** Wird aufgerufen wenn das Video fertig zu Blossom hochgeladen wurde */
  onVideoReady?: (videoUrl: string) => void;
}

export function SlideshowBlock({
  imageUrls,
  localFiles = [],
  lifestyle = 'mojobus',
  title = 'slideshow',
  onVideoReady,
}: SlideshowBlockProps) {
  const { mutateAsync: uploadFile } = useUploadFile();
  const { toast } = useToast();

  const [enabled, setEnabled] = useState(false);
  const [musicMode, setMusicMode] = useState<'local' | 'elevenlabs'>('local');
  const [aspect, setAspect] = useState<'16:9' | '9:16' | '1:1'>('16:9');
  const [imgDuration, setImgDuration] = useState<4 | 6 | 8>(4);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploadingLocal, setIsUploadingLocal] = useState(false);
  const [uploadedLocalUrls, setUploadedLocalUrls] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'idle' | 'running' | 'completed' | 'failed'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoInfo, setVideoInfo] = useState<{
    sizeMB: string;
    duration: number;
    music: string | null;
  } | null>(null);
  const [localMusicAvailable, setLocalMusicAvailable] = useState<boolean | null>(null);
  const [localMusicFiles, setLocalMusicFiles] = useState<string[]>([]);
  const [musicDir, setMusicDir] = useState<string>('');

  // Effektive Bild-URLs: bereits hochgeladene ODER lokal hochgeladene
  const effectiveUrls = uploadedLocalUrls.length > 0 ? uploadedLocalUrls : imageUrls;
  // Ob noch lokale Dateien vorhanden sind die noch nicht hochgeladen wurden
  const hasUnuploadedLocal = localFiles.length > 0 && imageUrls.length === 0 && uploadedLocalUrls.length === 0;

  /** Lädt lokale Dateien zuerst zu Blossom hoch, dann startet die Slideshow */
  const uploadLocalThenGenerate = async () => {
    if (localFiles.length === 0) return;
    setIsUploadingLocal(true);
    const urls: string[] = [];
    try {
      toast({ title: '📤 Bilder werden zu Blossom hochgeladen...', description: `${localFiles.length} Bilder` });
      for (let i = 0; i < localFiles.length; i++) {
        const f = localFiles[i];
        if (!f.type.startsWith('image/')) continue;
        const tags = await uploadFile(f);
        const url = (tags as string[][]).find(t => t[0] === 'url')?.[1];
        if (url) urls.push(url);
        setProgress(Math.round(((i + 1) / localFiles.length) * 30)); // 0-30% für Upload
      }
      if (urls.length === 0) throw new Error('Kein Bild konnte hochgeladen werden.');
      setUploadedLocalUrls(urls);
      toast({ title: `✅ ${urls.length} Bilder hochgeladen`, description: 'Starte Slideshow-Generierung...' });
    } catch (err: any) {
      toast({ title: 'Upload Fehler', description: err.message, variant: 'destructive' });
      setIsUploadingLocal(false);
      return;
    }
    setIsUploadingLocal(false);
    return urls;
  };

  // Musik-Status beim Aktivieren einmalig abrufen
  useEffect(() => {
    if (enabled && localMusicAvailable === null) {
      fetch('/api/slideshow-music-status')
        .then(r => r.json())
        .then(data => {
          setLocalMusicAvailable(data.available);
          setLocalMusicFiles(data.files || []);
          setMusicDir(data.musicDir || '');
        })
        .catch(() => setLocalMusicAvailable(false));
    }
  }, [enabled, localMusicAvailable]);

  const totalSec = effectiveUrls.length * imgDuration;

  const statusText =
    isUploadingLocal
      ? `Bilder hochladen... ${progress}%`
      : progress < 32
      ? 'Bilder herunterladen...'
      : progress < 40
      ? musicMode === 'elevenlabs'
        ? 'KI-Musik generieren...'
        : 'Musik laden...'
      : progress < 85
      ? 'ffmpeg rendert...'
      : 'Zu Blossom hochladen...';

  const generate = async () => {
    // Wenn noch keine URLs vorhanden → zuerst zu Blossom hochladen
    let urlsToUse = effectiveUrls;
    if (urlsToUse.length === 0 && localFiles.length > 0) {
      const uploaded = await uploadLocalThenGenerate();
      if (!uploaded || uploaded.length === 0) return;
      urlsToUse = uploaded;
    }

    if (urlsToUse.length === 0) {
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
    setErrorMessage(null);

    // Hilfsfunktion: Response sicher als JSON parsen – zeigt echten Fehlertext wenn kein JSON
    const safeJson = async (response: Response) => {
      const text = await response.text();
      try {
        return JSON.parse(text);
      } catch {
        // Server hat kein JSON gesendet (z.B. nginx 502, HTML-Fehlerseite, leere Antwort)
        const preview = text.slice(0, 200).replace(/<[^>]+>/g, '').trim();
        throw new Error(
          `Server-Fehler HTTP ${response.status}: ${preview || 'Keine Antwort'}`
        );
      }
    };

    try {
      const res = await fetch('/api/generate-slideshow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrls: urlsToUse,
          musicMode,
          lifestyle,
          aspectRatio: aspect,
          imageDuration: imgDuration,
        }),
      });
      const data = await safeJson(res);
      if (!res.ok) throw new Error(data.error || `Server HTTP ${res.status}`);

      toast({
        title: '🎞️ Slideshow wird erstellt...',
        description: `${data.imageCount} Bilder · ${data.totalDuration}s · ${
          musicMode === 'elevenlabs' ? 'KI-Musik ($0.50)' : 'Lokale Musik'
        }`,
      });

      let attempts = 0;
      const poll = async (): Promise<void> => {
        if (attempts++ > 200) throw new Error('Timeout nach 10 Minuten.');
        
        let pollData: any;
        try {
          const pollRes = await fetch(`/api/slideshow-status/${data.jobId}`);
          pollData = await safeJson(pollRes);
        } catch (pollErr: any) {
          // Einzelner Poll-Fehler → kurz warten, nochmal versuchen (max 3x)
          if (attempts < 3) {
            await new Promise((r) => setTimeout(r, 3000));
            return poll();
          }
          throw pollErr;
        }

        setProgress(pollData.progress || 0);

        if (pollData.status === 'completed' && pollData.downloadUrl) {
          toast({
            title: '📤 Lade zu Blossom hoch...',
            description: `${pollData.videoSizeMB}MB`,
          });

          const videoRes = await fetch(pollData.downloadUrl);
          if (!videoRes.ok)
            throw new Error(`Download fehlgeschlagen: HTTP ${videoRes.status}`);
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
          // ElevenLabs-Fehler als Warnung anzeigen (Slideshow wurde trotzdem erstellt)
          if (pollData.elevenlabsError) {
            toast({
              title: '⚠️ ElevenLabs fehlgeschlagen',
              description: `Fallback auf lokale Musik. Fehler: ${pollData.elevenlabsError.slice(0, 120)}`,
              variant: 'destructive',
            });
          }
          // Eltern-Komponente über fertige URL informieren
          onVideoReady?.(blossomUrl);
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
      console.error('[Slideshow] Fehler:', err.message);
      const errMsg = err.message || 'Unbekannter Fehler';
      setErrorMessage(errMsg);
      toast({
        title: 'Slideshow Fehler',
        description: errMsg.length > 150 ? errMsg.slice(0, 147) + '...' : errMsg,
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
        {effectiveUrls.length > 0 ? (
          <>
            🖼️{' '}
            <strong>
              {Math.min(effectiveUrls.length, 30)} Bild{Math.min(effectiveUrls.length, 30) !== 1 ? 'er' : ''}
            </strong>
            {effectiveUrls.length > 30 && <span className="text-amber-500"> (max 30)</span>}
            {' '}verfügbar · ~{totalSec}s Slideshow · Ken Burns + Deep Pan
          </>
        ) : hasUnuploadedLocal ? (
          <>
            🖼️ <strong>{localFiles.filter(f => f.type.startsWith('image/')).length} lokale Bilder</strong>
            {' '}— werden automatisch zu Blossom hochgeladen beim Generieren
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
              <button
                type="button"
                onClick={() => setMusicMode('local')}
                className={`p-3 rounded-lg border text-left transition-all ${
                  musicMode === 'local'
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-emerald-300'
                }`}
              >
                <div className="font-medium text-sm">
                  🎸 Lokal
                  {localMusicAvailable === false && (
                    <span className="ml-1 text-xs text-amber-500">⚠️</span>
                  )}
                  {localMusicAvailable === true && (
                    <span className="ml-1 text-xs text-emerald-500">✓ {localMusicFiles.length} Track{localMusicFiles.length !== 1 ? 's' : ''}</span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {localMusicAvailable === true
                    ? `${localMusicFiles.slice(0, 2).join(', ')}${localMusicFiles.length > 2 ? '...' : ''}`
                    : 'Fertige Chill-Tracks'}
                </div>
                <div className="text-xs font-medium mt-1 text-emerald-600">
                  $0.00 — kostenlos
                </div>
              </button>
              <button
                type="button"
                onClick={() => setMusicMode('elevenlabs')}
                className={`p-3 rounded-lg border text-left transition-all ${
                  musicMode === 'elevenlabs'
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-emerald-300'
                }`}
              >
                <div className="font-medium text-sm">🤖 KI-Musik</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  ElevenLabs · Lifestyle-passend
                </div>
                <div className="text-xs font-medium mt-1 text-amber-600">
                  $0.50 via ppq.ai
                </div>
              </button>
            </div>

            {/* Warnung: keine lokale Musik */}
            {musicMode === 'local' && localMusicAvailable === false && (
              <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-3 space-y-1.5">
                <p className="text-xs font-medium text-amber-700 dark:text-amber-300">
                  ⚠️ Keine lokalen Musik-Dateien gefunden
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Das Video wird ohne Musik (Stille) generiert.
                </p>
                <p className="text-xs text-muted-foreground font-mono bg-white dark:bg-gray-900 rounded px-2 py-1 break-all">
                  {musicDir || 'server/music/'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Lege <strong>.mp3</strong>, <strong>.m4a</strong> oder <strong>.ogg</strong> Dateien in diesen Ordner auf dem VPS. Dann wird automatisch ein zufälliger Track verwendet.
                </p>
                <p className="text-xs text-muted-foreground">
                  Oder wähle <strong>KI-Musik</strong> für automatisch generierte Musik (~$0.50).
                </p>
              </div>
            )}

            {/* Info: lokale Musik vorhanden */}
            {musicMode === 'local' && localMusicAvailable === true && (
              <p className="text-xs text-muted-foreground bg-emerald-50 dark:bg-emerald-900/20 rounded p-2">
                🎵 Zufälliger Track aus <strong>{localMusicFiles.length}</strong> verfügbaren Dateien.
              </p>
            )}

            {/* Info: ElevenLabs */}
            {musicMode === 'elevenlabs' && (
              <p className="text-xs text-muted-foreground bg-amber-50 dark:bg-amber-900/20 rounded p-2">
                🎵 Musik-Stil passend zu <strong>{lifestyle}</strong> wird von ElevenLabs generiert.
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
                {([4, 6, 8] as const).map((d) => (
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
            disabled={isGenerating || isUploadingLocal || (effectiveUrls.length === 0 && localFiles.filter(f => f.type.startsWith('image/')).length === 0)}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {isGenerating || isUploadingLocal ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {progress > 0 ? `${progress}% — ` : ''}
                {statusText}
              </>
            ) : hasUnuploadedLocal ? (
              <>
                <Video className="h-4 w-4 mr-2" />
                📤 Hochladen &amp; Slideshow generieren ({localFiles.filter(f => f.type.startsWith('image/')).length} Bilder)
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

          {/* Fehler-Anzeige mit echtem Fehlertext */}
          {status === 'failed' && errorMessage && (
            <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-3 space-y-2">
              <p className="text-xs font-medium text-red-700 dark:text-red-300">❌ Fehler beim Generieren</p>
              <p className="text-xs text-red-600 dark:text-red-400 font-mono break-all">
                {errorMessage}
              </p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => { setStatus('idle'); setErrorMessage(null); }}
                className="text-xs h-7"
              >
                Erneut versuchen
              </Button>
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
