import { MapPin, Edit, AlertCircle, XCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GpsStatus } from '@/lib/gpsExtraction';
import type { GpsData } from '@/lib/gpsExtraction';

/**
 * Props for GpsStatusIndicator component
 */
export interface GpsStatusIndicatorProps {
  /** Current GPS status */
  status: GpsStatus | undefined;
  /** GPS data (optional, for precision display) */
  gps?: GpsData;
  /** Custom class name for styling */
  className?: string;
  /** Show compact version (icon only) */
  compact?: boolean;
}

/**
 * GpsStatusIndicator Component
 *
 * Visual indicator for GPS extraction status with precision display
 * Shows different colors and icons based on status:
 * - detected: Green with MapPin icon (auto-detected from EXIF)
 * - manual: Blue with Edit icon (manually entered)
 * - not_found: Gray with XCircle icon (no GPS data found)
 * - error: Red with AlertCircle icon (extraction failed)
 *
 * @example
 * ```tsx
 * <GpsStatusIndicator status="detected" />
 * <GpsStatusIndicator status="manual" compact />
 * <GpsStatusIndicator status="detected" gps={gpsData} />
 * ```
 */
export function GpsStatusIndicator({ status, gps, className, compact = false }: GpsStatusIndicatorProps) {
  if (!status) {
    return null;
  }

  const statusConfig = {
    detected: {
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-200 dark:border-green-800',
      icon: MapPin,
      label: 'Auto-Detected',
      tooltip: 'GPS aus Bilddaten extrahiert',
      iconBgColor: 'bg-green-100 dark:bg-green-800',
    },
    manual: {
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-800',
      icon: Edit,
      label: 'Manuell',
      tooltip: 'GPS manuell eingegeben',
      iconBgColor: 'bg-blue-100 dark:bg-blue-800',
    },
    not_found: {
      color: 'text-gray-400 dark:text-gray-500',
      bgColor: 'bg-gray-50 dark:bg-gray-900/20',
      borderColor: 'border-gray-200 dark:border-gray-700',
      icon: XCircle,
      label: 'Kein GPS',
      tooltip: 'Keine GPS-Daten gefunden',
      iconBgColor: 'bg-gray-100 dark:bg-gray-800',
    },
    error: {
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      borderColor: 'border-red-200 dark:border-red-800',
      icon: AlertCircle,
      label: 'Fehler',
      tooltip: 'Fehler beim GPS-Auslesen',
      iconBgColor: 'bg-red-100 dark:bg-red-800',
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  // Display precision (high/medium/low) based on GPS data
  const precisionLabel = gps ? {
    high: 'Hoch',
    medium: 'Mittel',
    low: 'Niedrig'
  }[gps.precision] : null;

  if (compact) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-full',
          config.iconBgColor,
          className
        )}
        title={config.tooltip}
      >
        <Icon className="h-3 w-3" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm',
        config.bgColor,
        config.borderColor,
        'border',
        className
      )}
      title={config.tooltip}
    >
      <div className={cn('p-1 rounded-full', config.iconBgColor)}>
        <Icon className="h-3 w-3" />
      </div>
      <span className={config.color}>{config.label}</span>
      {precisionLabel && status === 'detected' && (
        <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-medium',
          gps?.precision === 'high' ? 'bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200' :
          gps?.precision === 'medium' ? 'bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200' :
          'bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
        )}>
          {precisionLabel}
        </span>
      )}
    </div>
  );
}
