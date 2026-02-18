/**
 * VanillaMap - Eine CDN-basierte Leaflet-Komponente für Shakespeare-Build-Kompatibilität
 * 
 * Diese Komponente nutzt Leaflet über CDN (window.L) statt react-leaflet zu importieren.
 * Das ist notwendig, weil das Shakespeare-Build-System (esbuild-wasm + esm.sh) Probleme
 * mit react-leaflet/@react-leaflet/core hat.
 * 
 * Verwendung:
 * 1. Leaflet CSS/JS muss in index.html über CDN geladen werden
 * 2. Diese Komponente wartet auf window.L und initialisiert dann die Karte
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { createRoot } from 'react-dom/client';

// Type declarations for global Leaflet
declare global {
  interface Window {
    L: typeof import('leaflet');
  }
}

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  title: string;
  description?: string;
  isCurrent?: boolean;
  onClick?: () => void;
}

export interface MapPolyline {
  points: [number, number][];
  color?: string;
  weight?: number;
  opacity?: number;
}

export interface VanillaMapProps {
  center: [number, number];
  zoom?: number;
  markers?: MapMarker[];
  polylines?: MapPolyline[];
  height?: string;
  className?: string;
  onMapClick?: (lat: number, lng: number) => void;
  onCenterChange?: (center: [number, number]) => void;
  onZoomChange?: (zoom: number) => void;
  tileUrl?: string;
  tileAttribution?: string;
}

// Default tile layer (OpenStreetMap)
const DEFAULT_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const DEFAULT_TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

// Satellite tile layer
const SATELLITE_TILE_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
const SATELLITE_TILE_ATTRIBUTION = '&copy; Esri';

// Custom marker icons
const createMarkerIcon = (isCurrent: boolean = false) => {
  if (!window.L) return null;
  
  return window.L.icon({
    iconUrl: isCurrent
      ? 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png'
      : 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
};

export function VanillaMap({
  center,
  zoom = 6,
  markers = [],
  polylines = [],
  height = '100%',
  className = '',
  onMapClick,
  onCenterChange,
  onZoomChange,
  tileUrl = DEFAULT_TILE_URL,
  tileAttribution = DEFAULT_TILE_ATTRIBUTION,
}: VanillaMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if Leaflet is loaded
  useEffect(() => {
    const checkLeaflet = () => {
      if (window.L) {
        setIsLoaded(true);
        setError(null);
        return true;
      }
      return false;
    };

    if (!checkLeaflet()) {
      // Wait for Leaflet to load (it's loaded via CDN in index.html)
      const interval = setInterval(() => {
        if (checkLeaflet()) {
          clearInterval(interval);
        }
      }, 100);

      // Timeout after 10 seconds
      const timeout = setTimeout(() => {
        clearInterval(interval);
        if (!window.L) {
          setError('Leaflet konnte nicht geladen werden. Bitte Seite neu laden.');
        }
      }, 10000);

      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }
  }, []);

  // Initialize map
  useEffect(() => {
    if (!isLoaded || !mapRef.current || !window.L || leafletMapRef.current) return;

    try {
      const L = window.L;

      // Create map
      const map = L.map(mapRef.current, {
        center: center,
        zoom: zoom,
        zoomControl: true,
        scrollWheelZoom: true,
      });

      // Add tile layer
      L.tileLayer(tileUrl, {
        attribution: tileAttribution,
        maxZoom: 19,
      }).addTo(map);

      // Create markers layer group
      const markersLayer = L.layerGroup().addTo(map);
      markersLayerRef.current = markersLayer;
      leafletMapRef.current = map;

      // Event handlers
      if (onMapClick) {
        map.on('click', (e: L.LeafletMouseEvent) => {
          onMapClick(e.latlng.lat, e.latlng.lng);
        });
      }

      if (onCenterChange) {
        map.on('moveend', () => {
          const c = map.getCenter();
          onCenterChange([c.lat, c.lng]);
        });
      }

      if (onZoomChange) {
        map.on('zoomend', () => {
          onZoomChange(map.getZoom());
        });
      }

      // Fix map size after container is visible
      setTimeout(() => {
        map.invalidateSize();
      }, 100);

    } catch (err) {
      console.error('Error initializing map:', err);
      setError('Fehler beim Initialisieren der Karte.');
    }

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, [isLoaded]);

  // Update center/zoom
  useEffect(() => {
    if (leafletMapRef.current) {
      leafletMapRef.current.setView(center, zoom);
    }
  }, [center, zoom]);

  // Update markers
  useEffect(() => {
    if (!leafletMapRef.current || !markersLayerRef.current || !window.L) return;

    const L = window.L;
    const markersLayer = markersLayerRef.current;

    // Clear existing markers
    markersLayer.clearLayers();

    // Add new markers
    markers.forEach((markerData) => {
      const icon = createMarkerIcon(markerData.isCurrent);
      
      const marker = L.marker([markerData.lat, markerData.lng], {
        icon: icon || new L.Icon.Default(),
      });

      if (markerData.title || markerData.description) {
        const popupContent = `
          <div style="min-width: 150px;">
            ${markerData.title ? `<h3 style="font-weight: bold; margin-bottom: 4px;">${markerData.title}</h3>` : ''}
            ${markerData.description ? `<p style="font-size: 14px; color: #666;">${markerData.description}</p>` : ''}
          </div>
        `;
        marker.bindPopup(popupContent);
      }

      if (markerData.onClick) {
        marker.on('click', markerData.onClick);
      }

      markersLayer.addLayer(marker);
    });
  }, [markers]);

  // Update polylines
  useEffect(() => {
    if (!leafletMapRef.current || !window.L) return;

    const L = window.L;
    const map = leafletMapRef.current;

    // Remove existing polylines (we'll re-add them)
    map.eachLayer((layer) => {
      if (layer instanceof L.Polyline && !(layer instanceof L.TileLayer)) {
        map.removeLayer(layer);
      }
    });

    // Add new polylines
    polylines.forEach((polylineData) => {
      const polyline = L.polyline(polylineData.points, {
        color: polylineData.color || '#0891B2',
        weight: polylineData.weight || 3,
        opacity: polylineData.opacity || 0.8,
        lineCap: 'round',
        lineJoin: 'round',
      });
      polyline.addTo(map);
    });
  }, [polylines]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.invalidateSize();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg ${className}`} style={{ height }}>
        <div className="text-center p-4">
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg ${className}`} style={{ height }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Lade Karte...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={mapRef} 
      className={`rounded-lg overflow-hidden ${className}`} 
      style={{ height }}
    />
  );
}

// Export tile layer configs for convenience
export const TILE_LAYERS = {
  default: { url: DEFAULT_TILE_URL, attribution: DEFAULT_TILE_ATTRIBUTION },
  satellite: { url: SATELLITE_TILE_URL, attribution: SATELLITE_TILE_ATTRIBUTION },
  terrain: { 
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', 
    attribution: '&copy; OpenTopoMap' 
  },
  cartoVoyager: {
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
};
