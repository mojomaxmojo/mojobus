import { useEffect, useState, useMemo, memo } from 'react';
import { useInView } from 'react-intersection-observer';
import { Link, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RelaySelector } from '@/components/RelaySelector';
import { NoteContent } from '@/components/NoteContent';
import { useNotes, extractNoteTags, extractNoteImages } from '@/hooks/useNotes';
import { useAuthor } from '@/hooks/useAuthor';
import { genUserName } from '@/lib/genUserName';
import { filterEventsByCountry, countries } from '@/lib/countryDetection';
import { Calendar, Search, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { nip19 } from 'nostr-tools';
import type { NostrEvent } from '@nostrify/nostrify';
import { AUTHORS } from '@/config/nostr';
import { useHead } from '@unhead/react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostrDelete } from '@/hooks/useNostrDelete';
import { useToast } from '@/hooks/useToast';
import { generateSrcset, generateSizes } from '@/lib/imageUtils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Loader2 } from 'lucide-react';

export function Notes() {
  const { country } = useParams();

  const currentCountry = country ? countries[country as keyof typeof countries] : null;

  // SEO Meta Tags
  const pageTitle = currentCountry
    ? `Notes aus ${currentCountry.name} ${currentCountry.flag} - MojoBus`
    : 'Notes - MojoBus';

  const pageDescription = currentCountry
    ? `Aktuelle Updates und Gedanken aus ${currentCountry.name}. Vanlife, Offgrid und tägliche Abenteuer.`
    : 'Aktuelle Updates, Gedanken und Momente vom Leben am Meer. Vanlife, Offgrid und tägliche Abenteuer.';

  useHead({
    title: pageTitle,
    meta: [
      { name: 'description', content: pageDescription },
      { property: 'og:title', content: pageTitle },
      { property: 'og:description', content: pageDescription },
      { property: 'og:url', content: `https://mojobus.org/notes${country ? '/' + country : ''}` },
      { name: 'twitter:title', content: pageTitle },
      { name: 'twitter:description', content: pageDescription },
    ],
    link: [
      { rel: 'canonical', href: `https://mojobus.org/notes${country ? '/' + country : ''}` }
    ]
  });

  // Use notes hook with Infinite Scroll
  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } = useNotes();
  const { ref, inView } = useInView({
    threshold: 0.1,
    rootMargin: '100px',
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAuthor, setSelectedAuthor] = useState<string | null>(null);

  // Fetch more notes when scroll trigger is visible
  useEffect(() => {
    console.log('👀 Notes Infinite Scroll Trigger:', {
      inView,
      hasNextPage,
      isFetchingNextPage,
      shouldFetch: inView && hasNextPage && !isFetchingNextPage
    });

    if (inView && hasNextPage && !isFetchingNextPage) {
      console.log('📥 Fetching next notes page...');
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Flatten all pages
  const notes = useMemo(() => {
    return data?.pages.flat() || [];
  }, [data]);

  // Filter notes by author, country and search query mit intelligenter Erkennung
  const filteredNotes = useMemo(() => {
    let filtered = [...notes];

    // Country filter mit intelligenter Erkennung
    if (currentCountry) {
      filtered = filterEventsByCountry(filtered, country);
    }

    // Autoren-Filter
    if (selectedAuthor) {
      filtered = filtered.filter(note => note.pubkey === selectedAuthor);
    }

    // Suchfilter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(note => {
        const content = note.content.toLowerCase();
        const tags = extractNoteTags(note);

        return (
          content.includes(query) ||
          tags.some(tag => tag.toLowerCase().includes(query))
        );
      });
    }

    return filtered.sort((a, b) => b.created_at - a.created_at);
  }, [notes, searchQuery, selectedAuthor, currentCountry, country]);

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold">
              {currentCountry ? (
                <span className="flex items-center justify-center gap-3">
                  <span className="text-3xl">{currentCountry.flag}</span>
                  Notes aus {currentCountry.name}
                </span>
              ) : (
                'Notes'
              )}
            </h1>
            <p className="text-lg text-muted-foreground">
              {currentCountry
                ? `Aktuelle Updates und Gedanken aus ${currentCountry.name}`
                : 'Kurze Updates und Gedanken aus unserem Alltag am Meer'
              }
            </p>
            <div className="flex justify-center items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="font-semibold">{filteredNotes.length}</span>
                <span>Notes{currentCountry ? ` aus ${currentCountry.name}` : ''}</span>
              </span>
              {currentCountry && (
                <Link
                  to="/notes"
                  className="text-ocean-600 hover:text-ocean-700 underline"
                >
                  Alle Notes anzeigen
                </Link>
              )}
            </div>
          </div>

          {/* Search and Author Filter */}
          <div className="space-y-4">
            {/* Author Filter */}
            <div className="flex flex-wrap gap-2">
              <Badge
                variant={selectedAuthor === null ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setSelectedAuthor(null)}
              >
                Alle Autoren
              </Badge>
              {AUTHORS.map((author) => (
                <Badge
                  key={author.id}
                  variant={selectedAuthor === author.pubkey ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setSelectedAuthor(selectedAuthor === author.pubkey ? null : author.pubkey)}
                >
                  {author.name}
                </Badge>
              ))}
            </div>

            {/* Search */}
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Notes durchsuchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Notes Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-1 flex-1">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-4/5" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredNotes.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredNotes.map((note) => (
                  <NoteCard key={note.id} note={note} />
                ))}
              </div>

              {/* Infinite Scroll Loader */}
              {hasNextPage && (
                <div ref={ref} className="py-8 flex justify-center">
                  {isFetchingNextPage && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Lade mehr Notes...</span>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <Card className="border-dashed">
              <CardContent className="py-12 px-8 text-center">
                <div className="max-w-sm mx-auto space-y-6">
                  {searchQuery || selectedAuthor || currentCountry ? (
                    <>
                      <p className="text-muted-foreground">
                        {currentCountry
                          ? `Keine Notes aus ${currentCountry.name} gefunden`
                          : 'Keine Notes gefunden für deine Suche'
                        }.
                      </p>
                      <div className="flex flex-col gap-2">
                        {currentCountry && (
                          <Link to="/notes">
                            <Button variant="outline" className="w-full">
                              Alle Notes anzeigen
                            </Button>
                          </Link>
                        )}
                        <button
                          onClick={() => {
                            setSearchQuery('');
                            setSelectedAuthor(null);
                          }}
                          className="text-sm text-primary hover:underline"
                        >
                          Suche zurücksetzen
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-muted-foreground">
                        Keine Notes gefunden. Versuche es mit einem anderen Relay?
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

const NoteCard = memo(function NoteCard({ note }: { note: NostrEvent }) {
  const author = useAuthor(note.pubkey);
  const { user } = useCurrentUser();
  const { mutate: deleteNote } = useNostrDelete();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const authorName = author.data?.metadata?.name || genUserName(note.pubkey);
  const authorAvatar = author.data?.metadata?.picture;
  const tags = extractNoteTags(note);
  const images = extractNoteImages(note);

  // Create note1 identifier
  const noteId = nip19.noteEncode(note.id);

  // Check if current user is the author
  const isAuthor = user?.pubkey === note.pubkey;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteNote({
        eventIds: note.id,
        reason: "Echte Fehler: Delete Event (Kind 5) verwenden"
      });

      toast({
        title: "Erfolg!",
        description: "Note wurde erfolgreich gelöscht.",
      });
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Löschen fehlgeschlagen. Bitte versuche es erneut.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="relative">
      <Link to={`/${noteId}`}>
        <Card className="hover:shadow-md transition-shadow flex flex-col h-full cursor-pointer">
          <CardHeader className="pb-3">
            <div className="flex items-start gap-3">
              <Avatar className="h-10 w-10">
                {authorAvatar && <AvatarImage src={authorAvatar} alt={authorName} />}
                <AvatarFallback>{authorName.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold truncate">{authorName}</span>
                  <span className="text-muted-foreground">•</span>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <time>
                      {new Date(note.created_at * 1000).toLocaleDateString('de-DE', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </time>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 space-y-4">
          {/* Content */}
          <div className="whitespace-pre-wrap break-words line-clamp-3">
            <NoteContent event={note} className="text-sm" />
          </div>

          {/* Images */}
          {images.length > 0 && (
            <div className={`grid gap-2 ${images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
              {images.slice(0, 2).map((img, idx) => (
                <div key={idx} className="rounded-lg overflow-hidden">
                  <img
                    src={img}
                    alt=""
                    className="w-full h-24 object-cover"
                    loading="lazy"
                  />
                </div>
              ))}
              {images.length > 2 && (
                <div className="rounded-lg overflow-hidden bg-muted h-24 flex items-center justify-center">
                  <span className="text-sm font-medium">+{images.length - 2}</span>
                </div>
              )}
            </div>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {tags.slice(0, 3).map(tag => (
                <Badge key={tag} variant="secondary" className="gap-1 text-xs">
                  <Hash className="h-3 w-3" />
                  {tag}
                </Badge>
              ))}
              {tags.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{tags.length - 3}
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      </Link>

      {/* Delete Button - nur für den Autor sichtbar */}
      {isAuthor && (
        <div className="absolute top-2 right-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                size="sm"
                className="h-8 w-8 p-0 opacity-80 hover:opacity-100"
                disabled={isDeleting}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Note löschen?</AlertDialogTitle>
                <AlertDialogDescription>
                  Bist du sicher, dass du diese Note löschen möchtest? Diese Aktion kann nicht rückgängig gemacht werden.
                  <br /><br />
                  <strong>Grund:</strong> Echte Fehler: Delete Event (Kind 5) verwenden
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive hover:bg-destructive/90"
                  disabled={isDeleting}
                >
                  {isDeleting ? "Wird gelöscht..." : "Löschen"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </div>
  );
});

function Hash({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <line x1="4" x2="20" y1="9" y2="9" />
      <line x1="4" x2="20" y1="15" y2="15" />
      <line x1="10" x2="8" y1="3" y2="21" />
      <line x1="16" x2="14" y1="3" y2="21" />
    </svg>
  );
}
