import { defineConfig } from "vite";
import path, { resolve } from "path";
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig({
  root: "website",
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
        main: resolve(__dirname, 'website/index.html'),
        blog: resolve(__dirname, 'website/blog/index.html'),
        "hello-world": resolve(__dirname, 'website/blog/hello-world/index.html'),
      }
    }
  }
});
