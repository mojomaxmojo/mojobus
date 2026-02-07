/**
 * Map Marker Popup Component
 *
 * Displays details for GPS-enabled posts on map
 */

import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getContentTypeEmoji, getContentTypeLabel } from '@/lib/markerIcons';
import { getAuthorRelayConfigByPubkey } from '@/config/relays';
import { nip19 } from 'nostr-tools';
import type { MapMarker } from '@/hooks/useGpsContent';

interface MapMarkerPopupProps {
  marker: MapMarker;
}

export function MapMarkerPopup({ marker }: MapMarkerPopupProps) {
  const emoji = getContentTypeEmoji(marker.type);
  const typeLabel = getContentTypeLabel(marker.type);

  // Generate naddr for navigation
  let naddr = '';
  let pathPrefix = '';

  // Debug: Logge Platz-Marker
  if (marker.type === 'place') {
    console.log('[MapMarkerPopup] Place marker:', {
      type: marker.type,
      kind: marker.kind,
      id: marker.id,
      author: marker.author,
      title: marker.title,
      tags: marker.tags,
    });
  }

  try {
    if (marker.kind === 1) {
      // Note - use note identifier
      naddr = nip19.noteEncode(marker.id);

      // Determine path prefix based on content type
      if (marker.type === 'media') {
        // Images should go to /bild/
        pathPrefix = '/bild/';
      } else if (marker.type === 'note') {
        // Notes should go to root /
        pathPrefix = '/';
      }
    } else if (marker.kind === 30023) {
      // Long-form article - use naddr
      const d = marker.tags.find(t => t[0] === 'd')?.[1] || `post-${marker.id}`;

      // Get author-specific relay configuration
      const authorRelayConfig = getAuthorRelayConfigByPubkey(marker.author);
      const relay = authorRelayConfig?.activeRelay || 'wss://relay.mojobus.co';

      naddr = nip19.naddrEncode({
        kind: 30023,
        pubkey: marker.author,
        identifier: d,
        relays: [relay],
      });
      // Articles and places go to root /
      pathPrefix = '/';

      // Debug: Logge generierte naddr für Plätze
      if (marker.type === 'place') {
        console.log('[MapMarkerPopup] Place naddr generated:', {
          identifier: d,
          relay: relay,
          naddr: naddr,
          pathPrefix: pathPrefix,
          href: `${pathPrefix}${naddr}`,
        });
      }
    }
  } catch (error) {
    console.error('Error generating naddr:', error);
  }

  const href = `${pathPrefix}${naddr}`;

  return (
    <div className="p-3 min-w-[250px] max-w-[300px]">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">{emoji}</span>
        <h3 className="font-bold text-sm line-clamp-1 flex-1">
          {marker.title}
        </h3>
      </div>

      {/* Content Type Badge */}
      <div className="mb-2">
        <Badge variant="outline" className="text-xs">
          {typeLabel}
        </Badge>
      </div>

      {/* Image Preview (if available) */}
      {marker.image && (
        <div className="mb-2 overflow-hidden rounded-lg">
          <img
            src={marker.image}
            alt={marker.title}
            className="w-full h-auto max-h-[150px] object-cover"
            loading="lazy"
          />
        </div>
      )}

      {/* Location */}
      {marker.location && (
        <div className="mb-2 text-sm text-muted-foreground">
          📍 {marker.location}
        </div>
      )}

      {/* GPS Coordinates */}
      <div className="mb-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          🌐 {marker.lat.toFixed(6)}° N
        </div>
        <div className="flex items-center gap-1">
          🌐 {marker.lon.toFixed(6)}° E
        </div>
      </div>

      {/* GPS Source Indicator */}
      {marker.gpsSource && (
        <div className="mb-3">
          <Badge
            variant={marker.gpsSource === 'detected' ? 'default' : 'secondary'}
            className="text-xs"
          >
            {marker.gpsSource === 'detected' ? '📷 GPS erkannt' : '✏️ Manuell'}
          </Badge>
        </div>
      )}

      {/* View Details Button */}
      <Button
        asChild
        className="w-full"
        size="sm"
      >
        <Link to={href}>
          Details anzeigen
        </Link>
      </Button>

      {/* Debug: Zeige den generierten Link */}
      {marker.type === 'place' && (
        <div className="mt-2 text-xs text-muted-foreground bg-muted p-2 rounded">
          <div>Link: {href}</div>
        </div>
      )}
    </div>
  );
}
