import { defineConfig } from "vite";
import path, { resolve } from "path";
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig({
  plugins: [
    viteSingleFile({
      useRecommendedBuildConfig: false,
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  build: {
    modulePreload: { polyfill: false },
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        blog: resolve(__dirname, 'blog/index.html'),
        "hello-world": resolve(__dirname, 'blog/hello-world/index.html'),
      }
    }
  }
});
