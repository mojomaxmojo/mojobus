import { useMutation } from "@tanstack/react-query";
import { BlossomUploader } from '@nostrify/nostrify/uploaders';

import { useCurrentUser } from "./useCurrentUser";
import { getBlossomConfigByPubkey, BACKUP_BLOSSOM_SERVER } from '@/config/blossom';

export function useUploadFile() {
  const { user, users } = useCurrentUser();

  return useMutation({
    mutationFn: async (file: File) => {
      if (!user || users.length === 0) {
        throw new Error('Must be logged in to upload files');
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
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified
      });
      console.log('Primary blossom servers:', primaryServers);
      console.log('Backup blossom server:', backupServer);
      console.log('Using blossom servers:', blossomConfig ? `Author-specific (${blossomConfig.authorId})` : 'Default');

      // Uploade auf primäre Server
      const primaryUploader = new BlossomUploader({
        servers: primaryServers,
        signer: user.signer,
      });

      try {
        console.log('Uploading to primary servers...');
        const primaryTags = await primaryUploader.upload(file);
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

          const backupTags = await backupUploader.upload(file);
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