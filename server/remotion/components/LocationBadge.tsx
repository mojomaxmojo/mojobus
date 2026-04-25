/**
 * LocationBadge — Orts-Anzeige mit Pin-Icon
 * Slide-in von links, zeigt Location + Land-Flag
 */

import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

interface LocationBadgeProps {
  location: string;
  country?: string;
  countryFlag?: string;
  fromFrame?: number;
  toFrame?: number;
  position?: 'top-left' | 'bottom-left' | 'bottom-right';
}

const FLAG_MAP: Record<string, string> = {
  portugal: '🇵🇹',
  spain: '🇪🇸',
  spanien: '🇪🇸',
  france: '🇫🇷',
  frankreich: '🇫🇷',
  italy: '🇮🇹',
  italien: '🇮🇹',
  croatia: '🇭🇷',
  kroatien: '🇭🇷',
  germany: '🇩🇪',
  deutschland: '🇩🇪',
  austria: '🇦🇹',
  österreich: '🇦🇹',
  switzerland: '🇨🇭',
  schweiz: '🇨🇭',
  usa: '🇺🇸',
  mexico: '🇲🇽',
  morocco: '🇲🇦',
  marokko: '🇲🇦',
  greece: '🇬🇷',
  griechenland: '🇬🇷',
};

export const LocationBadge: React.FC<LocationBadgeProps> = ({
  location,
  country,
  countryFlag,
  fromFrame = 0,
  toFrame,
  position = 'bottom-left',
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();
  const end = toFrame ?? durationInFrames - 5;

  const enter = spring({
    frame: frame - fromFrame,
    fps,
    config: { damping: 18, stiffness: 100 },
  });

  const fadeOut = interpolate(frame, [end - 8, end], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  if (frame < fromFrame || frame > end) return null;

  const translateX = interpolate(enter, [0, 1], [-200, 0]);
  const opacity = Math.min(enter, fadeOut);

  const flag =
    countryFlag ||
    (country ? FLAG_MAP[country.toLowerCase()] : undefined) ||
    '📍';

  const posStyles: React.CSSProperties =
    position === 'top-left'
      ? { top: '8%', left: '6%' }
      : position === 'bottom-right'
      ? { bottom: '12%', right: '6%' }
      : { bottom: '20%', left: '6%' };

  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <div
        style={{
          position: 'absolute',
          ...posStyles,
          opacity,
          transform: `translateX(${translateX}px)`,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(8px)',
          borderRadius: '100px',
          padding: '0.4rem 1rem 0.4rem 0.7rem',
          border: '1px solid rgba(255,255,255,0.15)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        }}
      >
        <span style={{ fontSize: '1.1rem' }}>{flag}</span>
        <span
          style={{
            fontFamily: '"Montserrat", Arial, sans-serif',
            fontWeight: 600,
            fontSize: 'clamp(0.65rem, 2vw, 0.9rem)',
            color: '#FFFFFF',
            letterSpacing: '0.04em',
            whiteSpace: 'nowrap',
            textShadow: '0 1px 4px rgba(0,0,0,0.5)',
          }}
        >
          {location}
        </span>
      </div>
    </AbsoluteFill>
  );
};
