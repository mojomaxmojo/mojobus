// Media Publish Form with GPS extraction
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, MessageSquare, MapPin as MapPinIcon, ImageIcon, Camera, Loader2, Edit3 } from '@/lib/icons';
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
import { Progress } from '@/components/ui/progress';

interface MediaFile {
  id: string;
  file: File;
  url?: string;
  name: string;
  type: string;
  size: number;
  preview?: string;
}

const mainCategories = [
  { value: 'vanlife', label: 'Vanlife', icon: '🚐' },
  { value: 'technik', label: 'Technik & Solar', icon: '⚡' },
  { value: 'reisen', label: 'Reisen', icon: '🗺️' },
  { value: 'leben', label: 'Lifestyle', icon: '🌊' },
  { value: 'natur', label: 'Natur', icon: '🌲' }
];

const placeTypes = [
  { value: 'campingplatz', label: 'Campingplatz', icon: '🏕' },
  { value: 'wildcamping', label: 'Wildcamping', icon: '⛺' },
  { value: 'stellplatz', label: 'Stellplatz', icon: '🅿' },
  { value: 'strand', label: 'Strand', icon: '🏖' },
  { value: 'berg', label: 'Berg', icon: '🏔' },
  { value: 'see', label: 'See', icon: '🌊' },
  { value: 'stadt', label: 'Stadt', icon: '🏙' },
  { value: 'natur', label: 'Natur', icon: '🌲' },
];

const ratings = [1, 2, 3, 4, 5];

export function Publish() {
  const [activeTab, setActiveTab] = useState('media');
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [mainCategory, setMainCategory] = useState('');
  const [subTags, setSubTags] = useState<string[]>([]);
  const [date, setDate] = useState('');
  const [customTags, setCustomTags] = useState('');
  const [location, setLocation] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [rating, setRating] = useState(0);
  const [amenities, setAmenities] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [gpsCoordinates, setGpsCoordinates] = useState<{lat: string, lon: string} | null>(null);
  const [gpsSource, setGpsSource] = useState<string>('');
  const [isManualGps, setIsManualGps] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0, stage: '', status: '' });
  const { toast } = useToast();
  const { mutateAsync: uploadFile } = useUploadFile();
  const { mutate: publishEvent } = useNostrPublish();
  const navigate = useNavigate();

  useEffect(() => {
    const detectGPS = async () => {
      if (files.length > 0 && !isManualGps) {
        const coords = await extractCoordinatesWithSmartFallback(files, location, selectedCountry);
        if (coords) {
          setGpsCoordinates({ lat: coords.latitude.toFixed(6), lon: coords.longitude.toFixed(6) });
          setGpsSource('Automatisch ermittelt');
        }
      }
    };
    detectGPS();
  }, [files, location, selectedCountry, isManualGps]);

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const newFiles: MediaFile[] = Array.from(selectedFiles).map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      name: file.name,
      type: file.type.startsWith('image/') ? 'image' : 'document',
      size: file.size,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
    }));

    setFiles(prev => [...prev, ...newFiles]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
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

  const handleGpsChange = (field: 'lat' | 'lon', value: string) => {
    setIsManualGps(true);
    setGpsCoordinates(prev => ({ ...prev, [field]: value }));
  };

  const handleClearGps = () => {
    setGpsCoordinates(null);
    setGpsSource('');
    setIsManualGps(false);
    const detectGPS = async () => {
      const coords = await extractCoordinatesWithSmartFallback(files, location, selectedCountry);
      if (coords) {
        setGpsCoordinates({ lat: coords.latitude.toFixed(6), lon: coords.longitude.toFixed(6) });
        setGpsSource('Automatisch ermittelt');
      }
    };
    detectGPS();
  };

  const handleSubmit = async () => {
    if (activeTab === 'media' && files.length === 0) {
      toast({ title: 'Fehler', description: 'Bitte Dateien auswählen', variant: 'destructive' });
      return;
    }

    if (!title) {
      toast({ title: 'Fehler', description: 'Bitte Titel eingeben', variant: 'destructive' });
      return;
    }

    setIsUploading(true);
    setUploadProgress({ current: 0, total: files.length, stage: 'upload', status: 'Upload wird gestartet...' });

    try {
      const uploadedUrls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const fileObj = files[i];
        setUploadProgress({
          current: i + 1,
          total: files.length,
          stage: 'upload',
          status: `Lade "${fileObj.name}" hochladen...`
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
              throw new Error('Keine URL');
            }
          } else {
            uploadedUrls.push(urlTag[1]);
          }

          await new Promise(resolve => setTimeout(resolve, 100));

        } catch (uploadError) {
          throw new Error(`Upload fehlgeschlagen: ${uploadError.message}`);
        }
      }

      setUploadProgress({
        current: files.length,
        total: files.length,
        stage: 'publish',
        status: 'Event wird erstellt...'
      });

      let kind = 1;
      let additionalTags: string[][] = [];

      if (gpsCoordinates && !isNaN(parseFloat(gpsCoordinates.lat)) && !isNaN(parseFloat(gpsCoordinates.lon))) {
        additionalTags.push(['lat', gpsCoordinates.lat]);
        additionalTags.push(['lon', gpsCoordinates.lon]);
        console.log('GPS saved:', gpsCoordinates, 'Source:', gpsSource);
      }

      if (activeTab === 'media') {
        kind = 1;
        additionalTags = [['type', 'media'], ['t', 'media'], ['t', 'mojobus']];
        if (mainCategory) additionalTags.push(['t', mainCategory]);
        if (location) additionalTags.push(['location', location]);
        if (date) additionalTags.push(['published_at', date]);

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
        additionalTags = [['type', 'long-form'], ['d', 'blog'], ['published_at', new Date().toISOString().split('T')[0]]];
        if (mainCategory) additionalTags.push(['t', mainCategory]);
        if (location) additionalTags.push(['location', location]);

        const content = content || '';
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
        additionalTags = [['type', 'place'], ['published_at', new Date().toISOString().split('T')[0]]];
        if (rating > 0) additionalTags.push(['rating', rating.toString()]);
        amenities.forEach(amenity => additionalTags.push(['t', amenity]));
        if (mainCategory) additionalTags.push(['t', mainCategory]);
        if (location) additionalTags.push(['location', location]);

        const content = content || '';
        const tags = [
          ['title', title],
          ['summary', description.substring(0, 200)],
          ['image', uploadedUrls[0] || ''],
          ...subTags.map(tag => ['t', tag]),
          ...customTags.split(' ').filter(Boolean).map(tag => ['t', tag]),
          ...(selectedCountry ? getCountryTag(selectedCountry) : []),
          ...additionalTags
        ];

        publishEvent({ kind, content, tags });

      } else if (activeTab === 'note') {
        kind = 1;
        additionalTags = [['t', 'note'], ['t', 'mojobus']];
        if (mainCategory) additionalTags.push(['t', mainCategory]);
        if (location) additionalTags.push(['location', location]);

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
        status: 'Erfolgreich!'
      });

      toast({ title: 'Erfolg!', description: 'Veröffentlicht' });

      setTimeout(() => {
        navigate(activeTab === 'media' ? '/bilder' : activeTab === 'article' ? '/artikel' : activeTab === 'place' ? '/plaetze' : '/notes');
      }, 1500);

    } catch (error) {
      console.error('Upload error:', error);
      setUploadProgress({
        current: 0,
        total: 0,
        stage: 'error',
        status: `Fehler: ${error.message}`
      });

      toast({ title: 'Fehler', description: `Upload fehlgeschlagen: ${error.message}`, variant: 'destructive' });
    } finally {
      setIsUploading(false);
      setTimeout(() => {
        setUploadProgress({ current: 0, total: 0, stage: '', status: '' });
      }, 5000);
    }
  };

  const today = new Date().toISOString().split('T')[0];
  useEffect(() => setDate(today), []);

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
                <MapPinIcon className="h-4 w-4" />
                Plätze
              </TabsTrigger>
              <TabsTrigger value="note" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Notes
              </TabsTrigger>
            </TabsList>

            <TabsContent value="media" className="mt-6">
              <CardHeader>
                <CardTitle>Bilder & Medien</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="border-2 border-dashed rounded-lg p-8 text-center" onDrop={handleDrop} onDragOver={(e) => { e.preventDefault(); }} onDragLeave={() => {}}>
                  <input type="file" multiple accept="image/*,video/*" onChange={(e) => handleFileSelect(e.target.files)} className="hidden" id="media-upload" />
                  <Button asChild><label htmlFor="media-upload" className="cursor-pointer"><Camera className="h-5 w-5 mr-2" />Dateien wählen</label></Button>
                </div>

                {files.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {files.map(file => (
                      <div key={file.id} className="relative">
                        {file.preview ? <img src={file.preview} alt={file.name} className="w-full h-40 object-cover rounded" /> : <div className="w-full h-40 bg-gray-100 rounded flex items-center justify-center"><ImageIcon className="h-8 w-8 text-gray-400" /></div>}
                        <div className="absolute top-2 right-2"><Button variant="destructive" size="sm" className="h-6 w-6 p-0" onClick={() => removeFile(file.id)}>×</Button></div>
                        <p className="text-sm truncate">{file.name}</p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-4">
                  <div><Label>Titel</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titel..." /></div>
                  <div><Label>Beschreibung</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Beschreibung..." rows={3} /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>Datum</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
                    <div><Label>Kategorie</Label><Select value={mainCategory} onValueChange={setMainCategory}><SelectTrigger><SelectValue placeholder="Kategorie" /></SelectTrigger><SelectContent>{mainCategories.map(cat => (<SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>))}</SelectContent></Select></div>
                  </div>
                  <div><Label>Standort</Label><Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Land, Stadt (z.B. Portugal, Faro)" /></div>
                  <div><Label>Land</Label><CountrySelector selectedCountry={selectedCountry} onCountryChange={setSelectedCountry} placeholder="Land" /></div>
                  <div><Label>Tags</Label><Input value={customTags} onChange={(e) => setCustomTags(e.target.value)} placeholder="#tags" /></div>
                </div>

                <div className="border rounded-lg p-4 bg-muted/50">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2"><MapPinIcon className="h-4 w-4 text-primary" /><span className="font-medium">GPS-Koordinaten</span></div>
                    {gpsSource && <Badge variant="secondary" className="text-xs">{gpsSource}</Badge>}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm">Breite</Label>
                      <Input value={gpsCoordinates?.lat || ''} onChange={(e) => handleGpsChange('lat', e.target.value)} placeholder="z.B. 37.0194" className="font-mono" />
                      <p className="text-xs text-gray-500 mt-1">Automatisch aus Bildern ermittelt. Manuell änderbar.</p>
                    </div>
                    <div>
                      <Label className="text-sm">Länge</Label>
                      <Input value={gpsCoordinates?.lon || ''} onChange={(e) => handleGpsChange('lon', e.target.value)} placeholder="z.B. -7.9304" className="font-mono" />
                      {isManualGps && <Button variant="ghost" size="sm" className="mt-2 text-xs" onClick={handleClearGps}><Edit3 className="h-3 w-3 mr-1" />Automatisch ermitteln</Button>}
                    </div>
                  </div>
                </div>

                <ImageOptimizationToggle />
              </CardContent>
            </TabsContent>

            <TabsContent value="article" className="mt-6">
              <CardHeader>
                <CardTitle>Artikel</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="border-2 border-dashed rounded-lg p-8 text-center" onDrop={handleDrop} onDragOver={(e) => { e.preventDefault(); }} onDragLeave={() => {}}>
                  <input type="file" accept="image/*" onChange={(e) => handleFileSelect(e.target.files)} className="hidden" id="article-upload" />
                  <Button asChild><label htmlFor="article-upload" className="cursor-pointer"><Camera className="h-5 w-5 mr-2" />Titelbild wählen</label></Button>
                </div>

                {files.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {files.map(file => (
                      <div key={file.id} className="relative">
                        <img src={file.preview || ''} alt={file.name} className="w-full h-40 object-cover rounded" />
                        <div className="absolute top-2 right-2"><Button variant="destructive" size="sm" className="h-6 w-6 p-0" onClick={() => removeFile(file.id)}>×</Button></div>
                        <p className="text-sm truncate">{file.name}</p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-4">
                  <div><Label>Titel</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titel..." /></div>
                  <div><Label>Inhalt</Label><Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Artikel schreiben..." className="min-h-[300px]" /></div>
                  <div><Label>Kategorie</Label><Select value={mainCategory} onValueChange={setMainCategory}><SelectTrigger><SelectValue placeholder="Kategorie" /></SelectTrigger><SelectContent>{mainCategories.map(cat => (<SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>))}</SelectContent></Select></div>
                  <div><Label>Tags</Label><Input value={customTags} onChange={(e) => setCustomTags(e.target.value)} placeholder="#tags" /></div>
                  <div><Label>Standort</Label><Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Land, Stadt" /></div>
                  <div><Label>Land</Label><CountrySelector selectedCountry={selectedCountry} onCountryChange={setSelectedCountry} placeholder="Land" /></div>
                </div>

                <div className="border rounded-lg p-4 bg-muted/50">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2"><MapPinIcon className="h-4 w-4 text-primary" /><span className="font-medium">GPS-Koordinaten</span></div>
                    {gpsSource && <Badge variant="secondary" className="text-xs">{gpsSource}</Badge>}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm">Breite</Label>
                      <Input value={gpsCoordinates?.lat || ''} onChange={(e) => handleGpsChange('lat', e.target.value)} placeholder="z.B. 37.0194" className="font-mono" />
                      <p className="text-xs text-gray-500 mt-1">Aus Titelbild ermittelt. Manuell änderbar.</p>
                    </div>
                    <div>
                      <Label className="text-sm">Länge</Label>
                      <Input value={gpsCoordinates?.lon || ''} onChange={(e) => handleGpsChange('lon', e.target.value)} placeholder="z.B. -7.9304" className="font-mono" />
                      {isManualGps && <Button variant="ghost" size="sm" className="mt-2 text-xs" onClick={handleClearGps}><Edit3 className="h-3 w-3 mr-1" />Automatisch ermitteln</Button>}
                    </div>
                  </div>
                </div>
              </CardContent>
            </TabsContent>

            <TabsContent value="place" className="mt-6">
              <CardHeader>
                <CardTitle>Plätze</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="border-2 border-dashed rounded-lg p-8 text-center" onDrop={handleDrop} onDragOver={(e) => { e.preventDefault(); }} onDragLeave={() => {}}>
                  <input type="file" accept="image/*" multiple onChange={(e) => handleFileSelect(e.target.files)} className="hidden" id="place-upload" />
                  <Button asChild><label htmlFor="place-upload" className="cursor-pointer"><Camera className="h-5 w-5 mr-2" />Bilder wählen</label></Button>
                </div>

                {files.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {files.map(file => (
                      <div key={file.id} className="relative">
                        <img src={file.preview || ''} alt={file.name} className="w-full h-40 object-cover rounded" />
                        <div className="absolute top-2 right-2"><Button variant="destructive" size="sm" className="h-6 w-6 p-0" onClick={() => removeFile(file.id)}>×</Button></div>
                        <p className="text-sm truncate">{file.name}</p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-4">
                  <div><Label>Name</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Name..." /></div>
                  <div><Label>Beschreibung</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Beschreibung..." rows={3} /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>Art</Label><Select value={mainCategory} onValueChange={setMainCategory}><SelectTrigger><SelectValue placeholder="Art" /></SelectTrigger><SelectContent>{placeTypes.map(type => (<SelectItem key={type.value} value={type.value}><span className="flex items-center gap-2"><span>{type.icon}</span>{type.label}</span></SelectItem>))}</SelectContent></Select></div>
                    <div><Label>Bewertung</Label><div className="flex gap-1">{ratings.map(r => <button key={r} onClick={() => setRating(r)} className={`w-10 h-10 rounded-lg border-2 ${rating === r ? 'border-primary bg-primary text-white' : 'border-gray-300'}`}>{r}</button>)}</div></div>
                  </div>
                  <div><Label>Ausstattung</Label><div className="flex flex-wrap gap-2">{['strom', 'wasser', 'wc', 'dusche', 'wlan', 'shop'].map(amenity => (<Badge key={amenity} variant={amenities.includes(amenity) ? 'default' : 'outline'} className="cursor-pointer" onClick={() => handleAmenityToggle(amenity)}>{amenities.includes(amenity) && <span className="mr-1">✓</span>}{amenity}</Badge>))}</div></div>
                  <div><Label>Standort</Label><Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Land, Stadt" /></div>
                  <div><Label>Land</Label><CountrySelector selectedCountry={selectedCountry} onCountryChange={setSelectedCountry} placeholder="Land" /></div>
                </div>

                <div className="border rounded-lg p-4 bg-muted/50">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2"><MapPinIcon className="h-4 w-4 text-primary" /><span className="font-medium">GPS-Koordinaten</span></div>
                    {gpsSource && <Badge variant="secondary" className="text-xs">{gpsSource}</Badge>}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm">Breite</Label>
                      <Input value={gpsCoordinates?.lat || ''} onChange={(e) => handleGpsChange('lat', e.target.value)} placeholder="z.B. 37.0194" className="font-mono" />
                      <p className="text-xs text-gray-500 mt-1">Aus Bildern ermittelt. Manuell änderbar.</p>
                    </div>
                    <div>
                      <Label className="text-sm">Länge</Label>
                      <Input value={gpsCoordinates?.lon || ''} onChange={(e) => handleGpsChange('lon', e.target.value)} placeholder="z.B. -7.9304" className="font-mono" />
                      {isManualGps && <Button variant="ghost" size="sm" className="mt-2 text-xs" onClick={handleClearGps}><Edit3 className="h-3 w-3 mr-1" />Automatisch ermitteln</Button>}
                    </div>
                  </div>
                </div>
              </CardContent>
            </TabsContent>

            <TabsContent value="note" className="mt-6">
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="border-2 border-dashed rounded-lg p-8 text-center" onDrop={handleDrop} onDragOver={(e) => { e.preventDefault(); }} onDragLeave={() => {}}>
                  <input type="file" accept="image/*" onChange={(e) => handleFileSelect(e.target.files)} className="hidden" id="note-upload" />
                  <Button asChild><label htmlFor="note-upload" className="cursor-pointer"><Camera className="h-5 w-5 mr-2" />Bild wählen</label></Button>
                </div>

                {files.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {files.map(file => (
                      <div key={file.id} className="relative">
                        <img src={file.preview || ''} alt={file.name} className="w-full h-40 object-cover rounded" />
                        <div className="absolute top-2 right-2"><Button variant="destructive" size="sm" className="h-6 w-6 p-0" onClick={() => removeFile(file.id)}>×</Button></div>
                        <p className="text-sm truncate">{file.name}</p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-4">
                  <div><Label>Titel</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titel..." /></div>
                  <div><Label>Inhalt</Label><Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Notiz schreiben..." className="min-h-[200px]" /></div>
                  <div><Label>Kategorie</Label><Select value={mainCategory} onValueChange={setMainCategory}><SelectTrigger><SelectValue placeholder="Kategorie" /></SelectTrigger><SelectContent>{mainCategories.map(cat => (<SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>))}</SelectContent></Select></div>
                  <div><Label>Tags</Label><Input value={customTags} onChange={(e) => setCustomTags(e.target.value)} placeholder="#tags" /></div>
                  <div><Label>Standort</Label><Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Land, Stadt" /></div>
                  <div><Label>Land</Label><CountrySelector selectedCountry={selectedCountry} onCountryChange={setSelectedCountry} placeholder="Land" /></div>
                </div>

                <div className="border rounded-lg p-4 bg-muted/50">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2"><MapPinIcon className="h-4 w-4 text-primary" /><span className="font-medium">GPS-Koordinaten</span></div>
                    {gpsSource && <Badge variant="secondary" className="text-xs">{gpsSource}</Badge>}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm">Breite</Label>
                      <Input value={gpsCoordinates?.lat || ''} onChange={(e) => handleGpsChange('lat', e.target.value)} placeholder="z.B. 37.0194" className="font-mono" />
                      <p className="text-xs text-gray-500 mt-1">Aus erstem Bild ermittelt. Manuell änderbar.</p>
                    </div>
                    <div>
                      <Label className="text-sm">Länge</Label>
                      <Input value={gpsCoordinates?.lon || ''} onChange={(e) => handleGpsChange('lon', e.target.value)} placeholder="z.B. -8.3609" className="font-mono" />
                      {isManualGps && <Button variant="ghost" size="sm" className="mt-2 text-xs" onClick={handleClearGps}><Edit3 className="h-3 w-3 mr-1" />Automatisch ermitteln</Button>}
                    </div>
                  </div>
                </div>
              </CardContent>
            </TabsContent>
          </Tabs>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <Button onClick={handleSubmit} disabled={isUploading} className="w-full" size="lg">
              {isUploading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
              {(activeTab === 'media' && files.length === 0) ? 'Dateien wählen zum Veröffentlichen' : 'Veröffentlichen'}
            </Button>
          </CardContent>
        </Card>

        {isUploading && (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                  <p className="text-sm text-muted-foreground mt-2">{uploadProgress.status}</p>
                </div>
                <Progress value={uploadProgress.current} max={uploadProgress.total} className="w-full" />
                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                  <span>{uploadProgress.current} / {uploadProgress.total}</span>
                  <span>{((uploadProgress.current / uploadProgress.total) * 100).toFixed(0)}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader><CardTitle className="text-lg">Anleitung</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <MapPinIcon className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">GPS-Koordinaten</p>
                  <p className="text-muted-foreground">
                    Automatisch aus den Bildern ermittelt (EXIF-Daten).<br/>
                    Du kannst die Koordinaten manuell ändern, wenn das Bild kein GPS hat.<br/>
                    Klicke auf "Automatisch ermitteln" zum Zurücksetzen.
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
