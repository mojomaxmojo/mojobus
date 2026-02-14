import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { MapPin } from 'lucide-react';
import L from 'leaflet';

function MapPage() {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [center, setCenter] = useState<[number, number]>([39.3999, -8.2245]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center,
      zoom: 6,
      zoomControl: false,
    });

    mapRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [center]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Card className="p-6">
          <div className="text-center space-y-4 mb-6">
            <MapPin className="w-12 h-12 text-primary mx-auto" />
            <h1 className="text-3xl font-bold">Reise-Karte</h1>
            <p className="text-muted-foreground">
              Interaktive Karte unserer Reiseroute
            </p>
          </div>

          <div
            ref={mapContainerRef}
            style={{ height: '600px', width: '100%' }}
          />
        </Card>
      </div>
    </div>
  );
}

export default MapPage;
