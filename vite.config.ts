import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

// import build from "@hono/vite-cloudflare-pages";
// import devServer from "@hono/vite-dev-server";
// import adapter from "@hono/vite-dev-server/cloudflare";

// https://vitejs.dev/config/
export default defineConfig({
  esbuild: {
    drop: ['console', 'debugger'],
  },
  plugins: [
    react(),
    visualizer({
      filename: 'dist/bundle-visualizer.html', // 生成报告的文件路径
      open: true, // 打开生成的报告
    }),
  ],
  build: {
    outDir: 'build',
    // rollupOptions: {
    //   external: ['react', 'react-dom'],
    //   output: {
    //     format: 'umd',
    //     globals: {
    //       react: 'React',
    //       'react-dom': 'ReactDOM',
    //     },
    //   },
    // },
  },
});
