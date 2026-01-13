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
import { Search, Calendar, User, Dog, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { nip19 } from 'nostr-tools';
import type { NostrEvent } from '@nostrify/nostrify';
import { memo } from 'react';
import { useInView } from 'react-intersection-observer';

export function Leon() {
  const [searchTerm, setSearchTerm] = useState('');

  // Alle Leon-Artikel abrufen mit Infinite Scroll
  const { data: articles, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } = useInfiniteLongformArticles({
    kinds: [30023],
    '#t': ['leon'],
  });

  // Infinite Scroll trigger
  const { ref, inView } = useInView({
    threshold: 0.1,
    rootMargin: '100px',
  });

  // Fetch more articles when scroll trigger is visible
  useEffect(() => {
    console.log('👀 Leon Infinite Scroll Trigger:', {
      inView,
      hasNextPage,
      isFetchingNextPage,
      shouldFetch: inView && hasNextPage && !isFetchingNextPage
    });

    if (inView && hasNextPage && !isFetchingNextPage) {
      console.log('📥 Leon: Fetching next page...');
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Kombiniere alle Seiten und entferne Duplikate
  const allLeonArticles = () => {
    if (!articles) return [];

    const flattened = articles.pages.flat();
    const unique = flattened.filter((article, index, self) =>
      index === self.findIndex((a) => a.id === article.id)
    );

    return unique;
  };

  const displayArticles = allLeonArticles();

  // Filter articles basierend auf Suchbegriff
  const filteredArticles = displayArticles?.filter(article => {
    if (!searchTerm) return true;

    const searchLower = searchTerm.toLowerCase();
    const metadata = extractArticleMetadata(article);

    return (
      metadata.title.toLowerCase().includes(searchLower) ||
      metadata.summary.toLowerCase().includes(searchLower) ||
      metadata.content.toLowerCase().includes(searchLower) ||
      metadata.tags.some(tag => tag.toLowerCase().includes(searchLower))
    );
  }) || [];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link to="/artikel" className="text-ocean-600 hover:text-ocean-700 dark:text-ocean-400 dark:hover:text-ocean-300 text-sm">
          ← Zurück zu Artikel
        </Link>

        <div className="flex items-center gap-3 mt-4">
          <div className="p-3 bg-amber-100 dark:bg-amber-900 rounded-full">
            <Dog className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Leon Story
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Die Abenteuer und täglichen Momente von Leon, unserem treuen Begleiter auf Reisen
            </p>
            {displayArticles.length > 0 && (
              <div className="mt-2">
                <Badge variant="outline" className="text-xs">
                  🦁 {filteredArticles.length}/{displayArticles.length} Leon-Geschichte{displayArticles.length !== 1 ? 'n' : ''}
                </Badge>
                {filteredArticles.length < displayArticles.length && (
                  <Badge variant="secondary" className="text-xs ml-2">
                    Suchergebnis
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
      </div>



      {/* Suche */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Leon-Geschichten durchsuchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Artikel Liste */}
      <div className="space-y-6">
        {isLoading && (
          <>
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </>
        )}

        {error && (
          <Card className="border-red-200 dark:border-red-800">
            <CardContent className="p-6">
              <p className="text-red-600 dark:text-red-400 text-center">
                Fehler beim Laden der Leon-Geschichten. Bitte versuche es später erneut.
              </p>
            </CardContent>
          </Card>
        )}

        {!isLoading && !error && filteredArticles.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="py-12 px-8 text-center">
              <Dog className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {searchTerm ? 'Keine Suchergebnisse gefunden' : 'Noch keine Leon-Geschichten vorhanden'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {searchTerm
                  ? 'Versuche es mit einem anderen Suchbegriff.'
                  : 'Leon-Geschichten mit #leon, #lion oder #dog Tags werden hier angezeigt.'
                }
              </p>
              {!searchTerm && (
                <Link to="/veroeffentlichen">
                  <Button>Erste Leon-Geschichte erstellen</Button>
                </Link>
              )}
            </CardContent>
          </Card>
        )}

        {/* Articles Grid */}
        {filteredArticles.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredArticles.map((article) => (
                <LeonArticleCard key={article.id} article={article} />
              ))}
            </div>

            {/* Infinite Scroll Loader */}
            {hasNextPage && !searchTerm && (
              <div ref={ref} className="py-8 flex justify-center">
                {isFetchingNextPage && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Lade mehr Leon-Geschichten...</span>
                  </div>
                )}
              </div>
            )}
          </>
        )}
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

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow flex flex-col h-full">
      <Link to={`/${naddr}`} className="flex flex-col h-full">
        {metadata.image && (
          <div className="aspect-video overflow-hidden">
            <img
              src={metadata.image}
              alt={metadata.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        )}
        <CardHeader className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="text-xs">
              🦁 Leon Story
            </Badge>
            {metadata.tags.slice(0, 2).map(tag => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
          <CardTitle className="line-clamp-2 hover:text-blue-600 transition-colors">
            {metadata.title}
          </CardTitle>
          <CardDescription className="line-clamp-3">
            {metadata.summary}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-3">
                <User className="h-3 w-3" />
                <span className="truncate max-w-[120px]">{authorName}</span>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-3 w-3" />
                <time>
                  {new Date(metadata.publishedAt * 1000).toLocaleDateString('de-DE', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </time>
              </div>
            </div>
          </div>
        </CardContent>
      </Link>
    </Card>
  );
});