/**
 * GPX and KMZ Export for Google Earth Studio
 *
 * This module provides functions to export Nostr events (trips, places, notes)
 * as GPX and KMZ files optimized for Google Earth Studio and other mapping tools.
 *
 * GPX Format: GPS Exchange Format
 * - Standard XML format for GPS data
 * - Supports waypoints, tracks, and routes
 * - Compatible with Google Earth Studio, Google Earth Pro, and most mapping apps
 *
 * KMZ Format: Compressed KML for Google Earth
 * - ZIP archive containing KML files and images
 * - Includes 3D terrain, photo overlays, and detailed metadata
 * - Optimized for Google Earth Pro and Google Earth Studio
 */

import type { NostrEvent } from '@nostrify/nostrify';
import JSZip from 'jszip';

/**
 * GPS waypoint with metadata
 */
export interface GpsWaypoint {
  /** Latitude in decimal degrees */
  lat: number;
  /** Longitude in decimal degrees */
  lon: number;
  /** Altitude in meters (optional) */
  ele?: number;
  /** Timestamp in Unix epoch */
  time: number;
  /** Location name or description */
  name: string;
  /** Detailed description */
  description?: string;
  /** Image URL (if available) */
  image?: string;
  /** Category/type of waypoint */
  category?: string;
  /** Rating (1-5) */
  rating?: number;
  /** Original Nostr event ID */
  eventId: string;
  /** Event kind (1 = note, 30023 = article/place) */
  kind: number;
}

/**
 * GPX track segment with multiple waypoints
 */
export interface GpsTrack {
  /** Track name */
  name: string;
  /** Track description */
  description?: string;
  /** Ordered list of waypoints */
  waypoints: GpsWaypoint[];
  /** Start timestamp */
  startTime: number;
  /** End timestamp */
  endTime: number;
  /** Total distance in km */
  totalDistance?: number;
}

/**
 * GPX export configuration
 */
export interface GpxExportConfig {
  /** Include image metadata in waypoints */
  includeImages: boolean;
  /** Include elevation data (if available) */
  includeElevation: boolean;
  /** Simplify track by removing close waypoints (distance in km) */
  simplifyDistance?: number;
  /** Minimum time between waypoints (seconds) */
  minTimeBetween?: number;
}

/**
 * Default export configuration
 */
export const DEFAULT_GPX_CONFIG: GpxExportConfig = {
  includeImages: true,
  includeElevation: true,
  simplifyDistance: 0.1, // 100m minimum distance
  minTimeBetween: 60, // 1 minute minimum time
};

/**
 * Extract GPS waypoints from Nostr events
 *
 * @param events - Array of Nostr events (notes, articles, places)
 * @returns Array of GPS waypoints
 */
export function extractGpsWaypoints(events: NostrEvent[]): GpsWaypoint[] {
  const waypoints: GpsWaypoint[] = [];

  for (const event of events) {
    try {
      // Method 1: Extract location tag (format: "lat,lon" or "lat,lon,alt")
      let lat: number | undefined;
      let lon: number | undefined;
      let ele: number | undefined;

      const locationTag = event.tags.find(([name]) => name === 'location')?.[1];
      if (locationTag) {
        const coords = locationTag.match(/(-?\d+\.?\d*)[,\s](-?\d+\.?\d*)(?:[,\s](-?\d+\.?\d*))?/);
        if (coords) {
          lat = parseFloat(coords[1]);
          lon = parseFloat(coords[2]);
          ele = coords[3] ? parseFloat(coords[3]) : undefined;
        }
      }

      // Method 2: Extract separate "lat" and "lon" tags
      if (!lat || !lon) {
        const latTag = event.tags.find(([name]) => name === 'lat')?.[1];
        const lonTag = event.tags.find(([name]) => name === 'lon')?.[1];
        const altTag = event.tags.find(([name]) => name === 'alt')?.[1];

        if (latTag && lonTag) {
          lat = parseFloat(latTag);
          lon = parseFloat(lonTag);
          ele = altTag ? parseFloat(altTag) : undefined;
        }
      }

      // Method 3: Extract "latitude" and "longitude" tags
      if (!lat || !lon) {
        const latitudeTag = event.tags.find(([name]) => name === 'latitude')?.[1];
        const longitudeTag = event.tags.find(([name]) => name === 'longitude')?.[1];
        const altitudeTag = event.tags.find(([name]) => name === 'altitude')?.[1];

        if (latitudeTag && longitudeTag) {
          lat = parseFloat(latitudeTag);
          lon = parseFloat(longitudeTag);
          ele = altitudeTag ? parseFloat(altitudeTag) : undefined;
        }
      }

      // Method 4: Extract "coord" tag
      if (!lat || !lon) {
        const coordTag = event.tags.find(([name]) => name === 'coord')?.[1];
        if (coordTag) {
          const coords = coordTag.match(/(-?\d+\.?\d*)[,\s](-?\d+\.?\d*)(?:[,\s](-?\d+\.?\d*))?/);
          if (coords) {
            lat = parseFloat(coords[1]);
            lon = parseFloat(coords[2]);
            ele = coords[3] ? parseFloat(coords[3]) : undefined;
          }
        }
      }

      // Skip if no coordinates found
      if (!lat || !lon) continue;

      // Validate coordinates
      if (isNaN(lat) || isNaN(lon)) continue;
      if (Math.abs(lat) > 90 || Math.abs(lon) > 180) continue;

      // Extract metadata
      const titleTag = event.tags.find(([name]) => name === 'title')?.[1];
      const nameTag = event.tags.find(([name]) => name === 'name')?.[1];
      const summaryTag = event.tags.find(([name]) => name === 'summary')?.[1];
      const imageTag = event.tags.find(([name]) => name === 'image')?.[1];
      const typeTag = event.tags.find(([name]) => name === 'type')?.[1];
      const ratingTag = event.tags.find(([name]) => name === 'rating')?.[1];

      // Extract images from content
      const images = extractImagesFromEvent(event);
      const primaryImage = imageTag || (images.length > 0 ? images[0] : undefined);

      // Build description from content or summary
      let description = summaryTag || event.content || '';
      // Clean up HTML for GPX
      description = description
        .replace(/<[^>]+>/g, '') // Remove HTML tags
        .replace(/&nbsp;/g, ' ') // Replace &nbsp;
        .replace(/&amp;/g, '&') // Replace &amp;
        .substring(0, 500); // Limit length

      const waypoint: GpsWaypoint = {
        lat,
        lon,
        ele,
        time: event.created_at,
        name: titleTag || nameTag || `Location ${waypoints.length + 1}`,
        description: description || undefined,
        image: primaryImage || undefined,
        category: typeTag || 'unknown',
        rating: ratingTag ? parseInt(ratingTag) : undefined,
        eventId: event.id,
        kind: event.kind,
      };

      waypoints.push(waypoint);
    } catch (error) {
      console.error('[GPX Export] Error extracting waypoint from event:', event.id, error);
    }
  }

  // Sort by timestamp
  return waypoints.sort((a, b) => a.time - b.time);
}

/**
 * Extract image URLs from a Nostr event
 */
function extractImagesFromEvent(event: NostrEvent): string[] {
  const images: string[] = [];

  // Extract from imeta tags
  event.tags.forEach(tag => {
    if (tag[0] === 'imeta') {
      tag.forEach((item) => {
        if (item.startsWith('url ')) {
          images.push(item.substring(4));
        }
      });
    }
  });

  // Extract from content (Markdown-style images)
  const markdownImageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  let match;
  while ((match = markdownImageRegex.exec(event.content)) !== null) {
    images.push(match[2]);
  }

  // Extract raw URLs from content
  const urlRegex = /(https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp))/gi;
  const urlMatches = event.content.match(urlRegex);
  if (urlMatches) {
    images.push(...urlMatches);
  }

  return [...new Set(images)]; // Remove duplicates
}

/**
 * Simplify waypoints by removing close points
 *
 * @param waypoints - Original waypoints
 * @param minDistance - Minimum distance in km
 * @returns Simplified waypoints
 */
function simplifyWaypoints(waypoints: GpsWaypoint[], minDistance: number): GpsWaypoint[] {
  if (waypoints.length === 0) return [];

  const simplified: GpsWaypoint[] = [waypoints[0]];

  for (let i = 1; i < waypoints.length; i++) {
    const prev = simplified[simplified.length - 1];
    const current = waypoints[i];

    const distance = haversineDistance(
      prev.lat,
      prev.lon,
      current.lat,
      current.lon
    );

    if (distance >= minDistance) {
      simplified.push(current);
    }
  }

  return simplified;
}

/**
 * Filter waypoints by minimum time interval
 *
 * @param waypoints - Original waypoints
 * @param minSeconds - Minimum time in seconds
 * @returns Filtered waypoints
 */
function filterByTime(waypoints: GpsWaypoint[], minSeconds: number): GpsWaypoint[] {
  if (waypoints.length === 0) return [];

  const filtered: GpsWaypoint[] = [waypoints[0]];

  for (let i = 1; i < waypoints.length; i++) {
    const prev = filtered[filtered.length - 1];
    const current = waypoints[i];

    const timeDiff = current.time - prev.time;

    if (timeDiff >= minSeconds) {
      filtered.push(current);
    }
  }

  return filtered;
}

/**
 * Calculate total track distance in km
 */
function calculateTotalDistance(waypoints: GpsWaypoint[]): number {
  if (waypoints.length < 2) return 0;

  let total = 0;
  for (let i = 1; i < waypoints.length; i++) {
    total += haversineDistance(
      waypoints[i - 1].lat,
      waypoints[i - 1].lon,
      waypoints[i].lat,
      waypoints[i].lon
    );
  }

  return total;
}

/**
 * Create a GPX track from events
 *
 * @param events - Nostr events
 * @param trackName - Track name
 * @param config - Export configuration
 * @returns GPX track
 */
export function createGpsTrack(
  events: NostrEvent[],
  trackName: string,
  config: Partial<GpxExportConfig> = {}
): GpsTrack {
  const finalConfig = { ...DEFAULT_GPX_CONFIG, ...config };

  // Extract waypoints
  let waypoints = extractGpsWaypoints(events);

  // Simplify track
  if (finalConfig.simplifyDistance) {
    waypoints = simplifyWaypoints(waypoints, finalConfig.simplifyDistance);
  }

  // Filter by time
  if (finalConfig.minTimeBetween) {
    waypoints = filterByTime(waypoints, finalConfig.minTimeBetween);
  }

  // Calculate metadata
  const startTime = waypoints.length > 0 ? waypoints[0].time : 0;
  const endTime = waypoints.length > 0 ? waypoints[waypoints.length - 1].time : 0;
  const totalDistance = calculateTotalDistance(waypoints);

  return {
    name: trackName,
    waypoints,
    startTime,
    endTime,
    totalDistance,
  };
}

/**
 * Generate GPX XML string from GPS track
 *
 * @param track - GPS track
 * @param config - Export configuration
 * @returns GPX XML string
 */
export function generateGPX(track: GpsTrack, config: Partial<GpxExportConfig> = {}): string {
  const finalConfig = { ...DEFAULT_GPX_CONFIG, ...config };

  // Format timestamp to ISO 8601
  const formatTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toISOString();
  };

  // Build waypoints section
  const waypointsXml = track.waypoints
    .map((wp) => {
      let wpXml = `    <wpt lat="${wp.lat.toFixed(6)}" lon="${wp.lon.toFixed(6)}">\n`;
      wpXml += `      <name>${escapeXml(wp.name)}</name>\n`;
      if (wp.description) {
        wpXml += `      <desc>${escapeXml(wp.description)}</desc>\n`;
      }
      if (finalConfig.includeElevation && wp.ele !== undefined) {
        wpXml += `      <ele>${wp.ele.toFixed(2)}</ele>\n`;
      }
      wpXml += `      <time>${formatTime(wp.time)}</time>\n`;
      if (wp.image && finalConfig.includeImages) {
        wpXml += `      <link href="${escapeXml(wp.image)}">\n`;
        wpXml += `        <text>View Image</text>\n`;
        wpXml += `      </link>\n`;
      }
      wpXml += `    </wpt>\n`;
      return wpXml;
    })
    .join('');

  // Build track section
  let trackPointsXml = track.waypoints
    .map((wp) => {
      let tpXml = `        <trkpt lat="${wp.lat.toFixed(6)}" lon="${wp.lon.toFixed(6)}">\n`;
      if (finalConfig.includeElevation && wp.ele !== undefined) {
        tpXml += `          <ele>${wp.ele.toFixed(2)}</ele>\n`;
      }
      tpXml += `          <time>${formatTime(wp.time)}</time>\n`;
      if (wp.name) {
        tpXml += `          <name>${escapeXml(wp.name)}</name>\n`;
      }
      tpXml += `        </trkpt>\n`;
      return tpXml;
    })
    .join('');

  // Build complete GPX
  const gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="MojoBus GPS Export" xmlns="http://www.topografix.com/GPX/1/1"
     xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
     xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">

  <metadata>
    <name>${escapeXml(track.name)}</name>
    <desc>${escapeXml(track.description || `Track with ${track.waypoints.length} waypoints`)}</desc>
    <time>${formatTime(track.startTime)}</time>
    ${track.totalDistance !== undefined ? `<bounds minlat="${Math.min(...track.waypoints.map(wp => wp.lat)).toFixed(6)}" minlon="${Math.min(...track.waypoints.map(wp => wp.lon)).toFixed(6)}" maxlat="${Math.max(...track.waypoints.map(wp => wp.lat)).toFixed(6)}" maxlon="${Math.max(...track.waypoints.map(wp => wp.lon)).toFixed(6)}" />` : ''}
  </metadata>

  <trk>
    <name>${escapeXml(track.name)}</name>
    <desc>${escapeXml(track.description || `Track with ${track.waypoints.length} waypoints`)}</desc>
    <trkseg>
${trackPointsXml}    </trkseg>
  </trk>

  <wpt>
${waypointsXml}  </wpt>

</gpx>`;

  return gpx;
}

/**
 * Generate KMZ file (ZIP with KML and images)
 *
 * @param track - GPS track
 * @param config - Export configuration
 * @returns Promise resolving to KMZ file Blob
 */
export async function generateKMZ(
  track: GpsTrack,
  config: Partial<GpxExportConfig> = {}
): Promise<Blob> {
  const zip = new JSZip();

  // Generate KML
  const kml = generateKML(track, config);
  zip.file('doc.kml', kml);

  // Add images to KMZ
  if (config.includeImages !== false) {
    const imagesFolder = zip.folder('images');

    const imagePromises: Promise<void>[] = [];
    const imageMap = new Map<string, string>(); // URL -> filename

    for (let i = 0; i < track.waypoints.length; i++) {
      const wp = track.waypoints[i];
      if (wp.image && !imageMap.has(wp.image)) {
        const filename = `image_${i + 1}.jpg`;
        imageMap.set(wp.image, filename);

        // Fetch image and add to ZIP
        const fetchPromise = fetch(wp.image)
          .then(res => res.arrayBuffer())
          .then(buffer => {
            if (imagesFolder) {
              imagesFolder.file(filename, buffer);
            }
          })
          .catch(err => {
            console.error('[KMZ Export] Failed to fetch image:', wp.image, err);
          });

        imagePromises.push(fetchPromise);
      }
    }

    // Wait for all images to be fetched
    await Promise.all(imagePromises);
  }

  // Generate ZIP blob
  return await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
}

/**
 * Generate KML from GPS track
 */
function generateKML(track: GpsTrack, config: Partial<GpxExportConfig> = {}): string {
  const finalConfig = { ...DEFAULT_GPX_CONFIG, ...config };

  // Format timestamp
  const formatTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toISOString();
  };

  // Build placemarks
  const placemarks = track.waypoints
    .map((wp) => {
      let pm = `  <Placemark>\n`;
      pm += `    <name>${escapeXml(wp.name)}</name>\n`;
      if (wp.description) {
        pm += `    <description>${escapeXml(wp.description)}</description>\n`;
      }
      pm += `    <TimeStamp><when>${formatTime(wp.time)}</when></TimeStamp>\n`;
      pm += `    <Point><coordinates>${wp.lon},${wp.lat}${wp.ele !== undefined ? `,${wp.ele}` : ''}</coordinates></Point>\n`;
      pm += `  </Placemark>\n`;
      return pm;
    })
    .join('');

  // Build line string for track
  const coordinates = track.waypoints
    .map(wp => `${wp.lon},${wp.lat}${wp.ele !== undefined ? `,${wp.ele}` : ''}`)
    .join(' ');

  const kml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2" xmlns:gx="http://www.google.com/kml/ext/2.2">
  <Document>
    <name>${escapeXml(track.name)}</name>
    <description>${escapeXml(track.description || `Track with ${track.waypoints.length} waypoints`)}</description>

    <!-- Track Line -->
    <Placemark>
      <name>${escapeXml(track.name)} - Track</name>
      <LineString>
        <coordinates>${coordinates}</coordinates>
      </LineString>
    </Placemark>

    <!-- Waypoints -->
${placemarks}
  </Document>
</kml>`;

  return kml;
}

/**
 * Escape XML special characters
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Calculate Haversine distance between two coordinates (in km)
 */
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Convert degrees to radians
 */
function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Download GPX file
 *
 * @param gpxContent - GPX XML string
 * @param filename - Output filename
 */
export function downloadGPX(gpxContent: string, filename: string = 'track.gpx'): void {
  const blob = new Blob([gpxContent], { type: 'application/gpx+xml' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/**
 * Download KMZ file
 *
 * @param kmzBlob - KMZ file blob
 * @param filename - Output filename
 */
export function downloadKMZ(kmzBlob: Blob, filename: string = 'track.kmz'): void {
  const url = URL.createObjectURL(kmzBlob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/**
 * Export events to GPX file
 *
 * @param events - Nostr events to export
 * @param trackName - Track name
 * @param config - Export configuration
 * @returns GPX XML string
 */
export function exportToGPX(
  events: NostrEvent[],
  trackName: string,
  config?: Partial<GpxExportConfig>
): string {
  const track = createGpsTrack(events, trackName, config);
  return generateGPX(track, config);
}

/**
 * Export events to KMZ file
 *
 * @param events - Nostr events to export
 * @param trackName - Track name
 * @param config - Export configuration
 * @returns Promise resolving to KMZ Blob
 */
export async function exportToKMZ(
  events: NostrEvent[],
  trackName: string,
  config?: Partial<GpxExportConfig>
): Promise<Blob> {
  const track = createGpsTrack(events, trackName, config);
  return generateKMZ(track, config);
}
