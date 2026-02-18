/**
 * VanillaMap - Eine robuste Leaflet-Komponente für Shakespeare-Build-Kompatibilität
 * 
 * Lädt Leaflet dynamisch bei Bedarf - keine Änderungen an index.html nötig.
 */

import { useEffect, useRef, useState, useCallback } from 'react';

// Type declarations for global Leaflet
declare global {
  interface Window {
    L: typeof import('leaflet');
    __leafletLoading?: boolean;
    __leafletLoaded?: boolean;
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
  minZoom?: number;
  maxZoom?: number;
  fitToMarkers?: boolean; // Auto-zoom um alle Marker anzuzeigen
}

// Tile layers
const DEFAULT_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const DEFAULT_TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

// Calculate bounds from markers
const calculateMarkersBounds = (markers: MapMarker[]) => {
  if (markers.length === 0) return null;
  
  let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
  
  markers.forEach(m => {
    if (m.lat < minLat) minLat = m.lat;
    if (m.lat > maxLat) maxLat = m.lat;
    if (m.lng < minLng) minLng = m.lng;
    if (m.lng > maxLng) maxLng = m.lng;
  });
  
  return { minLat, maxLat, minLng, maxLng };
};

// Create marker icon
const createMarkerIcon = (isCurrent: boolean = false): L.Icon | null => {
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

// Load Leaflet CSS and JS dynamically
const loadLeaflet = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Already loaded
    if (window.L && window.__leafletLoaded) {
      resolve();
      return;
    }

    // Already loading - wait for it
    if (window.__leafletLoading) {
      const checkInterval = setInterval(() => {
        if (window.L && window.__leafletLoaded) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 50);
      return;
    }

    window.__leafletLoading = true;

    // Load CSS first
    const cssLink = document.createElement('link');
    cssLink.rel = 'stylesheet';
    cssLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    
    // Load JS
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.async = true;

    let cssLoaded = false;
    let jsLoaded = false;

    const checkComplete = () => {
      if (cssLoaded && jsLoaded && window.L) {
        window.__leafletLoaded = true;
        window.__leafletLoading = false;
        resolve();
      }
    };

    cssLink.onload = () => {
      cssLoaded = true;
      checkComplete();
    };
    
    cssLink.onerror = () => {
      cssLoaded = true; // Continue anyway
      checkComplete();
    };

    script.onload = () => {
      jsLoaded = true;
      checkComplete();
    };

    script.onerror = () => {
      window.__leafletLoading = false;
      reject(new Error('Failed to load Leaflet JS'));
    };

    // Add to document
    document.head.appendChild(cssLink);
    document.head.appendChild(script);

    // Timeout after 15 seconds
    setTimeout(() => {
      if (!window.L) {
        window.__leafletLoading = false;
        reject(new Error('Leaflet loading timeout'));
      }
    }, 15000);
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
  minZoom = 2,
  maxZoom = 18,
  fitToMarkers = true, // Standardmäßig auf alle Marker zoomen
}: VanillaMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const polylinesLayerRef = useRef<L.LayerGroup | null>(null);
  const hasFitToMarkersRef = useRef(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load Leaflet
  useEffect(() => {
    let mounted = true;

    loadLeaflet()
      .then(() => {
        if (mounted) {
          setIsLoaded(true);
          setError(null);
        }
      })
      .catch((err) => {
        console.error('Failed to load Leaflet:', err);
        if (mounted) {
          setError('Karte konnte nicht geladen werden. Bitte Internetverbindung prüfen und Seite neu laden.');
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  // Initialize map
  useEffect(() => {
    if (!isLoaded || !mapRef.current || !window.L || leafletMapRef.current) return;

    try {
      const L = window.L;

      const map = L.map(mapRef.current, {
        center: center,
        zoom: zoom,
        zoomControl: true,
        scrollWheelZoom: true,
        minZoom: minZoom,
        maxZoom: maxZoom,
      });

      L.tileLayer(tileUrl, {
        attribution: tileAttribution,
        maxZoom: maxZoom,
      }).addTo(map);

      const markersLayer = L.layerGroup().addTo(map);
      const polylinesLayer = L.layerGroup().addTo(map);
      
      markersLayerRef.current = markersLayer;
      polylinesLayerRef.current = polylinesLayer;
      leafletMapRef.current = map;

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

      setTimeout(() => map.invalidateSize(), 100);
      
      // Map ist jetzt bereit
      setMapReady(true);

    } catch (err) {
      console.error('Error initializing map:', err);
      setError('Fehler beim Initialisieren der Karte.');
    }

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
        markersLayerRef.current = null;
        polylinesLayerRef.current = null;
      }
    };
  }, [isLoaded]);

  // Update center/zoom
  useEffect(() => {
    if (leafletMapRef.current) {
      leafletMapRef.current.setView(center, zoom, { animate: true });
    }
  }, [center, zoom]);

  // Update markers
  useEffect(() => {
    if (!mapReady || !leafletMapRef.current || !markersLayerRef.current || !window.L) {
      console.log('🗺️ VanillaMap - marker update skipped, mapReady:', mapReady);
      return;
    }
    
    console.log('🗺️ VanillaMap - updating markers:', markers.length);

    const L = window.L;
    const layer = markersLayerRef.current;
    layer.clearLayers();

    markers.forEach((m) => {
      const icon = createMarkerIcon(m.isCurrent);
      const marker = L.marker([m.lat, m.lng], {
        icon: icon || new L.Icon.Default(),
      });

      if (m.title || m.description) {
        marker.bindPopup(`
          <div style="min-width: 150px; font-family: system-ui, sans-serif;">
            ${m.title ? `<h3 style="font-weight: 600; margin-bottom: 4px; font-size: 14px;">${m.title}</h3>` : ''}
            ${m.description ? `<p style="font-size: 12px; color: #666; margin: 0;">${m.description}</p>` : ''}
          </div>
        `);
      }

      if (m.onClick) {
        marker.on('click', () => m.onClick?.());
      }

      layer.addLayer(marker);
    });
    
    console.log('🗺️ VanillaMap - markers added to layer:', markers.length);
  }, [mapReady, markers]);

  // Update polylines
  useEffect(() => {
    if (!mapReady || !leafletMapRef.current || !polylinesLayerRef.current || !window.L) return;

    const L = window.L;
    const layer = polylinesLayerRef.current;
    layer.clearLayers();

    polylines.forEach((p) => {
      const polyline = L.polyline(p.points, {
        color: p.color || '#0891B2',
        weight: p.weight || 3,
        opacity: p.opacity || 0.8,
        lineCap: 'round',
        lineJoin: 'round',
      });
      layer.addLayer(polyline);
    });
  }, [mapReady, polylines]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      leafletMapRef.current?.invalidateSize();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-zoom zu allen Markern beim ersten Laden (nur einmal)
  useEffect(() => {
    if (!mapReady || !leafletMapRef.current || !fitToMarkers || hasFitToMarkersRef.current) return;
    if (markers.length === 0) return;
    
    hasFitToMarkersRef.current = true;
    
    const map = leafletMapRef.current;
    const bounds = calculateMarkersBounds(markers);
    
    if (bounds) {
      // Kleiner Delay um sicherzustellen dass die Karte fertig gerendert ist
      setTimeout(() => {
        map.fitBounds([
          [bounds.minLat, bounds.minLng],
          [bounds.maxLat, bounds.maxLng]
        ], { padding: [30, 30], maxZoom: 14 });
      }, 300);
    }
  }, [mapReady, markers, fitToMarkers]);

  if (error) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg ${className}`} 
        style={{ height }}
      >
        <div className="text-center p-4">
          <div className="text-4xl mb-2">🗺️</div>
          <p className="text-red-500 text-sm">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-2 text-sm text-blue-500 underline"
          >
            Seite neu laden
          </button>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg ${className}`} 
        style={{ height }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground text-sm">Lade Karte...</p>
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

// Tile layer configs
export const TILE_LAYERS = {
  default: { url: DEFAULT_TILE_URL, attribution: DEFAULT_TILE_ATTRIBUTION },
  satellite: { 
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', 
    attribution: '&copy; Esri' 
  },
  terrain: { 
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', 
    attribution: '&copy; OpenTopoMap' 
  },
  cartoVoyager: {
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
};
