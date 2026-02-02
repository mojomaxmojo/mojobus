import { Link, useParams, lazy, Suspense } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ImagePlaceholder } from '@/components/ImagePlaceholder';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useInfiniteLongformArticles, extractArticleMetadata } from '@/hooks/useLongformArticles';
import { useAuthors } from '@/hooks/useAuthors';
import { genUserName } from '@/lib/genUserName';
import { RelaySelector } from '@/components/RelaySelector';
import { filterEventsByCountry } from '@/lib/countryDetection';
import { COUNTRIES } from '@/config';
import { Search, Calendar, User, Loader2, Wrench, Dog, MapPin } from 'lucide-react';
import { useState, useMemo, memo, useEffect, useRef } from 'react';
import { nip19 } from 'nostr-tools';
import type { NostrEvent } from '@nostrify/nostrify';
import { AUTHORS } from '@/config/nostr';
import { getAuthorRelayConfigByPubkey } from '@/config/relays';
import { useInView } from 'react-intersection-observer';
import { getListThumbnailUrl, getImagePlaceholder, generateSrcset, generateSizes } from '@/lib/imageUtils';
import { MAIN_MENU } from '@/config/menu';
// @ts-nocheck
// @ts-ignore
import { useHead } from '@unhead/react';

// Lazy loaded SocialBar für Performance-Optimierung
const SocialBar = lazy(() => import('@/components/SocialBar'));

function Articles() {
  const { country } = useParams();
  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } = useInfiniteLongformArticles();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState(null);
  const [selectedAuthor, setSelectedAuthor] = useState(null);

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

  const currentCountry = country ? COUNTRIES[country] : null;

  // Flatten all pages
  const allArticles = useMemo(() => {
    return data?.pages.flat() || [];
  }, [data]);

  // 🔥 OPTIMIZATION 1: Extrahiere alle unique pubkeys für Batching
  // Reduziert 15 Queries zu 1 Query pro Seite
  const uniquePubkeys = useMemo(() => {
    const set = new Set<string>();
    allArticles.forEach(article => {
      if (article.pubkey) {
        set.add(article.pubkey);
      }
    });
    return Array.from(set);
  }, [allArticles]);

  // 🔥 OPTIMIZATION 1: Batch-Abruf aller Autoren-Profile (statt pro Artikel)
  const authors = useAuthors(uniquePubkeys);

  // Filter articles mit intelligenter Ländererkennung
  const filteredArticles = useMemo(() => {
    let filtered = [...allArticles];

    // Country filter mit intelligenter Erkennung
    if (currentCountry) {
      filtered = filterEventsByCountry(filtered, country);
    }

    // Author filter (auch wenn keine Suche!)
    if (selectedAuthor) {
      filtered = filtered.filter(article => article.pubkey === selectedAuthor);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(article => {
        const metadata = extractArticleMetadata(article);

        // Tag filter (case-insensitive)
        if (selectedTag && !metadata.tags.some(tag => tag.toLowerCase() === selectedTag.toLowerCase())) {
          return false;
        }

        // Search filter (case-insensitive for tags)
        return (
          metadata.title.toLowerCase().includes(query) ||
          metadata.summary.toLowerCase().includes(query) ||
          metadata.content.toLowerCase().includes(query) ||
          metadata.tags.some(tag => tag.toLowerCase().includes(query))
        );
      });
    }

    return filtered.sort((a, b) => b.created_at - a.created_at);
  }, [allArticles, searchQuery, selectedTag, selectedAuthor, currentCountry, country]);

  // 🔥 OPTIMIZATION 2: Cache Artikel-Metadata um Duplikate zu vermeiden
  // Wird für jedes ArticleCard wiederverwendet statt neu berechnet
  const articlesMetadata = useMemo(() => {
    const map = new Map();
    filteredArticles.forEach(article => {
      map.set(article.id, extractArticleMetadata(article));
    });
    return map;
  }, [filteredArticles]);

  const articleCount = allArticles.length;

  // Simple SEO Meta Tags
  const pageTitle = currentCountry
    ? `Artikel aus ${currentCountry.name} ${currentCountry.flag} (${filteredArticles.length}) - MojoBus`
    : `Artikel (${filteredArticles.length}) - MojoBus`;

  const pageDescription = currentCountry
    ? `Entdecke ${filteredArticles.length} Reiseberichte und Geschichten aus ${currentCountry.name}.`
    : `Entdecke ${filteredArticles.length} Reiseberichte und Geschichten vom Leben am Meer.`;

  useHead({
    title: pageTitle,
    meta: [
      { name: 'description', content: pageDescription },
      { name: 'keywords', content: 'Vanlife, Camping, Perpetual Traveler, Nostr, Reiseberichte, Geschichten, Portugal, Spanien, Frankreich, Belgien, Luxemburg, Deutschland' },
      { property: 'og:title', content: pageTitle },
      { property: 'og:description', content: pageDescription },
      { property: 'og:url', content: `https://mojobus.org/artikel${country ? '/' + country : ''}` },
      { property: 'og:type', content: 'website' }
    ],
    link: [
      { rel: 'canonical', href: `https://mojobus.org/artikel${country ? '/' + country : ''}` }
    ]
  });

  if (isLoading) {
    return (
      <div className="min-h-screen py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-6">
            <Skeleton className="h-12 w-3/4 mx-auto" />
            <Card className="border-dashed">
              <CardContent className="py-16 px-8 text-center">
                <LoadingSpinner size="lg" text="Lade Artikel vom Relay..." />
              </CardContent>
            </Card>
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
              {currentCountry ? (
                <span className="flex items-center justify-center gap-3">
                  <span className="text-3xl">{currentCountry.flag}</span>
                  Artikel aus {currentCountry.name}
                </span>
              ) : (
                'Artikel'
              )}
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              {currentCountry
                ? `Geschichten, Tipps und Einblicke aus unserem Reisen in ${currentCountry.name}`
                : 'Geschichten, Tipps und Einblicke aus unserem Leben als Perpetual Traveler'
              }
            </p>
            <div className="flex justify-center items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="font-semibold">{filteredArticles.length}</span>
                <span>Artikel{currentCountry ? ` aus ${currentCountry.name}` : ''}</span>
              </span>
              {articleCount > filteredArticles.length && (
                <span className="text-xs text-muted-foreground">
                  (von {articleCount} insgesamt)
                </span>
              )}
              {currentCountry && (
                <Link
                  to="/artikel"
                  className="text-ocean-600 hover:text-ocean-700 underline"
                >
                  Alle Artikel anzeigen
                </Link>
              )}
            </div>
          </div>

          {/* Artikel-Kategorien Untermenü (nur auf Hauptseite anzeigen) */}
          {!currentCountry && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* DIY */}
              <Link to="/artikel/diy" className="group">
                <Card className="hover:shadow-md transition-all hover:border-ocean-300">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg group-hover:bg-orange-200 dark:group-hover:bg-orange-800 transition-colors">
                        <Wrench className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                          DIY Anleitungen
                        </h3>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Solar, Batterie, Reparatur, Ausbau
                        </p>
                      </div>
                      <svg className="h-4 w-4 text-gray-400 group-hover:text-ocean-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              {/* RV Life */}
              <Link to="/artikel/rvlife" className="group">
                <Card className="hover:shadow-md transition-all hover:border-ocean-300">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg group-hover:bg-orange-200 dark:group-hover:bg-orange-800 transition-colors">
                        <MapPin className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                          🚐 RV Life
                        </h3>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Küche & Essen, Ausstattung, Freeliving
                        </p>
                      </div>
                      <svg className="h-4 w-4 text-gray-400 group-hover:text-ocean-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              {/* Leon */}
              <Link to="/artikel/leon" className="group">
                <Card className="hover:shadow-md transition-all hover:border-ocean-300">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-amber-100 dark:bg-amber-900 rounded-lg group-hover:bg-amber-200 dark:group-hover:bg-amber-800 transition-colors">
                        <Dog className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                          🦁 Leon Stories
                        </h3>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Abenteuer mit unserem Hund
                        </p>
                      </div>
                      <svg className="h-4 w-4 text-gray-400 group-hover:text-ocean-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          )}

          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            <div className="relative flex-1 w-full md:w-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Artikel durchsuchen..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10 w-full"
              />
            </div>

            {/* Author Filter */}
            <div className="flex flex-wrap gap-2">
              <Badge variant={selectedAuthor === null ? "default" : "outline"} className="cursor-pointer" onClick={() => setSelectedAuthor(null)}>
                Alle Autoren
              </Badge>
              {AUTHORS.map((author) => (
                <Badge key={author.id} variant={selectedAuthor === author.pubkey ? "default" : "outline"} className="cursor-pointer" onClick={() => setSelectedAuthor(selectedAuthor === author.pubkey ? null : author.pubkey)}>
                  {author.name}
                </Badge>
              ))}
            </div>
          </div>

          {/* Articles Grid */}
          {hasContent ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredArticles.map((article) => (
                  <ArticleCard
                    key={article.id}
                    article={article}
                    authorsMap={authors.data || new Map()}
                    articlesMetadata={articlesMetadata}
                  />
                ))}
              </div>

              {/* Infinite Scroll Loader */}
              {hasNextPage && (
                <div ref={ref} className="py-8 flex justify-center">
                  {isFetchingNextPage && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Lade mehr Artikel...</span>
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
                      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                        Keine Artikel gefunden
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        Fuer deine Suche wurden keine Artikel gefunden.
                      </p>
                      <div className="space-y-2">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {currentCountry
                            ? `Keine Artikel aus ${currentCountry.name} gefunden. Versuche andere Suchbegriffe oder blättere alle Artikel.`
                            : 'Keine Artikel gefunden. Versuche andere Suchbegriffe oder stelle sicher, dass du mit dem richtigen Relay verbunden bist.'
                          }
                        </p>
                        <div className="flex flex-col gap-2">
                          {currentCountry && (
                            <Link to="/artikel">
                              <Button variant="outline" className="w-full">
                                Alle Artikel anzeigen
                              </Button>
                            </Link>
                          )}
                          <div className="flex gap-2">
                            <Button onClick={() => window.location.href = '/veroeffentlichen'}>
                              <span className="mr-2">Artikel</span>
                              schreiben
                            </Button>
                            <RelaySelector className="w-full" />
                          </div>
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

const ArticleCard = memo(function ArticleCard({
  article,
  authorsMap,
  articlesMetadata,
}: {
  article: NostrEvent;
  authorsMap: Map<string, { event?: NostrEvent; metadata?: any }>;
  articlesMetadata: Map<string, any>;
}) {
  // 🔥 OPTIMIZATION 2: Gecachte Metadata statt neu berechnet
  const metadata = articlesMetadata.get(article.id) || extractArticleMetadata(article);

  // 🔥 OPTIMIZATION 1: Autoren aus Batching-Map statt separatem Query
  const author = authorsMap.get(article.pubkey);
  const authorName = author?.metadata?.name || genUserName(article.pubkey);

  // ✅ DYNAMISCHES RELAY basierend auf Autor (aus relays.ts)
  const authorRelayConfig = getAuthorRelayConfigByPubkey(article.pubkey);
  const relay = authorRelayConfig?.activeRelay || 'wss://relay.mojobus.co';

  // Generate naddr identifier for article
  const naddr = nip19.naddrEncode({
    kind: article.kind,
    pubkey: article.pubkey,
    identifier: metadata.identifier,
    relays: [relay]
  });

  // Optimized thumbnail URL (200px, quality 80) with srcset
  const thumbnailUrl = metadata.image ? getListThumbnailUrl(metadata.image) : null;
  const srcset = metadata.image ? generateSrcset(metadata.image) : undefined;
  const sizes = generateSizes('card');
  const placeholderColor = metadata.image ? getImagePlaceholder(metadata.image) : undefined;

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow flex flex-col h-full">
      <Link to={`/${naddr}`} className="flex flex-col h-full">
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
              alt={metadata.title}
              className="w-full h-full object-cover"
              loading="lazy"
              decoding="async"
            />
          </div>
        ) : (
          <ImagePlaceholder variant="article" title={metadata.title} />
        )}
        <CardHeader className="flex-1">
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
      <Suspense fallback={<div />}>
        <SocialBar event={article} compact />
      </Suspense>
    </Card>
  );
});

export default Articles;