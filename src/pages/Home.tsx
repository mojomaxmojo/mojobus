import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useLongformArticles } from '@/hooks/useLongformArticles';
import { extractArticleMetadata } from '@/hooks/useLongformArticles';
import { useAuthor } from '@/hooks/useAuthor';
import { genUserName } from '@/lib/genUserName';
import { Waves, Compass, Sun, Anchor } from 'lucide-react';
import { nip19 } from 'nostr-tools';
import { memo } from 'react';
import type { NostrEvent } from '@nostrify/nostrify';
import { getListThumbnailUrl, getImagePlaceholder, generateSrcset, generateSizes } from '@/lib/imageUtils';
import { useHead } from '@unhead/react';

export function Home() {
  // SEO Meta Tags
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
    link: [
      { rel: 'canonical', href: 'https://mojobus.cc/' }
    ]
  });
  const { data: articles, isLoading } = useLongformArticles();
  const recentArticles = articles?.slice(0, 6) || [];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-primary/10 via-background to-background pt-[60px] pb-20 md:pb-32">
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

      {/* Recent Articles Section */}
      <section className="bg-muted/30 -mt-[54px] pt-6 pb-16 md:pt-6 md:pb-24">
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
            ) : recentArticles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {recentArticles.map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>
            ) : (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">
                    Noch keine Artikel veröffentlicht. Schau bald wieder vorbei! 🌊
                  </p>
                </CardContent>
              </Card>
            )}

            {!isLoading && recentArticles.length > 0 && (
              <div className="text-center mt-8">
                <Button asChild variant="outline" size="lg">
                  <Link to="/artikel">Alle Artikel anzeigen</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
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

      {/* Call to Action */}
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

const ArticleCard = memo(function ArticleCard({ article }: { article: NostrEvent }) {
  const metadata = extractArticleMetadata(article);
  const author = useAuthor(article.pubkey);
  const authorName = author.data?.metadata?.name || genUserName(article.pubkey);

  const naddr = nip19.naddrEncode({
    kind: article.kind,
    pubkey: article.pubkey,
    identifier: metadata.identifier,
  });

  // Optimized thumbnail URL (200px, quality 80) with srcset
  const thumbnailUrl = metadata.image ? getListThumbnailUrl(metadata.image) : null;
  const srcset = metadata.image ? generateSrcset(metadata.image) : undefined;
  const sizes = generateSizes('card');
  const placeholderColor = metadata.image ? getImagePlaceholder(metadata.image) : undefined;

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <Link to={`/${naddr}`}>
        {thumbnailUrl && (
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
              alt={metadata.title}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              loading="lazy"
              decoding="async"
            />
          </div>
        )}
        <CardHeader>
          <CardTitle className="line-clamp-2">{metadata.title}</CardTitle>
          {metadata.summary && (
            <CardDescription className="line-clamp-3">{metadata.summary}</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{authorName}</span>
            <span>•</span>
            <time>{new Date(metadata.publishedAt * 1000).toLocaleDateString('de-DE')}</time>
          </div>
        </CardContent>
      </Link>
    </Card>
  );
});
