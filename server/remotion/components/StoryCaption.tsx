/**
 * StoryCaption — Text-Einblendung während Slideshow
 * Zeigt kurze Story-Texte / Captions unten im Bild
 * → ideal für Instagram Reels und TikTok
 */

import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

interface StoryCaptionProps {
  text: string;
  fromFrame: number;
  toFrame: number;
  position?: 'bottom' | 'center' | 'top';
  style?: 'minimal' | 'bold' | 'subtitle';
  accentColor?: string;
}

export const StoryCaption: React.FC<StoryCaptionProps> = ({
  text,
  fromFrame,
  toFrame,
  position = 'bottom',
  style = 'minimal',
  accentColor = '#F59E0B',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  if (frame < fromFrame || frame > toFrame) return null;

  const localFrame = frame - fromFrame;
  const duration = toFrame - fromFrame;

  const enter = spring({
    frame: localFrame,
    fps,
    config: { damping: 18, stiffness: 120 },
  });

  const fadeOut = interpolate(localFrame, [duration - 12, duration], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const opacity = Math.min(enter, fadeOut);
  const translateY = interpolate(enter, [0, 1], [30, 0]);

  const posStyle: React.CSSProperties =
    position === 'top'
      ? { top: '8%', left: '8%', right: '8%' }
      : position === 'center'
      ? { top: '50%', left: '8%', right: '8%', transform: `translateY(calc(-50% + ${translateY}px))` }
      : { bottom: '10%', left: '8%', right: '8%' };

  if (position !== 'center') {
    (posStyle as any).transform = `translateY(${position === 'top' ? -translateY : translateY}px)`;
  }

  const textStyles: React.CSSProperties =
    style === 'bold'
      ? {
          fontWeight: 800,
          fontSize: 'clamp(1rem, 4vw, 2rem)',
          color: '#FFFFFF',
          textShadow: '0 2px 12px rgba(0,0,0,0.8)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }
      : style === 'subtitle'
      ? {
          fontWeight: 500,
          fontSize: 'clamp(0.75rem, 2.5vw, 1.2rem)',
          color: 'rgba(255,255,255,0.95)',
          textShadow: '0 1px 8px rgba(0,0,0,0.9)',
          fontStyle: 'italic',
          letterSpacing: '0.03em',
        }
      : {
          fontWeight: 600,
          fontSize: 'clamp(0.8rem, 2.8vw, 1.3rem)',
          color: '#FFFFFF',
          textShadow: '0 2px 10px rgba(0,0,0,0.85)',
          letterSpacing: '0.02em',
        };

  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      {/* Gradient-Hintergrund für Lesbarkeit */}
      {position === 'bottom' && (
        <AbsoluteFill
          style={{
            background: 'linear-gradient(0deg, rgba(0,0,0,0.6) 0%, transparent 35%)',
            opacity,
          }}
        />
      )}
      <div
        style={{
          position: 'absolute',
          ...posStyle,
          opacity,
          padding: '0.5rem 0.5rem',
        }}
      >
        {/* Akzent-Linie links */}
        {style !== 'subtitle' && (
          <div
            style={{
              width: '3px',
              height: '100%',
              background: accentColor,
              position: 'absolute',
              left: 0,
              top: 0,
              borderRadius: '2px',
              boxShadow: `0 0 8px ${accentColor}80`,
            }}
          />
        )}
        <div
          style={{
            fontFamily: '"Montserrat", Arial, sans-serif',
            paddingLeft: style !== 'subtitle' ? '0.75rem' : 0,
            ...textStyles,
          }}
        >
          {text}
        </div>
      </div>
    </AbsoluteFill>
  );
};
