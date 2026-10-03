import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Rollback-only Pages build. The normal build is managed by the Cloudflare Vite plugin.
export default defineConfig({
  esbuild: {
    drop: ['console', 'debugger'],
  },
  plugins: [
    react(),
  ],
  build: {
    outDir: 'build',
  },
});
