import { MapPin, Edit, AlertCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GpsStatus } from '@/lib/gpsExtraction';

/**
 * Props for GpsStatusIndicator component
 */
export interface GpsStatusIndicatorProps {
  /** Current GPS status */
  status: GpsStatus | undefined;
  /** Custom class name for styling */
  className?: string;
  /** Show compact version (icon only) */
  compact?: boolean;
}

/**
 * GpsStatusIndicator Component
 *
 * Visual indicator for GPS extraction status
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
 * ```
 */
export function GpsStatusIndicator({ status, className, compact = false }: GpsStatusIndicatorProps) {
  if (!status) {
    return null;
  }

  const statusConfig = {
    detected: {
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-200 dark:border-green-800',
      icon: MapPin,
      label: 'EXIF',
      tooltip: 'GPS aus Bilddaten extrahiert',
    },
    manual: {
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-800',
      icon: Edit,
      label: 'Manuell',
      tooltip: 'GPS manuell eingegeben',
    },
    not_found: {
      color: 'text-gray-400 dark:text-gray-500',
      bgColor: 'bg-gray-50 dark:bg-gray-900/20',
      borderColor: 'border-gray-200 dark:border-gray-700',
      icon: XCircle,
      label: 'Kein GPS',
      tooltip: 'Keine GPS-Daten gefunden',
    },
    error: {
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      borderColor: 'border-red-200 dark:border-red-800',
      icon: AlertCircle,
      label: 'Fehler',
      tooltip: 'Fehler beim GPS-Auslesen',
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  if (compact) {
    return (
      <div
        className={cn(
          'flex items-center justify-center',
          config.color,
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
        'inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium',
        config.bgColor,
        config.borderColor,
        'border',
        className
      )}
      title={config.tooltip}
    >
      <Icon className="h-3 w-3" />
      <span>{config.label}</span>
    </div>
  );
}
