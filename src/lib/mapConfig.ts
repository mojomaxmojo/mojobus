/**
 * Map Configuration for Europa Reviews Map
 *
 * Defines Europe bounds, map settings, and tile layer configurations
 */

/**
 * Europe geographical bounds
 * Limits map panning to Europe only
 */
export const EUROPA_BOUNDS = {
  north: 72,    // Nordkap, Norway
  south: 34,     // Gibraltar, Spain
  east: 32,      // Caucasus, Russia
  west: -25,     // Azores, Portugal
};

/**
 * Map center coordinates (Central Europe)
 * Good starting point for European map
 */
export const EUROPA_CENTER = {
  lat: 48.8566,  // Approximate center of Europe
  lng: 10.3520,
};

/**
 * Default zoom settings
 */
export const ZOOM_SETTINGS = {
  default: 4,    // Shows most of Europe
  min: 3,        // Can't zoom out to show whole world
  max: 15,       // Street level zoom
};

/**
 * Tile layer configurations
 * Different map styles for different use cases
 */
export const TILE_LAYERS = {
  /** Standard OpenStreetMap (free, no API key required) */
  osm: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  },

  /** CartoDB Positron (clean, light theme) */
  cartoLight: {
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19,
  },

  /** CartoDB Dark (dark theme) */
  cartoDark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19,
  },
};

/**
 * Content type colors for markers
 * Used in map rendering and UI
 */
export const CONTENT_COLORS = {
  media: '#ec1a58',      // Pink - Bilder/Videos
  note: '#6366f1',       // Indigo - Notes
  place: '#22c55e',      // Green - Plätze
  article: '#f59e0b',    // Orange - Artikel
} as const;

export type ContentType = keyof typeof CONTENT_COLORS;

/**
 * Marker size settings
 */
export const MARKER_SIZE = {
  width: 32,
  height: 32,
  iconAnchor: [16, 32],  // Bottom center
  popupAnchor: [0, -32],  // Top center
};
