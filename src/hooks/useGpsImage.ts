/**
 * useGpsImage Hook
 *
 * Centralized GPS logic for all upload forms
 * Provides functions for GPS extraction, editing, and batch operations
 */

import { useState, useCallback } from 'react';
import { extractGpsFromImage, reverseGeocodeCached, mapCountryCode, type GpsData, type GpsStatus, type LocationData } from '@/lib/gpsExtraction';

/**
 * Hook return type
 */
export interface UseGpsImageReturn {
  /** Extract GPS from image file */
  extractGps: (file: File) => Promise<GpsData | null>;
  /** Auto-fill location from GPS coordinates */
  autoFillLocation: (gps: GpsData) => Promise<string | null>;
  /** Auto-fill country from GPS coordinates */
  autoFillCountry: (gps: GpsData) => Promise<string | null>;
  /** Validate GPS coordinates */
  validateGps: (lat: number, lon: number) => boolean;
  /** Format coordinates for display */
  formatCoords: (lat: number, lon: number) => string;
}

/**
 * Hook for GPS image operations
 *
 * @example
 * ```typescript
 * function MyComponent() {
 *   const { extractGps, autoFillLocation } = useGpsImage();
 *
 *   const handleImageUpload = async (file: File) => {
 *     const gps = await extractGps(file);
 *     if (gps) {
 *       const location = await autoFillLocation(gps);
 *       console.log('Location:', location);
 *     }
 *   };
 *
 *   return <div>...</div>;
 * }
 * ```
 */
export function useGpsImage(): UseGpsImageReturn {
  /**
   * Extract GPS coordinates from image file
   */
  const extractGps = useCallback(async (file: File): Promise<GpsData | null> => {
    try {
      const gps = await extractGpsFromImage(file);
      return gps;
    } catch (error) {
      console.error('[useGpsImage] Failed to extract GPS:', error);
      return null;
    }
  }, []);

  /**
   * Auto-fill location from GPS coordinates
   * Returns formatted location string (city + neighbourhood/suburb)
   */
  const autoFillLocation = useCallback(async (gps: GpsData): Promise<string | null> => {
    try {
      const locationData = await reverseGeocodeCached(gps.latitude, gps.longitude);
      if (!locationData) {
        console.warn('[useGpsImage] No location data found for GPS:', gps);
        return null;
      }

      // Format location: city + neighbourhood/suburb (no postcode)
      const locationParts = [
        locationData.city,
        locationData.neighbourhood,
        locationData.suburb
      ].filter(Boolean);

      const location = locationParts.join(', ');
      console.log('[useGpsImage] Location auto-filled:', location);

      return location;
    } catch (error) {
      console.error('[useGpsImage] Failed to auto-fill location:', error);
      return null;
    }
  }, []);

  /**
   * Auto-fill country from GPS coordinates
   * Returns internal country code (e.g., 'portugal', 'spanien')
   */
  const autoFillCountry = useCallback(async (gps: GpsData): Promise<string | null> => {
    try {
      const locationData = await reverseGeocodeCached(gps.latitude, gps.longitude);
      if (!locationData) {
        return null;
      }

      const country = mapCountryCode(locationData);
      if (country) {
        console.log('[useGpsImage] Country auto-filled:', country);
      }

      return country;
    } catch (error) {
      console.error('[useGpsImage] Failed to auto-fill country:', error);
      return null;
    }
  }, []);

  /**
   * Validate GPS coordinates
   */
  const validateGps = useCallback((lat: number, lon: number): boolean => {
    // Latitude must be between -90 and 90
    if (lat < -90 || lat > 90) {
      return false;
    }

    // Longitude must be between -180 and 180
    if (lon < -180 || lon > 180) {
      return false;
    }

    // Check for NaN
    if (isNaN(lat) || isNaN(lon)) {
      return false;
    }

    return true;
  }, []);

  /**
   * Format coordinates for display
   */
  const formatCoords = useCallback((lat: number, lon: number): string => {
    const latDir = lat >= 0 ? 'N' : 'S';
    const lonDir = lon >= 0 ? 'E' : 'W';

    const absLat = Math.abs(lat);
    const absLon = Math.abs(lon);

    return `${absLat.toFixed(4)}° ${latDir}, ${absLon.toFixed(4)}° ${lonDir}`;
  }, []);

  return {
    extractGps,
    autoFillLocation,
    autoFillCountry,
    validateGps,
    formatCoords
  };
}

/**
 * Batch GPS operations hook
 * Provides functions for applying GPS to multiple images
 */
export interface UseGpsBatchOperationsReturn {
  /** Copy GPS from first image to all images */
  copyFirstToAll: (images: GpsImage[]) => GpsImage[];
  /** Copy GPS from specific source image to all images */
  copyFromSource: (sourceId: string, images: GpsImage[]) => GpsImage[];
  /** Clear GPS from all images */
  clearAll: (images: GpsImage[]) => GpsImage[];
  /** Calculate average coordinates from all GPS-enabled images */
  averageCoordinates: (images: GpsImage[]) => { lat: number; lon: number } | null;
  /** Apply specific GPS coordinates to all images */
  applyToAll: (gps: GpsData, images: GpsImage[]) => GpsImage[];
}

export interface GpsImage {
  id: string;
  file: File;
  gps?: GpsData;
  gpsStatus?: GpsStatus;
}

/**
 * Hook for batch GPS operations
 *
 * @example
 * ```typescript
 * function MyComponent() {
 *   const { copyFirstToAll, averageCoordinates } = useGpsBatchOperations();
 *   const [files, setFiles] = useState<GpsImage[]>([]);
 *
 *   const handleCopyFirstToAll = () => {
 *     const updated = copyFirstToAll(files);
 *     setFiles(updated);
 *   };
 *
 *   return <div>...</div>;
 * }
 * ```
 */
export function useGpsBatchOperations(): UseGpsBatchOperationsReturn {
  /**
   * Copy GPS from first image to all images
   */
  const copyFirstToAll = useCallback((images: GpsImage[]): GpsImage[] => {
    const firstGpsImage = images.find(img => img.gps && img.gpsStatus === 'detected');
    if (!firstGpsImage) {
      console.warn('[useGpsBatchOperations] No GPS-enabled image found');
      return images;
    }

    return images.map(img => {
      if (img.id !== firstGpsImage.id && img.type === 'image') {
        return {
          ...img,
          gps: { ...firstGpsImage.gps! },
          gpsStatus: 'manual'
        };
      }
      return img;
    });
  }, []);

  /**
   * Copy GPS from specific source image to all images
   */
  const copyFromSource = useCallback((sourceId: string, images: GpsImage[]): GpsImage[] => {
    const sourceImage = images.find(img => img.id === sourceId);
    if (!sourceImage || !sourceImage.gps) {
      console.warn('[useGpsBatchOperations] Source image not found or has no GPS');
      return images;
    }

    return images.map(img => {
      if (img.id !== sourceId && img.type === 'image') {
        return {
          ...img,
          gps: { ...sourceImage.gps },
          gpsStatus: 'manual'
        };
      }
      return img;
    });
  }, []);

  /**
   * Clear GPS from all images
   */
  const clearAll = useCallback((images: GpsImage[]): GpsImage[] => {
    return images.map(img => ({
      ...img,
      gps: undefined,
      gpsStatus: 'not_found'
    }));
  }, []);

  /**
   * Calculate average coordinates from all GPS-enabled images
   */
  const averageCoordinates = useCallback((images: GpsImage[]): { lat: number; lon: number } | null => {
    const gpsImages = images.filter(img => img.gps);
    if (gpsImages.length === 0) {
      return null;
    }

    const sumLat = gpsImages.reduce((sum, img) => sum + img.gps!.latitude, 0);
    const sumLon = gpsImages.reduce((sum, img) => sum + img.gps!.longitude, 0);

    const avgLat = sumLat / gpsImages.length;
    const avgLon = sumLon / gpsImages.length;

    console.log('[useGpsBatchOperations] Average coordinates:', { lat: avgLat, lon: avgLon });

    return { lat: avgLat, lon: avgLon };
  }, []);

  /**
   * Apply specific GPS coordinates to all images
   */
  const applyToAll = useCallback((gps: GpsData, images: GpsImage[]): GpsImage[] => {
    return images.map(img => ({
      ...img,
      gps: { ...gps },
      gpsStatus: 'manual'
    }));
  }, []);

  return {
    copyFirstToAll,
    copyFromSource,
    clearAll,
    averageCoordinates,
    applyToAll
  };
}
