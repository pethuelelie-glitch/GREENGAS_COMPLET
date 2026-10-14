import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

const racine = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(racine, 'src') } },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['src/test/setup.ts'],
    css: false,
    testTimeout: 30000,
    hookTimeout: 60000,
    env: {
      VITE_API_MODE: 'mock',
      VITE_API_URL: 'http://localhost:8000/api/v1',
      VITE_DATE_DEMO: '2026-09-12',
    },
  },
});
