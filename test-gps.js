// Quick GPS Extraction Test
import exifr from 'exifr';
import { extractGpsFromImage } from './src/lib/gpsExtraction.js';

async function testGps() {
  const filePath = '/tmp/2026-02-10_10.14.16.jpg';

  console.log('==========================================');
  console.log('🔍 GPS Extraction Test');
  console.log('==========================================');
  console.log('');
  console.log('Datei:', filePath);

  try {
    // Create File object
    const fs = require('fs');
    const stats = fs.statSync(filePath);
    const buffer = fs.readFileSync(filePath);
    const file = new File([buffer], 'test.jpg', { type: 'image/jpeg' });

    console.log('Größe:', (stats.size / 1024 / 1024).toFixed(2), 'MB');
    console.log('');

    // Test 1: Direct exifr extraction
    console.log('------------------------------------------');
    console.log('📍 Test 1: Direct exifr extraction');
    console.log('------------------------------------------');
    const exifData = await exifr.parse(filePath, ['GPSLatitude', 'GPSLongitude', 'GPSAltitude', 'GPSLatitudeRef', 'GPSLongitudeRef']);
    console.log('EXIF Data:', exifData);
    console.log('');

    // Test 2: Project GPS extraction function
    console.log('------------------------------------------');
    console.log('📍 Test 2: Project GPS extraction');
    console.log('------------------------------------------');
    const gpsData = await extractGpsFromImage(file);
    console.log('GPS Data:', gpsData);
    console.log('');

    // Test 3: Check all EXIF tags
    console.log('------------------------------------------');
    console.log('📍 Test 3: All EXIF tags');
    console.log('------------------------------------------');
    const allExif = await exifr.parse(filePath);
    const gpsTags = Object.entries(allExif).filter(([key]) => key.includes('GPS'));
    console.log('GPS-Tags:', gpsTags);
    console.log('');

    // Summary
    console.log('==========================================');
    if (gpsData) {
      console.log('✅ GPS gefunden!');
      console.log('   Breitengrad:', gpsData.latitude);
      console.log('   Längengrad:', gpsData.longitude);
      console.log('   Höhe:', gpsData.altitude || 'N/A');
      console.log('   Genauigkeit:', gpsData.precision);
    } else {
      console.log('❌ Keine GPS-Informationen gefunden!');
    }
    console.log('==========================================');
  } catch (error) {
    console.error('❌ Fehler:', error.message);
    console.error(error);
  }
}

testGps();
