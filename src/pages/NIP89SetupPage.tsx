/**
 * NIP-89 Setup Seite
 * Erreichbar unter: /settings/nostr-handler
 */

import { Link } from 'react-router-dom';
import { useNIP89 } from '@/hooks/useNIP89';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Loader2,
  Zap,
  Globe,
  FileText,
  MessageSquare,
  User,
  RefreshCw,
  ExternalLink,
  Info,
  Radio,
  ShieldCheck,
} from 'lucide-react';

// ============================================================================
// STATUS BADGE
// ============================================================================

function StatusBadge({ exists, loading }: { exists: boolean; loading: boolean }) {
  if (loading) {
    return (
      <Badge variant="secondary" className="flex items-center gap-1">
        <Loader2 className="h-3 w-3 animate-spin" />
        Prüfe...
      </Badge>
    );
  }
  if (exists) {
    return (
      <Badge className="flex items-center gap-1 bg-green-600 hover:bg-green-700">
        <CheckCircle className="h-3 w-3" />
        Registriert
      </Badge>
    );
  }
  return (
    <Badge variant="destructive" className="flex items-center gap-1">
      <XCircle className="h-3 w-3" />
      Nicht registriert
    </Badge>
  );
}

// ============================================================================
// KIND KARTE
// ============================================================================

function KindCard({
  kind,
  icon: Icon,
  label,
  description,
  example,
}: {
  kind: number;
  icon: React.ElementType;
  label: string;
  description: string;
  example: string;
}) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm">{label}</span>
          <Badge variant="outline" className="font-mono text-xs">
            kind:{kind}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        <p className="text-xs font-mono text-muted-foreground/70 mt-1 truncate">{example}</p>
      </div>
    </div>
  );
}

// ============================================================================
// RELAY LISTE
// ============================================================================

function RelayList({ relays }: { relays: string[] }) {
  return (
    <div className="space-y-1">
      {relays.map((relay) => (
        <div
          key={relay}
          className="flex items-center gap-2 text-xs font-mono text-muted-foreground p-1.5 rounded bg-muted/50"
        >
          <Radio className="h-3 w-3 shrink-0 text-green-500" />
          {relay}
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// HAUPTSEITE
// ============================================================================

export function NIP89SetupPage() {
  const { user } = useCurrentUser();
  const {
    status,
    isLoadingStatus,
    isRegistered,
    publish,
    isPublishing,
    update,
    isUpdating,
    config,
  } = useNIP89();

  const isWorking = isPublishing || isUpdating;

  // --------------------------------------------------------------------------
  // Kein Login
  // --------------------------------------------------------------------------
  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-6">
          <Button asChild variant="ghost" size="sm">
            <Link to="/settings">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Zurück zu Einstellungen
            </Link>
          </Button>
        </div>
        <Card className="border-dashed">
          <CardContent className="py-16 text-center space-y-4">
            <ShieldCheck className="h-12 w-12 mx-auto text-muted-foreground" />
            <h2 className="text-xl font-semibold">Login erforderlich</h2>
            <p className="text-muted-foreground max-w-sm mx-auto">
              Um MojoBus als Nostr App-Handler zu registrieren, musst du mit
              deinem Nostr-Konto eingeloggt sein.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // Hauptinhalt
  // --------------------------------------------------------------------------
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">

      {/* Header */}
      <div className="mb-6">
        <Button asChild variant="ghost" size="sm">
          <Link to="/settings">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück zu Einstellungen
          </Link>
        </Button>
      </div>

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Globe className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">NIP-89 App Handler</h1>
            <p className="text-sm text-muted-foreground">
              MojoBus als offiziellen Nostr Content-Handler registrieren
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">

        {/* ---------------------------------------------------------------- */}
        {/* WAS IST NIP-89? */}
        {/* ---------------------------------------------------------------- */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Info className="h-4 w-4" />
              Was ist NIP-89?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              <strong className="text-foreground">NIP-89</strong> ist ein Nostr-Standard, mit dem
              Anwendungen ankündigen können, welche Event-Typen sie anzeigen können.
            </p>
            <p>
              Wenn ein Nostr-Client wie <strong className="text-foreground">Amethyst</strong>,{' '}
              <strong className="text-foreground">Damus</strong> oder{' '}
              <strong className="text-foreground">Snort</strong> auf ein Artikel- oder Note-Event
              trifft, zeigt er dem Nutzer an:{' '}
              <em className="text-foreground">"In MojoBus öffnen"</em> – und leitet direkt
              zu mojobus.co weiter.
            </p>
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-foreground">
              <strong>Ergebnis:</strong> Passiver, organischer Traffic aus dem gesamten
              Nostr-Ökosystem – ohne laufenden Aufwand nach der einmaligen Registrierung.
            </div>
          </CardContent>
        </Card>

        {/* ---------------------------------------------------------------- */}
        {/* AKTUELLER STATUS */}
        {/* ---------------------------------------------------------------- */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="h-4 w-4" />
              Registrierungsstatus
            </CardTitle>
            <CardDescription>
              Aktueller Stand der NIP-89 Registrierung auf den Nostr-Relays
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">

            {/* Handler Event */}
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <div className="font-medium text-sm">App-Handler</div>
                <div className="text-xs text-muted-foreground font-mono">kind:31990</div>
                {status?.handler.createdAt && (
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Publiziert:{' '}
                    {new Date(status.handler.createdAt * 1000).toLocaleDateString('de-DE', {
                      day: '2-digit', month: '2-digit', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </div>
                )}
              </div>
              <StatusBadge exists={status?.handler.exists ?? false} loading={isLoadingStatus} />
            </div>

            {/* Recommendation Events */}
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <div className="font-medium text-sm">Empfehlungen</div>
                <div className="text-xs text-muted-foreground font-mono">
                  kind:31989 (×{config.supportedKinds.length})
                </div>
                {status?.recommendation.createdAt && (
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Publiziert:{' '}
                    {new Date(status.recommendation.createdAt * 1000).toLocaleDateString('de-DE', {
                      day: '2-digit', month: '2-digit', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </div>
                )}
              </div>
              <StatusBadge
                exists={status?.recommendation.exists ?? false}
                loading={isLoadingStatus}
              />
            </div>

            {/* Gesamt-Status */}
            {!isLoadingStatus && (
              <div className={`p-3 rounded-lg text-sm ${
                isRegistered
                  ? 'bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
                  : 'bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200'
              }`}>
                {isRegistered ? (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 shrink-0" />
                    <span>
                      MojoBus ist als Nostr App-Handler registriert. Andere Clients können
                      Inhalte jetzt direkt auf mojobus.co öffnen.
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 shrink-0" />
                    <span>
                      MojoBus ist noch nicht registriert. Klicke auf "Jetzt registrieren".
                    </span>
                  </div>
                )}
              </div>
            )}

            {isLoadingStatus && (
              <div className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* ---------------------------------------------------------------- */}
        {/* UNTERSTÜTZTE CONTENT-TYPEN */}
        {/* ---------------------------------------------------------------- */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4" />
              Unterstützte Content-Typen
            </CardTitle>
            <CardDescription>
              Diese Event-Kinds meldet MojoBus als verarbeitbar an
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <KindCard
              kind={30023}
              icon={FileText}
              label="Long-form Artikel"
              description="Vollständige Blog-Artikel mit Markdown, Bilder und Zaps – angezeigt auf /artikel"
              example="https://mojobus.co/naddr1..."
            />
            <KindCard
              kind={1}
              icon={MessageSquare}
              label="Short Notes"
              description="Kurze Textbeiträge – angezeigt auf /notes"
              example="https://mojobus.co/note1..."
            />
            <KindCard
              kind={0}
              icon={User}
              label="Profile"
              description="Nostr-Nutzerprofile mit Avatar, Bio und Links"
              example="https://mojobus.co/npub1..."
            />
          </CardContent>
        </Card>

        {/* ---------------------------------------------------------------- */}
        {/* URL-SCHEMA */}
        {/* ---------------------------------------------------------------- */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ExternalLink className="h-4 w-4" />
              URL-Schema
            </CardTitle>
            <CardDescription>
              So werden Nostr-Links auf mojobus.co aufgelöst
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 font-mono text-xs">
              {[
                { type: 'naddr1...', label: 'Artikel', url: 'https://mojobus.co/naddr1...' },
                { type: 'note1...', label: 'Note', url: 'https://mojobus.co/note1...' },
                { type: 'nevent1...', label: 'Event', url: 'https://mojobus.co/nevent1...' },
                { type: 'npub1...', label: 'Profil', url: 'https://mojobus.co/npub1...' },
                { type: 'nprofile1...', label: 'Profil+Relay', url: 'https://mojobus.co/nprofile1...' },
              ].map(({ label, url }) => (
                <div key={url} className="flex items-center gap-2 p-2 rounded bg-muted/50">
                  <Badge variant="outline" className="shrink-0 text-xs">{label}</Badge>
                  <span className="text-muted-foreground truncate">{url}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ---------------------------------------------------------------- */}
        {/* RELAYS */}
        {/* ---------------------------------------------------------------- */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Radio className="h-4 w-4" />
              Publish-Relays
            </CardTitle>
            <CardDescription>
              Die Handler-Events werden auf diesen {config.publishRelays.length} öffentlichen Relays veröffentlicht
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RelayList relays={config.publishRelays} />
          </CardContent>
        </Card>

        {/* ---------------------------------------------------------------- */}
        {/* AKTIONS-BUTTONS */}
        {/* ---------------------------------------------------------------- */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Zap className="h-4 w-4" />
              Registrierung
            </CardTitle>
            <CardDescription>
              {isRegistered
                ? 'MojoBus ist bereits registriert. Du kannst die Registrierung aktualisieren.'
                : 'Registriere MojoBus als offiziellen Nostr App-Handler auf allen Relays.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">

            <div className="p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground space-y-1">
              <p><strong className="text-foreground">Was passiert beim Klicken?</strong></p>
              <ul className="space-y-1 ml-3 list-disc">
                <li>
                  1× <code className="bg-muted px-1 rounded">kind:31990</code> Handler-Event
                  wird signiert und publiziert
                </li>
                <li>
                  {config.supportedKinds.length}×{' '}
                  <code className="bg-muted px-1 rounded">kind:31989</code> Empfehlungs-Events
                  werden signiert und publiziert
                </li>
                <li>
                  Insgesamt auf{' '}
                  <strong className="text-foreground">{config.publishRelays.length} Relays</strong>{' '}
                  veröffentlicht
                </li>
                <li>Deine NIP-07 Extension wird um Signatur gebeten</li>
              </ul>
            </div>

            <Separator />

            <div className="flex flex-col sm:flex-row gap-3">
              {!isRegistered ? (
                <Button
                  onClick={() => publish()}
                  disabled={isWorking || isLoadingStatus}
                  className="flex-1"
                  size="lg"
                >
                  {isPublishing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Publiziere auf {config.publishRelays.length} Relays...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      Jetzt registrieren
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={() => update()}
                  disabled={isWorking || isLoadingStatus}
                  variant="outline"
                  className="flex-1"
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Aktualisiere...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Registrierung aktualisieren
                    </>
                  )}
                </Button>
              )}
            </div>

            {isWorking && (
              <p className="text-xs text-muted-foreground text-center animate-pulse">
                Bitte warten – Events werden auf allen Relays publiziert...
              </p>
            )}
          </CardContent>
        </Card>

        {/* ---------------------------------------------------------------- */}
        {/* WEITERFÜHRENDE LINKS */}
        {/* ---------------------------------------------------------------- */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Weiterführende Informationen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <a
              href="https://github.com/nostr-protocol/nips/blob/master/89.md"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-primary hover:underline"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              NIP-89 Spezifikation auf GitHub
            </a>
            <a
              href="https://nostr.band/?q=kind%3A31990"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-primary hover:underline"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Alle kind:31990 Events auf nostr.band
            </a>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}

export default NIP89SetupPage;
