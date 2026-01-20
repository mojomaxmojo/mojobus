import { useState, useMemo, memo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { usePlaces, extractArticleMetadata } from '@/hooks/useLongformArticles';
import { useAuthor } from '@/hooks/useAuthor';
import { genUserName } from '@/lib/genUserName';
import { RelaySelector } from '@/components/RelaySelector';
import { filterEventsByCountry, countries } from '@/lib/countryDetection';
import { Search, Calendar, User, MapPin } from 'lucide-react';
import { nip19 } from 'nostr-tools';
import type { NostrEvent } from '@nostrify/nostrify';
import { AUTHORS } from '@/config/nostr';
// @ts-nocheck
// @ts-ignore
import { useHead } from '@unhead/react';

function Places() {
  const { country } = useParams();
  const { data: events, isLoading } = usePlaces();
  const [searchQuery, setSearchQuery] = useState('');

  const currentCountry = country ? countries[country as keyof typeof countries] : null;

  const places = useMemo(() => {
    if (!events) return [];

    return events.map((event: NostrEvent) => {
      const metadata = extractArticleMetadata(event);

      // Generate naddr identifier for place
      const naddr = nip19.naddrEncode({
        kind: event.kind,
        pubkey: event.pubkey,
        identifier: metadata.identifier,
        relays: ['wss://relay.nostr.band']
      });

      const locationTag = event.tags.find(([name]) => name === 'location')?.[1];

      return {
        id: event.id,
        naddr,
        title: metadata.title, // metadata.title now checks for both 'title' and 'name' tags
        image: metadata.image,
        location: locationTag || '',
        created_at: metadata.publishedAt,
        author: event.pubkey,
        tags: metadata.tags
      };
    });
  }, [events]);

  const filteredPlaces = useMemo(() => {
    let filtered = [...places];

    // Country filter mit intelligenter Erkennung
    if (currentCountry) {
      filtered = filterEventsByCountry(filtered, country);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(place =>
        place.title.toLowerCase().includes(query) ||
        place.location.toLowerCase().includes(query)
      );
    }

    return filtered.sort((a, b) => b.created_at - a.created_at);
  }, [places, searchQuery, currentCountry, country]);

  const hasPlaces = filteredPlaces.length > 0;

  // SEO Meta Tags
  const pageTitle = currentCountry
    ? `Plätze in ${currentCountry.name} ${currentCountry.flag} (${filteredPlaces.length}) - MojoBus`
    : `Plätze (${filteredPlaces.length}) - MojoBus`;

  const pageDescription = currentCountry
    ? `Entdecke ${filteredPlaces.length} besondere Orte und Plätze in ${currentCountry.name}.`
    : `Entdecke ${filteredPlaces.length} besondere Orte und Plätze aus unseren Reisen.`;

  useHead({
    title: pageTitle,
    meta: [
      { name: 'description', content: pageDescription },
      { name: 'keywords', content: 'Vanlife, Camping, Orte, Plätze, Portugal, Spanien, Frankreich, Belgien, Luxemburg, Deutschland' },
      { property: 'og:title', content: pageTitle },
      { property: 'og:description', content: pageDescription },
      { property: 'og:url', content: `https://mojobus.org/plaetze${country ? '/' + country : ''}` },
      { property: 'og:type', content: 'website' }
    ],
    link: [
      { rel: 'canonical', href: `https://mojobus.org/plaetze${country ? '/' + country : ''}` }
    ]
  });

  if (isLoading) {
    return (
      <div className="min-h-screen py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="text-center space-y-4">
              <Skeleton className="h-12 w-3/4 mx-auto" />
              <Skeleton className="h-6 w-1/2 mx-auto" />
            </div>
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

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold">
              {currentCountry ? (
                <span className="flex items-center justify-center gap-3">
                  <span className="text-3xl">{currentCountry.flag}</span>
                  Plätze in {currentCountry.name}
                </span>
              ) : (
                <span className="flex items-center justify-center gap-3">
                  <MapPin className="h-10 w-10 text-ocean-600" />
                  Plätze
                </span>
              )}
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              {currentCountry
                ? `Besondere Orte und Entdeckungen aus ${currentCountry.name}`
                : 'Besondere Orte und Entdeckungen aus unseren Reisen durch Europa'
              }
            </p>
            <div className="flex justify-center items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="font-semibold">{filteredPlaces.length}</span>
                <span>Plätze{currentCountry ? ` in ${currentCountry.name}` : ''}</span>
              </span>
              {currentCountry && (
                <Link
                  to="/plaetze"
                  className="text-ocean-600 hover:text-ocean-700 underline"
                >
                  Alle Plätze anzeigen
                </Link>
              )}
            </div>
          </div>

          <div className="flex justify-center">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Plätze durchsuchen..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
          </div>

          {/* Places Grid */}
          {hasPlaces ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPlaces.map((place) => (
                <PlaceCard key={place.id} place={place} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="max-w-md mx-auto">
                <Card className="border-dashed">
                  <CardContent className="py-12 px-8 text-center">
                    <div className="space-y-6">
                      <div className="text-6xl mb-4">📍</div>
                      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                        {currentCountry ? `Keine Plätze in ${currentCountry.name} gefunden` : 'Keine Plätze gefunden'}
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        {currentCountry
                          ? `Keine besonderen Orte aus ${currentCountry.name} gefunden. Sei der Erste!`
                          : 'Keine besonderen Orte gefunden. Sei der Erste und teile einen Ort mit der Community!'
                        }
                      </p>
                      <div className="flex flex-col gap-2">
                        {currentCountry && (
                          <Link to="/plaetze">
                            <Button variant="outline" className="w-full">
                              Alle Plätze anzeigen
                            </Button>
                          </Link>
                        )}
                        <div className="flex gap-2">
                          <Button onClick={() => window.location.href = '/veroeffentlichen?tab=place'}>
                            <span className="mr-2">📍</span>
                            Ort erstellen
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

const PlaceCard = memo(function PlaceCard({ place }: { place: any }) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow flex flex-col h-full">
      <Link to={`/${place.naddr}`} className="flex flex-col h-full">
        {place.image && (
          <div className="aspect-video overflow-hidden">
            <img
              src={place.image}
              alt={place.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        )}
        <CardHeader className="flex-1">
          <CardTitle className="line-clamp-2 hover:text-ocean-600 transition-colors flex items-center gap-2">
            <MapPin className="h-4 w-4 text-ocean-600" />
            {place.title}
          </CardTitle>
          {place.location && (
            <CardDescription className="flex items-center gap-1">
              📍 {place.location}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="flex-1">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-3">
                <User className="h-3 w-3" />
                <span className="truncate max-w-[120px]">{place.author.slice(0, 8)}...</span>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-3 w-3" />
                <time>
                  {new Date(place.created_at * 1000).toLocaleDateString('de-DE', {
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

export default Places;