/**
 * Geocoding Konfiguration
 * Einstellungen für GPS-Extraktion und Reverse Geocoding
 */

export const GEOCODING_CONFIG = {
  // Nominatim (OpenStreetMap) API
  nominatim: {
    baseUrl: 'https://nominatim.openstreetmap.org',
    search: '/search',
    reverse: '/reverse',
    user_agent: 'MojoBus-PWA', // Required by Nominatim usage policy
    email: 'contact@mojobus.co', // Optional but recommended for rate limiting
    format: 'json',
    accept_language: 'de,en', // Prefer German results, fallback to English
  },

  // Reverse Geocoding Optionen
  reverseGeocoding: {
    // Detailstufe der Adresse (0-18)
    addressDetails: 18,
    // Zoomlevel für Kontext (1-18)
    zoom: 16,
    // Zusätzliche Daten anfordern
    extraTags: 1,
  },

  // GPS-Extraktion Einstellungen
  gpsExtraction: {
    // Exif-Tags für GPS
    tags: {
      latitude: 'GPSLatitude',
      latitudeRef: 'GPSLatitudeRef',
      longitude: 'GPSLongitude',
      longitudeRef: 'GPSLongitudeRef',
      altitude: 'GPSAltitude',
      altitudeRef: 'GPSAltitudeRef',
      direction: 'GPSImgDirection',
      timestamp: 'GPSTimeStamp',
      dateStamp: 'GPSDateStamp',
    },
    // Minimal required precision (decimal places)
    minPrecision: 6,
  },

  // Nostr Tag Konventionen
  nostr: {
    // Tags für Standortdaten
    latitude: 'lat',
    longitude: 'lng',
    location: 'location',
    country: 'country',
    region: 'region',
    city: 'city',
    altitude: 'altitude',
    // Standardisierte Formatierung
    format: 'decimal', // decimal = 45.123456, dms = 45°7'24.3"N
  },

  // Error Handling
  errorHandling: {
    // Timeout für Geocoding-Requests (ms)
    timeout: 10000,
    // Max retries bei Fehlern
    maxRetries: 3,
    // Delay zwischen retries (ms)
    retryDelay: 1000,
    // Fallback bei Timeout
    useFallback: true,
  },

  // Caching
  cache: {
    enabled: true,
    // Cache TTL in Sekunden
    ttl: 3600, // 1 Stunde
    // Max Cache size
    maxSize: 100,
  },
};

/**
 * Ländercodes für Auto-Detection
 * Wird für bessere Geocoding-Ergebnisse verwendet
 */
export const COUNTRY_CODES = {
  portugal: 'PT',
  spain: 'ES',
  france: 'FR',
  germany: 'DE',
  belgium: 'BE',
  luxembourg: 'LU',
  netherlands: 'NL',
  italy: 'IT',
  switzerland: 'CH',
  austria: 'AT',
  croatia: 'HR',
  slovenia: 'SI',
};

export type Coordinates = {
  latitude: number;
  longitude: number;
  altitude?: number;
  direction?: number;
};

export type LocationData = {
  coordinates: Coordinates;
  address?: {
    country?: string;
    country_code?: string;
    region?: string;
    city?: string;
    town?: string;
    village?: string;
    road?: string;
    postcode?: string;
    display_name?: string;
  };
  accuracy?: string;
  formatted?: string;
};
