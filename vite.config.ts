import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// import build from "@hono/vite-cloudflare-pages";
// import devServer from "@hono/vite-dev-server";
// import adapter from "@hono/vite-dev-server/cloudflare";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'build',
  },
});
