import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  base: process.env.VITE_BASE_PATH || '/',
  plugins: [react()],
  resolve: {
    alias: {
      '@swisseph/browser': path.resolve(__dirname, 'src/noop-swisseph.ts'),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
});
