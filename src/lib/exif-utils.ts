/**
 * EXIF und Geolocation Utilities für GPS-Extraktion aus Bildern
 * Ultimativer robuster Parser für alle GPS-Formate
 */

/**
 * Prüfen, ob Wert als Text-Koordinate (Google Pixel Format)
 * Beispiel: "37º 4' 47.04" N
 */
function isTextCoordinate(value: any): boolean {
  if (typeof value === 'string') {
    return value.includes('º') || value.includes("'") || value.includes('"');
  }
  return false;
}

/**
 * Text-Koordinaten im Google Pixel Format parsen
 * Beispiel: "37º 4' 47.04" N
 */
function parseTextCoordinate(text: string): number[] | null {
  try {
    console.log('Parsen Text-Koordinate:', text);

    // Versuch 1: Muster mit Grad-Symbol º
    let match = text.match(/(\d+\.?\d*)\s*º\s*(\d+)\s*['′]\s*(\d+\.?\d*)\s*"([NSEW])/i);
    if (match) {
      const [, degrees, minutes, seconds, ref] = match;
      const [wholeSeconds, fractionalSeconds] = seconds.split('.');
      const secs = parseFloat(`${wholeSeconds}.${fractionalSeconds}`);

      console.log('Geparst mit º Muster:', { degrees, minutes, seconds: seconds.toFixed(4), ref });

      let dd = parseFloat(degrees) + parseFloat(minutes) / 60 + secs / 3600;
      if (ref.toUpperCase() === 'S' || ref.toUpperCase() === 'W') {
        dd = dd * -1;
      }

      console.log('DD Ergebnis:', dd);

      // Als Rational-Array zurückgeben (numer/denominator)
      const denominator = 1000000; // Hohe Genauigkeit
      const numerator = Math.round(dd * denominator);
      return [[numerator, denominator], [60, 1], [3600, 1]];
    }

    // Versuch 2: Alternative Muster
    match = text.match(/(\d+)\s*deg\s+(\d+)\s*['′]\s*(\d+(?:\.\d+)?)\s*"([NSEW])/i);
    if (match) {
      const [, degrees, minutes, seconds, ref] = match;
      const secs = parseFloat(seconds);

      console.log('Geparst mit deg Muster:', { degrees, minutes, seconds, ref });

      let dd = parseFloat(degrees) + parseFloat(minutes) / 60 + secs / 3600;
      if (ref.toUpperCase() === 'S' || ref.toUpperCase() === 'W') {
        dd = dd * -1;
      }

      console.log('DD Ergebnis:', dd);

      const denominator = 1000000;
      const numerator = Math.round(dd * denominator);
      return [[numerator, denominator], [60, 1], [3600, 1]];
    }

    console.log('Kein gültiges Text-Format gefunden');
    return null;
  } catch (error) {
    console.error('Fehler beim Parsen der Text-Koordinate:', error);
    return null;
  }
}

/**
 * EXIF-Daten aus ArrayBuffer lesen
 * Sehr robuster Parser mit umfangreicher Fehlerbehandlung
 */
function readEXIFData(arrayBuffer: ArrayBuffer): any {
  try {
    const dataView = new DataView(arrayBuffer);
    const exif: any = {};

    console.log('=== Start EXIF Parsing ===');
    console.log('ArrayBuffer Größe:', arrayBuffer.byteLength);

    // Prüfen ob JPEG
    if (dataView.getUint8(0) !== 0xFF || dataView.getUint8(1) !== 0xD8) {
      console.log('Keine JPEG-Datei');
      return null;
    }

    // Alle Marker durchsuchen
    const length = dataView.byteLength;
    let offset = 2;
    let exifFound = false;

    while (offset < length - 8) {
      // Marker finden
      while (offset < length && dataView.getUint8(offset) !== 0xFF) {
        offset++;
      }

      if (offset >= length) {
        console.log('Ende der Datei erreicht');
        break;
      }

      const marker = dataView.getUint8(offset + 1);
      offset += 2;

      // EXIF-Marker (0xE1)
      if (marker === 0xE1) {
        const markerSize = dataView.getUint16(offset, false);
        offset += 2;

        // Sicherheitsprüfung
        if (offset + 4 > length) {
          console.log('EXIF-Header würde Lesen überschreiten');
          offset += markerSize - 4;
          continue;
        }

        // Prüfen ob "Exif" String
        if (dataView.getUint32(offset, false) !== 0x45786966) {
          offset += markerSize - 4;
          continue;
        }

        exifFound = true;
        offset += 4;

        console.log('EXIF-Marker gefunden bei offset:', (offset - 4).toString(16));
        console.log('EXIF-Marker Größe:', markerSize);

        // TIFF-Header lesen
        if (offset + 2 > length) {
          console.log('TIFF-Header würde Lesen überschreiten');
          offset += markerSize - 4;
          continue;
        }

        const byteOrder = dataView.getUint16(offset, false);
        const isBigEndian = byteOrder === 0x4D4D; // "MM" = Motorola (Big Endian)

        if (byteOrder !== 0x4D4D && byteOrder !== 0x4949) {
          console.log('Ungültiges TIFF-Byte-Order:', byteOrder.toString(16));
          offset += markerSize - 4;
          continue;
        }

        console.log('TIFF Byte-Order:', byteOrder === 0x4D4D ? 'Big Endian (MM)' : 'Little Endian (II)');

        // 42 Check
        if (offset + 4 > length) {
          console.log('TIFF-Magic würde Lesen überschreiten');
          offset += markerSize - 4;
          continue;
        }

        const tiffMagic = dataView.getUint16(offset + 2, isBigEndian);
        if (tiffMagic !== 0x002A) {
          console.log('Ungültiges TIFF-Magic:', tiffMagic.toString(16));
          offset += markerSize - 4;
          continue;
        }

        const firstIFDOffset = dataView.getUint32(offset + 4, isBigEndian);
        const tiffStart = offset;

        console.log('TIFF Header erfolgreich gelesen:', {
          byteOrder: byteOrder.toString(16),
          isBigEndian,
          magic: tiffMagic.toString(16),
          firstIFDOffset: firstIFDOffset.toString(16)
        });

        offset += 4; // Erste 6 Bytes überspringen

        // Erste IFD lesen
        if (firstIFDOffset !== 0) {
          const ifdOffset = tiffStart + firstIFDOffset;

          if (ifdOffset + 2 > length) {
            console.log('IFD Offset außerhalb der Datei');
            offset += markerSize - 4;
            continue;
          }

          const numEntries = dataView.getUint16(ifdOffset, isBigEndian);

          console.log('Erste IFD Offset:', ifdOffset.toString(16), 'Einträge:', numEntries);

          // Nach GPS-IFD Pointer suchen
          let gpsIFDOffset = 0;
          for (let i = 0; i < numEntries; i++) {
            const entryOffset = ifdOffset + 2 + (i * 12);

            if (entryOffset + 12 > length) {
              console.log('IFD Eintrag ' + i + ' außerhalb der Datei');
              break;
            }

            const tag = dataView.getUint16(entryOffset, isBigEndian);

            // Tag 0x8825 = GPS IFD Pointer
            if (tag === 0x8825) {
              gpsIFDOffset = dataView.getUint32(entryOffset + 8, isBigEndian);
              console.log('✅ GPS IFD Pointer gefunden! Offset:', gpsIFDOffset.toString(16));
              break;
            }
          }

          // GPS-IFD lesen
          if (gpsIFDOffset !== 0) {
            const gpsIFDOffsetActual = tiffStart + gpsIFDOffset;

            if (gpsIFDOffsetActual + 2 > length) {
              console.log('GPS IFD Offset außerhalb der Datei');
              offset += markerSize - 4;
              continue;
            }

            const gpsNumEntries = dataView.getUint16(gpsIFDOffsetActual, isBigEndian);

            console.log('=== GPS IFD Parsing ===');
            console.log('GPS IFD Offset:', gpsIFDOffsetActual.toString(16), 'Einträge:', gpsNumEntries);

            // Zuerst versuchen, Google Pixel Text-Format zu lesen
            let lat: number[][] | string | null = null;
            let latRef: string | null = null;
            let lon: number[][] | string | null = null;
            let lonRef: string | null = null;
            let hasTextFormat = false;

            for (let j = 0; j < gpsNumEntries; j++) {
              const entryOffset = gpsIFDOffsetActual + 2 + (j * 12);

              if (entryOffset + 12 > length) {
                console.log('GPS Eintrag ' + j + ' außerhalb der Datei');
                break;
              }

              const tag = dataView.getUint16(entryOffset, isBigEndian);
              const type = dataView.getUint16(entryOffset + 2, isBigEndian);
              const numValues = dataView.getUint32(entryOffset + 4, isBigEndian);

              let valueOffset = dataView.getUint32(entryOffset + 8, isBigEndian) + tiffStart;

              // Kleine Werte direkt im Entry
              if (numValues * 4 <= 4) {
                valueOffset = entryOffset + 8;
              }

              // GPS Latitude als TEXT (Tag 0x0002)
              if (tag === 0x0002 && type === 0x0002 && numValues >= 10) {
                const textLen = Math.min(numValues - 1, 50); // Begrenzen für Sicherheit
                let latText = '';
                for (let k = 0; k < textLen; k++) {
                  const charCode = dataView.getUint8(valueOffset + k);
                  if (charCode === 0) break;
                  latText += String.fromCharCode(charCode);
                }
                if (latText && latText.length > 5) {
                  console.log('📍 GPS Latitude als TEXT gefunden:', latText);
                  lat = latText;
                  hasTextFormat = true;
                }
              }

              // GPS Longitude als TEXT (Tag 0x0004)
              if (tag === 0x0004 && type === 0x0002 && numValues >= 10) {
                const textLen = Math.min(numValues - 1, 50);
                let lonText = '';
                for (let k = 0; k < textLen; k++) {
                  const charCode = dataView.getUint8(valueOffset + k);
                  if (charCode === 0) break;
                  lonText += String.fromCharCode(charCode);
                }
                if (lonText && lonText.length > 5) {
                  console.log('📍 GPS Longitude als TEXT gefunden:', lonText);
                  lon = lonText;
                  hasTextFormat = true;
                }
              }

              // GPS Latitude Ref (Tag 0x0001)
              if (tag === 0x0001 && type === 0x0002 && numValues <= 3) {
                latRef = '';
                for (let k = 0; k < numValues - 1; k++) {
                  const charCode = dataView.getUint8(valueOffset + k);
                  if (charCode === 0) break;
                  latRef += String.fromCharCode(charCode);
                }
                if (latRef) {
                  console.log('📍 GPS Latitude Ref:', latRef);
                }
              }

              // GPS Longitude Ref (Tag 0x0003)
              if (tag === 0x0003 && type === 0x0002 && numValues <= 3) {
                lonRef = '';
                for (let k = 0; k < numValues - 1; k++) {
                  const charCode = dataView.getUint8(valueOffset + k);
                  if (charCode === 0) break;
                  lonRef += String.fromCharCode(charCode);
                }
                if (lonRef) {
                  console.log('📍 GPS Longitude Ref:', lonRef);
                }
              }
            }

            // Wenn wir Text-Format haben, parsen wir es
            if (hasTextFormat && typeof lat === 'string' && typeof lon === 'string') {
              console.log('✅ Google Pixel Text-Format erkannt!');

              const latNum = parseTextCoordinate(lat);
              const lonNum = parseTextCoordinate(lon);

              if (latNum && lonNum) {
                exif.GPSLatitude = latNum;
                exif.GPSLatitudeRef = latRef || 'N';
                exif.GPSLongitude = lonNum;
                exif.GPSLongitudeRef = lonRef || 'E';

                console.log('✅ GPS-Koordinaten aus Text-Format:', {
                  lat: latNum,
                  latRef: exif.GPSLatitudeRef,
                  lon: lonNum,
                  lonRef: exif.GPSLongitudeRef
                });

                return exif;
              }
            }

            // Standard EXIF Rational Format lesen (FALLBACK)
            console.log('Versuche Standard EXIF Rational Format...');
            for (let j = 0; j < gpsNumEntries; j++) {
              const entryOffset = gpsIFDOffsetActual + 2 + (j * 12);

              if (entryOffset + 12 > length) {
                console.log('GPS Eintrag ' + j + ' außerhalb der Datei');
                break;
              }

              const tag = dataView.getUint16(entryOffset, isBigEndian);
              const type = dataView.getUint16(entryOffset + 2, isBigEndian);
              const numValues = dataView.getUint32(entryOffset + 4, isBigEndian);

              let valueOffset = dataView.getUint32(entryOffset + 8, isBigEndian) + tiffStart;

              // Kleine Werte direkt im Entry
              if (numValues * 4 <= 4) {
                valueOffset = entryOffset + 8;
              }

              // GPS Latitude (Tag 0x0002) als RATIONAL
              if (tag === 0x0002 && type === 0x0005 && numValues === 3) {
                lat = [];
                for (let k = 0; k < 3; k++) {
                  const offset = valueOffset + (k * 8);
                  if (offset + 8 > length) break;
                  const numerator = dataView.getUint32(offset, isBigEndian);
                  const denominator = dataView.getUint32(offset + 4, isBigEndian);
                  lat.push([numerator, denominator]);
                }
                console.log('✅ GPS Latitude (Rational) gefunden:', lat);
              }

              // GPS Latitude Ref (Tag 0x0001)
              if (tag === 0x0001 && type === 0x0002) {
                const textLen = numValues - 1;
                latRef = '';
                for (let k = 0; k < textLen; k++) {
                  const charCode = dataView.getUint8(valueOffset + k);
                  if (charCode === 0) break;
                  latRef += String.fromCharCode(charCode);
                }
                console.log('✅ GPS Latitude Ref:', latRef);
              }

              // GPS Longitude (Tag 0x0004) als RATIONAL
              if (tag === 0x0004 && type === 0x0005 && numValues === 3) {
                lon = [];
                for (let k = 0; k < 3; k++) {
                  const offset = valueOffset + (k * 8);
                  if (offset + 8 > length) break;
                  const numerator = dataView.getUint32(offset, isBigEndian);
                  const denominator = dataView.getUint32(offset + 4, isBigEndian);
                  lon.push([numerator, denominator]);
                }
                console.log('✅ GPS Longitude (Rational) gefunden:', lon);
              }

              // GPS Longitude Ref (Tag 0x0003)
              if (tag === 0x0003 && type === 0x0002) {
                const textLen = numValues - 1;
                lonRef = '';
                for (let k = 0; k < textLen; k++) {
                  const charCode = dataView.getUint8(valueOffset + k);
                  if (charCode === 0) break;
                  lonRef += String.fromCharCode(charCode);
                }
                console.log('✅ GPS Longitude Ref:', lonRef);
              }
            }

            // Wenn wir Standard-Format haben
            if (lat && typeof lat !== 'string' && lon && typeof lon !== 'string') {
              exif.GPSLatitude = lat;
              exif.GPSLatitudeRef = latRef || 'N';
              exif.GPSLongitude = lon;
              exif.GPSLongitudeRef = lonRef || 'E';

              console.log('✅ GPS-Daten vollständig (Standard):', {
                lat,
                latRef: exif.GPSLatitudeRef,
                lon,
                lonRef: exif.GPSLongitudeRef
              });

              return exif;
            }
          } else {
            console.log('❌ Kein GPS IFD Pointer gefunden');
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

    if (!exifFound) {
      console.log('❌ Kein EXIF-Marker gefunden');
      return null;
    }

    if (!exif.GPSLatitude || !exif.GPSLongitude) {
      console.log('❌ Keine GPS-Daten in EXIF gefunden');
      return null;
    }

    console.log('=== EXIF Parsing erfolgreich ===');
    console.log('GPS-Daten:', {
      lat: exif.GPSLatitude,
      latRef: exif.GPSLatitudeRef,
      lon: exif.GPSLongitude,
      lonRef: exif.GPSLongitudeRef
    });

    return exif;
  } catch (error) {
    console.error('❌ Fehler beim Lesen der EXIF-Daten:', error);
    return null;
  }
}

/**
 * GPS-Koordinaten aus EXIF-Daten konvertieren
 * Unterstützt sowohl Standard-Rational-Arrays als Text-Format
 */
function convertDMSToDD(dms: number[][] | string, ref: string): number {
  // Wenn String ist, parsen
  if (typeof dms === 'string') {
    const parsed = parseTextCoordinate(dms);
    if (!parsed) {
      console.log('❌ Konnte Text-Koordinate nicht parsen:', dms);
      return 0;
    }

    const [deg, min, sec] = parsed;
    let dd = deg[0] / deg[1] + min[0] / min[1] + sec[0] / sec[1];

    if (ref === 'S' || ref === 'W') {
      dd = dd * -1;
    }

    console.log('✅ Konvertiert von Text:', dms, 'zu DD:', dd);
    return dd;
  }

  // Standard Rational-Array Format
  if (!dms || !Array.isArray(dms) || dms.length !== 3) {
    console.log('❌ Ungültiges DMS-Format:', dms);
    return 0;
  }

  const [degrees, minutes, seconds] = dms;
  let dd = degrees[0] / degrees[1] + minutes[0] / minutes[1] + seconds[0] / seconds[1];

  // Süd und West sind negativ
  if (ref === 'S' || ref === 'W') {
    dd = dd * -1;
  }

  return dd;
}

/**
 * GPS-Koordinaten aus einem Bild extrahieren
 * @param file - Das Bilddei-Objekt
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

        console.log('✅ GPS-Koordinaten:', { latitude, longitude });
        resolve({ latitude, longitude });
      } catch (error) {
        console.error('❌ Fehler beim Lesen der EXIF-Daten:', error);
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
      console.error('❌ Nominatim error:', data?.error);
      return null;
    }

    // Priorisierte Formatierung für Standort
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

    console.log('✅ Nominatim Ergebnis:', result);

    return result || null;
  } catch (error) {
    console.error('❌ Reverse Geocoding Fehler:', error);
    return null;
  }
}

/**
 * Vollständiger Prozess: GPS aus Bild extrahieren und Standort ermitteln
 * @param file - Das Bilddei-Objekt
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
    console.error('❌ Fehler bei der Standort-Ermittlung:', error);
    onProgress?.('❌ Fehler bei der Standort-Ermittlung');
    return null;
  }
}
