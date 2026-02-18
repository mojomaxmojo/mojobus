/**
 * GPS Extraction from Image EXIF Data
 *
 * This module provides functions to extract GPS coordinates from image files
 * using the exifr library. Supports JPEG and other EXIF-enabled formats.
 * Includes support for XMP GPS data used by Google Camera (GCam).
 */

import exifr from 'exifr';

/**
 * GPS data structure extracted from image
 */
export interface GpsData {
  /** Latitude in decimal degrees (e.g., 37.7749) */
  latitude: number;
  /** Longitude in decimal degrees (e.g., -122.4194) */
  longitude: number;
  /** Altitude in meters (optional, if available in EXIF) */
  altitude?: number;
  /** GPS precision level based on available data */
  precision: 'high' | 'medium' | 'low';
}

/**
 * GPS status for tracking extraction state
 */
export type GpsStatus = 'detected' | 'not_found' | 'manual' | 'error';

/**
 * Extract GPS coordinates from an image file
 *
 * Supports multiple GPS data sources:
 * - Standard EXIF GPS tags
 * - XMP GPS metadata (used by Google Camera/Google Photos)
 * - Android-specific GPS tags
 *
 * @param file - Image file to extract GPS from
 * @returns Promise with GPS data or null if no GPS found
 *
 * @example
 * ```typescript
 * const gps = await extractGpsFromImage(imageFile);
 * if (gps) {
 *   console.log(`Lat: ${gps.latitude}, Lon: ${gps.longitude}`);
 * }
 * ```
 */
export async function extractGpsFromImage(file: File): Promise<GpsData | null> {
  try {
    console.log('[GPS Extraction] Starting extraction for:', file.name);
    console.log('[GPS Extraction] File type:', file.type);
    console.log('[GPS Extraction] File size:', file.size, 'bytes');

    // Check if file is an image type that supports EXIF
    if (!file.type.match(/^image\/(jpeg|jpg|tiff)$/i)) {
      console.log('[GPS Extraction] File type not supported:', file.type);
      return null;
    }

    console.log('[GPS Extraction] File type supported, extracting EXIF...');

    // === METHOD 1: Try exifr.gps() (standard EXIF GPS) ===
    const exifData = await exifr.gps(file);
    console.log('[GPS Extraction] Method 1 - exifr.gps() result:', exifData);

    // Check for valid GPS data from method 1
    if (exifData && exifData.latitude && exifData.longitude) {
      const latitude = exifData.latitude;
      const longitude = exifData.longitude;

      // Skip 0,0 coordinates
      if (latitude !== 0 || longitude !== 0) {
        console.log('[GPS Extraction] Valid GPS from exifr.gps():', { latitude, longitude });
        return createGpsResult(latitude, longitude, exifData.altitude, file.name);
      }
    }

    // === METHOD 2: Try XMP GPS data (used by GCam/Google Photos) ===
    console.log('[GPS Extraction] Method 1 failed, trying XMP GPS...');
    const xmpData = await exifr.parse(file, {
      xmp: true,
      gps: true,
      mergeOutput: false,
    });

    console.log('[GPS Extraction] Method 2 - XMP data keys:', Object.keys(xmpData || {}));
    console.log('[GPS Extraction] Method 2 - Full XMP data:', JSON.stringify(xmpData, null, 2));

    // XMP GPS tags (various formats used by different apps)
    const xmpLat = xmpData?.GPSLatitude ||
                   xmpData?.['GPS:Latitude'] ||
                   xmpData?.latitude ||
                   xmpData?.Latitude;
    const xmpLon = xmpData?.GPSLongitude ||
                   xmpData?.['GPS:Longitude'] ||
                   xmpData?.longitude ||
                   xmpData?.Longitude;

    if (xmpLat && xmpLon && (xmpLat !== 0 || xmpLon !== 0)) {
      console.log('[GPS Extraction] Valid GPS from XMP:', { xmpLat, xmpLon });
      return createGpsResult(xmpLat, xmpLon, xmpData?.GPSAltitude, file.name);
    }

    // === METHOD 3: Try raw EXIF with all GPS tags ===
    console.log('[GPS Extraction] Method 2 failed, trying raw EXIF...');
    const rawExif = await exifr.parse(file, {
      gps: ['GPSLatitude', 'GPSLongitude', 'GPSAltitude', 'GPSLatitudeRef', 'GPSLongitudeRef'],
      mergeOutput: true,
    });

    console.log('[GPS Extraction] Method 3 - Raw EXIF:', JSON.stringify(rawExif, null, 2));

    if (rawExif && rawExif.GPSLatitude && rawExif.GPSLongitude) {
      const dmsLat = rawExif.GPSLatitude;
      const dmsLon = rawExif.GPSLongitude;

      // Check if not all zeros
      const isLatZero = dmsLat.every((v: any) => v === 0);
      const isLonZero = dmsLon.every((v: any) => v === 0);

      if (!isLatZero || !isLonZero) {
        const latRef = (rawExif.GPSLatitudeRef as 'N' | 'S') || 'N';
        const lonRef = (rawExif.GPSLongitudeRef as 'E' | 'W') || 'E';

        try {
          const latitude = convertDMSToDD(dmsLat, latRef);
          const longitude = convertDMSToDD(dmsLon, lonRef);

          console.log('[GPS Extraction] Valid GPS from raw EXIF:', { latitude, longitude });
          return createGpsResult(latitude, longitude, rawExif.GPSAltitude, file.name);
        } catch (convertError) {
          console.warn('[GPS Extraction] DMS conversion failed, continuing with other methods:', convertError);
        }
      }
    }

    // === METHOD 4: Try full parse with all GPS-related tags ===
    console.log('[GPS Extraction] Method 3 failed, trying comprehensive parse...');
    const fullParse = await exifr.parse(file, {
      pickTags: true,
      mergeOutput: false,
    });

    console.log('[GPS Extraction] Method 4 - All available tags:', Object.keys(fullParse || {}).filter(k => k.toLowerCase().includes('gps') || k.toLowerCase().includes('lat') || k.toLowerCase().includes('lon')));

    // Check for any GPS-related keys that might contain coordinates
    const gpsKeys = Object.keys(fullParse || {}).filter(k =>
      k.match(/gps/i) || k.match(/latitude/i) || k.match(/longitude/i) || k.match(/location/i)
    );

    for (const key of gpsKeys) {
      const value = fullParse![key];
      if (value && typeof value === 'number' && value !== 0) {
        // Try to pair latitude/longitude
        if (key.toLowerCase().includes('lat')) {
          const lonKey = key.replace(/lat/i, 'lon');
          const lonValue = fullParse![lonKey];
          if (lonValue && typeof lonValue === 'number' && lonValue !== 0) {
            console.log('[GPS Extraction] GPS from tag pair:', { key, lat: value, lon: lonValue });
            return createGpsResult(value, lonValue, fullParse!.GPSAltitude, file.name);
          }
        }
      }
    }

    console.log('[GPS Extraction] No valid GPS found in any method');
    return null;

  } catch (error) {
    console.error('[GPS Extraction] Error:', error);
    return null;
  }
}

/**
 * Create GPS result object from extracted coordinates
 */
function createGpsResult(
  latitude: number,
  longitude: number,
  altitude?: number | null,
  filename?: string
): GpsData {
  const precision: 'high' | 'medium' | 'low' = altitude !== undefined && altitude !== null ? 'high' : 'medium';

  const result: GpsData = {
    latitude,
    longitude,
    precision,
  };

  if (altitude !== undefined && altitude !== null) {
    result.altitude = parseFloat(String(altitude));
  }

  console.log('[GPS Extraction] Successfully extracted GPS:', {
    latitude: result.latitude,
    longitude: result.longitude,
    altitude: result.altitude,
    precision: result.precision,
    filename: filename || 'unknown',
  });

  return result;
}

/**
 * Convert GPS DMS (Degrees, Minutes, Seconds) to Decimal Degrees (DD)
 *
 * @param dms - GPS coordinate in DMS format from EXIF [degrees, minutes, seconds]
 * @param ref - Hemisphere reference ('N', 'S', 'E', 'W')
 * @returns Decimal degrees
 *
 * EXIF stores GPS as separate arrays and refs:
 * - GPSLatitude: [degrees, minutes, seconds]
 * - GPSLatitudeRef: 'N' or 'S'
 * - GPSLongitude: [degrees, minutes, seconds]
 * - GPSLongitudeRef: 'E' or 'W'
 */
function convertDMSToDD(dms: any, ref: 'N' | 'S' | 'E' | 'W'): number {
  if (!Array.isArray(dms)) {
    console.warn('[GPS] DMS is not an array:', dms);
    throw new Error('DMS is not an array');
  }

  console.log('[GPS] Converting DMS:', {
    dms,
    ref,
    dmsType: typeof dms,
    dmsLength: dms.length
  });

  // Handle different DMS formats
  // Some EXIF data has [degrees, minutes, seconds] as numbers
  // Others have [[degrees, 1], [minutes, 1], [seconds, 1]] as rationals
  const parseValue = (val: any): number => {
    if (typeof val === 'number') return val;
    if (Array.isArray(val) && val.length >= 2) {
      // Rational format: [numerator, denominator]
      return parseFloat(val[0]) / parseFloat(val[1] || 1);
    }
    return parseFloat(val) || 0;
  };

  const degrees = parseValue(dms[0]);
  const minutes = parseValue(dms[1] || 0);
  const seconds = parseValue(dms[2] || 0);

  // Validate values
  if (isNaN(degrees) || degrees === 0) {
    console.error('[GPS] Degrees is NaN or zero:', dms[0], '->', degrees);
    throw new Error('Degrees is NaN or zero');
  }

  console.log('[GPS] Parsed DMS:', { degrees, minutes, seconds });

  let dd = degrees + minutes / 60 + seconds / 3600;

  // Adjust for hemisphere
  if (ref === 'S' || ref === 'W') {
    dd = -dd;
  }

  console.log('[GPS] Final DD:', { dd, ref });

  return dd;
}

/**
 * Validate GPS coordinates
 *
 * @param latitude - Latitude in decimal degrees
 * @param longitude - Longitude in decimal degrees
 * @returns True if coordinates are valid
 */
function isValidCoordinate(latitude: number, longitude: number): boolean {
  // Latitude must be between -90 and 90
  if (latitude < -90 || latitude > 90) {
    return false;
  }

  // Longitude must be between -180 and 180
  if (longitude < -180 || longitude > 180) {
    return false;
  }

  // Check for NaN
  if (isNaN(latitude) || isNaN(longitude)) {
    return false;
  }

  // Check for 0,0 coordinates (Null Island - likely extraction error)
  // Real photos at exactly 0,0 are extremely rare
  if (latitude === 0 && longitude === 0) {
    return false;
  }

  return true;
}

/**
 * Format GPS coordinates for display
 *
 * @param latitude - Latitude in decimal degrees
 * @param longitude - Longitude in decimal degrees
 * @returns Formatted coordinate string (e.g., "37.7749° N, 122.4194° W")
 *
 * @example
 * ```typescript
 * const formatted = formatCoordinates(37.7749, -122.4194);
 * // Returns: "37.7749° N, 122.4194° W"
 * ```
 */
export function formatCoordinates(latitude: number, longitude: number): string {
  const latDirection = latitude >= 0 ? 'N' : 'S';
  const lonDirection = longitude >= 0 ? 'E' : 'W';

  const absLat = Math.abs(latitude);
  const absLon = Math.abs(longitude);

  return `${absLat.toFixed(4)}° ${latDirection}, ${absLon.toFixed(4)}° ${lonDirection}`;
}

/**
 * Format GPS coordinates for input fields (simple decimal format)
 *
 * @param latitude - Latitude in decimal degrees
 * @param longitude - Longitude in decimal degrees
 * @returns Simple coordinate string (e.g., "37.7749, -122.4194")
 */
export function formatCoordinatesSimple(latitude: number, longitude: number): string {
  return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
}

/**
 * Reverse geocode GPS coordinates to location information
 * Uses OpenStreetMap Nominatim API (free, no API key required)
 *
 * @param latitude - Latitude in decimal degrees
 * @param longitude - Longitude in decimal degrees
 * @returns Promise with location data (city, country, full address)
 *
 * @example
 * ```typescript
 * const location = await reverseGeocode(37.7749, -122.4194);
 * console.log(location.city); // "San Francisco"
 * console.log(location.country); // "United States"
 * ```
 */
export interface LocationData {
  /** City, town, or village name */
  city?: string;
  /** Country name */
  country?: string;
  /** ISO country code (e.g., 'PT', 'ES') */
  countryCode?: string;
  /** Full formatted address */
  fullAddress?: string;
  /** Display name from Nominatim */
  display_name?: string;
  /** Suburb or district (for more precision) */
  suburb?: string;
  /** Neighborhood or quarter (very precise) */
  neighbourhood?: string;
  /** County or region */
  county?: string;
  /** Postal code */
  postcode?: string;
}

// Geocoding cache for performance optimization
const geocodeCache = new Map<string, LocationData>();
const CACHE_MAX_SIZE = 100; // Max entries in cache to prevent memory bloat

/**
 * Generate cache key from coordinates (rounded to 4 decimal places)
 * This provides ~11m precision which is sufficient for city-level geocoding
 */
function getCacheKey(latitude: number, longitude: number): string {
  return `${latitude.toFixed(4)},${longitude.toFixed(4)}`;
}

/**
 * Clean up old cache entries when cache exceeds max size
 */
function cleanupCache() {
  if (geocodeCache.size > CACHE_MAX_SIZE) {
    // Remove oldest entries (first half of cache)
    const entries = Array.from(geocodeCache.entries());
    for (let i = 0; i < entries.length / 2; i++) {
      geocodeCache.delete(entries[i][0]);
    }
    console.log('[Geocode Cache] Cleaned up, size:', geocodeCache.size);
  }
}

export async function reverseGeocode(latitude: number, longitude: number): Promise<LocationData | null> {
  const cacheKey = getCacheKey(latitude, longitude);

  // Check cache first
  if (geocodeCache.has(cacheKey)) {
    console.log('[Geocode Cache] Cache hit for:', cacheKey);
    return geocodeCache.get(cacheKey)!;
  }

  try {
    // Rate limiting: Nominatim allows 1 request per second
    // User-Agent header is required by Nominatim policy
    // zoom=18 for maximum precision (street level)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1&accept-language=de,en`,
      {
        headers: {
          'User-Agent': 'MojoBus/1.0 (nostr:npub1f4vym2mu3q9fsz08muz8d469hl568l5358qx90qlaspyuz67ru0sfxvupf)'
        }
      }
    );

    if (!response.ok) {
      console.warn('[Reverse Geocoding] API request failed:', response.status, response.statusText);
      return null;
    }

    const data = await response.json();

    // Extract relevant location information
    const address = data.address || {};
    const locationData: LocationData = {
      // Try to get most specific locality name
      city: address.city ||
            address.town ||
            address.village ||
            address.suburb ||
            address.hamlet ||
            address.locality,
      country: address.country,
      countryCode: address.country_code?.toUpperCase(),
      county: address.county,
      suburb: address.suburb,
      neighbourhood: address.neighbourhood,
      postcode: address.postcode,
      fullAddress: data.display_name,
      display_name: data.display_name
    };

    console.log('[Reverse Geocoding] Location found:', locationData);

    // Cache the result
    geocodeCache.set(cacheKey, locationData);
    cleanupCache();

    return locationData;
  } catch (error) {
    console.error('[Reverse Geocoding] Error:', error);
    return null;
  }
}

/**
 * Extract country code from location data and map to our internal country codes
 *
 * @param location - Location data from reverse geocoding
 * @returns Internal country code (e.g., 'portugal', 'spanien') or null
 */
export function mapCountryCode(location: LocationData | null): string | null {
  if (!location?.countryCode) return null;

  // Map ISO country codes to internal country codes
  const countryMapping: Record<string, string> = {
    PT: 'portugal',
    ES: 'spanien',
    FR: 'frankreich',
    BE: 'belgien',
    DE: 'deutschland',
    LU: 'luxemburg',
  };

  return countryMapping[location.countryCode.toUpperCase()] || null;
}
