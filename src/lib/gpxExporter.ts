/**
 * GPX Export Utility for Google Earth Studio
 * Generates GPX files with detailed metadata including images, posts, and timing
 */

import type { NostrEvent } from '@nostrify/nostrify';

export interface GPXWaypoint {
  latitude: number;
  longitude: number;
  elevation?: number;
  timestamp?: number;
  name?: string;
  description?: string;
  type?: string; // 'photo', 'post', 'location'
  imageUrls?: string[];
  postUrl?: string;
  tags?: string[];
  location?: string; // Human-readable location name
}

export interface GPXExportOptions {
  includeImages: boolean;
  includePosts: boolean;
  includeTimestamps: boolean;
  includeElevation: boolean;
}

/**
 * Extract GPS coordinates and metadata from Nostr events
 */
export function extractWaypointsFromEvent(
  event: NostrEvent,
  options: GPXExportOptions
): GPXWaypoint[] {
  const waypoints: GPXWaypoint[] = [];

  // Extract location tag
  const location = event.tags.find(([name]) => name === 'location')?.[1];

  // Extract images with GPS coordinates
  if (options.includeImages) {
    const imageTags = event.tags.filter(([name]) => name === 'image');

    imageTags.forEach(([, url, , lat, lon]) => {
      if (lat && lon) {
        waypoints.push({
          latitude: parseFloat(lat),
          longitude: parseFloat(lon),
          timestamp: event.created_at,
          type: 'photo',
          imageUrls: [url],
          name: location || event.tags.find(([name]) => name === 'title')?.[1] || 'Photo',
          description: options.includePosts ? event.content : undefined,
          postUrl: getEventUrl(event),
          location,
          tags: extractHashtags(event)
        });
      }
    });
  }

  // Extract GPS tags (direct GPS coordinates)
  const gpsTags = event.tags.filter(([name]) => name === 'g');
  gpsTags.forEach(([, lat, lon]) => {
    if (lat && lon && !waypoints.some(wp =>
      Math.abs(wp.latitude - parseFloat(lat)) < 0.0001 &&
      Math.abs(wp.longitude - parseFloat(lon)) < 0.0001
    )) {
      waypoints.push({
        latitude: parseFloat(lat),
        longitude: parseFloat(lon),
        timestamp: event.created_at,
        type: 'location',
        name: location || event.tags.find(([name]) => name === 'title')?.[1] || 'Location',
        description: options.includePosts ? event.content : undefined,
        postUrl: getEventUrl(event),
        location,
        tags: extractHashtags(event)
      });
    }
  });

  return waypoints;
}

/**
 * Extract hashtags from event
 */
function extractHashtags(event: NostrEvent): string[] {
  return event.tags
    .filter(([name]) => name === 't')
    .map(([, tag]) => tag)
    .filter(Boolean);
}

/**
 * Generate a complete GPX file from multiple events
 */
export function generateGPX(
  tripName: string,
  events: NostrEvent[],
  options: GPXExportOptions = {
    includeImages: true,
    includePosts: true,
    includeTimestamps: true,
    includeElevation: false
  }
): string {
  const waypoints: GPXWaypoint[] = [];

  // Collect all waypoints from events
  events.forEach(event => {
    waypoints.push(...extractWaypointsFromEvent(event, options));
  });

  // Sort by timestamp
  waypoints.sort((a, b) => {
    if (!a.timestamp) return 1;
    if (!b.timestamp) return -1;
    return a.timestamp - b.timestamp;
  });

  const now = new Date();
  const author = events[0]?.pubkey || '';

  const header = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1"
     xmlns="http://www.topografix.com/GPX/1/1"
     xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
     xsi:schemaLocation="http://www.topografix.com/GPX/1/1
     http://www.topografix.com/GPX/1/1/gpx.xsd"
     xmlns:gpxtp="http://www.garmin.com/xmlschemas/TrackPointExtension/v1"
     xmlns:gpxx="http://www.garmin.com/xmlschemas/TrackStatsExtension/v1">
  <metadata>
    <name>${escapeXML(tripName)}</name>
    <desc>Exported from MojoBus</desc>
    <author>
      <name>MojoBus</name>
      <link href="https://mojobus.org">
        <text>MojoBus Website</text>
      </link>
    </author>
    <copyright author="MojoBus">
      <year>${now.getFullYear()}</year>
      <license>CC BY 4.0</license>
    </copyright>
    <time>${now.toISOString()}</time>
    ${waypoints.length > 0 ? `
    <bounds minlat="${Math.min(...waypoints.map(w => w.latitude)).toFixed(6)}"
            minlon="${Math.min(...waypoints.map(w => w.longitude)).toFixed(6)}"
            maxlat="${Math.max(...waypoints.map(w => w.latitude)).toFixed(6)}"
            maxlon="${Math.max(...waypoints.map(w => w.longitude)).toFixed(6)}"/>` : ''}
  </metadata>`;

  // Create track points
  const trackPoints = waypoints.map(wp => {
    const timeTag = wp.timestamp && options.includeTimestamps
      ? `      <time>${new Date(wp.timestamp * 1000).toISOString()}</time>`
      : '';

    const elevationTag = wp.elevation && options.includeElevation
      ? `      <ele>${wp.elevation.toFixed(2)}</ele>`
      : '';

    const nameTag = wp.name ? `      <name>${escapeXML(wp.name)}</name>` : '';
    const descTag = wp.description ? `      <desc>${escapeXML(wp.description)}</desc>` : '';
    const typeTag = wp.type ? `      <type>${escapeXML(wp.type)}</type>` : '';

    // Add image links
    const linkTags = (wp.imageUrls || []).map(url =>
      `      <link href="${escapeXML(url)}">
        <text>${escapeXML(wp.name || 'Photo')}</text>
      </link>`
    ).join('\n');

    // Add post link
    const postLinkTag = wp.postUrl
      ? `      <link href="${escapeXML(wp.postUrl)}">
        <text>View Post</text>
      </link>`
      : '';

    // Add tags as keywords
    const keywordsTag = wp.tags && wp.tags.length > 0
      ? `      <keywords>${wp.tags.map(t => escapeXML(t)).join(', ')}</keywords>`
      : '';

    return `    <trkpt lat="${wp.latitude.toFixed(6)}" lon="${wp.longitude.toFixed(6)}">
${timeTag}
${elevationTag}
${nameTag}
${descTag}
${typeTag}
${linkTags}
${postLinkTag}
${keywordsTag}
    </trkpt>`;
  }).join('\n');

  const trackSection = `  <trk>
    <name>${escapeXML(tripName)}</name>
    <trkseg>
${trackPoints}
    </trkseg>
  </trk>`;

  // Create waypoints for significant locations
  const waypointsSection = waypoints.filter(wp => wp.type !== 'photo').map(wp => {
    const timeTag = wp.timestamp && options.includeTimestamps
      ? `    <time>${new Date(wp.timestamp * 1000).toISOString()}</time>`
      : '';

    const elevationTag = wp.elevation && options.includeElevation
      ? `    <ele>${wp.elevation.toFixed(2)}</ele>`
      : '';

    const nameTag = wp.name ? `    <name>${escapeXML(wp.name)}</name>` : '';
    const descTag = wp.description ? `    <desc>${escapeXML(wp.description)}</desc>` : '';
    const typeTag = wp.type ? `    <sym>${getGPXSymbol(wp.type)}</sym>` : '';

    const linkTags = (wp.imageUrls || []).map(url =>
      `    <link href="${escapeXML(url)}">
      <text>${escapeXML(wp.name || 'Photo')}</text>
    </link>`
    ).join('\n');

    return `  <wpt lat="${wp.latitude.toFixed(6)}" lon="${wp.longitude.toFixed(6)}">
${timeTag}
${elevationTag}
${nameTag}
${descTag}
${typeTag}
${linkTags}
  </wpt>`;
  }).join('\n');

  const footer = `</gpx>`;

  return header + '\n' + trackSection + '\n' + waypointsSection + '\n' + footer;
}

/**
 * Get GPX symbol name based on type
 */
function getGPXSymbol(type?: string): string {
  const symbolMap: Record<string, string> = {
    'photo': 'Photo',
    'post': 'Flag, Blue',
    'location': 'Waypoint',
    'camping': 'Campground',
    'beach': 'Beach',
    'mountain': 'Mountain',
    'restaurant': 'Restaurant',
    'hotel': 'Lodging',
    'fuel': 'Gas Station',
    'shop': 'Store',
  };

  return symbolMap[type || ''] || 'Waypoint';
}

/**
 * Get URL for Nostr event
 */
function getEventUrl(event: NostrEvent): string {
  const { nip19 } = require('nostr-tools');
  const naddr = nip19.naddrEncode({
    kind: event.kind,
    pubkey: event.pubkey,
    identifier: event.tags.find(([name]) => name === 'd')?.[1] || '',
  });
  return `https://mojobus.org/${event.kind === 30023 ? 'article' : event.kind === 30024 ? 'story' : 'note'}/${naddr}`;
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
 * Download GPX file
 */
export function downloadGPX(gpxContent: string, filename: string): void {
  const blob = new Blob([gpxContent], { type: 'application/gpx+xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.gpx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export events to GPX
 */
export async function exportEventsToGPX(
  events: NostrEvent[],
  options: GPXExportOptions = {
    includeImages: true,
    includePosts: true,
    includeTimestamps: true,
    includeElevation: false
  }
): Promise<void> {
  const tripName = `MojoBus-Export-${new Date().toISOString().split('T')[0]}`;
  const tripId = `mojobus-export-${Date.now()}`;

  // Generate GPX
  const gpx = generateGPX(tripName, events, options);

  // Download
  const sanitizedFilename = tripId.replace(/[^a-z0-9]/gi, '_');
  downloadGPX(gpx, sanitizedFilename);
}
