/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_IMAGE_SERVICE_URL?: string;
  readonly VITE_IMAGE_SERVICE_TYPE?: string;
  readonly VITE_ENABLE_IMAGE_SERVICE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
