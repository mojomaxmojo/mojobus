import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, UploadCloud, ImageIcon, Camera, MapPin, Calendar, Loader2 } from '@/lib/icons';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/useToast';
import { useUploadFile } from '@/hooks/useUploadFile';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { ImageOptimizationToggle } from '@/components/ImageOptimizationToggle';
import { extractCoordinatesWithSmartFallback } from '@/lib/gpsExtraction';
import { CountrySelector, getCountryTag } from '@/components/CountrySelector';
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

interface UploadProgress {
  current: number;
  total: number;
  stage: 'upload' | 'publish' | 'success' | 'error' | '';
  status: string;
}

export function Publish() {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [customTags, setCustomTags] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0, stage: '', status: '' });
  const { toast } = useToast();
  const { mutateAsync: uploadFile } = useUploadFile();
  const { mutate: publishEvent } = useNostrPublish();
  const navigate = useNavigate();

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
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleSubmit = async () => {
    if (files.length === 0) {
      toast({ title: 'Fehler', description: 'Bitte wähle mindestens eine Datei aus.', variant: 'destructive' });
      return;
    }

    setIsUploading(true);
    setUploadProgress({ current: 0, total: files.length, stage: 'upload', status: 'Upload zu Blossom...' });

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

          if (!uploadResult) {
            throw new Error('Upload returned null');
          }

          if (!Array.isArray(uploadResult)) {
            throw new Error('Upload returned invalid format');
          }

          if (uploadResult.length === 0) {
            throw new Error('Upload returned empty array');
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
              throw new Error('No URL found');
            }
          } else {
            uploadedUrls.push(urlTag[1]);
          }

          await new Promise(resolve => setTimeout(resolve, 100));

        } catch (uploadError) {
          throw new Error(`Upload failed: ${uploadError.message}`);
        }
      }

      setUploadProgress({
        current: files.length,
        total: files.length,
        stage: 'publish',
        status: 'Nostr Event wird erstellt...'
      });

      const content = `${title ? `# ${title}\n\n` : ''}${description ? `${description}\n\n` : ''}${uploadedUrls.join('\n\n')}`;

      const countryList = ['portugal', 'spanien', 'frankreich', 'belgien', 'deutschland', 'luxemburg'];
      const customTagsArray = (customTags || '').split(' ').filter(Boolean);
      const customTagsWithoutCountry = customTagsArray.filter(tag =>
        !countryList.includes(tag.toLowerCase()) &&
        !countryList.includes(tag.replace('#', '').toLowerCase())
      );

      const allTags = [
        ...customTagsWithoutCountry,
        ...(selectedCountry ? getCountryTag(selectedCountry) : [])
      ];

      const mojobusTag = 'mojobus';
      const tagsWithMojobus = [...allTags, mojobusTag];

      const additionalTags = [
        ['type', 'media'],
        ['t', 'media']
      ];

      if (location) additionalTags.push(['location', location]);
      if (date) additionalTags.push(['published_at', date]);

      const gpsCoordinates = await extractCoordinatesWithSmartFallback(files, location, selectedCountry);

      if (gpsCoordinates) {
        additionalTags.push(['lat', gpsCoordinates.latitude.toString()]);
        additionalTags.push(['lon', gpsCoordinates.longitude.toString()]);
      }

      const tags = [
        ...tagsWithMojobus.map(tag => ['t', tag]),
        ...additionalTags
      ];

      setUploadProgress({
        current: files.length,
        total: files.length,
        stage: 'publish',
        status: 'Sende Event zu Nostr Relays...'
      });

      publishEvent({
        kind: 1,
        content,
        tags
      });

      setUploadProgress({
        current: files.length,
        total: files.length,
        stage: 'success',
        status: 'Erfolgreich!'
      });

      toast({ title: 'Erfolg!', description: 'Bilder erfolgreich hochgeladen und veröffentlicht.' });

      setFiles([]);
      setTitle('');
      setDescription('');
      setCustomTags('');
      setLocation('');
      setSelectedCountry('');
      const today = new Date().toISOString().split('T')[0];
      setDate(today);

      setTimeout(() => {
        navigate('/bilder');
      }, 1500);

    } catch (error) {
      console.error('Complete upload error:', error);
      setUploadProgress({
        current: 0,
        total: 0,
        stage: 'error',
        status: `Fehler: ${error.message || 'Unbekannter Fehler'}`
      });

      toast({
        title: 'Fehler',
        description: `Upload fehlgeschlagen: ${error.message || 'Unbekannter Fehler'}`,
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
      setTimeout(() => {
        setUploadProgress({ current: 0, total: 0, stage: '', status: '' });
      }, 5000);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold mb-2">Bilder veröffentlichen</h1>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Medien hochladen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging ? 'border-primary bg-primary/5' : 'border-gray-300'
            }`}
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            >
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleFileSelect(e.target.files)}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Camera className="h-12 w-12 text-primary mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">Klicke hier oder ziehe Dateien hinein</p>
              </label>
            </div>
          </CardContent>
        </Card>

        {files.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Vorschau ({files.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {files.map(file => (
                  <div key={file.id} className="relative">
                    {file.preview ? (
                      <img
                        src={file.preview}
                        alt={file.name}
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                        <IconImage className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      <Button
                        variant="destructive"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => removeFile(file.id)}
                      >
                        ×
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Titel</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Titel der Bilder..."
              />
            </div>

            <div>
              <Label htmlFor="date">Datum</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="description">Beschreibung</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Beschreibung der Bilder..."
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="location">Standort</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Land, Stadt (z.B. Portugal, Faro)"
              />
              <p className="text-xs text-gray-500 mt-1">
                GPS wird aus Bild-EXIF ermittelt. Fallback zur Standort-Parsierung.
              </p>
            </div>

            <div>
              <Label>Land</Label>
              <CountrySelector
                selectedCountry={selectedCountry}
                onCountryChange={setSelectedCountry}
                placeholder="Land für Fallback"
              />
            </div>

            <div>
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                value={customTags}
                onChange={(e) => setCustomTags(e.target.value)}
                placeholder="#tags getrennt durch Leerzeichen"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <Button
              onClick={handleSubmit}
              disabled={files.length === 0 || isUploading}
              className="w-full"
              size="lg"
            >
              {isUploading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
              {files.length === 0 ? 'Dateien auswählen zum Veröffentlichen' : 'Veröffentlichen'}
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
                <Progress
                  value={uploadProgress.current}
                  max={uploadProgress.total}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                  <span>{uploadProgress.current} / {uploadProgress.total}</span>
                  <span>{uploadProgress.total > 0 ? ((uploadProgress.current / uploadProgress.total) * 100).toFixed(0) : '0'}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Anleitung</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div>
                <strong>GPS aus Bildern:</strong>
                <p className="text-gray-600">GPS wird automatisch aus den EXIF-Daten des ersten Bildes ermittelt.</p>
              </div>
              <div>
                <strong>Standort-Parsierung:</strong>
                <p className="text-gray-600">Wenn kein GPS verfügbar, gib den Standort im Format "Land, Stadt" ein (z.B. "Portugal, Faro").</p>
              </div>
              <div>
                <strong>Land-Fallback:</strong>
                <p className="text-gray-600">Wähle ein Land aus dem Dropdown, falls der Standort nicht erkannt wird.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default Publish;
