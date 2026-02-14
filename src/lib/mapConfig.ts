// Map tile layer configurations - Using standard OpenStreetMap for maximum independence

// Constants for marker icons (used by markerIcons.ts)
export const MARKER_SIZE = {
  width: 40,
  height: 60,
};

export type ContentType = 'media' | 'note' | 'place' | 'article';

export const CONTENT_COLORS: Record<ContentType, string> = {
  media: '#3b82f6',    // Blue
  note: '#10b981',     // Green
  place: '#f59e0b',    // Amber
  article: '#8b5cf6',  // Purple
};

export const getTileLayerConfig = (provider: 'openstreetmap' | 'satellite' = 'openstreetmap') => {
  switch (provider) {
    case 'openstreetmap':
      return {
        // Standard OpenStreetMap (kostenlos, kein API-Key, maximale Unabhängigkeit)
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      };
    case 'satellite':
      return {
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attribution: '&copy; <a href="https://www.esri.com/">Esri</a>, Maxar, Earthstar Geographics',
        maxZoom: 19,
      };
    default:
      return {
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      };
  }
};
