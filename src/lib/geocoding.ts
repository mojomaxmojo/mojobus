/**
 * GPS & Geocoding Helper Funktionen
 * Extrahiert GPS-Daten aus Bildern und macht Reverse Geocoding
 */

import EXIF from 'exif-js';
import {
  GEOCODING_CONFIG,
  type Coordinates,
  type LocationData,
} from '@/config/geocoding';
import type { NostrEvent } from '@nostrify/nostrify';

/**
 * Cache für Geocoding-Ergebnisse
 */
const geocodingCache = new Map<string, LocationData & { timestamp: number }>();

/**
 * GPS-Koordinaten aus einem Bild extrahieren
 */
export async function extractGPSFromImage(file: File): Promise<Coordinates | null> {
  return new Promise((resolve, reject) => {
    EXIF.getData(file, function() {
      try {
        const exifData = EXIF.getAllTags(this);

        // Latitude extrahieren
        const lat = EXIF.getTag(this, GEOCODING_CONFIG.gpsExtraction.tags.latitude);
        const latRef = EXIF.getTag(this, GEOCODING_CONFIG.gpsExtraction.tags.latitudeRef);

        // Longitude extrahieren
        const lng = EXIF.getTag(this, GEOCODING_CONFIG.gpsExtraction.tags.longitude);
        const lngRef = EXIF.getTag(this, GEOCODING_CONFIG.gpsExtraction.tags.longitudeRef);

        // Altitude extrahieren (optional)
        const altitude = EXIF.getTag(this, GEOCODING_CONFIG.gpsExtraction.tags.altitude);

        // Richtung extrahieren (optional)
        const direction = EXIF.getTag(this, GEOCODING_CONFIG.gpsExtraction.tags.direction);

        if (!lat || !lng || !latRef || !lngRef) {
          console.log('[GPS] Keine GPS-Daten im Bild gefunden');
          resolve(null);
          return;
        }

        // GPS-Koordinaten umrechnen
        const latitude = convertDMSToDD(lat, latRef);
        const longitude = convertDMSToDD(lng, lngRef);

        console.log('[GPS] Koordinaten extrahiert:', { latitude, longitude, altitude, direction });

        resolve({
          latitude,
          longitude,
          altitude,
          direction,
        });
      } catch (error) {
        console.error('[GPS] Fehler beim Extrahieren:', error);
        resolve(null);
      }
    });
  });
}

/**
 * DMS (Degrees Minutes Seconds) zu Decimal Degrees umrechnen
 * Format: [degrees, minutes, seconds]
 */
function convertDMSToDD(dms: number[], ref: string): number {
  let dd = dms[0] + dms[1] / 60 + dms[2] / 3600;

  if (ref === 'S' || ref === 'W') {
    dd = dd * -1;
  }

  // Auf gewünschte Präzision runden
  return parseFloat(dd.toFixed(GEOCODING_CONFIG.gpsExtraction.minPrecision));
}

/**
 * Reverse Geocoding mit Nominatim (OpenStreetMap)
 * Koordinaten → Adresse
 */
export async function reverseGeocode(
  coordinates: Coordinates
): Promise<LocationData | null> {
  const { latitude, longitude } = coordinates;
  const cacheKey = `${latitude},${longitude}`;

  // Cache prüfen
  if (GEOCODING_CONFIG.cache.enabled) {
    const cached = geocodingCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < GEOCODING_CONFIG.cache.ttl * 1000) {
      console.log('[Geocoding] Cache-Hit:', cacheKey);
      const { timestamp, ...data } = cached;
      return data;
    }
  }

  console.log('[Geocoding] Reverse Geocoding für:', { latitude, longitude });

  try {
    const url = new URL(`${GEOCODING_CONFIG.nominatim.baseUrl}${GEOCODING_CONFIG.nominatim.reverse}`);

    url.searchParams.append('lat', latitude.toString());
    url.searchParams.append('lon', longitude.toString());
    url.searchParams.append('format', GEOCODING_CONFIG.nominatim.format);
    url.searchParams.append('accept-language', GEOCODING_CONFIG.nominatim.accept_language);
    url.searchParams.append('addressdetails', '1');
    url.searchParams.append('zoom', GEOCODING_CONFIG.reverseGeocoding.zoom.toString());

    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': GEOCODING_CONFIG.nominatim.user_agent,
      },
      signal: AbortSignal.timeout(GEOCODING_CONFIG.errorHandling.timeout),
    });

    if (!response.ok) {
      throw new Error(`Nominatim API Error: ${response.status}`);
    }

    const data = await response.json();

    const locationData: LocationData = {
      coordinates,
      address: {
        country: data.address?.country,
        country_code: data.address?.country_code?.toUpperCase(),
        region: data.address?.state || data.address?.province,
        city: data.address?.city || data.address?.town || data.address?.village,
        road: data.address?.road,
        postcode: data.address?.postcode,
        display_name: data.display_name,
      },
      formatted: data.display_name,
    };

    console.log('[Geocoding] Ergebnis:', locationData);

    // Cachen
    if (GEOCODING_CONFIG.cache.enabled) {
      geocodingCache.set(cacheKey, {
        ...locationData,
        timestamp: Date.now(),
      });

      // Cache cleanup
      if (geocodingCache.size > GEOCODING_CONFIG.cache.maxSize) {
        const oldestKey = geocodingCache.keys().next().value;
        geocodingCache.delete(oldestKey);
      }
    }

    return locationData;
  } catch (error) {
    console.error('[Geocoding] Fehler:', error);
    return null;
  }
}

/**
 * Koordinaten zu formatierter Zeichenkette
 */
export function formatCoordinates(coordinates: Coordinates): string {
  const { latitude, longitude } = coordinates;
  return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
}

/**
 * Erstellt Nostr-Tags aus GPS-Daten
 */
export function createNostrGPSTags(locationData?: LocationData): string[][] {
  if (!locationData) {
    return [];
  }

  const { coordinates, address } = locationData;
  const tags: string[][] = [];

  // Koordinaten
  tags.push([GEOCODING_CONFIG.nostr.latitude, coordinates.latitude.toString()]);
  tags.push([GEOCODING_CONFIG.nostr.longitude, coordinates.longitude.toString()]);

  // Altitude (wenn vorhanden)
  if (coordinates.altitude) {
    tags.push([GEOCODING_CONFIG.nostr.altitude, coordinates.altitude.toString()]);
  }

  // Adresse (wenn vorhanden)
  if (address) {
    // Formatierter Standort
    if (address.display_name) {
      tags.push([GEOCODING_CONFIG.nostr.location, address.display_name]);
    }

    // Land
    if (address.country_code) {
      tags.push([GEOCODING_CONFIG.nostr.country, address.country_code]);
    }

    // Region/Provinz
    if (address.region) {
      tags.push([GEOCODING_CONFIG.nostr.region, address.region]);
    }

    // Stadt/Ort
    if (address.city) {
      tags.push([GEOCODING_CONFIG.nostr.city, address.city]);
    }
  }

  return tags;
}

/**
 * Extrahiert GPS-Tags aus einem Nostr-Event
 */
export function extractGPSTagsFromEvent(event: NostrEvent): {
  coordinates: Coordinates | null;
  location: string | null;
  country: string | null;
} {
  const latTag = event.tags.find(t => t[0] === GEOCODING_CONFIG.nostr.latitude)?.[1];
  const lngTag = event.tags.find(t => t[0] === GEOCODING_CONFIG.nostr.longitude)?.[1];
  const locationTag = event.tags.find(t => t[0] === GEOCODING_CONFIG.nostr.location)?.[1];
  const countryTag = event.tags.find(t => t[0] === GEOCODING_CONFIG.nostr.country)?.[1];

  if (!latTag || !lngTag) {
    return {
      coordinates: null,
      location: locationTag || null,
      country: countryTag || null,
    };
  }

  return {
    coordinates: {
      latitude: parseFloat(latTag),
      longitude: parseFloat(lngTag),
    },
    location: locationTag || null,
    country: countryTag || null,
  };
}

/**
 * Prüft ob ein Bild GPS-Daten hat
 */
export async function hasGPSData(file: File): Promise<boolean> {
  const coordinates = await extractGPSFromImage(file);
  return coordinates !== null;
}

/**
 * Berechnet Distanz zwischen zwei Koordinaten (in km)
 * Haversine Formel
 */
export function calculateDistance(
  coords1: Coordinates,
  coords2: Coordinates
): number {
  const R = 6371; // Erdradius in km
  const dLat = toRad(coords2.latitude - coords1.latitude);
  const dLon = toRad(coords2.longitude - coords1.longitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(coords1.latitude)) *
    Math.cos(toRad(coords2.latitude)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;

  return parseFloat(d.toFixed(2));
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Erstellt eine Google Maps URL aus Koordinaten
 */
export function createGoogleMapsURL(coordinates: Coordinates): string {
  const { latitude, longitude } = coordinates;
  return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
}

/**
 * Erstellt eine OpenStreetMap URL aus Koordinaten
 */
export function createOpenStreetMapURL(coordinates: Coordinates): string {
  const { latitude, longitude } = coordinates;
  return `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}&zoom=15`;
}
