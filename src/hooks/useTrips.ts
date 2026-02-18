/**
 * useTrips Hook
 *
 * Loads Trip events (Kind 30303) from Nostr
 * Parses waypoint tags and returns structured Trip data
 */

import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@/hooks/useNostr';
import { DEFAULT_CACHE_CONFIG } from '@/config/cache';
import type { NostrEvent } from '@nostrify/nostrify';

/**
 * Trip Waypoint - represents one station in a trip
 */
export interface TripWaypoint {
  /** Station number (1-based) */
  index: number;
  /** Latitude */
  lat: number;
  /** Longitude */
  lon: number;
  /** Location name */
  name: string;
  /** Date of visit */
  date?: string;
  /** Image URL */
  image?: string;
}

/**
 * Trip - represents a complete trip with multiple waypoints
 */
export interface Trip {
  /** Event ID */
  id: string;
  /** Event coordinate (naddr) */
  coordinate?: string;
  /** Trip title */
  title: string;
  /** Trip summary */
  summary?: string;
  /** Cover image */
  image?: string;
  /** Country */
  country?: string;
  /** Author pubkey */
  author: string;
  /** Created timestamp */
  createdAt: number;
  /** Waypoints (ordered) */
  waypoints: TripWaypoint[];
  /** Full event object */
  event: NostrEvent;
}

/**
 * Parse waypoint tag
 * Format: ['waypoint', index, lat, lon, name, date?, image?]
 */
function parseWaypointTag(tag: string[]): TripWaypoint | null {
  if (tag[0] !== 'waypoint' || tag.length < 5) return null;

  const index = parseInt(tag[1]);
  const lat = parseFloat(tag[2]);
  const lon = parseFloat(tag[3]);
  const name = tag[4];
  const date = tag[5];
  const image = tag[6];

  // Validate
  if (isNaN(index) || isNaN(lat) || isNaN(lon) || !name) return null;
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return null;

  return {
    index,
    lat,
    lon,
    name,
    date,
    image,
  };
}

/**
 * Parse Trip event
 */
function parseTripEvent(event: NostrEvent): Trip | null {
  // Must have trip tag
  const isTrip = event.tags.some(([name, value]) => 
    name === 't' && value === 'trip'
  );
  if (!isTrip) return null;

  // Extract title
  const title = event.tags.find(([name]) => name === 'title')?.[1] ||
    event.tags.find(([name]) => name === 'd')?.[1] ||
    'Unbenannter Trip';

  // Extract summary
  const summary = event.tags.find(([name]) => name === 'summary')?.[1];

  // Extract cover image
  const image = event.tags.find(([name]) => name === 'image')?.[1];

  // Extract country
  const country = event.tags.find(([name]) => name === 'country')?.[1];

  // Parse waypoints
  const waypoints = event.tags
    .filter(([name]) => name === 'waypoint')
    .map(parseWaypointTag)
    .filter((w): w is TripWaypoint => w !== null)
    .sort((a, b) => a.index - b.index);

  // Must have at least 2 waypoints
  if (waypoints.length < 2) return null;

  return {
    id: event.id,
    title,
    summary,
    image,
    country,
    author: event.pubkey,
    createdAt: event.created_at,
    waypoints,
    event,
  };
}

/**
 * Hook to load Trips from Nostr
 * Uses caching for performance
 */
export function useTrips() {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['trips'],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(5000)]);

      // Query for trip events (Kind 30303)
      const events = await nostr.query(
        [
          {
            kinds: [30303],
            limit: 50,
          },
        ],
        { signal }
      );

      console.log('🗺️ Trips: Loaded', events.length, 'events');

      // Parse and filter valid trips
      const trips = events
        .map(parseTripEvent)
        .filter((t): t is Trip => t !== null);

      console.log('✅ Trips: Parsed', trips.length, 'valid trips');

      return trips;
    },
    staleTime: DEFAULT_CACHE_CONFIG.lists.staleTime,
    gcTime: DEFAULT_CACHE_CONFIG.lists.gcTime,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchInterval: false,
  });
}

/**
 * Get total distance of a trip (km)
 */
export function calculateTripDistance(waypoints: TripWaypoint[]): number {
  if (waypoints.length < 2) return 0;

  let totalDistance = 0;
  for (let i = 1; i < waypoints.length; i++) {
    const from = waypoints[i - 1];
    const to = waypoints[i];
    totalDistance += calculateHaversineDistance(from.lat, from.lon, to.lat, to.lon);
  }

  return Math.round(totalDistance);
}

/**
 * Haversine formula for distance calculation
 */
function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
