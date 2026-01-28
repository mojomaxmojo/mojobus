/**
 * EXIF und Geolocation Utilities für GPS-Extraktion aus Bildern
 * Einfache Implementierung ohne externe Library für bessere Stabilität
 */

/**
 * EXIF-Daten aus ArrayBuffer lesen
 */
function readEXIFData(dataView: DataView): any {
  const exif: any = {};

  if (dataView.getUint16(0, false) !== 0xFFD8) {
    return null; // Keine JPEG-Datei
  }

  const length = dataView.byteLength;
  let offset = 2;

  while (offset < length) {
    if (dataView.getUint16(offset, false) !== 0xFFE1) {
      offset++;
      continue;
    }

    offset += 2;

    if (dataView.getUint32(offset, false) !== 0x45786966) {
      break; // Keine EXIF-Signatur
    }

    offset += 6;

    const bigEnd = dataView.getUint16(offset, false) === 0x4949;
    offset += dataView.getUint32(offset + 4, bigEnd);

    const tags = readTags(dataView, offset, dataView.getUint16(offset, bigEnd), bigEnd);

    if (tags && tags['GPSLatitude'] && tags['GPSLongitude']) {
      exif.GPSLatitude = tags['GPSLatitude'];
      exif.GPSLongitude = tags['GPSLongitude'];
      exif.GPSLatitudeRef = tags['GPSLatitudeRef'];
      exif.GPSLongitudeRef = tags['GPSLongitudeRef'];
    }

    break;
  }

  return exif;
}

/**
 * EXIF-Tags lesen
 */
function readTags(dataView: DataView, offset: number, numTags: number, bigEnd: boolean): any {
  const tags: any = {};

  for (let i = 0; i < numTags; i++) {
    const tagOffset = offset + 2 + (i * 12);
    const tag = dataView.getUint16(tagOffset, bigEnd);
    const type = dataView.getUint16(tagOffset + 2, bigEnd);
    const numValues = dataView.getUint32(tagOffset + 4, bigEnd);
    const valueOffset = dataView.getUint32(tagOffset + 8, bigEnd) + 12;

    let value: any;
    switch (type) {
      case 1: // BYTE
        value = dataView.getUint8(valueOffset);
        break;
      case 2: // ASCII
        value = '';
        for (let j = 0; j < numValues - 1; j++) {
          value += String.fromCharCode(dataView.getUint8(valueOffset + j));
        }
        break;
      case 3: // SHORT
        value = dataView.getUint16(valueOffset, bigEnd);
        break;
      case 4: // LONG
        value = dataView.getUint32(valueOffset, bigEnd);
        break;
      case 5: // RATIONAL
        value = dataView.getUint32(valueOffset, bigEnd) / dataView.getUint32(valueOffset + 4, bigEnd);
        break;
      case 10: // SRATIONAL
        value = [
          dataView.getInt32(valueOffset, bigEnd),
          dataView.getInt32(valueOffset + 4, bigEnd)
        ];
        break;
    }

    // GPS-Tags
    if (tag === 0x0001) tags['GPSLatitudeRef'] = value;
    if (tag === 0x0002 && numValues === 3) {
      tags['GPSLatitude'] = [
        [dataView.getUint32(valueOffset, bigEnd), dataView.getUint32(valueOffset + 4, bigEnd)],
        [dataView.getUint32(valueOffset + 8, bigEnd), dataView.getUint32(valueOffset + 12, bigEnd)],
        [dataView.getUint32(valueOffset + 16, bigEnd), dataView.getUint32(valueOffset + 20, bigEnd)]
      ];
    }
    if (tag === 0x0003) tags['GPSLongitudeRef'] = value;
    if (tag === 0x0004 && numValues === 3) {
      tags['GPSLongitude'] = [
        [dataView.getUint32(valueOffset, bigEnd), dataView.getUint32(valueOffset + 4, bigEnd)],
        [dataView.getUint32(valueOffset + 8, bigEnd), dataView.getUint32(valueOffset + 12, bigEnd)],
        [dataView.getUint32(valueOffset + 16, bigEnd), dataView.getUint32(valueOffset + 20, bigEnd)]
      ];
    }
  }

  return tags;
}

/**
 * GPS-Koordinaten aus EXIF-Daten konvertieren
 * EXIF speichert Koordinaten als [Grad, Minuten, Sekunden] Arrays
 */
function convertDMSToDD(dms: number[][], ref: string): number {
  const [degrees, minutes, seconds] = dms;
  let dd = degrees[0] / degrees[1] + minutes[0] / minutes[1] / 60 + seconds[0] / seconds[1] / 3600;

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
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const dataView = new DataView(arrayBuffer);
        const exifData = readEXIFData(dataView);

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
      } catch (error) {
        console.error('Fehler beim Lesen der EXIF-Daten:', error);
        resolve(null);
      }
    };

    reader.onerror = () => {
      resolve(null);
    };

    reader.readAsArrayBuffer(file);
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
