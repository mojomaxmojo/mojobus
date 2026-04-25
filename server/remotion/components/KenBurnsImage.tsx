/**
 * KenBurnsImage — Smooth Zoom + Pan auf echten Fotos
 * Jedes Bild bekommt eine zufällig gewählte (aber deterministische) Ken-Burns-Bewegung.
 * direction: 'zoom-in' | 'zoom-out' | 'pan-left' | 'pan-right' | 'diagonal'
 */

import { AbsoluteFill, Img, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';

type Direction = 'zoom-in' | 'zoom-out' | 'pan-left' | 'pan-right' | 'diagonal-tl' | 'diagonal-br';

interface KenBurnsImageProps {
  src: string;
  direction?: Direction;
  /** Intensität 0–1, default 0.15 */
  intensity?: number;
  objectPosition?: string;
}

/** Deterministisch zufällig basierend auf Bild-Index */
export function pickDirection(index: number): Direction {
  const options: Direction[] = [
    'zoom-in', 'zoom-out', 'pan-left', 'pan-right', 'diagonal-tl', 'diagonal-br',
  ];
  return options[index % options.length];
}

export const KenBurnsImage: React.FC<KenBurnsImageProps> = ({
  src,
  direction = 'zoom-in',
  intensity = 0.15,
  objectPosition = 'center',
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const progress = interpolate(frame, [0, durationInFrames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  let scale = 1;
  let translateX = 0;
  let translateY = 0;

  const zoom = intensity;

  switch (direction) {
    case 'zoom-in':
      scale = interpolate(progress, [0, 1], [1, 1 + zoom * 2]);
      break;
    case 'zoom-out':
      scale = interpolate(progress, [0, 1], [1 + zoom * 2, 1]);
      break;
    case 'pan-left':
      scale = 1 + zoom;
      translateX = interpolate(progress, [0, 1], [zoom * 100, -zoom * 100]);
      break;
    case 'pan-right':
      scale = 1 + zoom;
      translateX = interpolate(progress, [0, 1], [-zoom * 100, zoom * 100]);
      break;
    case 'diagonal-tl':
      scale = interpolate(progress, [0, 1], [1, 1 + zoom * 1.5]);
      translateX = interpolate(progress, [0, 1], [zoom * 50, -zoom * 50]);
      translateY = interpolate(progress, [0, 1], [zoom * 30, -zoom * 30]);
      break;
    case 'diagonal-br':
      scale = interpolate(progress, [0, 1], [1 + zoom * 1.5, 1]);
      translateX = interpolate(progress, [0, 1], [-zoom * 50, zoom * 50]);
      translateY = interpolate(progress, [0, 1], [-zoom * 30, zoom * 30]);
      break;
  }

  return (
    <AbsoluteFill>
      <Img
        src={src}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition,
          transform: `scale(${scale}) translate(${translateX}%, ${translateY}%)`,
          transformOrigin: 'center center',
          willChange: 'transform',
        }}
      />
    </AbsoluteFill>
  );
};
