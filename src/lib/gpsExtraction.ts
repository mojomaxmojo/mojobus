/**
 * Intelligent GPS Extraction and Location Parsing
 * Extracts GPS from image EXIF OR parses location string
 */

// Country coordinates (major cities)
const COUNTRY_COORDINATES: Record<string, [number, number]> = {
  portugal: [39.3999, -8.2245],      // Lisbon
  spanien: [40.4168, -3.7038],       // Madrid
  frankreich: [48.8566, 2.3522],     // Paris
  belgien: [50.8503, 4.3517],        // Brussels
  luxemburg: [49.8153, 6.1296],      // Luxembourg City
  deutschland: [52.5200, 13.4050],   // Berlin,
};

// City coordinates for Portugal
const PORTUGAL_CITIES: Record<string, [number, number]> = {
  'lisboa': [38.7223, -9.1393],
  'lisbon': [38.7223, -9.1393],
  'porto': [41.1579, -8.6291],
  'braga': [41.5455, -8.4265],
  'coimbra': [40.2034, -8.4103],
  'faro': [37.0194, -7.9304],
  'lagos': [37.0892, -8.2820],
  'albufeira': [37.0880, -8.2505],
  'algarve': [37.0880, -8.2505],
  'albufeira': [37.0900, -8.2395],
  'tavira': [36.7194, -27.7403],
  'evora': [38.5719, -7.9107],
  'praia': [37.0800, -8.7000],
  'praia dos tomates': [37.0800, -8.7000],
  'praia da luz': [37.0875, -8.8672],
  'sagres': [36.8831, -8.6762],
  'sines': [37.1870, -7.8975],
  'cascais': [38.6958, -9.4240],
  'sintra': [38.7923, -9.3853],
  'obidos': [39.3622, -9.2275],
  'ericeira': [39.0817, -9.1389],
  'peniche': [39.3509, -9.3010],
  'nazare': [39.6060, -9.0768],
  'figueira da foz': [39.2805, -9.2251],
  'aveiro': [40.6405, -8.6538],
  'viseu': [40.6609, -7.9136],
  'tomar': [39.6026, -8.4095],
  'funchal': [32.6329, -16.9098],
  'pontadelgada': [39.3543, -30.2215],
  'madeira': [32.6506, -16.9181],
};

// City coordinates for Spain
const SPAIN_CITIES: Record<string, [number, number]> = {
  'madrid': [40.4168, -3.7038],
  'barcelona': [41.3851, 2.1734],
  'sevilla': [37.3891, -5.9845],
  'valencia': [39.4699, -0.3763],
  'bilbao': [43.2630, -2.9350],
  'malaga': [36.7202, -4.4203],
  'granada': [37.1882, -3.6067],
  'cordoba': [37.8882, -4.7794],
  'zaragoza': [41.6488, -0.8891],
  'alicante': [38.3452, -0.4810],
  'pamplona': [42.8127, -1.6458],
  'santander': [43.4623, -3.8090],
  'gibraltar': [36.1434, -5.3516],
  'ronda': [36.7408, -5.1678],
  'marbella': [36.5098, -4.8879],
  'tarragona': [40.4374, 1.2441],
  'toledo': [39.8628, -4.0273],
  'salamanca': [40.9677, -5.6636],
  'segorovia': [37.5920, -2.1197],
  'benavente': [40.4079, -3.9941],
  'caceres': [39.4735, -6.3711],
  'huelva': [37.2605, -6.9456],
  'badajoz': [38.8795, -6.9459],
  'murcia': [37.9922, -1.1307],
  'cartagena': [37.5920, -0.9974],
  'valladolid': [41.6551, -4.7285],
  'leon': [42.5987, -5.5671],
  'oviedo': [43.3617, -5.8550],
  'santiago': [42.8785, -8.5448],
  'vigo': [42.2406, -8.7207],
  'pontevedra': [42.4298, -8.6447],
  'pamplona': [42.8127, -1.6458],
  'huesca': [42.1366, -0.4334],
  'teruel': [40.3228, -1.1307],
  'girona': [41.9794, 2.8210],
  'llc': [39.5499, -2.9905],
  'gijon': [43.5322, -5.6612],
};

// City coordinates for France
const FRANCE_CITIES: Record<string, [number, number]> = {
  'paris': [48.8566, 2.3522],
  'lyon': [45.7640, 4.8357],
  'marseille': [43.2965, 5.3698],
  'nice': [43.7102, 7.2620],
  'bordeaux': [44.8378, -0.5792],
  'toulouse': [43.6043, 1.4437],
  'nantes': [47.2184, -1.5536],
  'strasbourg': [48.5734, 7.7521],
  'lille': [50.6292, 3.0573],
  'rennes': [48.1135, -1.6773],
  'brest': [48.3904, -4.4861],
  'montpellier': [43.6102, 3.8767],
  'nimes': [43.8367, 4.3605],
  'avignon': [43.9493, 4.8055],
  'grenoble': [45.1885, 5.7245],
  'annecy': [45.8992, 6.1288],
  'le havre': [49.4944, 0.1079],
  'tours': [47.3940, 0.6848],
  'poitiers': [46.5821, 0.3430],
  'limoges': [45.8336, 1.2611],
  'clermont-ferrand': [45.7775, 3.0830],
  'perpignan': [42.6952, 2.8865],
  'calais': [50.9512, 1.8587],
  'dunkerque': [51.0314, 2.3776],
  'rouen': [49.4408, 1.0940],
  'reims': [49.2613, 4.0284],
  'metz': [49.1193, 6.1757],
  'nancy': [48.6930, 6.1834],
  'colmar': [48.0734, 7.2975],
  'mulhouse': [47.7509, 7.3359],
  'besancon': [47.2323, 6.0328],
  'dijon': [47.3222, 5.0415],
  'lille': [50.6292, 3.0573],
  'brest': [48.3904, -4.4861],
  'quimper': [47.9965, -4.0988],
  'rouen': [49.4408, 1.0940],
};

// City coordinates for Germany
const GERMANY_CITIES: Record<string, [number, number]> = {
  'berlin': [52.5200, 13.4050],
  'hamburg': [53.5511, 9.9937],
  'munich': [48.1351, 11.5820],
  'cologne': [50.9375, 6.9603],
  'köln': [50.9375, 6.9603],
  'frankfurt': [50.1109, 8.6821],
  'stuttgart': [48.7758, 9.1829],
  'dresden': [51.0509, 13.7373],
  'leipzig': [51.3396, 12.3731],
  'hannover': [52.3705, 9.7332],
  'bremen': [53.0758, 8.8084],
  'duesseldorf': [51.2217, 6.7762],
  'düsseldorf': [51.2217, 6.7762],
  'nuernberg': [49.4521, 11.0775],
  'bonn': [50.7374, 7.0998],
  'aachen': [50.7753, 6.0839],
  'kiel': [54.3223, 10.1358],
  'lübeck': [53.8689, 10.6872],
  'rostock': [54.0924, 12.0991],
  'schwerin': [52.5170, 13.3889],
  'potsdam': [52.3919, 13.0655],
  'brandenburg': [52.4088, 12.5445],
  'rügen': [54.4124, 13.6322],
  'stralsund': [54.3108, 13.5432],
  'wismar': [53.9156, 11.4600],
  'bremen': [53.0758, 8.8084],
  'eberswalde': [52.2407, 14.0811],
  'frankfurt': [50.1109, 8.6821],
  'bremen': [53.0758, 8.8084],
};

// City coordinates for Belgium
const BELGIUM_CITIES: Record<string, [number, number]> = {
  'brussels': [50.8503, 4.3517],
  'brüssel': [50.8503, 4.3517],
  'brugge': [51.2093, 3.2247],
  'bruges': [51.2093, 3.2247],
  'antwerpen': [51.2210, 4.3997],
  'gent': [51.0538, 3.7267],
  'liège': [50.6327, 5.5797],
  'charleroi': [50.4133, 4.4337],
  'brussels': [50.8503, 4.3517],
  'ostend': [51.2157, 2.9258],
  'ypres': [50.8513, 2.8868],
  'namur': [50.4664, 4.8682],
};

// City coordinates for Luxembourg
const LUXEMBOURG_CITIES: Record<string, [number, number]> = {
  'luxembourg city': [49.6153, 6.1296],
  'luxembourg': [49.6153, 6.1296],
  'lux': [49.6153, 6.1296],
  'esch-sur-alzette': [49.7996, 6.0948],
  'virton': [49.5304, 5.9290],
};

export interface GPSCoordinates {
  latitude: number;
  longitude: number;
}

/**
 * Parse location string to extract GPS coordinates
 * Examples:
 * - "Portugal, Praia dos Tomates" -> Praia dos Tomates coords
 * - "Spain, Barcelona" -> Barcelona coords
 * - "France, Paris" -> Paris coords
 * - "Berlin, Germany" -> Berlin coords
 * @param locationString - Location string from form
 * @param country - Country from form (optional)
 * @returns GPS coordinates or null
 */
export function parseLocationToGPS(locationString: string, country?: string): GPSCoordinates | null {
  if (!locationString || !locationString.trim()) {
    return null;
  }

  // Normalize: lowercase, remove special chars, trim
  const normalized = locationString.toLowerCase()
    .replace(/[.,\/\-]/g, ' ') // Replace punctuation with space
    .replace(/\s+/g, ' ') // Remove multiple spaces
    .trim();

  const parts = normalized.split(',').map(p => p.trim());

  // Try to find city name in location string
  for (const part of parts) {
    const cleanPart = part.replace(/\s+/g, ''); // Remove spaces for matching

    // Portugal cities
    if (PORTUGAL_CITIES[cleanPart] || PORTUGAL_CITIES[cleanPart.replace(/[ãáâàã]/g, 'a')]) {
      const coords = PORTUGAL_CITIES[cleanPart] || PORTUGAL_CITIES[cleanPart.replace(/[ãáâàã]/g, 'a')];
      return { latitude: coords[0], longitude: coords[1] };
    }

    // Spain cities
    if (SPAIN_CITIES[cleanPart] || SPAIN_CITIES[cleanPart.replace(/ñ/g, 'n')]) {
      const coords = SPAIN_CITIES[cleanPart] || SPAIN_CITIES[cleanPart.replace(/ñ/g, 'n')];
      return { latitude: coords[0], longitude: coords[1] };
    }

    // France cities
    if (FRANCE_CITIES[cleanPart]) {
      const coords = FRANCE_CITIES[cleanPart];
      return { latitude: coords[0], longitude: coords[1] };
    }

    // Germany cities
    if (GERMANY_CITIES[cleanPart]) {
      const coords = GERMANY_CITIES[cleanPart];
      return { latitude: coords[0], longitude: coords[1] };
    }

    // Belgium cities
    if (BELGIUM_CITIES[cleanPart]) {
      const coords = BELGIUM_CITIES[cleanPart];
      return { latitude: coords[0], longitude: coords[1] };
    }

    // Luxembourg cities
    if (LUXEMBOURG_CITIES[cleanPart]) {
      const coords = LUXEMBOURG_CITIES[cleanPart];
      return { latitude: coords[0], longitude: coords[1] };
    }
  }

  // Fallback: Use country coordinates if country is provided
  if (country) {
    const countryKey = Object.keys(COUNTRY_COORDINATES).find(
      (key) => key === country.toLowerCase() || key.includes(country.toLowerCase())
    );
    if (countryKey) {
      const coords = COUNTRY_COORDINATES[countryKey];
      return { latitude: coords[0], longitude: coords[1] };
    }
  }

  return null;
}

/**
 * Extract GPS coordinates from image file
 * @param file - Image file to extract GPS from
 * @returns GPS coordinates or null
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
 * Extract coordinates from first image with GPS, or fallback to location parsing, then country
 * Priority:
 * 1. GPS from image EXIF (highest priority)
 * 2. Parsed location string (e.g., "Portugal, Praia dos Tomates")
 * 3. Country coordinates (fallback)
 * @param files - Array of files
 * @param locationString - Location string from form (e.g., "Portugal, Praia dos Tomates")
 * @param country - Country code for fallback (e.g., "portugal")
 * @returns GPS coordinates or null
 */
export async function extractCoordinatesWithSmartFallback(
  files: File[],
  locationString?: string,
  country?: string
): Promise<GPSCoordinates | null> {
  // Priority 1: Try GPS from first image
  if (files.length > 0) {
    const firstImage = files.find(file => file.type.startsWith('image/'));
    if (firstImage) {
      const gps = await extractGPSFromImage(firstImage);
      if (gps) {
        console.log('✅ GPS from image EXIF:', gps);
        return gps;
      }
    }
  }

  // Priority 2: Try parsing location string
  if (locationString && locationString.trim()) {
    const parsedGPS = parseLocationToGPS(locationString, country);
    if (parsedGPS) {
      console.log('✅ GPS from location string:', locationString, '->', parsedGPS);
      return parsedGPS;
    }
  }

  // Priority 3: Fallback to country coordinates
  if (country) {
    const countryKey = Object.keys(COUNTRY_COORDINATES).find(
      (key) => key === country.toLowerCase() || key.includes(country.toLowerCase())
    );
    if (countryKey) {
      const coords = COUNTRY_COORDINATES[countryKey];
      const gps = { latitude: coords[0], longitude: coords[1] };
      console.log('✅ GPS from country:', country, '->', gps);
      return gps;
    }
  }

  return null;
}
