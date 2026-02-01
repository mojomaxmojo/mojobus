import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ImagePlaceholder } from '@/components/ImagePlaceholder';
import { useLongformArticles, usePlaces, extractArticleMetadata } from '@/hooks/useLongformArticles';
import { useNotes } from '@/hooks/useNotes';
import { useNostr } from '@nostrify/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { NOSTR_CONFIG } from '@/config/nostr';
import { useAuthor } from '@/hooks/useAuthor';
import { genUserName } from '@/lib/genUserName';
import { Waves, Compass, Sun, Anchor, MapPin, RefreshCw } from 'lucide-react';
import { nip19 } from 'nostr-tools';
import { memo } from 'react';
import type { NostrEvent } from '@nostrify/nostrify';
import { getListThumbnailUrl, getImagePlaceholder, generateSrcset, generateSizes } from '@/lib/imageUtils';
import { useHead } from '@unhead/react';
import { DEFAULT_PERFORMANCE_CONFIG } from '@/config/performance';
import { SocialBar } from '@/components/SocialBar';
import { useToast } from '@/hooks/useToast';

type ContentItem = {
  type: 'article' | 'note' | 'image' | 'place';
  event: NostrEvent;
  date: number;
  thumbnailUrl?: string;
};

export function Home() {
  const { nostr } = useNostr();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // SEO Meta Tags
  useHead({
    title: 'MojoBus - Perpetual Traveler Blog',
    meta: [
      { name: 'description', content: 'Perpetual Traveler Blog. Unser Leben am Meer, vanlife, offgrid und Reisen. Geschichten, Tipps und Einblicke vom Strand.' },
      { name: 'keywords', content: 'Vanlife, Reisen, Portugal, Spanien, Frankreich, Offgrid, Solar, RV' },
      { property: 'og:title', content: 'MojoBus - Perpetual Traveler Blog' },
      { property: 'og:description', content: 'Perpetual Traveler Blog. Unser Leben am Meer, vanlife, offgrid und Reisen.' },
      { property: 'og:type', content: 'website' }
    ],
      link: [
        { rel: 'canonical', href: 'https://mojobus.co' }
    ]
  });

  // PERFORMANCE-OPTIMIERUNG: Home-Spezifische Limits
  // Wir zeigen nur 6 Elemente auf der Home-Seite, laden aber:
  // VORHER: 230 Events (50 Artikel + 60 Plätze + 20 Notes + 100 Bilder) ❌
  // NACHHER: ~60 Events (15 Artikel + 15 Plätze + 15 Notes + 15 Bilder) ✅
  // Das spart ~74% Bandbreite und Ladezeit!
  // Die dedizierten Seiten (/artikel, /plaetze) nutzen ihre eigenen Limits.

  // Refresh-Funktion: Invalidiere und hole alle Daten neu
  const handleRefresh = async () => {
    try {
      toast({
        title: 'Aktualisiere Inhalte...',
        description: 'Lade frische Daten von Nostr',
      });

      // Invalidiere alle relevanten Queries
      await queryClient.invalidateQueries({
        queryKey: ['longform-articles'],
      });
      await queryClient.invalidateQueries({
        queryKey: ['places'],
      });
      await queryClient.invalidateQueries({
        queryKey: ['home-notes'],
      });
      await queryClient.invalidateQueries({
        queryKey: ['home-media'],
      });

      toast({
        title: '✅ Inhalte aktualisiert',
        description: 'Frühe Inhalte werden angezeigt',
      });
    } catch (error) {
      toast({
        title: '❌ Aktualisierung fehlgeschlagen',
        description: 'Bitte versuche es erneut',
        variant: 'destructive',
      });
    }
  };

  const { data: articles, isLoading: articlesLoading } = useLongformArticles({
    kinds: [30023],
    limit: 15, // Optimiert für Home-Seite (nur 6 Elemente werden angezeigt)
  });

  const { data: places, isLoading: placesLoading } = usePlaces({
    limit: 15, // Optimiert für Home-Seite (nur 6 Elemente werden angezeigt)
  });

  const { data: noteEvents = [] } = useQuery({
    queryKey: ['home-notes', NOSTR_CONFIG.authorPubkeys],
    queryFn: async ({ signal }) => {
      const events = await nostr.query([
        {
          kinds: [NOSTR_CONFIG.kinds.note],
          authors: NOSTR_CONFIG.authorPubkeys,
          '#t': ['note', 'notiz'],
          limit: 15, // Optimiert für Home-Seite (nur 6 Elemente werden angezeigt)
        }
      ], { signal: AbortSignal.any([signal!, AbortSignal.timeout(DEFAULT_PERFORMANCE_CONFIG.relay.queryTimeout)]) });
      return events;
    },
    staleTime: DEFAULT_PERFORMANCE_CONFIG.cache.staleTime,
  });

  const { data: imageEvents = [] } = useQuery({
    queryKey: ['home-media', NOSTR_CONFIG.authorPubkeys],
    queryFn: async ({ signal }) => {
      const events = await nostr.query([
        {
          kinds: [1, 30023], // Text notes und longform articles
          authors: NOSTR_CONFIG.authorPubkeys,
          '#t': ['medien', 'media', 'bilder', 'images'],
          limit: 15, // Optimiert für Home-Seite (nur 6 Elemente werden angezeigt)
        }
      ], { signal: AbortSignal.any([signal!, AbortSignal.timeout(DEFAULT_PERFORMANCE_CONFIG.relay.queryTimeout)]) }); // Aus Performance-Konfiguration

      console.log('[Home Page] Image Events Query:', {
        total: events.length,
        limit: 15,
        timeout: DEFAULT_PERFORMANCE_CONFIG.relay.queryTimeout,
        optimization: 'Home-Spezifisches Limit (vorher 100 Events)',
      });

      return events.filter((event) => {
        const content = event.content.toLowerCase();
        return content.includes('.jpg') ||
               content.includes('.jpeg') ||
               content.includes('.png') ||
               content.includes('.gif') ||
               content.includes('.webp') ||
               content.includes('imgur.com') ||
               content.includes('i.imgur.com') ||
               content.includes('cdn.blossom') ||
               content.includes('nostr.build') ||
               content.includes('relay.mojobus.co') ||
               content.includes('relays.mojobus.co') ||
               content.includes('blossom.primal.net');
      });
    },
    staleTime: DEFAULT_PERFORMANCE_CONFIG.cache.staleTime,
  });

  const isLoading = articlesLoading || placesLoading;

  const contentItems: ContentItem[] = [];

  if (articles && Array.isArray(articles)) {
    articles.forEach((event) => {
      const metadata = extractArticleMetadata(event);
      contentItems.push({
        type: 'article',
        event,
        date: event.created_at,
        thumbnailUrl: metadata.image ? getListThumbnailUrl(metadata.image) : undefined
      });
    });
  }

  if (places && Array.isArray(places)) {
    places.forEach((event) => {
      const metadata = extractArticleMetadata(event);
      contentItems.push({
        type: 'place',
        event,
        date: event.created_at,
        thumbnailUrl: metadata.image ? getListThumbnailUrl(metadata.image) : undefined
      });
    });
  }

  if (noteEvents && Array.isArray(noteEvents)) {
    noteEvents.forEach((event) => {
      const imageUrl = extractFirstImageUrl(event.content);
      contentItems.push({
        type: 'note',
        event,
        date: event.created_at,
        thumbnailUrl: imageUrl ? getListThumbnailUrl(imageUrl) : undefined
      });
    });
  }

  if (imageEvents && Array.isArray(imageEvents)) {
    imageEvents.forEach((event) => {
      const imageUrl = extractFirstImageUrl(event.content);
      contentItems.push({
        type: 'image',
        event,
        date: event.created_at,
        thumbnailUrl: imageUrl ? getListThumbnailUrl(imageUrl) : undefined
      });
    });
  }

  const recentItems = contentItems
    .sort((a, b) => b.date - a.date)
    .slice(0, 6);

  return (
    <div className="min-h-screen">
      <section className="relative min-h-[55vh] flex items-center justify-center overflow-hidden">
        {/* Background Image with Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-accent/10 to-background" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/60 to-background" />

        {/* Decorative Background Elements */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

        {/* Content */}
        <div className="relative z-10 container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="flex justify-center mb-6">
              <img
                src="/icon-96x96.png"
                alt="MojoBus Logo"
                width="60"
                height="60"
                className="h-15 w-15 object-contain"
              />
            </div>

            <div className="space-y-4">
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground leading-tight">
                Perpetual Traveler
              </h1>
              <h2 className="text-2xl md:text-4xl font-serif text-muted-foreground leading-relaxed">
                Unser Leben am Meer
              </h2>
            </div>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Kein fester Wohnsitz, kein Alltag im Hamsterrad – nur wir und Soul Leon (Lionhunter), unser RV und das Meer.
              Wir leben als Perpetual Traveler, meist direkt am Strand, autark mit Solarstrom und minimalistisch unterwegs.
            </p>

            <div className="pt-8 flex flex-wrap justify-center gap-4">
              <Button asChild size="lg" className="gap-2 shadow-lg hover:shadow-xl transition-all">
                <Link to="/artikel">
                  <Compass className="h-5 w-5" />
                  Entdecke unsere Geschichten
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={handleRefresh}
                className="gap-2 hover:bg-accent/10 transition-all"
                title="Inhalte aktualisieren"
              >
                <RefreshCw className="h-5 w-5" />
                Aktualisieren
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="pt-16 pb-20">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <p className="text-2xl md:text-3xl font-serif text-muted-foreground leading-relaxed">
                Geschichten, Tipps und Einblicke in unser Leben zwischen Sand und Horizont
              </p>
            </div>

            {isLoading ? (
              <Card className="border-dashed">
                <CardContent className="py-16 px-8 text-center">
                  <LoadingSpinner size="lg" text="Lade Inhalte vom Relay..." />
                </CardContent>
              </Card>
            ) : recentItems.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {recentItems.map((item) => (
                  <ContentCard key={item.event.id} item={item} />
                ))}
              </div>
            ) : (
              <Card className="border-dashed">
                <CardContent className="py-16 text-center">
                  <p className="text-muted-foreground text-lg">
                    Noch keine Inhalte veröffentlicht. Schau bald wieder vorbei! 🌊
                  </p>
                </CardContent>
              </Card>
            )}

            {!isLoading && recentItems.length > 0 && (
              <div className="text-center mt-12">
                <Button asChild variant="outline" size="lg" className="hover:bg-primary hover:text-primary-foreground transition-colors">
                  <Link to="/artikel">Alle Inhalte anzeigen</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="py-20 md:py-28 bg-gradient-to-b from-background via-muted/20 to-background">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="group border-2 hover:border-primary transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
                <CardHeader className="space-y-4">
                  <div className="flex justify-center">
                    <div className="relative">
                      <div className="absolute inset-0 bg-primary/10 rounded-full blur-xl group-hover:bg-primary/20 transition-colors" />
                      <Sun className="h-16 w-16 text-primary relative" />
                    </div>
                  </div>
                  <CardTitle className="text-center text-xl">Freiheit</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-center text-muted-foreground text-base leading-relaxed">
                    Das Rauschen der Wellen ist unser Wecker, Sonnenuntergänge sind unser Alltag.
                  </p>
                </CardContent>
              </Card>

              <Card className="group border-2 hover:border-primary transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
                <CardHeader className="space-y-4">
                  <div className="flex justify-center">
                    <div className="relative">
                      <div className="absolute inset-0 bg-primary/10 rounded-full blur-xl group-hover:bg-primary/20 transition-colors" />
                      <Compass className="h-16 w-16 text-primary relative" />
                    </div>
                  </div>
                  <CardTitle className="text-center text-xl">Abenteuer</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-center text-muted-foreground text-base leading-relaxed">
                    Jeder Tag bringt neue Orte, neue Begegnungen und das Gefühl, wirklich frei zu sein.
                  </p>
                </CardContent>
              </Card>

              <Card className="group border-2 hover:border-primary transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
                <CardHeader className="space-y-4">
                  <div className="flex justify-center">
                    <div className="relative">
                      <div className="absolute inset-0 bg-primary/10 rounded-full blur-xl group-hover:bg-primary/20 transition-colors" />
                      <Anchor className="h-16 w-16 text-primary relative" />
                    </div>
                  </div>
                  <CardTitle className="text-center text-xl">Einfachheit</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-center text-muted-foreground text-base leading-relaxed">
                    Minimalistisch unterwegs mit Solarstrom – autark und unabhängig.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <div className="space-y-4">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight leading-tight">
                Vielleicht ruft es auch dich
              </h2>
              <p className="text-xl md:text-2xl text-muted-foreground font-serif leading-relaxed">
                Nach Abenteuer, Einfachheit und Freiheit. 🌊🚐✨
              </p>
              <p className="text-muted-foreground text-base leading-relaxed">
                Auf Nostr teilen wir unsere Reise – dezentral, zensurresistent und direkt.
              </p>
            </div>
            <div className="pt-4">
              <Button asChild size="lg" variant="outline" className="hover:bg-primary hover:text-primary-foreground transition-all shadow-md hover:shadow-lg">
                <Link to="/about">Mehr über uns erfahren</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function extractFirstImageUrl(content) {
  const urlRegex = /(https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp))/gi;
  const matches = content.match(urlRegex);
  return matches && matches.length > 0 ? matches[0] : null;
}

const ContentCard = memo(function ContentCard({ item }: { item: ContentItem }) {
  const author = useAuthor(item.event.pubkey);
  const authorName = author.data?.metadata?.name || genUserName(item.event.pubkey);

  let title = '';
  let summary = '';
  let link = '';

  if (item.type === 'article' || item.type === 'place') {
    const metadata = extractArticleMetadata(item.event);
    title = metadata.title;
    summary = metadata.summary;

    const naddr = nip19.naddrEncode({
      kind: item.event.kind,
      pubkey: item.event.pubkey,
      identifier: metadata.identifier,
    });
    link = `/${naddr}`;
  } else if (item.type === 'image') {
    title = item.event.content.substring(0, 80);
    const note = nip19.noteEncode(item.event.id);
    link = `/bild/${note}`;
  } else {
    title = item.event.content.substring(0, 80);
    const note = nip19.noteEncode(item.event.id);
    link = `/${note}`;
  }

  const thumbnailUrl = item.thumbnailUrl;
  const srcset = thumbnailUrl ? generateSrcset(thumbnailUrl) : undefined;
  const sizes = generateSizes('card');
  const placeholderColor = thumbnailUrl ? getImagePlaceholder(thumbnailUrl) : undefined;

  return (
    <Card className="group overflow-hidden hover:shadow-2xl transition-all duration-300 flex flex-col border-2 hover:border-primary/50">
      <Link to={link} className="flex flex-col h-full">
        {thumbnailUrl ? (
          <div className="relative aspect-[4/3] overflow-hidden bg-muted">
            <img
              src={thumbnailUrl}
              srcSet={srcset}
              sizes={sizes}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
              loading="lazy"
              decoding="async"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
        ) : (
          <ImagePlaceholder variant={item.type === 'place' ? 'place' : item.type === 'image' ? 'image' : 'article'} />
        )}
        <CardHeader className="space-y-3">
          <div className="flex items-start gap-2">
            {item.type === 'place' && (
              <MapPin className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
            )}
            <div className="flex-1">
              <CardTitle className="line-clamp-2 text-lg group-hover:text-primary transition-colors">{title}</CardTitle>
              {summary && (
                <CardDescription className="line-clamp-3 mt-2 text-sm leading-relaxed">{summary}</CardDescription>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="font-medium">{authorName}</span>
              <span className="text-muted-foreground/60">•</span>
              <time>{new Date(item.date * 1000).toLocaleDateString('de-DE')}</time>
            </div>
          </div>
        </CardContent>
      </Link>
      <div className="px-6 pb-6">
        <SocialBar event={item.event} compact />
      </div>
    </Card>
  );
});
