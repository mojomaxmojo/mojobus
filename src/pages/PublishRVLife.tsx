import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/useToast';
import { useUploadFile } from '@/hooks/useUploadFile';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { FileText, MessageSquare, Map, Upload, Image as ImageIcon } from 'lucide-react';
import { ContentEditor } from '@/components/ContentEditor';
import { CountrySelector, getCountryTag } from '@/components/CountrySelector';
import { RV_LIFE_CATEGORIES, createRVLifeTags } from '@/config/rvLife';
import { CONTENT_CATEGORIES } from '@/config/contentCategories';
import { MAIN_MENU } from '@/config/menu';
import { getAllRVLifeTagConfigs, getRVLifeCategoryById } from '@/config/rvLifeHelpers';
import { nip19 } from 'nostr-tools';
import { useAutoSave } from '@/hooks/useAutoSave';
import { useConflictDetector } from '@/hooks/useConflictDetector';

export function Publish() {
  const { user } = useCurrentUser();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('content-editor');
  const editEventId = new URLSearchParams(window.location.search).get('edit');
  const [selectedRVLifeCategory, setSelectedRVLifeCategory] = useState('kueche_essen');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [location, setLocation] = useState('');
  const { toast } = useToast();
  const { mutate: publishEvent } = useNostrPublish();
  const { mutateAsync: uploadFile } = useUploadFile();

  const rvLifeTagConfigs = getAllRVLifeTagConfigs();

  const handleRVLifeCategoryChange = (categoryId: string) => {
    setSelectedRVLifeCategory(categoryId);
    setSelectedTags([]);
  };

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleRVLifePublish = async () => {
    if (!title.trim() && !content.trim() && files.length === 0) {
      toast({
        title: 'Fehler',
        description: 'Bitte gib einen Titel, Text oder lade eine Datei hoch.',
        variant: 'destructive'
      });
      return;
    }

    try {
      let fileUrls: string[] = [];

      // Upload files if any
      for (const file of files) {
        const uploadResult = await uploadFile(file);
        if (Array.isArray(uploadResult) && uploadResult.length > 0) {
          const urlTag = uploadResult.find((tag: any) => tag[0] === 'url');
          if (urlTag) {
            fileUrls.push(urlTag[1]);
          }
        }
      }

      // Create tags
      const allTags = [...selectedTags];
      const rvLifeTags = createRVLifeTags(selectedRVLifeCategory, allTags);

      const tags = [
        ['d', `rv-life-${Date.now()}`],
        ['type', 'rv-life'],
        ...rvLifeTags,
        ...fileUrls.map(url => ['image', url]),
        ...(location ? [['location', location]] : []),
      ];

      const finalContent = `${title ? `# ${title}\n\n` : ''}${content.trim()}\n\n${fileUrls.map(url => `![](${url})`).join('\n\n')}`;

      publishEvent({
        kind: 1,
        content: finalContent,
        tags
      });

      toast({
        title: 'Erfolg!',
        description: 'RV Life Inhalt veroffentlicht.'
      });

      // Reset form
      setTitle('');
      setContent('');
      setFiles([]);
      setLocation('');
      setSelectedTags([]);
      setSelectedRVLifeCategory('kueche_essen');

      // Navigate to RV Life page
      setTimeout(() => {
        navigate('/rv-life');
      }, 1000);

    } catch (error) {
      toast({
        title: 'Fehler',
        description: `Veroffentlichen fehlgeschlagen: ${error}`,
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4 space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">RV Life Veroffentlichen</h1>
          <p className="text-muted-foreground">Teile deine Wohnmobil-Erfahrungen mit der Community</p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="rv-life" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="rv-life">RV Life</TabsTrigger>
            <TabsTrigger value="content-editor">Editor</TabsTrigger>
            <TabsTrigger value="content-management">Management</TabsTrigger>
          </TabsList>

          <TabsContent value="rv-life">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  RV Life Content
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Category Selection */}
                <div className="space-y-4">
                  <Label>Kategorie wählen</Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Object.values(RV_LIFE_CATEGORIES).map((cat) => (
                      <div
                        key={cat.id}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          selectedRVLifeCategory === cat.id
                            ? 'border-primary bg-primary/5'
                            : 'border-muted hover:border-primary/50'
                        }`}
                        onClick={() => handleRVLifeCategoryChange(cat.id)}
                      >
                        <div className="text-2xl mb-2 text-center">
                          {cat.icon}
                        </div>
                        <div className="text-center">
                          <div className="font-semibold">{cat.name}</div>
                          <div className="text-sm text-muted-foreground">{cat.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tag Selection */}
                <div className="space-y-4">
                  <Label>Tags auswählen</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {rvLifeTagConfigs[selectedRVLifeCategory]?.optional.map((tag) => (
                      <Badge
                        key={tag}
                        variant={selectedTags.includes(tag) ? "default" : "outline"}
                        className="cursor-pointer text-sm px-3 py-1"
                        onClick={() => handleTagToggle(tag)}
                      >
                        {selectedTags.includes(tag) && '✓ '}
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedTags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="default"
                        className="text-xs px-2 py-1 bg-destructive/10 hover:bg-destructive/20"
                        onClick={() => handleTagToggle(tag)}
                      >
                        {tag} ×
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Title Input */}
                <div className="space-y-2">
                  <Label htmlFor="title">Titel</Label>
                  <input
                    id="title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Gib deiner Inhalt einen Titel..."
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                {/* Content Textarea */}
                <div className="space-y-2">
                  <Label htmlFor="content">Inhalt</Label>
                  <Textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Schreibe deinen Inhalt..."
                    rows={8}
                    className="w-full"
                  />
                </div>

                {/* File Upload */}
                <div className="space-y-2">
                  <Label>Dateien hochladen</Label>
                  <input
                    type="file"
                    multiple
                    onChange={(e) => setFiles(Array.from(e.target.files))}
                    className="w-full"
                    accept="image/*,.pdf"
                  />
                </div>

                {/* Location Input */}
                <div className="space-y-2">
                  <Label htmlFor="location">Standort</Label>
                  <input
                    id="location"
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="📍 Wo warst du?"
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                {/* Publish Button */}
                <div className="pt-4">
                  <Button
                    onClick={handleRVLifePublish}
                    className="w-full"
                    size="lg"
                    disabled={!user}
                  >
                    <Upload className="h-5 w-5 mr-2" />
                    RV Life veroffentlichen
                  </Button>
                  {!user && (
                    <p className="text-sm text-muted-foreground text-center mt-2">
                      Bitte logge dich ein, um Inhalte zu veroffentlichen.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="content-editor">
            <Card>
              <CardHeader>
                <CardTitle>Content Editor</CardTitle>
              </CardHeader>
              <CardContent>
                <ContentEditor />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="content-management">
            <Card>
              <CardHeader>
                <CardTitle>Content Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-center text-muted-foreground py-12">
                  Content Management Coming Soon...
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
