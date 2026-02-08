/**
 * GPS Extraction from Image EXIF Data
 *
 * This module provides functions to extract GPS coordinates from image files
 * using the exifr library. Supports JPEG and other EXIF-enabled formats.
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
    // Check if file is an image type that supports EXIF
    if (!file.type.match(/^image\/(jpeg|jpg|tiff)$/i)) {
      return null;
    }

    // Extract EXIF data using exifr
    const exifData = await exifr.parse(file, ['GPSLatitude', 'GPSLongitude', 'GPSAltitude', 'GPSLatitudeRef', 'GPSLongitudeRef']);

    // Debug log
    console.log('[GPS Extraction] EXIF Data:', {
      GPSLatitude: exifData?.GPSLatitude,
      GPSLongitude: exifData?.GPSLongitude,
      GPSAltitude: exifData?.GPSAltitude,
      GPSLatitudeRef: exifData?.GPSLatitudeRef,
      GPSLongitudeRef: exifData?.GPSLongitudeRef,
      filename: file.name,
    });

    // Check if GPS data exists
    if (!exifData || !exifData.GPSLatitude || !exifData.GPSLongitude) {
      return null;
    }

    // Convert GPS coordinates to decimal degrees
    // EXIF GPS data format: [degrees, minutes, seconds] or just decimal degrees
    let latitude: number;
    let longitude: number;

    try {
      // Try to convert DMS (Degrees, Minutes, Seconds) format
      // Pass ref separately as it's stored in GPSLatitudeRef/GPSLongitudeRef
      const latRef = (exifData.GPSLatitudeRef as 'N' | 'S') || 'N';
      const lonRef = (exifData.GPSLongitudeRef as 'E' | 'W') || 'E';

      latitude = convertDMSToDD(exifData.GPSLatitude, latRef);
      longitude = convertDMSToDD(exifData.GPSLongitude, lonRef);
    } catch (error) {
      // If DMS conversion fails, try using direct decimal values
      console.warn('[GPS Extraction] DMS conversion failed, trying direct values:', error);

      // EXIF might provide decimal degrees directly
      latitude = parseFloat(exifData.GPSLatitude as string);
      longitude = parseFloat(exifData.GPSLongitude as string);

      // Apply hemisphere reference if available
      const latRef = exifData.GPSLatitudeRef as 'N' | 'S';
      const lonRef = exifData.GPSLongitudeRef as 'E' | 'W';

      if (latRef === 'S') {
        latitude = -Math.abs(latitude);
      }
      if (lonRef === 'W') {
        longitude = -Math.abs(longitude);
      }
    }

    // Validate coordinates
    if (!isValidCoordinate(latitude, longitude)) {
      console.warn('[GPS Extraction] Invalid GPS coordinates:', { latitude, longitude });
      return null;
    }

    // Determine precision based on available data
    const precision = determinePrecision(exifData);

    const gpsData: GpsData = {
      latitude,
      longitude,
      precision,
    };

    // Add altitude if available
    if (exifData.GPSAltitude !== undefined) {
      gpsData.altitude = parseFloat(exifData.GPSAltitude);
    }

    console.log('[GPS Extraction] Successfully extracted GPS:', {
      latitude: gpsData.latitude,
      longitude: gpsData.longitude,
      altitude: gpsData.altitude,
      precision: gpsData.precision,
      filename: file.name,
    });

    return gpsData;
  } catch (error) {
    console.error('[GPS Extraction] Error extracting GPS:', error);
    return null;
  }
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
    throw new Error('DMS is not an array');
  }

  const degrees = parseFloat(dms[0]);
  const minutes = parseFloat(dms[1] || 0);
  const seconds = parseFloat(dms[2] || 0);

  // Validate values
  if (isNaN(degrees)) {
    throw new Error('Degrees is NaN');
  }

  let dd = degrees + minutes / 60 + seconds / 3600;

  // Adjust for hemisphere
  if (ref === 'S' || ref === 'W') {
    dd = -dd;
  }

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

  return true;
}

/**
 * Determine GPS precision based on available EXIF data
 *
 * @param exifData - Raw EXIF data
 * @returns Precision level
 */
function determinePrecision(exifData: any): 'high' | 'medium' | 'low' {
  // High precision: altitude and direction data available
  if (exifData.GPSAltitude !== undefined) {
    return 'high';
  }

  // Medium precision: basic GPS coordinates available
  if (exifData.GPSLatitude && exifData.GPSLongitude) {
    return 'medium';
  }

  // Low precision: minimal data
  return 'low';
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
