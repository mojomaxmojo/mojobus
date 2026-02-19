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
 * Korrigiert die Bildorientierung basierend auf EXIF-Daten
 * Smartphone-Fotos haben oft EXIF-Orientierungs-Tags, die beim WebP-Export verloren gehen
 */
async function correctImageOrientation(file: File): Promise<File> {
  try {
    // EXIF-Orientierung lesen
    const exif = await exifr.parse(file, { pick: ['Orientation'] });
    const orientation = exif?.Orientation || 1;
    
    console.log(`📷 EXIF Orientation for ${file.name}: ${orientation}`);
    
    if (orientation === 1) {
      console.log(`✅ No orientation correction needed`);
      return file;
    }
    
    // Bild laden
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = url;
    });
    
    // Canvas erstellen
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      URL.revokeObjectURL(url);
      return file;
    }
    
    // Canvas-Größe basierend auf Orientierung
    // Bei 90° oder 270° Drehung: Breite und Höhe tauschen
    const needsSwap = orientation >= 5 && orientation <= 8;
    
    if (needsSwap) {
      canvas.width = img.height;
      canvas.height = img.width;
    } else {
      canvas.width = img.width;
      canvas.height = img.height;
    }
    
    // In die Mitte des Canvas verschieben
    ctx.translate(canvas.width / 2, canvas.height / 2);
    
    // Transformation basierend auf Orientierung
    // EXIF Orientation beschreibt, wie das Bild GESPEICHERT ist (in welchem Winkel es gedreht wurde)
    // Um es zu korrigieren, müssen wir es in die GEGENTEILIGE Richtung drehen
    // 
    // In Canvas: Positive Rotation = Uhrzeigersinn (CW), Negative = Gegen-Uhrzeigersinn (CCW)
    // 
    // Orientation 6 = Bild wurde 90° CCW gespeichert → korrigieren mit 90° CW (+π/2)
    // Orientation 8 = Bild wurde 90° CW gespeichert → korrigieren mit 90° CCW (-π/2)
    
    let rotationDegrees = 0;
    
    switch (orientation) {
      case 2: // Horizontal flip
        ctx.scale(-1, 1);
        rotationDegrees = 0;
        break;
      case 3: // 180° rotation
        ctx.rotate(Math.PI);  // 180°
        rotationDegrees = 180;
        break;
      case 4: // Vertical flip
        ctx.scale(1, -1);
        rotationDegrees = 0;
        break;
      case 5: // 90° CCW + horizontal flip
        ctx.rotate(Math.PI / 2);  // +90° CW
        ctx.scale(-1, 1);
        rotationDegrees = 90;
        break;
      case 6: // 90° CCW gespeichert → +90° CW korrigieren
        ctx.rotate(Math.PI / 2);  // +90° im Uhrzeigersinn
        rotationDegrees = 90;
        break;
      case 7: // 90° CW + horizontal flip
        ctx.rotate(-Math.PI / 2);  // -90° CCW
        ctx.scale(-1, 1);
        rotationDegrees = -90;
        break;
      case 8: // 90° CW gespeichert → -90° CCW korrigieren
        ctx.rotate(-Math.PI / 2);  // -90° gegen den Uhrzeigersinn
        rotationDegrees = -90;
        break;
    }
    
    console.log(`🔄 Rotating ${file.name} by ${rotationDegrees}° to correct orientation ${orientation}`);
    
    // Zurück verschieben und zeichnen
    ctx.translate(-img.width / 2, -img.height / 2);
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
        console.log(`✅ Orientation corrected for ${file.name}`);
        resolve(correctedFile);
      }, file.type, 0.95);
    });
    
  } catch (error) {
    console.warn('⚠️ Failed to correct orientation:', error);
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