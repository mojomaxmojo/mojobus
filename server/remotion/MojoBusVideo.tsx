/**
 * MojoBusVideo — Haupt-Remotion Composition
 * 
 * Aufbau jedes Videos:
 *  [0 – HOOK_FRAMES]              Hook: Erstes Foto + animierter Titel
 *  [HOOK_FRAMES – HOOK+SLIDES]    Slideshow: Fotos mit Ken Burns + Transitions
 *  [HOOK+SLIDES – END]            CTA: Endkarte (6 Sekunden)
 *
 * Props werden via inputProps an renderMedia() übergeben.
 */

import React from 'react';
import { AbsoluteFill, Sequence, useVideoConfig } from 'remotion';

import { KenBurnsImage, pickDirection } from './components/KenBurnsImage';
import { ColorGradeOverlay, ColorGradeWrapper, lifestyleToGrade, type ColorGrade } from './components/ColorGradeOverlay';
import { HookTitle } from './components/HookTitle';
import { LocationBadge } from './components/LocationBadge';
import { MojoBusCTA } from './components/MojoBusCTA';
import { ProgressBar } from './components/ProgressBar';
import { AudioLayer } from './components/AudioLayer';
import { FilmGrain } from './components/FilmGrain';
import { FadeIn, FadeOut, ZoomBlur } from './components/CrossFade';
import { StoryCaption } from './components/StoryCaption';

export interface MojoBusVideoProps {
  /** Array von Bild-URLs (Blossom CDN) */
  imageUrls: string[];
  /** Titel des Posts → Hook-Titel */
  title: string;
  /** Kurze Zusammenfassung / Story-Text */
  summary?: string;
  /** Location-String für LocationBadge */
  location?: string;
  country?: string;
  /** Lifestyle bestimmt Color Grade + CTA-Text */
  lifestyle?: string;
  /** Musik-Datei URL (optional) */
  musicUrl?: string;
  /** Sekunden pro Bild in der Slideshow (3-8) */
  secondsPerImage?: number;
  /** Aspect Ratio: '16:9' | '9:16' | '1:1' */
  aspectRatio?: '16:9' | '9:16' | '1:1';
  /** Explizite Color Grade (überschreibt lifestyle-default) */
  colorGrade?: ColorGrade;
  /** Film-Grain Intensität */
  filmGrain?: 'none' | 'fine' | 'medium' | 'coarse';
  /** Caption-Texte pro Bild (optional) */
  captions?: string[];
  /** Website URL für CTA */
  websiteUrl?: string;
  /** Handle / Social Handle */
  handle?: string;
  /** Akzentfarbe */
  accentColor?: string;
}

/** Berechnet Gesamt-Frames für das Video */
export function calculateDuration(
  imageCount: number,
  fps: number,
  secondsPerImage: number
): { totalFrames: number; hookFrames: number; ctaFrames: number; slideshowFrames: number } {
  const hookFrames = 4 * fps;   // 4 Sekunden Hook
  const ctaFrames = 6 * fps;    // 6 Sekunden CTA
  const perSlide = Math.round(secondsPerImage * fps);
  const slideshowFrames = imageCount * perSlide;
  const totalFrames = hookFrames + slideshowFrames + ctaFrames;
  return { totalFrames, hookFrames, ctaFrames, slideshowFrames };
}

export const MojoBusVideo: React.FC<MojoBusVideoProps> = ({
  imageUrls,
  title,
  summary,
  location,
  country,
  lifestyle = 'mojobus',
  musicUrl,
  secondsPerImage = 5,
  colorGrade,
  filmGrain = 'fine',
  captions = [],
  websiteUrl = 'mojobus.co',
  handle = '@mojobus',
  accentColor = '#F59E0B',
}) => {
  const { fps } = useVideoConfig();

  const grade = colorGrade || lifestyleToGrade(lifestyle);
  const images = imageUrls.slice(0, 20); // max 20 Bilder
  const imageCount = images.length;

  const { hookFrames, ctaFrames, slideshowFrames } = calculateDuration(
    imageCount, fps, secondsPerImage
  );

  const perSlide = Math.round(secondsPerImage * fps);
  const TRANSITION_FRAMES = Math.min(12, Math.round(fps * 0.4)); // 0.4s Überblendung

  return (
    <AbsoluteFill style={{ background: '#000' }}>
      {/* ═══════════════════════════════════════════
          SCHICHT 1: Bilder mit Ken Burns + Color Grade
      ═══════════════════════════════════════════ */}
      <ColorGradeWrapper grade={grade}>

        {/* HOOK — erstes Bild als Hintergrund */}
        {images[0] && (
          <Sequence from={0} durationInFrames={hookFrames + TRANSITION_FRAMES}>
            <FadeOut durationFrames={TRANSITION_FRAMES} totalFrames={hookFrames + TRANSITION_FRAMES}>
              <KenBurnsImage
                src={images[0]}
                direction={pickDirection(0)}
                intensity={0.12}
              />
            </FadeOut>
          </Sequence>
        )}

        {/* SLIDESHOW — alle Bilder nacheinander */}
        {images.map((src, i) => {
          const startFrame = hookFrames + i * perSlide;
          const isLast = i === imageCount - 1;
          const endFrame = startFrame + perSlide + (isLast ? 0 : TRANSITION_FRAMES);

          return (
            <Sequence
              key={i}
              from={startFrame}
              durationInFrames={endFrame - startFrame}
            >
              {/* Einblenden */}
              <ZoomBlur durationFrames={TRANSITION_FRAMES}>
                {/* Ausblenden (außer letztem Bild) */}
                {!isLast ? (
                  <FadeOut durationFrames={TRANSITION_FRAMES} totalFrames={endFrame - startFrame}>
                    <KenBurnsImage
                      src={src}
                      direction={pickDirection(i + 1)}
                      intensity={0.13}
                    />
                  </FadeOut>
                ) : (
                  <KenBurnsImage
                    src={src}
                    direction={pickDirection(i + 1)}
                    intensity={0.13}
                  />
                )}
              </ZoomBlur>
            </Sequence>
          );
        })}

        {/* CTA — letztes Bild stark dunkel abgeblendet als Hintergrund */}
        {images[imageCount - 1] && (
          <Sequence
            from={hookFrames + slideshowFrames}
            durationInFrames={ctaFrames}
          >
            <FadeIn durationFrames={15}>
              <KenBurnsImage
                src={images[imageCount - 1]}
                direction="zoom-out"
                intensity={0.05}
              />
            </FadeIn>
          </Sequence>
        )}

      </ColorGradeWrapper>

      {/* ═══════════════════════════════════════════
          SCHICHT 2: Color Grade Overlay (Gradient + Vignette)
      ═══════════════════════════════════════════ */}
      <ColorGradeOverlay grade={grade} />

      {/* ═══════════════════════════════════════════
          SCHICHT 3: Film Grain
      ═══════════════════════════════════════════ */}
      {filmGrain !== 'none' && <FilmGrain intensity={filmGrain} opacity={0.05} />}

      {/* ═══════════════════════════════════════════
          SCHICHT 4: Hook Titel (erste 4 Sek)
      ═══════════════════════════════════════════ */}
      <Sequence from={0} durationInFrames={hookFrames}>
        <HookTitle
          title={title}
          subtitle={location || lifestyle.toUpperCase()}
          emoji={lifestyle === 'mojobus' ? '🚌' : lifestyle === 'vanlife' ? '🚐' : lifestyle === 'beachlife' ? '🌊' : '🌍'}
          fromFrame={5}
          toFrame={hookFrames - 5}
          accentColor={accentColor}
        />
      </Sequence>

      {/* ═══════════════════════════════════════════
          SCHICHT 5: Location Badge (erscheint im 2. Slide)
      ═══════════════════════════════════════════ */}
      {location && (
        <Sequence
          from={hookFrames + perSlide}
          durationInFrames={perSlide * 2}
        >
          <LocationBadge
            location={location}
            country={country}
            fromFrame={8}
            toFrame={perSlide * 2 - 8}
            position="bottom-left"
          />
        </Sequence>
      )}

      {/* ═══════════════════════════════════════════
          SCHICHT 6: Story Captions (optional, pro Bild)
      ═══════════════════════════════════════════ */}
      {captions.map((caption, i) => {
        if (!caption) return null;
        const startFrame = hookFrames + i * perSlide + Math.round(fps * 0.5);
        const endFrame = hookFrames + (i + 1) * perSlide - Math.round(fps * 0.5);
        return (
          <StoryCaption
            key={`caption-${i}`}
            text={caption}
            fromFrame={startFrame}
            toFrame={endFrame}
            position="bottom"
            style="minimal"
            accentColor={accentColor}
          />
        );
      })}

      {/* ═══════════════════════════════════════════
          SCHICHT 7: Summary Text (Mitte des Videos)
      ═══════════════════════════════════════════ */}
      {summary && imageCount >= 3 && (
        <Sequence
          from={hookFrames + Math.floor(imageCount / 2) * perSlide}
          durationInFrames={perSlide}
        >
          <StoryCaption
            text={summary.slice(0, 80)}
            fromFrame={8}
            toFrame={perSlide - 8}
            position="bottom"
            style="subtitle"
            accentColor={accentColor}
          />
        </Sequence>
      )}

      {/* ═══════════════════════════════════════════
          SCHICHT 8: CTA Endkarte
      ═══════════════════════════════════════════ */}
      <Sequence
        from={hookFrames + slideshowFrames}
        durationInFrames={ctaFrames}
      >
        <MojoBusCTA
          lifestyle={lifestyle}
          websiteUrl={websiteUrl}
          handle={handle}
          accentColor={accentColor}
        />
      </Sequence>

      {/* ═══════════════════════════════════════════
          SCHICHT 9: Progress Bar (Retention)
      ═══════════════════════════════════════════ */}
      <ProgressBar
        color={accentColor}
        height={3}
        position="top"
        startFrame={hookFrames}
        endFrame={hookFrames + slideshowFrames}
      />

      {/* ═══════════════════════════════════════════
          SCHICHT 10: Audio mit Fade-In/Out
      ═══════════════════════════════════════════ */}
      {musicUrl && (
        <AudioLayer
          src={musicUrl}
          volume={0.70}
          fadeInFrames={fps * 2}
          fadeOutFrames={fps * 3}
        />
      )}
    </AbsoluteFill>
  );
};
