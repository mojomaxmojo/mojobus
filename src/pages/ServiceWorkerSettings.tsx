/**
 * Service Worker Settings Page
 * Ermöglicht die Verwaltung des Service Workers und Caches
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Settings as SettingsIcon,
  RefreshCw,
  Wifi,
  WifiOff,
  Database,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Info,
} from '@/lib/icons';
import {
  isOnline,
  addOnlineStatusListener,
  getCacheVersion,
  clearCaches,
  hasUpdate,
  activateUpdate,
  isCached,
} from '@/lib/serviceWorker';

export function ServiceWorkerSettings() {
  const [online, setOnline] = useState(isOnline());
  const [cacheVersion, setCacheVersion] = useState<number | null>(null);
  const [hasUpdateAvailable, setHasUpdateAvailable] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [cleared, setCleared] = useState(false);
  const [loadingCacheInfo, setLoadingCacheInfo] = useState(false);
  const [cacheInfo, setCacheInfo] = useState({
    totalSize: '0 KB',
    totalEntries: 0,
  });

  useEffect(() => {
    // Online Status überwachen
    const cleanup = addOnlineStatusListener(
      () => setOnline(true),
      () => setOnline(false)
    );

    // Cache Version laden
    loadCacheVersion();

    // Updates überwachen
    loadUpdateStatus();

    // Cache Info laden
    loadCacheInfo();

    // Alle 10 Sekunden aktualisieren
    const interval = setInterval(() => {
      loadCacheVersion();
      loadUpdateStatus();
    }, 10000);

    return () => {
      cleanup();
      clearInterval(interval);
    };
  }, []);

  const loadCacheVersion = async () => {
    try {
      const version = await getCacheVersion();
      setCacheVersion(version);
    } catch (error) {
      console.error('Cache Version abrufen fehlgeschlagen:', error);
    }
  };

  const loadUpdateStatus = async () => {
    try {
      const update = await hasUpdate();
      setHasUpdateAvailable(update);
    } catch (error) {
      console.error('Update Status abrufen fehlgeschlagen:', error);
    }
  };

  const loadCacheInfo = async () => {
    setLoadingCacheInfo(true);
    try {
      // Einfache Schätzung der Cache-Größe
      const cache = await caches.open('mojobus-v1');
      const keys = await cache.keys();
      const entries = keys.length;

      // Schätzung: Durchschnittliche Entry-Größe ~50 KB
      const estimatedSize = entries * 50;
      const formattedSize = formatBytes(estimatedSize);

      setCacheInfo({
        totalSize: formattedSize,
        totalEntries: entries,
      });
    } catch (error) {
      console.error('Cache Info abrufen fehlgeschlagen:', error);
    } finally {
      setLoadingCacheInfo(false);
    }
  };

  const handleClearCache = async () => {
    if (!confirm('Möchtest du wirklich alle Caches leeren? Dies kann zu langsamerem Laden führen, bis die Seiten erneut besucht werden.')) {
      return;
    }

    try {
      setClearing(true);
      await clearCaches();
      setCleared(true);
      loadCacheInfo();
      setTimeout(() => setCleared(false), 3000);
    } catch (error) {
      console.error('Cache leeren fehlgeschlagen:', error);
    } finally {
      setClearing(false);
    }
  };

  const handleActivateUpdate = () => {
    activateUpdate();
    window.location.reload();
  };

  function formatBytes(bytes: number, decimals = 2): string {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <Link to="/settings" className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Zurück zu Einstellungen
        </Link>
        <h1 className="text-3xl font-bold">Service Worker & Cache</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Verwalte Offline-Fähigkeit und Caches
        </p>
      </div>

      {/* Online Status */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {online ? (
              <>
                <Wifi className="h-5 w-5 text-green-600" />
                Online
              </>
            ) : (
              <>
                <WifiOff className="h-5 w-5 text-red-600" />
                Offline
              </>
            )}
          </CardTitle>
          <CardDescription>
            {online
              ? 'Dein Gerät ist mit dem Internet verbunden'
              : 'Dein Gerät hat keine Internetverbindung. Einige Funktionen sind möglicherweise nicht verfügbar.'}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Service Worker Status */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="h-5 w-5" />
            Service Worker Status
          </CardTitle>
          <CardDescription>
            Service Worker ermöglicht Offline-Fähigkeit und verbessertes Caching
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Cache Version</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                v{cacheVersion ?? 'Unbekannt'}
              </div>
            </div>
            <Badge variant={online ? 'default' : 'secondary'}>
              {online ? 'Aktiv' : 'Inaktiv'}
            </Badge>
          </div>

          <Separator />

          {hasUpdateAvailable && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                <div className="flex-1">
                  <div className="font-medium text-yellow-900 dark:text-yellow-100">
                    Neue Version verfügbar
                  </div>
                  <div className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                    Ein Update für den Service Worker ist verfügbar. Drücke auf "Update" um die neue Version zu laden.
                  </div>
                </div>
                <Button size="sm" onClick={handleActivateUpdate}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Update
                </Button>
              </div>
            </div>
          )}

          {!hasUpdateAvailable && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                <div className="flex-1">
                  <div className="font-medium text-green-900 dark:text-green-100">
                    Service Worker ist auf dem neuesten Stand
                  </div>
                  <div className="text-sm text-green-700 dark:text-green-300 mt-1">
                    Du verwendest die neueste Version des Service Workers.
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cache Information */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Cache Information
          </CardTitle>
          <CardDescription>
            Übersicht über gecachte Inhalte und Speichernutzung
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loadingCacheInfo ? (
            <div className="flex items-center justify-center py-4">
              <RefreshCw className="h-5 w-5 animate-spin text-gray-400" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium">Geschätzte Größe</div>
                  <div className="text-2xl font-bold">{cacheInfo.totalSize}</div>
                </div>
                <div>
                  <div className="text-sm font-medium">Anzahl Einträge</div>
                  <div className="text-2xl font-bold">{cacheInfo.totalEntries}</div>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <Info className="h-4 w-4 inline mr-1" />
                  Cache enthält statische Assets, JavaScript-Chunks, Stylesheets und Bilder.
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Gecachte Inhalte werden schneller geladen und funktionieren auch offline.
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">Cache leeren</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Löscht alle gecachten Inhalte
                  </div>
                </div>
                <Button
                  variant={cleared ? 'default' : 'destructive'}
                  onClick={handleClearCache}
                  disabled={clearing}
                >
                  {clearing ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Leere...
                    </>
                  ) : cleared ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Geleert
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Cache leeren
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Cache Strategie */}
      <Card>
        <CardHeader>
          <CardTitle>Cache-Strategie</CardTitle>
          <CardDescription>
            Wie die App verschiedene Ressourcen cached
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5" />
              <div>
                <div className="font-medium">Cache-First</div>
                <div className="text-gray-600 dark:text-gray-400">
                  Assets, Icons, Fonts (sofort aus Cache)
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5" />
              <div>
                <div className="font-medium">Network-First</div>
                <div className="text-gray-600 dark:text-gray-400">
                  App Code, API-Requests (frische Daten)
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-yellow-500 mt-1.5" />
              <div>
                <div className="font-medium">Stale-While-Revalidate</div>
                <div className="text-gray-600 dark:text-gray-400">
                  HTML-Seiten (schnelles Laden + Hintergrund-Update)
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5" />
              <div>
                <div className="font-medium">Network-Only</div>
                <div className="text-gray-600 dark:text-gray-400">
                  Nostr-Queries, WebSockets (immer frische Daten)
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ServiceWorkerSettings;
