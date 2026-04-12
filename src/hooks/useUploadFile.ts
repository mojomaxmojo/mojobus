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
 * Stript EXIF-Orientierung von Bildern durch Canvas-Redraw.
 * Browser wenden bei createImageBitmap automatisch EXIF an (from-image).
 * Wir rotieren nicht manuell – der Browser macht es korrekt.
 * Canvas.toBlob() speichert OHNE EXIF-Tag.
 */
async function correctImageOrientation(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) {
    return file;
  }

  try {
    // Browser wendet EXIF automatisch an
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });

    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      bitmap.close();
      return file;
    }

    ctx.drawImage(bitmap, 0, 0);
    bitmap.close();

    console.log(`📷 [Orientation] ${file.name}: → ${canvas.width}x${canvas.height} (EXIF-gestrippt)`);

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) { resolve(file); return; }
        resolve(new File([blob], file.name, {
          type: 'image/jpeg',
          lastModified: file.lastModified,
        }));
      }, 'image/jpeg', 0.95);
    });

  } catch (error) {
    console.warn('⚠️ [Orientation] Failed:', error);
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