import { useEffect, useState, useMemo } from 'react';
import { useInView } from 'react-intersection-observer';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { RelaySelector } from '@/components/RelaySelector';
import { NoteContent } from '@/components/NoteContent';
import { useNotes, extractNoteTags, extractNoteImages } from '@/hooks/useNotes';
import { useAuthor } from '@/hooks/useAuthor';
import { genUserName } from '@/lib/genUserName';
import { Calendar, Hash, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

export function Notes() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useNotes();
  const { ref, inView } = useInView();
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, fetchNextPage]);

  const notes = data?.pages.flat() || [];

  // Filter notes by search query
  const filteredNotes = useMemo(() => {
    if (!searchQuery) return notes;
    
    const query = searchQuery.toLowerCase();
    return notes.filter(note => {
      const content = note.content.toLowerCase();
      const tags = extractNoteTags(note);
      
      return (
        content.includes(query) ||
        tags.some(tag => tag.toLowerCase().includes(query))
      );
    });
  }, [notes, searchQuery]);

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold">Notes</h1>
            <p className="text-lg text-muted-foreground">
              Kurze Updates und Gedanken aus unserem Alltag am Meer
            </p>
          </div>

          {/* Search and Author Filter */}
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
                onClick={() => setSearchQuery(searchQuery === 'mojo' ? '' : 'mojo')}
              >
                Mojo
              </Badge>
            </div>

            {/* Search */}
            <div className="relative">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredNotes.map((note) => (
                <NoteCard key={note.id} note={note} />
              ))}
              
              {/* Load More Trigger */}
              {hasNextPage && !searchQuery && (
                <div ref={ref} className="py-4">
                  {isFetchingNextPage && (
                    <Card>
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
                  )}
                </div>
              )}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="py-12 px-8 text-center">
                <div className="max-w-sm mx-auto space-y-6">
                  {searchQuery ? (
                    <>
                      <p className="text-muted-foreground">
                        Keine Notes gefunden für deine Suche.
                      </p>
                      <button
                        onClick={() => setSearchQuery('')}
                        className="text-sm text-primary hover:underline"
                      >
                        Suche zurücksetzen
                      </button>
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

function NoteCard({ note }: { note: any }) {
  const author = useAuthor(note.pubkey);
  const authorName = author.data?.metadata?.name || genUserName(note.pubkey);
  const authorAvatar = author.data?.metadata?.picture;
  const tags = extractNoteTags(note);
  const images = extractNoteImages(note);

  return (
    <Card className="hover:shadow-md transition-shadow flex flex-col h-full">
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
  );
}

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
