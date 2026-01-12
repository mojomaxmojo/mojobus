import { useEffect, useState } from 'react';

/**
 * Custom Hook für Debouncing von Werten
 * 
 * Perfekt für Search Inputs, um Performance zu verbessern.
 * Der Wert wird erst aktualisiert, wenn für `delay` ms keine Änderung mehr passiert ist.
 * 
 * @param value - Der zu debouncingende Wert (z.B. Search Query)
 * @param delay - Verzögerung in Millisekunden (Standard: 300ms)
 * @returns Der debounced Wert
 * 
 * @example
 * ```tsx
 * const [search, setSearch] = useState('');
 * const debouncedSearch = useDebouncedValue(search, 300);
 * 
 * // search wird sofort aktualisiert (für UI-Feedback)
 * // debouncedSearch wird erst nach 300ms aktualisiert (für Filterung)
 * ```
 */
export function useDebouncedValue<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Timer zurücksetzen, wenn sich value ändert
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup: Timer löschen, wenn Component unmounted oder value sich ändert
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
