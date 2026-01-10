import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ContentEditor } from '@/components/ContentEditor';
import { useReplaceableContent } from '@/hooks/useReplaceableContent';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { formatDistanceToNow } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/useToast';

/**
 * Seite für die Verwaltung von replaceable content
 * Löst das Problem der 5x identischen Events
 */
export function ContentEditorPage() {
  const [activeDTag, setActiveDTag] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'create' | 'existing'>('existing');
  const { toast } = useToast();

  // Lade die replaceable contents mit spezifischem d-tag
  const { data: contents = [], isLoading, error } = useReplaceableContent({ dTag: activeDTag || 'general' });

  // Tab-Konfiguration
  const tabs = [
    { id: 'create', label: 'Neuer Inhalt', icon: '✏️' },
    { id: 'existing', label: 'Bestehende Inhalte', icon: '📝' },
  ];

  const handleCreateContent = () => {
    setActiveDTag('general'); // Standard d-tag für allgemeine Inhalte
    setActiveTab('create');
  };

  const handleDTagChange = (dTag: string) => {
    setActiveDTag(dTag);
    if (activeTab === 'create') {
      setActiveDTag(''); // Reset für create-Tab
    }
  };

  const handleNewContent = () => {
    setActiveTab('create');
  };

  const handleBack = () => {
    window.history.back();
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-2">
                    ✏️
                    <span className="text-xl font-bold">Replaceable Content Editor</span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    Problem gelöst
                  </Badge>
                </div>
              </CardTitle>
              <Alert>
                <AlertDescription>
                  Löst das Problem der 5x identischen Events durch die Nutzung von replaceable Kind (30000+dTag).
                  Alle Inhalte haben eine einzigartige Adresse und können einfach bearbeitet werden.
                </AlertDescription>
              </Alert>
            </CardHeader>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="flex items-center gap-2"
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value="create" className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Neuen Replaceable Inhalt erstellen
              </h2>
              <p className="text-muted-foreground">
                Geben Sie einen spezifischen d-tag ein und erstellen Sie replaceable Inhalte.
                Diese haben eine einzigartige Adresse und können jederzeit aktualisiert werden.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <Input
                placeholder="Spezifischer d-tag (z.B. 'mojobus-home')"
                value={activeDTag}
                onChange={(e) => setActiveDTag(e.target.value)}
                className="col-span-full md:col-span-1"
              />
              <Button 
                onClick={handleCreateContent}
                className="col-span-full md:col-span-2"
                variant="outline"
              >
                Weiter zum Editor
              </Button>
            </div>

            {activeDTag && (
              <ContentEditor
                dTag={activeDTag}
                mode="create"
                onSave={(content) => {
                  toast({
                    title: 'Inhalt erstellt',
                    description: `Replaceable Inhalt mit d-tag "${activeDTag}" wurde erfolgreich erstellt.`,
                    duration: 3000,
                  variant: 'default'
                  });
                }}
              />
            )}
          </TabsContent>

          <TabsContent value="existing" className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Bestehende Replaceable Inhalte verwalten
              </h2>
              <p className="text-muted-foreground">
                Bearbeiten oder verwalten Sie Ihre bestehenden replaceable Inhalte.
                Jede Änderung überschreibt die vorherige Version.
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  placeholder="Spezifischer d-tag filtern (leer für alle)"
                  value={activeDTag}
                  onChange={(e) => setActiveDTag(e.target.value)}
                  className="col-span-full md:col-span-1"
                />
                <Button 
                  onClick={handleNewContent}
                  className="col-span-full md:col-span-2"
                  variant="outline"
                >
                  Neu erstellen
                </Button>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Inhalt</TableHead>
                  <TableHead>Letzte Aktualisierung</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-200 border-t-gray-200"></div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
                {error && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center">
                      <Alert variant="destructive">
                        <AlertDescription>
                          Fehler beim Laden der Inhalte: {error.message}
                        </AlertDescription>
                      </Alert>
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && !error && contents.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      <div className="text-center space-y-2">
                        <div className="text-6xl mb-2">📄</div>
                        <p className="text-muted-foreground">
                          Keine replaceable Inhalte gefunden
                        </p>
                        {activeDTag && (
                          <p className="text-sm">
                            Für d-tag: <code className="px-1 py-0 bg-gray-100 rounded">{activeDTag}</code>
                          </p>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && !error && contents.map((content) => (
                  <TableRow key={content.id}>
                    <TableCell className="max-w-xs">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-xs font-mono">
                        {content.dTag.charAt(0).toUpperCase()}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-md truncate">
                      <div className="font-medium">{content.content.slice(0, 50)}...</div>
                      {content.content.length > 50 && (
                        <span className="text-muted-foreground text-sm">({content.content.length} Zeichen)</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDistanceToNow(content.created_at)}
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="flex items-center gap-2">
                        {content.updated_at && (
                          <Badge variant="outline" className="text-xs">
                            Aktualisiert
                          </Badge>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.location.href = `/editor/${content.id}`}
                        >
                          Bearbeiten
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>
        </Tabs>
      </Tabs>
      </div>

      <div className="text-center mt-6">
        <Button variant="outline" onClick={handleBack}>
          Zurück zur Übersicht
        </Button>
      </div>
    </div>
  );
}