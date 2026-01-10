import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { FileText, MessageSquare, Map, Upload, Image as ImageIcon, Video, Music, File, Camera, MapPin, Calendar, Tag, Battery, Sun, Wrench, Hammer, Cpu, Mountain, Calendar as CalendarIcon, Lightbulb, Dog, Trees, Droplets, Waves, Eye, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/useToast';
import { useUploadFile } from '@/hooks/useUploadFile';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { CONTENT_CATEGORIES, createRequiredTags, getOptionalTags, getTabConfig } from '@/config/contentCategories';
import { CountrySelector, getCountryTag } from '@/components/CountrySelector';
import { ARTICLE_CATEGORIES, DIY_CATEGORIES, DIY_TAGS, NATURE_CATEGORIES, NATURE_TAGS, TAG_GROUPS } from '@/config';
import MAIN_MENU from '@/config/menu';
import { nip19 } from 'nostr-tools';

// Media Types Configuration
const mediaTypes = [
  { type: 'image', label: 'Bilder', icon: ImageIcon, extensions: ['jpg', 'jpeg', 'png', 'webp', 'gif'], accept: 'image/*' },
  { type: 'video', label: 'Videos', icon: Video, extensions: ['mp4', 'mov', 'webm'], accept: 'video/*' },
  { type: 'audio', label: 'Audio', icon: Music, extensions: ['mp3', 'wav', 'm4a'], accept: 'audio/*' },
  { type: 'document', label: 'Dokumente', icon: File, extensions: ['pdf', 'kml', 'gpx'], accept: '.pdf,.kml,.gpx' }
];

// Media Categories - TODO: Move to config file
const mainCategories = [
  { value: 'vanlife', label: 'Vanlife', icon: '🚐' },
  { value: 'technik', label: 'Technik & Solar', icon: '⚡' },
  { value: 'reisen', label: 'Reisen', icon: '🗺️' },
  { value: 'leben', label: 'Lifestyle', icon: '🌊' },
  { value: 'natur', label: 'Natur', icon: '🌲' }
];

const subCategories = {
  vanlife: ['camping', 'wildcamping', 'stellplatz', '4x4', 'minimalismus'],
  technik: ['solarenergie', 'batterie', 'internet', 'navigation', 'reparatur'],
  reisen: ['europa', 'portugal', 'spanien', 'kroatien', 'italien', 'route'],
  leben: ['kochen', 'fitness', 'freedom', 'community', 'bitcoin', 'sunset'],
  natur: ['tiere', 'blumen', 'strand', 'berge', 'wald', 'meer']
};

interface MediaFile {
  id: string;
  file: File;
  url?: string;
  name: string;
  type: string;
  size: number;
  preview?: string;
  uploaded?: boolean;
  tags?: string[];
}

function MediaUploadForm({ editEvent }: { editEvent?: any }) {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [mainCategory, setMainCategory] = useState('');
  const [selectedSubTags, setSelectedSubTags] = useState<string[]>([]);
  const [date, setDate] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [customTags, setCustomTags] = useState<string>('');
  const [location, setLocation] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [detailedTags, setDetailedTags] = useState<string[]>([]);
  const { toast } = useToast();
  const { mutateAsync: uploadFile } = useUploadFile();
  const { mutate: publishEvent } = useNostrPublish();
  const navigate = useNavigate();

  // Handler functions
  const handleMainCategoryChange = (value: string) => {
    setMainCategory(value);
    setSelectedSubTags([]); // Reset sub-tags when main category changes
    setDetailedTags([]); // Reset detailed tags when main category changes
  };

  const handleDetailedTagToggle = (tag: string) => {
    setDetailedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleSubTagToggle = (tag: string) => {
    setSelectedSubTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  // Load edit data
  useEffect(() => {
    if (editEvent) {
      // Extract title from content
      const lines = editEvent.content.split('\n');
      const titleMatch = lines[0]?.match(/^# (.+)$/);
      if (titleMatch) {
        setTitle(titleMatch[1]);
        setDescription(lines.slice(2).join('\n').trim());
      } else {
        setDescription(editEvent.content || '');
      }

      // Extract tags
      const eventTags = editEvent.tags?.filter((tag: any) => tag[0] === 't')?.map((tag: any) => tag[1]) || [];
      const categoryTag = eventTags.find(tag => ['vanlife', 'technik', 'reisen', 'leben', 'natur'].includes(tag));
      if (categoryTag) {
        setMainCategory(categoryTag);

        // For natur category, separate subcategories from detailed tags
        if (categoryTag === 'natur') {
          const natureSubcategories = ['tiere', 'blumen', 'strand', 'berge', 'wald', 'meer'];
          const subCategories = eventTags.filter(tag => natureSubcategories.includes(tag));
          const detailedTags = eventTags.filter(tag =>
            !natureSubcategories.includes(tag) &&
            tag !== categoryTag &&
            !['portugal', 'spanien', 'frankreich', 'belgien', 'deutschland', 'luxemburg'].includes(tag)
          );
          setSelectedSubTags(subCategories);
          setDetailedTags(detailedTags);
        } else {
          setSelectedSubTags(eventTags.filter(tag => tag !== categoryTag));
        }
      }
      setLocation(editEvent.tags?.find((tag: any) => tag[0] === 'location')?.[1] || '');
      const dateTag = editEvent.tags?.find((tag: any) => tag[0] === 'published_at')?.[1];
      if (dateTag) {
        // Wenn Unix-Timestamp, in Datum umwandeln
        if (/^\d+$/.test(dateTag)) {
          setDate(new Date(parseInt(dateTag) * 1000).toISOString().split('T')[0]);
        } else {
          // Wenn schon im richtigen Format
          setDate(dateTag);
        }
      }

      // Extract country from tags
      const countryTags = ['portugal', 'spanien', 'frankreich', 'belgien', 'deutschland', 'luxemburg'];
      const foundCountry = eventTags.find(tag => countryTags.includes(tag));
      if (foundCountry) {
        setSelectedCountry(foundCountry);
      }
    } else {
      // Bei neuen Beiträgen: aktuelles Datum setzen
      setDate(''); // Wird im useEffect neu auf aktuelles Datum gesetzt
    }
  }, [editEvent]);

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const newFiles: MediaFile[] = Array.from(selectedFiles).map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      name: file.name,
      type: file.type.startsWith('image/') ? 'image' :
            file.type.startsWith('video/') ? 'video' :
            file.type.startsWith('audio/') ? 'audio' : 'document',
      size: file.size,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
    }));

    setFiles(prev => [...prev, ...newFiles]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleSubmit = async () => {
    if (files.length === 0) {
      toast({
        title: 'Fehler',
        description: 'Bitte waehle mindestens eine Datei aus.',
        variant: 'destructive'
      });
      return;
    }

    try {
      // Upload all files
      const uploadedUrls: string[] = [];
      for (const fileObj of files) {
        console.log('Uploading file:', fileObj.file.name, 'Size:', fileObj.file.size, 'Type:', fileObj.file.type);

        try {
          console.log('Starting upload attempt for:', fileObj.file.name);
          const uploadResult = await uploadFile(fileObj.file);
          console.log('Upload successful, result:', uploadResult);

          if (!uploadResult) {
            throw new Error('Upload returned null');
          }

          // Check if uploadResult is an array (expected format from BlossomUploader)
          if (!Array.isArray(uploadResult)) {
            console.error('Upload result is not an array:', typeof uploadResult, uploadResult);
            throw new Error('Upload returned invalid format - expected array');
          }

          if (uploadResult.length === 0) {
            throw new Error('Upload returned empty array');
          }

          console.log('Processing upload result array:', uploadResult);

          // Find the URL tag (format: ['url', 'https://...'])
          const urlTag = uploadResult.find(tag => Array.isArray(tag) && tag.length >= 2 && tag[0] === 'url');

          if (!urlTag) {
            // Fallback: try to get the first tag that looks like a URL
            const potentialUrlTag = uploadResult.find(tag =>
              Array.isArray(tag) &&
              tag.length >= 2 &&
              typeof tag[1] === 'string' &&
              tag[1].startsWith('http')
            );

            if (potentialUrlTag) {
              uploadedUrls.push(potentialUrlTag[1]);
              console.log('Using fallback URL tag:', potentialUrlTag[1]);
            } else {
              console.error('No URL tag found in upload result:', uploadResult);
              throw new Error('No URL found in upload result');
            }
          } else {
            uploadedUrls.push(urlTag[1]);
            console.log('Successfully uploaded:', urlTag[1]);
          }
        } catch (uploadError) {
          console.error('Upload failed for file:', fileObj.file.name, uploadError);
          console.error('Upload error details:', {
            name: uploadError.name,
            message: uploadError.message,
            stack: uploadError.stack
          });
          throw new Error(`Upload failed for ${fileObj.file.name}: ${uploadError.message}`);
        }
      }

      // Create content with file URLs
      const content = `${title ? `# ${title}\n\n` : ''}${description ? `${description}\n\n` : ''}${uploadedUrls.join('\n\n')}`;

      // Collect all tags from different sources for createRequiredTags
      const allTags = [
        ...selectedSubTags,
        ...detailedTags,
        ...(customTags ? customTags.split(' ').filter(Boolean) : []),
        ...(getCountryTag(selectedCountry).filter(tag => !tag.startsWith('#'))) // Nur Land-Codes, keine #Tags
      ];

      // Create tags from config (includes required media tags + all additional tags)
      const baseTags = createRequiredTags('media', allTags);

      // Additional special tags
      const additionalTags = [['type', 'media']]; // Explicit type marker

      if (mainCategory) additionalTags.push(['t', mainCategory]);

      // Add location and date tags
      if (location) additionalTags.push(['location', location]);
      if (date) additionalTags.push(['published_at', date]);

      // Final tag array
      const tags = [
        ...baseTags,
        ...additionalTags
      ];

      console.log('Publishing event with tags:', tags);
      console.log('Content length:', content.length);

      // Publish to Nostr
      try {
        publishEvent({
          kind: 1, // Text note with media attachments
          content,
          tags
        });
        console.log('Event published successfully');
      } catch (publishError) {
        console.error('Publish failed:', publishError);
        throw new Error(`Publishing failed: ${publishError.message}`);
      }

      toast({
        title: 'Erfolg!',
        description: 'Bilder erfolgreich hochgeladen und veroeffentlicht.'
      });

      // Reset form and redirect
      setFiles([]);
      setTitle('');
      setDescription('');
      setMainCategory('');
      setSelectedSubTags([]);
      setDetailedTags([]);
      setCustomTags('');
      setLocation('');
      setSelectedCountry('');
      setDate(''); // Wird im useEffect neu auf aktuelles Datum gesetzt

      // Redirect to bilder page after successful publish
      setTimeout(() => {
        navigate('/bilder');
      }, 1000);

    } catch (error) {
      console.error('Complete upload error:', error);
      toast({
        title: 'Fehler',
        description: `Upload fehlgeschlagen: ${error.message || 'Unbekannter Fehler'}`,
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Medien hochladen
          </CardTitle>
          <CardDescription>
            Lade Bilder, Videos, Audio oder Dokumente hoch fuer deine Vanlife-Reise
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging ? 'border-ocean-500 bg-ocean-50' : 'border-gray-300 dark:border-gray-600'
            }`}
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
          >
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">Dateien hochladen</h3>
            <p className="text-sm text-gray-500 mb-4">
              Drag & Drop oder klicken zum Auswaehlen
            </p>

            <div className="flex flex-wrap justify-center gap-2 mb-4">
              {mediaTypes.map(mediaType => (
                <Badge key={mediaType.type} variant="outline" className="gap-1">
                  <mediaType.icon className="h-3 w-3" />
                  {mediaType.label}
                </Badge>
              ))}
            </div>

            <input
              type="file"
              multiple
              accept={mediaTypes.map(m => m.accept).join(',')}
              onChange={(e) => handleFileSelect(e.target.files)}
              className="hidden"
              id="file-upload"
            />
            <Button asChild>
              <label htmlFor="file-upload" className="cursor-pointer">
                <Camera className="h-4 w-4 mr-2" />
                Dateien auswaehlen
              </label>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Media Preview */}
      {files.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Vorschau ({files.length} Dateien)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {files.map(file => (
                <div key={file.id} className="relative group border rounded-lg overflow-hidden">
                  {file.preview ? (
                    <img
                      src={file.preview}
                      alt={file.name}
                      className="w-full h-32 object-cover rounded"
                    />
                  ) : (
                    <div className="w-full h-32 bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center">
                      {file.type === 'video' && <Video className="h-8 w-8 text-gray-400" />}
                      {file.type === 'audio' && <Music className="h-8 w-8 text-gray-400" />}
                      {file.type === 'document' && <File className="h-8 w-8 text-gray-400" />}
                    </div>
                  )}
                  <div className="text-sm">
                    <p className="font-medium truncate">{file.name}</p>
                    <p className="text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => removeFile(file.id)}
                  >
                    Löschen
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Media Details */}
      <Card>
        <CardHeader>
          <CardTitle>Bilderdetails</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="title">Titel</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Gib deinen Bildern einen Titel..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Datum</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Beschreibung</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Beschreibe deine Bilder-Erlebnisse..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Standort</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="📍 Wo wurden die Bilder aufgenommen?"
            />
          </div>

          {/* Country Selection */}
          <CountrySelector
            selectedCountry={selectedCountry}
            onCountryChange={setSelectedCountry}
            placeholder="Land auswaehlen"
          />

          {/* Categories */}
          <div className="space-y-4">
            <Label>Kategorien</Label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Hauptkategorie</Label>
                <Select value={mainCategory} onValueChange={handleMainCategoryChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Hauptkategorie waehlen" />
                  </SelectTrigger>
                  <SelectContent>
                    {mainCategories.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>
                        <span className="flex items-center gap-2">
                          <span>{cat.icon}</span>
                          {cat.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Themen</Label>
                  {selectedSubTags.length > 0 && (
                    <span className="text-sm text-muted-foreground">
                      {selectedSubTags.length} ausgewählt
                    </span>
                  )}
                </div>

                {mainCategory ? (
                  <>
                    <div className="flex flex-wrap gap-2">
                      {subCategories[mainCategory as keyof typeof subCategories]?.map(tag => (
                        <Badge
                          key={tag}
                          variant={selectedSubTags.includes(tag) ? "default" : "outline"}
                          className={`cursor-pointer transition-all hover:scale-105 ${
                            selectedSubTags.includes(tag)
                              ? "bg-ocean-600 hover:bg-ocean-700 text-white"
                              : "hover:bg-ocean-100 hover:text-ocean-700 hover:border-ocean-300"
                          }`}
                          onClick={() => handleSubTagToggle(tag)}
                        >
                          {selectedSubTags.includes(tag) && (
                            <span className="mr-1">✓</span>
                          )}
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    {selectedSubTags.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm font-medium text-muted-foreground mb-1">Ausgewählte Themen:</p>
                        <div className="flex flex-wrap gap-1">
                          {selectedSubTags.map(tag => (
                            <Badge
                              key={tag}
                              variant="secondary"
                              className="text-xs bg-ocean-100 text-ocean-700 hover:bg-ocean-200"
                            >
                              {tag}
                              <button
                                onClick={() => handleSubTagToggle(tag)}
                                className="ml-1 hover:text-ocean-900"
                              >
                                ×
                              </button>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Special handling for Nature category - show detailed tags */}
                    {mainCategory === 'natur' && selectedSubTags.length > 0 && (
                      <div className="mt-4 space-y-3">
                        <div className="text-sm font-medium text-muted-foreground">
                          Detaillierte Tags für {selectedSubTags.join(', ')}:
                        </div>
                        {selectedSubTags.map(subCategory => {
                          const categoryConfig = MAIN_MENU.nature[subCategory as keyof typeof MAIN_MENU.nature];
                          if (!categoryConfig?.tags) return null;

                          return (
                            <div key={subCategory} className="space-y-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">{categoryConfig.emoji}</span>
                                <span className="font-medium">{categoryConfig.name}</span>
                              </div>

                              <div className="space-y-2">
                                <div>
                                  <p className="text-xs font-medium text-muted-foreground mb-1">Primär-Tags:</p>
                                  <div className="flex flex-wrap gap-1">
                                    {categoryConfig.tags.primary.map(tag => (
                                      <Badge
                                        key={`primary-${tag}`}
                                        variant={detailedTags.includes(tag) ? "default" : "outline"}
                                        className={`text-xs cursor-pointer transition-all hover:scale-105 ${
                                          detailedTags.includes(tag)
                                            ? "bg-green-600 hover:bg-green-700 text-white"
                                            : "hover:bg-green-100 hover:text-green-700 hover:border-green-300"
                                        }`}
                                        onClick={() => handleDetailedTagToggle(tag)}
                                      >
                                        {detailedTags.includes(tag) && <span className="mr-1">✓</span>}
                                        #{tag}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>

                                <div>
                                  <p className="text-xs font-medium text-muted-foreground mb-1">Sekundär-Tags:</p>
                                  <div className="flex flex-wrap gap-1">
                                    {categoryConfig.tags.secondary.map(tag => (
                                      <Badge
                                        key={`secondary-${tag}`}
                                        variant={detailedTags.includes(tag) ? "default" : "outline"}
                                        className={`text-xs cursor-pointer transition-all hover:scale-105 ${
                                          detailedTags.includes(tag)
                                            ? "bg-blue-600 hover:bg-blue-700 text-white"
                                            : "hover:bg-blue-100 hover:text-blue-700 hover:border-blue-300"
                                        }`}
                                        onClick={() => handleDetailedTagToggle(tag)}
                                      >
                                        {detailedTags.includes(tag) && <span className="mr-1">✓</span>}
                                        #{tag}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Show selected detailed tags */}
                    {detailedTags.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm font-medium text-muted-foreground mb-1">Ausgewählte Detail-Tags:</p>
                        <div className="flex flex-wrap gap-1">
                          {detailedTags.map(tag => (
                            <Badge
                              key={tag}
                              variant="secondary"
                              className="text-xs bg-gray-100 text-gray-700 hover:bg-gray-200"
                            >
                              #{tag}
                              <button
                                onClick={() => handleDetailedTagToggle(tag)}
                                className="ml-1 hover:text-gray-900"
                              >
                                ×
                              </button>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-sm text-muted-foreground p-3 bg-gray-50 dark:bg-gray-800 rounded-md border border-dashed">
                    Bitte wähle zuerst eine Hauptkategorie
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Eigene Tags</Label>
              <Input
                placeholder="sunset-watching vanlife portugal (mit Leerzeichen trennen)"
                value={customTags}
                onChange={(e) => setCustomTags(e.target.value)}
              />
              {customTags && (
                <div className="mt-2">
                  <p className="text-sm font-medium text-muted-foreground mb-1">Vorschau:</p>
                  <div className="flex flex-wrap gap-1">
                    {customTags.split(' ').filter(Boolean).map((tag, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="text-xs bg-purple-100 text-purple-700 border-purple-300"
                      >
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tag Summary */}
          {(mainCategory || selectedSubTags.length > 0 || detailedTags.length > 0 || customTags) && (
            <div className="mt-6 p-4 bg-ocean-50 dark:bg-ocean-950 rounded-lg border border-ocean-200 dark:border-ocean-800">
              <h4 className="font-medium text-ocean-900 dark:text-ocean-100 mb-3">
                📋 Zusammenfassung aller Tags
              </h4>
              <div className="space-y-2">
                {mainCategory && (
                  <div>
                    <span className="text-xs font-medium text-muted-foreground">Hauptkategorie:</span>
                    <Badge className="ml-2 bg-ocean-600 text-white">
                      {mainCategories.find(cat => cat.value === mainCategory)?.icon} {mainCategory}
                    </Badge>
                  </div>
                )}
                {selectedSubTags.length > 0 && (
                  <div>
                    <span className="text-xs font-medium text-muted-foreground">Themen:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedSubTags.map(tag => (
                        <Badge key={tag} variant="secondary" className="bg-ocean-100 text-ocean-700">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {detailedTags.length > 0 && (
                  <div>
                    <span className="text-xs font-medium text-muted-foreground">Detail-Tags:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {detailedTags.map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs border-green-300 text-green-700">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {customTags && (
                  <div>
                    <span className="text-xs font-medium text-muted-foreground">Eigene Tags:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {customTags.split(' ').filter(Boolean).map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs border-purple-300 text-purple-700">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <Button
            onClick={handleSubmit}
            className="w-full"
            disabled={files.length === 0}
          >
            <Upload className="h-4 w-4 mr-2" />
            Bilder veroeffentlichen
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// Note Form Component
function NoteForm({ editEvent }: { editEvent?: any }) {
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [isPublic, setIsPublic] = useState(true);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();
  const { mutate: publishEvent } = useNostrPublish();
  const { mutateAsync: uploadFile } = useUploadFile();
  const navigate = useNavigate();

  // Load edit data
  useEffect(() => {
    if (editEvent) {
      setContent(editEvent.content || '');
      const eventTags = editEvent.tags?.filter((tag: any) => tag[0] === 't')?.map((tag: any) => tag[1]) || [];
      setTags(eventTags);

      // Extract country from tags
      const countryTags = ['portugal', 'spanien', 'frankreich', 'belgien', 'deutschland', 'luxemburg'];
      const foundCountry = eventTags.find(tag => countryTags.includes(tag));
      if (foundCountry) {
        setSelectedCountry(foundCountry);
      }

      // Extract images from edit content
      const imageTags = editEvent.tags?.filter((tag: any) => tag[0] === 'image')?.map((tag: any) => tag[1]) || [];
      if (imageTags.length > 0) {
        setImageUrls(imageTags);
      }
    }
  }, [editEvent]);

  const handleTagToggle = (tag: string) => {
    setTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };



  const handleImageSelect = (files: FileList | null) => {
    if (!files) return;

    // Filter for image files only
    const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
    setImageFiles(prev => [...prev, ...imageFiles]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleImageSelect(e.dataTransfer.files);
  };

  const removeImageFile = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async () => {
    if (imageFiles.length === 0) return;

    try {
      const uploadedUrls: string[] = [];
      for (const file of imageFiles) {
        const [urlTag] = await uploadFile(file);
        uploadedUrls.push(urlTag[1]); // URL is in second position
      }
      setImageUrls(prev => [...prev, ...uploadedUrls]);
      setImageFiles([]);
      toast({
        title: 'Erfolg!',
        description: `${uploadedUrls.length} Bild(er) erfolgreich hochgeladen.`,
      });
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Bild-Upload fehlgeschlagen. Bitte versuche es erneut.',
        variant: 'destructive'
      });
    }
  };

  const removeImageUrl = (index: number) => {
    setImageUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!content.trim()) {
      toast({
        title: 'Fehler',
        description: 'Bitte gib einen Text ein.',
        variant: 'destructive'
      });
      return;
    }

    // Create event tags with country tags
    const baseTags = createRequiredTags('notes', tags);
    const additionalTags = [['type', 'note']]; // Explicit type marker

    // Add country tags
    const countryTags = getCountryTag(selectedCountry);
    countryTags.forEach(tag => additionalTags.push(['t', tag]));

    // Add image tags if images exist
    imageUrls.forEach(url => {
      additionalTags.push(['image', url]);
    });

    const eventTags = [
      ...baseTags,
      ...additionalTags
    ];

    // Create content with images
    let articleContent = content.trim();
    if (imageFiles.length > 0) {
      articleContent += '\n\n'; // Add spacing before images
      imageFiles.forEach((file, index) => {
        articleContent += `\n![Titelbild ${index + 1}](${URL.createObjectURL(file)})`;
      });
    }

    publishEvent({
      kind: 1, // Note
      content: articleContent,
      tags: eventTags
    });

    toast({
      title: 'Erfolg!',
      description: 'Note erfolgreich veroeffentlicht.'
    });

    // Reset form and redirect
    setContent('');
    setTags([]);
    setSelectedCountry('');
    setImageFiles([]);
    setImageUrls([]);

    // Redirect to notes page after successful publish
    setTimeout(() => {
      navigate('/notes');
    }, 1000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Note veroeffentlichen
        </CardTitle>
        <CardDescription>
          Kurze Updates, Gedanken und Momente fuer deine Vanlife-Gemeinschaft
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="note-content">Dein Note</Label>
          <Textarea
            id="note-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Was machst du gerade? Was bewegt dich? Share your vanlife moments..."
            rows={4}
            className="resize-none"
          />
          <p className="text-sm text-muted-foreground">
            {content.length}/500 Zeichen
          </p>
        </div>

        {/* Image Upload Area */}
        <div className="space-y-4">
          <Label>Bilder hinzufuegen</Label>

          {/* Drop Zone */}
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              isDragging ? 'border-ocean-500 bg-ocean-50' : 'border-gray-300 dark:border-gray-600'
            }`}
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
          >
            <Upload className="mx-auto h-8 w-8 text-gray-400 mb-3" />
            <h4 className="text-sm font-medium mb-2">Bilder hinzufuegen</h4>
            <p className="text-xs text-gray-500 mb-3">
              Drag & Drop oder klicken zum Auswaehlen
            </p>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => handleImageSelect(e.target.files)}
              className="hidden"
              id="note-image-upload"
            />
            <Button asChild>
              <label htmlFor="note-image-upload" className="cursor-pointer">
                <Camera className="h-4 w-4 mr-2" />
                Dateien auswaehlen
              </label>
            </Button>
          </div>

          {/* Selected Files Preview */}
          {imageFiles.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Ausgewaehlte Dateien ({imageFiles.length})</Label>
                <Button
                  onClick={uploadImages}
                  size="sm"
                  disabled={imageFiles.length === 0}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Hochladen
                </Button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {imageFiles.map((file, index) => (
                  <div key={index} className="relative group border rounded-lg overflow-hidden">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Upload ${index + 1}`}
                      className="w-full h-20 object-cover"
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeImageFile(index)}
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Uploaded Images */}
          {imageUrls.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Hochgeladene Bilder ({imageUrls.length})</Label>
                <Button
                  onClick={() => setImageUrls([])}
                  variant="outline"
                  size="sm"
                >
                  Alle entfernen
                </Button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {imageUrls.map((url, index) => (
                  <div key={index} className="relative group border rounded-lg overflow-hidden">
                    <img
                      src={url}
                      alt={`Uploaded ${index + 1}`}
                      className="w-full h-20 object-cover"
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeImageUrl(index)}
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <Label>Tags</Label>
          <div className="flex flex-wrap gap-2">
            {getOptionalTags('notes').map(tag => (
              <Badge
                key={tag}
                variant={tags.includes(tag) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => handleTagToggle(tag)}
              >
                {tag}
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Eigene Tags (mit Leerzeichen trennen)..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  const value = e.currentTarget.value;
                  const newTags = value.split(' ').filter(Boolean);
                  setTags(prev => [...prev, ...newTags]);
                  e.currentTarget.value = '';
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              onClick={(e) => {
                const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                const value = input.value;
                const newTags = value.split(' ').filter(Boolean);
                setTags(prev => [...prev, ...newTags]);
                input.value = '';
              }}
            >
              Hinzufügen
            </Button>
          </div>
        </div>

        {tags.length > 0 && (
          <div className="space-y-2">
            <Label>Ausgewaehlte Tags</Label>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="gap-1"
                >
                  {tag}
                  <button
                    className="ml-1 text-xs hover:text-red-500"
                    onClick={() => setTags(prev => prev.filter((_, i) => i !== index))}
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Country Selection */}
        <CountrySelector
          selectedCountry={selectedCountry}
          onCountryChange={setSelectedCountry}
          placeholder="Land auswaehlen"
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Switch
              id="note-public"
              checked={isPublic}
              onCheckedChange={setIsPublic}
            />
            <Label htmlFor="note-public">Öffentlich sichtbar</Label>
          </div>

          <Button onClick={handleSubmit} disabled={!content.trim()}>
            <MessageSquare className="h-4 w-4 mr-2" />
            Note veroeffentlichen
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Place Form Component
function PlaceForm({ editEvent }: { editEvent?: any }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [coordinates, setCoordinates] = useState({ lat: '', lng: '' });
  const [category, setCategory] = useState('');
  const [rating, setRating] = useState(5);
  const [facilities, setFacilities] = useState<string[]>([]);
  const [bestFor, setBestFor] = useState<string[]>([]);
  const [price, setPrice] = useState('');
  const [image, setImage] = useState('');
  const [additionalImages, setAdditionalImages] = useState<string[]>([]);
  const [additionalImagesUrlInput, setAdditionalImagesUrlInput] = useState('');
  const [manualTags, setManualTags] = useState<string[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const { toast } = useToast();
  const { mutate: publishEvent } = useNostrPublish();
  const { mutateAsync: uploadFile } = useUploadFile();
  const navigate = useNavigate();

  // Load edit data
  useEffect(() => {
    if (editEvent) {
      setName(editEvent.tags?.find((tag: any) => tag[0] === 'name')?.[1] || '');

      // Clean content by removing structured information that's stored in tags
      let cleanContent = editEvent.content || '';

      // Remove title line
      cleanContent = cleanContent.replace(/^# .+?\n\n/, '');

      // Remove structured lines that are stored in tags
      const structuredPatterns = [
        /^## Bilder\n\n.*$/gm, // Images section (multiline)
        /^\*\*Kategorie:\*\*.*$/gm, // Category line
        /^\*\*Bewertung:\*\*.*$/gm, // Rating line
        /^\*\*Standort:\*\*.*$/gm, // Location line
        /^\*\*Koordinaten:\*\*.*$/gm, // Coordinates line
        /^\*\*Einrichtungen:\*\*.*$/gm, // Facilities line
        /^\*\*Geeignet für:\*\*.*$/gm, // Best for line
        /\*\*Preis:\*\*.*/
      ];

      structuredPatterns.forEach(pattern => {
        cleanContent = cleanContent.replace(pattern, '');
      });

      // Clean up extra whitespace
      cleanContent = cleanContent.replace(/\n\s*\n\s*\n/g, '\n\n').trim();

      setDescription(cleanContent || '');
      setLocation(editEvent.tags?.find((tag: any) => tag[0] === 'location')?.[1] || '');
      const latTag = editEvent.tags?.find((tag: any) => tag[0] === 'lat')?.[1];
      const lngTag = editEvent.tags?.find((tag: any) => tag[0] === 'lng')?.[1];
      if (latTag && lngTag) {
        setCoordinates({ lat: latTag, lng: lngTag });
      }
      setCategory(editEvent.tags?.find((tag: any) => tag[0] === 'category')?.[1] || '');
      const ratingTag = editEvent.tags?.find((tag: any) => tag[0] === 'rating')?.[1];
      if (ratingTag) {
        setRating(parseInt(ratingTag));
      }
      const facilityTags = editEvent.tags?.filter((tag: any) => tag[0] === 'facility')?.map((tag: any) => tag[1]) || [];
      setFacilities(facilityTags);
      const bestForTags = editEvent.tags?.filter((tag: any) => tag[0] === 'best_for')?.map((tag: any) => tag[1]) || [];
      setBestFor(bestForTags);
      setPrice(editEvent.tags?.find((tag: any) => tag[0] === 'price')?.[1] || '');

      // Load images
      const imageTags = editEvent.tags?.filter((tag: any) => tag[0] === 'image')?.map((tag: any) => tag[1]) || [];
      if (imageTags.length > 0) {
        setImage(imageTags[0]); // First image is title image
        setAdditionalImages(imageTags.slice(1)); // Rest are additional images
      }

      // Load manual tags (excluding place-specific tags)
      const allTags = editEvent.tags?.filter((tag: any) => tag[0] === 't')?.map((tag: any) => tag[1]) || [];
      const excludedTags = ['location', 'places', 'place', 'campingplatz', 'wildcamping', 'stellplatz', 'aussichtspunkt', 'strand', 'berg', 'see', 'stadt', 'natur', 'portugal', 'spanien', 'italien', 'frankreich', 'deutschland', 'algarve', 'andalusien', 'katalonien', 'toskana', 'strom', 'wasser', 'wc', 'dusche', 'wlan', 'shop', 'familien', 'paare', 'single', 'wohnmobil', 'zelt'];
      const manualTagsOnly = allTags.filter(tag => !excludedTags.includes(tag));
      setManualTags(manualTagsOnly);

      // Extract country from tags
      const countryTags = ['portugal', 'spanien', 'frankreich', 'belgien', 'deutschland', 'luxemburg'];
      const foundCountry = allTags.find(tag => countryTags.includes(tag));
      if (foundCountry) {
        setSelectedCountry(foundCountry);
      }
    }
  }, [editEvent]);

  const categories = [
    { value: 'campingplatz', label: 'Campingplatz', icon: '🏕️' },
    { value: 'wildcamping', label: 'Wildcamping', icon: '🌲' },
    { value: 'stellplatz', label: 'Stellplatz', icon: '🅿️' },
    { value: 'aussichtspunkt', label: 'Aussichtspunkt', icon: '👁️' },
    { value: 'strand', label: 'Strand', icon: '🏖️' },
    { value: 'berg', label: 'Berg', icon: '⛰️' }
  ];

  const facilityOptions = [
    'Strom', 'Wasser', 'WC', 'Dusche', 'WLAN',
    'Shop', 'Restaurant', 'Spielplatz', 'Hund erlaubt',
    'Grill', 'Feuerstelle', 'Chemie-Entsorgung'
  ];

  const bestForOptions = [
    'Familien', 'Paare', 'Single', 'Große Fahrzeuge',
    'Wohnmobile', 'Zelte', 'Ruhe', 'Natur',
    'Meerblick', 'Bergblick', 'Stadtnahe'
  ];

  const handleFacilityToggle = (facility: string) => {
    setFacilities(prev =>
      prev.includes(facility)
        ? prev.filter(f => f !== facility)
        : [...prev, facility]
    );
  };

  const handleBestForToggle = (item: string) => {
    setBestFor(prev =>
      prev.includes(item)
        ? prev.filter(b => b !== item)
        : [...prev, item]
    );
  };

  const handleImageFile = async (file: File) => {
    try {
      const [urlTag] = await uploadFile(file);
      setImage(urlTag[1]); // URL is in second position
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Bild-Upload fehlgeschlagen.',
        variant: 'destructive'
      });
    }
  };

  const handleAdditionalImagesUpload = async (files: File[]) => {
    try {
      const newUrls: string[] = [];
      for (const file of files) {
        const [urlTag] = await uploadFile(file);
        newUrls.push(urlTag[1]);
      }
      setAdditionalImages(prev => [...prev, ...newUrls]);
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Upload zusatzlicher Bilder fehlgeschlagen.',
        variant: 'destructive'
      });
    }
  };

  const removeAdditionalImage = (index: number) => {
    setAdditionalImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleManualTagInput = (input: string) => {
    // Split by both comma and whitespace, remove empty strings and # prefixes
    const tags = input
      .split(/[\s,]+/)
      .map(tag => tag.replace('#', '').trim())
      .filter(Boolean);

    if (tags.length > 0) {
      setManualTags(prev => [...prev, ...tags]);
    }
  };

  const removeManualTag = (index: number) => {
    setManualTags(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      toast({
        title: 'Fehler',
        description: 'Bitte gib einen Namen fuer den Ort ein.',
        variant: 'destructive'
      });
      return;
    }

    // Create NIP-23 compliant content for place
    let content = `# ${name.trim()}\n\n`;

    // Add summary if description exists
    if (description.trim()) {
      content += `${description.trim()}\n\n`;
    }

    // Add additional images if present (title image handled separately)
    if (additionalImages.length > 0) {
      content += `## Bilder\n\n`;
      additionalImages.forEach((img, index) => {
        content += `![${index + 1}](${img})\n\n`;
      });
    }

    content += `**Kategorie:** ${category}\n`;
    content += `**Bewertung:** ${'⭐'.repeat(rating)} (${rating}/5)\n`;

    if (location.trim()) {
      content += `**Standort:** ${location.trim()}\n`;
    }

    if (coordinates.lat && coordinates.lng) {
      content += `**Koordinaten:** ${coordinates.lat}, ${coordinates.lng}\n`;
    }

    if (facilities.length > 0) {
      content += `**Einrichtungen:** ${facilities.join(', ')}\n`;
    }

    if (bestFor.length > 0) {
      content += `**Geeignet fuer:** ${bestFor.join(', ')}\n`;
    }

    if (price.trim()) {
      content += `**Preis:** ${price.trim()}\n`;
    }

    // Create tags from config
    const baseTags = createRequiredTags('places', tags);
    const additionalTags = [
      ['d', `place-${Date.now()}`], // Unique identifier
      ['type', 'place'], // Explicit type marker
      ['title', name.trim()], // Place name (important for display)
      ['name', name.trim()], // Place name (important for display)
      ['category', category],
      ['rating', rating.toString()],
      ...facilities.map(f => ['facility', f]),
      ...bestFor.map(b => ['best_for', b])
    ];

    const tags = [
      ...baseTags,
      ...additionalTags
    ];

    if (location.trim()) tags.push(['location', location]);
    if (coordinates.lat && coordinates.lng) {
      tags.push(['lat', coordinates.lat]);
      tags.push(['lng', coordinates.lng]);
    }
    if (price.trim()) tags.push(['price', price.trim()]);
    if (image) tags.push(['image', image]);
    additionalImages.forEach((img, index) => {
      tags.push(['image', img]);
    });

    // Add manual tags
    manualTags.forEach(tag => {
      tags.push(['t', tag]);
    });

    // Add country tags
    const countryTags = getCountryTag(selectedCountry);
    countryTags.forEach(tag => tags.push(['t', tag]));

    publishEvent({
      kind: 30023, // Long-form event for places
      content,
      tags
    });

    toast({
      title: 'Erfolg!',
      description: 'Ort erfolgreich gespeichert.'
    });

    // Reset form and redirect
    setName('');
    setDescription('');
    setLocation('');
    setCoordinates({ lat: '', lng: '' });
    setCategory('');
    setRating(5);
    setFacilities([]);
    setBestFor([]);
    setPrice('');

    // Redirect to plaetze page after successful publish
    setTimeout(() => {
      navigate('/plaetze');
    }, 1000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Map className="h-5 w-5" />
          Ort hinzufuegen
        </CardTitle>
        <CardDescription>
          Teile deine besten Campingplaetze, Wildcamping-Stellen und Reiseziele
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="place-name">Name des Ortes</Label>
            <Input
              id="place-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="z.B. Algarve Beach Camping"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="place-category">Kategorie</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Kategorie wählen" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Country Selection */}
        <CountrySelector
          selectedCountry={selectedCountry}
          onCountryChange={setSelectedCountry}
          placeholder="Land auswaehlen"
        />

        <div className="space-y-2">
          <Label htmlFor="place-description">Beschreibung</Label>
          <Textarea
            id="place-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Beschreibe den Ort, was macht ihn besonders..."
            rows={3}
          />
        </div>

        {/* Title Image */}
        <div className="space-y-2">
          <Label>Titelbild</Label>
          <div className="space-y-2">
            {image ? (
              <div className="relative group border rounded-lg p-3">
                <img
                  src={image}
                  alt="Titelbild"
                  className="w-full h-48 object-cover rounded-lg"
                />
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => setImage('')}
                >
                  Entfernen
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageFile(file);
                  }}
                  className="mb-2"
                />
                <p className="text-xs text-muted-foreground">
                  oder
                </p>
                <Input
                  placeholder="https://... (Bild-URL)"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  className="mt-2"
                />
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="place-location">Standort</Label>
            <Input
              id="place-location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="z.B. Algarve, Portugal"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label htmlFor="place-lat">GPS Breite</Label>
              <Input
                id="place-lat"
                value={coordinates.lat}
                onChange={(e) => setCoordinates(prev => ({ ...prev, lat: e.target.value }))}
                placeholder="37.1234"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="place-lng">GPS Laenge</Label>
              <Input
                id="place-lng"
                value={coordinates.lng}
                onChange={(e) => setCoordinates(prev => ({ ...prev, lng: e.target.value }))}
                placeholder="-8.4567"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Bewertung</Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(star => (
                <Button
                  key={star}
                  variant="ghost"
                  size="sm"
                  onClick={() => setRating(star)}
                  className={`transition-all ${
                    star <= rating
                      ? "text-yellow-500 hover:text-yellow-600 hover:scale-110"
                      : "text-gray-300 hover:text-yellow-400 hover:scale-110"
                  }`}
                >
                  <span className="text-lg">{star <= rating ? "⭐" : "☆"}</span>
                </Button>
              ))}
            </div>
            <div className="text-sm text-muted-foreground">
              {rating} von 5 Sternen {rating === 5 && "⭐ Exzellente Bewertung!"}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="place-price">Preis (optional)</Label>
            <Input
              id="place-price"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="z.B. 15€/Nacht oder Kostenlos"
            />
          </div>
        </div>

        <div className="space-y-3">
          <Label>Einrichtungen & Ausstattung</Label>
          <div className="flex flex-wrap gap-2">
            {facilityOptions.map(facility => (
              <Badge
                key={facility}
                variant={facilities.includes(facility) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => handleFacilityToggle(facility)}
              >
                {facility}
              </Badge>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <Label>Geeignet fuer</Label>
          <div className="flex flex-wrap gap-2">
            {bestForOptions.map(item => (
              <Badge
                key={item}
                variant={bestFor.includes(item) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => handleBestForToggle(item)}
              >
                {item}
              </Badge>
            ))}
          </div>
        </div>

        {/* Manual Tags */}
        <div className="space-y-3">
          <Label>Manuelle Tags</Label>
          <Input
            placeholder="Eigene Tags (mit Komma oder Leerzeichen trennen)..."
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleManualTagInput(e.currentTarget.value);
                e.currentTarget.value = '';
              }
            }}
          />
          <p className="text-xs text-muted-foreground">
            Z.B. #sunset-watching vanlife portugal
          </p>

          {/* Show current manual tags */}
          {manualTags.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm">Hinzugefuegte Tags:</Label>
              <div className="flex flex-wrap gap-2">
                {manualTags.map((tag, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="gap-1"
                  >
                    {tag}
                    <button
                      className="ml-1 text-xs hover:text-red-500"
                      onClick={() => removeManualTag(index)}
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <Button onClick={handleSubmit} className="w-full" disabled={!name.trim()}>
          <Map className="h-4 w-4 mr-2" />
          Ort speichern
        </Button>
      </CardContent>
    </Card>
  );
}

// Article Form Component
function ArticleForm({ editEvent }: { editEvent?: any }) {
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [image, setImage] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [publishedAt, setPublishedAt] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const { mutate: publishEvent } = useNostrPublish();
  const { mutateAsync: uploadFile } = useUploadFile();
  const navigate = useNavigate();

  // Load edit data
  useEffect(() => {
    if (editEvent) {
      // Bei bearbeiteten Beiträgen: Daten aus dem Event laden
      setTitle(editEvent.tags?.find((tag: any) => tag[0] === 'title')?.[1] || '');
      setSummary(editEvent.tags?.find((tag: any) => tag[0] === 'summary')?.[1] || '');
      setContent(editEvent.content || '');
      setImage(editEvent.tags?.find((tag: any) => tag[0] === 'image')?.[1] || '');
      setCategory(editEvent.tags?.find((tag: any) => tag[0] === 'category')?.[1] || '');

      // Datum aus dem Event extrahieren (published_at Tag)
      const publishedAtTag = editEvent.tags?.find((tag: any) => tag[0] === 'published_at')?.[1];
      if (publishedAtTag) {
        // Wenn Unix-Timestamp, in Datum umwandeln
        if ( /^\d+$/.test(publishedAtTag)) {
          setPublishedAt(new Date(parseInt(publishedAtTag) * 1000).toISOString().split('T')[0]);
        } else {
          // Wenn schon im richtigen Format
          setPublishedAt(publishedAtTag);
        }
      }

      const eventTags = editEvent.tags?.filter((tag: any) => tag[0] === 't')?.map((tag: any) => tag[1]) || [];
      setTags(eventTags);

      // Extract country from tags
      const countryTags = ['portugal', 'spanien', 'frankreich', 'belgien', 'deutschland', 'luxemburg'];
      const foundCountry = eventTags.find(tag => countryTags.includes(tag));
      if (foundCountry) {
        setSelectedCountry(foundCountry);
      }
    } else {
      // Bei neuen Beiträgen: aktuelles Datum setzen
      setPublishedAt(new Date().toISOString().split('T')[0]);
    }
  }, [editEvent]);

  // Get available tags from config (excluding DIY & Leon tags which are shown separately)
  const availableTags = TAG_GROUPS
    .filter(group => !['Technik', 'Pets'].includes(group.name)) // DIY & Leon tags are shown separately
    .flatMap(group => group.tags)
    .filter(tag => !DIY_TAGS.includes(tag.id))
    .map(tag => tag.id); // Remove # - it will be added in JSX

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



  // Icon mapping for Nature categories
  const getNatureIcon = (iconName: string) => {
    switch (iconName) {
      case 'strand': return Waves;
      case 'berge': return Mountain;
      case 'see': return Eye;
      case 'wald': return Trees;
      case 'wasserfall': return Droplets;
      case 'wiese': return Sun;
      case 'tiere': return Camera;
      default: return Camera;
    }
  };

  // Prueft ob die aktuelle Kategorie ein DIY-Bereich ist
  const currentCategoryConfig = ARTICLE_CATEGORIES.find(cat => cat.id === category);
  const isDIYCategory = currentCategoryConfig?.isDIY || false;

  // Prueft ob Leon-Kategorie
  const isLeonCategory = tags.includes('leon') || currentCategoryConfig?.isLeon || false;

  // Automatische Tags zu manuellen Tags hinzufügen
  const updateTagsWithAuto = (currentTags: string[]) => {
    let updatedTags = [...currentTags];

    // Leon-spezifische Tags hinzufügen
    if (isLeonCategory && currentCategoryConfig?.autoTags) {
      currentCategoryConfig.autoTags.forEach(autoTag => {
        if (!updatedTags.includes(autoTag)) {
          updatedTags.push(autoTag);
        }
      });
    }

    // DIY-spezifische Tags hinzufügen
    if (isDIYCategory && !updatedTags.includes('diy')) {
      updatedTags.push('diy');
    }

    return updatedTags;
  };

  // Berechnete displayTags (kein useState nötig, da berechnet) - Fixed
  const displayTags = updateTagsWithAuto(tags);

  const handleTagToggle = (tag: string) => {
    setTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleImageUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const [urlTag] = await uploadFile(file);
      setImage(urlTag[1]); // URL is in second position
      toast({
        title: 'Upload erfolgreich!',
        description: 'Titelbild wurde hochgeladen.',
      });
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Bild-Upload fehlgeschlagen.',
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      toast({
        title: 'Fehler',
        description: 'Bitte gib einen Titel ein.',
        variant: 'destructive'
      });
      return;
    }

    if (!content.trim()) {
      toast({
        title: 'Fehler',
        description: 'Bitte gib einen Inhalt ein.',
        variant: 'destructive'
      });
      return;
    }

    // Create article metadata
    const articleData = {
      title: title.trim(),
      summary: summary.trim(),
      image,
      published_at: publishedAt,
      author: 'MojoBus Team'
    };



    // Create tags from config (mit allen Tags inkl. automatischen!)
    const baseTags = createRequiredTags('articles', displayTags);

    // Get the original d-tag for edit, or create new one
    const originalDTag = editEvent?.tags?.find((tag: any) => tag[0] === 'd')?.[1];
    const dTag = originalDTag || `article-${Date.now()}`;

    const additionalTags = [
      ['d', dTag], // Use existing d-tag for edit, create new for new articles
      ['type', 'article'], // Explicit type marker
      ['title', title.trim()],
      ['summary', summary.trim()],
      ['published_at', Math.floor(new Date(publishedAt).getTime() / 1000).toString()] // Unix-Timestamp!
    ];

    // Add category and image tags if present
    if (category) additionalTags.push(['category', category]);
    if (image) additionalTags.push(['image', image]);

    // Add country tags
    const countryTags = getCountryTag(selectedCountry);
    countryTags.forEach(tag => additionalTags.push(['t', tag]));

    const finalTags = [
      ...baseTags,
      ...additionalTags
    ];

    publishEvent({
      kind: 30023, // Long-form article
      content: content.trim(),
      tags: finalTags
    });

    toast({
      title: 'Erfolg!',
      description: editEvent ? 'Artikel erfolgreich aktualisiert.' : 'Artikel erfolgreich veroeffentlicht.'
    });

    // Reset form and redirect
    setTitle('');
    setSummary('');
    setContent('');
    setImage('');
    setCategory('');
    setTags([]);
    setSelectedCountry('');
    setPublishedAt(''); // Wird im useEffect neu auf aktuelles Datum gesetzt

    // Redirect to artikel page after successful publish
    setTimeout(() => {
      navigate('/artikel');
    }, 1000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Artikel veroeffentlichen
        </CardTitle>
        <CardDescription>
          Ausfuehrliche Geschichten, Guides und Erfahrungsberichte fuer die Vanlife-Community
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="article-title">Titel</Label>
          <Input
            id="article-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Einprägsamer Titel für deinen Artikel..."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="article-summary">Zusammenfassung</Label>
          <Textarea
            id="article-summary"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Kurze Zusammenfassung (1-2 Sätze)..."
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="article-category">Kategorie</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Kategorie wählen" />
            </SelectTrigger>
            <SelectContent>
              {ARTICLE_CATEGORIES
                .sort((a, b) => a.priority - b.priority)
                .map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>
                    <span className="flex items-center gap-2">
                      <span>{cat.emoji}</span>
                      {cat.name}
                      {cat.isDIY && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          🛠️ DIY
                        </Badge>
                      )}
                      {cat.isLeon && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          🦁️ Leon
                        </Badge>
                      )}
                    </span>
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        {/* Country Selection */}
        <CountrySelector
          selectedCountry={selectedCountry}
          onCountryChange={setSelectedCountry}
          placeholder="Land auswaehlen"
        />

        <div className="space-y-2">
          <Label htmlFor="article-image">Titelbild</Label>
          <div className="flex gap-2">
            {image ? (
              <div className="flex-1">
                <div className="relative">
                  <img
                    src={image}
                    alt="Titelbild"
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  {isUploading && (
                    <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                      <div className="text-white text-center">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                        <p className="text-sm">Wird hochgeladen...</p>
                      </div>
                    </div>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setImage('')}
                  className="mt-2"
                  disabled={isUploading}
                >
                  Entfernen
                </Button>
              </div>
            ) : (
              <div className="flex-1">
                <div className="relative">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file);
                    }}
                    className="flex-1 mb-2 disabled:opacity-50"
                    disabled={isUploading}
                  />
                  {isUploading && (
                    <div className="absolute inset-0 bg-white/80 rounded-md flex items-center justify-center">
                      <div className="text-center">
                        <Loader2 className="w-4 h-4 animate-spin mx-auto mb-1 text-ocean-600" />
                        <p className="text-xs text-ocean-600">Upload läuft...</p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 mt-2">
                  <Button variant="outline" asChild disabled={isUploading}>
                    <label htmlFor="article-image-url" className="cursor-pointer">
                      URL
                    </label>
                  </Button>
                  <Input
                    id="article-image-url"
                    placeholder="https://..."
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    className="flex-1 disabled:opacity-50"
                    disabled={isUploading}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="article-content">Inhalt (Markdown unterstützt)</Label>
          <Textarea
            id="article-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="# Ueberschrift

Dein Artikel in Markdown-Format...

## Unterüberschrift

### Markdown-Format

*Listenpunkte*
**Fett** oder *kursiv*

### Noch mehr
"
            rows={12}
            className="font-mono text-sm"
          />
        </div>

        {/* Automatisch generierte Tags anzeigen */}
        {(isDIYCategory || isLeonCategory) && (
          <div className="space-y-3">
            <Label>Automatische Tags</Label>
            <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                🤖 Diese Tags werden automatisch aufgrund der Kategorie "{currentCategoryConfig?.name}" hinzugefügt:
              </p>
              <div className="flex flex-wrap gap-2">
                {/* Zeige automatisch generierte Tags */}
                {currentCategoryConfig?.autoTags?.map(autoTag => (
                  <Badge
                    key={autoTag}
                    variant="default"
                    className="bg-green-100 text-green-700 border-green-300"
                  >
                    ✓ #{autoTag}
                  </Badge>
                )) || (isDIYCategory && (
                  <Badge
                    variant="default"
                    className="bg-orange-100 text-orange-700 border-orange-300"
                  >
                    ✓ #diy
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* DIY-spezifische Tags */}
        {isDIYCategory && (
          <div className="space-y-3">
            <Label>DIY-Kategorien</Label>
            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
              <p className="text-sm text-orange-700 dark:text-orange-300 mb-3">
                ⚠️ Dieser Artikel erscheint im DIY-Bereich. Wähle spezifische Kategorien:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {Object.values(DIY_CATEGORIES).map(diyCat => {
                  const Icon = getDIYIcon(diyCat.icon);
                  return (
                    <Badge
                      key={diyCat.id}
                      variant={displayTags.includes(diyCat.id) ? "default" : "outline"}
                      className="cursor-pointer justify-start p-2"
                      onClick={() => {
                        // DIY-Tag hinzufügen, falls noch nicht vorhanden
                        if (!displayTags.includes('diy')) {
                          setTags(prev => {
                            const newTags = [...prev, 'diy'];
                            return newTags;
                          });
                        }
                        // Toggle spezifischen DIY-Tag
                        setTags(prev =>
                          prev.includes(diyCat.id)
                            ? prev.filter(t => t !== diyCat.id)
                            : [...prev, diyCat.id]
                        );
                      }}
                    >
                      <span className="mr-2">{diyCat.emoji}</span>
                      {diyCat.name}
                    </Badge>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <Label>Tags</Label>

          {/* Ausgewählte Tags anzeigen */}
          {displayTags.length > 0 && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                🏷️ Aktuell ausgewählte Tags:
              </p>
              <div className="flex flex-wrap gap-2">
                {displayTags.map(tag => (
                  <Badge
                    key={tag}
                    variant="default"
                    className="bg-blue-100 text-blue-700 border-blue-300 cursor-pointer"
                    onClick={() => {
                      // Entferne aus displayTags und tags
                      setTags(prev => prev.filter(t => t !== tag));
                    }}
                  >
                    #{tag} ×
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                💡 Tippe auf einen Tag zum Entfernen
              </p>
            </div>
          )}

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Verfügbare Tags:
            </p>
            <div className="flex flex-wrap gap-2">
              {availableTags.map(tag => (
                <Badge
                  key={tag}
                  variant={displayTags.includes(tag) ? "secondary" : "outline"}
                  className={`cursor-pointer ${
                    displayTags.includes(tag)
                      ? 'bg-gray-100 text-gray-500'
                      : 'hover:bg-blue-100 hover:text-blue-700'
                  }`}
                  onClick={() => handleTagToggle(tag)}
                >
                  #{tag}
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="Eigene Tags (mit Komma oder Leerzeichen trennen)..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  const value = e.currentTarget.value;
                  const newTags = value.split(/[\s,]+/).filter(Boolean);
                  setTags(prev => [...prev, ...newTags]);
                  e.currentTarget.value = '';
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              onClick={(e) => {
                const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                const value = input.value;
                const newTags = value.split(/[\s,]+/).filter(Boolean);
                setTags(prev => [...prev, ...newTags]);
                input.value = '';
              }}
            >
              Hinzufügen
            </Button>
          </div>
        </div>



        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="article-date">Veröffentlichungsdatum</Label>
            <Input
              id="article-date"
              type="date"
              value={publishedAt}
              onChange={(e) => setPublishedAt(e.target.value)}
            />
          </div>
        </div>

        <Button onClick={handleSubmit} className="w-full" disabled={!title.trim() || !content.trim()}>
          <FileText className="h-4 w-4 mr-2" />
          Artikel veroeffentlichen
        </Button>
      </CardContent>
    </Card>
  );
}

// Hook zum Laden der Edit-Daten
function useEditData(editEventId: string | null) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['edit-event', editEventId],
    queryFn: async ({ signal }) => {
      if (!editEventId) return null;

      let eventId = editEventId;
      try {
        // Try to decode nip19 if it's encoded
        if (editEventId.startsWith('note1')) {
          const decoded = nip19.decode(editEventId);
          eventId = decoded.data;
        }
      } catch (error) {
        // If decoding fails, try using as raw hex ID
        console.log('Using raw event ID:', editEventId);
        eventId = editEventId;
      }

      const abortSignal = AbortSignal.any([signal, AbortSignal.timeout(3000)]);

      const events = await nostr.query([
        {
          ids: [eventId],
          limit: 1
        }
      ], { signal: abortSignal });

      return events[0] || null;
    },
    enabled: !!editEventId,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

export function Publish() {
  const { user } = useCurrentUser();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editEventId = searchParams.get('edit');
  const editType = searchParams.get('type');
  const [activeTab, setActiveTab] = useState(editType || 'note');
  const { data: editEvent } = useEditData(editEventId);

  // Debug logs
  console.log('Publish Debug:', {
    editEventId,
    editType,
    activeTab,
    searchParams: Object.fromEntries(searchParams.entries())
  });

  if (!user) {
    return (
      <div className="min-h-screen py-12">
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <Card className="border-dashed">
              <CardContent className="py-12 px-8 text-center">
                <p className="text-muted-foreground mb-4">
                  Du musst angemeldet sein, um Inhalte zu veroeffentlichen.
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
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-4">
            <h1 className="text-4xl md:text-5xl font-bold">
              Veroeffentlichen
            </h1>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                Replaceable Content
              </Badge>
              <Badge variant="outline" className="text-xs text-green-600">
                1x Events
              </Badge>
            </div>
          </div>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Teile deine Geschichten, Gedanken und besonderen Orte auf Nostr. Vanlife, Reise-Erlebnisse und mehr.
          </p>
        </div>

        {/* Publish Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="note" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Note
            </TabsTrigger>
            <TabsTrigger value="place" className="gap-2">
              <Map className="h-4 w-4" />
              Plätze
            </TabsTrigger>
            <TabsTrigger value="media" className="gap-2">
              <Upload className="h-4 w-4" />
              Medien
            </TabsTrigger>
            <TabsTrigger value="article" className="gap-2">
              <FileText className="h-4 w-4" />
              Artikel
            </TabsTrigger>
          </TabsList>

          <TabsContent value="note">
            <NoteForm editEvent={editType === 'note' ? editEvent : undefined} />
          </TabsContent>

          <TabsContent value="place">
            <PlaceForm editEvent={editType === 'place' ? editEvent : undefined} />
          </TabsContent>

          <TabsContent value="media">
            <MediaUploadForm editEvent={editType === 'media' ? editEvent : undefined} />
          </TabsContent>

          <TabsContent value="article">
            <ArticleForm editEvent={editType === 'article' ? editEvent : undefined} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}