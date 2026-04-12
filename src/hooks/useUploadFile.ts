import { useMutation } from "@tanstack/react-query";
import { BlossomUploader } from '@nostrify/nostrify/uploaders';
import imageCompression from 'browser-image-compression';
import exifr from 'exifr';

import { useCurrentUser } from "./useCurrentUser";
import { getBlossomConfigByPubkey, BACKUP_BLOSSOM_SERVER } from '@/config/blossom';
import {
  imageOptimizationConfig,
  shouldOptimizeImage,
} from '@/config/imageOptimization';

/**
 * Korrigiert die Bildorientierung: Browser wendet EXIF-Rotation bereits an,
 * daher zeichnen wir das Bild auf Canvas (browser-korrigiert) und speichern
 * ohne EXIF Orientation Tag. Kein manuelles Rotieren nötig!
 */
async function correctImageOrientation(file: File): Promise<File> {
  try {
    const exif = await exifr.parse(file);
    const orientation = exif?.Orientation;

    // Kein EXIF oder Orientation=1 → nichts zu tun
    if (!orientation || orientation === 1) {
      return file;
    }

    console.log(`📷 [Orientation] ${file.name}: EXIF Orientation=${orientation} → redraw to strip EXIF`);

    // Browser hat das Bild bereits korrekt gedreht (EXIF angewendet).
    // Wir zeichnen es auf Canvas → korrekte Pixel, aber ohne EXIF-Tag.
    const img = new Image();
    const url = URL.createObjectURL(file);

    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = url;
    });

    // Browser-korrigierte Abmessungen verwenden
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      URL.revokeObjectURL(url);
      return file;
    }

    // Bild zeichnen (bereits korrekt orientiert durch Browser)
    ctx.drawImage(img, 0, 0);
    URL.revokeObjectURL(url);

    // Als JPEG ohne EXIF-Orientation speichern
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          resolve(file);
          return;
        }
        const correctedFile = new File([blob], file.name, {
          type: 'image/jpeg',
          lastModified: file.lastModified,
        });
        console.log(`✅ [Orientation] ${file.name}: EXIF stripped, ${img.naturalWidth}x${img.naturalHeight}`);
        resolve(correctedFile);
      }, 'image/jpeg', 0.95);
    });

  } catch (error) {
    console.warn('⚠️ [Orientation] Failed:', error);
    return file;
  }
}
        
        // GrapheneOS/Google Camera Fix für Pixel Geräte
        // Orientation 6 bedeutet normalerweise "drehe 90° CW", aber Pixel
        // speichert das Bild schon gedreht. Wenn also nach Standard-Rotation
        // das Bild immer noch quer ist (width > height), drehen wir zusätzlich.
        if (orientation === 6 && actualWidth > actualHeight) {
          // Bild ist quer obwohl Orientation 6 sagt es sollte hoch sein
          // Das bedeutet: Pixel/GrapheneOS hat es schon gedreht
          // Wir drehen +180° (zwei mal 90° CW) um komplett zu korrigieren
          rotationDegrees = 180;
          console.log(`🔄 [Orientation] ${file.name}: Pixel/GrapheneOS detected (landscape), using 180° rotation`);
        }
      }
      
      if (rotationDegrees === 0) {
        console.log(`✅ [Orientation] ${file.name}: No correction needed`);
      URL.revokeObjectURL(url);
      return file;
    }
    
    console.log(`🔄 [Orientation] ${file.name}: Rotating by ${rotationDegrees}°`);
    
    // Canvas erstellen und rotieren
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      URL.revokeObjectURL(url);
      return file;
    }
    
    // Canvas-Größe (bei 90° oder -90° getauscht)
    const needsSwap = rotationDegrees === 90 || rotationDegrees === -90;
    
    if (needsSwap) {
      canvas.width = actualHeight;
      canvas.height = actualWidth;
    } else {
      canvas.width = actualWidth;
      canvas.height = actualHeight;
    }
    
    // In die Mitte verschieben
    ctx.translate(canvas.width / 2, canvas.height / 2);
    
    // Rotation anwenden
    ctx.rotate((rotationDegrees * Math.PI) / 180);
    
    // Zurück verschieben und zeichnen
    ctx.translate(-actualWidth / 2, -actualHeight / 2);
    ctx.drawImage(img, 0, 0);
    
    URL.revokeObjectURL(url);
    
    // Canvas zurück zu File
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          resolve(file);
          return;
        }
        const correctedFile = new File([blob], file.name, {
          type: file.type,
          lastModified: file.lastModified,
        });
        console.log(`✅ [Orientation] ${file.name}: Corrected successfully`);
        resolve(correctedFile);
      }, file.type, 0.95);
    });
    
  } catch (error) {
    console.warn('⚠️ [Orientation] Failed to correct:', error);
    return file;
  }
}

export function useUploadFile() {
  const { user, users } = useCurrentUser();

  return useMutation({
    mutationFn: async (file: File) => {
      if (!user || users.length === 0) {
        throw new Error('Du musst angemeldet sein, um Dateien hochzuladen.');
      }

      // Prüfe ob User autorisiert ist (mojo oder susanne)
      const blossomConfig = getBlossomConfigByPubkey(user.pubkey);
      
      if (!blossomConfig) {
        throw new Error('Upload nicht erlaubt. Nur autorisierte Benutzer können Dateien hochladen.');
      }

      let fileToUpload = file;

      // Zuerst: EXIF-Orientierung korrigieren (bevor Komprimierung)
      // WICHTIG für Smartphone-Fotos!
      try {
        fileToUpload = await correctImageOrientation(file);
        console.log('✅ EXIF orientation checked/corrected');
      } catch (orientationError) {
        console.warn('⚠️ Orientation correction failed:', orientationError);
      }

      // Prüfe, ob Bildoptimierung aktiviert ist und das Bild optimiert werden soll
      const enableOptimization = localStorage.getItem('image-optimization-enabled');
      const shouldOptimize = enableOptimization !== 'false' && shouldOptimizeImage(fileToUpload);

      if (shouldOptimize) {
        const originalSize = fileToUpload.size;
        console.log('🖼️ Image optimization enabled, processing file...');
        console.log('Original file:', {
          name: fileToUpload.name,
          size: `${(originalSize / 1024).toFixed(2)} KB`,
          type: fileToUpload.type,
        });

        try {
          // Optimiere das Bild mit browser-image-compression
          fileToUpload = await imageCompression(fileToUpload, imageOptimizationConfig);

          console.log('✅ Image optimization completed:', {
            name: fileToUpload.name,
            originalSize: `${(originalSize / 1024).toFixed(2)} KB`,
            optimizedSize: `${(fileToUpload.size / 1024).toFixed(2)} KB`,
            compressionRatio: `${((1 - fileToUpload.size / originalSize) * 100).toFixed(1)}%`,
            format: fileToUpload.type,
          });
        } catch (optimizationError) {
          console.warn('⚠️ Image optimization failed, using orientation-corrected file:', optimizationError);
          // Behalte das orientierungskorrigierte Bild (nicht das Original)
        }
      } else {
        console.log('📤 Skipping image optimization (disabled or not applicable)');
      }

      // Autorisierte Server verwenden (wurde oben geprüft)
      const primaryServers = blossomConfig.servers;
      const backupServer = blossomConfig.backupServer || BACKUP_BLOSSOM_SERVER;

      console.log('Starting upload with BlossomUploader...');
      console.log('File details:', {
        name: fileToUpload.name,
        size: fileToUpload.size,
        type: fileToUpload.type,
        lastModified: fileToUpload.lastModified,
        isOptimized: fileToUpload !== file,
      });
      console.log('Primary blossom servers:', primaryServers);
      console.log('Backup blossom server:', backupServer);
      console.log('Using author-specific blossom servers:', blossomConfig.authorId);

      // Uploade auf primäre Server
      const primaryUploader = new BlossomUploader({
        servers: primaryServers,
        signer: user.signer,
      });

      try {
        console.log('Uploading to primary servers...');
        const primaryTags = await primaryUploader.upload(fileToUpload);
        console.log('Primary upload completed, tags:', primaryTags);

        // Extrahiere die URL vom primären Upload
        const primaryUrl = primaryTags.find(tag => Array.isArray(tag) && tag[0] === 'url')?.[1];

        if (!primaryUrl) {
          throw new Error('No URL found in primary upload result');
        }

        // Uploade auf Backup-Server (parallel)
        console.log('Uploading to backup server:', backupServer);

        try {
          const backupUploader = new BlossomUploader({
            servers: [backupServer],
            signer: user.signer,
          });

          const backupTags = await backupUploader.upload(fileToUpload);
          console.log('Backup upload completed, tags:', backupTags);

          // Kombiniere Tags: Primäre Tags + Backup URL
          const combinedTags = [
            ...primaryTags,
            ['backup_url', backupServer], // Markiere Backup-Server
          ];

          console.log('Combined tags:', combinedTags);
          return combinedTags;
        } catch (backupError) {
          console.warn('Backup upload failed, but primary upload succeeded:', backupError);
          // Gib trotzdem die primären Tags zurück
          return primaryTags;
        }
      } catch (uploadError) {
        console.error('BlossomUploader.upload() failed:', uploadError);
        console.error('Upload error details:', {
          name: uploadError.name,
          message: uploadError.message,
          stack: uploadError.stack,
          code: uploadError.code,
          status: uploadError.status
        });
        throw uploadError;
      }
    },
  });
}