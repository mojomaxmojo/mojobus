/**
 * LottieBusIcon — Animierter MojoBus in der Endkarte (v2)
 *
 * Komplett neu gezeichneter Bus:
 *  - Realistischere Proportionen (Reisebus / Fernbus-Stil)
 *  - Windschutzscheibe mit Spiegelung
 *  - Panorama-Seitenfenster mit Glaseffekt
 *  - Stoßstange, Unterbodenverkleidung, Chromstreifen
 *  - Scheinwerfer mit Lichteffekt (Tag-/Fernlicht)
 *  - Rückspiegel
 *  - Räder mit Felgendesign (5 Speichen)
 *  - Abgaswölkchen animiert
 *  - Farbige Akzentstreifen seitlich
 */

import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

// ── Hilfsfunktion: pulsierendes Abgas-Wölkchen ────────────────────────────

const ExhaustPuff: React.FC<{
  cx: number;
  cy: number;
  frame: number;
  fps: number;
  delay?: number;
  accentColor?: string;
}> = ({ cx, cy, frame, fps, delay = 0, accentColor = '#F59E0B' }) => {
  const t = ((frame - delay) / fps) % 1.2;
  if (t < 0) return null;

  const opacity = interpolate(t, [0, 0.3, 1.2], [0.5, 0.35, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const scale = interpolate(t, [0, 1.2], [0.4, 1.6], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const dx = interpolate(t, [0, 1.2], [0, -18], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const dy = interpolate(t, [0, 1.2], [0, -8], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <ellipse
      cx={cx + dx}
      cy={cy + dy}
      rx={5 * scale}
      ry={3.5 * scale}
      fill="#c0c8d0"
      opacity={opacity}
    />
  );
};

// ── Felgen-Komponente (5 Speichen) ────────────────────────────────────────

const Wheel: React.FC<{
  cx: number;
  cy: number;
  r: number;
  wheelRot: number;
  accentColor: string;
}> = ({ cx, cy, r, wheelRot, accentColor }) => {
  const spokeAngles = [0, 72, 144, 216, 288]; // 5 Speichen

  return (
    <g transform={`translate(${cx},${cy})`}>
      {/* Reifen außen */}
      <circle r={r} fill="#1a1a1a" />
      {/* Reifen-Profil */}
      <circle r={r} fill="none" stroke="#333" strokeWidth={r * 0.12} />
      <circle r={r * 0.82} fill="#2a2a2a" />

      {/* Felge — dreht sich */}
      <g transform={`rotate(${wheelRot})`}>
        {/* Felgenstern */}
        {spokeAngles.map((a) => {
          const rad = (a * Math.PI) / 180;
          return (
            <line
              key={a}
              x1={Math.cos(rad) * r * 0.22}
              y1={Math.sin(rad) * r * 0.22}
              x2={Math.cos(rad) * r * 0.7}
              y2={Math.sin(rad) * r * 0.7}
              stroke="#bbb"
              strokeWidth={r * 0.14}
              strokeLinecap="round"
            />
          );
        })}
        {/* Felgenring */}
        <circle r={r * 0.68} fill="none" stroke="#aaa" strokeWidth={r * 0.06} />
        <circle r={r * 0.22} fill="#ccc" />
        {/* Nabenmitte */}
        <circle r={r * 0.1} fill="#888" />
        {/* Highlight */}
        <circle r={r * 0.06} fill="#fff" opacity={0.4} cx={-r * 0.04} cy={-r * 0.04} />
      </g>

      {/* Bremssattel (statisch) */}
      <rect
        x={-r * 0.18}
        y={r * 0.35}
        width={r * 0.36}
        height={r * 0.22}
        rx={r * 0.05}
        fill={accentColor}
        opacity={0.9}
      />
    </g>
  );
};

// ── Haupt-Bus-SVG ─────────────────────────────────────────────────────────

const CSSAnimatedBus: React.FC<{
  size?: number;
  accentColor?: string;
  bodyColor?: string;
  color?: string;
  driveIn?: boolean;
  label?: string;
}> = ({
  size = 200,
  accentColor = '#F59E0B',
  bodyColor,
  color = '#FFFFFF',
  driveIn = true,
  label = 'MOJOBUS',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // ── Animationen ──────────────────────────────────────────────────────────
  const enter = spring({ frame, fps, config: { damping: 22, stiffness: 55, mass: 1.1 } });
  const driveInX = driveIn ? interpolate(enter, [0, 1], [-(size * 3), 0]) : 0;

  // Leichtes Wippen (Federung)
  const rockAngle = Math.sin((frame / fps) * Math.PI * 2 * 1.6) * 0.8;
  const bounceY   = Math.abs(Math.sin((frame / fps) * Math.PI * 3.2)) * 2.5;
  const wheelRot  = (frame / fps) * 360 * 1.8;

  // Scheinwerfer-Pulse
  const lightPulse = 0.7 + Math.sin((frame / fps) * Math.PI * 2 * 0.8) * 0.15;

  // ── Maße (skalierbar) ────────────────────────────────────────────────────
  const W  = size;          // Gesamt-Breite
  const H  = size * 0.48;  // Rumpf-Höhe (ohne Räder)
  const WR = size * 0.11;  // Rad-Radius
  const RY = H + WR * 0.6; // Rad-Mittelpunkt Y

  // Bus-Körperfarbe: wenn nicht übergeben → dunklere Variante der accentColor
  const busBody   = bodyColor || '#1e293b';
  const roofColor = '#e2e8f0';
  const glassColor = 'rgba(180, 220, 255, 0.82)';
  const glassHighlight = 'rgba(255,255,255,0.35)';

  // Akzentfarbe leicht dunkler für Streifen-Schatten
  const accentDark = accentColor + 'cc';

  return (
    <div style={{
      transform: `translateX(${driveInX}px) rotate(${rockAngle}deg) translateY(${bounceY}px)`,
      transformOrigin: 'bottom center',
      display: 'inline-block',
      filter: 'drop-shadow(0 8px 20px rgba(0,0,0,0.55))',
    }}>
      <svg
        width={W}
        height={RY + WR * 1.15}
        viewBox={`0 0 ${W} ${RY + WR * 1.15}`}
        overflow="visible"
      >
        <defs>
          {/* Glas-Gradient für Windschutzscheibe */}
          <linearGradient id="windshield-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#c8e6ff" stopOpacity="0.9" />
            <stop offset="40%" stopColor="#e8f4ff" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#90c4e8" stopOpacity="0.6" />
          </linearGradient>

          {/* Seitenfenster-Gradient */}
          <linearGradient id="side-glass-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#daf0ff" stopOpacity="0.85" />
            <stop offset="50%" stopColor="#b8dcf8" stopOpacity="0.65" />
            <stop offset="100%" stopColor="#7ab8e0" stopOpacity="0.5" />
          </linearGradient>

          {/* Bus-Körper Gradient (Metallic) */}
          <linearGradient id="body-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={roofColor} />
            <stop offset="15%" stopColor={roofColor} />
            <stop offset="22%" stopColor={accentColor} />
            <stop offset="28%" stopColor={accentColor} />
            <stop offset="30%" stopColor={busBody} />
            <stop offset="85%" stopColor={busBody} />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>

          {/* Scheinwerfer-Glow */}
          <radialGradient id="headlight-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fff9c4" stopOpacity="1" />
            <stop offset="40%" stopColor="#fef08a" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
          </radialGradient>

          {/* Chromstreifen Gradient */}
          <linearGradient id="chrome-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f8fafc" />
            <stop offset="50%" stopColor="#cbd5e1" />
            <stop offset="100%" stopColor="#94a3b8" />
          </linearGradient>
        </defs>

        {/* ══ Schatten unter dem Bus ══════════════════════════════════════ */}
        <ellipse
          cx={W * 0.5}
          cy={RY + WR * 1.1}
          rx={W * 0.44}
          ry={WR * 0.22}
          fill="rgba(0,0,0,0.35)"
        />

        {/* ══ Bus-Körper (Hauptform) ══════════════════════════════════════ */}
        {/* Dach – leicht abgerundet */}
        <rect
          x={W * 0.04}
          y={0}
          width={W * 0.92}
          height={H * 0.18}
          rx={W * 0.025}
          fill={roofColor}
        />
        {/* Hauptkörper */}
        <rect
          x={W * 0.02}
          y={H * 0.06}
          width={W * 0.96}
          height={H * 0.94}
          rx={W * 0.018}
          fill="url(#body-grad)"
        />

        {/* ══ Akzentstreifen ══════════════════════════════════════════════ */}
        {/* Oberer Akzentstreifen */}
        <rect
          x={W * 0.02}
          y={H * 0.21}
          width={W * 0.96}
          height={H * 0.055}
          fill={accentColor}
        />
        {/* Unterer Akzentstreifen (dünn) */}
        <rect
          x={W * 0.02}
          y={H * 0.26}
          width={W * 0.96}
          height={H * 0.018}
          fill={accentDark}
          opacity={0.7}
        />

        {/* ══ Chromstreifen (Unterseite) ══════════════════════════════════ */}
        <rect
          x={W * 0.02}
          y={H * 0.87}
          width={W * 0.96}
          height={H * 0.04}
          fill="url(#chrome-grad)"
          rx={2}
        />

        {/* ══ Unterbodenverkleidung ═══════════════════════════════════════ */}
        <rect
          x={W * 0.05}
          y={H * 0.92}
          width={W * 0.9}
          height={H * 0.1}
          rx={4}
          fill="#0f172a"
        />

        {/* ══ VORNE (rechts im SVG): Windschutzscheibe + Front ══════════ */}
        {/* Front-Maske abrunden */}
        <rect
          x={W * 0.87}
          y={H * 0.06}
          width={W * 0.11}
          height={H * 0.86}
          rx={W * 0.018}
          fill={busBody}
        />
        {/* Windschutzscheibe */}
        <rect
          x={W * 0.88}
          y={H * 0.08}
          width={W * 0.085}
          height={H * 0.52}
          rx={W * 0.012}
          fill="url(#windshield-grad)"
        />
        {/* Windschutzscheibe-Spiegelung */}
        <rect
          x={W * 0.89}
          y={H * 0.09}
          width={W * 0.025}
          height={H * 0.42}
          rx={3}
          fill={glassHighlight}
        />
        {/* Windschutzscheibe-Rahmen */}
        <rect
          x={W * 0.88}
          y={H * 0.08}
          width={W * 0.085}
          height={H * 0.52}
          rx={W * 0.012}
          fill="none"
          stroke="#0f172a"
          strokeWidth={2}
        />

        {/* Scheinwerfer rechts (Tagfahrlicht) */}
        <rect
          x={W * 0.895}
          y={H * 0.64}
          width={W * 0.072}
          height={H * 0.13}
          rx={4}
          fill="#1e293b"
        />
        {/* DRL-Leuchten */}
        <rect
          x={W * 0.9}
          y={H * 0.655}
          width={W * 0.055}
          height={H * 0.04}
          rx={2}
          fill="#fef9c3"
          opacity={lightPulse}
        />
        <rect
          x={W * 0.9}
          y={H * 0.705}
          width={W * 0.055}
          height={H * 0.055}
          rx={2}
          fill="#fef08a"
          opacity={lightPulse * 0.9}
        />
        {/* Scheinwerfer-Glow */}
        <ellipse
          cx={W * 0.97}
          cy={H * 0.71}
          rx={W * 0.06}
          ry={H * 0.07}
          fill="url(#headlight-glow)"
          opacity={lightPulse * 0.6}
        />

        {/* Front-Stoßstange */}
        <rect
          x={W * 0.88}
          y={H * 0.82}
          width={W * 0.09}
          height={H * 0.1}
          rx={3}
          fill="#334155"
        />
        <rect
          x={W * 0.89}
          y={H * 0.84}
          width={W * 0.07}
          height={H * 0.025}
          rx={1}
          fill="url(#chrome-grad)"
        />
        {/* Nebelscheinwerfer */}
        <circle
          cx={W * 0.905}
          cy={H * 0.86}
          r={H * 0.025}
          fill="#fef9c3"
          opacity={0.8}
        />

        {/* Front-Rückspiegel */}
        <rect
          x={W * 0.875}
          y={H * 0.08}
          width={W * 0.03}
          height={H * 0.09}
          rx={2}
          fill="#334155"
        />
        <rect
          x={W * 0.865}
          y={H * 0.05}
          width={W * 0.04}
          height={H * 0.06}
          rx={3}
          fill="#475569"
          stroke="#1e293b"
          strokeWidth={1}
        />
        {/* Spiegel-Reflex */}
        <rect
          x={W * 0.87}
          y={H * 0.055}
          width={W * 0.012}
          height={H * 0.04}
          rx={1}
          fill={glassHighlight}
        />

        {/* ══ SEITE: Panorama-Fenster ════════════════════════════════════ */}
        {/* Fenster-Band (durchgehendes Band) */}
        <rect
          x={W * 0.04}
          y={H * 0.08}
          width={W * 0.83}
          height={H * 0.46}
          rx={4}
          fill="url(#side-glass-grad)"
          stroke="#0f172a"
          strokeWidth={1.5}
        />
        {/* Fenster-Trennstege */}
        {[0.175, 0.31, 0.445, 0.58, 0.715].map((x, i) => (
          <rect
            key={i}
            x={W * x}
            y={H * 0.08}
            width={W * 0.012}
            height={H * 0.46}
            fill="#0f172a"
          />
        ))}
        {/* Fenster-Spiegelungen (diagonale Highlights) */}
        {[0.06, 0.195, 0.33, 0.465, 0.60, 0.735].map((x, i) => (
          <rect
            key={i}
            x={W * (x + 0.015)}
            y={H * 0.09}
            width={W * 0.025}
            height={H * 0.38}
            rx={2}
            fill={glassHighlight}
            transform={`skewX(-8)`}
          />
        ))}
        {/* Obere Fenster-Lüftung */}
        <rect
          x={W * 0.04}
          y={H * 0.08}
          width={W * 0.83}
          height={H * 0.04}
          rx={0}
          fill="rgba(0,0,0,0.25)"
        />

        {/* ══ HINTEN (links im SVG): Heckpartie ═════════════════════════ */}
        {/* Heck-Fläche */}
        <rect
          x={W * 0.01}
          y={H * 0.08}
          width={W * 0.045}
          height={H * 0.84}
          rx={W * 0.018}
          fill={busBody}
        />
        {/* Heckscheibe (klein) */}
        <rect
          x={W * 0.015}
          y={H * 0.1}
          width={W * 0.032}
          height={H * 0.4}
          rx={3}
          fill="url(#side-glass-grad)"
          stroke="#0f172a"
          strokeWidth={1}
        />
        {/* Rücklichter */}
        <rect
          x={W * 0.015}
          y={H * 0.55}
          width={W * 0.03}
          height={H * 0.14}
          rx={3}
          fill="#dc2626"
          opacity={0.9}
        />
        <rect
          x={W * 0.018}
          y={H * 0.57}
          width={W * 0.02}
          height={H * 0.05}
          rx={1}
          fill="#fca5a5"
          opacity={0.8}
        />
        {/* Heck-Stoßstange */}
        <rect
          x={W * 0.015}
          y={H * 0.82}
          width={W * 0.03}
          height={H * 0.1}
          rx={2}
          fill="#334155"
        />

        {/* ══ Bus-Beschriftung ════════════════════════════════════════════ */}
        {/* Label-Hintergrund */}
        <rect
          x={W * 0.12}
          y={H * 0.59}
          width={W * 0.62}
          height={H * 0.19}
          rx={4}
          fill="rgba(0,0,0,0.25)"
        />
        {/* Haupt-Beschriftung */}
        <text
          x={W * 0.43}
          y={H * 0.735}
          textAnchor="middle"
          fill={color}
          fontSize={H * 0.16}
          fontFamily="Arial Black, Impact, sans-serif"
          fontWeight="900"
          letterSpacing="3"
          opacity={0.95}
        >
          {label}
        </text>
        {/* Akzent-Linie unter dem Text */}
        <rect
          x={W * 0.2}
          y={H * 0.76}
          width={W * 0.46}
          height={H * 0.018}
          rx={1}
          fill={accentColor}
          opacity={0.8}
        />

        {/* ══ Abgas-Effekt (links hinten) ════════════════════════════════ */}
        <ExhaustPuff cx={W * 0.02} cy={H * 0.9} frame={frame} fps={fps} delay={0} />
        <ExhaustPuff cx={W * 0.02} cy={H * 0.88} frame={frame} fps={fps} delay={15} />
        <ExhaustPuff cx={W * 0.02} cy={H * 0.92} frame={frame} fps={fps} delay={8} />

        {/* ══ Räder ══════════════════════════════════════════════════════ */}
        {/* Radkästen */}
        <ellipse cx={W * 0.22} cy={RY} rx={WR * 1.35} ry={WR * 0.55} fill="#0f172a" />
        <ellipse cx={W * 0.74} cy={RY} rx={WR * 1.35} ry={WR * 0.55} fill="#0f172a" />

        {/* Vorderrad (rechts) */}
        <Wheel cx={W * 0.74} cy={RY} r={WR} wheelRot={wheelRot} accentColor={accentColor} />
        {/* Hinterrad (links) */}
        <Wheel cx={W * 0.22} cy={RY} r={WR} wheelRot={wheelRot} accentColor={accentColor} />

        {/* ══ Dach-Details ════════════════════════════════════════════════ */}
        {/* Klimaanlage */}
        <rect
          x={W * 0.35}
          y={-H * 0.06}
          width={W * 0.28}
          height={H * 0.1}
          rx={3}
          fill="#94a3b8"
        />
        <rect
          x={W * 0.37}
          y={-H * 0.04}
          width={W * 0.24}
          height={H * 0.065}
          rx={2}
          fill="#64748b"
        />
        {/* Klima-Lamellen */}
        {[0.38, 0.42, 0.46, 0.5, 0.54, 0.58].map((x, i) => (
          <rect
            key={i}
            x={W * x}
            y={-H * 0.035}
            width={W * 0.012}
            height={H * 0.055}
            rx={1}
            fill="#475569"
          />
        ))}
        {/* Dach-Antenne */}
        <rect
          x={W * 0.7}
          y={-H * 0.12}
          width={W * 0.008}
          height={H * 0.16}
          rx={1}
          fill="#94a3b8"
        />
        <circle cx={W * 0.704} cy={-H * 0.13} r={W * 0.008} fill="#64748b" />

      </svg>
    </div>
  );
};

// ── Haupt-Export ──────────────────────────────────────────────────────────

export interface LottieBusIconProps {
  size?: number;
  accentColor?: string;
  bodyColor?: string;
  color?: string;
  driveIn?: boolean;
  position?: 'center' | 'bottom-center' | 'top-center';
  label?: string;
  /** Lottie JSON-Daten — reserviert für zukünftige echte Lottie-Integration */
  lottieData?: object | null;
}

export const LottieBusIcon: React.FC<LottieBusIconProps> = ({
  size = 220,
  accentColor = '#F59E0B',
  bodyColor,
  color = '#FFFFFF',
  driveIn = true,
  position = 'center',
  label = 'MOJOBUS',
  lottieData,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const posStyles: React.CSSProperties =
    position === 'bottom-center'
      ? { position: 'absolute', bottom: '8%', left: '50%', transform: 'translateX(-50%)' }
      : position === 'top-center'
      ? { position: 'absolute', top: '8%', left: '50%', transform: 'translateX(-50%)' }
      : { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };

  const enter = spring({ frame, fps, config: { damping: 20, stiffness: 80 } });
  const opacity = interpolate(enter, [0, 1], [0, 1]);

  return (
    <div style={{ ...posStyles, opacity, pointerEvents: 'none' }}>
      <CSSAnimatedBus
        size={size}
        accentColor={accentColor}
        bodyColor={bodyColor}
        color={color}
        driveIn={driveIn}
        label={label}
      />
    </div>
  );
};

// ── BusRideOverlay — Bus fährt durchs Bild ───────────────────────────────

export const BusRideOverlay: React.FC<{
  accentColor?: string;
  size?: number;
  verticalPosition?: number;
  label?: string;
}> = ({ accentColor = '#F59E0B', size = 160, verticalPosition = 75, label = 'MOJOBUS' }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const xPercent = interpolate(frame, [0, durationInFrames], [-20, 115], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <div style={{
        position: 'absolute',
        left: `${xPercent}%`,
        top: `${verticalPosition}%`,
        transform: 'translate(-50%, -50%)',
      }}>
        <CSSAnimatedBus
          size={size}
          accentColor={accentColor}
          driveIn={false}
          label={label}
        />
      </div>
    </AbsoluteFill>
  );
};
