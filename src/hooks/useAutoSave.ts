import { useCallback, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/useToast';

/**
 * Hook für automatisches Speichern mit De-bouncing
 * Löst das Problem des zu häufigen Speichern bei replaceable content
 */
export function useAutoSave(
  content: string,
  saveFn: (content: string) => Promise<void>,
  delay: number = 2000 // 2 Sekunden Standard-Delay
  isContentModified: () => boolean = () => false
) {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const lastSaveRef = useRef<string>('');
  const { toast } = useToast();

  const debouncedSave = useCallback(async (contentToSave: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(async () => {
      try {
        await saveFn(contentToSave);
        lastSaveRef.current = contentToSave;
        
        console.log(`Auto-saved at ${new Date().toLocaleTimeString()}`);
      } catch (error) {
        console.error('Auto-save failed:', error);
        toast({
          title: 'Auto-Speichern fehlgeschlagen',
          description: 'Der Inhalt konnte nicht automatisch gespeichert werden.',
          duration: 5000,
          variant: 'destructive'
        });
      }
    }, delay);
  }, [content, saveFn, delay]);

  // Automatisches Speichern bei Content-Änderungen
  useEffect(() => {
    const currentContent = content.trim();
    const shouldSave = currentContent !== lastSaveRef.current && currentContent.length > 0;
    
    // Wenn Content geändert ist und nicht leer, starte Auto-Save
    if (shouldSave) {
      debouncedSave(currentContent);
    }
  }, [content, saveFn, isContentModified]);

  // Manuelles Speichern mit Visual-Feedback
  const manualSave = useCallback(async () => {
    try {
      await saveFn(content);
      lastSaveRef.current = content;
      
      toast({
        title: 'Gespeichert',
        description: 'Der Inhalt wurde erfolgreich gespeichert.',
        duration: 3000,
        variant: 'default'
      });
    } catch (error) {
      toast({
        title: 'Speichern fehlgeschlagen',
        description: error.message || 'Der Inhalt konnte nicht gespeichert werden.',
        duration: 5000,
        variant: 'destructive'
      });
    }
  }, [saveFn]);

  // Prüft ob die Seiteneite-Zeit abgelaufen ist
  const shouldShowSaveButton = useCallback(() => {
    const currentContent = content.trim();
    return currentContent !== lastSaveRef.current && currentContent.length > 0;
  }, [content, lastSaveRef.current]);

  return {
    manualSave,
    shouldShowSaveButton,
    lastSavedAt: lastSaveRef.current ? new Date() : null
  };
}