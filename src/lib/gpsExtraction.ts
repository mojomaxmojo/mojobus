/**
 * GPS Extraction Library
 * Extracts GPS coordinates from image EXIF data with smart fallbacks
 */

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface MediaFile {
  file: File;
  type: string;
}

/**
 * Parse EXIF GPS data from image file
 */
async function extractGPSFromImage(file: File): Promise<Coordinates | null> {
  // Check if it's an image file
  if (!file.type.startsWith('image/')) {
    return null;
  }

  try {
    // Create an image element to load the file
    const img = new Image();

    return new Promise((resolve) => {
      img.onload = async () => {
        try {
          // Create a canvas to access EXIF data
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0);

          // Try to get EXIF data using DataView
          const reader = new FileReader();
          reader.onload = (e) => {
            try {
              const arrayBuffer = e.target?.result as ArrayBuffer;
              const dataView = new DataView(arrayBuffer);
              const coords = parseExifData(dataView);
              resolve(coords);
            } catch (error) {
              console.warn('Failed to parse EXIF data:', error);
              resolve(null);
            }
          };
          reader.onerror = () => resolve(null);
          reader.readAsArrayBuffer(file);
        } catch (error) {
          console.warn('Failed to extract GPS:', error);
          resolve(null);
        }
      };

      img.onerror = () => resolve(null);
      img.src = URL.createObjectURL(file);
    });
  } catch (error) {
    console.warn('Error loading image for GPS extraction:', error);
    return null;
  }
}

/**
 * Parse EXIF data from DataView to extract GPS coordinates
 */
function parseExifData(dataView: DataView): Coordinates | null {
  try {
    // Look for EXIF marker (0xFFE1)
    let offset = 2;
    const length = dataView.getUint16(0);

    while (offset < length) {
      if (dataView.getUint8(offset) === 0xFF && dataView.getUint8(offset + 1) === 0xE1) {
        const exifOffset = offset + 4;
        const exifHeader = dataView.getUint32(exifOffset);

        if (exifHeader === 0x45786966) { // "Exif" string
          const tiffOffset = exifOffset + 6;
          const littleEndian = dataView.getUint16(tiffOffset) === 0x4949;

          // Get the offset to first IFD
          const firstIFDOffset = dataView.getUint32(tiffOffset + 4, littleEndian);

          // Check for GPS IFD
          const gpsIFDOffset = dataView.getUint32(tiffOffset + firstIFDOffset + 2, littleEndian);

          if (gpsIFDOffset !== 0) {
            return parseGPSTags(dataView, tiffOffset + gpsIFDOffset, littleEndian);
          }
        }
      }
      offset += 2 + dataView.getUint16(offset + 2);
    }
  } catch (error) {
    console.warn('Error parsing EXIF:', error);
  }

  return null;
}

/**
 * Parse GPS tags from EXIF data
 */
function parseGPSTags(dataView: DataView, offset: number, littleEndian: boolean): Coordinates | null {
  try {
    const numEntries = dataView.getUint16(offset, littleEndian);
    let lat = 0;
    let lon = 0;
    let latRef = 'N';
    let lonRef = 'E';

    for (let i = 0; i < numEntries; i++) {
      const entryOffset = offset + 2 + (i * 12);
      const tag = dataView.getUint16(entryOffset, littleEndian);
      const type = dataView.getUint16(entryOffset + 2, littleEndian);
      const count = dataView.getUint32(entryOffset + 4, littleEndian);
      const valueOffset = dataView.getUint32(entryOffset + 8, littleEndian);

      // GPS Latitude (tag 2)
      if (tag === 2 && type === 5 && count === 3) {
        const latValue = dataView.getUint32(valueOffset, littleEndian);
        const latMinute = dataView.getUint32(valueOffset + 4, littleEndian);
        const latSecond = dataView.getUint32(valueOffset + 8, littleEndian);
        lat = (latValue / latMinute) + (latMinute / 60) + (latSecond / 3600);
      }
      // GPS Latitude Ref (tag 1)
      else if (tag === 1 && type === 2 && count === 2) {
        latRef = String.fromCharCode(dataView.getUint8(valueOffset));
      }
      // GPS Longitude (tag 4)
      else if (tag === 4 && type === 5 && count === 3) {
        const lonValue = dataView.getUint32(valueOffset, littleEndian);
        const lonMinute = dataView.getUint32(valueOffset + 4, littleEndian);
        const lonSecond = dataView.getUint32(valueOffset + 8, littleEndian);
        lon = (lonValue / lonMinute) + (lonMinute / 60) + (lonSecond / 3600);
      }
      // GPS Longitude Ref (tag 3)
      else if (tag === 3 && type === 2 && count === 2) {
        lonRef = String.fromCharCode(dataView.getUint8(valueOffset));
      }
    }

    // Apply reference direction
    if (latRef === 'S') lat = -lat;
    if (lonRef === 'W') lon = -lon;

    if (lat !== 0 && lon !== 0) {
      return { latitude: lat, longitude: lon };
    }
  } catch (error) {
    console.warn('Error parsing GPS tags:', error);
  }

  return null;
}

/**
 * Geocode location string to coordinates (fallback method)
 * This uses a free geocoding service
 */
async function geocodeLocation(location: string, country?: string): Promise<Coordinates | null> {
  if (!location || location.length < 2) {
    return null;
  }

  try {
    // Build query with country if available
    const query = country ? `${location}, ${country}` : location;
    const encodedQuery = encodeURIComponent(query);

    // Use OpenStreetMap's Nominatim geocoding API (free, no key required)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodedQuery}&limit=1`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; MojoBus/1.0)',
        },
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (data && data.length > 0) {
      const lat = parseFloat(data[0].lat);
      const lon = parseFloat(data[0].lon);
      if (!isNaN(lat) && !isNaN(lon)) {
        return { latitude: lat, longitude: lon };
      }
    }
  } catch (error) {
    console.warn('Geocoding failed:', error);
  }

  return null;
}

/**
 * Extract coordinates with smart fallback
 * 1. First try to extract GPS from images (EXIF data)
 * 2. If no GPS in images, try geocoding the location string
 */
export async function extractCoordinatesWithSmartFallback(
  files: MediaFile[] | File[],
  location: string = '',
  selectedCountry: string = ''
): Promise<Coordinates | null> {
  // Step 1: Try to extract GPS from images
  for (const file of Array.from(files)) {
    const mediaFile = file instanceof File
      ? { file, type: file.type }
      : file;

    const coords = await extractGPSFromImage(mediaFile.file);
    if (coords) {
      console.log('GPS extracted from image:', coords);
      return coords;
    }
  }

  // Step 2: Fallback to geocoding location string
  if (location || selectedCountry) {
    console.log('No GPS in images, trying geocoding...');
    const coords = await geocodeLocation(location, selectedCountry);
    if (coords) {
      console.log('GPS geocoded from location:', coords);
      return coords;
    }
  }

  console.log('No GPS coordinates found');
  return null;
}
