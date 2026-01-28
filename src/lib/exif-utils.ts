/**
 * EXIF und Geolocation Utilities für GPS-Extraktion aus Bildern
 * Robuster Parser für verschiedene EXIF-Formate
 */

/**
 * EXIF-Daten aus ArrayBuffer lesen
 * Sehr robuster Parser, der mit verschiedenen EXIF-Strukturen umgehen kann
 */
function readEXIFData(arrayBuffer: ArrayBuffer): any {
  try {
    const dataView = new DataView(arrayBuffer);

    // Prüfen ob JPEG
    if (dataView.getUint8(0) !== 0xFF || dataView.getUint8(1) !== 0xD8) {
      console.log('Keine JPEG-Datei');
      return null;
    }

    const exif: any = {};

    // Alle Marker durchsuchen
    const length = dataView.byteLength;
    let offset = 2;

    while (offset < length - 8) {
      // Marker finden
      while (offset < length && dataView.getUint8(offset) !== 0xFF) {
        offset++;
      }

      if (offset >= length) break;

      const marker = dataView.getUint8(offset + 1);
      offset += 2;

      // EXIF-Marker (0xE1)
      if (marker === 0xE1) {
        const markerSize = dataView.getUint16(offset, false);
        offset += 2;

        // Prüfen ob "Exif" String
        if (offset + 4 > length) {
          offset += markerSize;
          continue;
        }

        if (dataView.getUint32(offset, false) !== 0x45786966) {
          offset += markerSize;
          continue;
        }

        offset += 4;

        // TIFF-Header lesen
        const byteOrder = dataView.getUint16(offset, false);
        const isBigEndian = byteOrder === 0x4D4D; // "MM" = Motorola (Big Endian)

        if (byteOrder !== 0x4D4D && byteOrder !== 0x4949) {
          console.log('Ungültiges TIFF-Byte-Order:', byteOrder.toString(16));
          offset += markerSize - 4;
          continue;
        }

        // 42 Check
        const tiffMagic = dataView.getUint16(offset + 2, isBigEndian);
        if (tiffMagic !== 0x002A) {
          console.log('Ungültiges TIFF-Magic:', tiffMagic.toString(16));
          offset += markerSize - 4;
          continue;
        }

        const firstIFDOffset = dataView.getUint32(offset + 4, isBigEndian);
        const tiffStart = offset;

        console.log('TIFF Header gefunden:', {
          byteOrder: byteOrder.toString(16),
          isBigEndian,
          magic: tiffMagic.toString(16),
          firstIFDOffset: firstIFDOffset.toString(16)
        });

        // Erste IFD lesen
        if (firstIFDOffset !== 0) {
          const ifdOffset = tiffStart + firstIFDOffset;
          const numEntries = dataView.getUint16(ifdOffset, isBigEndian);

          console.log('IFD Offset:', ifdOffset.toString(16), 'Einträge:', numEntries);

          // Nach GPS-IFD Pointer suchen
          let gpsIFDOffset = 0;
          for (let i = 0; i < numEntries; i++) {
            const entryOffset = ifdOffset + 2 + (i * 12);
            const tag = dataView.getUint16(entryOffset, isBigEndian);

            // Tag 0x8825 = GPS IFD Pointer
            if (tag === 0x8825) {
              gpsIFDOffset = dataView.getUint32(entryOffset + 8, isBigEndian);
              console.log('GPS IFD Pointer gefunden:', gpsIFDOffset.toString(16));
              break;
            }
          }

          // GPS-IFD lesen
          if (gpsIFDOffset !== 0) {
            const gpsIFDOffsetActual = tiffStart + gpsIFDOffset;
            const gpsNumEntries = dataView.getUint16(gpsIFDOffsetActual, isBigEndian);

            console.log('GPS IFD Offset:', gpsIFDOffsetActual.toString(16), 'GPS Einträge:', gpsNumEntries);

            let lat: number[][] | null = null;
            let latRef: string | null = null;
            let lon: number[][] | null = null;
            let lonRef: string | null = null;

            for (let j = 0; j < gpsNumEntries; j++) {
              const entryOffset = gpsIFDOffsetActual + 2 + (j * 12);
              const tag = dataView.getUint16(entryOffset, isBigEndian);
              const type = dataView.getUint16(entryOffset + 2, isBigEndian);
              const numValues = dataView.getUint32(entryOffset + 4, isBigEndian);

              let valueOffset = dataView.getUint32(entryOffset + 8, isBigEndian) + tiffStart;

              // Kleine Werte direkt im Entry
              if (numValues * 4 <= 4) {
                valueOffset = entryOffset + 8;
              }

              // GPS Latitude (Tag 0x0002)
              if (tag === 0x0002 && type === 0x0005 && numValues === 3) {
                lat = [];
                for (let k = 0; k < 3; k++) {
                  const offset = valueOffset + (k * 8);
                  const numerator = dataView.getUint32(offset, isBigEndian);
                  const denominator = dataView.getUint32(offset + 4, isBigEndian);
                  lat.push([numerator, denominator]);
                }
                console.log('GPS Latitude gefunden:', lat);
              }

              // GPS Latitude Ref (Tag 0x0001)
              if (tag === 0x0001 && type === 0x0002) {
                latRef = '';
                for (let k = 0; k < numValues - 1; k++) {
                  const charCode = dataView.getUint8(valueOffset + k);
                  if (charCode === 0) break;
                  latRef += String.fromCharCode(charCode);
                }
                console.log('GPS Latitude Ref:', latRef);
              }

              // GPS Longitude (Tag 0x0004)
              if (tag === 0x0004 && type === 0x0005 && numValues === 3) {
                lon = [];
                for (let k = 0; k < 3; k++) {
                  const offset = valueOffset + (k * 8);
                  const numerator = dataView.getUint32(offset, isBigEndian);
                  const denominator = dataView.getUint32(offset + 4, isBigEndian);
                  lon.push([numerator, denominator]);
                }
                console.log('GPS Longitude gefunden:', lon);
              }

              // GPS Longitude Ref (Tag 0x0003)
              if (tag === 0x0003 && type === 0x0002) {
                lonRef = '';
                for (let k = 0; k < numValues - 1; k++) {
                  const charCode = dataView.getUint8(valueOffset + k);
                  if (charCode === 0) break;
                  lonRef += String.fromCharCode(charCode);
                }
                console.log('GPS Longitude Ref:', lonRef);
              }
            }

            // Wenn wir alle GPS-Daten haben, speichern
            if (lat && latRef && lon && lonRef) {
              exif.GPSLatitude = lat;
              exif.GPSLatitudeRef = latRef;
              exif.GPSLongitude = lon;
              exif.GPSLongitudeRef = lonRef;

              console.log('GPS-Daten vollständig:', {
                lat,
                latRef,
                lon,
                lonRef
              });

              return exif;
            }
          }
        }

        // Rest des Markers überspringen
        offset += markerSize - 4;
      } else {
        // Andere Marker überspringen
        const markerSize = dataView.getUint16(offset, false);
        offset += 2 + markerSize;
      }
    }

    if (!exif.GPSLatitude || !exif.GPSLongitude) {
      console.log('Keine GPS-Daten in EXIF gefunden');
      return null;
    }

    return exif;
  } catch (error) {
    console.error('Fehler beim Lesen der EXIF-Daten:', error);
    return null;
  }
}

/**
 * GPS-Koordinaten aus EXIF-Daten konvertieren
 * EXIF speichert Koordinaten als [Grad, Minuten, Sekunden] Arrays
 */
function convertDMSToDD(dms: number[][], ref: string): number {
  if (!dms || dms.length !== 3) {
    console.log('Ungültiges DMS-Format:', dms);
    return 0;
  }

  const [degrees, minutes, seconds] = dms;

  // Prüfen ob arrays
  const deg = Array.isArray(degrees) ? degrees[0] / degrees[1] : degrees;
  const min = Array.isArray(minutes) ? minutes[0] / minutes[1] : minutes;
  const sec = Array.isArray(seconds) ? seconds[0] / seconds[1] : seconds;

  let dd = deg + min / 60 + sec / 3600;

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
