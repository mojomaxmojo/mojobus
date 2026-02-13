/**
 * KMZ Export Utility for Google Earth Studio/Pro
 * Creates KMZ files (ZIP archives with KML + images)
 */

import JSZip from 'jszip';
import type { NostrEvent } from '@nostrify/nostrify';
import { generateGPX, type GPXExportOptions } from './gpxExporter';

export interface KMZExportOptions extends GPXExportOptions {
  includeFullResImages: boolean; // Include original high-res images
  includeThumbnails: boolean;    // Include thumbnails
  maxImageCount: number;          // Max images to include (to keep file size manageable)
}

/**
 * Download image as Blob
 */
async function downloadImageAsBlob(url: string): Promise<Blob | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    return await response.blob();
  } catch (error) {
    console.error('Error downloading image:', url, error);
    return null;
  }
}

/**
 * Generate KML file from waypoints
 */
function generateKML(
  tripName: string,
  events: NostrEvent[],
  imageFiles: string[],
  options: KMZExportOptions
): string {
  // Collect all waypoints from events
  const waypoints: any[] = [];
  events.forEach(event => {
    // Extract images with GPS
    const imageTags = event.tags.filter(([name]) => name === 'image');
    imageTags.forEach(([, url, , lat, lon]) => {
      if (lat && lon && options.includeImages) {
        waypoints.push({
          latitude: parseFloat(lat),
          longitude: parseFloat(lon),
          timestamp: event.created_at,
          type: 'photo',
          imageUrls: [url],
          name: event.tags.find(([name]) => name === 'title')?.[1] || 'Photo',
          description: options.includePosts ? event.content : undefined,
          location: event.tags.find(([name]) => name === 'location')?.[1]
        });
      }
    });

    // Extract GPS tags
    const gpsTags = event.tags.filter(([name]) => name === 'g');
    gpsTags.forEach(([, lat, lon]) => {
      if (lat && lon) {
        waypoints.push({
          latitude: parseFloat(lat),
          longitude: parseFloat(lon),
          timestamp: event.created_at,
          type: 'location',
          name: event.tags.find(([name]) => name === 'title')?.[1] || 'Location',
          description: options.includePosts ? event.content : undefined,
          location: event.tags.find(([name]) => name === 'location')?.[1]
        });
      }
    });
  });

  // Sort by timestamp
  waypoints.sort((a, b) => {
    if (!a.timestamp) return 1;
    if (!b.timestamp) return -1;
    return a.timestamp - b.timestamp;
  });

  const now = new Date();

  // Style definitions
  const styles = `
    <Style id="track-style">
      <LineStyle>
        <color>ff0891b2</color>
        <width>4</width>
      </LineStyle>
      <PolyStyle>
        <color>00000000</color>
      </PolyStyle>
    </Style>
    <Style id="photo-style">
      <IconStyle>
        <scale>0.6</scale>
        <Icon>
          <href>http://maps.google.com/mapfiles/kml/pal3/icon21.png</href>
        </Icon>
      </IconStyle>
    </Style>
    <Style id="location-style">
      <IconStyle>
        <scale>0.8</scale>
        <Icon>
          <href>http://maps.google.com/mapfiles/kml/pal3/icon32.png</href>
        </Icon>
      </IconStyle>
    </Style>`;

  // Create track line string
  const coordinates = waypoints.map(wp =>
    `${wp.longitude.toFixed(6)},${wp.latitude.toFixed(6)},${0}`
  ).join(' ');

  const trackPlacemark = `
    <Placemark>
      <name>${escapeXML(tripName)} - Route</name>
      <styleUrl>#track-style</styleUrl>
      <LineString>
        <coordinates>${coordinates}</coordinates>
      </LineString>
    </Placemark>`;

  // Create photo placemarks with overlays
  const photoPlacemarks = waypoints
    .filter(wp => wp.type === 'photo' && wp.imageUrls && wp.imageUrls.length > 0)
    .slice(0, options.maxImageCount)
    .map((wp, index) => {
      const imageUrl = wp.imageUrls![0];
      const filename = `photos/photo_${index + 1}.jpg`;

      // Ground overlay for photo (stretched on terrain)
      const groundOverlay = `
    <GroundOverlay>
      <name>${escapeXML(wp.name || `Photo ${index + 1}`)}</name>
      <description>${escapeXML(wp.description || '')}</description>
      <TimeStamp>
        <when>${wp.timestamp ? new Date(wp.timestamp * 1000).toISOString() : now.toISOString()}</when>
      </TimeStamp>
      <Icon>
        <href>files/${filename}</href>
      </Icon>
      <LatLonBox>
        <north>${(wp.latitude + 0.001).toFixed(6)}</north>
        <south>${(wp.latitude - 0.001).toFixed(6)}</south>
        <east>${(wp.longitude + 0.001).toFixed(6)}</east>
        <west>${(wp.longitude - 0.001).toFixed(6)}</west>
      </LatLonBox>
    </GroundOverlay>`;

      // Point placemark for photo location
      const pointPlacemark = `
    <Placemark>
      <name>${escapeXML(wp.name || `Photo ${index + 1}`)}</name>
      <description><![CDATA[
        ${wp.description || ''}
        ${wp.location ? `<p><strong>Location:</strong> ${escapeXML(wp.location)}</p>` : ''}
        <br/><br/>
        <img src="files/${filename}" width="400" />
      ]]></description>
      <styleUrl>#photo-style</styleUrl>
      <TimeStamp>
        <when>${wp.timestamp ? new Date(wp.timestamp * 1000).toISOString() : now.toISOString()}</when>
      </TimeStamp>
      <Point>
        <coordinates>${wp.longitude.toFixed(6)},${wp.latitude.toFixed(6)},0</coordinates>
      </Point>
    </Placemark>`;

      return groundOverlay + pointPlacemark;
    }).join('\n');

  // Create location placemarks
  const locationPlacemarks = waypoints
    .filter(wp => wp.type === 'location')
    .map(wp => {
      const timeTag = wp.timestamp
        ? `<TimeStamp><when>${new Date(wp.timestamp * 1000).toISOString()}</when></TimeStamp>`
        : '';

      return `
    <Placemark>
      <name>${escapeXML(wp.name || 'Location')}</name>
      <description>${escapeXML(wp.description || '')}</description>
      ${wp.location ? `<description>${escapeXML(wp.location)}</description>` : ''}
      <styleUrl>#location-style</styleUrl>
      ${timeTag}
      <Point>
        <coordinates>${wp.longitude.toFixed(6)},${wp.latitude.toFixed(6)},0</coordinates>
      </Point>
    </Placemark>`;
    }).join('\n');

  // Build complete KML
  const kml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2" xmlns:gx="http://www.google.com/kml/ext/2.2">
  <Document>
    <name>${escapeXML(tripName)}</name>
    <description>Exported from MojoBus</description>
    <open>1</open>
    <Snippet maxLines="1">MojoBus Export</Snippet>

${styles}

    <!-- Track -->
${trackPlacemark}

    <!-- Photos -->
${photoPlacemarks}

    <!-- Locations -->
${locationPlacemarks}

  </Document>
</kml>`;

  return kml;
}

/**
 * Escape XML special characters
 */
function escapeXML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Download KMZ file
 */
function downloadKMZ(zip: JSZip, filename: string): void {
  zip.generateAsync({ type: 'blob', compression: 'DEFLATE' })
    .then(function(content) {
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.kmz`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    });
}

/**
 * Export events to KMZ with photos
 */
export async function exportEventsToKMZ(
  events: NostrEvent[],
  options: KMZExportOptions = {
    includeImages: true,
    includePosts: true,
    includeTimestamps: true,
    includeElevation: false,
    includeFullResImages: false, // Use smaller images by default
    includeThumbnails: true,
    maxImageCount: 50
  }
): Promise<void> {
  const tripName = `MojoBus-Export-${new Date().toISOString().split('T')[0]}`;
  const tripId = `mojobus-export-${Date.now()}`;
  const sanitizedFilename = tripId.replace(/[^a-z0-9]/gi, '_');

  const zip = new JSZip();

  // Create folders
  const filesFolder = zip.folder('files');
  const photosFolder = filesFolder?.folder('photos');
  const gpxFolder = zip.folder('gpx');

  // Collect unique image URLs
  const imageUrls = new Set<string>();
  events.forEach(event => {
    const imageTags = event.tags.filter(([name]) => name === 'image');
    imageTags.forEach(([, url]) => {
      if (options.includeImages) {
        imageUrls.add(url);
      }
    });
  });

  // Convert Set to Array and limit
  const limitedImageUrls = Array.from(imageUrls).slice(0, options.maxImageCount);

  // Download and add images to ZIP
  if (options.includeImages && photosFolder && limitedImageUrls.length > 0) {
    console.log(`📸 Downloading ${limitedImageUrls.length} images for KMZ export...`);

    const imagePromises = limitedImageUrls.map(async (url, index) => {
      try {
        const blob = await downloadImageAsBlob(url);
        if (blob) {
          // Resize if not including full resolution
          if (!options.includeFullResImages) {
            const resized = await resizeImage(blob, 1200, 800);
            photosFolder.file(`photo_${index + 1}.jpg`, resized);
          } else {
            photosFolder.file(`photo_${index + 1}.jpg`, blob);
          }
          console.log(`✅ Downloaded image ${index + 1}/${limitedImageUrls.length}`);
        }
      } catch (error) {
        console.error(`❌ Failed to download image ${index + 1}:`, url);
      }
    });

    await Promise.all(imagePromises);
  }

  // Generate and add KML file
  const kml = generateKML(tripName, events, limitedImageUrls, options);
  zip.file('doc.kml', kml);

  // Generate and add GPX file (for Google Earth Studio)
  const gpx = generateGPX(tripName, events, {
    includeImages: options.includeImages,
    includePosts: options.includePosts,
    includeTimestamps: options.includeTimestamps,
    includeElevation: options.includeElevation
  });
  gpxFolder?.file('route.gpx', gpx);

  // Add README file
  const readme = `# ${tripName} - KMZ Export

Exported from MojoBus (${new Date().toLocaleDateString()})

## Files in this KMZ:

- **doc.kml**: Main KML file for Google Earth Pro/Desktop
- **gpx/route.gpx**: GPX file for Google Earth Studio
- **files/photos/**: Image files referenced in KML

## How to use:

### Google Earth Studio (Web):
1. Open https://earthstudio.google.com
2. Create new project
3. Import GPX: gpx/route.gpx
4. Style and animate your video
5. Export as MP4

### Google Earth Pro (Desktop):
1. Download Google Earth Pro (free)
2. File > Open > Select this KMZ file
3. View 3D terrain and photos
4. Tools > Movie Maker to record

## Notes:

- ${limitedImageUrls.length} photos included
- ${events.length} posts/articles included
- Images resized to max 1200x800 for file size optimization

---
Generated by MojoBus
https://mojobus.org
`;

  zip.file('README.txt', readme);

  // Download ZIP
  downloadKMZ(zip, sanitizedFilename);
  console.log('🎉 KMZ export complete!');
}

/**
 * Resize image to target dimensions
 */
async function resizeImage(blob: Blob, maxWidth: number, maxHeight: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);

    img.onload = () => {
      URL.revokeObjectURL(url);

      // Calculate new dimensions
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = (maxWidth / width) * height;
        width = maxWidth;
      }

      if (height > maxHeight) {
        width = (maxHeight / height) * width;
        height = maxHeight;
      }

      // Create canvas and resize
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);

      // Convert to blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to convert canvas to blob'));
          }
        },
        'image/jpeg',
        0.85
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}
