/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_API_MODE?: 'mock' | 'reel';
  readonly VITE_DATE_DEMO?: string;
  readonly VITE_RAFRAICHISSEMENT_MS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
