import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useReplaceableContentSimple } from '@/hooks/useReplaceableContentSimple';
import { useToast } from '@/hooks/useToast';

interface ContentEditorMinimalProps {
  dTag: string;
  initialContent?: string;
  onSave?: (content: string) => void;
  mode?: 'create' | 'edit';
}

/**
 * Minimalistischer Content Editor mit Replaceable Content
 * Solve 5x Events Problem with simplest approach
 */
export function ContentEditorMinimal({ dTag, initialContent = '', onSave, mode = 'create' }: ContentEditorMinimalProps) {
  const [content, setContent] = useState(initialContent);
  const { updateContent, isLoading } = useReplaceableContentSimple({ dTag });
  const { toast } = useToast();

  const handleSave = useCallback(async () => {
    if (!content.trim()) {
      toast({
        title: 'Fehler',
        description: 'Bitte geben Sie einen Inhalt ein.',
        duration: 3000,
        variant: 'destructive'
      });
      return;
    }

    try {
      await updateContent(content);
      
      if (onSave) {
        onSave(content);
      }

      toast({
        title: 'Gespeichert',
        description: 'Replaceable Inhalt wurde erfolgreich gespeichert.',
        duration: 3000,
        variant: 'default'
      });
    } catch (error) {
      toast({
        title: 'Fehler',
        description: error.message || 'Der Inhalt konnte nicht gespeichert werden.',
        duration: 5000,
        variant: 'destructive'
      });
    }
  }, [content, updateContent, onSave, toast]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold">
              {mode === 'create' ? '📝 Erstellen' : '✏️ Bearbeiten'}
            </span>
            <span className="text-sm font-medium">
              Replaceable Content ({dTag})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              1x Event
            </Badge>
            <Badge variant="outline" className="text-xs text-green-600">
              Replaceable
            </Badge>
            {isLoading && (
              <Badge variant="outline" className="text-xs">
                Speichert...
              </Badge>
            )}
          </div>
        </CardTitle>
        <CardDescription>
          {mode === 'create' 
            ? 'Erstelle neuen replaceable Inhalt. 1 Event pro Inhalt.'
            : 'Bearbe bestehenden Inhalt. Alte Version wird überschrieben.'
          }
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {isLoading && (
          <Alert>
            <AlertDescription>
              Speichert Inhalt...
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
              className="min-h-[300px] w-full"
              rows={8}
            />
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Zeichenanzahl: {content.length}
            </span>
            <div className="flex items-center gap-4">
              <span className="text-xs">
                D-Tag: <code className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">{dTag}</code>
              </span>
              <span className="text-xs bg-green-100 px-2 py-1 rounded text-green-800">
                1x Events
              </span>
              <span className="text-xs bg-blue-100 px-2 py-1 rounded text-blue-800">
                Replaceable
              </span>
            </div>
          </div>
        </div>

        <Button
          onClick={handleSave}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? 'Speichert...' : mode === 'create' ? 'Erstellen' : 'Aktualisieren'}
        </Button>

        <div className="mt-6 space-y-4">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4">✅ Replaceable Content System</h3>
            <div className="space-y-2 text-sm">
              <p className="flex items-center gap-2">
                <span className="text-green-600">✅</span>
                <span className="font-medium">1x Event Prinzip:</span>
                <span className="text-muted-foreground">Keine 5x Events mehr</span>
              </p>
              <p className="flex items-center gap-2">
                <span className="text-blue-600">🔧</span>
                <span className="font-medium">Replaceable Events:</span>
                <span className="text-muted-foreground">Kind 30000+30+dTag</span>
              </p>
              <p className="flex items-center gap-2">
                <span className="text-purple-600">🏷️</span>
                <span className="font-medium">Einzigartige Adressen:</span>
                <span className="text-muted-foreground">d-Tag pro Inhalt</span>
              </p>
              <p className="flex items-center gap-2">
                <span className="text-orange-600">🔄</span>
                <span className="font-medium">Automatische Aktualisierung:</span>
                <span className="text-muted-foreground">Neue Events überschreiben alte</span>
              </p>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4">🚀 Technische Details</h3>
            <div className="space-y-2 text-sm">
              <p><strong>Nostr Event Kind:</strong> <code className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">30000 + 30 + dTag</code></p>
              <p><strong>d-Tag:</strong> <code className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">{dTag}</code></p>
              <p><strong>Content:</strong> {content.length} Zeichen</p>
              <p><strong>Mode:</strong> {mode}</p>
              <p><strong>Replaceable:</strong> Ja (Events mit gleichem d-tag werden überschrieben)</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}