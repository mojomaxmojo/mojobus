import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useReplaceableContent, ReplaceableContent } from '@/hooks/useReplaceableContent';
import { useAutoSave } from '@/hooks/useAutoSave';
import { useToast } from '@/hooks/useToast';

interface ContentEditorProps {
  dTag: string;
  initialContent?: string;
  onSave?: (content: string) => void;
  mode?: 'create' | 'edit';
}

/**
 * Content Editor für replaceable content
 * Löst das 5x Event Problem durch replaceable content mit auto-save
 */
export function ContentEditor({ dTag, initialContent = '', onSave, mode = 'create' }: ContentEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [lastSaveTime, setLastSaveTime] = useState<number>(0);
  const { content: currentContent, updateContent, isLoading, error } = useReplaceableContent({ dTag, limit: 5 });

  // Auto-Save mit de-bouncing
  useEffect(() => {
    if (mode === 'edit' && content !== currentContent) {
      const timeoutId = setTimeout(async () => {
        try {
          await updateContent(content);
          setLastSaveTime(Date.now());
          console.log(`Auto-saved at ${new Date().toLocaleTimeString()}`);
        } catch (error) {
          console.error('Auto-save failed:', error);
        }
      }, 2000); // 2 Sekunden Verzögerung

      return () => clearTimeout(timeoutId);
    }

    return () => clearTimeout(timeoutId);
  }, [content, mode === 'edit' ? updateContent : undefined, currentContent]);

  // Manuelles Speichern
  const manualSave = useCallback(async () => {
    try {
      await updateContent(content);
      setLastSaveTime(Date.now());

      if (onSave) {
        onSave(content);
      }
    } catch (error) {
      console.error('Manual save failed:', error);
    }
  }, [updateContent, content, onSave]);

  // Synchronisiere Zustand mit replaceable content
  useEffect(() => {
    setContent(currentContent);
  }, [currentContent]);

  const handleSave = async () => {
    if (!content.trim()) {
      return;
    }

    const success = await manualSave();

    if (success && onSave) {
      onSave(content);
    }

    return success;
  };

  const isNewContent = content !== currentContent;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-2">
              <Badge variant={mode === 'create' ? 'default' : 'secondary'} className="text-xs">
                {mode === 'create' ? 'Erstellen' : 'Bearbeiten'}
              </Badge>
              <span className="text-sm font-medium">
                Replaceable Content ({dTag})
              </span>
            </span>
            {isNewContent && (
              <span className="px-2 py-1 text-xs font-medium text-orange-500 bg-orange-50 rounded">
                Ungespeichert
              </span>
            )}
          </div>
          <div className="flex gap-2">
            {mode === 'edit' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Änderungen verwerfen auf aktuelle gespeicherte Version
                  if (currentContent) {
                    setContent(currentContent);
                  }
                }}
              >
                Änderungen verwerfen
              </Button>
            )}
            <Button
              size="sm"
              onClick={manualSave}
              disabled={isLoading}
            >
              {isLoading ? 'Speichert...' : shouldShowSaveButton ? 'Speichern' : 'Gespeichert'}
            </Button>
          </div>
        </CardTitle>
        <CardDescription>
          {mode === 'create'
            ? 'Erstellen Sie neuen replaceable Inhalt. Ihre Änderungen werden automatisch gesichert.'
            : 'Bearbeiten Sie den Inhalt. Ihre Änderungen werden automatisch gespeichert.'
          }
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>
              Fehler beim Laden des Inhalts: {error.message}
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-3">
          <div>
            <label htmlFor="content" className="block text-sm font-medium mb-2">
              Inhalt
            </label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Geben Sie Ihren Inhalt hier ein..."
              className="min-h-[400px] w-full"
              rows={10}
            />
          </div>

          {mode === 'edit' && (
            <div className="text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <span>💡</span>
                <span>
                  {shouldShowSaveButton
                    ? `Letzte Speicherung: ${lastSavedAt ? new Date(lastSavedAt).toLocaleTimeString() : 'Noch nicht gespeichert'}`
                    : 'Auto-Speicherung ist aktiv'
                  }
                </span>
              </div>
              <p className="text-xs mt-1">
                {shouldShowSaveButton
                  ? `Alle Änderungen werden automatisch alle 2 Sekunden gespeichert.`
                  : 'Auto-Speicherung: ${lastSavedAt ? new Date(lastSavedAt).toLocaleTimeString() : '-'}`
                  }
              </p>
              <p className="text-xs text-muted-foreground">
                Auto-Save: {shouldShowSaveButton ? 'Aktiv' : 'Wartet'}
              </p>
              <p className="text-xs text-muted-foreground">
                Letzte Speicherung: {lastSavedAt ? new Date(lastSavedAt).toLocaleTimeString() : '-'}
              </p>
              <p className="text-xs text-muted-foreground">
                Fenster kann sicher geschlossen werden
              </p>
          )}
        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Zeichenanzahl: {content.length}
          </span>
          <div className="flex items-center gap-4">
            <span className="text-xs">
              Auto-Save: {shouldShowSaveButton ? 'Aktiv' : 'Wartet'}
            </span>
            <span className="text-xs bg-green-100 px-2 py-1 rounded text-green-800">
              1x Event
            </span>
            <span className="text-xs bg-blue-100 px-2 py-1 rounded text-blue-800">
              Replaceable
            </span>
            <span className="text-xs bg-purple-100 px-2 py-1 rounded text-purple-800">
              {dTag}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}