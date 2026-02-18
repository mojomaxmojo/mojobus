/**
 * Trip Publish Form
 * 
 * Creates a Trip from multiple images with GPS data
 * - First image = title image, determines country and location
 * - Each image can have GPS (auto-detected or manual)
 * - Each image gets a description
 * - Images are sortable via drag & drop
 * - Preview shows the route on a map
 */

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/useToast';
import { useUploadFile } from '@/hooks/useUploadFile';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { GpsEditor } from '@/components/GpsEditor';
import { GpsStatusIndicator } from '@/components/GpsStatusIndicator';
import { LocationPicker } from '@/components/LocationPicker';
import { CountrySelector, getCountryTag } from '@/components/CountrySelector';
import { VanillaMap, TILE_LAYERS, type MapMarker } from '@/components/VanillaMap';
import { 
  Camera, Upload, MapPin, Loader2, CheckCircle, GripVertical, X, 
  ChevronLeft, ChevronRight, Route, Clock, Map as MapIcon, Trash2, Edit3
} from '@/lib/icons';
import { 
  extractGpsFromImage, formatCoordinatesSimple, reverseGeocode, mapCountryCode,
  type GpsData, type GpsStatus
} from '@/lib/gpsExtraction';

// Trip Station - represents one image with GPS and description
interface TripStation {
  id: string;
  file: File;
  preview: string;
  uploaded?: boolean;
  uploadedUrl?: string;
  
  // GPS data
  gps?: GpsData;
  gpsStatus: GpsStatus;
  
  // Location info (auto-filled from GPS, but manually editable)
  location: string;
  
  // User content
  title: string;
  description: string;
  date: string;
}

// Trip metadata
interface TripData {
  title: string;
  summary: string;
  country: string;
}

// Step wizard state
type WizardStep = 'upload' | 'details' | 'preview' | 'publish';

export function TripPublishForm() {
  // State
  const [stations, setStations] = useState<TripStation[]>([]);
  const [tripData, setTripData] = useState<TripData>({
    title: '',
    summary: '',
    country: '',
  });
  const [currentStep, setCurrentStep] = useState<WizardStep>('upload');
  const [editingStation, setEditingStation] = useState<string | null>(null);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  
  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0, status: '' });
  
  // Hooks
  const { toast } = useToast();
  const { mutateAsync: uploadFile } = useUploadFile();
  const { mutate: publishEvent } = useNostrPublish();
  const navigate = useNavigate();

  // Auto-fill trip metadata from first station
  useEffect(() => {
    const autoFill = async () => {
      const firstStationWithGps = stations.find(s => s.gps && s.gpsStatus === 'detected');
      if (firstStationWithGps?.gps && !tripData.country) {
        const locationData = await reverseGeocode(
          firstStationWithGps.gps.latitude,
          firstStationWithGps.gps.longitude
        );
        if (locationData) {
          const locationParts = [
            locationData.city,
            locationData.neighbourhood,
            locationData.suburb
          ].filter(Boolean);
          
          const loc = locationParts.join(', ');
          const country = mapCountryCode(locationData);
          
          // Update station with location
          setStations(prev => prev.map(s => 
            s.id === firstStationWithGps.id 
              ? { ...s, location: loc }
              : s
          ));
          
          // Update trip data
          if (country && !tripData.country) {
            setTripData(prev => ({ ...prev, country }));
          }
          
          // Auto-generate title if empty
          if (!tripData.title && loc) {
            setTripData(prev => ({ 
              ...prev, 
              title: `Trip nach ${loc}`,
              summary: `Eine Reise durch ${loc} und Umgebung.`
            }));
          }
        }
      }
    };
    
    autoFill();
  }, [stations, tripData.country, tripData.title]);

  // Handle file selection
  const handleFileSelect = async (files: FileList | null) => {
    if (!files) return;
    
    const newStations: TripStation[] = [];
    
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue;
      
      const station: TripStation = {
        id: Math.random().toString(36).substr(2, 9),
        file,
        preview: URL.createObjectURL(file),
        gpsStatus: 'not_found',
        location: '', // Will be filled by reverse geocoding
        title: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
      };
      
      // Extract GPS from image
      try {
        const gpsData = await extractGpsFromImage(file);
        if (gpsData) {
          station.gps = gpsData;
          station.gpsStatus = 'detected';
          console.log(`[Trip GPS] Extracted from ${file.name}:`, gpsData);
          
          // Get location name via reverse geocoding
          const locationData = await reverseGeocode(gpsData.latitude, gpsData.longitude);
          if (locationData) {
            const locationParts = [
              locationData.city,
              locationData.neighbourhood,
              locationData.suburb
            ].filter(Boolean);
            station.location = locationParts.join(', ');
            console.log(`[Trip Location] Found for ${file.name}:`, station.location);
            
            // Auto-fill title if empty
            if (!station.title && station.location) {
              station.title = station.location;
            }
          }
        }
      } catch (error) {
        console.error(`[Trip GPS] Failed to extract from ${file.name}:`, error);
        station.gpsStatus = 'error';
      }
      
      newStations.push(station);
    }
    
    setStations(prev => [...prev, ...newStations]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const removeStation = (id: string) => {
    setStations(prev => {
      const station = prev.find(s => s.id === id);
      if (station?.preview) {
        URL.revokeObjectURL(station.preview);
      }
      return prev.filter(s => s.id !== id);
    });
  };

  // Drag & Drop reordering
  const handleDragStart = (id: string) => {
    setDraggedId(id);
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) return;
    
    setStations(prev => {
      const newStations = [...prev];
      const draggedIndex = newStations.findIndex(s => s.id === draggedId);
      const targetIndex = newStations.findIndex(s => s.id === targetId);
      
      if (draggedIndex !== -1 && targetIndex !== -1) {
        const [draggedStation] = newStations.splice(draggedIndex, 1);
        newStations.splice(targetIndex, 0, draggedStation);
      }
      
      return newStations;
    });
  };

  const handleDragEnd = () => {
    setDraggedId(null);
  };

  // GPS editing
  const saveGps = async (stationId: string, gps: GpsData) => {
    // Update station
    setStations(prev => prev.map(s => 
      s.id === stationId 
        ? { ...s, gps, gpsStatus: 'manual' as GpsStatus }
        : s
    ));
    
    // Reverse geocode for location
    try {
      const locationData = await reverseGeocode(gps.latitude, gps.longitude);
      if (locationData) {
        const locationParts = [
          locationData.city,
          locationData.neighbourhood,
          locationData.suburb
        ].filter(Boolean);
        const loc = locationParts.join(', ');
        
        setStations(prev => prev.map(s => 
          s.id === stationId 
            ? { ...s, location: loc, title: s.title || loc }
            : s
        ));
        
        // Also update country if not set
        const country = mapCountryCode(locationData);
        if (country && !tripData.country) {
          setTripData(prev => ({ ...prev, country }));
        }
      }
    } catch (error) {
      console.error('[Trip GPS] Reverse geocoding failed:', error);
    }
    
    setEditingStation(null);
    setShowMapPicker(false);
  };

  const removeGps = (stationId: string) => {
    setStations(prev => prev.map(s => {
      if (s.id === stationId) {
        const updated = { ...s };
        delete updated.gps;
        updated.gpsStatus = 'not_found';
        delete updated.location;
        return updated;
      }
      return s;
    }));
    setEditingStation(null);
    setShowMapPicker(false);
  };

  // Update station fields
  const updateStation = (id: string, field: keyof TripStation, value: string) => {
    setStations(prev => prev.map(s => 
      s.id === id ? { ...s, [field]: value } : s
    ));
  };

  // Calculate map markers
  const mapMarkers: MapMarker[] = useMemo(() => {
    return stations
      .filter(s => s.gps)
      .map((s, index) => ({
        id: s.id,
        lat: s.gps!.latitude,
        lng: s.gps!.longitude,
        title: s.title || s.location || `Station ${index + 1}`,
        description: s.location,
        isCurrent: false,
      }));
  }, [stations]);

  // Count stations with GPS
  const stationsWithGps = useMemo(() => 
    stations.filter(s => s.gps).length,
  [stations]);

  // Validate for each step
  const canProceedToDetails = stations.length >= 2;
  const canProceedToPreview = stations.length >= 2 && tripData.title.trim() !== '';
  const canPublish = stations.filter(s => s.gps).length >= 2 && tripData.title.trim() !== '';

  // Upload all images to Blossom
  const uploadImages = async () => {
    setIsUploading(true);
    setUploadProgress({ current: 0, total: stations.length, status: 'Upload gestartet...' });
    
    try {
      for (let i = 0; i < stations.length; i++) {
        const station = stations[i];
        
        if (station.uploaded && station.uploadedUrl) {
          // Already uploaded
          setUploadProgress({ 
            current: i + 1, 
            total: stations.length, 
            status: `Überspringe ${station.file.name} (bereits hochgeladen)` 
          });
          continue;
        }
        
        setUploadProgress({ 
          current: i + 1, 
          total: stations.length, 
          status: `Lade ${station.file.name} hoch...` 
        });
        
        const uploadResult = await uploadFile(station.file);
        
        if (Array.isArray(uploadResult)) {
          const urlTag = uploadResult.find(tag => 
            Array.isArray(tag) && tag.length >= 2 && tag[0] === 'url'
          );
          
          if (urlTag) {
            setStations(prev => prev.map(s => 
              s.id === station.id 
                ? { ...s, uploaded: true, uploadedUrl: urlTag[1] }
                : s
            ));
          }
        }
      }
      
      toast({
        title: 'Upload erfolgreich!',
        description: `${stations.length} Bilder wurden hochgeladen.`,
      });
      
      return true;
    } catch (error) {
      console.error('[Trip Upload] Error:', error);
      toast({
        title: 'Fehler beim Upload',
        description: 'Einige Bilder konnten nicht hochgeladen werden.',
        variant: 'destructive'
      });
      return false;
    } finally {
      setIsUploading(false);
      setUploadProgress({ current: 0, total: 0, status: '' });
    }
  };

  // Publish trip
  const handlePublish = async () => {
    // First upload all images
    const uploadSuccess = await uploadImages();
    if (!uploadSuccess) return;
    
    // Create trip event (Kind 30303)
    const dTag = `trip-${Date.now()}`;
    
    // Build waypoint tags
    const waypointTags = stations
      .filter(s => s.gps && s.uploadedUrl)
      .map((s, index) => [
        'waypoint',
        (index + 1).toString(),
        s.gps!.latitude.toString(),
        s.gps!.longitude.toString(),
        s.title || s.location || `Station ${index + 1}`,
        s.date,
        s.uploadedUrl!
      ]);
    
    // Build station content
    const stationContent = stations
      .filter(s => s.uploadedUrl)
      .map((s, index) => {
        let content = `## Station ${index + 1}: ${s.title || s.location || 'Unbenannt'}\n\n`;
        if (s.description) content += `${s.description}\n\n`;
        content += `![${s.title || `Station ${index + 1}`}](${s.uploadedUrl})\n`;
        return content;
      })
      .join('\n---\n\n');
    
    const content = `# ${tripData.title}\n\n${tripData.summary}\n\n${stationContent}`;
    
    // Build tags
    const tags: string[][] = [
      ['d', dTag],
      ['title', tripData.title],
      ['summary', tripData.summary],
      ['type', 'trip'],
      ['t', 'trip'],
      ['t', 'mojobus'],
      ...waypointTags,
    ];
    
    // Add country tags
    if (tripData.country) {
      const countryTags = getCountryTag(tripData.country);
      countryTags.forEach(tag => tags.push(['t', tag]));
    }
    
    // Add first image as cover
    const firstUploaded = stations.find(s => s.uploadedUrl);
    if (firstUploaded?.uploadedUrl) {
      tags.push(['image', firstUploaded.uploadedUrl]);
    }
    
    // Publish
    publishEvent({
      kind: 30303, // Addressable event for trips
      content,
      tags
    }, {
      onSuccess: () => {
        toast({
          title: 'Trip veröffentlicht!',
          description: 'Dein Trip wurde erfolgreich veröffentlicht.',
        });
        
        // Reset and redirect
        setStations([]);
        setTripData({ title: '', summary: '', country: '' });
        setCurrentStep('upload');
        
        setTimeout(() => {
          navigate('/map');
        }, 1500);
      },
      onError: (error) => {
        console.error('[Trip Publish] Error:', error);
        toast({
          title: 'Fehler beim Veröffentlichen',
          description: 'Der Trip konnte nicht veröffentlicht werden.',
          variant: 'destructive'
        });
      }
    });
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 'upload':
        return renderUploadStep();
      case 'details':
        return renderDetailsStep();
      case 'preview':
        return renderPreviewStep();
      case 'publish':
        return renderPublishStep();
      default:
        return null;
    }
  };

  // Step 1: Upload images
  const renderUploadStep = () => (
    <div className="space-y-6">
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging ? 'border-primary bg-primary/5' : 'border-gray-300 dark:border-gray-600'
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
          id="trip-image-upload"
        />
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium mb-2">Bilder für deinen Trip hochladen</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Ziehe Bilder hierher oder klicke zum Auswählen. Mindestens 2 Bilder erforderlich.
        </p>
        <Button asChild>
          <label htmlFor="trip-image-upload" className="cursor-pointer">
            <Camera className="h-4 w-4 mr-2" />
            Bilder auswählen
          </label>
        </Button>
      </div>

      {/* Image Grid */}
      {stations.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">
              Stationen ({stations.length}) - {stationsWithGps} mit GPS
            </h3>
            <p className="text-sm text-muted-foreground">
              Ziehe zum Sortieren
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {stations.map((station, index) => (
              <div
                key={station.id}
                draggable
                onDragStart={() => handleDragStart(station.id)}
                onDragOver={(e) => handleDragOver(e, station.id)}
                onDragEnd={handleDragEnd}
                className={`relative group border rounded-lg overflow-hidden cursor-move ${
                  draggedId === station.id ? 'opacity-50' : ''
                }`}
              >
                {/* Drag Handle */}
                <div className="absolute top-1 left-1 z-10 bg-black/50 rounded p-1">
                  <GripVertical className="h-4 w-4 text-white" />
                </div>
                
                {/* Station Number */}
                <div className="absolute top-1 right-10 z-10 bg-primary rounded-full w-6 h-6 flex items-center justify-center text-white text-sm font-bold">
                  {index + 1}
                </div>
                
                {/* Image */}
                <img
                  src={station.preview}
                  alt={station.title || `Station ${index + 1}`}
                  className="w-full h-32 object-cover"
                />
                
                {/* GPS Status */}
                <div className="p-2 space-y-1">
                  {station.gps ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full h-7 text-xs text-green-600"
                      onClick={() => setEditingStation(station.id)}
                    >
                      <MapPin className="h-3 w-3 mr-1" />
                      {station.location || 'GPS erkannt'}
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full h-7 text-xs"
                      onClick={() => setEditingStation(station.id)}
                    >
                      <MapPin className="h-3 w-3 mr-1" />
                      GPS hinzufügen
                    </Button>
                  )}
                </div>
                
                {/* Delete Button */}
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity z-20"
                  onClick={() => removeStation(station.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* GPS Editor Dialog */}
      <Dialog open={editingStation !== null} onOpenChange={(open) => { if (!open) { setEditingStation(null); setShowMapPicker(false); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              GPS-Standort bearbeiten
            </DialogTitle>
            <DialogDescription>
              Wähle zwischen Koordinaten-Eingabe oder Karte
            </DialogDescription>
          </DialogHeader>
          
          {editingStation && (() => {
            const station = stations.find(s => s.id === editingStation);
            if (!station) return null;
            
            return (
              <div className="space-y-4">
                {/* Preview Image */}
                <div className="flex gap-4 items-start">
                  <img
                    src={station.preview}
                    alt=""
                    className="w-24 h-24 object-cover rounded"
                  />
                  <div className="flex-1">
                    <p className="font-medium">{station.title || `Station ${stations.findIndex(s => s.id === editingStation) + 1}`}</p>
                    {station.gps && (
                      <p className="text-sm text-muted-foreground">
                        Aktuell: {formatCoordinatesSimple(station.gps.latitude, station.gps.longitude)}
                      </p>
                    )}
                  </div>
                </div>
                
                {/* Toggle Buttons */}
                <div className="flex gap-2">
                  <Button
                    variant={!showMapPicker ? 'default' : 'outline'}
                    className="flex-1"
                    onClick={() => setShowMapPicker(false)}
                  >
                    ✏️ Koordinaten eingeben
                  </Button>
                  <Button
                    variant={showMapPicker ? 'default' : 'outline'}
                    className="flex-1"
                    onClick={() => setShowMapPicker(true)}
                  >
                    🗺️ Auf Karte wählen
                  </Button>
                </div>
                
                {/* Editor Content */}
                {showMapPicker ? (
                  <LocationPicker
                    gps={station.gps}
                    onSave={(gps) => saveGps(station.id, gps)}
                    onCancel={() => { setEditingStation(null); setShowMapPicker(false); }}
                    height="350px"
                  />
                ) : (
                  <GpsEditor
                    gps={station.gps}
                    onSave={(gps) => saveGps(station.id, gps)}
                    onCancel={() => { setEditingStation(null); setShowMapPicker(false); }}
                    onRemove={() => removeGps(station.id)}
                  />
                )}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Navigation */}
      <div className="flex justify-end">
        <Button
          onClick={() => setCurrentStep('details')}
          disabled={!canProceedToDetails}
        >
          Weiter zur Beschreibung
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );

  // Step 2: Add details to each station
  const renderDetailsStep = () => (
    <div className="space-y-6">
      {/* Trip Metadata */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Trip-Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="trip-title">Trip-Titel</Label>
            <Input
              id="trip-title"
              value={tripData.title}
              onChange={(e) => setTripData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="z.B. Portugal Roadtrip 2024"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="trip-summary">Kurzbeschreibung</Label>
            <Textarea
              id="trip-summary"
              value={tripData.summary}
              onChange={(e) => setTripData(prev => ({ ...prev, summary: e.target.value }))}
              placeholder="Eine kurze Beschreibung deiner Reise..."
              rows={2}
            />
          </div>
          
          <CountrySelector
            selectedCountry={tripData.country}
            onCountryChange={(country) => setTripData(prev => ({ ...prev, country }))}
            placeholder="Land auswählen"
          />
        </CardContent>
      </Card>

      {/* Station Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Stationen beschreiben</CardTitle>
          <CardDescription>
            Füge jeder Station einen Titel, Standort und eine Beschreibung hinzu
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {stations.map((station, index) => (
            <div key={station.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold">
                    {index + 1}
                  </div>
                </div>
                
                <div className="flex-1 space-y-3">
                  {/* GPS & Location Status */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {station.gps ? (
                      <>
                        <Badge variant="outline" className="text-green-600 border-green-300">
                          <MapPin className="h-3 w-3 mr-1" />
                          GPS: {formatCoordinatesSimple(station.gps.latitude, station.gps.longitude)}
                        </Badge>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 text-xs"
                          onClick={() => setEditingStation(station.id)}
                        >
                          ✏️ GPS ändern
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7"
                        onClick={() => setEditingStation(station.id)}
                      >
                        <MapPin className="h-3 w-3 mr-1" />
                        GPS hinzufügen
                      </Button>
                    )}
                  </div>
                  
                  {/* Title */}
                  <Input
                    value={station.title}
                    onChange={(e) => updateStation(station.id, 'title', e.target.value)}
                    placeholder={`Station ${index + 1} Titel (z.B. Ankunft in Porto)`}
                  />
                  
                  {/* Location - Manually Editable */}
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Standort (manuell änderbar)</Label>
                    <Input
                      value={station.location}
                      onChange={(e) => updateStation(station.id, 'location', e.target.value)}
                      placeholder="z.B. Porto, Portugal"
                    />
                    {station.gps && !station.location && (
                      <p className="text-xs text-orange-600">
                        ⏳ Standort wird ermittelt...
                      </p>
                    )}
                  </div>
                  
                  {/* Description */}
                  <Textarea
                    value={station.description}
                    onChange={(e) => updateStation(station.id, 'description', e.target.value)}
                    placeholder="Beschreibe diese Station..."
                    rows={2}
                  />
                  
                  {/* Date */}
                  <Input
                    type="date"
                    value={station.date}
                    onChange={(e) => updateStation(station.id, 'date', e.target.value)}
                    className="max-w-[200px]"
                  />
                </div>
                
                <div className="flex-shrink-0">
                  <img
                    src={station.preview}
                    alt=""
                    className="w-20 h-20 object-cover rounded"
                  />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setCurrentStep('upload')}>
          <ChevronLeft className="h-4 w-4 mr-2" />
          Zurück
        </Button>
        <Button
          onClick={() => setCurrentStep('preview')}
          disabled={!canProceedToPreview}
        >
          Vorschau anzeigen
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );

  // Step 3: Preview on map
  const renderPreviewStep = () => (
    <div className="space-y-6">
      {/* Map Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapIcon className="h-5 w-5" />
            Routen-Vorschau
          </CardTitle>
          <CardDescription>
            So wird dein Trip auf der Karte angezeigt
          </CardDescription>
        </CardHeader>
        <CardContent>
          {mapMarkers.length >= 2 ? (
            <VanillaMap
              center={[mapMarkers[0].lat, mapMarkers[0].lng]}
              zoom={6}
              markers={mapMarkers}
              polylines={[{
                points: mapMarkers.map(m => [m.lat, m.lng]),
                color: '#0891B2',
                weight: 3,
                opacity: 0.8,
              }]}
              height="400px"
              fitToMarkers
            />
          ) : (
            <div className="h-[400px] flex items-center justify-center border rounded-lg bg-muted">
              <div className="text-center">
                <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Mindestens 2 Stationen mit GPS erforderlich für Vorschau
                </p>
              </div>
            </div>
          )}
          
          {/* Route Stats */}
          <div className="mt-4 flex gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Route className="h-4 w-4 text-primary" />
              <span><strong>{stations.length}</strong> Stationen</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-green-600" />
              <span><strong>{stationsWithGps}</strong> mit GPS</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trip Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Trip-Zusammenfassung</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-4">
            {stations[0]?.preview && (
              <img
                src={stations[0].preview}
                alt="Titelbild"
                className="w-24 h-24 object-cover rounded"
              />
            )}
            <div className="flex-1">
              <h3 className="text-xl font-bold">{tripData.title || 'Unbenannter Trip'}</h3>
              <p className="text-muted-foreground">{tripData.summary}</p>
              {tripData.country && (
                <Badge variant="outline" className="mt-2">
                  {tripData.country}
                </Badge>
              )}
            </div>
          </div>
          
          {/* Station List */}
          <div className="space-y-2 mt-4">
            {stations.map((station, index) => (
              <div key={station.id} className="flex items-center gap-3 p-2 bg-muted rounded">
                <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{station.title || `Station ${index + 1}`}</p>
                  {station.location && (
                    <p className="text-xs text-muted-foreground">{station.location}</p>
                  )}
                </div>
                {station.gps ? (
                  <MapPin className="h-4 w-4 text-green-600" />
                ) : (
                  <MapPin className="h-4 w-4 text-gray-400" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setCurrentStep('details')}>
          <ChevronLeft className="h-4 w-4 mr-2" />
          Zurück
        </Button>
        <Button
          onClick={handlePublish}
          disabled={!canPublish || isUploading}
        >
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {uploadProgress.status}
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Trip veröffentlichen
            </>
          )}
        </Button>
      </div>
    </div>
  );

  // Step 4: Publishing (loading state)
  const renderPublishStep = () => (
    <div className="flex flex-col items-center justify-center py-12 space-y-4">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <h3 className="text-xl font-semibold">Trip wird veröffentlicht...</h3>
      <p className="text-muted-foreground">{uploadProgress.status}</p>
      {uploadProgress.total > 0 && (
        <Progress 
          value={(uploadProgress.current / uploadProgress.total) * 100}
          className="w-64"
        />
      )}
    </div>
  );

  // Main render
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Route className="h-5 w-5" />
          Trip erstellen
        </CardTitle>
        <CardDescription>
          Erstelle einen Trip aus mehreren Bildern mit GPS-Daten. 
          Das erste Bild ist das Titelbild und bestimmt den Startort.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[
            { step: 'upload', label: 'Bilder', icon: Camera },
            { step: 'details', label: 'Details', icon: Edit3 },
            { step: 'preview', label: 'Vorschau', icon: MapIcon },
          ].map((item, index) => {
            const isActive = currentStep === item.step;
            const isPast = ['upload', 'details', 'preview', 'publish'].indexOf(currentStep) > index;
            
            return (
              <div key={item.step} className="flex items-center">
                <div
                  className={`flex items-center gap-2 px-3 py-2 rounded-full ${
                    isActive 
                      ? 'bg-primary text-primary-foreground' 
                      : isPast
                        ? 'bg-primary/20 text-primary'
                        : 'bg-muted text-muted-foreground'
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  <span className="text-sm font-medium hidden sm:inline">{item.label}</span>
                </div>
                {index < 2 && (
                  <div className={`w-8 h-0.5 mx-1 ${
                    isPast ? 'bg-primary' : 'bg-muted'
                  }`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Step Content */}
        {renderStepContent()}
      </CardContent>
    </Card>
  );
}
