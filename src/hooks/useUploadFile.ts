import { useMutation } from "@tanstack/react-query";
import { BlossomUploader } from '@nostrify/nostrify/uploaders';

import { useCurrentUser } from "./useCurrentUser";
import { getBlossomConfigByPubkey } from '@/config/blossom';

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
      const blossomServers = blossomConfig?.servers || [
        'https://blossom.primal.net/',
      ];

      console.log('Starting upload with BlossomUploader...');
      console.log('File details:', {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified
      });
      console.log('Author blossom servers:', blossomServers);
      console.log('Using blossom servers:', blossomConfig ? `Author-specific (${blossomConfig.authorId})` : 'Default');

      const uploader = new BlossomUploader({
        servers: blossomServers,
        signer: user.signer,
      });

      try {
        console.log('Calling uploader.upload()...');
        const tags = await uploader.upload(file);
        console.log('Upload completed, tags:', tags);
        return tags;
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