/**
 * HookTitle — Stop-the-Scroll Titel für die ersten 4 Sekunden
 * Animiert: Slide-up + Fade-in Text mit optionalem Emoji-Icon
 */

import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

interface HookTitleProps {
  title: string;
  subtitle?: string;
  emoji?: string;
  /** Sichtbar von Frame X bis Frame Y */
  fromFrame?: number;
  toFrame?: number;
  textColor?: string;
  accentColor?: string;
}

export const HookTitle: React.FC<HookTitleProps> = ({
  title,
  subtitle,
  emoji = '🌍',
  fromFrame = 0,
  toFrame,
  textColor = '#FFFFFF',
  accentColor = '#F59E0B',
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();
  const end = toFrame ?? durationInFrames;

  // Einblenden
  const enter = spring({
    frame: frame - fromFrame,
    fps,
    config: { damping: 15, stiffness: 120, mass: 0.8 },
  });

  // Ausblenden (letzte 10 Frames)
  const fadeOut = interpolate(
    frame,
    [end - 10, end],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  if (frame < fromFrame || frame > end) return null;

  const opacity = Math.min(enter, fadeOut);
  const translateY = interpolate(enter, [0, 1], [60, 0]);

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        padding: '10%',
        pointerEvents: 'none',
      }}
    >
      {/* Dunkler Gradient-Hintergrund für Lesbarkeit */}
      <AbsoluteFill
        style={{
          background: 'linear-gradient(180deg, rgba(0,0,0,0.0) 0%, rgba(0,0,0,0.65) 60%, rgba(0,0,0,0.85) 100%)',
        }}
      />

      <div
        style={{
          opacity,
          transform: `translateY(${translateY}px)`,
          textAlign: 'center',
          position: 'relative',
          zIndex: 10,
          maxWidth: '85%',
        }}
      >
        {/* Emoji */}
        {emoji && (
          <div
            style={{
              fontSize: '3.5rem',
              marginBottom: '0.5rem',
              filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.6))',
            }}
          >
            {emoji}
          </div>
        )}

        {/* Haupttitel */}
        <div
          style={{
            fontFamily: '"Montserrat", "Arial Black", sans-serif',
            fontWeight: 900,
            fontSize: 'clamp(2rem, 8vw, 5rem)',
            color: textColor,
            textShadow: '0 4px 20px rgba(0,0,0,0.8), 0 2px 4px rgba(0,0,0,0.6)',
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
            textTransform: 'uppercase',
            wordBreak: 'break-word',
          }}
        >
          {title}
        </div>

        {/* Akzentlinie */}
        <div
          style={{
            width: '60px',
            height: '4px',
            background: accentColor,
            margin: '1rem auto',
            borderRadius: '2px',
            boxShadow: `0 0 12px ${accentColor}99`,
          }}
        />

        {/* Untertitel */}
        {subtitle && (
          <div
            style={{
              fontFamily: '"Montserrat", Arial, sans-serif',
              fontWeight: 500,
              fontSize: 'clamp(0.9rem, 3vw, 1.5rem)',
              color: 'rgba(255,255,255,0.90)',
              textShadow: '0 2px 8px rgba(0,0,0,0.7)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            {subtitle}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
