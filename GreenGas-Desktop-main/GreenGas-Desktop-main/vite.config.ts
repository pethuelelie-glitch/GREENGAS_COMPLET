import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron/simple';

const racine = path.dirname(fileURLToPath(import.meta.url));

// `--mode electron` ajoute le processus principal et le preload (dist-electron/).
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    mode === 'electron' &&
      electron({
        main: { entry: 'electron/main.ts' },
        preload: {
          input: 'electron/preload.ts',
          // Un preload « sandboxé » doit être en CommonJS.
          vite: { build: { rollupOptions: { output: { format: 'cjs', entryFileNames: '[name].cjs' } } } },
        },
      }),
  ],
  resolve: { alias: { '@': path.resolve(racine, 'src') } },
  server: { port: 5173, strictPort: true },
  build: { chunkSizeWarningLimit: 1600 },
}));
