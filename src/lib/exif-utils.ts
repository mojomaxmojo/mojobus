/**
 * EXIF und Geolocation Utilities für GPS-Extraktion aus Bildern
 * Verbesserte EXIF-Parsing Implementierung
 */

/**
 * EXIF-Tags lesen aus DataView
 */
function readEXIFTags(dataView: DataView, tiffOffset: number, dirOffset: number, numEntries: number, isBigEndian: boolean, subIFDOffset?: number): any {
  const tags: any = {};

  for (let i = 0; i < numEntries; i++) {
    const entryOffset = dirOffset + 2 + (i * 12);
    const tag = dataView.getUint16(entryOffset, isBigEndian);
    const type = dataView.getUint16(entryOffset + 2, isBigEndian);
    const numValues = dataView.getUint32(entryOffset + 4, isBigEndian);
    const valueOffset = dataView.getUint32(entryOffset + 8, isBigEndian) + tiffOffset;

    // Wert lesen basierend auf Typ
    let value: any;

    if (type === 1) { // BYTE
      value = dataView.getUint8(valueOffset);
    } else if (type === 2) { // ASCII
      value = '';
      for (let j = 0; j < numValues - 1; j++) {
        const charCode = dataView.getUint8(valueOffset + j);
        if (charCode === 0) break;
        value += String.fromCharCode(charCode);
      }
    } else if (type === 3) { // SHORT
      if (numValues === 1) {
        value = dataView.getUint16(entryOffset + 8, isBigEndian);
      } else {
        value = dataView.getUint16(valueOffset, isBigEndian);
      }
    } else if (type === 4) { // LONG
      value = dataView.getUint32(valueOffset, isBigEndian);
    } else if (type === 5) { // RATIONAL
      if (numValues === 1) {
        const numerator = dataView.getUint32(valueOffset, isBigEndian);
        const denominator = dataView.getUint32(valueOffset + 4, isBigEndian);
        value = numerator / denominator;
      } else {
        value = [];
        for (let j = 0; j < numValues; j++) {
          const offset = valueOffset + (j * 8);
          const numerator = dataView.getUint32(offset, isBigEndian);
          const denominator = dataView.getUint32(offset + 4, isBigEndian);
          value.push(numerator / denominator);
        }
      }
    } else if (type === 10) { // SRATIONAL
      if (numValues === 1) {
        const numerator = dataView.getInt32(valueOffset, isBigEndian);
        const denominator = dataView.getInt32(valueOffset + 4, isBigEndian);
        value = numerator / denominator;
      } else {
        value = [];
        for (let j = 0; j < numValues; j++) {
          const offset = valueOffset + (j * 8);
          const numerator = dataView.getInt32(offset, isBigEndian);
          const denominator = dataView.getInt32(offset + 4, isBigEndian);
          value.push([numerator, denominator]);
        }
      }
    }

    // GPS-Tags speichern
    if (tag === 0x0001) tags['GPSLatitudeRef'] = value;
    if (tag === 0x0002 && numValues === 3) {
      tags['GPSLatitude'] = [];
      for (let j = 0; j < 3; j++) {
        const offset = valueOffset + (j * 8);
        const numerator = dataView.getUint32(offset, isBigEndian);
        const denominator = dataView.getUint32(offset + 4, isBigEndian);
        tags['GPSLatitude'].push([numerator, denominator]);
      }
    }
    if (tag === 0x0003) tags['GPSLongitudeRef'] = value;
    if (tag === 0x0004 && numValues === 3) {
      tags['GPSLongitude'] = [];
      for (let j = 0; j < 3; j++) {
        const offset = valueOffset + (j * 8);
        const numerator = dataView.getUint32(offset, isBigEndian);
        const denominator = dataView.getUint32(offset + 4, isBigEndian);
        tags['GPSLongitude'].push([numerator, denominator]);
      }
    }
  }

  // Sub-IFD (GPS-IFD) lesen
  if (subIFDOffset !== undefined && subIFDOffset !== 0) {
    const gpsIFDOffset = dataView.getUint32(dirOffset + 2 + (numEntries * 12), isBigEndian) + tiffOffset;
    const gpsNumEntries = dataView.getUint16(gpsIFDOffset, isBigEndian);

    for (let i = 0; i < gpsNumEntries; i++) {
      const entryOffset = gpsIFDOffset + 2 + (i * 12);
      const tag = dataView.getUint16(entryOffset, isBigEndian);
      const type = dataView.getUint16(entryOffset + 2, isBigEndian);
      const numValues = dataView.getUint32(entryOffset + 4, isBigEndian);
      const valueOffset = dataView.getUint32(entryOffset + 8, isBigEndian) + tiffOffset;

      // GPS-Tags
      if (tag === 0x0001 && type === 2) { // GPSLatitudeRef
        tags['GPSLatitudeRef'] = '';
        for (let j = 0; j < numValues - 1; j++) {
          const charCode = dataView.getUint8(valueOffset + j);
          if (charCode === 0) break;
          tags['GPSLatitudeRef'] += String.fromCharCode(charCode);
        }
      }
      if (tag === 0x0002 && type === 5 && numValues === 3) { // GPSLatitude
        tags['GPSLatitude'] = [];
        for (let j = 0; j < 3; j++) {
          const offset = valueOffset + (j * 8);
          const numerator = dataView.getUint32(offset, isBigEndian);
          const denominator = dataView.getUint32(offset + 4, isBigEndian);
          tags['GPSLatitude'].push([numerator, denominator]);
        }
      }
      if (tag === 0x0003 && type === 2) { // GPSLongitudeRef
        tags['GPSLongitudeRef'] = '';
        for (let j = 0; j < numValues - 1; j++) {
          const charCode = dataView.getUint8(valueOffset + j);
          if (charCode === 0) break;
          tags['GPSLongitudeRef'] += String.fromCharCode(charCode);
        }
      }
      if (tag === 0x0004 && type === 5 && numValues === 3) { // GPSLongitude
        tags['GPSLongitude'] = [];
        for (let j = 0; j < 3; j++) {
          const offset = valueOffset + (j * 8);
          const numerator = dataView.getUint32(offset, isBigEndian);
          const denominator = dataView.getUint32(offset + 4, isBigEndian);
          tags['GPSLongitude'].push([numerator, denominator]);
        }
      }
    }
  }

  return tags;
}

/**
 * EXIF-Daten aus ArrayBuffer lesen
 */
function readEXIFData(arrayBuffer: ArrayBuffer): any {
  const dataView = new DataView(arrayBuffer);
  const exif: any = {};

  // Prüfen ob JPEG
  if (dataView.getUint16(0, false) !== 0xFFD8) {
    console.log('Keine JPEG-Datei');
    return null;
  }

  // Nach EXIF-Marker suchen
  const length = dataView.byteLength;
  let offset = 2;

  while (offset < length) {
    // Marker finden
    if (dataView.getUint8(offset) !== 0xFF) {
      offset++;
      continue;
    }

    const marker = dataView.getUint8(offset + 1);

    // EXIF-Marker (0xE1)
    if (marker === 0xE1) {
      const size = dataView.getUint16(offset + 2, false);

      // Prüfen ob "Exif" String
      if (dataView.getUint32(offset + 4, false) !== 0x45786966) {
        offset += 2 + size;
        continue;
      }

      const tiffOffset = offset + 10;

      // TIFF Header
      const byteOrder = dataView.getUint16(tiffOffset, false);
      const isBigEndian = byteOrder === 0x4D4D; // "MM" = Motorola (Big Endian)

      if (byteOrder !== 0x4D4D && byteOrder !== 0x4949) {
        console.log('Ungültiges TIFF-Byte-Order');
        return null;
      }

      // 42 Check
      if (dataView.getUint16(tiffOffset + 2, isBigEndian) !== 0x002A) {
        console.log('Ungültiges TIFF-Magic-Number');
        return null;
      }

      // Erste IFD Offset
      const firstIFDOffset = dataView.getUint32(tiffOffset + 4, isBigEndian) + tiffOffset;
      const numEntries = dataView.getUint16(firstIFDOffset, isBigEndian);

      // GPS-IFD Offset finden
      let gpsIFDOffset = 0;
      for (let i = 0; i < numEntries; i++) {
        const entryOffset = firstIFDOffset + 2 + (i * 12);
        const tag = dataView.getUint16(entryOffset, isBigEndian);

        if (tag === 0x8825) { // GPS IFD Pointer
          gpsIFDOffset = dataView.getUint32(entryOffset + 8, isBigEndian);
          break;
        }
      }

      // GPS-IFD lesen
      if (gpsIFDOffset !== 0) {
        const gpsIFDOffsetActual = gpsIFDOffset + tiffOffset;
        const gpsNumEntries = dataView.getUint16(gpsIFDOffsetActual, isBigEndian);

        for (let i = 0; i < gpsNumEntries; i++) {
          const entryOffset = gpsIFDOffsetActual + 2 + (i * 12);
          const tag = dataView.getUint16(entryOffset, isBigEndian);
          const type = dataView.getUint16(entryOffset + 2, isBigEndian);
          const numValues = dataView.getUint32(entryOffset + 4, isBigEndian);

          let valueOffset = dataView.getUint32(entryOffset + 8, isBigEndian) + tiffOffset;

          // Kleine Werte können direkt im Entry stehen
          if (numValues * 4 <= 4) {
            valueOffset = entryOffset + 8;
          }

          // GPS-Tags
          if (tag === 0x0001 && type === 2) { // GPSLatitudeRef
            exif['GPSLatitudeRef'] = '';
            for (let j = 0; j < numValues - 1; j++) {
              const charCode = dataView.getUint8(valueOffset + j);
              if (charCode === 0) break;
              exif['GPSLatitudeRef'] += String.fromCharCode(charCode);
            }
          }
          if (tag === 0x0002 && type === 5 && numValues === 3) { // GPSLatitude
            exif['GPSLatitude'] = [];
            for (let j = 0; j < 3; j++) {
              const offset = valueOffset + (j * 8);
              const numerator = dataView.getUint32(offset, isBigEndian);
              const denominator = dataView.getUint32(offset + 4, isBigEndian);
              exif['GPSLatitude'].push([numerator, denominator]);
            }
          }
          if (tag === 0x0003 && type === 2) { // GPSLongitudeRef
            exif['GPSLongitudeRef'] = '';
            for (let j = 0; j < numValues - 1; j++) {
              const charCode = dataView.getUint8(valueOffset + j);
              if (charCode === 0) break;
              exif['GPSLongitudeRef'] += String.fromCharCode(charCode);
            }
          }
          if (tag === 0x0004 && type === 5 && numValues === 3) { // GPSLongitude
            exif['GPSLongitude'] = [];
            for (let j = 0; j < 3; j++) {
              const offset = valueOffset + (j * 8);
              const numerator = dataView.getUint32(offset, isBigEndian);
              const denominator = dataView.getUint32(offset + 4, isBigEndian);
              exif['GPSLongitude'].push([numerator, denominator]);
            }
          }
        }
      }

      break;
    }

    offset += 2 + dataView.getUint16(offset + 2, false);
  }

  if (!exif.GPSLatitude || !exif.GPSLongitude) {
    console.log('Keine GPS-Daten gefunden');
    return null;
  }

  console.log('EXIF-Daten gefunden:', {
    latitude: exif.GPSLatitude,
    latitudeRef: exif.GPSLatitudeRef,
    longitude: exif.GPSLongitude,
    longitudeRef: exif.GPSLongitudeRef
  });

  return exif;
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
        const exifData = readEXIFData(arrayBuffer);

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
