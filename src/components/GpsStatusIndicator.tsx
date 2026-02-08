/**
 * GpsStatusIndicator Component
 *
 * Visual indicator for GPS status in image upload forms
 * Shows different states: detected, manual, not_found, error
 */

import { MapPin, Edit, XCircle, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { GpsStatus } from '@/lib/gpsExtraction';

interface GpsStatusIndicatorProps {
  /** Current GPS status */
  status: GpsStatus;
  /** GPS coordinates (optional, for displaying when available) */
  coordinates?: { lat: number; lon: number } | null;
  /** Show full coordinate string */
  showCoordinates?: boolean;
  /** Compact mode for smaller displays */
  compact?: boolean;
  /** Custom class name */
  className?: string;
}

export function GpsStatusIndicator({
  status,
  coordinates,
  showCoordinates = false,
  compact = false,
  className = ''
}: GpsStatusIndicatorProps) {
  // Status configurations
  const statusConfig = {
    detected: {
      icon: CheckCircle2,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/20 border-green-300 dark:border-green-700',
      label: 'Auto-Detected',
      description: 'GPS aus Bild-Metadaten extrahiert'
    },
    manual: {
      icon: Edit,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700',
      label: 'Manual',
      description: 'GPS manuell eingegeben'
    },
    not_found: {
      icon: XCircle,
      color: 'text-gray-400',
      bgColor: 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600',
      label: 'No GPS',
      description: 'Keine GPS-Daten gefunden'
    },
    error: {
      icon: AlertTriangle,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-100 dark:bg-red-900/20 border-red-300 dark:border-red-700',
      label: 'Error',
      description: 'Fehler beim GPS-Lesen'
    }
  };

  const config = statusConfig[status] || statusConfig.not_found;
  const Icon = config.icon;

  // Format coordinates for display
  const formatCoordinates = (lat: number, lon: number) => {
    const latDir = lat >= 0 ? 'N' : 'S';
    const lonDir = lon >= 0 ? 'E' : 'W';
    return `${Math.abs(lat).toFixed(4)}° ${latDir}, ${Math.abs(lon).toFixed(4)}° ${lonDir}`;
  };

  if (compact) {
    return (
      <Badge
        variant="outline"
        className={`gap-1 ${config.bgColor} ${config.color} ${className}`}
        title={config.description}
      >
        <Icon className="h-3 w-3" />
        <span className="text-xs">{config.label}</span>
      </Badge>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Status Badge */}
      <Badge
        variant="outline"
        className={`${config.bgColor} ${config.color} gap-1`}
        title={config.description}
      >
        <Icon className="h-3 w-3" />
        <span className="text-xs font-medium">{config.label}</span>
      </Badge>

      {/* Coordinates display */}
      {showCoordinates && coordinates && (
        <div className={`flex items-center gap-1 ${config.color}`}>
          <MapPin className="h-3 w-3" />
          <span className="text-xs font-mono">
            {formatCoordinates(coordinates.lat, coordinates.lon)}
          </span>
        </div>
      )}
    </div>
  );
}
