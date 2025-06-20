import { defineConfig } from 'vite';
// This project previously aliased '@' to 'src' but no files
// use that path prefix, so the alias block was removed.

export default defineConfig(({ mode }) => ({
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: '',
      },
    },
  },
  build: {
    outDir: 'dist',
  },
  base: './',
  define: {
    'process.env.NODE_ENV': JSON.stringify(
      mode === 'production' ? 'production' : 'development',
    ),
  },
}));
