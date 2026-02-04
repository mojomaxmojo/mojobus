/**
 * Europa Reviews Map Page
 *
 * Displays all GPS-enabled posts from /veroeffentlichen on a Europe map
 * Lazy-loaded to not affect initial page load
 */

import { useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useGpsContent, type MapMarker } from '@/hooks/useGpsContent';
import { MapMarkerPopup } from '@/components/MapMarkerPopup';
import { getMarkerIcon } from '@/lib/markerIcons';
import { EUROPA_BOUNDS, EUROPA_CENTER, ZOOM_SETTINGS } from '@/lib/mapConfig';
import { MapPin, RefreshCw, Loader2 } from '@/lib/icons';

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for Leaflet default markers in bundled applications
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

/**
 * Main Map Page Component
 */
export default function MapPage() {
  const { data: markers = [], isLoading, error, refetch } = useGpsContent();

  // Filter markers to Europe only
  const europeMarkers = useMemo(() => {
    return markers.filter(marker => {
      return (
        marker.lat >= EUROPA_BOUNDS.south &&
        marker.lat <= EUROPA_BOUNDS.north &&
        marker.lon >= EUROPA_BOUNDS.west &&
        marker.lon <= EUROPA_BOUNDS.east
      );
    });
  }, [markers]);

  // Count markers by type
  const counts = useMemo(() => ({
    media: europeMarkers.filter(m => m.type === 'media').length,
    note: europeMarkers.filter(m => m.type === 'note').length,
    place: europeMarkers.filter(m => m.type === 'place').length,
    article: europeMarkers.filter(m => m.type === 'article').length,
    total: europeMarkers.length,
  }), [europeMarkers]);

  // Handle loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              🗺️ Europa Map
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Skeleton className="w-full h-[600px] rounded-lg" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="border-dashed">
          <CardContent className="py-12 px-8 text-center">
            <div className="max-w-sm mx-auto space-y-6">
              <MapPin className="w-12 h-12 text-gray-400 mx-auto" />
              <div>
                <h3 className="text-lg font-medium mb-2">Karte konnte nicht geladen werden</h3>
                <p className="text-muted-foreground">
                  Bitte versuche es erneut.
                </p>
              </div>
              <Button onClick={() => refetch()}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Neu laden
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Handle empty state
  if (europeMarkers.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="border-dashed">
          <CardContent className="py-12 px-8 text-center">
            <div className="max-w-sm mx-auto space-y-6">
              <MapPin className="w-12 h-12 text-gray-400 mx-auto" />
              <div>
                <h3 className="text-lg font-medium mb-2">Noch keine Beiträge mit GPS</h3>
                <p className="text-muted-foreground">
                  Veröffentliche Beiträge mit Standortinformationen, um sie auf der Karte anzuzeigen.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Page Title */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              🗺️ Europa Map
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Neu laden
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span>
                <strong>{counts.total}</strong> Beiträge
              </span>
            </div>
            <span className="text-muted-foreground">•</span>
            <div className="flex items-center gap-4">
              <span>📷 {counts.media}</span>
              <span>📝 {counts.note}</span>
              <span>📍 {counts.place}</span>
              <span>📄 {counts.article}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Map */}
      <Card>
        <CardContent className="p-0">
          <div style={{ height: '600px', width: '100%' }}>
            <MapContainer
              center={[EUROPA_CENTER.lat, EUROPA_CENTER.lng]}
              zoom={ZOOM_SETTINGS.default}
              minZoom={ZOOM_SETTINGS.min}
              maxZoom={ZOOM_SETTINGS.max}
              maxBounds={[
                [EUROPA_BOUNDS.south, EUROPA_BOUNDS.west],
                [EUROPA_BOUNDS.north, EUROPA_BOUNDS.east],
              ]}
              maxBoundsViscosity={1.0}
              style={{ height: '100%', width: '100%', zIndex: 0 }}
              zoomControl={true}
              scrollWheelZoom={true}
            >
              {/* OpenStreetMap Tile Layer */}
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                maxZoom={19}
              />

              {/* Map Markers */}
              {europeMarkers.map((marker) => (
                <Marker
                  key={marker.id}
                  position={[marker.lat, marker.lon]}
                  icon={getMarkerIcon(marker.type)}
                >
                  <Popup>
                    <MapMarkerPopup marker={marker} />
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
