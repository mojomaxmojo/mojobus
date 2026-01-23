import { useState, useEffect } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { IMAGE_OPTIMIZATION_ENABLED_DEFAULT, getOptimizationInfo } from '@/config/imageOptimization';

/**
 * Hook für Bildoptimierungseinstellungen
 *
 * Bietet:
 * - Toggle zum Aktivieren/Deaktivieren der Bildoptimierung
 * - Optimierungsinformationen für die UI
 * - Persistenz der Einstellungen in localStorage
 */
export function useImageOptimization() {
  const [enabled, setEnabled] = useLocalStorage<boolean>(
    'image-optimization-enabled',
    IMAGE_OPTIMIZATION_ENABLED_DEFAULT
  );

  // Toggle-Funktion
  const toggleOptimization = () => {
    setEnabled(!enabled);
  };

  // Optimierungsinformationen für die UI
  const info = getOptimizationInfo();

  return {
    // State
    enabled,
    setEnabled,
    toggleOptimization,

    // Info für UI
    info: {
      maxWidth: info.maxWidth,
      maxHeight: info.maxHeight,
      quality: info.quality,
      format: info.format.replace('image/', '').toUpperCase(),
      excludedFormats: info.excludedFormats,
      maxFileSizeMB: info.maxFileSizeMB,
    },

    // Hilfsfunktionen
    isFormatSupported: (fileType: string) =>
      !info.excludedFormats.includes(fileType),
  };
}
