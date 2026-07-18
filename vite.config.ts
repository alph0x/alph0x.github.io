import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  root: 'docs',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'docs/index.html'),
        editor: resolve(__dirname, 'docs/editor.html'),
        viewer: resolve(__dirname, 'docs/model-viewer.html'),
      },
    },
  },
});
