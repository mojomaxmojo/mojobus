/**
 * MojoBusCTA — Call-to-Action Endkarte (letzte 6 Sekunden)
 * Zeigt: Logo-Text + Follow-Aufforderung + Website + Lifestyle-spezifische Message
 */

import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

interface MojoBusCTAProps {
  lifestyle?: string;
  websiteUrl?: string;
  /** Nostr npub oder Social Handle */
  handle?: string;
  accentColor?: string;
  logoText?: string;
}

const LIFESTYLE_MESSAGES: Record<string, { cta: string; tagline: string; emoji: string }> = {
  mojobus: {
    cta: 'FOLGE UNSEREM ABENTEUER',
    tagline: 'Mojo & Susanne · Unterwegs im Oldtimer',
    emoji: '🚌',
  },
  vanlife: {
    cta: 'FOLGE DEM VAN LEBEN',
    tagline: 'Freiheit auf vier Rädern',
    emoji: '🚐',
  },
  rvlife: {
    cta: 'JOIN THE RV LIFE',
    tagline: 'Life on the road',
    emoji: '🏕️',
  },
  beachlife: {
    cta: 'SURFE MIT UNS',
    tagline: 'Strand · Sonne · Freiheit',
    emoji: '🌊',
  },
  wohnmobil: {
    cta: 'ENTDECKE EUROPA',
    tagline: 'Im Wohnmobil durch Europa',
    emoji: '🏠',
  },
  'perpetual-travelers': {
    cta: 'THE WORLD IS HOME',
    tagline: 'Perpetual travelers · No fixed address',
    emoji: '🌍',
  },
};

export const MojoBusCTA: React.FC<MojoBusCTAProps> = ({
  lifestyle = 'mojobus',
  websiteUrl = 'mojobus.co',
  handle = '@mojobus',
  accentColor = '#F59E0B',
  logoText = 'MOJOBUS',
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();

  const msg = LIFESTYLE_MESSAGES[lifestyle] || LIFESTYLE_MESSAGES.mojobus;

  // Gesamter CTA: spring-Einblendung
  const enter = spring({ frame, fps, config: { damping: 14, stiffness: 80 } });
  const opacity = interpolate(enter, [0, 1], [0, 1]);
  const scale = interpolate(enter, [0, 1], [0.85, 1]);

  // Hintergrund-Overlay-Fade
  const bgOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      {/* Dunkler Hintergrund */}
      <AbsoluteFill
        style={{
          background: `linear-gradient(135deg, rgba(0,0,0,${bgOpacity * 0.85}) 0%, rgba(20,10,0,${bgOpacity * 0.9}) 100%)`,
        }}
      />

      {/* Dekorativer Akzent-Kreis */}
      <div
        style={{
          position: 'absolute',
          width: '70vw',
          height: '70vw',
          maxWidth: '500px',
          maxHeight: '500px',
          borderRadius: '50%',
          border: `2px solid ${accentColor}30`,
          opacity: bgOpacity * 0.5,
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: '50vw',
          height: '50vw',
          maxWidth: '350px',
          maxHeight: '350px',
          borderRadius: '50%',
          border: `1px solid ${accentColor}20`,
          opacity: bgOpacity * 0.3,
        }}
      />

      {/* Inhalt */}
      <div
        style={{
          opacity,
          transform: `scale(${scale})`,
          textAlign: 'center',
          padding: '2rem',
          position: 'relative',
          zIndex: 10,
          maxWidth: '80%',
        }}
      >
        {/* Emoji */}
        <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>
          {msg.emoji}
        </div>

        {/* Logo */}
        <div
          style={{
            fontFamily: '"Montserrat", "Arial Black", sans-serif',
            fontWeight: 900,
            fontSize: 'clamp(2rem, 9vw, 4.5rem)',
            color: accentColor,
            letterSpacing: '0.12em',
            textShadow: `0 0 30px ${accentColor}60`,
            marginBottom: '0.5rem',
          }}
        >
          {logoText}
        </div>

        {/* CTA Text */}
        <div
          style={{
            fontFamily: '"Montserrat", Arial, sans-serif',
            fontWeight: 700,
            fontSize: 'clamp(0.7rem, 3vw, 1.2rem)',
            color: '#FFFFFF',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            marginBottom: '0.75rem',
          }}
        >
          {msg.cta}
        </div>

        {/* Tagline */}
        <div
          style={{
            fontFamily: '"Montserrat", Arial, sans-serif',
            fontWeight: 400,
            fontSize: 'clamp(0.6rem, 2.2vw, 0.95rem)',
            color: 'rgba(255,255,255,0.7)',
            letterSpacing: '0.05em',
            marginBottom: '1.5rem',
          }}
        >
          {msg.tagline}
        </div>

        {/* Trennlinie */}
        <div
          style={{
            width: '40px',
            height: '2px',
            background: accentColor,
            margin: '0 auto 1.5rem',
            borderRadius: '1px',
          }}
        />

        {/* Website + Handle */}
        <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <div
            style={{
              fontFamily: '"Montserrat", Arial, sans-serif',
              fontWeight: 600,
              fontSize: 'clamp(0.65rem, 2.2vw, 0.9rem)',
              color: accentColor,
              letterSpacing: '0.05em',
            }}
          >
            🌐 {websiteUrl}
          </div>
          <div
            style={{
              fontFamily: '"Montserrat", Arial, sans-serif',
              fontWeight: 600,
              fontSize: 'clamp(0.65rem, 2.2vw, 0.9rem)',
              color: 'rgba(255,255,255,0.8)',
              letterSpacing: '0.05em',
            }}
          >
            ⚡ {handle}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
