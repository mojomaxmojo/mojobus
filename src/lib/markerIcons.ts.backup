/**
 * Custom Marker Icons for Europa Reviews Map
 *
 * Creates styled map markers based on content type
 */

import L from 'leaflet';
import { MARKER_SIZE, CONTENT_COLORS, type ContentType } from './mapConfig';

/**
 * Get marker icon based on content type
 *
 * @param type - Content type (media, note, place, article)
 * @returns Leaflet Icon object
 */
export function getMarkerIcon(type: ContentType): L.Icon {
  const color = CONTENT_COLORS[type];

  const svgString = `
    <svg viewBox="0 0 32 48" xmlns="http://www.w3.org/2000/svg" width="${MARKER_SIZE.width}" height="${MARKER_SIZE.height}">
      <defs>
        <filter id="shadow-${type}" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.3)"/>
        </filter>
      </defs>
      <g filter="url(#shadow-${type})">
        <path
          d="M16 0C7.163 0 0 7.163 0 16c0 8.837 16 32 16 32s16-23.163 16-32c0-8.837-7.163-16-16-16z"
          fill="${color}"
          stroke="white"
          stroke-width="2"
        />
        <!-- Inner circle for icon -->
        <circle cx="16" cy="16" r="8" fill="white" />
      </g>
    </svg>
  `.replace(/\s+/g, ' ').replace(/[^\x20-\x7E]/g, '').trim();

  try {
    const encodedSvg = btoa(svgString);
    return new L.Icon({
      iconUrl: `data:image/svg+xml;base64,${encodedSvg}`,
      iconSize: [MARKER_SIZE.width, MARKER_SIZE.height],
      iconAnchor: [MARKER_SIZE.width / 2, MARKER_SIZE.height],
      popupAnchor: [0, -MARKER_SIZE.height],
    });
  } catch (error) {
    console.error('Error creating custom icon:', error);
    // Fallback to default marker
    return new L.Icon.Default();
  }
}

/**
 * Get numbered marker icon (for places with ratings)
 *
 * @param number - Number to display (1-5)
 * @param color - Base color
 * @returns Leaflet Icon object
 */
export function getNumberedMarkerIcon(number: number, color: string): L.Icon {
  const svgString = `
    <svg viewBox="0 0 40 60" xmlns="http://www.w3.org/2000/svg" width="${MARKER_SIZE.width}" height="${MARKER_SIZE.height}">
      <defs>
        <filter id="shadow-numbered">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.3)"/>
        </filter>
      </defs>
      <g filter="url(#shadow-numbered)">
        <circle cx="20" cy="20" r="18" fill="white" stroke="${color}" stroke-width="3"/>
        <text x="20" y="26" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="${color}">
          ${number}
        </text>
      </g>
    </svg>
  `.replace(/\s+/g, ' ').replace(/[^\x20-\x7E]/g, '').trim();

  try {
    const encodedSvg = btoa(svgString);
    return new L.Icon({
      iconUrl: `data:image/svg+xml;base64,${encodedSvg}`,
      iconSize: [MARKER_SIZE.width, MARKER_SIZE.height],
      iconAnchor: [MARKER_SIZE.width / 2, MARKER_SIZE.height],
      popupAnchor: [0, -MARKER_SIZE.height],
    });
  } catch (error) {
    console.error('Error creating numbered marker icon:', error);
    return new L.Icon.Default();
  }
}

/**
 * Get icon emoji for content type
 *
 * @param type - Content type
 * @returns Emoji string
 */
export function getContentTypeEmoji(type: ContentType): string {
  const emojis: Record<ContentType, string> = {
    media: '📷',
    note: '📝',
    place: '📍',
    article: '📄',
  };
  return emojis[type];
}

/**
 * Get label for content type
 *
 * @param type - Content type
 * @returns Display label in German
 */
export function getContentTypeLabel(type: ContentType): string {
  const labels: Record<ContentType, string> = {
    media: 'Bilder/Videos',
    note: 'Note',
    place: 'Ort',
    article: 'Artikel',
  };
  return labels[type];
}
