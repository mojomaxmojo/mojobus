import { useMutation } from "@tanstack/react-query";
import { BlossomUploader } from '@nostrify/nostrify/uploaders';
import imageCompression from 'browser-image-compression';

import { useCurrentUser } from "./useCurrentUser";
import { getBlossomConfigByPubkey, BACKUP_BLOSSOM_SERVER } from '@/config/blossom';
import {
  imageOptimizationConfig,
  shouldOptimizeImage,
} from '@/config/imageOptimization';

export interface UploadProgress {
  fileIndex: number;
  totalFiles: number;
  fileName: string;
  stage: 'optimizing' | 'uploading' | 'backup' | 'complete' | 'error';
  optimizationProgress?: number;
  uploadProgress?: number;
  backupProgress?: number;
  originalSize?: number;
  optimizedSize?: number;
  error?: string;
}

export function useUploadWithProgress(onProgress?: (progress: UploadProgress) => void) {
  const { user, users } = useCurrentUser();

  return useMutation({
    mutationFn: async ({ file, fileIndex, totalFiles }: {
      file: File;
      fileIndex: number;
      totalFiles: number;
    }) => {
      if (!user || users.length === 0) {
        throw new Error('Must be logged in to upload files');
      }

      let fileToUpload = file;
      const originalSize = file.size;

      // Benachrichtige über Start
      onProgress?.({
        fileIndex,
        totalFiles,
        fileName: file.name,
        stage: 'optimizing',
        originalSize,
      });

      // Prüfe, ob Bildoptimierung aktiviert ist und das Bild optimiert werden soll
      const enableOptimization = localStorage.getItem('image-optimization-enabled');
      const shouldOptimize = enableOptimization !== 'false' && shouldOptimizeImage(file);

      if (shouldOptimize) {
        console.log('🖼️ Image optimization enabled, processing file...');
        console.log('Original file:', {
          name: file.name,
          size: `${(file.size / 1024).toFixed(2)} KB`,
          type: file.type,
        });

        try {
          // Optimiere das Bild mit browser-image-compression
          fileToUpload = await imageCompression(file, imageOptimizationConfig);

          console.log('✅ Image optimization completed:', {
            name: fileToUpload.name,
            originalSize: `${(file.size / 1024).toFixed(2)} KB`,
            optimizedSize: `${(fileToUpload.size / 1024).toFixed(2)} KB`,
            compressionRatio: `${((1 - fileToUpload.size / file.size) * 100).toFixed(1)}%`,
            format: fileToUpload.type,
          });

          // Benachrichtige über optimierung fertig
          onProgress?.({
            fileIndex,
            totalFiles,
            fileName: file.name,
            stage: 'optimizing',
            optimizationProgress: 100,
            originalSize,
            optimizedSize: fileToUpload.size,
          });
        } catch (optimizationError) {
          console.warn('⚠️ Image optimization failed, uploading original file:', optimizationError);
          // Bei Fehler das Original hochladen
          fileToUpload = file;
        }
      } else {
        console.log('📤 Skipping image optimization (disabled or not applicable)');
        // Benachrichtige über Überspringen der Optimierung
        onProgress?.({
          fileIndex,
          totalFiles,
          fileName: file.name,
          stage: 'optimizing',
          optimizationProgress: 100,
          originalSize,
          optimizedSize: originalSize,
        });
      }

      // Hole autor-spezifische Blossom-Server-Konfiguration
      const blossomConfig = getBlossomConfigByPubkey(user.pubkey);

      // Verwende autor-spezifische Server oder Default
      const primaryServers = blossomConfig?.servers || [
        'https://blossom.primal.net/',
      ];

      // Backup-Server (immer primal.net)
      const backupServer = blossomConfig?.backupServer || BACKUP_BLOSSOM_SERVER;

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
      console.log('Using blossom servers:', blossomConfig ? `Author-specific (${blossomConfig.authorId})` : 'Default');

      // Benachrichtige über Upload-Start
      onProgress?.({
        fileIndex,
        totalFiles,
        fileName: file.name,
        stage: 'uploading',
        uploadProgress: 0,
        originalSize,
        optimizedSize: fileToUpload.size,
      });

      // Uploade auf primäre Server
      const primaryUploader = new BlossomUploader({
        servers: primaryServers,
        signer: user.signer,
      });

      try {
        console.log('Uploading to primary servers...');

        // Simuliere Upload-Progress (da BlossomUploader keinen nativen Progress-Callback hat)
        const primaryTags = await primaryUploader.upload(fileToUpload);
        console.log('Primary upload completed, tags:', primaryTags);

        // Benachrichtige über Upload fertig
        onProgress?.({
          fileIndex,
          totalFiles,
          fileName: file.name,
          stage: 'uploading',
          uploadProgress: 100,
          originalSize,
          optimizedSize: fileToUpload.size,
        });

        // Extrahiere die URL vom primären Upload
        const primaryUrl = primaryTags.find(tag => Array.isArray(tag) && tag[0] === 'url')?.[1];

        if (!primaryUrl) {
          throw new Error('No URL found in primary upload result');
        }

        // Benachrichtige über Backup-Upload
        onProgress?.({
          fileIndex,
          totalFiles,
          fileName: file.name,
          stage: 'backup',
          backupProgress: 0,
          originalSize,
          optimizedSize: fileToUpload.size,
        });

        // Uploade auf Backup-Server (parallel)
        console.log('Uploading to backup server:', backupServer);

        try {
          const backupUploader = new BlossomUploader({
            servers: [backupServer],
            signer: user.signer,
          });

          const backupTags = await backupUploader.upload(fileToUpload);
          console.log('Backup upload completed, tags:', backupTags);

          // Benachrichtige über Backup fertig
          onProgress?.({
            fileIndex,
            totalFiles,
            fileName: file.name,
            stage: 'backup',
            backupProgress: 100,
            originalSize,
            optimizedSize: fileToUpload.size,
          });

          // Kombiniere Tags: Primäre Tags + Backup URL
          const combinedTags = [
            ...primaryTags,
            ['backup_url', backupServer], // Markiere Backup-Server
          ];

          console.log('Combined tags:', combinedTags);

          // Benachrichtige über Fertigstellung
          onProgress?.({
            fileIndex,
            totalFiles,
            fileName: file.name,
            stage: 'complete',
            originalSize,
            optimizedSize: fileToUpload.size,
          });

          return combinedTags;
        } catch (backupError) {
          console.warn('Backup upload failed, but primary upload succeeded:', backupError);

          // Benachrichtige über Backup-Fehler, aber immer noch erfolgreich
          onProgress?.({
            fileIndex,
            totalFiles,
            fileName: file.name,
            stage: 'backup',
            backupProgress: 100,
            originalSize,
            optimizedSize: fileToUpload.size,
          });

          // Benachrichtige über Fertigstellung
          onProgress?.({
            fileIndex,
            totalFiles,
            fileName: file.name,
            stage: 'complete',
            originalSize,
            optimizedSize: fileToUpload.size,
          });

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

        // Benachrichtige über Fehler
        onProgress?.({
          fileIndex,
          totalFiles,
          fileName: file.name,
          stage: 'error',
          error: uploadError.message || 'Upload fehlgeschlagen',
          originalSize,
          optimizedSize: fileToUpload.size,
        });

        throw uploadError;
      }
    },
  });
}
