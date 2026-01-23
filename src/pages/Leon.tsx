import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useInfiniteLongformArticles, extractArticleMetadata } from '@/hooks/useLongformArticles';
import { useAuthor } from '@/hooks/useAuthor';
import { genUserName } from '@/lib/genUserName';
import { getListThumbnailUrl, getImagePlaceholder, generateSrcset, generateSizes } from '@/lib/imageUtils';
import { LEON_CONFIG } from '@/config/leon';
import { Search, Calendar, User, Dog, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { nip19 } from 'nostr-tools';
import type { NostrEvent } from '@nostrify/nostrify';
import { memo } from 'react';
import { useInView } from 'react-intersection-observer';

export function Leon() {
  const [searchTerm, setSearchTerm] = useState('');

  // Alle Leon-Artikel abrufen mit Infinite Scroll
  const { data: articles, isLoading, error, hasNextPage, fetchNextPage, isFetchingNextPage } = useInfiniteLongformArticles({
    kinds: [30023],
    '#t': ['leon'],
    limit: DEFAULT_PERFORMANCE_CONFIG.infiniteScroll.itemsPerPage,
  });

  // Infinite Scroll trigger
  const { ref, inView } = useInView({
    threshold: 0.1,
    rootMargin: '100px',
  });

  // Fetch more articles when scroll trigger is visible
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Kombiniere alle Seiten und entferne Duplikate
  const allLeonArticles = () => {
    if (!articles) return [];
    const flattened = articles?.pages.flat() || [];
    return flattened;
  };

  // Filtere articles nach Suchbegriff
  const filteredArticles = allLeonArticles().filter(article => {
    const metadata = extractArticleMetadata(article);

    // Suchfilter (case-insensitive für Titel, Summary und Content)
    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      return (
        metadata.title.toLowerCase().includes(query) ||
        metadata.summary.toLowerCase().includes(query) ||
        metadata.content.toLowerCase().includes(query)
      );
    }

    return true;
  });

  const articleCount = allLeonArticles().length;

  // Simple SEO Meta Tags
  const pageTitle = `Leon Stories (${filteredArticles.length}) - MojoBus`;
  const pageDescription = `Entdecke ${filteredArticles.length} Geschichten von Leon (Lionhunter) - unser Hund, unser Begleiter beim Vanlife.`;

  useHead({
    title: pageTitle,
    meta: [
      { name: 'description', content: pageDescription },
      { name: 'keywords', content: 'Leon, Lionhunter, Hund, Vanlife, Hundegeschichten, MojoBus' },
      { property: 'og:title', content: pageTitle },
      { property: 'og:description', content: pageDescription },
      { property: 'og:url', content: `https://mojobus.org/leon` },
      { property: 'og:type', content: 'website' }
    ],
    link: [
      { rel: 'canonical', href: `https://mojobus.org/leon` }
    ]
  });

  if (isLoading) {
    return (
      <div className="min-h-screen py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-6">
            <Skeleton className="h-12 w-3/4" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-48 w-full rounded-md mb-4" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="text-center space-y-4">
              <div className="text-6xl mb-4">🦁</div>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                Verbindungsfehler
              </h2>
              <p className="text-lg text-muted-foreground">
                Es ist ein Fehler aufgetreten beim Laden der Leon Stories.
              </p>
              <div className="space-y-2">
                <Button onClick={() => window.location.reload()} className="w-full">
                  🔄 Seite neu laden
                </Button>
                <Link to="/">
                  <Button variant="outline" className="w-full">
                    Zur Startseite
                  </Button>
                </Link>
                <RelaySelector className="w-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const hasContent = filteredArticles.length > 0;

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold">
              <span className="flex items-center justify-center gap-3">
                <span className="text-3xl">🦁</span>
                Leon Stories
              </span>
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Abenteuer und Geschichten von Leon (Lionhunter) - unser Hund, unser Begleiter beim Vanlife.
            </p>
            <div className="flex justify-center items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="font-semibold">{filteredArticles.length}</span>
                <span>Geschichten{filteredArticles.length !== 1 ? 'n' : ''}</span>
              </span>
              {articleCount > filteredArticles.length && (
                <span className="text-xs text-muted-foreground">
                  (von {articleCount} insgesamt)
                </span>
              )}
            </div>
          </div>

          {/* Search Input */}
          <div className="max-w-md mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Leon Geschichten durchsuchen..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
          </div>

          {/* Articles Grid */}
          {hasContent ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredArticles.map((article) => (
                  <LeonArticleCard key={article.id} article={article} />
                ))}
              </div>

              {/* Infinite Scroll Loader */}
              {hasNextPage && (
                <div ref={ref} className="py-8 flex justify-center">
                  {isFetchingNextPage && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Lade mehr Leon Stories...</span>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20">
              <div className="max-w-md mx-auto">
                <Card className="border-dashed">
                  <CardContent className="py-12 px-8 text-center">
                    <div className="space-y-6">
                      <div className="text-6xl mb-4">🦁</div>
                      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                        Keine Leon Stories gefunden
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        {searchTerm
                          ? `Für deine Suche nach "${searchTerm}" wurden keine Leon Stories gefunden. Versuche andere Suchbegriffe.`
                          : 'Noch keine Leon Stories veröffentlicht. Schau bald wieder vorbei!'}
                      </p>
                      <div className="space-y-2">
                        {searchTerm && (
                          <Link to="/">
                            <Button variant="outline" className="w-full">
                              Alle Leon Stories anzeigen
                            </Button>
                          </Link>
                        )}
                        <div className="flex gap-2">
                          <Button onClick={() => window.location.reload()}>
                            🔄 Seite neu laden
                          </Button>
                          <RelaySelector className="w-full" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const LeonArticleCard = memo(function LeonArticleCard({ article }: { article: NostrEvent }) {
  const metadata = extractArticleMetadata(article);
  const author = useAuthor(article.pubkey);
  const authorName = author.data?.metadata?.name || genUserName(article.pubkey);

  // Generate naddr identifier for article
  const naddr = nip19.naddrEncode({
    kind: article.kind,
    pubkey: article.pubkey,
    identifier: metadata.identifier,
    relays: ['wss://relay.nostr.band']
  });

  // Optimized thumbnail URL (200px, quality 80) with srcset
  const thumbnailUrl = metadata.image ? getListThumbnailUrl(metadata.image) : null;
  const srcset = metadata.image ? generateSrcset(metadata.image) : undefined;
  const sizes = generateSizes('card');
  const placeholderColor = metadata.image ? getImagePlaceholder(metadata.image) : undefined;

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow flex flex-col h-full">
      <Link to={`/${naddr}`} className="flex flex-col h-full">
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
        <CardHeader className="flex-1">
          <div className="flex items-start gap-2">
            <div className="flex-1">
              <CardTitle className="line-clamp-2">{metadata.title}</CardTitle>
              {metadata.summary && (
                <CardDescription className="line-clamp-3">{metadata.summary}</CardDescription>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1">
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

export default Leon;
