// Ort speichern Button Fix - Korrigiert name.trim() zu title.trim()
// Version 3 - Force Cache Invalidation
import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { FileText, MessageSquare, Map, Upload, UploadCloud, ImageIcon, Video, Music, File, Camera, MapPin, Calendar, Tag, Battery, Sun, Wrench, Hammer, Cpu, Mountain, Lightbulb, Dog, Trees, Droplets, Waves, Eye, Loader2, CheckCircle, Route, Sparkles } from '@/lib/icons';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/useToast';
import { useUploadFile } from '@/hooks/useUploadFile';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { ImageOptimizationToggle } from '@/components/ImageOptimizationToggle';
import { GpsEditor } from '@/components/GpsEditor';
import { GpsStatusIndicator } from '@/components/GpsStatusIndicator';
import { LocationPicker } from '@/components/LocationPicker';
import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { CONTENT_CATEGORIES, createRequiredTags, getOptionalTags, getTabConfig } from '@/config/contentCategories';
import { CountrySelector, getCountryTag } from '@/components/CountrySelector';
import { ARTICLE_CATEGORIES, DIY_CATEGORIES, DIY_TAGS, NATURE_CATEGORIES, NATURE_TAGS, TAG_GROUPS } from '@/config';
import MAIN_MENU from '@/config/menu';
import { RV_LIFE_CONFIG } from '@/config/rvlife';
import { nip19 } from 'nostr-tools';
import { MilkdownEditor } from '@/components/MilkdownEditor';
import { TripPublishForm } from '@/components/TripPublishForm';
import { Progress } from '@/components/ui/progress';
import { extractGpsFromImage, formatCoordinatesSimple, reverseGeocode, mapCountryCode, type GpsData, type GpsStatus, type LocationData } from '@/lib/gpsExtraction';
import exifr from 'exifr';

/**
 * Erstellt eine korrigierte Vorschau basierend auf EXIF-Daten
 * Berücksichtigt die EXIF-Orientierung, die Browser oft ignorieren
 */
async function createCorrectedPreview(
  file: File,
  exifWidth?: number,
  exifHeight?: number,
  exifOrientation?: number
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      const actualWidth = img.naturalWidth;
      const actualHeight = img.naturalHeight;

      console.log(`[Preview] ${file.name}: Actual dimensions ${actualWidth}x${actualHeight}`);
      console.log(`[Preview] ${file.name}: EXIF Orientation = ${exifOrientation || 'not set'}`);

      // Rotation basierend auf EXIF Orientation (1-8)
      let rotation = 0;
      let flipH = false;

      if (exifOrientation && exifOrientation !== 1) {
        switch (exifOrientation) {
          case 2: flipH = true; break;
          case 3: rotation = 180; break;
          case 4: rotation = 180; flipH = true; break;
          case 5: rotation = -90; flipH = true; break;
          case 6: rotation = 90; break;  // 90° CW korrigiert 90° CCW
          case 7: rotation = 90; flipH = true; break;
          case 8: rotation = -90; break;
        }
        console.log(`[Corrected File] ${file.name}: Orientation=${exifOrientation}, applying rotation=${rotation}°`);
      }

      // Wenn keine Korrektur nötig, Original zurückgeben
      if (rotation === 0 && !flipH) {
        URL.revokeObjectURL(url);
        resolve(url);
        return;
      }

      // Canvas erstellen
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        URL.revokeObjectURL(url);
        resolve(url);
        return;
      }

      // Canvas-Größe basierend auf Rotation
      if (rotation === 90 || rotation === -90) {
        canvas.width = actualHeight;
        canvas.height = actualWidth;
      } else {
        canvas.width = actualWidth;
        canvas.height = actualHeight;
      }

      // Transformation anwenden
      ctx.translate(canvas.width / 2, canvas.height / 2);
      if (rotation !== 0) {
        ctx.rotate((rotation * Math.PI) / 180);
      }
      if (flipH) {
        ctx.scale(-1, 1);
      }
      ctx.translate(-actualWidth / 2, -actualHeight / 2);

      // Bild zeichnen
      ctx.drawImage(img, 0, 0, actualWidth, actualHeight);

      // Neue URL erstellen
      canvas.toBlob((blob) => {
        if (blob) {
          const correctedUrl = URL.createObjectURL(blob);
          console.log(`[Corrected File] ${file.name}: Created corrected preview`);
          URL.revokeObjectURL(url);
          resolve(correctedUrl);
        } else {
          URL.revokeObjectURL(url);
          resolve(url);
        }
      }, 'image/jpeg', 0.9);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(url);
    };

    img.src = url;
  });
}

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
  /** GPS data extracted from image EXIF */
  gps?: GpsData;
  /** GPS extraction status */
  gpsStatus?: GpsStatus;
}

interface UploadProgress {
  current: number;
  total: number;
  stage: 'upload' | 'publish' | 'success' | 'error' | '';
  status: string;
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
  const [additionalImagesUrlInput, setAdditionalImagesUrlInput] = useState('');
  const [manualTags, setManualTags] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isGeneratingArticle, setIsGeneratingArticle] = useState(false);
  const [selectedModel, setSelectedModel] = useState<'llama4' | 'gpt4'>('llama4');
  const [lifestyle, setLifestyle] = useState<'vanlife' | 'rvlife' | 'beachlife' | 'wohnmobil' | 'perpetual-travelers'>('vanlife');
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0, stage: '', status: '' });
  const { toast } = useToast();
  const { mutateAsync: uploadFile } = useUploadFile();
  const { mutateAsync: publishEvent } = useNostrPublish();
  const navigate = useNavigate();

  // KI-Artikelgenerierung (Foster Huntington Stil)
  const generateArticleWithAI = async () => {
    if (files.length === 0) {
      toast({
        title: 'Fehler',
        description: 'Bitte lade mindestens ein Bild hoch.',
        variant: 'destructive'
      });
      return;
    }

    setIsGeneratingArticle(true);
    try {
      const formData = new FormData();
      files.forEach(file => formData.append('images', file.file));
      formData.append('title', title);
      formData.append('description', description);
      formData.append('text', customTags || 'Meer Abenteuer Strand');
      formData.append('location', location);
      formData.append('model', selectedModel);
      formData.append('lifestyle', lifestyle);

      // Zusätzliche Kontext-Felder für bessere KI-Generierung
      formData.append('mainCategory', mainCategory || '');
      formData.append('subCategories', JSON.stringify(selectedSubTags));
      formData.append('detailedTags', JSON.stringify(detailedTags));
      formData.append('country', selectedCountry || '');

      // Erweiterte Kontext-Felder für noch bessere KI-Generierung
      formData.append('manualTags', JSON.stringify(manualTags));
      formData.append('additionalImageUrls', additionalImagesUrlInput || '');

      const response = await fetch('/api/generate-media-article', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      if (data.article) {
        setDescription(data.article);
        if (data.hashtags) {
          setCustomTags(prev => prev ? `${prev} ${data.hashtags}` : data.hashtags);
        }
        toast({
          title: 'Erfolg!',
          description: `KI-Artikel generiert mit ${data.model === 'claude' ? 'Claude Sonnet 4.6' : 'Llama 4 Scout'} und in Felder eingefügt.`
        });
      }
    } catch (error) {
      console.error(error);
      toast({
        title: 'Fehler',
        description: 'KI-Generierung fehlgeschlagen.',
        variant: 'destructive'
      });
    } finally {
      setIsGeneratingArticle(false);
    }
  };

  // GPS editing state
  const [editingGpsFile, setEditingGpsFile] = useState<string | null>(null);
  const [batchEditMode, setBatchEditMode] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);

  // Auto-fill location from first GPS-detected image
   useEffect(() => {
      const autoFillLocation = async () => {
       const firstGpsImage = files.find(f => f.type === 'image' && f.gps && f.gpsStatus === 'detected');
       if (firstGpsImage && !location) {
         console.log('[Media GPS] GPS detected, reverse geocoding...');
         const locationData = await reverseGeocode(firstGpsImage.gps.latitude, firstGpsImage.gps.longitude);
         if (locationData) {
           // Set location to city + neighbourhood/suburb (no postcode)
           const locationParts = [
             locationData.city,
             locationData.neighbourhood,
             locationData.suburb
           ].filter(Boolean);
           const loc = locationParts.join(', ');
           setLocation(loc);
           console.log('[Media GPS] Location found:', loc);

           // Auto-fill country if detected
           const country = mapCountryCode(locationData);
           if (country && !selectedCountry) {
             setSelectedCountry(country);
             console.log('[Media GPS] Country auto-filled:', country);
           }
         }
       }
     };

     autoFillLocation();
   }, [files, location, selectedCountry]);

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

  const handleFileSelect = async (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const newFiles: MediaFile[] = [];

    // Device-Erkennung: Desktop braucht EXIF-Korrektur, Mobil nicht
    const isDesktop = window.innerWidth > 768 || !/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    console.log(`[Device] Detected as ${isDesktop ? 'Desktop' : 'Mobile'} - ${isDesktop ? 'will correct EXIF orientation' : 'will use simple preview'}`);

    // Process each file asynchronously
    for (const file of Array.from(selectedFiles)) {
      const mediaType = file.type.startsWith('image/') ? 'image' :
                         file.type.startsWith('video/') ? 'video' :
                         file.type.startsWith('audio/') ? 'audio' : 'document';

      let preview: string | undefined;
      let exifWidth: number | undefined;
      let exifHeight: number | undefined;
      let exifOrientation: number | undefined;

       // Für Desktop-Bilder: EXIF-Korrektur anwenden
       if (mediaType === 'image' && isDesktop) {
         try {
           // EXIF-Daten lesen (wie in TripPublishForm.tsx)
           // Orientation separat lesen (funktioniert auch wenn parse fehlschlägt)
           try {
             exifOrientation = await exifr.orientation(file);
             console.log(`[Media EXIF] ${file.name}: Orientation (via exifr.orientation) = ${exifOrientation || 'not found'}`);
           } catch (orientErr) {
             console.warn(`[Media EXIF] ${file.name}: Could not read orientation:`, orientErr);
           }

           // Bildabmessungen lesen
           try {
             const dimExif = await exifr.parse(file, { exif: true, pickTags: ['ImageWidth', 'ImageHeight', 'ExifImageWidth', 'ExifImageHeight'] });
             exifWidth = dimExif?.ImageWidth || dimExif?.ExifImageWidth;
             exifHeight = dimExif?.ImageHeight || dimExif?.ExifImageHeight;
             if (exifWidth && exifHeight) {
               console.log(`[Media EXIF] ${file.name}: EXIF dimensions ${exifWidth}x${exifHeight}`);
             }
           } catch (dimErr) {
             console.warn(`[Media EXIF] ${file.name}: Could not read dimensions:`, dimErr);
           }

           // Korrigierte Preview erstellen (immer, wie in TripPublishForm.tsx)
           preview = await createCorrectedPreview(file, exifWidth, exifHeight, exifOrientation);
         } catch (exifError) {
           console.warn(`[Media EXIF] Failed to read EXIF from ${file.name}:`, exifError);
           preview = URL.createObjectURL(file);
         }
      } else {
        // Für Mobil oder Nicht-Bilder: Einfache Preview
        preview = mediaType === 'image' ? URL.createObjectURL(file) : undefined;
      }

      const newFile: MediaFile = {
        id: Math.random().toString(36).substr(2, 9),
        file,
        name: file.name,
        type: mediaType,
        size: file.size,
        preview,
        gpsStatus: 'not_found',
      };

      // Extract GPS from images only
      if (mediaType === 'image') {
        try {
          const gpsData = await extractGpsFromImage(file);
          if (gpsData) {
            newFile.gps = gpsData;
            newFile.gpsStatus = 'detected';
            console.log(`[GPS] Extracted from ${file.name}:`, gpsData);
          }
        } catch (error) {
          console.error(`[GPS] Failed to extract from ${file.name}:`, error);
          newFile.gpsStatus = 'error';
        }
      }

      newFiles.push(newFile);
    }

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

  // GPS editing functions
  const openGpsEditor = (fileId: string) => {
    setEditingGpsFile(fileId);
  };

  const closeGpsEditor = () => {
    setEditingGpsFile(null);
    setShowMapPicker(false);
  };

  const saveGps = async (fileId: string, gps: GpsData) => {
    // Save GPS to file
    setFiles(prev => prev.map(file => {
      if (file.id === fileId) {
        return {
          ...file,
          gps,
          gpsStatus: 'manual',
        };
      }
      return file;
    }));

    // Auto-fill location and country using reverse geocoding
    try {
      console.log('[Media GPS Manual] Reverse geocoding for manual GPS...', gps);
      const locationData = await reverseGeocode(gps.latitude, gps.longitude);
      if (locationData) {
        // Set location to city + neighbourhood/suburb (no postcode)
        const locationParts = [
          locationData.city,
          locationData.neighbourhood,
          locationData.suburb
        ].filter(Boolean);
        const loc = locationParts.join(', ');
        setLocation(loc);
        console.log('[Media GPS Manual] Location found:', loc);

        // Auto-fill country if detected
        const country = mapCountryCode(locationData);
        if (country) {
          setSelectedCountry(country);
          console.log('[Media GPS Manual] Country auto-filled:', country);
        }
      }
    } catch (error) {
      console.error('[Media GPS Manual] Reverse geocoding failed:', error);
    }

    closeGpsEditor();
  };

  const removeGps = (fileId: string) => {
    setFiles(prev => prev.map(file => {
      if (file.id === fileId) {
        const updated = { ...file };
        delete updated.gps;
        updated.gpsStatus = 'not_found';
        return updated;
      }
      return file;
    }));
    closeGpsEditor();
  };

  const toggleBatchEditMode = () => {
    setBatchEditMode(prev => !prev);
  };

  const applyGpsToAll = (sourceFileId: string) => {
    const sourceFile = files.find(f => f.id === sourceFileId);
    if (!sourceFile || !sourceFile.gps) return;

    setFiles(prev => prev.map(file => {
      if (file.type === 'image' && file.id !== sourceFileId) {
        return {
          ...file,
          gps: { ...sourceFile.gps },
          gpsStatus: 'manual',
        };
      }
      return file;
    }));
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

    setIsUploading(true);
    setUploadProgress({ current: 0, total: files.length, stage: 'upload', status: '📤 Upload zu Blossom wird gestartet...' });

    try {
      // STAGE 1: Upload all files to Blossom
      const uploadedUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const fileObj = files[i];
        setUploadProgress({
          current: i + 1,
          total: files.length,
          stage: 'upload',
          status: `📤 Lade "${fileObj.name}" zu Blossom hochladen... (${((i + 1) / files.length * 100).toFixed(0)}%)`
        });

        try {
          const uploadResult = await uploadFile(fileObj.file);

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
            } else {
              console.error('No URL tag found in upload result:', uploadResult);
              throw new Error('No URL found in upload result');
            }
          } else {
            uploadedUrls.push(urlTag[1]);
          }

          // Brief delay to show progress
          await new Promise(resolve => setTimeout(resolve, 100));

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

      // STAGE 2: Publish to Nostr
      setUploadProgress({
        current: files.length,
        total: files.length,
        stage: 'publish',
        status: '📝 Nostr Event wird erstellt...'
      });

      // Create content with file URLs
      const content = `${title ? `# ${title}\n\n` : ''}${description ? `${description}\n\n` : ''}${uploadedUrls.join('\n\n')}`;

      // Entferne Country-Tags aus customTags, um Duplikate zu vermeiden
      const countryList = ['portugal', 'spanien', 'frankreich', 'belgien', 'deutschland', 'luxemburg'];
      const customTagsArray = (customTags || '').split(' ').filter(Boolean);
      const customTagsWithoutCountry = customTagsArray.filter(tag =>
        !countryList.includes(tag.toLowerCase()) &&
        !countryList.includes(tag.replace('#', '').toLowerCase())
      );

      // Collect all tags from different sources
      const allTags = [
        ...selectedSubTags,
        ...detailedTags,
        ...customTagsWithoutCountry,
        ...(selectedCountry ? getCountryTag(selectedCountry) : []) // Country-Tags nur hinzufügen, wenn gewählt
      ];

      // Always add #mojobus as mandatory tag for /veroeffentlichen
      const mojobusTag = 'mojobus';
      const tagsWithMojobus = [...allTags, mojobusTag];

      // Additional special tags
      const additionalTags = [
        ['type', 'media'],
        ['t', 'media']  // Add media tag for /bilder page compatibility
      ];

      if (mainCategory) additionalTags.push(['t', mainCategory]);

      // Add GPS tags from first image with GPS data
      const firstGpsImage = files.find(f => f.type === 'image' && f.gps);
      if (firstGpsImage && firstGpsImage.gps) {
        additionalTags.push(['gps_lat', firstGpsImage.gps.latitude.toString()]);
        additionalTags.push(['gps_lon', firstGpsImage.gps.longitude.toString()]);
        if (firstGpsImage.gps.altitude) {
          additionalTags.push(['gps_alt', firstGpsImage.gps.altitude.toString()]);
        }
        additionalTags.push(['gps_precision', firstGpsImage.gps.precision]);
        additionalTags.push(['gps_source', firstGpsImage.gpsStatus]);
      }

      // Add location and date tags
      if (location) additionalTags.push(['location', location]);
      if (date) additionalTags.push(['published_at', date]);

      // Final tag array - includes #mojobus
      const tags = [
        ...tagsWithMojobus.map(tag => ['t', tag]),
        ...additionalTags
      ];

      setUploadProgress({
        current: files.length,
        total: files.length,
        stage: 'publish',
        status: '📡 Sende Event zu Nostr Relays...'
      });

      // Publish to Nostr
      try {
        console.log('[MediaUpload] Publishing event to Nostr...');
        console.log('[MediaUpload] Content:', content.substring(0, 100) + '...');
        console.log('[MediaUpload] Tags count:', tags.length);
        
        await publishEvent({
          kind: 1, // Text note with media attachments
          content,
          tags
        });
        
        console.log('[MediaUpload] Event published successfully!');
      } catch (publishError: any) {
        console.error('[MediaUpload] Publish failed:', publishError);
        console.error('[MediaUpload] Error details:', {
          name: publishError?.name,
          message: publishError?.message,
          stack: publishError?.stack,
          cause: publishError?.cause
        });
        throw new Error(`Publishing failed: ${publishError?.message || 'Unknown error'}`);
      }

      // SUCCESS!
      setUploadProgress({
        current: files.length,
        total: files.length,
        stage: 'success',
        status: '✅ Erfolgreich! Bilder hochgeladen und veroeffentlicht.'
      });

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
      }, 1500);

    } catch (error) {
      console.error('Complete upload error:', error);
      setUploadProgress({
        current: 0,
        total: 0,
        stage: 'error',
        status: `❌ Fehler: ${error.message || 'Unbekannter Fehler'}`
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



  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Medien hochladen
          </CardTitle>
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
            <input
              type="file"
              multiple
              accept={mediaTypes.map(m => m.accept).join(',')}
              onChange={(e) => handleFileSelect(e.target.files)}
              className="hidden"
              id="file-upload"
            />
            <Button asChild>
              <label htmlFor="file-upload" className="cursor-pointer px-3 py-1">
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
             <div className="flex items-center justify-between">
               <CardTitle>Vorschau ({files.length} Dateien)</CardTitle>
               {files.some(f => f.type === 'image') && (
                 <Button
                   size="sm"
                   variant={batchEditMode ? "default" : "outline"}
                   onClick={toggleBatchEditMode}
                   className="gap-1"
                 >
                   {batchEditMode ? <CheckCircle className="h-4 w-4" /> : <Wrench className="h-4 w-4" />}
                   {batchEditMode ? "Batch-Edit aktiv" : "Batch-Edit"}
                 </Button>
               )}
             </div>
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
                   <div className="p-2 space-y-1">
                     <div className="text-sm">
                       <p className="font-medium truncate">{file.name}</p>
                       <p className="text-gray-500 text-xs">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                     </div>

                     {/* GPS Info Display */}
                     {file.type === 'image' && (
                       <>
                         {file.gps && file.gps.latitude && file.gps.longitude ? (
                           <div className="space-y-2">
                             <GpsStatusIndicator status={file.gpsStatus} gps={file.gps} />
                             <div className="text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded p-2">
                               <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                                 <MapPin className="h-3 w-3 text-green-600 dark:text-green-400" />
                                 <span className="truncate font-mono">
                                   {formatCoordinatesSimple(file.gps.latitude, file.gps.longitude)}
                                 </span>
                               </div>
                             </div>
                           </div>
                         ) : (
                           <Button
                             size="sm"
                             variant="outline"
                             className="w-full text-xs h-8"
                             onClick={() => openGpsEditor(file.id)}
                           >
                             <MapPin className="h-3 w-3 mr-1" />
                             GPS hinzufügen
                           </Button>
                         )}
                       </>
                     )}
                   </div>

                   {/* GPS Editor */}
                   {editingGpsFile === file.id && file.type === 'image' && (
                     <div className="mt-2 space-y-2">
                       {/* Toggle between Simple Editor and Map */}
                       <div className="flex gap-2">
                         <Button
                           size="sm"
                           variant={!showMapPicker ? 'default' : 'outline'}
                           className="flex-1 h-7 text-xs"
                           onClick={() => setShowMapPicker(false)}
                         >
                           <span className="mr-1">✏️</span>
                           Einfach
                         </Button>
                         <Button
                           size="sm"
                           variant={showMapPicker ? 'default' : 'outline'}
                           className="flex-1 h-7 text-xs"
                           onClick={() => setShowMapPicker(true)}
                         >
                           <span className="mr-1">🗺️</span>
                           Karte
                         </Button>
                       </div>

                       {/* Show Map Picker */}
                       {showMapPicker ? (
                         <LocationPicker
                           gps={file.gps}
                           onSave={(gps) => saveGps(file.id, gps)}
                           onCancel={closeGpsEditor}
                           initialZoom={13}
                           height="300px"
                           onCountryDetected={(country) => {
                             console.log('[Publish] Country detected:', country);
                             setSelectedCountry(country);
                           }}
                           onLocationDetected={(locationText) => {
                             console.log('[Publish] Location detected:', locationText);
                             setLocation(locationText);
                           }}
                         />
                       ) : (
                         /* Show Simple Editor */
                         <GpsEditor
                           gps={file.gps}
                           onSave={(gps) => saveGps(file.id, gps)}
                           onCancel={closeGpsEditor}
                           onRemove={() => removeGps(file.id)}
                           onApplyToAll={() => applyGpsToAll(file.id)}
                         />
                       )}
                     </div>
                   )}

                   {/* Delete Button */}
                   <Button
                     variant="destructive"
                     size="sm"
                     className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity z-20"
                     onClick={() => removeFile(file.id)}
                   >
                     ×
                   </Button>
                 </div>
               ))}
             </div>

             {/* Batch GPS Edit Panel */}
             {batchEditMode && files.some(f => f.type === 'image' && f.gps) && (
               <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                 <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-3">Batch GPS bearbeiten</h4>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {files.filter(f => f.type === 'image' && f.gps).map(file => (
                     <div key={file.id} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded border">
                       <span className="text-sm truncate">{file.name}</span>
                       <Button
                         size="sm"
                         variant="outline"
                         className="h-7"
                         onClick={() => applyGpsToAll(file.id)}
                       >
                         Auf alle anwenden
                       </Button>
                     </div>
                   ))}
                 </div>
               </div>
             )}
           </CardContent>
         </Card>
       )}

       {/* Location */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Standort
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="location">Standort</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="📍 Wo wurden die Bilder aufgenommen?"
            />
            {files.some(f => f.type === 'image' && f.gps) && (
              <p className="text-xs text-green-600 dark:text-green-400">
                📍 GPS-Daten verfügbar - Standort kann automatisch ausgefüllt werden
              </p>
            )}
          </div>

          {/* Country Selection */}
          <CountrySelector
            selectedCountry={selectedCountry}
            onCountryChange={setSelectedCountry}
            placeholder="Land auswaehlen"
          />
         </CardContent>
       </Card>

       {/* Media Details */}
      <Card>
        <CardHeader>
          <CardTitle>Bilderdetails</CardTitle>
          <ImageOptimizationToggle className="mt-4" />
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
              
              {/* Lifestyle Selection */}
              <div className="mt-4 space-y-3">
                <Label className="text-sm font-medium">Lifestyle auswählen:</Label>
                <Select value={lifestyle} onValueChange={(value: any) => setLifestyle(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Wähle deinen Lifestyle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vanlife">🚐 Vanlife - Van-Life auf Rädern</SelectItem>
                    <SelectItem value="rvlife">🚗 RVlife - Recreational Vehicle</SelectItem>
                    <SelectItem value="beachlife">🏖️ Beachlife - Strand & Surf Lifestyle</SelectItem>
                    <SelectItem value="wohnmobil">🏠 Wohnmobil - Wohnmobil/Camper</SelectItem>
                    <SelectItem value="perpetual-travelers">🌍 Perpetual Travelers - Permanent Reisende</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Foster Huntington Stil - ehrlich, direkt, authentisch
                </p>
              </div>
              
              {/* KI-Modell Auswahl */}
              <div className="mt-4 space-y-3">
                <Label className="text-sm font-medium">KI-Modell auswählen:</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div 
                    className={`p-3 border rounded-lg cursor-pointer transition-all ${selectedModel === 'llama4' ? 'border-ocean-500 bg-ocean-50 dark:bg-ocean-950' : 'hover:border-gray-300'}`}
                    onClick={() => setSelectedModel('llama4')}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🚀</span>
                      <div>
                        <p className="font-medium text-sm">Llama 4 Scout</p>
                        <p className="text-xs text-muted-foreground">Schnell & Günstig</p>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      <p>✅ 1-2 Sekunden</p>
                      <p>💰 ~$0.005 pro Artikel</p>
                      <p>⭐ Gute Qualität</p>
                    </div>
                  </div>
                  
                  <div
                    className={`p-3 border rounded-lg cursor-pointer transition-all ${selectedModel === 'claude' ? 'border-ocean-500 bg-ocean-50 dark:bg-ocean-950' : 'hover:border-gray-300'}`}
                    onClick={() => setSelectedModel('claude')}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🤖</span>
                      <div>
                        <p className="font-medium text-sm">Claude Sonnet 4.6</p>
                        <p className="text-xs text-muted-foreground">Neueste Premium Qualität</p>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      <p>⏱️ 3-6 Sekunden</p>
                      <p>💰 ~$0.015 pro Artikel</p>
                      <p>⭐⭐⭐⭐ Neueste menschliche Texte</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <Button
                type="button"
                variant="outline"
                onClick={generateArticleWithAI}
                disabled={isGeneratingArticle || files.length === 0}
                className="mt-2"
              >
                {isGeneratingArticle ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generiere mit {selectedModel === 'claude' ? 'Claude 4.6' : 'Llama 4'}...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    KI-Artikel generieren ({lifestyle})
                    <span className="ml-2 text-xs text-muted-foreground">
                      ({selectedModel === 'claude' ? 'Claude Sonnet 4.6' : 'Llama 4 Scout'})
                    </span>
                  </>
                )}
              </Button>
              {files.length === 0 && (
                <p className="text-xs text-muted-foreground mt-2">
                  💡 Lade zuerst Bilder hoch, um die KI-Generierung zu nutzen.
                </p>
              )}
            </div>

          {/* Categories */}
          <div className="space-y-4">

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

          {/* Upload Progress */}
          {isUploading && (
            <Card className={`border-2 ${
              uploadProgress.stage === 'error'
                ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950'
                : uploadProgress.stage === 'success'
                  ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950'
                  : 'border-ocean-200 dark:border-ocean-800 bg-ocean-50 dark:bg-ocean-950'
            }`}>
              <CardContent className="pt-6">
                <div className="space-y-6">
                  {/* Stage Indicator */}
                  <div className="flex items-center gap-4">
                    <div className={`flex items-center gap-2 ${
                      uploadProgress.stage === 'upload' ? 'text-ocean-600 dark:text-ocean-400' :
                      uploadProgress.stage === 'publish' ? 'text-ocean-600 dark:text-ocean-400' :
                      uploadProgress.stage === 'success' ? 'text-green-600 dark:text-green-400' :
                      uploadProgress.stage === 'error' ? 'text-red-600 dark:text-red-400' :
                      'text-gray-400'
                    }`}>
                      {uploadProgress.stage === 'upload' && <Loader2 className="h-5 w-5 animate-spin" />}
                      {uploadProgress.stage === 'publish' && <UploadCloud className="h-5 w-5" />}
                      {uploadProgress.stage === 'success' && <CheckCircle className="h-5 w-5" />}
                      {uploadProgress.stage === 'error' && <span className="text-2xl">❌</span>}
                      {!uploadProgress.stage && <span className="text-2xl">⏳</span>}
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="font-medium text-sm">
                        {uploadProgress.status}
                      </p>
                      {/* Stage badges */}
                      <div className="flex gap-2">
                        <Badge variant="outline" className={`text-xs ${
                          uploadProgress.stage === 'upload'
                            ? 'bg-ocean-100 border-ocean-300 text-ocean-700'
                            : uploadProgress.stage === 'publish' || uploadProgress.stage === 'success'
                              ? 'bg-green-100 border-green-300 text-green-700'
                              : 'bg-gray-100 text-gray-600'
                        }`}>
                          🌸 Blossom Upload
                        </Badge>
                        <Badge variant="outline" className={`text-xs ${
                          uploadProgress.stage === 'publish'
                            ? 'bg-ocean-100 border-ocean-300 text-ocean-700'
                            : uploadProgress.stage === 'success'
                              ? 'bg-green-100 border-green-300 text-green-700'
                              : 'bg-gray-100 text-gray-600'
                        }`}>
                          📡 Nostr Post
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* File Upload Progress */}
                  {uploadProgress.stage === 'upload' && (
                    <>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-ocean-600 dark:text-ocean-400">
                          {uploadProgress.current} von {uploadProgress.total} Dateien
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {Math.round((uploadProgress.current / uploadProgress.total) * 100)}%
                        </Badge>
                      </div>
                      <Progress
                        value={(uploadProgress.current / uploadProgress.total) * 100}
                        className="h-2"
                      />
                    </>
                  )}

                  {/* Publishing Progress */}
                  {uploadProgress.stage === 'publish' && (
                    <div className="flex items-center gap-3 text-sm text-ocean-600 dark:text-ocean-400">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <p>Event wird zu {uploadProgress.total} Nostr Relays gesendet...</p>
                    </div>
                  )}

                  {/* Success State */}
                  {uploadProgress.stage === 'success' && (
                    <div className="flex items-center gap-3 text-sm text-green-600 dark:text-green-400">
                      <CheckCircle className="h-4 w-4" />
                      <p>Bilder erfolgreich zu Blossom hochgeladen und zu Nostr veroeffentlicht!</p>
                    </div>
                  )}

                  {/* Error State */}
                  {uploadProgress.stage === 'error' && (
                    <div className="flex items-start gap-3 text-sm text-red-600 dark:text-red-400">
                      <span className="text-xl">⚠️</span>
                      <div className="space-y-1">
                        <p>{uploadProgress.status}</p>
                        <p className="text-xs">Bitte versuche es erneut.</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <Button
            onClick={handleSubmit}
            className="w-full"
            disabled={files.length === 0 || isUploading}
          >
            {isUploading ? (
              <>
                {uploadProgress.stage === 'upload' && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {uploadProgress.stage === 'publish' && <UploadCloud className="h-4 w-4 mr-2" />}
                {uploadProgress.stage === 'success' && <CheckCircle className="h-4 w-4 mr-2" />}
                {uploadProgress.stage === 'error' && <span className="mr-2">⚠️</span>}
                {!uploadProgress.stage && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {uploadProgress.stage === 'upload' && 'Upload zu Blossom...'}
                {uploadProgress.stage === 'publish' && 'Post zu Nostr...'}
                {uploadProgress.stage === 'success' && '✅ Erfolgreich!'}
                {uploadProgress.stage === 'error' && 'Fehler aufgetreten'}
                {!uploadProgress.stage && 'Wird verarbeitet...'}
              </>
            ) : (
              <>
                <UploadCloud className="h-4 w-4 mr-2" />
                Bilder veroeffentlichen
              </>
            )}
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
  const [location, setLocation] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [isPublic, setIsPublic] = useState(true);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [imageGpsData, setImageGpsData] = useState<Record<number, GpsData>>({});
  const [imageGpsStatuses, setImageGpsStatuses] = useState<Record<number, GpsStatus>>({});
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0, status: '' });
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishProgress, setPublishProgress] = useState({ stage: '', status: '' });
  const [editingGpsImage, setEditingGpsImage] = useState<number | null>(null);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [isGeneratingNote, setIsGeneratingNote] = useState(false);
  const [lifestyle, setLifestyle] = useState<'vanlife' | 'rvlife' | 'beachlife' | 'wohnmobil' | 'perpetual-travelers'>('vanlife');
  const { toast } = useToast();
  const { mutateAsync: publishEvent } = useNostrPublish();
  const { mutateAsync: uploadFile } = useUploadFile();
  const navigate = useNavigate();

  // KI-Notiz generieren (Foster Huntington Stil)
  const generateNoteWithAI = async () => {
    if (imageFiles.length === 0) {
      toast({
        title: 'Bild erforderlich',
        description: 'Bitte lade zuerst mindestens ein Bild hoch.',
        variant: 'destructive'
      });
      return;
    }

    setIsGeneratingNote(true);
    try {
      const formData = new FormData();
      imageFiles.forEach((file) => {
        formData.append('images', file);
      });
      formData.append('location', location);
      formData.append('text', tags.join(' ') || '');
      formData.append('lifestyle', lifestyle);
      formData.append('country', selectedCountry || '');

      const response = await fetch('/api/generate-note', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      if (data.note) {
        setContent(data.note);
        if (data.hashtags) {
          const newTags = data.hashtags.split(' ').filter((t: string) => !tags.includes(t));
          setTags([...tags, ...newTags]);
        }
        toast({
          title: 'Erfolg!',
          description: `KI-Notiz generiert (${data.lifestyle})`
        });
      }
    } catch (error) {
      console.error(error);
      toast({
        title: 'Fehler',
        description: 'KI-Generierung fehlgeschlagen.',
        variant: 'destructive'
      });
    } finally {
      setIsGeneratingNote(false);
    }
  };

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

        // Load GPS data from tags for each image
        // GPS tags are stored sequentially with image tags
        const allGpsLatTags = editEvent.tags?.filter((tag: any) => tag[0] === 'gps_lat')?.map((tag: any) => tag[1]) || [];
        const allGpsLonTags = editEvent.tags?.filter((tag: any) => tag[0] === 'gps_lon')?.map((tag: any) => tag[1]) || [];
        const allGpsAltTags = editEvent.tags?.filter((tag: any) => tag[0] === 'gps_alt')?.map((tag: any) => tag[1]) || [];
        const allGpsPrecisionTags = editEvent.tags?.filter((tag: any) => tag[0] === 'gps_precision')?.map((tag: any) => tag[1]) || [];
        const allGpsSourceTags = editEvent.tags?.filter((tag: any) => tag[0] === 'gps_source')?.map((tag: any) => tag[1]) || [];

        // Assign GPS data to images by index
        allGpsLatTags.forEach((lat, index) => {
          if (index < imageTags.length) {
            setImageGpsData(prev => ({
              ...prev,
              [index]: {
                latitude: parseFloat(lat),
                longitude: parseFloat(allGpsLonTags[index]),
                altitude: allGpsAltTags[index] ? parseFloat(allGpsAltTags[index]) : undefined,
                precision: allGpsPrecisionTags[index] || 'medium'
              }
            }));
            setImageGpsStatuses(prev => ({
              ...prev,
              [index]: (allGpsSourceTags[index] as GpsStatus) || 'detected'
            }));
          }
        });
        console.log('[Note Edit] GPS data loaded from tags for', imageTags.length, 'images');
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



  const handleImageSelect = async (files: FileList | null) => {
    if (!files) return;

    // Filter for image files only
    const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
    const newImageFiles: File[] = [];
    const newImageUrls: string[] = [];

    // Process each image file for EXIF correction
    for (const file of imageFiles) {
      let correctedPreviewUrl: string | undefined;
      let exifWidth: number | undefined;
      let exifHeight: number | undefined;
      let exifOrientation: number | undefined;

      try {
        // EXIF-Daten lesen (wie in TripPublishForm.tsx)
        // Orientation separat lesen (funktioniert auch wenn parse fehlschlägt)
        try {
          exifOrientation = await exifr.orientation(file);
          console.log(`[Note EXIF] ${file.name}: Orientation (via exifr.orientation) = ${exifOrientation || 'not found'}`);
        } catch (orientErr) {
          console.warn(`[Note EXIF] ${file.name}: Could not read orientation:`, orientErr);
        }

        // Bildabmessungen lesen
        try {
          const dimExif = await exifr.parse(file, { exif: true, pickTags: ['ImageWidth', 'ImageHeight', 'ExifImageWidth', 'ExifImageHeight'] });
          exifWidth = dimExif?.ImageWidth || dimExif?.ExifImageWidth;
          exifHeight = dimExif?.ImageHeight || dimExif?.ExifImageHeight;
          if (exifWidth && exifHeight) {
            console.log(`[Note EXIF] ${file.name}: EXIF dimensions ${exifWidth}x${exifHeight}`);
          }
        } catch (dimErr) {
          console.warn(`[Note EXIF] ${file.name}: Could not read dimensions:`, dimErr);
        }

        // Korrigierte Preview erstellen (immer, wie in TripPublishForm.tsx)
        correctedPreviewUrl = await createCorrectedPreview(file, exifWidth, exifHeight, exifOrientation);
      } catch (exifError) {
        console.warn(`[Note EXIF] Failed to read EXIF from ${file.name}:`, exifError);
        // Fallback: Original file als Preview
        correctedPreviewUrl = URL.createObjectURL(file);
      }

      newImageFiles.push(file);
      if (correctedPreviewUrl) {
        newImageUrls.push(correctedPreviewUrl);
      }
    }

    setImageFiles(prev => [...prev, ...newImageFiles]);
    setImageUrls(prev => [...prev, ...newImageUrls]);

    // Extract GPS from each image immediately upon selection
    const startIndex = imageUrls.length;
    for (let i = 0; i < newImageFiles.length; i++) {
      const file = newImageFiles[i];
      const index = startIndex + i;

      try {
        const gpsData = await extractGpsFromImage(file);
        if (gpsData) {
          setImageGpsData(prev => ({ ...prev, [index]: gpsData }));
          setImageGpsStatuses(prev => ({ ...prev, [index]: 'detected' }));
          console.log(`[Note GPS] Extracted from ${file.name} (image ${index}):`, gpsData);
        } else {
          setImageGpsStatuses(prev => ({ ...prev, [index]: 'not_found' }));
        }
      } catch (error) {
        console.error(`[Note GPS] Failed to extract from ${file.name}:`, error);
        setImageGpsStatuses(prev => ({ ...prev, [index]: 'error' }));
      }
    }
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

    setIsUploadingImages(true);
    setUploadProgress({ current: 0, total: imageFiles.length, status: 'Upload läuft...' });

    try {
      const uploadedUrls: string[] = [];

      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        const [urlTag] = await uploadFile(file);
        uploadedUrls.push(urlTag[1]); // URL is in second position

        // Update progress
        setUploadProgress({ current: i + 1, total: imageFiles.length, status: 'Upload läuft...' });
      }

      // Ersetze die korrigierten Previews durch die hochgeladenen URLs
      setImageUrls(prev => {
        // Entferne die Preview-URLs für die hochgeladenen Bilder und füge die Upload-URLs hinzu
        const existingUrls = prev.slice(0, prev.length - imageFiles.length);
        return [...existingUrls, ...uploadedUrls];
      });

      setImageFiles([]);
      setIsUploadingImages(false);
      setUploadProgress({ current: imageFiles.length, total: imageFiles.length, status: '' });

      toast({
        title: 'Erfolg!',
        description: `${uploadedUrls.length} Bild(er) erfolgreich hochgeladen.`,
      });
    } catch (error) {
      setIsUploadingImages(false);
      setUploadProgress({ current: 0, total: 0, status: 'Upload fehlgeschlagen' });
      toast({
        title: 'Fehler',
        description: 'Bild-Upload fehlgeschlagen. Bitte versuche es erneut.',
        variant: 'destructive'
      });
    }
  };

  const removeImageUrl = (index: number) => {
    setImageUrls(prev => prev.filter((_, i) => i !== index));
    // Also remove GPS data for this image
    setImageGpsData(prev => {
      const { [index]: _, ...rest } = prev;
      return rest;
    });
    setImageGpsStatuses(prev => {
      const { [index]: _, ...rest } = prev;
      return rest;
    });
  };

  // GPS editing functions for Note Form
  const openGpsEditor = (imageIndex: number) => {
    setEditingGpsImage(imageIndex);
  };

  const closeGpsEditor = () => {
    setEditingGpsImage(null);
    setShowMapPicker(false);
  };

  const saveGps = async (imageIndex: number, gps: GpsData) => {
    // Save GPS data
    setImageGpsData(prev => ({
      ...prev,
      [imageIndex]: gps
    }));
    setImageGpsStatuses(prev => ({
      ...prev,
      [imageIndex]: 'manual'
    }));

    // Auto-fill location and country using reverse geocoding
    try {
      console.log('[Note GPS Manual] Reverse geocoding for manual GPS...', gps);
      const locationData = await reverseGeocode(gps.latitude, gps.longitude);
      if (locationData) {
        // Set location to city + neighbourhood/suburb (no postcode)
        const locationParts = [
          locationData.city,
          locationData.neighbourhood,
          locationData.suburb
        ].filter(Boolean);
        const loc = locationParts.join(', ');
        setLocation(loc);
        console.log('[Note GPS Manual] Location found:', loc);

        // Auto-fill country if detected
        const country = mapCountryCode(locationData);
        if (country) {
          setSelectedCountry(country);
          console.log('[Note GPS Manual] Country auto-filled:', country);
        }
      }
    } catch (error) {
      console.error('[Note GPS Manual] Reverse geocoding failed:', error);
    }

    closeGpsEditor();
  };

  const removeGps = (imageIndex: number) => {
    setImageGpsData(prev => {
      const { [imageIndex]: _, ...rest } = prev;
      return rest;
    });
    setImageGpsStatuses(prev => ({
      ...prev,
      [imageIndex]: 'not_found'
    }));
    closeGpsEditor();
  };

  // Auto-fill location and country from GPS data (first image)
  useEffect(() => {
      const autoFillLocation = async () => {
        // Use GPS from first image if available
        const firstGpsData = Object.values(imageGpsData)[0];

        if (firstGpsData) {
          console.log('[Note GPS] GPS detected, reverse geocoding...');
          const locationData = await reverseGeocode(firstGpsData.latitude, firstGpsData.longitude);
          if (locationData) {
            // Set location to city + neighbourhood/suburb (no postcode)
            const locationParts = [
              locationData.city,
              locationData.neighbourhood,
              locationData.suburb
            ].filter(Boolean);
            const loc = locationParts.join(', ');
            setLocation(loc);
            console.log('[Note GPS] Location found:', loc);

            // Auto-fill country if detected
            const country = mapCountryCode(locationData);
            if (country && !selectedCountry) {
              setSelectedCountry(country);
              console.log('[Note GPS] Country auto-filled:', country);
            }
          }
        }
      };

      autoFillLocation();
    }, [imageGpsData]);

  const handleSubmit = () => {
    if (!content.trim()) {
      toast({
        title: 'Fehler',
        description: 'Bitte gib einen Text ein.',
        variant: 'destructive'
      });
      return;
    }

    // Warn if there are unsaved images
    if (imageFiles.length > 0) {
      toast({
        title: 'Achtung',
        description: 'Bitte lade die ausgewählten Bilder zuerst hoch.',
        variant: 'destructive'
      });
      return;
    }

    setIsPublishing(true);
    setPublishProgress({ stage: 'publish', status: 'Event wird zu Nostr gesendet...' });

    // Entferne Country-Tags aus tags, um Duplikate zu vermeiden
    const countryList = ['portugal', 'spanien', 'frankreich', 'belgien', 'deutschland', 'luxemburg'];
    const tagsWithoutCountry = tags.filter(tag =>
      !countryList.includes(tag.toLowerCase()) && !tag.startsWith('#') && !countryList.includes(tag.replace('#', '').toLowerCase())
    );

    // Create event tags with country tags and #mojobus
    const baseTags = createRequiredTags('notes', tagsWithoutCountry);
    const additionalTags = [
      ['type', 'note'],      // Explicit type marker
      ['t', 'mojobus'],     // #mojobus tag
      ['t', 'note'],        // Standard tag #note
      ['t', 'notiz']        // Standard tag #notiz
    ];

    // Add location tag if set
    if (location.trim()) {
      additionalTags.push(['location', location.trim()]);
    }

    // Add country tags (nur wenn selectedCountry gewählt wurde)
    if (selectedCountry) {
      const countryTags = getCountryTag(selectedCountry);
      countryTags.forEach(tag => additionalTags.push(['t', tag]));
    }

    // Add image tags if images exist
    imageUrls.forEach((url, index) => {
      additionalTags.push(['image', url]);

      // Add GPS tags if available for this image
      const gpsData = imageGpsData[index];
      const gpsStatus = imageGpsStatuses[index];
      if (gpsData && gpsStatus) {
        additionalTags.push(['gps_lat', gpsData.latitude.toString()], ['gps_lon', gpsData.longitude.toString()]);
        if (gpsData.altitude) {
          additionalTags.push(['gps_alt', gpsData.altitude.toString()]);
        }
        additionalTags.push(['gps_precision', gpsData.precision]);
        additionalTags.push(['gps_source', gpsStatus]);
      }
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
    }, {
      onSuccess: () => {
        setIsPublishing(false);
        setPublishProgress({ stage: 'success', status: 'Erfolgreich veröffentlicht!' });

        toast({
          title: 'Erfolg!',
          description: 'Note erfolgreich veroeffentlicht.'
        });

        // Reset form and redirect
        setContent('');
        setTags([]);
        setLocation('');
        setSelectedCountry('');
        setImageFiles([]);
        setImageUrls([]);
        setImageGpsData({});
        setImageGpsStatuses({});
        setPublishProgress({ stage: '', status: '' });

        // Redirect to notes page after successful publish
        setTimeout(() => {
          navigate('/notes');
        }, 1000);
      },
      onError: (error) => {
        setIsPublishing(false);
        setPublishProgress({ stage: 'error', status: 'Veröffentlichung fehlgeschlagen' });

        toast({
          title: 'Fehler',
          description: 'Veröffentlichung fehlgeschlagen. Bitte versuche es erneut.',
          variant: 'destructive'
        });
      }
    });
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
        <ImageOptimizationToggle className="mt-4" />
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

        {/* KI-Notiz generieren (Optional) */}
        <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-5 w-5 text-ocean-500" />
            <h3 className="font-semibold">KI-Notiz generieren (Optional)</h3>
          </div>
          
          <div className="space-y-2">
            <Label>Lifestyle</Label>
            <Select value={lifestyle} onValueChange={(value: any) => setLifestyle(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Wähle deinen Lifestyle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vanlife">🚐 Vanlife - Van-Life auf Rädern</SelectItem>
                <SelectItem value="rvlife">🚗 RVlife - Recreational Vehicle</SelectItem>
                <SelectItem value="beachlife">🏖️ Beachlife - Strand & Surf Lifestyle</SelectItem>
                <SelectItem value="wohnmobil">🏠 Wohnmobil - Wohnmobil/Camper</SelectItem>
                <SelectItem value="perpetual-travelers">🌍 Perpetual Travelers - Permanent Reisende</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Foster Huntington Stil - ehrlich, direkt, authentisch
            </p>
          </div>
          
          <Button
            type="button"
            variant="outline"
            onClick={generateNoteWithAI}
            disabled={isGeneratingNote || imageFiles.length === 0}
            className="w-full"
          >
            {isGeneratingNote ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generiere Notiz...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                KI-Notiz generieren ({lifestyle})
              </>
            )}
          </Button>
          {imageFiles.length === 0 && (
            <p className="text-xs text-muted-foreground">
              💡 Lade zuerst Bilder hoch, um die KI-Generierung zu nutzen.
            </p>
          )}
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
                  disabled={imageFiles.length === 0 || isUploadingImages}
                >
                  {isUploadingImages ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Upload...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Hochladen
                    </>
                  )}
                </Button>
              </div>

              {/* Upload Progress */}
              {isUploadingImages && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm text-ocean-600 dark:text-ocean-400">
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      {uploadProgress.status}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {uploadProgress.current} von {uploadProgress.total}
                    </Badge>
                  </div>
                  <Progress
                    value={(uploadProgress.current / uploadProgress.total) * 100}
                    className="h-2"
                  />
                </div>
              )}
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
                  onClick={() => {
                    setImageUrls([]);
                    setImageGpsData({});
                    setImageGpsStatuses({});
                  }}
                  variant="outline"
                  size="sm"
                >
                  Alle entfernen
                </Button>
              </div>
               <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                 {imageUrls.map((url, index) => {
                   const gpsData = imageGpsData[index];
                   const gpsStatus = imageGpsStatuses[index];
                   return (
                     <div key={index} className="relative group border rounded-lg overflow-hidden">
                       <img
                         src={url}
                         alt={`Uploaded ${index + 1}`}
                         className="w-full h-20 object-cover"
                       />

                        {/* GPS Display */}
                        {gpsData && gpsStatus && gpsData.latitude && gpsData.longitude && editingGpsImage !== index && (
                          <div className="space-y-2 cursor-pointer" onClick={() => openGpsEditor(index)}>
                            <GpsStatusIndicator status={gpsStatus} gps={gpsData} />
                            <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                              <div className="flex items-center gap-1.5 text-[10px] text-gray-700 dark:text-gray-300">
                                <MapPin className="h-2.5 w-2.5 text-green-600 dark:text-green-400" />
                                <span className="truncate font-mono">
                                  {formatCoordinatesSimple(gpsData.latitude, gpsData.longitude)}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                       {/* Add GPS Button */}
                       {!gpsData && editingGpsImage !== index && (
                         <Button
                           size="sm"
                           variant="outline"
                           className="absolute bottom-1 right-1 text-xs h-6 px-2 opacity-0 group-hover:opacity-100 transition-opacity"
                           onClick={() => openGpsEditor(index)}
                         >
                           <MapPin className="h-2.5 w-2.5 mr-1" />
                           GPS+
                         </Button>
                       )}

                        {/* GPS Editor */}
                        {editingGpsImage === index && (
                          <div className="absolute bottom-0 left-0 right-0 z-10 p-2 bg-white dark:bg-gray-800 border-t">
                            {/* Toggle between Simple Editor and Map */}
                            <div className="flex gap-2 mb-2">
                              <Button
                                size="sm"
                                variant={!showMapPicker ? 'default' : 'outline'}
                                className="flex-1 h-7 text-xs"
                                onClick={() => setShowMapPicker(false)}
                              >
                                <span className="mr-1">✏️</span>
                                Einfach
                              </Button>
                              <Button
                                size="sm"
                                variant={showMapPicker ? 'default' : 'outline'}
                                className="flex-1 h-7 text-xs"
                                onClick={() => setShowMapPicker(true)}
                              >
                                <span className="mr-1">🗺️</span>
                                Karte
                              </Button>
                            </div>

                            {/* Show Map Picker */}
                            {showMapPicker ? (
                              <LocationPicker
                                gps={gpsData}
                                onSave={(gps) => saveGps(index, gps)}
                                onCancel={closeGpsEditor}
                                initialZoom={13}
                                height="300px"
                                onCountryDetected={(country) => {
                                  console.log('[NoteForm] Country detected:', country);
                                  setSelectedCountry(country);
                                }}
                                onLocationDetected={(locationText) => {
                                  console.log('[NoteForm] Location detected:', locationText);
                                  setLocation(locationText);
                                }}
                              />
                            ) : (
                              /* Show Simple Editor */
                              <GpsEditor
                                gps={gpsData || undefined}
                                onSave={(gps) => saveGps(index, gps)}
                                onCancel={closeGpsEditor}
                                onRemove={() => removeGps(index)}
                              />
                            )}
                          </div>
                        )}

                       {/* Delete Button */}
                       <Button
                         variant="destructive"
                         size="sm"
                         className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity z-20"
                         onClick={() => removeImageUrl(index)}
                       >
                         ×
                       </Button>
                     </div>
                   );
                 })}
               </div>
            </div>
          )}
        </div>

         {/* Location (auto-filled from GPS) */}
         <div className="space-y-2">
           <Label htmlFor="note-location">Standort</Label>
           <div className="space-y-2">
             <div className="flex gap-2">
               <Input
                 id="note-location"
                 value={location}
                 onChange={(e) => setLocation(e.target.value)}
                 placeholder="Wo wurde diese Note erstellt? (z.B. Lagos, Portugal)"
                 className="flex-1"
               />
             </div>
             {Object.values(imageGpsData).length > 0 && (
               <GpsStatusIndicator status={Object.values(imageGpsStatuses)[0] as GpsStatus} gps={Object.values(imageGpsData)[0]} />
             )}
           </div>
           {location && Object.values(imageGpsData).length > 0 && (
             <p className="text-xs text-green-600 dark:text-green-400">
               📍 Standort automatisch aus GPS-Koordinaten ermittelt
             </p>
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

          <Button onClick={handleSubmit} disabled={!content || isPublishing || isUploadingImages}>
            {isPublishing ? (
              <>
                {publishProgress.stage === 'publish' && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {publishProgress.stage === 'success' && <CheckCircle className="h-4 w-4 mr-2" />}
                {publishProgress.stage === 'error' && <span className="mr-2">⚠️</span>}
                {publishProgress.stage === 'publish' && 'Note wird veröffentlicht...'}
                {publishProgress.stage === 'success' && '✅ Erfolgreich!'}
                {publishProgress.stage === 'error' && 'Fehler aufgetreten'}
              </>
            ) : (
              <>
                <MessageSquare className="h-4 w-4 mr-2" />
                Note veroeffentlichen
              </>
            )}
          </Button>
        </div>

        {/* Publishing Progress */}
        {publishProgress.stage === 'publish' && (
          <div className="flex items-center gap-3 text-sm text-ocean-600 dark:text-ocean-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            <p>{publishProgress.status}</p>
          </div>
        )}
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
  const [imageFile, setImageFile] = useState<File | null>(null);
   const [imageGps, setImageGps] = useState<GpsData | null>(null);
   const [imageGpsStatus, setImageGpsStatus] = useState<GpsStatus>('not_found');
   const [editingImageGps, setEditingImageGps] = useState(false);
   const [showMapPicker, setShowMapPicker] = useState(false);
   const [additionalImages, setAdditionalImages] = useState<string[]>([]);
   const [additionalImagesUrlInput, setAdditionalImagesUrlInput] = useState('');
   const [manualTags, setManualTags] = useState<string[]>([]);
   const [selectedCountry, setSelectedCountry] = useState<string>('');
   const [isUploading, setIsUploading] = useState(false);
   const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
   const [lifestyle, setLifestyle] = useState<'vanlife' | 'rvlife' | 'beachlife' | 'wohnmobil' | 'perpetual-travelers'>('vanlife');
   const { toast } = useToast();
   const { mutateAsync: publishEvent } = useNostrPublish();
   const { mutateAsync: uploadFile } = useUploadFile();
   const navigate = useNavigate();

   // KI-Platz-Beschreibung generieren (Foster Huntington Stil)
   const generatePlaceWithAI = async () => {
     if (!imageFile) {
       toast({
         title: 'Bild erforderlich',
         description: 'Bitte lade zuerst ein Titelbild hoch.',
         variant: 'destructive'
       });
       return;
     }

     setIsGeneratingDescription(true);
      try {
        const formData = new FormData();
        formData.append('images', imageFile);
        formData.append('title', name);
        formData.append('description', description);
        formData.append('location', location);
        if (coordinates.lat && coordinates.lng) {
          formData.append('gps_lat', coordinates.lat);
          formData.append('gps_lon', coordinates.lng);
        }
        formData.append('lifestyle', lifestyle);

        // Zusätzliche Kontext-Felder für bessere KI-Generierung
        formData.append('category', category || '');
        formData.append('facilities', JSON.stringify(facilities));
        formData.append('bestFor', JSON.stringify(bestFor));
        formData.append('country', selectedCountry || '');

        const response = await fetch('/api/generate-place', {
         method: 'POST',
         body: formData
       });

       const data = await response.json();
       if (data.description) {
         setDescription(data.description);
         if (data.hashtags) {
           const newTags = data.hashtags.split(' ').filter((t: string) => !manualTags.includes(t));
           setManualTags([...manualTags, ...newTags]);
         }
         toast({
           title: 'Erfolg!',
           description: `KI-Beschreibung generiert (${data.lifestyle})`
         });
       }
     } catch (error) {
       console.error(error);
       toast({
         title: 'Fehler',
         description: 'KI-Generierung fehlgeschlagen.',
         variant: 'destructive'
       });
     } finally {
       setIsGeneratingDescription(false);
     }
   };

   // Load edit data
  useEffect(() => {
    if (editEvent) {
      setName(editEvent.tags?.find((tag: any) => tag[0] === 'name')?.[1] || '');

      // Bestimme das Event-Format basierend auf dem type-Tag
      // Neue Plätze haben type=place und HTML-Content
      // Alte Plätze haben type=article und Markdown-Content
      const eventType = editEvent.tags?.find((tag: any) => tag[0] === 'type')?.[1];
      const isPlaceType = eventType === 'place';

      // Wenn es ein place-Event ist, den Content bereinigen und verwenden (HTML)
      // Wenn es ein altes article-Event ist, Markdown zu HTML konvertieren
      let contentToSet = '';
      if (isPlaceType) {
        // Content bereinigen - ALLE strukturierten Daten entfernen
        let cleanContent = editEvent.content || '';

        // Remove h1 title (wird aus name-Tag geholt)
        cleanContent = cleanContent.replace(/^<h1[^>]*>.*?<\/h1>\s*/gi, '');

        // Remove structured sections (alles was in Tags steht, nicht im Content!)
        // Bilder-Sektion
        cleanContent = cleanContent.replace(/<h2[^>]*>Bilder<\/h2>.*?(?=<h[2-6]>|<p><strong>|$)/gis, '');

        // Strukturierte Felder (Kategorie, Bewertung, Standort, etc.)
        cleanContent = cleanContent.replace(/<p><strong>Kategorie:<\/strong>.*?<\/p>/gi, '');
        cleanContent = cleanContent.replace(/<p><strong>Bewertung:<\/strong>.*?<\/p>/gi, '');
        cleanContent = cleanContent.replace(/<p><strong>Standort:<\/strong>.*?<\/p>/gi, '');
        cleanContent = cleanContent.replace(/<p><strong>Koordinaten:<\/strong>.*?<\/p>/gi, '');
        cleanContent = cleanContent.replace(/<p><strong>Einrichtungen:<\/strong>.*?<\/p>/gi, '');
        cleanContent = cleanContent.replace(/<p><strong>Geeignet für:<\/strong>.*?<\/p>/gi, '');
        cleanContent = cleanContent.replace(/<p><strong>Preis:<\/strong>.*?<\/p>/gi, '');

        // Clean up extra whitespace
        cleanContent = cleanContent.replace(/\n\s*\n\s*\n/g, '\n\n').trim();

        contentToSet = cleanContent || '';
      } else {
        // Content bereinigen
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

        // Markdown zu HTML konvertieren
        contentToSet = markdownToHtml(cleanContent || '');
      }

      setDescription(contentToSet);

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

      // Load GPS data from tags
      const gpsLat = editEvent.tags?.find((tag: any) => tag[0] === 'gps_lat')?.[1];
      const gpsLon = editEvent.tags?.find((tag: any) => tag[0] === 'gps_lon')?.[1];
      const gpsAlt = editEvent.tags?.find((tag: any) => tag[0] === 'gps_alt')?.[1];
      const gpsPrecision = editEvent.tags?.find((tag: any) => tag[0] === 'gps_precision')?.[1];
      const gpsSource = editEvent.tags?.find((tag: any) => tag[0] === 'gps_source')?.[1] as GpsStatus;

      if (gpsLat && gpsLon) {
        setImageGps({
          latitude: parseFloat(gpsLat),
          longitude: parseFloat(gpsLon),
          altitude: gpsAlt ? parseFloat(gpsAlt) : undefined,
          precision: gpsPrecision || 'medium'
        });
        setImageGpsStatus(gpsSource || 'detected');
        console.log('[Place Edit] GPS data loaded from tags:', { gpsLat, gpsLon, gpsAlt, gpsSource });
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

   // Auto-fill location and country from GPS data
   useEffect(() => {
     const autoFillLocation = async () => {
       if (imageGps) {
         console.log('[Place GPS] GPS detected, reverse geocoding...');
         const locationData = await reverseGeocode(imageGps.latitude, imageGps.longitude);
         if (locationData) {
           // Set location to city + neighbourhood/suburb (no postcode)
           const locationParts = [
             locationData.city,
             locationData.neighbourhood,
             locationData.suburb
           ].filter(Boolean);
           const loc = locationParts.join(', ');
           setLocation(loc);
           console.log('[Place GPS] Location found:', loc);

           // Also set coordinates
           setCoordinates({ lat: imageGps.latitude.toString(), lng: imageGps.longitude.toString() });

           // Auto-fill country if detected
           const country = mapCountryCode(locationData);
           if (country && !selectedCountry) {
             setSelectedCountry(country);
             console.log('[Place GPS] Country auto-filled:', country);
           }
         }
       }
     };

     autoFillLocation();
   }, [imageGps]);

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
    setIsUploading(true);
    try {
      // EXIF-Daten lesen und korrigierte Preview erstellen (wie in TripPublishForm.tsx)
      let correctedPreviewUrl: string | undefined;
      let exifWidth: number | undefined;
      let exifHeight: number | undefined;
      let exifOrientation: number | undefined;

      try {
        // EXIF-Daten lesen (wie in TripPublishForm.tsx)
        // Orientation separat lesen (funktioniert auch wenn parse fehlschlägt)
        try {
          exifOrientation = await exifr.orientation(file);
          console.log(`[Place EXIF] ${file.name}: Orientation (via exifr.orientation) = ${exifOrientation || 'not found'}`);
        } catch (orientErr) {
          console.warn(`[Place EXIF] ${file.name}: Could not read orientation:`, orientErr);
        }

        // Bildabmessungen lesen
        try {
          const dimExif = await exifr.parse(file, { exif: true, pickTags: ['ImageWidth', 'ImageHeight', 'ExifImageWidth', 'ExifImageHeight'] });
          exifWidth = dimExif?.ImageWidth || dimExif?.ExifImageWidth;
          exifHeight = dimExif?.ImageHeight || dimExif?.ExifImageHeight;
          if (exifWidth && exifHeight) {
            console.log(`[Place EXIF] ${file.name}: EXIF dimensions ${exifWidth}x${exifHeight}`);
          }
        } catch (dimErr) {
          console.warn(`[Place EXIF] ${file.name}: Could not read dimensions:`, dimErr);
        }

        // Korrigierte Preview erstellen (immer, wie in TripPublishForm.tsx)
        correctedPreviewUrl = await createCorrectedPreview(file, exifWidth, exifHeight, exifOrientation);
      } catch (exifError) {
        console.warn(`[Place EXIF] Failed to read EXIF from ${file.name}:`, exifError);
        // Fallback: Original file als Preview
        correctedPreviewUrl = URL.createObjectURL(file);
      }

      // Setze die korrigierte Preview als Anzeige-URL
      if (correctedPreviewUrl) {
        setImage(correctedPreviewUrl);
      }

      // Speichere das File für KI-Generierung
      setImageFile(file);

      // Upload des Original-File (für Speicherung)
      const [urlTag] = await uploadFile(file);
      // Speichere die Upload-URL für spätere Verwendung (aber zeige die korrigierte Preview)

      // Extract GPS from title image
      try {
        const gpsData = await extractGpsFromImage(file);
        if (gpsData) {
          setImageGps(gpsData);
          setImageGpsStatus('detected');
          console.log(`[Place GPS] Extracted from ${file.name}:`, gpsData);
        } else {
          setImageGps(null);
          setImageGpsStatus('not_found');
        }
      } catch (error) {
        console.error(`[Place GPS] Failed to extract from ${file.name}:`, error);
        setImageGpsStatus('error');
      }

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

  const closeGpsEditor = () => {
    setEditingImageGps(false);
    setShowMapPicker(false);
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
    // WICHTIG: Strukturierte Daten werden NUR als Tags gespeichert, nicht im Content!
    // - Content: Nur Titel und Beschreibung
    // - Tags: Alle strukturierten Daten
    let content = `# ${name.trim()}\n\n`;

    // Konvertiere HTML zu Markdown für Nostr und füge BESCHREIBUNG hinzu
    // Bereinige die Beschreibung, falls sie strukturierte Daten enthält
    if (description.trim()) {
      const cleanDescription = description.trim()
        .replace(/<p><strong>Kategorie:<\/strong>.*?<\/p>/gis, '')
        .replace(/<p><strong>Bewertung:<\/strong>.*?<\/p>/gis, '')
        .replace(/<p><strong>Standort:<\/strong>.*?<\/p>/gis, '')
        .replace(/<p><strong>Koordinaten:<\/strong>.*?<\/p>/gis, '')
        .replace(/<p><strong>Einrichtungen:<\/strong>.*?<\/p>/gis, '')
        .replace(/<p><strong>Geeignet für:<\/strong>.*?<\/p>/gis, '')
        .replace(/<p><strong>Preis:<\/strong>.*?<\/p>/gis, '')
        .replace(/<h2[^>]*>Bilder<\/h2>.*?(?=<h[2-6]>|<p><strong>|$)/gis, '');

      const descriptionMarkdown = htmlToMarkdown(cleanDescription).trim();
      if (descriptionMarkdown) {
        content += `${descriptionMarkdown}\n\n`;
      }
    }

    // Add additional images if present (title image handled separately)
    if (additionalImages.length > 0) {
      content += `## Bilder\n\n`;
      additionalImages.forEach((img, index) => {
        content += `![${index + 1}](${img})\n\n`;
      });
    }

    // WICHTIG: Strukturierte Daten werden NUR als Tags gespeichert, nicht im Content!
    // Das verhindert Duplikate beim Bearbeiten.

    // Entferne Country-Tags aus manualTags, um Duplikate zu vermeiden
    const countryList = ['portugal', 'spanien', 'frankreich', 'belgien', 'deutschland', 'luxemburg'];
    const manualTagsWithoutCountry = manualTags.filter(tag =>
      !countryList.includes(tag.toLowerCase()) && !tag.startsWith('#') && !countryList.includes(tag.replace('#', '').toLowerCase())
    );

    // Erstelle summary für Vorschau auf Startseite
    let placeSummary = '';
    if (description.trim()) {
      // Verwende die Beschreibung als summary, gekürzt auf 200 Zeichen
      placeSummary = description.trim().length > 200
        ? description.trim().substring(0, 197) + '...'
        : description.trim();
    } else if (location.trim()) {
      // Fallback: Verwende Standort als summary
      placeSummary = `Ort in ${location.trim()}`;
    } else {
      // Fallback: Kurze Beschreibung basierend auf Kategorie
      placeSummary = `Ein ${category} für Vanlife-Abenteurer`;
    }

    // Create tags from config
    const baseTags = createRequiredTags('places', manualTagsWithoutCountry);

    // Get original d-tag for edit, or create new one
    const originalDTag = editEvent?.tags?.find((tag: any) => tag[0] === 'd')?.[1];
    const dTag = originalDTag || `place-${Date.now()}`;

    const additionalTags = [
      ['d', dTag], // Use existing d-tag for edit, create new for new places
      ['t', 'place'], // Content type tag for filtering
      ['type', 'place'], // Explicit type marker
      ['title', name.trim()], // Place name (important for display)
      ['name', name.trim()], // Place name (important for display)
      ['summary', placeSummary], // Summary for preview on homepage
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

    // Handle GPS coordinates - priority: manual coordinates > image GPS
    if (coordinates.lat && coordinates.lng) {
      // Manual coordinates entered
      tags.push(['lat', coordinates.lat]);
      tags.push(['lng', coordinates.lng]);

      // Also add as GPS tags for map display
      const lat = parseFloat(coordinates.lat);
      const lng = parseFloat(coordinates.lng);
      if (!isNaN(lat) && !isNaN(lng)) {
        tags.push(['gps_lat', lat.toString()]);
        tags.push(['gps_lon', lng.toString()]);
        tags.push(['gps_source', 'manual']);
        tags.push(['gps_precision', 'manual']);
        console.log('[Place] Manual GPS saved:', { lat, lng });
      }
    } else if (imageGps) {
      // Use GPS from title image
      tags.push(['gps_lat', imageGps.latitude.toString()]);
      tags.push(['gps_lon', imageGps.longitude.toString()]);
      if (imageGps.altitude) {
        tags.push(['gps_alt', imageGps.altitude.toString()]);
      }
      tags.push(['gps_precision', imageGps.precision]);
      tags.push(['gps_source', imageGpsStatus]);
      console.log('[Place] Image GPS saved:', imageGps);
    }

    if (price.trim()) tags.push(['price', price.trim()]);
    if (image) tags.push(['image', image]);
    additionalImages.forEach((img, index) => {
      tags.push(['image', img]);
    });

    // Add country tags (nur wenn selectedCountry gewählt wurde)
    if (selectedCountry) {
      const countryTags = getCountryTag(selectedCountry);
      countryTags.forEach(tag => tags.push(['t', tag]));
    }

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
    setImageFile(null);
    setImageGps(null);
    setImageGpsStatus('not_found');
    setEditingImageGps(false);

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
        {/* Title Image - Move to top */}
         <div className="space-y-2">
          <Label htmlFor="article-image">Titelbild</Label>
          <div className="flex gap-2">
            {image ? (
              <div className="flex-1">
                <div className="relative group border rounded-lg p-3">
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
                  
                  {/* GPS Info Display */}
                  {imageGps && imageGps.latitude && imageGps.longitude ? (
                    <div className="mt-3 space-y-2">
                      <GpsStatusIndicator status={imageGpsStatus} gps={imageGps} />
                      <div className="text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded p-2">
                         <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                           <MapPin className="h-3 w-3 text-green-600 dark:text-green-400" />
                           <span className="truncate font-mono">
                             {formatCoordinatesSimple(imageGps.latitude, imageGps.longitude)}
                           </span>
                         </div>
                      </div>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full text-xs h-8 mt-3"
                      onClick={() => setEditingImageGps(true)}
                    >
                      <MapPin className="h-3 w-3 mr-1" />
                      GPS hinzufügen
                    </Button>
                  )}

                  {/* GPS Editor */}
                  {editingImageGps && (
                    <div className="space-y-2">
                      {/* Toggle between Simple Editor and Map */}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={!showMapPicker ? 'default' : 'outline'}
                          className="flex-1 h-7 text-xs"
                          onClick={() => setShowMapPicker(false)}
                        >
                          <span className="mr-1">✏️</span>
                          Einfach
                        </Button>
                        <Button
                          size="sm"
                          variant={showMapPicker ? 'default' : 'outline'}
                          className="flex-1 h-7 text-xs"
                          onClick={() => setShowMapPicker(true)}
                        >
                          <span className="mr-1">🗺️</span>
                          Karte
                        </Button>
                      </div>

                      {/* Show Map Picker */}
                      {showMapPicker ? (
                        <LocationPicker
                          gps={imageGps || undefined}
                          onSave={(gps) => {
                            setImageGps(gps);
                            setImageGpsStatus('manual');
                            setEditingImageGps(false);
                          }}
                          onCancel={() => setEditingImageGps(false)}
                          initialZoom={13}
                          height="300px"
                          onCountryDetected={(country) => {
                            console.log('[ArticleForm] Country detected:', country);
                            setSelectedCountry(country);
                          }}
                          onLocationDetected={(locationText) => {
                            console.log('[ArticleForm] Location detected:', locationText);
                            setLocation(locationText);
                          }}
                        />
                      ) : (
                        /* Show Simple Editor */
                        <GpsEditor
                          gps={imageGps || undefined}
                          onSave={(gps) => {
                            setImageGps(gps);
                            setImageGpsStatus('manual');
                            setEditingImageGps(false);
                          }}
                          onCancel={() => setEditingImageGps(false)}
                          onRemove={() => {
                            setImageGps(null);
                            setImageGpsStatus('not_found');
                            setEditingImageGps(false);
                          }}
                        />
                      )}
                    </div>
                  )}

                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => {
                      setImage('');
                      setImageFile(null);
                      setImageGps(null);
                      setImageGpsStatus('not_found');
                    }}
                    disabled={isUploading}
                  >
                    Entfernen
                  </Button>
                </div>
              </div>
            ) : (
              <div className="relative">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageFile(file);
                    }}
                    className="mb-2 disabled:opacity-50"
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
                  <p className="text-xs text-muted-foreground">
                    oder
                  </p>
                  <Input
                    placeholder="https://... (Bild-URL)"
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    className="mt-2 disabled:opacity-50"
                    disabled={isUploading}
                  />
                </div>
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
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            WYSIWYG Editor - Beschreibe den Ort mit Formatierung, Bildern und Links
          </div>
          <MilkdownEditor
            content={description}
            onChange={setDescription}
            placeholder={`# Erlebnis-Bericht

Beschreibe hier den Ort, was macht ihn besonders...

- Verwende die Toolbar für Formatierung
- Fett oder kursiv

## Was erwartet dich

### Highlights
- Der Ort bietet einen tollen Blick auf das Meer
- Perfekt für Vanlife mit Solarstrom
- Ruah und Natur

### Tipps und Tricks
- Beste Zeit für einen Besuch: Frühling/Herbst
- Versorgungsmöglichkeiten in der Nähe

### Bilder und Videos
- Füge Bilder über das Bild-Icon ein
- Oder lade Bilder direkt in den Editor

### Noch mehr...
`}
            minHeight="300px"
            maxLength={30000}
            onImageUpload={(url) => {
              // Optional: Füge hochgeladene Bilder zu einer Liste hinzu
            }}
          />
        </div>

        {/* KI-Beschreibung generieren (Optional) */}
        <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-5 w-5 text-ocean-500" />
            <h3 className="font-semibold">KI-Beschreibung generieren (Optional)</h3>
          </div>
          
          <div className="space-y-2">
            <Label>Lifestyle</Label>
            <Select value={lifestyle} onValueChange={(value: any) => setLifestyle(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Wähle deinen Lifestyle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vanlife">🚐 Vanlife - Van-Life auf Rädern</SelectItem>
                <SelectItem value="rvlife">🚗 RVlife - Recreational Vehicle</SelectItem>
                <SelectItem value="beachlife">🏖️ Beachlife - Strand & Surf Lifestyle</SelectItem>
                <SelectItem value="wohnmobil">🏠 Wohnmobil - Wohnmobil/Camper</SelectItem>
                <SelectItem value="perpetual-travelers">🌍 Perpetual Travelers - Permanent Reisende</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Foster Huntington Stil - ehrlich, direkt, authentisch
            </p>
          </div>
          
          <Button
            type="button"
            variant="outline"
            onClick={generatePlaceWithAI}
            disabled={isGeneratingDescription || !imageFile}
            className="w-full"
          >
            {isGeneratingDescription ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generiere Beschreibung...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                KI-Beschreibung generieren ({lifestyle})
              </>
            )}
          </Button>
          {!imageFile && (
            <p className="text-xs text-muted-foreground">
              💡 Lade zuerst ein Titelbild hoch, um die KI-Generierung zu nutzen.
            </p>
          )}
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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageGps, setImageGps] = useState<GpsData | null>(null);
  const [imageGpsStatus, setImageGpsStatus] = useState<GpsStatus>('not_found');
  const [editingImageGps, setEditingImageGps] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [location, setLocation] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [publishedAt, setPublishedAt] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isGeneratingArticle, setIsGeneratingArticle] = useState(false);
  const [lifestyle, setLifestyle] = useState<'vanlife' | 'rvlife' | 'beachlife' | 'wohnmobil' | 'perpetual-travelers'>('vanlife');
  const [selectedModel, setSelectedModel] = useState<'llama4' | 'gpt4'>('llama4');
  const [articleLength, setArticleLength] = useState<'short' | 'medium' | 'long'>('medium');
  const { toast } = useToast();
  const { mutateAsync: publishEvent } = useNostrPublish();
  const { mutateAsync: uploadFile } = useUploadFile();
  const navigate = useNavigate();

  // KI-Artikel generieren (Foster Huntington Stil)
  const generateArticleWithAI = async () => {
    if (!imageFile) {
      toast({
        title: 'Bild erforderlich',
        description: 'Bitte lade zuerst ein Titelbild hoch.',
        variant: 'destructive'
      });
      return;
    }

    setIsGeneratingArticle(true);
    try {
      const formData = new FormData();
      formData.append('images', imageFile);
      formData.append('title', title);
      formData.append('description', summary);
      formData.append('location', location);
      formData.append('text', content);
      formData.append('lifestyle', lifestyle);
      formData.append('model', selectedModel);

      // Zusätzliche Kontext-Felder
      formData.append('category', category || '');
      formData.append('tags', JSON.stringify(tags));
      formData.append('country', selectedCountry || '');
      formData.append('articleLength', articleLength);

      const response = await fetch('/api/generate-article', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      if (data.article) {
        setContent(data.article);
        if (data.hashtags) {
          const newTags = data.hashtags.split(' ').filter((t: string) => !tags.includes(t));
          setTags([...tags, ...newTags]);
        }
        toast({
          title: 'Erfolg!',
          description: `KI-Artikel generiert (${data.lifestyle})`
        });
      }
    } catch (error) {
      console.error(error);
      toast({
        title: 'Fehler',
        description: 'KI-Generierung fehlgeschlagen.',
        variant: 'destructive'
      });
    } finally {
      setIsGeneratingArticle(false);
    }
  };

  // Load edit data
  useEffect(() => {
    if (editEvent) {
      // Bei bearbeiteten Beiträgen: Daten aus dem Event laden
      setTitle(editEvent.tags?.find((tag: any) => tag[0] === 'title')?.[1] || '');
      setSummary(editEvent.tags?.find((tag: any) => tag[0] === 'summary')?.[1] || '');

      // Content ist bereits Markdown (vom MilkdownEditor)
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

      // Load GPS data from tags
      const gpsLat = editEvent.tags?.find((tag: any) => tag[0] === 'gps_lat')?.[1];
      const gpsLon = editEvent.tags?.find((tag: any) => tag[0] === 'gps_lon')?.[1];
      const gpsAlt = editEvent.tags?.find((tag: any) => tag[0] === 'gps_alt')?.[1];
      const gpsPrecision = editEvent.tags?.find((tag: any) => tag[0] === 'gps_precision')?.[1];
      const gpsSource = editEvent.tags?.find((tag: any) => tag[0] === 'gps_source')?.[1] as GpsStatus;

      if (gpsLat && gpsLon) {
        setImageGps({
          latitude: parseFloat(gpsLat),
          longitude: parseFloat(gpsLon),
          altitude: gpsAlt ? parseFloat(gpsAlt) : undefined,
          precision: gpsPrecision || 'medium'
        });
        setImageGpsStatus(gpsSource || 'detected');
        console.log('[Article Edit] GPS data loaded from tags:', { gpsLat, gpsLon, gpsAlt, gpsSource });
      }
    } else {
      // Bei neuen Beiträgen: aktuelles Datum setzen
      setPublishedAt(new Date().toISOString().split('T')[0]);
    }
  }, [editEvent]);

  // GPS Handler for Article Form (Title Image Only)
  const handleArticleImageUpload = async (file: File) => {
    setImageFile(file);
    setIsUploading(true);

    try {
      // EXIF-Daten lesen und korrigierte Preview erstellen (wie in TripPublishForm.tsx)
      let correctedPreviewUrl: string | undefined;
      let exifWidth: number | undefined;
      let exifHeight: number | undefined;
      let exifOrientation: number | undefined;

      try {
        // EXIF-Daten lesen (wie in TripPublishForm.tsx)
        // Orientation separat lesen (funktioniert auch wenn parse fehlschlägt)
        try {
          exifOrientation = await exifr.orientation(file);
          console.log(`[Article EXIF] ${file.name}: Orientation (via exifr.orientation) = ${exifOrientation || 'not found'}`);
        } catch (orientErr) {
          console.warn(`[Article EXIF] ${file.name}: Could not read orientation:`, orientErr);
        }

        // Bildabmessungen lesen
        try {
          const dimExif = await exifr.parse(file, { exif: true, pickTags: ['ImageWidth', 'ImageHeight', 'ExifImageWidth', 'ExifImageHeight'] });
          exifWidth = dimExif?.ImageWidth || dimExif?.ExifImageWidth;
          exifHeight = dimExif?.ImageHeight || dimExif?.ExifImageHeight;
          if (exifWidth && exifHeight) {
            console.log(`[Article EXIF] ${file.name}: EXIF dimensions ${exifWidth}x${exifHeight}`);
          }
        } catch (dimErr) {
          console.warn(`[Article EXIF] ${file.name}: Could not read dimensions:`, dimErr);
        }

        // Korrigierte Preview erstellen (immer, wie in TripPublishForm.tsx)
        correctedPreviewUrl = await createCorrectedPreview(file, exifWidth, exifHeight, exifOrientation);
      } catch (exifError) {
        console.warn(`[Article EXIF] Failed to read EXIF from ${file.name}:`, exifError);
        // Fallback: Original file als Preview
        correctedPreviewUrl = URL.createObjectURL(file);
      }

      // Setze die korrigierte Preview als Anzeige-URL
      if (correctedPreviewUrl) {
        setImage(correctedPreviewUrl);
      }

      // Upload des Original-Files (für Speicherung)
      const [urlTag] = await uploadFile(file);
      // Speichere die Upload-URL für spätere Verwendung (aber zeige die korrigierte Preview)

      // Extract GPS from title image
      try {
        const gpsData = await extractGpsFromImage(file);
        if (gpsData) {
          setImageGps(gpsData);
          setImageGpsStatus('detected');
          console.log(`[Article GPS] Extracted from ${file.name}:`, gpsData);
        } else {
          setImageGps(null);
          setImageGpsStatus('not_found');
        }
      } catch (error) {
        console.error(`[Article GPS] Failed to extract from ${file.name}:`, error);
        setImageGpsStatus('error');
      }
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Upload fehlgeschlagen.',
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
    }
  };

   // Auto-fill location from GPS data
   useEffect(() => {
     const autoFillLocation = async () => {
       if (imageGps) {
         console.log('[Article GPS] GPS detected, reverse geocoding...');
         const locationData = await reverseGeocode(imageGps.latitude, imageGps.longitude);
         if (locationData) {
           // Set location to city + neighbourhood/suburb (no postcode)
           const locationParts = [
             locationData.city,
             locationData.neighbourhood,
             locationData.suburb
           ].filter(Boolean);
           const loc = locationParts.join(', ');
           setLocation(loc);
           console.log('[Article GPS] Location found:', loc);

           // Auto-fill country if detected
           const country = mapCountryCode(locationData);
           if (country && !selectedCountry) {
             setSelectedCountry(country);
             console.log('[Article GPS] Country auto-filled:', country);
           }
         }
       }
     };

     autoFillLocation();
   }, [imageGps]);

  // Get available tags from config (excluding DIY & Leon tags which are shown separately)
  const availableTags = TAG_GROUPS
    .filter(group => !['Technik', 'Pets', 'RV Life', 'Küche & Essen', 'Ausstattung', 'Freeliving', 'Länder'].includes(group.name)) // DIY, Leon & RV Life tags are shown separately
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

  // Prueft ob RV Life-Kategorie
  const isRVLifeCategory = currentCategoryConfig?.isRVLife || false;

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

    // RV Life-spezifische Tags hinzufügen
    if (isRVLifeCategory && currentCategoryConfig?.autoTags) {
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

    // Entferne Country-Tags aus displayTags, um Duplikate zu vermeiden
    const countryList = ['portugal', 'spanien', 'frankreich', 'belgien', 'deutschland', 'luxemburg'];
    const displayTagsWithoutCountry = displayTags.filter(tag =>
      !countryList.includes(tag.toLowerCase()) &&
      !tag.startsWith('#') &&
      !countryList.includes(tag.replace('#', '').toLowerCase())
    );

    // Create tags from config (mit allen Tags inkl. automatischen!)
    const baseTags = createRequiredTags('articles', displayTagsWithoutCountry);

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

    // Add location tag if set
    if (location.trim()) {
      additionalTags.push(['location', location.trim()]);
    }

    // Add category and image tags if present
    if (category) additionalTags.push(['category', category]);
    if (image) additionalTags.push(['image', image]);

    // Add country tags (nur wenn selectedCountry gewählt wurde)
    if (selectedCountry) {
      const countryTags = getCountryTag(selectedCountry);
      countryTags.forEach(tag => additionalTags.push(['t', tag]));
    }

    // Add GPS tags from title image
    if (imageGps) {
      additionalTags.push(['gps_lat', imageGps.latitude.toString()]);
      additionalTags.push(['gps_lon', imageGps.longitude.toString()]);
      if (imageGps.altitude) {
        additionalTags.push(['gps_alt', imageGps.altitude.toString()]);
      }
      additionalTags.push(['gps_precision', imageGps.precision]);
      additionalTags.push(['gps_source', imageGpsStatus]);
    }

    const finalTags = [
      ...baseTags,
      ...additionalTags
    ];

    publishEvent({
      kind: 30023, // Long-form article
      content: htmlToMarkdown(content).trim(), // Konvertiere HTML zu Markdown für Nostr
      tags: finalTags
    });

    toast({
      title: 'Erfolg!',
      description: editEvent ? 'Bericht erfolgreich aktualisiert.' : 'Bericht erfolgreich veroeffentlicht.'
    });

    // Reset form and redirect
    setTitle('');
    setSummary('');
    setContent('');
    setImage('');
    setCategory('');
    setTags([]);
    setLocation('');
    setSelectedCountry('');
    setPublishedAt(''); // Wird im useEffect neu auf aktuelles Datum gesetzt
    setImageFile(null);
    setImageGps(null);
    setImageGpsStatus('not_found');
    setEditingImageGps(false);

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
          Berichte veroeffentlichen
        </CardTitle>
        <CardDescription>
          Ausfuehrliche Geschichten, Guides und Erfahrungsberichte fuer die Vanlife-Community
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Artikellänge Auswahl - Über dem Titelbild */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Artikellänge:</span>
            <div className="flex gap-1">
              {([
                { value: 'short', label: 'Kurz', words: '200-400' },
                { value: 'medium', label: 'Mittel', words: '500-1000' },
                { value: 'long', label: 'Lang', words: '1000-2500' }
              ] as const).map((len) => (
                <button
                  key={len.value}
                  type="button"
                  onClick={() => setArticleLength(len.value)}
                  className={`h-5 px-2 text-xs rounded transition-colors ${
                    articleLength === len.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {articleLength === len.value && '✓ '}{len.label} <span className="opacity-70">({len.words})</span>
                </button>
              ))}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {articleLength === 'short' && '📖 Ein Moment. Vielleicht zwei. Wie ein Tagebucheintrag.'}
            {articleLength === 'medium' && '📖 Mehrere Momente die zusammengehören. Eine Geschichte mit Raum zum Atmen.'}
            {articleLength === 'long' && '📖 Langform. Szenen, Abschweifungen, Atmosphäre. Wie ein Kapitel aus einem Buch.'}
          </p>
        </div>

        {/* Title Image - Move to top */}
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
                        if (file) handleArticleImageUpload(file);
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

            {/* GPS Info Display */}
            {imageGps && imageGps.latitude && imageGps.longitude ? (
              <div className="space-y-2">
                <GpsStatusIndicator status={imageGpsStatus} gps={imageGps} />
                <div className="text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded p-2">
                  <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                    <MapPin className="h-3 w-3 text-green-600 dark:text-green-400" />
                    <span className="truncate font-mono">
                      {formatCoordinatesSimple(imageGps.latitude, imageGps.longitude)}
                    </span>
                  </div>
                </div>
              </div>
             ) : null}
           </div>

         {/* Location (auto-filled from GPS) */}
         <div className="space-y-2">
          <Label htmlFor="article-location">Standort</Label>
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                id="article-location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Wo wurde dieser Artikel erstellt? (z.B. Lagos, Portugal)"
                className="flex-1"
              />
            </div>
            {imageGps && (
              <GpsStatusIndicator status={imageGpsStatus} gps={imageGps} />
            )}
          </div>
          {location && imageGps && (
            <p className="text-xs text-green-600 dark:text-green-400">
              📍 Standort automatisch aus GPS-Koordinaten ermittelt
            </p>
          )}
        </div>

        {/* Country Selection */}
        <CountrySelector
          selectedCountry={selectedCountry}
          onCountryChange={setSelectedCountry}
          placeholder="Land auswaehlen"
        />

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
           <Label htmlFor="article-content">Inhalt</Label>
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            WYSIWYG Editor - Schreibe deinen Artikel mit Formatierung, Bildern und Links
          </div>
          <MilkdownEditor
            content={content}
            onChange={setContent}
            placeholder={`# Überschrift

Schreibe deinen Artikel hier...

- Verwende die Toolbar für Formatierung
- Fett oder kursiv

## Unterüberschrift

### Listen
- Listenpunkte
- Weitere Punkte

### Links und Bilder
- Füge Links über das Link-Icon ein
- Lade Bilder direkt in den Editor

### Noch mehr...
`}
            minHeight="400px"
            maxLength={50000}
            onImageUpload={(url) => {
              // Optional: Füge hochgeladene Bilder zu einer Liste hinzu
            }}
           />
         </div>

        {/* Kategorie */}
        <div className="space-y-2">
          <Label htmlFor="article-category">Kategorie</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Wähle eine Kategorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="reise">🗺️ Reise</SelectItem>
              <SelectItem value="outdoor">🏕️ Outdoor</SelectItem>
              <SelectItem value="technik">🔧 Technik</SelectItem>
              <SelectItem value="lifestyle">🏠 Lifestyle</SelectItem>
              <SelectItem value="food">🍳 Food & Cooking</SelectItem>
              <SelectItem value="community">👥 Community</SelectItem>
              <SelectItem value="diy">🛠️ DIY & Ausbau</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* KI-Artikel generieren (Optional) */}
        <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-5 w-5 text-ocean-500" />
            <h3 className="font-semibold">KI-Artikel generieren (Optional)</h3>
          </div>

          {/* Lifestyle Auswahl */}
          <div className="space-y-2">
            <Label>Lifestyle</Label>
            <Select value={lifestyle} onValueChange={(value: any) => setLifestyle(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Wähle deinen Lifestyle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vanlife">🚐 Vanlife - Van-Life auf Rädern</SelectItem>
                <SelectItem value="rvlife">🚗 RVlife - Recreational Vehicle</SelectItem>
                <SelectItem value="beachlife">🏖️ Beachlife - Strand & Surf Lifestyle</SelectItem>
                <SelectItem value="wohnmobil">🏠 Wohnmobil - Wohnmobil/Camper</SelectItem>
                <SelectItem value="perpetual-travelers">🌍 Perpetual Travelers - Permanent Reisende</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Foster Huntington Stil - ehrlich, direkt, authentisch
            </p>
          </div>

          {/* KI-Modell Auswahl */}
          <div className="space-y-2">
            <Label>KI-Modell</Label>
            <div className="grid grid-cols-2 gap-2">
              <div
                className={`p-3 border rounded-lg cursor-pointer transition-all ${selectedModel === 'llama4' ? 'border-ocean-500 bg-ocean-50 dark:bg-ocean-950' : 'hover:border-gray-300'}`}
                onClick={() => setSelectedModel('llama4')}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">🚀</span>
                  <div>
                    <p className="font-medium text-sm">Llama 4 Scout</p>
                    <p className="text-xs text-muted-foreground">Schnell & Günstig</p>
                  </div>
                </div>
              </div>
              <div
                className={`p-3 border rounded-lg cursor-pointer transition-all ${selectedModel === 'gpt4' ? 'border-ocean-500 bg-ocean-50 dark:bg-ocean-950' : 'hover:border-gray-300'}`}
                onClick={() => setSelectedModel('gpt4')}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">🤖</span>
                  <div>
                    <p className="font-medium text-sm">GPT-4</p>
                    <p className="text-xs text-muted-foreground">Premium Qualität</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={generateArticleWithAI}
            disabled={isGeneratingArticle || !imageFile}
            className="w-full"
          >
            {isGeneratingArticle ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generiere Artikel...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                KI-Artikel generieren ({selectedModel === 'gpt4' ? 'GPT-4' : 'Llama 4'})
              </>
            )}
          </Button>
          {!imageFile && (
            <p className="text-xs text-muted-foreground">
              💡 Lade zuerst ein Titelbild hoch, um die KI-Generierung zu nutzen.
            </p>
          )}
        </div>

        {/* Automatisch generierte Tags anzeigen */}
        {(isDIYCategory || isLeonCategory || isRVLifeCategory) && (
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

        {/* RV Life-spezifische Tags */}
        {isRVLifeCategory && (
          <div className="space-y-3">
            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
              <p className="text-sm text-orange-700 dark:text-orange-300 mb-3">
                🚐 Dieser Artikel erscheint im RV Life Bereich. Wähle spezifische Kategorien:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {[
                  { id: 'kueche-essen', emoji: '🍳', name: 'Küche & Essen' },
                  { id: 'ausstattung', emoji: '🏠', name: 'Ausstattung' },
                  { id: 'freeliving', emoji: '🕊️', name: 'Freeliving' }
                ].map(rvCat => (
                  <Badge
                    key={rvCat.id}
                    variant={displayTags.includes(rvCat.id) ? "default" : "outline"}
                    className="cursor-pointer justify-start p-2"
                    onClick={() => {
                      // Toggle RV Life Kategorie-Tag
                      setTags(prev =>
                        prev.includes(rvCat.id)
                          ? prev.filter(t => t !== rvCat.id)
                          : [...prev, rvCat.id]
                      );
                    }}
                  >
                    <span className="mr-2">{rvCat.emoji}</span>
                    {rvCat.name}
                  </Badge>
                ))}
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
          Berichte veroeffentlichen
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
  const [activeTab, setActiveTab] = useState(editType || 'media');
  const { data: editEvent } = useEditData(editEventId);

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
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="media" className="gap-2">
              <Upload className="h-4 w-4" />
              Medien
            </TabsTrigger>
            <TabsTrigger value="trip" className="gap-2">
              <Route className="h-4 w-4" />
              Trips
            </TabsTrigger>
            <TabsTrigger value="article" className="gap-2">
              <FileText className="h-4 w-4" />
              Berichte
            </TabsTrigger>
            <TabsTrigger value="place" className="gap-2">
              <Map className="h-4 w-4" />
              Plätze
            </TabsTrigger>
            <TabsTrigger value="note" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Note
            </TabsTrigger>
          </TabsList>

          <TabsContent value="media">
            <MediaUploadForm editEvent={editType === 'media' ? editEvent : undefined} />
          </TabsContent>

          <TabsContent value="trip">
            <TripPublishForm />
          </TabsContent>

          <TabsContent value="article">
            <ArticleForm editEvent={editType === 'article' ? editEvent : undefined} />
          </TabsContent>

          <TabsContent value="place">
            <PlaceForm editEvent={editType === 'place' ? editEvent : undefined} />
          </TabsContent>

          <TabsContent value="note">
            <NoteForm editEvent={editType === 'note' ? editEvent : undefined} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}