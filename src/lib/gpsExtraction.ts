/**
 * GPS Extraction Utility
 * Extracts GPS coordinates from image EXIF data
 * Lazy loaded to avoid impacting initial bundle size
 */

// Country coordinates (fallback for images without GPS)
export const COUNTRY_COORDINATES: Record<string, [number, number]> = {
  portugal: [39.3999, -8.2245],      // Lisbon
  spanien: [40.4168, -3.7038],       // Madrid
  frankreich: [48.8566, 2.3522],     // Paris
  belgien: [50.8503, 4.3517],        // Brussels
  luxemburg: [49.8153, 6.1296],      // Luxembourg City
  deutschland: [52.5200, 13.4050],   // Berlin
};

export interface GPSCoordinates {
  latitude: number;
  longitude: number;
}

/**
 * Extract GPS coordinates from an image file
 * @param file - Image file to extract GPS from
 * @returns GPS coordinates or null if not found
 */
export async function extractGPSFromImage(file: File): Promise<GPSCoordinates | null> {
  try {
    // Dynamic import of exifr library - only loaded when needed
    const exifr = await import('exifr');

    // Try to extract GPS data
    const gpsData = await exifr.default.gps(file);

    if (gpsData && typeof gpsData.latitude === 'number' && typeof gpsData.longitude === 'number') {
      return {
        latitude: gpsData.latitude,
        longitude: gpsData.longitude,
      };
    }

    return null;
  } catch (error) {
    console.error('Error extracting GPS from image:', error);
    return null;
  }
}

/**
 * Get fallback coordinates for a country
 * @param country - Country name (e.g., "Portugal", "spanien")
 * @returns GPS coordinates or null if country not found
 */
export function getCountryCoordinates(country: string): GPSCoordinates | null {
  const countryKey = Object.keys(COUNTRY_COORDINATES).find(
    (key) => key === country.toLowerCase() || key.includes(country.toLowerCase())
  );

  if (countryKey) {
    const coords = COUNTRY_COORDINATES[countryKey];
    return {
      latitude: coords[0],
      longitude: coords[1],
    };
  }

  return null;
}

/**
 * Extract coordinates from first image with GPS, or fallback to country
 * @param files - Array of image files
 * @param country - Country name for fallback
 * @returns GPS coordinates or null
 */
export async function extractCoordinatesWithFallback(
  files: File[],
  country?: string
): Promise<GPSCoordinates | null> {
  // Try to get GPS from first image
  if (files.length > 0) {
    const firstImage = files.find(file => file.type.startsWith('image/'));
    if (firstImage) {
      const gps = await extractGPSFromImage(firstImage);
      if (gps) {
        return gps;
      }
    }
  }

  // Fallback to country coordinates
  if (country) {
    return getCountryCoordinates(country);
  }

  return null;
}
