import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useRecentArticles } from '@/hooks/useRecentArticles';
import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import { NOSTR_CONFIG } from '@/config/nostr';
import { extractArticleMetadata } from '@/hooks/useLongformArticles';
import { genUserName } from '@/lib/genUserName';
import { Waves, Compass, Sun, Anchor } from 'lucide-react';
import { nip19 } from 'nostr-tools';
import { memo, useMemo } from 'react';
import type { NostrEvent, NostrMetadata } from '@nostrify/nostrify';
import { getListThumbnailUrl, getImagePlaceholder, generateSrcset, generateSizes } from '@/lib/imageUtils';
import { useHead } from '@unhead/react';
import { useAuthorsBatch } from '@/hooks/useAuthorsBatch';

type ContentItem = {
  type: 'article' | 'note' | 'image';
  event: NostrEvent;
  date: number;
  thumbnailUrl?: string;
};

export function Home() {
  useHead({
    title: 'MojoBus - Perpetual Traveler Blog',
    meta: [
      { name: 'description', content: 'Perpetual Traveler Blog. Unser Leben am Meer, vanlife, offgrid und Reisen. Geschichten, Tipps und Einblicke vom Strand.' },
      { name: 'keywords', content: 'perpetual traveler, vanlife, offgrid, beachlife, reisen, camping, meer, strand, mobiles leben, nomaden' },
      { property: 'og:title', content: 'MojoBus - Perpetual Traveler Blog' },
      { property: 'og:description', content: 'Unser Leben am Meer. Vanlife, offgrid und Geschichten vom Strand. Perpetual Traveler Lifestyle mit Soul Leon (Lionhunter).' },
      { property: 'og:url', content: 'https://mojobus.cc/' },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:title', content: 'MojoBus - Perpetual Traveler Blog' },
      { name: 'twitter:description', content: 'Unser Leben am Meer. Vanlife, offgrid und Geschichten vom Strand. 🌊🚐✨' },
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
    link: [{ rel: 'canonical', href: 'https://mojobus.cc/' }]
  });

  // Lade nur die 6 neuesten Artikel statt alle (100+)!
  const { data: recentArticles, isLoading } = useRecentArticles(6);
  const { nostr } = useNostr();

  // Lade nur die 6 neuesten Notes statt Infinite Scroll
  const { data: recentNotes = [], isLoading: isLoadingNotes } = useQuery({
    queryKey: ['home-notes'],
    queryFn: async ({ signal }) => {
      const events = await nostr.query([
        {
          kinds: [NOSTR_CONFIG.kinds.note],
          authors: NOSTR_CONFIG.authorPubkeys,
          limit: 6, // Nur 6 Notes für Home
        }
      ], {
        signal: AbortSignal.any([signal!, AbortSignal.timeout(1500)])
      });

      return events;
    },
    staleTime: 1000 * 60 * 5, // 5 Minuten Cache
    gcTime: 1000 * 60 * 30,
  });

  // Lade nur die 6 neuesten Bilder statt 20
  const { data: recentImages = [] } = useQuery({
    queryKey: ['home-images'],
    queryFn: async ({ signal }) => {
      const events = await nostr.query([
        {
          kinds: [1],
          authors: NOSTR_CONFIG.authorPubkeys,
          '#t': ['medien', 'media', 'bilder', 'images'],
          limit: 6, // Reduziert von 20 auf 6
        }
      ], {
        signal: AbortSignal.any([signal!, AbortSignal.timeout(1500)])
      });

      return events.filter((event) => {
        const content = event.content.toLowerCase();
        return content.includes('.jpg') || content.includes('.png');
      });
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });

  const contentItems: ContentItem[] = [];

  if (recentArticles && Array.isArray(recentArticles)) {
    recentArticles.forEach((event) => {
      const metadata = extractArticleMetadata(event);
      contentItems.push({
        type: 'article',
        event,
        date: event.created_at,
        thumbnailUrl: metadata.image ? getListThumbnailUrl(metadata.image) : undefined
      });
    });
  }

  if (recentNotes && Array.isArray(recentNotes)) {
    recentNotes.forEach((event) => {
      const imageUrl = extractFirstImageUrl(event.content);
      contentItems.push({
        type: 'note',
        event,
        date: event.created_at,
        thumbnailUrl: imageUrl ? getListThumbnailUrl(imageUrl) : undefined
      });
    });
  }

  if (recentImages && Array.isArray(recentImages)) {
    recentImages.forEach((event) => {
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

  // Hole alle Autoren in einem einzigen Query statt für jede Card einzeln!
  const uniquePubkeys = useMemo(() => {
    return Array.from(new Set(recentItems.map(item => item.event.pubkey)));
  }, [recentItems]);

  const { data: authorsMap } = useAuthorsBatch(uniquePubkeys);

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
            <div className="pt-6">
              <Button asChild size="lg" className="gap-2">
                <Link to="/artikel">
                  <Compass className="h-5 w-5" />
                  Entdecke unsere Geschichten
                </Link>
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-48 w-full rounded-md mb-4" />
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                    </CardHeader>
                  </Card>
                ))}
              </div>
            ) : recentItems.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {recentItems.map((item) => (
                  <ContentCard
                    key={item.event.id}
                    item={item}
                    authorMetadata={authorsMap?.[item.event.pubkey]}
                  />
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

const ContentCard = memo(function ContentCard({
  item,
  authorMetadata
}: {
  item: ContentItem;
  authorMetadata?: NostrMetadata;
}) {
  const authorName = authorMetadata?.name || genUserName(item.event.pubkey);

  let title = '';
  let summary = '';
  let link = '';

  if (item.type === 'article') {
    const metadata = extractArticleMetadata(item.event);
    title = metadata.title;
    summary = metadata.summary;

    const naddr = nip19.naddrEncode({
      kind: item.event.kind,
      pubkey: item.event.pubkey,
      identifier: metadata.identifier,
    });
    link = `/${naddr}`;
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
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <Link to={link}>
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
          <div className="aspect-video overflow-hidden bg-muted">
            <Skeleton className="w-full h-full" />
          </div>
        )}
        <CardHeader>
          <CardTitle className="line-clamp-2">{title}</CardTitle>
          {summary && (
            <CardDescription className="line-clamp-3">{summary}</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{authorName}</span>
            <span>•</span>
            <time>{new Date(item.date * 1000).toLocaleDateString('de-DE')}</time>
          </div>
        </CardContent>
      </Link>
    </Card>
  });
}, (prevProps, nextProps) => {
  // Vergleichsfunktion für React.memo
  // Re-render nur wenn sich diese Properties ändern:
  // - item.event.id
  // - item.thumbnailUrl
  // - authorMetadata.name
  const prevAuthorName = prevProps.authorMetadata?.name;
  const nextAuthorName = nextProps.authorMetadata?.name;

  return (
    prevProps.item.event.id === nextProps.item.event.id &&
    prevProps.item.thumbnailUrl === nextProps.item.thumbnailUrl &&
    prevAuthorName === nextAuthorName
  );
});
