import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useLongformArticles, extractArticleMetadata } from '@/hooks/useLongformArticles';
import { useAuthor } from '@/hooks/useAuthor';
import { genUserName } from '@/lib/genUserName';
import { RelaySelector } from '@/components/RelaySelector';
import { Search, Calendar, User } from 'lucide-react';
import { useState, useMemo } from 'react';
import { nip19 } from 'nostr-tools';

export function Articles() {
  const { data: articles, isLoading } = useLongformArticles();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Extrahiere alle Tags
  const allTags = useMemo(() => {
    if (!articles) return [];
    const tagSet = new Set<string>();
    articles.forEach(article => {
      const metadata = extractArticleMetadata(article);
      metadata.tags.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [articles]);

  // Filter Artikel
  const filteredArticles = useMemo(() => {
    if (!articles) return [];

    return articles.filter(article => {
      const metadata = extractArticleMetadata(article);

      // Tag Filter
      if (selectedTag && !metadata.tags.includes(selectedTag)) {
        return false;
      }

      // Suchfilter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          metadata.title.toLowerCase().includes(query) ||
          metadata.summary.toLowerCase().includes(query) ||
          metadata.content.toLowerCase().includes(query) ||
          metadata.tags.some(tag => tag.toLowerCase().includes(query))
        );
      }

      return true;
    });
  }, [articles, searchQuery, selectedTag]);

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold">Artikel</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Geschichten, Tipps und Einblicke aus unserem Leben als Perpetual Traveler
            </p>
          </div>

          {/* Search and Filter */}
          <div className="space-y-4">
            {/* Author Filter */}
            <div className="flex flex-wrap gap-2">
              <Badge
                variant="outline"
                className="cursor-pointer"
                onClick={() => setSearchQuery('')}
              >
                Alle Autoren
              </Badge>
              <Badge
                variant={searchQuery === 'mojo' ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setSearchQuery('')}
              >
                Mojo
              </Badge>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Artikel durchsuchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Tag Filter */}
            {allTags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant={selectedTag === null ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setSelectedTag(null)}
                >
                  Alle
                </Badge>
                {allTags.map(tag => (
                  <Badge
                    key={tag}
                    variant={selectedTag === tag ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Articles Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-48 w-full rounded-md mb-4" />
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : filteredArticles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredArticles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="py-12 px-8 text-center">
                <div className="max-w-sm mx-auto space-y-6">
                  {searchQuery || selectedTag ? (
                    <>
                      <p className="text-muted-foreground">
                        Keine Artikel gefunden für deine Suche.
                      </p>
                      <div className="space-y-2">
                        {searchQuery && (
                          <button
                            onClick={() => setSearchQuery('')}
                            className="text-sm text-primary hover:underline"
                          >
                            Suche zurücksetzen
                          </button>
                        )}
                        {selectedTag && (
                          <button
                            onClick={() => setSelectedTag(null)}
                            className="text-sm text-primary hover:underline ml-4"
                          >
                            Filter entfernen
                          </button>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-muted-foreground">
                        Noch keine Artikel gefunden. Versuche es mit einem anderen Relay?
                      </p>
                      <RelaySelector className="w-full" />
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function ArticleCard({ article }: { article: any }) {
  const metadata = extractArticleMetadata(article);
  const author = useAuthor(article.pubkey);
  const authorName = author.data?.metadata?.name || genUserName(article.pubkey);

  const naddr = nip19.naddrEncode({
    kind: article.kind,
    pubkey: article.pubkey,
    identifier: metadata.identifier,
  });

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow flex flex-col h-full">
      <Link to={`/${naddr}`} className="flex flex-col h-full">
        {metadata.image && (
          <div className="aspect-video overflow-hidden">
            <img
              src={metadata.image}
              alt={metadata.title}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          </div>
        )}
        <CardHeader className="flex-1">
          <CardTitle className="line-clamp-2">{metadata.title}</CardTitle>
          {metadata.summary && (
            <CardDescription className="line-clamp-3">{metadata.summary}</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Tags */}
            {metadata.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {metadata.tags.slice(0, 3).map(tag => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {metadata.tags.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{metadata.tags.length - 3}
                  </Badge>
                )}
              </div>
            )}

            {/* Meta Info */}
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                <span className="truncate max-w-[120px]">{authorName}</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <time>{new Date(metadata.publishedAt * 1000).toLocaleDateString('de-DE')}</time>
              </div>
            </div>
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}
