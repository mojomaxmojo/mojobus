import { useMutation } from "@tanstack/react-query";
import { BlossomUploader } from '@nostrify/nostrify/uploaders';

import { useCurrentUser } from "./useCurrentUser";

export function useUploadFile() {
  const { user } = useCurrentUser();

  return useMutation({
    mutationFn: async (file: File) => {
      if (!user) {
        throw new Error('Must be logged in to upload files');
      }

      console.log('Starting upload with BlossomUploader...');
      console.log('File details:', {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified
      });

      const uploader = new BlossomUploader({
        servers: [
          'https://blossom.primal.net/',
        ],
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