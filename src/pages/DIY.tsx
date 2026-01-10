import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useLongformArticles, extractArticleMetadata } from '@/hooks/useLongformArticles';
import { useAuthor } from '@/hooks/useAuthor';
import { genUserName } from '@/lib/genUserName';
import { Search, Calendar, User, Wrench, Battery, Sun, Hammer, Cpu } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { DIY_CATEGORIES } from '@/config';
import { DIYCategory } from '@/config/types';
import { nip19 } from 'nostr-tools';
import type { NostrEvent } from '@nostrify/nostrify';
import { memo } from 'react';

export function DIY() {
  const { category } = useParams<{ category: string }>();
  const [searchTerm, setSearchTerm] = useState('');

  // Alle DIY-Artikel mit relevanten Tags abrufen
  const { data: articles, isLoading, error } = useLongformArticles({
    kinds: [30023],
    limit: 50
  });

  // Filtere Artikel, die DIY-Kategorien haben
  const displayArticles = articles?.filter(article => {
    const metadata = extractArticleMetadata(article);

    // Extrahiere Tags aus Nostr-Event für bessere Filterung
    const eventTags = article.tags.filter(([name]) => name === 't').map(([, value]) => value);

    // Wenn Kategorie spezifiziert, filtere danach
    if (category) {
      // Prüfe Kategorie-Key und zugehörige Tags
      const categoryConfig = DIY_CATEGORIES[category.toLowerCase()];
      if (categoryConfig) {
        const categoryTags = [...categoryConfig.tags.primary, ...categoryConfig.tags.secondary];
        return eventTags.some(tag => tag === category) ||
               eventTags.some(tag => categoryTags.includes(tag));
      }
      return eventTags.includes(category);
    }

    // Sonst zeige Artikel mit DIY-Tags oder Kategorien
    const diyTags = ['diy', 'solarenergie', 'batterie', 'strom', 'internet', 'navigation', 'reparatur', 'elektronik', '12v'];
    return eventTags.some(tag => diyTags.includes(tag)) ||
           Object.keys(DIY_CATEGORIES).some(catKey => eventTags.includes(catKey));
  }) || [];

  const isDemoMode = !displayArticles || displayArticles.length === 0;

  // Debug-Informationen für LiFePo4
  if (category === 'lifepo4') {
    console.log('🔋 LiFePo4 Debug:', {
      category,
      totalArticles: articles?.length || 0,
      displayArticles: displayArticles?.length || 0,
      isDemoMode,
      allTags: articles?.map(article =>
        article.tags.filter(([name]) => name === 't').map(([, value]) => value)
      )
    });
  }



  const currentCategory = category
    ? DIY_CATEGORIES[category.toLowerCase()]
    : null;

  // Icon mapping for DIY categories
  const getDIYIcon = (iconName: string) => {
    switch (iconName) {
      case 'Battery': return Battery;
      case 'Sun': return Sun;
      case 'Wrench': return Wrench;
      case 'Hammer': return Hammer;
      case 'Cpu': return Cpu;
      default: return Wrench;
    }
  };

  // Artikel filtern basierend auf Suchbegriff
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

  if (category && !currentCategory) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Kategorie nicht gefunden
          </h1>
          <Link to="/artikel/diy">
            <Button variant="outline">
              Zurück zur DIY-Übersicht
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link to="/artikel" className="text-ocean-600 hover:text-ocean-700 dark:text-ocean-400 dark:hover:text-ocean-300 text-sm">
          ← Zurück zu Artikel
        </Link>

        <div className="flex items-center gap-3 mt-4">
          <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-full">
            <Wrench className="h-6 w-6 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {currentCategory ? currentCategory.name : 'DIY & Anleitungen'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {currentCategory
                ? currentCategory.description
                : 'Selbstbauprojekte, Reparaturanleitungen und technische Guides für Vanlife und Offgrid-Leben'
              }
            </p>
            {isDemoMode && (
              <div className="mt-2">
                <Badge variant="outline" className="text-xs">
                  🎭 Demo-Modus: Zeigt alle Artikel
                </Badge>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Kategorienübersicht (nur auf Hauptseite) */}
      {!category && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Kategorien</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.values(DIY_CATEGORIES).map((cat) => {
              const Icon = getDIYIcon(cat.icon);
              return (
                <Link key={cat.id} to={cat.path}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${cat.color.bg} ${cat.color.light}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                            {cat.name}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {cat.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
          <Separator className="my-8" />
        </div>
      )}

      {/* Suche */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="DIY-Anleitungen durchsuchen..."
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
                Fehler beim Laden der DIY-Anleitungen. Bitte versuche es später erneut.
              </p>
            </CardContent>
          </Card>
        )}

        {!isLoading && !error && filteredArticles.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="py-12 px-8 text-center">
              <Wrench className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {searchTerm ? 'Keine Suchergebnisse gefunden' :
                 isDemoMode ? 'Noch keine DIY-Anleitungen vorhanden (Demo-Modus)' : 'Noch keine DIY-Anleitungen vorhanden'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {searchTerm
                  ? 'Versuche es mit einem anderen Suchbegriff.'
                  : isDemoMode
                    ? 'Zeige alle verfügbaren Artikel als Demo. DIY-Anleitungen werden mit #diy Tag hier angezeigt.'
                    : 'Hier erscheinen bald die ersten DIY-Anleitungen und Projekte.'
                }
              </p>
              {!searchTerm && (
                <Link to="/veroeffentlichen">
                  <Button>
                    {isDemoMode ? 'DIY-Anleitung erstellen' : 'Erste DIY-Anleitung erstellen'}
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        )}

        {/* Articles Grid */}
        {filteredArticles.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArticles.map((article) => (
              <DIYArticleCard key={article.id} article={article} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const DIYArticleCard = memo(function DIYArticleCard({ article }: { article: NostrEvent }) {
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
              🛠️ DIY
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