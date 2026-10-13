import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: resolve(__dirname, '../../apps/web'),
  base: '/',
  publicDir: resolve(__dirname, '../../public-assets'),
  build: {
    outDir: resolve(__dirname, '../../dist/web'),
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, '../../apps/web/index.html')
      }
    }
  }
});