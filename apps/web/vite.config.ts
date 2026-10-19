/**
 * Role: Vite build and dev-server configuration of the web client.
 * Owner: frontend
 */

import preact from '@preact/preset-vite';
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  plugins: [preact()],
  server: { port: 5173, strictPort: true },
  resolve: {
    alias: {
      '@skyline': path.resolve(__dirname, '../../../packages'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    target: 'es2023',
    assetsDir: 'assets',
  },
  worker: {
    format: 'es',
  },
});
