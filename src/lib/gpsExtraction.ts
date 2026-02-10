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
    console.log('[GPS Extraction] Starting extraction for:', file.name);
    console.log('[GPS Extraction] File type:', file.type);
    console.log('[GPS Extraction] File size:', file.size, 'bytes');

    // Check if file is an image type that supports EXIF
    if (!file.type.match(/^image\/(jpeg|jpg|tiff)$/i)) {
      console.log('[GPS Extraction] File type not supported:', file.type);
      // DEBUG: Alert for unsupported file type
      if (typeof window !== 'undefined' && window.location.hostname.includes('test.mojobus.co')) {
        alert(`GPS Debug: File type not supported: ${file.type}`);
      }
      return null;
    }

    console.log('[GPS Extraction] File type supported, extracting EXIF...');

    // DEBUG: Alert start of extraction
    if (typeof window !== 'undefined' && window.location.hostname.includes('test.mojobus.co')) {
      alert(`GPS Debug: Starting extraction for ${file.name} (${file.type})`);
    }

    // Extract EXIF data using exifr - use comprehensive GPS extraction
    // First try with gps: true to get all GPS data
    const exifData = await exifr.gps(file);

    // Debug log - log ALL EXIF data to see what's actually there
    console.log('[GPS Extraction] GPS Data from exifr.gps():', JSON.stringify(exifData, null, 2));

    // DEBUG: Alert GPS data from exifr.gps()
    if (typeof window !== 'undefined' && window.location.hostname.includes('test.mojobus.co')) {
      alert(`GPS Debug: exifr.gps() result: ${JSON.stringify(exifData, null, 2)}`);
    }

    // Check if GPS data exists - exifr.gps() returns already converted decimal degrees or null
    if (!exifData) {
      console.log('[GPS Extraction] No GPS data found with exifr.gps()');
      
      // DEBUG: Alert fallback attempt
      if (typeof window !== 'undefined' && window.location.hostname.includes('test.mojobus.co')) {
        alert('GPS Debug: No data from exifr.gps(), trying fallback...');
      }
      
      // Fallback: Try comprehensive EXIF parse to see if GPS data exists at all
      console.log('[GPS Extraction] Attempting fallback with full EXIF parse...');
      const fullExifData = await exifr.parse(file, {
        gps: true,
        mergeOutput: false,
        translateKeys: false,
        translateValues: false,
      });
      
      console.log('[GPS Extraction] Full EXIF data:', JSON.stringify(fullExifData, null, 2));
      
      // DEBUG: Alert fallback result
      if (typeof window !== 'undefined' && window.location.hostname.includes('test.mojobus.co')) {
        alert(`GPS Debug: Fallback result: ${JSON.stringify(fullExifData, null, 2)}`);
      }
      
      if (!fullExifData || !fullExifData.latitude || !fullExifData.longitude) {
        console.log('[GPS Extraction] No GPS coordinates found in full EXIF parse either');
        
        // DEBUG: Alert no GPS found
        if (typeof window !== 'undefined' && window.location.hostname.includes('test.mojobus.co')) {
          alert('GPS Debug: No GPS coordinates found in any method!');
        }
        
        return null;
      }
      
      // Use the fallback data
      const latitude = fullExifData.latitude;
      const longitude = fullExifData.longitude;
      const altitude = fullExifData.altitude;
      
      console.log('[GPS Extraction] GPS found via fallback:', { latitude, longitude, altitude });
      
      // DEBUG: Alert GPS found via fallback
      if (typeof window !== 'undefined' && window.location.hostname.includes('test.mojobus.co')) {
        alert(`GPS Debug: GPS found via fallback! Lat: ${latitude}, Lon: ${longitude}`);
      }
      
      // Validate coordinates
      if (!isValidCoordinate(latitude, longitude)) {
        console.warn('[GPS Extraction] Invalid GPS coordinates from fallback:', { latitude, longitude });
        return null;
      }
      
      const gpsData: GpsData = {
        latitude,
        longitude,
        precision: altitude !== undefined ? 'high' : 'medium',
      };
      
      if (altitude !== undefined && altitude !== null) {
        gpsData.altitude = parseFloat(String(altitude));
      }
      
      console.log('[GPS Extraction] Successfully extracted GPS via fallback:', gpsData);
      return gpsData;
    }

    // exifr.gps() returned data - it should already be in decimal degrees format
    console.log('[GPS Extraction] GPS data structure:', {
      latitude: exifData.latitude,
      longitude: exifData.longitude,
      altitude: exifData.altitude,
      type: typeof exifData
    });

    // exifr.gps() returns an object with latitude and longitude properties (already converted)
    let latitude = exifData.latitude;
    let longitude = exifData.longitude;

    // Check if we got valid coordinates
    if (latitude === undefined || latitude === null || longitude === undefined || longitude === null) {
      console.log('[GPS Extraction] Missing latitude or longitude in GPS data');
      
      // DEBUG: Alert missing coordinates
      if (typeof window !== 'undefined' && window.location.hostname.includes('test.mojobus.co')) {
        alert('GPS Debug: Missing latitude or longitude in GPS data from exifr.gps()');
      }
      
      return null;
    }

    // Check for 0,0 coordinates (invalid "Null Island" - likely extraction error)
    if (latitude === 0 && longitude === 0) {
      console.log('[GPS Extraction] Got 0,0 coordinates from exifr.gps(), trying raw EXIF parse...');
      
      // DEBUG: Alert 0,0 detected
      if (typeof window !== 'undefined' && window.location.hostname.includes('test.mojobus.co')) {
        alert('GPS Debug: Got 0,0 from exifr.gps() - trying raw EXIF parse...');
      }
      
      // Try to get raw GPS data and manually convert
      const rawExifData = await exifr.parse(file, {
        gps: ['GPSLatitude', 'GPSLongitude', 'GPSAltitude', 'GPSLatitudeRef', 'GPSLongitudeRef'],
        mergeOutput: true,
      });
      
      // DEBUG: Alert raw EXIF result
      if (typeof window !== 'undefined' && window.location.hostname.includes('test.mojobus.co')) {
        alert(`GPS Debug: Raw EXIF data: ${JSON.stringify(rawExifData, null, 2)}`);
      }
      
      if (rawExifData && rawExifData.GPSLatitude && rawExifData.GPSLongitude) {
        // Manual conversion of DMS to decimal degrees
        const latRef = rawExifData.GPSLatitudeRef || 'N';
        const lonRef = rawExifData.GPSLongitudeRef || 'E';
        
        latitude = convertDMSToDD(rawExifData.GPSLatitude, latRef);
        longitude = convertDMSToDD(rawExifData.GPSLongitude, lonRef);
        
        // DEBUG: Alert manually converted coordinates
        if (typeof window !== 'undefined' && window.location.hostname.includes('test.mojobus.co')) {
          alert(`GPS Debug: Manually converted! Lat: ${latitude}, Lon: ${longitude}`);
        }
        
        // Update altitude if available
        if (rawExifData.GPSAltitude) {
          altitude = parseFloat(String(rawExifData.GPSAltitude));
        }
      } else {
        // DEBUG: Alert no raw GPS data
        if (typeof window !== 'undefined' && window.location.hostname.includes('test.mojobus.co')) {
          alert('GPS Debug: No raw GPS data found either!');
        }
        return null;
      }
    }

    console.log('[GPS Extraction] GPS coordinates from exifr.gps():', { latitude, longitude });
    
    // DEBUG: Alert GPS found successfully
    if (typeof window !== 'undefined' && window.location.hostname.includes('test.mojobus.co')) {
      alert(`GPS Debug: GPS found successfully! Lat: ${latitude}, Lon: ${longitude}`);
    }

    // Validate coordinates
    if (!isValidCoordinate(latitude, longitude)) {
      console.warn('[GPS Extraction] Invalid GPS coordinates:', { latitude, longitude });
      return null;
    }

    // Determine precision based on available data
    const altitude = exifData.altitude;
    const precision: 'high' | 'medium' | 'low' = altitude !== undefined && altitude !== null ? 'high' : 'medium';

    const gpsData: GpsData = {
      latitude,
      longitude,
      precision,
    };

    // Add altitude if available
    if (altitude !== undefined && altitude !== null) {
      gpsData.altitude = parseFloat(String(altitude));
      console.log('[GPS Extraction] Altitude added:', gpsData.altitude);
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
    console.error('[GPS Extraction] Error stack:', error instanceof Error ? error.stack : 'No stack');
    
    // DEBUG: Alert error
    if (typeof window !== 'undefined' && window.location.hostname.includes('test.mojobus.co')) {
      alert(`GPS Debug: Error! ${error instanceof Error ? error.message : String(error)}`);
    }
    
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
    console.warn('[GPS] DMS is not an array:', dms);
    throw new Error('DMS is not an array');
  }

  console.log('[GPS] Converting DMS:', {
    dms,
    ref,
    dmsType: typeof dms,
    dmsLength: dms.length
  });

  const degrees = parseFloat(dms[0]);
  const minutes = parseFloat(dms[1] || 0);
  const seconds = parseFloat(dms[2] || 0);

  // Validate values
  if (isNaN(degrees)) {
    console.error('[GPS] Degrees is NaN:', dms[0]);
    throw new Error('Degrees is NaN');
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
