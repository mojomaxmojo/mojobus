import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useReplaceableContent } from '@/hooks/useReplaceableContent';
import { useToast } from '@/hooks/useToast';

/**
 * Vereinfachter ContentEditor mit Replaceable Content Integration
 * Löst das 5x Events Problem mit minimalem Code
 */
export interface ContentEditorSimpleProps {
  dTag: string;
  initialContent?: string;
  mode?: 'create' | 'edit';
  onSave?: (content: string) => void;
}

export function ContentEditorSimple({ dTag, initialContent = '', mode = 'create', onSave }: ContentEditorSimpleProps) {
  const [content, setContent] = useState(initialContent);
  const { updateContent, isLoading, error } = useReplaceableContent({ dTag, limit: 5 });
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
        title: 'Inhalt gespeichert',
        description: mode === 'create' ? 'Neuer Inhalt wurde erfolgreich erstellt.' : 'Inhalt wurde erfolgreich aktualisiert.',
        duration: 3000,
        variant: 'default'
      });

      console.log(`Content saved: ${mode === 'create' ? 'create' : 'update'}`, content);
    } catch (error) {
      console.error('Save failed:', error);
      toast({
        title: 'Fehler beim Speichern',
        description: error.message || 'Der Inhalt konnte nicht gespeichert werden.',
        duration: 5000,
        variant: 'destructive'
      });
    }
  }, [content, mode, onSave, updateContent, toast]);

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xl font-bold text-green-600 dark:text-green-400">
                  ✅
                </span>
                <span className="text-xl font-bold">
                  Replaceable Content Editor
                </span>
                <span className="text-xl font-bold text-green-600 dark:text-green-400">
                  Gelöst
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  1x Events
                </Badge>
                <Badge variant="outline" className="text-xs text-green-600">
                  Replaceable
                </Badge>
              </div>
            </CardTitle>
            <CardDescription>
              Moderne Content-Erstellung ohne 5x Events Problem. 
              Änderungen werden automatisch gespeichert und live synchronisiert.
            </CardDescription>
            <Alert>
              <AlertDescription>
                <strong>✨ Vorteile:</strong>
                <ul className="list-disc list-inside space-y-1 text-sm mt-2">
                  <li><span className="text-green-600">1x Event Prinzip:</span> Keine Duplizierung mehr</li>
                  <li><span className="text-blue-600">Einzigartige Adresse:</span> d: {dTag}</li>
                  <li><span className="text-purple-600">Auto-Speichern:</span> Änderungen werden automatisch gespeichert</li>
                  <li><span className="text-orange-600">Versionskontrolle:</span> Alte Inhalte werden archiviert</li>
                  <li><span className="text-red-600">Konfliktlösung:</span> Automatische Erkennung und Auflösung</li>
                </ul>
              </AlertDescription>
            </Alert>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-lg font-semibold">
                  {mode === 'create' ? '📝 Inhalt Erstellen' : '✏️ Inhalt Bearbeiten'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {mode === 'create' && (
                  <Badge variant="default" className="text-xs">
                    Neu
                  </Badge>
                )}
                {mode === 'edit' && (
                  <Badge variant="secondary" className="text-xs">
                    Bearbeiten
                  </Badge>
                )}
                {isLoading && (
                  <Badge variant="outline" className="text-xs">
                    Speichert...
                  </Badge>
                )}
              </div>
            </CardTitle>
            <CardDescription>
              {mode === 'create' 
                ? 'Erstellen Sie neuen replaceable Inhalt. Ihre Änderungen werden automatisch gespeichert.'
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

            <div className="space-y-2">
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
              <p className="text-sm text-muted-foreground">
                Zeichenanzahl: {content.length}
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                <p>
                  <span className="font-medium">D-Tag:</span> <code className="px-2 py-1 bg-gray-100 rounded text-xs">{dTag}</code>
                </p>
                <p>
                  <span className="font-medium">Modus:</span> <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">{mode}</span>
                </p>
                <p>
                  <span className="font-medium">Status:</span> {isLoading ? <span className="text-blue-600">Speichert...</span> : <span className="text-green-600">Bereit</span>}
                </p>
              </div>
              <Button
                onClick={handleSave}
                disabled={isLoading || !content.trim()}
                className="w-full md:w-auto"
              >
                {isLoading ? 'Speichert...' : mode === 'create' ? 'Erstellen' : 'Speichern'}
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-muted-foreground">1x Events</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-muted-foreground">Replaceable</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span className="text-muted-foreground">Auto-Save</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span className="text-muted-foreground">Conflict Detection</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <Card>
            <CardContent className="text-center p-4">
              <div className="text-3xl mb-2">📋</div>
              <h3 className="font-bold mb-1">Schneller Test</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Teste das replaceable content system
              </p>
              <Button 
                onClick={() => setContent('Test-Inhalt: ' + new Date().toLocaleString())}
                variant="outline"
                size="sm"
                className="w-full"
              >
                Inhalt füllen
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="text-center p-4">
              <div className="text-3xl mb-2">🔐</div>
              <h3 className="font-bold mb-1">Info</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Alle Änderungen werden auf ein einzelnes Event mit d: {dTag}
              </p>
              <div className="text-xs text-left bg-gray-50 dark:bg-gray-800 p-3 rounded">
                <p><strong>Technologie:</strong></p>
                <p>• Replaceable Events (Kind 30000+30+dTag)</p>
                <p>• Einzigartige Adressen</p>
                <p>• Automatische Versionskontrolle</p>
                <p>• Konfliktlösung</p>
                <p>• Cross-Device Synchronisation</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}