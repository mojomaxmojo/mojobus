// Media Publish Form with intelligent GPS extraction for all content types
// Version 6 - Multi-type publishing with smart GPS extraction
import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, MessageSquare, Map, Upload, UploadCloud, ImageIcon, Video, Music, File, Camera, MapPin, Calendar, Tag, Battery, Sun, Wrench, Hammer, Cpu, Mountain, Lightbulb, Dog, Trees, Droplets, Waves, Eye, Loader2, CheckCircle } from '@/lib/icons';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/useToast';
import { useUploadFile } from '@/hooks/useUploadFile';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { ImageOptimizationToggle } from '@/components/ImageOptimizationToggle';
import { extractCoordinatesWithSmartFallback } from '@/lib/gpsExtraction';
import { CountrySelector, getCountryTag } from '@/components/CountrySelector';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { CONTENT_CATEGORIES, createRequiredTags, getOptionalTags } from '@/config/contentCategories';
import { ARTICLE_CATEGORIES, DIY_CATEGORIES } from '@/config';
import MAIN_MENU from '@/config/menu';
import { RV_LIFE_CONFIG } from '@/config/rvlife';
import { nip19 } from 'nostr-tools';
import { WysiwygEditor } from '@/components/WysiwygEditor';
import { Progress } from '@/components/ui/progress';

// Media Types Configuration
const mediaTypes = [
  { type: 'image', label: 'Bilder', icon: ImageIcon, extensions: ['jpg', 'jpeg', 'png', 'webp', 'gif'], accept: 'image/*' },
  { type: 'video', label: 'Videos', icon: Video, extensions: ['mp4', 'mov', 'webm'], accept: 'video/*' },
  { type: 'audio', label: 'Audio', icon: Music, extensions: ['mp3', 'wav', 'm4a'], accept: 'audio/*' },
  { type: 'document', label: 'Dokumente', icon: File, extensions: ['pdf', 'kml', 'gpx'], accept: '.pdf,.kml,.gpx' }
];

// Content Categories
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

const placeTypes = [
  { value: 'campingplatz', label: 'Campingplatz', icon: '🏕' },
  { value: 'wildcamping', label: 'Wildcamping', icon: '⛺' },
  { value: 'stellplatz', label: 'Stellplatz', icon: '🅿' },
  { value: 'aussichtspunkt', label: 'Aussichtspunkt', icon: '🌄' },
  { value: 'strand', label: 'Strand', icon: '🏖' },
  { value: 'berg', label: 'Berg', icon: '🏔' },
  { value: 'see', label: 'See', icon: '🌊' },
  { value: 'stadt', label: 'Stadt', icon: '🏙' },
  { value: 'natur', label: 'Natur', icon: '🌲' },
];

const ratings = [1, 2, 3, 4, 5];

interface MediaFile {
  id: string;
  file: File;
  url?: string;
  name: string;
  type: string;
  size: number;
  preview?: string;
  uploaded?: boolean;
}

interface UploadProgress {
  current: number;
  total: number;
  stage: 'upload' | 'publish' | 'success' | 'error' | '';
  status: string;
}

export function Publish() {
  const [activeTab, setActiveTab] = useState('media');
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [mainCategory, setMainCategory] = useState('');
  const [subTags, setSubTags] = useState<string[]>([]);
  const [date, setDate] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [customTags, setCustomTags] = useState('');
  const [location, setLocation] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [rating, setRating] = useState(0);
  const [amenities, setAmenities] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0, stage: '', status: '' });
  const { toast } = useToast();
  const { mutateAsync: uploadFile } = useUploadFile();
  const { mutate: publishEvent } = useNostrPublish();
  const navigate = useNavigate();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');

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

  const handleAmenityToggle = (amenity: string) => {
    setAmenities(prev =>
      prev.includes(amenity)
        ? prev.filter(a => a !== amenity)
        : [...prev, amenity]
    );
  };

  const handleSubmit = async () => {
    const validationError = validateForm(activeTab);
    if (validationError) {
      toast({
        title: 'Fehler',
        description: validationError,
        variant: 'destructive'
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress({ current: 0, total: files.length, stage: 'upload', status: 'Upload zu Blossom wird gestartet...' });

    try {
      // Upload files
      const uploadedUrls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const fileObj = files[i];
        setUploadProgress({
          current: i + 1,
          total: files.length,
          stage: 'upload',
          status: `Lade "${fileObj.name}" hochladen... (${((i + 1) / files.length * 100).toFixed(0)}%)`
        });

        try {
          const uploadResult = await uploadFile(fileObj.file);

          if (!uploadResult || !Array.isArray(uploadResult) || uploadResult.length === 0) {
            throw new Error('Upload fehlgeschlagen');
          }

          const urlTag = uploadResult.find(tag => Array.isArray(tag) && tag.length >= 2 && tag[0] === 'url');

          if (!urlTag) {
            const potentialUrlTag = uploadResult.find(tag =>
              Array.isArray(tag) &&
              tag.length >= 2 &&
              typeof tag[1] === 'string' &&
              tag[1].startsWith('http')
            );

            if (potentialUrlTag) {
              uploadedUrls.push(potentialUrlTag[1]);
            } else {
              throw new Error('Keine URL im Upload-Ergebnis');
            }
          } else {
            uploadedUrls.push(urlTag[1]);
          }

          await new Promise(resolve => setTimeout(resolve, 100));

        } catch (uploadError) {
          throw new Error(`Upload fehlgeschlagen für ${fileObj.name}: ${uploadError.message}`);
        }
      }

      // Build content based on type
      let kind = 1;
      let additionalTags: string[][] = [];

      if (activeTab === 'media') {
        kind = 1;
        additionalTags = [
          ['type', 'media'],
          ['t', 'media'],
          ['t', 'mojobus']
        ];
        if (mainCategory) additionalTags.push(['t', mainCategory]);
        if (location) additionalTags.push(['location', location]);
        if (date) additionalTags.push(['published_at', date]);

        // INTELLIGENTE GPS-EXTRAKTION FÜR BILDER
        const gpsCoordinates = await extractCoordinatesWithSmartFallback(files, location, selectedCountry);
        if (gpsCoordinates) {
          additionalTags.push(['lat', gpsCoordinates.latitude.toString()]);
          additionalTags.push(['lon', gpsCoordinates.longitude.toString()]);
        }

        const content = `${title ? `# ${title}\n\n` : ''}${description ? `${description}\n\n` : ''}${uploadedUrls.join('\n\n')}`;

        const tags = [
          ...subTags.map(tag => ['t', tag]),
          ...customTags.split(' ').filter(Boolean).map(tag => ['t', tag]),
          ...(selectedCountry ? getCountryTag(selectedCountry) : []),
          ...additionalTags
        ];

        publishEvent({ kind, content, tags });

      } else if (activeTab === 'article') {
        kind = 30023;
        additionalTags = [
          ['type', 'long-form'],
          ['d', 'blog'],
          ['published_at', new Date().toISOString().split('T')[0]]
        ];
        if (mainCategory) additionalTags.push(['t', mainCategory]);
        if (location) additionalTags.push(['location', location]);

        // INTELLIGENTE GPS-EXTRAKTION FÜR ARTIKEL: Aus Titelbild
        const gpsCoordinates = await extractCoordinatesWithSmartFallback(files, location, selectedCountry);
        if (gpsCoordinates) {
          additionalTags.push(['lat', gpsCoordinates.latitude.toString()]);
          additionalTags.push(['lon', gpsCoordinates.longitude.toString()]);
        }

        const content = await WysiwygEditor.htmlToMarkdown(content);

        const tags = [
          ['title', title],
          ['summary', description.substring(0, 200)],
          ['image', uploadedUrls[0] || ''],
          ['published_at', new Date().toISOString().split('T')[0]],
          ...subTags.map(tag => ['t', tag]),
          ...customTags.split(' ').filter(Boolean).map(tag => ['t', tag]),
          ...(selectedCountry ? getCountryTag(selectedCountry) : []),
          ...additionalTags
        ];

        publishEvent({ kind, content, tags });

      } else if (activeTab === 'place') {
        kind = 30025;
        additionalTags = [
          ['type', 'place'],
          ['published_at', new Date().toISOString().split('T')[0]]
        ];

        if (rating > 0) additionalTags.push(['rating', rating.toString()]);
        amenities.forEach(amenity => additionalTags.push(['t', amenity]));
        if (mainCategory) additionalTags.push(['t', mainCategory]);
        if (location) additionalTags.push(['location', location]);

        // INTELLIGENTE GPS-EXTRAKTION FÜR PLÄTZE: Aus Titelbild
        const gpsCoordinates = await extractCoordinatesWithSmartFallback(files, location, selectedCountry);
        if (gpsCoordinates) {
          additionalTags.push(['lat', gpsCoordinates.latitude.toString()]);
          additionalTags.push(['lon', gpsCoordinates.longitude.toString()]);
        }

        const content = content || '';
        const tags = [
          ['title', title],
          ['summary', description.substring(0, 200)],
          ['image', uploadedUrls[0] || ''],
          ...subTags.map(tag => ['t', tag]),
          ...customTags.split(' ').filter(Boolean).map(tag => ['t', tag]),
          ...additionalTags
        ];

        publishEvent({ kind, content, tags });

      } else if (activeTab === 'note') {
        kind = 1;
        additionalTags = [
          ['t', 'note'],
          ['t', 'mojobus']
        ];
        if (mainCategory) additionalTags.push(['t', mainCategory]);
        if (location) additionalTags.push(['location', location]);

        // INTELLIGENTE GPS-EXTRAKTION FÜR NOTES: Aus erstem Bild
        const gpsCoordinates = await extractCoordinatesWithSmartFallback(files, location, selectedCountry);
        if (gpsCoordinates) {
          additionalTags.push(['lat', gpsCoordinates.latitude.toString()]);
          additionalTags.push(['lon', gpsCoordinates.longitude.toString()]);
        }

        const content = `${title ? `# ${title}\n\n` : ''}${content}\n\n${uploadedUrls.join('\n\n')}`;

        const tags = [
          ...subTags.map(tag => ['t', tag]),
          ...customTags.split(' ').filter(Boolean).map(tag => ['t', tag]),
          ...(selectedCountry ? getCountryTag(selectedCountry) : []),
          ...additionalTags
        ];

        publishEvent({ kind, content, tags });
      }

      setUploadProgress({
        current: files.length,
        total: files.length,
        stage: 'success',
        status: 'Erfolgreich veröffentlicht!'
      });

      toast({ title: 'Erfolg!', description: 'Erfolgreich veröffentlicht.' });

      setTimeout(() => {
        navigate(activeTab === 'media' ? '/bilder' : activeTab === 'article' ? '/artikel' : activeTab === 'place' ? '/plaetze' : '/notes');
      }, 1500);

    } catch (error) {
      console.error('Complete upload error:', error);
      setUploadProgress({
        current: 0,
        total: 0,
        stage: 'error',
        status: `Fehler: ${error.message}`
      });

      toast({
        title: 'Fehler',
        description: `Upload fehlgeschlagen: ${error.message}`,
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
      setTimeout(() => {
        setUploadProgress({ current: 0, total: 0, stage: '', status: '' });
      }, 5000);
    }
  };

  const validateForm = (tab: string): string | null => {
    if (tab === 'media' && files.length === 0) {
      return 'Bitte wähle mindestens eine Datei aus.';
    }
    if (tab === 'article' && files.length === 0) {
      return 'Bitte wähle mindestens ein Titelbild aus.';
    }
    if (tab === 'place' && files.length === 0) {
      return 'Bitte wähle mindestens ein Bild aus.';
    }
    if (tab === 'note' && files.length === 0) {
      return 'Bitte wähle mindestens ein Bild aus.';
    }
    if (!title) {
      return 'Bitte gib einen Titel ein.';
    }
    return null;
  };

  const today = new Date().toISOString().split('T')[0];
  useEffect(() => {
    setDate(today);
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Veröffentlichen</h1>

        <Card>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="media" className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Medien
              </TabsTrigger>
              <TabsTrigger value="article" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Artikel
              </TabsTrigger>
              <TabsTrigger value="place" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Plätze
              </TabsTrigger>
              <TabsTrigger value="note" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Notes
              </TabsTrigger>
            </TabsList>

            {/* Media Tab */}
            <TabsContent value="media" className="mt-6">
              <CardHeader>
                <CardTitle>Bilder & Medien</CardTitle>
                <CardDescription>Teile deine Fotos und Videos mit der Community</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Upload Area */}
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    isDragging ? 'border-primary bg-primary/5' : 'border-gray-300'
                  }`}
                  onDrop={handleDrop}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                >
                  <input
                    type="file"
                    multiple
                    accept={mediaTypes.map(m => m.accept).join(',')}
                    onChange={(e) => handleFileSelect(e.target.files)}
                    className="hidden"
                    id="media-upload"
                  />
                  <Button asChild>
                    <label htmlFor="media-upload" className="cursor-pointer">
                      <Camera className="h-5 w-5 mr-2" />
                      Dateien auswählen
                    </label>
                  </Button>
                </div>

                {/* File Preview */}
                {files.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {files.map(file => (
                      <div key={file.id} className="relative">
                        {file.preview ? (
                          <img src={file.preview} alt={file.name} className="w-full h-40 object-cover rounded" />
                        ) : (
                          <div className="w-full h-40 bg-gray-100 rounded flex items-center justify-center">
                            <Video className="h-8 w-8 text-gray-400" />
                          </div>
                        )}
                        <div className="absolute top-2 right-2">
                          <Button variant="destructive" size="sm" className="h-6 w-6 p-0" onClick={() => removeFile(file.id)}>×</Button>
                        </div>
                        <p className="text-sm truncate">{file.name}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Title, Description, Date */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="media-title">Titel</Label>
                    <Input
                      id="media-title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Titel der Bilder..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="media-description">Beschreibung</Label>
                    <Textarea
                      id="media-description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Beschreibung der Bilder..."
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="media-date">Datum</Label>
                      <Input
                        id="media-date"
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                      />
                    </div>

                    <div>
                      <Label>Kategorie</Label>
                      <Select value={mainCategory} onValueChange={setMainCategory}>
                        <SelectTrigger>
                          <SelectValue placeholder="Kategorie wählen" />
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
                  </div>

                  <div>
                    <Label htmlFor="media-location">Standort</Label>
                    <Input
                      id="media-location"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Land, Stadt (z.B. Portugal, Praia dos Tomates)"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      💡 GPS wird aus Bildern ermittelt. Fallback zur Standort-Parsierung.
                    </p>
                  </div>

                  <div>
                    <Label>Land</Label>
                    <CountrySelector
                      selectedCountry={selectedCountry}
                      onCountryChange={setSelectedCountry}
                      placeholder="Land auswählen (für Fallback)"
                    />
                  </div>

                  <div>
                    <Label htmlFor="media-tags">Tags (durch Leerzeichen getrennt)</Label>
                    <Input
                      id="media-tags"
                      value={customTags}
                      onChange={(e) => setCustomTags(e.target.value)}
                      placeholder="#tags durch leerzeichen getrennt"
                    />
                  </div>
                </div>

                <ImageOptimizationToggle />
              </CardContent>
            </TabsContent>

            {/* Article Tab */}
            <TabsContent value="article" className="mt-6">
              <CardHeader>
                <CardTitle>Artikel veröffentlichen</CardTitle>
                <CardDescription>Schreibe ausführliche Artikel über deine Erlebnisse</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Title Image Upload */}
                <div>
                  <Label htmlFor="article-image">Titelbild</Label>
                  <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center ${
                      isDragging ? 'border-primary bg-primary/5' : 'border-gray-300'
                    }`}
                    onDrop={handleDrop}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileSelect(e.target.files)}
                      className="hidden"
                      id="article-image"
                    />
                    <Button asChild>
                      <label htmlFor="article-image" className="cursor-pointer">
                        <ImageIcon className="h-5 w-5 mr-2" />
                        Titelbild auswählen
                      </label>
                    </Button>
                  </div>
                </div>

                {/* File Preview */}
                {files.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {files.map(file => (
                      <div key={file.id} className="relative">
                        <img src={file.preview || ''} alt={file.name} className="w-full h-40 object-cover rounded" />
                        <div className="absolute top-2 right-2">
                          <Button variant="destructive" size="sm" className="h-6 w-6 p-0" onClick={() => removeFile(file.id)}>×</Button>
                        </div>
                        <p className="text-sm truncate">{file.name}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Title, Description */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="article-title">Titel</Label>
                    <Input
                      id="article-title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Titel des Artikels..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="article-description">Beschreibung</Label>
                    <WysiwygEditor
                      content={content}
                      onChange={setContent}
                      placeholder="Schreibe deinen Artikel..."
                      className="min-h-[300px]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Kategorie</Label>
                      <Select value={mainCategory} onValueChange={setMainCategory}>
                        <SelectTrigger>
                          <SelectValue placeholder="Kategorie wählen" />
                        </SelectTrigger>
                        <SelectContent>
                          {mainCategories.map(cat => (
                            <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="article-tags">Tags</Label>
                      <Input
                        id="article-tags"
                        value={customTags}
                        onChange={(e) => setCustomTags(e.target.value)}
                        placeholder="#tags durch leerzeichen getrennt"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="article-location">Standort</Label>
                      <Input
                        id="article-location"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="Land, Stadt (z.B. Portugal, Praia dos Tomates)"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        💡 GPS wird aus Titelbild ermittelt. Fallback zur Standort-Parsierung.
                      </p>
                    </div>

                    <div>
                      <Label>Land</Label>
                      <CountrySelector
                        selectedCountry={selectedCountry}
                        onCountryChange={setSelectedCountry}
                        placeholder="Land auswählen (für Fallback)"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </TabsContent>

            {/* Place Tab */}
            <TabsContent value="place" className="mt-6">
              <CardHeader>
                <CardTitle>Platz veröffentlichen</CardTitle>
                <CardDescription>Teile deine Lieblingsplätze mit der Community</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Image Upload */}
                <div>
                  <Label htmlFor="place-image">Bilder</Label>
                  <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center ${
                      isDragging ? 'border-primary bg-primary/5' : 'border-gray-300'
                    }`}
                    onDrop={handleDrop}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => handleFileSelect(e.target.files)}
                      className="hidden"
                      id="place-image"
                    />
                    <Button asChild>
                      <label htmlFor="place-image" className="cursor-pointer">
                        <ImageIcon className="h-5 w-5 mr-2" />
                        Bilder auswählen
                      </label>
                    </Button>
                  </div>
                </div>

                {/* File Preview */}
                {files.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {files.map(file => (
                      <div key={file.id} className="relative">
                        <img src={file.preview || ''} alt={file.name} className="w-full h-40 object-cover rounded" />
                        <div className="absolute top-2 right-2">
                          <Button variant="destructive" size="sm" className="h-6 w-6 p-0" onClick={() => removeFile(file.id)}>×</Button>
                        </div>
                        <p className="text-sm truncate">{file.name}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Place Details */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="place-title">Name</Label>
                    <Input
                      id="place-title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Name des Platzes..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="place-description">Beschreibung</Label>
                    <Textarea
                      id="place-description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Beschreibung des Platzes..."
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Art</Label>
                      <Select value={mainCategory} onValueChange={setMainCategory}>
                        <SelectTrigger>
                          <SelectValue placeholder="Art wählen" />
                        </SelectTrigger>
                        <SelectContent>
                          {placeTypes.map(type => (
                            <SelectItem key={type.value} value={type.value}>
                              <span className="flex items-center gap-2">
                                <span>{type.icon}</span>
                                {type.label}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Bewertung</Label>
                      <div className="flex gap-1">
                        {ratings.map(r => (
                          <button
                            key={r}
                            onClick={() => setRating(r)}
                            className={`w-10 h-10 rounded-lg border-2 transition-all ${
                              rating === r ? 'border-primary bg-primary text-white' : 'border-gray-300 hover:border-gray-400'
                            }`}
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="place-location">Standort</Label>
                    <Input
                      id="place-location"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Land, Stadt (z.B. Portugal, Faro)"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      💡 GPS wird aus Bildern ermittelt. Fallback zur Standort-Parsierung.
                    </p>
                  </div>

                  <div>
                    <Label>Ausstattung</Label>
                    <div className="flex flex-wrap gap-2">
                      {['strom', 'wasser', 'wc', 'dusche', 'wlan', 'shop', 'familien', 'paare', 'single', 'wohnmobil', 'zelt'].map(amenity => (
                        <Badge
                          key={amenity}
                          variant={amenities.includes(amenity) ? 'default' : 'outline'}
                          className="cursor-pointer"
                          onClick={() => handleAmenityToggle(amenity)}
                        >
                          {amenities.includes(amenity) && <span className="mr-1">✓</span>}
                          {amenity}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </TabsContent>

            {/* Note Tab */}
            <TabsContent value="note" className="mt-6">
              <CardHeader>
                <CardTitle>Note veröffentlichen</CardTitle>
                <CardDescription>Teile kurze Notizen und Gedanken</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Image Upload */}
                <div>
                  <Label htmlFor="note-image">Bild</Label>
                  <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center ${
                      isDragging ? 'border-primary bg-primary/5' : 'border-gray-300'
                    }`}
                    onDrop={handleDrop}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileSelect(e.target.files)}
                      className="hidden"
                      id="note-image"
                    />
                    <Button asChild>
                      <label htmlFor="note-image" className="cursor-pointer">
                        <ImageIcon className="h-5 w-5 mr-2" />
                        Bild auswählen
                      </label>
                    </Button>
                  </div>
                </div>

                {/* File Preview */}
                {files.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {files.map(file => (
                      <div key={file.id} className="relative">
                        <img src={file.preview || ''} alt={file.name} className="w-full h-40 object-cover rounded" />
                        <div className="absolute top-2 right-2">
                          <Button variant="destructive" size="sm" className="h-6 w-6 p-0" onClick={() => removeFile(file.id)}>×</Button>
                        </div>
                        <p className="text-sm truncate">{file.name}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Note Details */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="note-title">Titel</Label>
                    <Input
                      id="note-title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Titel der Note..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="note-content">Inhalt</Label>
                    <WysiwygEditor
                      content={content}
                      onChange={setContent}
                      placeholder="Schreibe deine Note..."
                      className="min-h-[200px]"
                    />
                  </div>

                  <div>
                    <Label htmlFor="note-location">Standort</Label>
                    <Input
                      id="note-location"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Land, Stadt (z.B. Portugal, Porto)"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      💡 GPS wird aus erstem Bild ermittelt. Fallback zur Standort-Parsierung.
                    </p>
                  </div>

                  <div>
                    <Label>Kategorie</Label>
                    <Select value={mainCategory} onValueChange={setMainCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="Kategorie wählen" />
                      </SelectTrigger>
                      <SelectContent>
                        {mainCategories.map(cat => (
                          <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </TabsContent>
          </Tabs>
        </Card>

        {/* Publish Button */}
        <Card>
          <CardContent className="pt-6">
            <Button
              onClick={handleSubmit}
              disabled={isUploading}
              className="w-full"
              size="lg"
            >
              {isUploading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
              {(activeTab === 'media' && files.length === 0) ? 'Dateien auswählen' :
               (activeTab === 'article' && files.length === 0) ? 'Titelbild auswählen' :
               (activeTab === 'place' && files.length === 0) ? 'Bilder auswählen' :
               (activeTab === 'note' && files.length === 0) ? 'Bild auswählen' : 'Veröffentlichen'}
            </Button>
          </CardContent>
        </Card>

        {/* Upload Progress */}
        {isUploading && (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                  <p className="text-sm text-muted-foreground mt-2">{uploadProgress.status}</p>
                </div>
                <Progress
                  value={uploadProgress.current}
                  max={uploadProgress.total}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                  <span>{uploadProgress.current} / {uploadProgress.total}</span>
                  <span>{((uploadProgress.current / uploadProgress.total) * 100).toFixed(0)}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Anleitung</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <Camera className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">GPS-Extraktion</p>
                  <p className="text-muted-foreground">
                    <strong>Bilder:</strong> GPS aus Bild-EXIF (höchste Priorität)<br/>
                    <strong>Artikel:</strong> GPS aus Titelbild<br/>
                    <strong>Plätze:</strong> GPS aus Bildern<br/>
                    <strong>Notes:</strong> GPS aus erstem Bild
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Standort-Parsierung</p>
                  <p className="text-muted-foreground">
                    Wenn kein GPS verfügbar, gib den Standort im Format: <span className="font-mono bg-muted px-1 rounded">Land, Stadt</span> ein.<br/>
                    Beispiel: <span className="font-mono bg-muted px-1 rounded">Portugal, Praia dos Tomates</span>
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Land-Fallback</p>
                  <p className="text-muted-foreground">
                    Wähle ein Land aus dem Dropdown, falls der Standort nicht erkannt wird.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default Publish;
