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
      latitude = convertDMSToDD(exifData.GPSLatitude);
      longitude = convertDMSToDD(exifData.GPSLongitude);
    } catch (error) {
      // If DMS conversion fails, try using direct decimal values
      console.warn('[GPS Extraction] DMS conversion failed, trying direct values:', error);

      // EXIF might provide decimal degrees directly
      latitude = parseFloat(exifData.GPSLatitude as string);
      longitude = parseFloat(exifData.GPSLongitude as string);

      // Apply hemisphere reference if available
      if (exifData.GPSLatitudeRef === 'S') {
        latitude = -Math.abs(latitude);
      }
      if (exifData.GPSLongitudeRef === 'W') {
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
 * @param dms - GPS coordinate in DMS format from EXIF
 * @returns Decimal degrees
 *
 * EXIF stores GPS as array: [degrees, minutes, seconds, ref]
 * where ref is 'N', 'S', 'E', or 'W'
 */
function convertDMSToDD(dms: any): number {
  if (!Array.isArray(dms)) {
    throw new Error('DMS is not an array');
  }

  const degrees = parseFloat(dms[0]);
  const minutes = parseFloat(dms[1] || 0);
  const seconds = parseFloat(dms[2] || 0);
  const ref = dms[3] as 'N' | 'S' | 'E' | 'W';

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
 * Reverse geocode GPS coordinates to approximate location description
 * Note: This is a placeholder - real implementation would use a geocoding API
 *
 * @param latitude - Latitude in decimal degrees
 * @param longitude - Longitude in decimal degrees
 * @returns Location description (placeholder)
 */
export function reverseGeocode(latitude: number, longitude: number): string {
  // Placeholder - real implementation would call a geocoding API
  // For now, just return formatted coordinates
  return formatCoordinates(latitude, longitude);
}
