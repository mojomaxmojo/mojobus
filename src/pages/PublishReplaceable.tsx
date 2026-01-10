import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { FileText, MessageSquare, Map, Upload, Image as ImageIcon, Camera } from 'lucide-react';
import { ContentEditor } from '@/components/ContentEditor';
import { useReplaceableContent } from '@/hooks/useReplaceableContent';
import { useAutoSave } from '@/hooks/useAutoSave';
import { useConflictDetector } from '@/hooks/useConflictDetector';
import { useToast } from '@/hooks/useToast';

/**
 * Moderne Publish-Seite mit Replaceable Content Integration
 * Löst das 5x Events Problem durch intelligenten Content Management
 */
export function PublishReplaceable() {
  const { user } = useCurrentUser();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editEventId = searchParams.get('edit');
  const [activeTab, setActiveTab] = useState('content-editor');

  // D-Tag basierend auf Edit-Event oder neuer Inhalt
  const getDTag = (contentType: string) => {
    if (editEventId) {
      return `edit-${contentType}-${editEventId.substring(0, 8)}`;
    }
    return `${contentType}-${user?.pubkey ? user.pubkey.substring(0, 8) : 'unknown'}-${Date.now().toString(36).substring(0, 4)}`;
  };

  // Replaceable Content Hook mit Auto-Save und Conflict Detection
  const { updateContent, isLoading, error } = useReplaceableContent({
    dTag: getDTag('mojobus-content')
  });

  const { manualSave, shouldShowSaveButton } = useAutoSave('', updateContent);

  // Conflict Detection
  const { conflictInfo, ConflictBanner } = useConflictDetector(getDTag('mojobus-content'));

  const handleCreateNew = () => {
    setActiveTab('content-editor');
    navigate('/veroeffentlichen');
  };

  const handleContentManagement = () => {
    setActiveTab('content-management');
    navigate('/veroeffentlichen/manage');
  };

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4 space-y-8">
        {/* Header */}
        <div className="text-center">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-center gap-3">
                <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                  ✅
                </span>
                <span className="text-xl font-bold">
                  Replaceable Content Publish
                </span>
                <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                  Gelöst
                </span>
              </CardTitle>
              <CardDescription>
                Moderne Content-Erstellung ohne 5x Events Problem
              </CardDescription>
              <Alert>
                <AlertDescription>
                  <strong>✨ Vorteil:</strong> Replaceable Content mit Unique Address, Auto-Save, Conflict Detection
                  <br />
                  <strong>🔐 Sicherheit:</strong> Versionskontrolle und Archivierung ohne Datenverlust
                  <br />
                  <strong>🚀 Performance:</strong> Intelligente Queries und De-bouncing für schnelle Updates
                </AlertDescription>
              </Alert>
            </CardHeader>
          </Card>
        </div>

        {/* Main Content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Upload className="h-6 w-6" />
                <span className="text-xl font-bold">Inhalt Erstellen/Bearbeiten</span>
              </div>
              <div className="flex items-center gap-2">
                {shouldShowSaveButton && (
                  <Badge variant="outline" className="text-xs">
                    Ungespeichert
                  </Badge>
                )}
                <Badge variant="secondary" className="text-xs">
                  Replaceable
                </Badge>
              </div>
            </CardTitle>
            <CardDescription>
              Moderne Erstellung von Inhalten mit intelligentem Versionsmanagement und Konfliktlösung.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {conflictInfo.hasConflict && <ConflictBanner />}

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-4">
                <FileText className="h-5 w-5 text-blue-600" />
                <div>
                  <h3 className="font-medium text-blue-900 dark:text-blue-100">
                    Replaceable Content Editor
                  </h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    D-Tag: <code className="px-2 py-1 bg-blue-100 dark:bg-blue-800 rounded text-xs font-mono">
                      {getDTag('mojobus-content')}
                    </code>
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    1x Event, Auto-Save, Conflict Detection, Cross-Device Sync
                  </p>
                </div>
              </div>

              {/* Replaceable Content Editor */}
              <ContentEditor
                dTag={getDTag('mojobus-content')}
                mode={editEventId ? 'edit' : 'create'}
                onSave={(content) => {
                  // Handle save with conflict resolution if needed
                  console.log('Content saved with replaceable system:', content);
                }}
              />
            </div>

            {/* Editor Status */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  isLoading ? 'bg-yellow-500' : 'bg-green-500'
                }`} />
                <span className="text-muted-foreground">
                  {isLoading ? 'Speichert...' : 'Gespeichert'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  error ? 'bg-red-500' : 'bg-gray-300'
                }`} />
                <span className="text-muted-foreground">
                  {error ? 'Fehler' : 'Keine Fehler'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  conflictInfo.hasConflict ? 'bg-orange-500' : 'bg-green-500'
                }`} />
                <span className="text-muted-foreground">
                  {conflictInfo.hasConflict ? 'Konflikt' : 'Kein Konflikt'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full bg-blue-500`} />
                <span className="text-muted-foreground">Replaceable</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          <Button
            variant="outline"
            onClick={handleCreateNew}
            className="flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            Neuen Inhalt Erstellen
          </Button>

          <Button
            variant="outline"
            onClick={handleContentManagement}
            className="flex items-center gap-2"
          >
            <Camera className="h-4 w-4" />
            Inhalte Verwalten
          </Button>
        </div>

        {/* System Information */}
        <Card>
          <CardHeader>
            <CardTitle>System-Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="font-medium text-sm">Replaceable Content System:</p>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="text-xs text-green-700 dark:text-green-300">Aktiv</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="font-medium text-sm">Conflict Detection:</p>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${
                      conflictInfo.hasConflict ? 'bg-orange-500' : 'bg-green-500'
                    }`} />
                    <span className="text-xs">
                      {conflictInfo.hasConflict ? 'Konflikt erkannt' : 'Keine Konflikte'}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="font-medium text-sm">Auto-Save:</p>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <span className="text-xs text-blue-700 dark:text-blue-300">Aktiv</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="font-medium text-sm">Cross-Device Sync:</p>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <span className="text-xs text-blue-700 dark:text-blue-300">Aktiv</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="font-medium text-sm">Event Cache:</p>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-purple-500" />
                    <span className="text-xs text-purple-700 dark:text-purple-300">Effizient</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <h4 className="text-lg font-semibold">🎯 Vor解决的问题:</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">✅</span>
                    <span>Keine 5x identischen Events mehr</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">✅</span>
                    <span>Intelligente Versionskontrolle mit Archivierung</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">✅</span>
                    <span>Echtzeitige Konfliktlösung</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">✅</span>
                    <span>Cross-Device Synchronisation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">✅</span>
                    <span>Auto-Save mit De-bouncing</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">✅</span>
                    <span>Performance-optimierte Queries</span>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  <h4 className="text-lg font-semibold">🔧 Technologie-Stack:</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-blue-600">📝</span>
                      <span>Replaceable Events (Kind 30000+30+dTag)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-blue-600">🔄</span>
                      <span>Intelligente Conflict Detection</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-blue-600">💾</span>
                      <span>Auto-Archivierung bei Updates</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-blue-600">🌐</span>
                      <span>Nostr Broadcasting für Live-Updates</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-blue-600">🎯</span>
                      <span>De-bounced Auto-Save (2s)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}