import { defineConfig } from 'vite';

export default defineConfig({
  base: '/drone/', // Base path for GitHub Pages
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    emptyOutDir: true,
  },
  server: {
    port: 3000,
    open: true
  }
});
