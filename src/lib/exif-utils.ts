/**
 * EXIF und Geolocation Utilities für GPS-Extraktion aus Bildern
 */

// Importiere exif-js synchron für Stabilität
import exifjs from 'exif-js';
const EXIF = exifjs;

/**
 * GPS-Koordinaten aus EXIF-Daten konvertieren
 * EXIF speichert Koordinaten als [Grad, Minuten, Sekunden] Arrays
 */
function convertDMSToDD(dms: number[], ref: string): number {
  const [degrees, minutes, seconds] = dms;
  let dd = degrees + minutes / 60 + seconds / 3600;

  // Süd und West sind negativ
  if (ref === 'S' || ref === 'W') {
    dd = dd * -1;
  }

  return dd;
}

/**
 * GPS-Koordinaten aus einem Bild extrahieren
 * @param file - Das Bilddatei-Objekt
 * @returns Promise mit { latitude, longitude } oder null wenn keine GPS-Daten vorhanden sind
 */
export async function extractGPSFromImage(file: File): Promise<{ latitude: number; longitude: number } | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const img = new Image();
        img.src = e.target?.result as string;

        img.onload = () => {
          EXIF.getData(img as any, function() {
            const exifData = this as any;

            if (!exifData || !exifData.GPSLatitude || !exifData.GPSLongitude) {
              resolve(null); // Keine GPS-Daten
              return;
            }

            const latitude = convertDMSToDD(
              exifData.GPSLatitude,
              exifData.GPSLatitudeRef
            );

            const longitude = convertDMSToDD(
              exifData.GPSLongitude,
              exifData.GPSLongitudeRef
            );

            resolve({ latitude, longitude });
          });
        };

        img.onerror = () => {
          resolve(null);
        };
      } catch (error) {
        console.error('Fehler beim Lesen der EXIF-Daten:', error);
        resolve(null);
      }
    };

    reader.onerror = () => {
      resolve(null);
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Reverse Geocoding mit Nominatim
 * @param latitude - Breitengrad
 * @param longitude - Längengrad
 * @returns Promise mit formatierter Adresse oder null bei Fehler
 */
export async function reverseGeocode(latitude: number, longitude: number): Promise<string | null> {
  const PROXY_URL = 'https://proxy.shakespeare.diy/?url=';

  const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=de`;

  try {
    const response = await fetch(PROXY_URL + encodeURIComponent(nominatimUrl), {
      headers: {
        'User-Agent': 'MojoBus/1.0 (https://mojobus.co)',
      },
    });

    if (!response.ok) {
      throw new Error(`Nominatim API Error: ${response.status}`);
    }

    const data = await response.json();

    if (!data || data.error) {
      console.error('Nominatim error:', data?.error);
      return null;
    }

    // Priorisierte Formatierung für Standort
    // Versuche: Stadt, Region, Land
    const locationParts: string[] = [];

    if (data.address?.city) locationParts.push(data.address.city);
    else if (data.address?.town) locationParts.push(data.address.town);
    else if (data.address?.village) locationParts.push(data.address.village);

    if (data.address?.state) locationParts.push(data.address.state);
    else if (data.address?.county) locationParts.push(data.address.county);

    if (data.address?.country) locationParts.push(data.address.country);

    // Fallback auf display_name
    if (locationParts.length === 0 && data.display_name) {
      return data.display_name;
    }

    // Nur Stadt und Land anzeigen (falls vorhanden)
    const result = locationParts.length >= 2
      ? `${locationParts[0]}, ${locationParts[locationParts.length - 1]}`
      : locationParts.join(', ');

    return result || null;
  } catch (error) {
    console.error('Reverse Geocoding Fehler:', error);
    return null;
  }
}

/**
 * Vollständiger Prozess: GPS aus Bild extrahieren und Standort ermitteln
 * @param file - Das Bilddatei-Objekt
 * @param onProgress - Callback für Fortschritts-Updates
 * @returns Promise mit ermitteltem Standort oder null bei Fehler
 */
export async function extractLocationFromImage(
  file: File,
  onProgress?: (status: string) => void
): Promise<string | null> {
  try {
    onProgress?.('🔍 Suche GPS-Daten im Bild...');
    const coords = await extractGPSFromImage(file);

    if (!coords) {
      onProgress?.('❌ Keine GPS-Daten in diesem Bild gefunden');
      return null;
    }

    onProgress?.(`📍 GPS gefunden: ${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`);

    onProgress?.('🗺️ Ermittle Standort über Nominatim...');
    const location = await reverseGeocode(coords.latitude, coords.longitude);

    if (!location) {
      onProgress?.('❌ Konnte Standort nicht ermitteln');
      return null;
    }

    onProgress?.(`✅ Standort ermittelt: ${location}`);
    return location;
  } catch (error) {
    console.error('Fehler bei der Standort-Ermittlung:', error);
    onProgress?.('❌ Fehler bei der Standort-Ermittlung');
    return null;
  }
}
