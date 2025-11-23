import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useToast } from '@/hooks/useToast';
import { useUploadFile } from '@/hooks/useUploadFile';
import { NOSTR_CONFIG } from '@/config/nostr';
import { FileText, MessageSquare, Loader2, X, Upload, Image as ImageIcon, MapPin } from 'lucide-react';
import { nip19 } from 'nostr-tools';

export function Publish() {
  const { user } = useCurrentUser();
  const { toast } = useToast();
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="min-h-screen py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground mb-4">
                  Du musst angemeldet sein, um Inhalte zu veröffentlichen.
                </p>
                <Button onClick={() => navigate('/')}>Zur Startseite</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold">Veröffentlichen</h1>
            <p className="text-lg text-muted-foreground">
              Teile deine Geschichten und Gedanken mit der Welt
            </p>
          </div>

          {/* Publish Tabs */}
          <Tabs defaultValue="note" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="note" className="gap-2">
                <MessageSquare className="h-4 w-4" />
                Note
              </TabsTrigger>
              <TabsTrigger value="article" className="gap-2">
                <FileText className="h-4 w-4" />
                Artikel
              </TabsTrigger>
            </TabsList>

            <TabsContent value="note">
              <PublishNoteForm />
            </TabsContent>

            <TabsContent value="article">
              <PublishArticleForm />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function PublishNoteForm() {
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [position, setPosition] = useState('');
  const { mutate: createEvent, isPending } = useNostrPublish();
  const { mutateAsync: uploadFile, isPending: isUploading } = useUploadFile();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleAddTag = () => {
    const tag = tagInput.trim().toLowerCase().replace(/^#/, '');
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const [[_, url]] = await uploadFile(file);
      setImages(prev => [...prev, url]);
      toast({
        title: 'Bild hochgeladen!',
        description: 'Das Bild wurde erfolgreich hochgeladen.',
      });
    } catch (error) {
      toast({
        title: 'Fehler beim Hochladen',
        description: 'Das Bild konnte nicht hochgeladen werden.',
        variant: 'destructive',
      });
    }

    // Reset input
    e.target.value = '';
  };

  const removeImage = (imageUrl: string) => {
    setImages(prev => prev.filter(img => img !== imageUrl));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      toast({
        title: 'Fehler',
        description: 'Bitte gib einen Text ein.',
        variant: 'destructive',
      });
      return;
    }

    let finalContent = content.trim();
    const eventTags = tags.map(tag => ['t', tag]);

    // Add position as location tag if provided
    if (position.trim()) {
      eventTags.push(['location', position.trim()]);
    }

    // Add imeta tags for each image
    images.forEach(imageUrl => {
      eventTags.push(['imeta', `url ${imageUrl}`]);
      // Add image URL to content
      finalContent += `\n\n${imageUrl}`;
    });

    createEvent(
      {
        kind: NOSTR_CONFIG.kinds.note,
        content: finalContent,
        tags: eventTags,
      },
      {
        onSuccess: () => {
          toast({
            title: 'Erfolgreich veröffentlicht!',
            description: 'Deine Note wurde auf Nostr veröffentlicht.',
          });
          setContent('');
          setTags([]);
          setImages([]);
          setPosition('');
          navigate('/notes');
        },
        onError: (error) => {
          toast({
            title: 'Fehler beim Veröffentlichen',
            description: error.message,
            variant: 'destructive',
          });
        },
      }
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Neue Note</CardTitle>
        <CardDescription>
          Teile einen kurzen Gedanken, ein Update oder eine Erfahrung
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="note-content">Text</Label>
            <Textarea
              id="note-content"
              placeholder="Was möchtest du teilen?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              disabled={isPending}
            />
            <p className="text-xs text-muted-foreground">
              {content.length} Zeichen
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="note-position" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Position
            </Label>
            <Input
              id="note-position"
              placeholder="Wo bist du gerade? (z.B. Thailand, Strand von Patong)"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="note-tags">Tags</Label>
            <div className="flex gap-2">
              <Input
                id="note-tags"
                placeholder="Tag hinzufügen (z.B. vanlife)"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                disabled={isPending}
              />
              <Button type="button" onClick={handleAddTag} variant="outline" disabled={isPending}>
                Hinzufügen
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    #{tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <Label>Bilder</Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('note-image-upload')?.click()}
                disabled={isPending || isUploading}
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                {isUploading ? 'Lädt...' : 'Bild hochladen'}
              </Button>
              <input
                id="note-image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                disabled={isPending || isUploading}
              />
              <span className="text-xs text-muted-foreground">
                JPG, PNG, GIF, WebP
              </span>
            </div>

            {/* Preview uploaded images */}
            {images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                {images.map((imageUrl, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={imageUrl}
                      alt={`Upload ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(imageUrl)}
                      className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      disabled={isPending}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={isPending || !content.trim()} className="flex-1">
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Veröffentlichen
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setContent('');
                setTags([]);
                setImages([]);
                setPosition('');
              }}
              disabled={isPending}
            >
              Zurücksetzen
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function PublishArticleForm() {
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [image, setImage] = useState('');
  const [position, setPosition] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const { mutate: createEvent, isPending } = useNostrPublish();
  const { mutateAsync: uploadFile } = useUploadFile();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleAddTag = () => {
    const tag = tagInput.trim().toLowerCase().replace(/^#/, '');
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const [[_, url]] = await uploadFile(file);
      setImage(url);
      toast({
        title: 'Bild hochgeladen!',
        description: 'Das Titelbild wurde erfolgreich hochgeladen.',
      });
    } catch (error) {
      toast({
        title: 'Fehler beim Hochladen',
        description: 'Das Bild konnte nicht hochgeladen werden.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }

    // Reset input
    e.target.value = '';
  };

  const removeImage = () => {
    setImage('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      toast({
        title: 'Fehler',
        description: 'Bitte fülle mindestens Titel und Inhalt aus.',
        variant: 'destructive',
      });
      return;
    }

    // Erstelle einen URL-freundlichen Identifier aus dem Titel
    const identifier = title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    const eventTags: string[][] = [
      ['d', identifier],
      ['title', title.trim()],
    ];

    if (summary.trim()) {
      eventTags.push(['summary', summary.trim()]);
    }

    if (image.trim()) {
      eventTags.push(['image', image.trim()]);
    }

    tags.forEach(tag => {
      eventTags.push(['t', tag]);
    });

    // Add position as location tag if provided
    if (position.trim()) {
      eventTags.push(['location', position.trim()]);
    }

    // published_at als aktueller Timestamp
    eventTags.push(['published_at', Math.floor(Date.now() / 1000).toString()]);

    createEvent(
      {
        kind: NOSTR_CONFIG.kinds.longform,
        content: content.trim(),
        tags: eventTags,
      },
      {
        onSuccess: (event) => {
          toast({
            title: 'Erfolgreich veröffentlicht!',
            description: 'Dein Artikel wurde auf Nostr veröffentlicht.',
          });

          // Navigate to the article
          const naddr = nip19.naddrEncode({
            kind: event.kind,
            pubkey: event.pubkey,
            identifier,
          });

          navigate(`/${naddr}`);
        },
        onError: (error) => {
          toast({
            title: 'Fehler beim Veröffentlichen',
            description: error.message,
            variant: 'destructive',
          });
        },
      }
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Neuer Artikel</CardTitle>
        <CardDescription>
          Schreibe einen ausführlichen Artikel über deine Erfahrungen
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="article-title">Titel *</Label>
            <Input
              id="article-title"
              placeholder="Ein spannender Titel..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isPending}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="article-summary">Zusammenfassung</Label>
            <Textarea
              id="article-summary"
              placeholder="Eine kurze Zusammenfassung des Artikels..."
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={3}
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label>Titelbild</Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('article-image-upload')?.click()}
                disabled={isPending || isUploading}
                className="gap-2"
              >
                <ImageIcon className="h-4 w-4" />
                {isUploading ? 'Lädt...' : 'Titelbild hochladen'}
              </Button>
              <input
                id="article-image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                disabled={isPending || isUploading}
              />
              <span className="text-xs text-muted-foreground">
                JPG, PNG, GIF, WebP
              </span>
            </div>

            {/* Preview uploaded image */}
            {image && (
              <div className="relative group">
                <img
                  src={image}
                  alt="Titelbild Vorschau"
                  className="w-full h-48 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  disabled={isPending}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="article-position" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Position
            </Label>
            <Input
              id="article-position"
              placeholder="Wo wurde dieser Artikel geschrieben? (z.B. Thailand, Strand von Patong)"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="article-content">Inhalt *</Label>
            <Textarea
              id="article-content"
              placeholder="Schreibe deinen Artikel... (Markdown wird unterstützt)"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={12}
              disabled={isPending}
              required
            />
            <p className="text-xs text-muted-foreground">
              {content.length} Zeichen • Markdown-Formatierung wird unterstützt
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="article-tags">Tags</Label>
            <div className="flex gap-2">
              <Input
                id="article-tags"
                placeholder="Tag hinzufügen"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                disabled={isPending}
              />
              <Button type="button" onClick={handleAddTag} variant="outline" disabled={isPending}>
                Hinzufügen
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    #{tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={isPending || !title.trim() || !content.trim()} className="flex-1">
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Artikel veröffentlichen
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setTitle('');
                setSummary('');
                setContent('');
                setImage('');
                setPosition('');
                setTags([]);
              }}
              disabled={isPending}
            >
              Zurücksetzen
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
