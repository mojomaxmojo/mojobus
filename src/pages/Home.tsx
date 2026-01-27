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
    limit: 50,
  });

  const { data: places, isLoading: placesLoading } = usePlaces();

  const { data: noteEvents = [] } = useQuery({
    queryKey: ['home-notes', NOSTR_CONFIG.authorPubkeys],
    queryFn: async ({ signal }) => {
      const events = await nostr.query([
        {
          kinds: [NOSTR_CONFIG.kinds.note],
          authors: NOSTR_CONFIG.authorPubkeys,
          '#t': ['note', 'notiz'],
          limit: 20,
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
          limit: DEFAULT_PERFORMANCE_CONFIG.relay.maxEventsPerBatch,
        }
      ], { signal: AbortSignal.any([signal!, AbortSignal.timeout(DEFAULT_PERFORMANCE_CONFIG.relay.queryTimeout)]) }); // Aus Performance-Konfiguration

      console.log('[Home Page] Image Events Query:', {
        total: events.length,
        limit: DEFAULT_PERFORMANCE_CONFIG.relay.maxEventsPerBatch,
        timeout: DEFAULT_PERFORMANCE_CONFIG.relay.queryTimeout,
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
      <section className="relative bg-gradient-to-b from-primary/10 via-background to-background pt-[60px] pb-2 md:pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <div className="flex justify-center mb-6">
              <Waves className="h-16 w-16 text-primary wave-animation" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              Perpetual Traveler
            </h1>
            <h2 className="text-2xl md:text-3xl text-muted-foreground">
              Unser Leben am Meer
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Kein fester Wohnsitz, kein Alltag im Hamsterrad – nur wir und Soul Leon (Lionhunter), unser RV und das Meer.
              Wir leben als Perpetual Traveler, meist direkt am Strand, autark mit Solarstrom und minimalistisch unterwegs.
            </p>
            <div className="flex flex-wrap justify-center gap-2 pt-4">
              <span className="bg-primary/20 text-primary px-3 py-1 rounded-full text-sm font-medium">#offgridlife</span>
              <span className="bg-primary/20 text-primary px-3 py-1 rounded-full text-sm font-medium">#beachlife</span>
              <span className="bg-primary/20 text-primary px-3 py-1 rounded-full text-sm font-medium">#vanlife</span>
              <span className="bg-primary/20 text-primary px-3 py-1 rounded-full text-sm font-medium">#oceanview</span>
              <span className="bg-primary/20 text-primary px-3 py-1 rounded-full text-sm font-medium">#btc</span>
            </div>
            <div className="pt-6 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg" className="gap-2">
                <Link to="/artikel">
                  <Compass className="h-5 w-5" />
                  Entdecke unsere Geschichten
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={handleRefresh}
                className="gap-2"
                title="Inhalte aktualisieren"
              >
                <RefreshCw className="h-5 w-5" />
                Aktualisieren
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-muted/30 pt-[42px] pb-16 md:pt-[42px] md:pb-24">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-xl md:text-2xl font-semibold text-muted-foreground">
                Geschichten, Tipps und Einblicke in unser Leben zwischen Sand und Horizont
              </p>
            </div>

            {isLoading ? (
              <Card className="border-dashed">
                <CardContent className="py-12 px-8 text-center">
                  <LoadingSpinner size="lg" text="Lade Inhalte vom Relay..." />
                </CardContent>
              </Card>
            ) : recentItems.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {recentItems.map((item) => (
                  <ContentCard key={item.event.id} item={item} />
                ))}
              </div>
            ) : (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">
                    Noch keine Inhalte veröffentlicht. Schau bald wieder vorbei! 🌊
                  </p>
                </CardContent>
              </Card>
            )}

            {!isLoading && recentItems.length > 0 && (
              <div className="text-center mt-8">
                <Button asChild variant="outline" size="lg">
                  <Link to="/artikel">Alle Inhalte anzeigen</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="border-2 hover:border-primary transition-colors">
              <CardHeader>
                <div className="flex justify-center mb-4">
                  <Sun className="h-12 w-12 text-primary" />
                </div>
                <CardTitle className="text-center">Freiheit</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-center text-muted-foreground">
                  Das Rauschen der Wellen ist unser Wecker, Sonnenuntergänge sind unser Alltag.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary transition-colors">
              <CardHeader>
                <div className="flex justify-center mb-4">
                  <Compass className="h-12 w-12 text-primary" />
                </div>
                <CardTitle className="text-center">Abenteuer</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-center text-muted-foreground">
                  Jeder Tag bringt neue Orte, neue Begegnungen und das Gefühl, wirklich frei zu sein.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary transition-colors">
              <CardHeader>
                <div className="flex justify-center mb-4">
                  <Anchor className="h-12 w-12 text-primary" />
                </div>
                <CardTitle className="text-center">Einfachheit</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-center text-muted-foreground">
                  Minimalistisch unterwegs mit Solarstrom – autark und unabhängig.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold">
              Vielleicht ruft es auch dich
            </h2>
            <p className="text-lg text-muted-foreground">
              Nach Abenteuer, Einfachheit und Freiheit. 🌊🚐✨
            </p>
            <p className="text-muted-foreground">
              Auf Nostr teilen wir unsere Reise – dezentral, zensurresistent und direkt.
            </p>
            <div className="pt-4">
              <Button asChild size="lg" variant="outline">
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
    <Card className="overflow-hidden hover:shadow-lg transition-shadow flex flex-col">
      <Link to={link} className="flex flex-col h-full">
        {thumbnailUrl ? (
          <div
            className="aspect-video overflow-hidden bg-muted"
            style={{
              backgroundColor: placeholderColor,
            }}
          >
            <img
              src={thumbnailUrl}
              srcSet={srcset}
              sizes={sizes}
              alt={title}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              loading="lazy"
              decoding="async"
            />
          </div>
        ) : (
          <ImagePlaceholder variant={item.type === 'place' ? 'place' : item.type === 'image' ? 'image' : 'article'} />
        )}
        <CardHeader>
          <div className="flex items-start gap-2">
            {item.type === 'place' && (
              <MapPin className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
            )}
            <div className="flex-1">
              <CardTitle className="line-clamp-2">{title}</CardTitle>
              {summary && (
                <CardDescription className="line-clamp-3">{summary}</CardDescription>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{authorName}</span>
            <span>•</span>
            <time>{new Date(item.date * 1000).toLocaleDateString('de-DE')}</time>
          </div>
        </CardContent>
      </Link>
      <SocialBar event={item.event} compact />
    </Card>
  );
});
