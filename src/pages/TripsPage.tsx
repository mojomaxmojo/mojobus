/**
 * Trips Page
 *
 * Displays all published trips with route visualization
 * Shows trip cards with preview images, route stats, and links to details
 */

import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useTrips, calculateTripDistance, type Trip } from '@/hooks/useTrips';
import { VanillaMap, TILE_LAYERS, type MapMarker, type MapPolyline } from '@/components/VanillaMap';
import { 
  MapPin, RefreshCw, Loader2, Map as MapIcon, Route, Clock, 
  Calendar, ChevronRight, Plus, Camera 
} from '@/lib/icons';

// Default center (Europe)
const DEFAULT_CENTER: [number, number] = [39.5, -8.0];
const DEFAULT_ZOOM = 5;

/**
 * Trip Card Component
 */
function TripCard({ trip }: { trip: Trip }) {
  const distance = calculateTripDistance(trip.waypoints);
  const firstDate = trip.waypoints[0]?.date;
  const lastDate = trip.waypoints[trip.waypoints.length - 1]?.date;
  
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {/* Cover Image */}
      {trip.image ? (
        <img
          src={trip.image}
          alt={trip.title}
          className="w-full h-48 object-cover"
        />
      ) : (
        <div className="w-full h-48 bg-muted flex items-center justify-center">
          <Camera className="h-12 w-12 text-muted-foreground" />
        </div>
      )}
      
      <CardHeader className="pb-2">
        <CardTitle className="text-lg line-clamp-1">{trip.title}</CardTitle>
        {trip.summary && (
          <CardDescription className="line-clamp-2">{trip.summary}</CardDescription>
        )}
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Route className="h-4 w-4" />
            <span>{distance} km</span>
          </div>
          <div className="flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            <span>{trip.waypoints.length} Stationen</span>
          </div>
        </div>
        
        {/* Date Range */}
        {(firstDate || lastDate) && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>
              {firstDate ? new Date(firstDate).toLocaleDateString('de-DE') : '?'}
              {' - '}
              {lastDate ? new Date(lastDate).toLocaleDateString('de-DE') : '?'}
            </span>
          </div>
        )}
        
        {/* Country Badge */}
        {trip.country && (
          <Badge variant="outline">{trip.country}</Badge>
        )}
        
        {/* Waypoints Preview */}
        <div className="flex items-center gap-1 text-xs text-muted-foreground overflow-hidden">
          {trip.waypoints.slice(0, 4).map((wp, idx) => (
            <span key={idx} className="flex items-center gap-1">
              {idx > 0 && <ChevronRight className="h-3 w-3" />}
              <span className="truncate max-w-[80px]">{wp.name}</span>
            </span>
          ))}
          {trip.waypoints.length > 4 && (
            <span className="text-primary">+{trip.waypoints.length - 4}</span>
          )}
        </div>
        
        {/* View Button */}
        <Button variant="outline" className="w-full" asChild>
          <Link to={`/trip/${trip.id}`}>
            <MapIcon className="h-4 w-4 mr-2" />
            Trip ansehen
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

/**
 * Main Trips Page Component
 */
export default function TripsPage() {
  const { data: trips = [], isLoading, error, refetch } = useTrips();
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  
  // Selected trip for map highlight
  const selectedTrip = useMemo(() => 
    trips.find(t => t.id === selectedTripId),
    [trips, selectedTripId]
  );
  
  // Map markers from all trips
  const mapMarkers: MapMarker[] = useMemo(() => {
    return trips.flatMap(trip => 
      trip.waypoints.map((wp, idx) => ({
        id: `${trip.id}-${idx}`,
        lat: wp.lat,
        lng: wp.lon,
        title: wp.name,
        description: trip.title,
        isCurrent: false,
        type: 'trip' as const,
      }))
    );
  }, [trips]);
  
  // Map polylines from all trips
  const mapPolylines: MapPolyline[] = useMemo(() => {
    const colors = ['#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#84cc16'];
    
    return trips.map((trip, idx) => ({
      points: trip.waypoints.map(wp => [wp.lat, wp.lon] as [number, number]),
      color: selectedTripId && selectedTripId !== trip.id 
        ? '#9ca3af' // Gray for non-selected
        : colors[idx % colors.length],
      weight: selectedTripId && selectedTripId === trip.id ? 5 : 3,
      opacity: selectedTripId && selectedTripId !== trip.id ? 0.4 : 0.9,
    }));
  }, [trips, selectedTripId]);
  
  // Handle loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Route className="w-5 h-5" />
            <span className="text-lg font-semibold">🛣️ Trips</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-64 rounded-lg" />
            ))}
          </div>
        </Card>
      </div>
    );
  }
  
  // Handle error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="border-dashed p-8">
          <div className="max-w-sm mx-auto text-center space-y-6">
            <Route className="w-12 h-12 text-gray-400 mx-auto" />
            <div>
              <h3 className="text-lg font-medium mb-2">Trips konnten nicht geladen werden</h3>
              <p className="text-muted-foreground">Bitte versuche es erneut.</p>
            </div>
            <Button onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Neu laden
            </Button>
          </div>
        </Card>
      </div>
    );
  }
  
  // Handle empty state
  if (trips.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <section className="relative py-3 overflow-hidden mb-6">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-accent/20 to-background" />
          <div className="relative z-10 text-center">
            <h1 className="text-4xl md:text-6xl font-bold">
              <span className="gradient-text">🛣️ Trips</span>
            </h1>
            <p className="text-muted-foreground mt-2">
              Entdecke Reise-Routen und Abenteuer
            </p>
          </div>
        </section>
      
        <Card className="border-dashed p-8">
          <div className="max-w-sm mx-auto text-center space-y-6">
            <Route className="w-12 h-12 text-gray-400 mx-auto" />
            <div>
              <h3 className="text-lg font-medium mb-2">Noch keine Trips vorhanden</h3>
              <p className="text-muted-foreground">
                Erstelle deinen ersten Trip unter "Veröffentlichen" → "Trips"
              </p>
            </div>
            <Button asChild>
              <Link to="/veroeffentlichen">
                <Plus className="w-4 h-4 mr-2" />
                Trip erstellen
              </Link>
            </Button>
          </div>
        </Card>
      </div>
    );
  }
  
  return (
    <>
      {/* Page Header */}
      <section className="relative py-3 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-accent/20 to-background" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/40 to-background" />
        
        <div className="relative z-10 container mx-auto px-4">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold">
              <span className="gradient-text">🛣️ Trips</span>
            </h1>
            <p className="text-muted-foreground mt-2">
              {trips.length} Reise-Routen entdecken
            </p>
          </div>
        </div>
      </section>
      
      <div className="container mx-auto px-4 pb-8 space-y-6">
        {/* Map Overview */}
        <Card className="overflow-hidden">
          <div className="p-3 bg-muted/50 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapIcon className="w-4 h-4" />
              <span className="text-sm font-medium">Kartenübersicht</span>
            </div>
            <div className="flex items-center gap-2">
              {selectedTrip && (
                <Badge variant="outline">
                  {selectedTrip.title}
                </Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedTripId(null)}
                disabled={!selectedTripId}
              >
                Alle anzeigen
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <div style={{ height: '400px' }}>
            <VanillaMap
              center={DEFAULT_CENTER}
              zoom={DEFAULT_ZOOM}
              minZoom={2}
              maxZoom={18}
              markers={mapMarkers}
              polylines={mapPolylines}
              height="400px"
              tileUrl={TILE_LAYERS.default.url}
              tileAttribution={TILE_LAYERS.default.attribution}
              fitToMarkers={true}
            />
          </div>
        </Card>
        
        {/* Trip Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trips.map(trip => (
            <div
              key={trip.id}
              onMouseEnter={() => setSelectedTripId(trip.id)}
              onMouseLeave={() => setSelectedTripId(null)}
              className="transition-transform hover:scale-[1.02]"
            >
              <TripCard trip={trip} />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
