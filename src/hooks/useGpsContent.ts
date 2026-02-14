/**
 * useGpsContent Hook
 *
 * Loads Nostr events with GPS coordinates from /veroeffentlichen
 * Optimized for performance with single query and caching
 */

import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@/hooks/useNostr';
import { DEFAULT_CACHE_CONFIG } from '@/config/cache';
import type { NostrEvent } from '@nostrify/nostrify';

/**
 * Map marker interface
 * Represents a GPS-enabled post on map
 */
export interface MapMarker {
  /** Event ID */
  id: string;
  /** Latitude in decimal degrees */
  lat: number;
  /** Longitude in decimal degrees */
  lon: number;
  /** Content title (first line or summary) */
  title: string;
  /** Content type */
  type: 'media' | 'note' | 'place' | 'article';
  /** Event kind */
  kind: number;
  /** Author pubkey */
  author: string;
  /** Event created timestamp */
  createdAt: number;
  /** First image URL (if available) */
  image?: string;
  /** Location tag value */
  location?: string;
  /** GPS source (detected from image or manual) */
  gpsSource?: 'detected' | 'manual';
  /** Summary from content */
  summary?: string;
  /** Full event object */
  event: NostrEvent;
}

/**
 * Check if event has required GPS tags
 */
function hasGpsTags(event: NostrEvent): boolean {
  const hasLat = event.tags.some(([name]) => name === 'gps_lat');
  const hasLon = event.tags.some(([name]) => name === 'gps_lon');
  return hasLat && hasLon;
}

/**
 * Determine content type from event tags
 */
function determineContentType(event: NostrEvent): MapMarker['type'] {
  const typeTag = event.tags.find(([name]) => name === 'type')?.[1];
  const mediaTag = event.tags.some(([name, value]) => name === 't' && value === 'media');
  const placeTag = event.tags.some(([name, value]) => name === 't' && ['place', 'places'].includes(value));
  const articleTag = event.tags.some(([name, value]) => name === 't' && ['artikel', 'article'].includes(value));
  const noteTag = event.tags.some(([name, value]) => name === 't' && ['note', 'notiz'].includes(value));

  // Check in order of specificity
  if (typeTag === 'place' || placeTag) return 'place';
  if (typeTag === 'media' || mediaTag) return 'media';
  if (event.kind === 30023 && !placeTag && (articleTag || !noteTag)) return 'article';
  if (event.kind === 1 || noteTag) return 'note';

  // Default to note if unsure
  return 'note';
}

/**
 * Extract GPS coordinates from event tags
 */
function extractGpsCoordinates(event: NostrEvent): { lat: number; lon: number } | null {
  const latStr = event.tags.find(([name]) => name === 'gps_lat')?.[1];
  const lonStr = event.tags.find(([name]) => name === 'gps_lon')?.[1];

  if (!latStr || !lonStr) return null;

  const lat = parseFloat(latStr);
  const lon = parseFloat(lonStr);

  // Validate coordinates
  if (isNaN(lat) || isNaN(lon)) return null;
  if (lat < -90 || lat > 90) return null;
  if (lon < -180 || lon > 180) return null;

  return { lat, lon };
}

/**
 * Validate event is from /veroeffentlichen
 * Checks for mojobus tag or specific content types
 */
function isValidPublishedEvent(event: NostrEvent): boolean {
  // Must have GPS tags (already checked before calling)
  if (!hasGpsTags(event)) return false;

  // Must have content
  if (!event.content || event.content.trim().length === 0) return false;

  // Check for mojobus tag (mandatory for /veroeffentlichen)
  const hasMojobusTag = event.tags.some(([name, value]) => name === 't' && value === 'mojobus');
  if (hasMojobusTag) return true;

  // Also allow if it has media, note, or place tags (backward compatibility)
  const hasMediaTag = event.tags.some(([name, value]) => name === 't' && value === 'media');
  const hasNoteTag = event.tags.some(([name, value]) => name === 't' && ['note', 'notiz'].includes(value));
  const hasPlaceTag = event.tags.some(([name, value]) => name === 't' && ['place', 'places'].includes(value));
  const hasArticleTag = event.tags.some(([name, value]) => name === 't' && ['artikel', 'article'].includes(value));

  return hasMediaTag || hasNoteTag || hasPlaceTag || hasArticleTag;
}

/**
 * Extract GPS source
 */
function getGpsSource(event: NostrEvent): 'detected' | 'manual' | undefined {
  return event.tags.find(([name]) => name === 'gps_source')?.[1] as 'detected' | 'manual' | undefined;
}

/**
 * Extract summary from content (first non-empty line after title)
 */
function extractSummary(content: string, title: string): string | undefined {
  const lines = content.split('\n').filter(line => line.trim().length > 0);
  // Skip first line (title)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line && line !== title) {
      return line.substring(0, 200); // Limit to 200 chars
    }
  }
  return undefined;
}

/**
 * Parse Nostr event to MapMarker
 */
function parseEventToMarker(event: NostrEvent): MapMarker | null {
  if (!isValidPublishedEvent(event)) return null;

  const coords = extractGpsCoordinates(event);
  if (!coords) return null;

  // Extract title from content or title tag
  let title = '';
  const titleTag = event.tags.find(([name]) => name === 'title')?.[1];
  if (titleTag) {
    title = titleTag;
  } else {
    // Use first line of content
    const firstLine = event.content.split('\n')[0].trim();
    title = firstLine.substring(0, 50); // Limit to 50 chars
  }

  // Extract first image from tags or content
  let image = event.tags.find(([name]) => name === 'image')?.[1];

  // If no image tag, try to extract from content
  if (!image) {
    const urlRegex = /(https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp))/i;
    const match = event.content.match(urlRegex);
    if (match) {
      image = match[1];
    }
  }

  // Extract location
  const location = event.tags.find(([name]) => name === 'location')?.[1];

  // Extract GPS source
  const gpsSource = getGpsSource(event);

  // Extract summary
  const summary = extractSummary(event.content, title);

  return {
    id: event.id,
    lat: coords.lat,
    lon: coords.lon,
    title,
    type: determineContentType(event),
    kind: event.kind,
    author: event.pubkey,
    createdAt: event.created_at,
    image,
    location,
    gpsSource,
    summary,
    event,
  };
}

/**
 * Hook to load GPS-enabled content
 * Uses single query for performance with long cache time
 */
export function useGpsContent() {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['gps-content'],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(5000)]);

      // 🔥 PERFORMANCE: SINGLE QUERY for all kinds!
      // Combining kinds 1 and 30023 in one request reduces relay load
      const events = await nostr.query(
        [
          {
            kinds: [1, 30023], // Notes + Longform articles
            limit: 100, // Limit for performance
          },
        ],
        { signal }
      );

      console.log('📍 GPS Content: Loaded', events.length, 'events');

      // Filter and parse events
      const markers = events
        .filter(isValidPublishedEvent)
        .map(parseEventToMarker)
        .filter((m): m is MapMarker => m !== null);

      console.log('✅ GPS Content: Parsed', markers.length, 'markers');

      return markers;
    },
    staleTime: DEFAULT_CACHE_CONFIG.lists.staleTime, // 24 hours cache
    gcTime: DEFAULT_CACHE_CONFIG.lists.gcTime, // 3 days garbage collection
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnMount: true, // ✅ Refetch on component mount (load data immediately!)
    refetchInterval: false, // No auto-refresh
  });
}
