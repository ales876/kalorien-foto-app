import { readFileSync } from "node:fs";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { defineConfig } from "vitest/config";

const { version } = JSON.parse(readFileSync("./package.json", "utf-8")) as {
  version: string;
};

// Der Repo-Name bleibt "kalorien-foto-app", auch wenn die App "Sunny Orbit" heißt:
// die veröffentlichte URL https://ales876.github.io/kalorien-foto-app/ hängt daran.
const BASE = "/kalorien-foto-app/";

export default defineConfig({
  base: BASE,
  define: {
    __APP_VERSION__: JSON.stringify(version),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "apple-touch-icon.png"],
      manifest: {
        name: "Sunny Orbit",
        short_name: "Sunny Orbit",
        description:
          "Kalorien und Makros per Foto, Barcode oder Suche erfassen",
        lang: "de",
        theme_color: "#FFE680",
        background_color: "#FAFAF8",
        display: "standalone",
        orientation: "portrait",
        start_url: BASE,
        scope: BASE,
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
          {
            src: "icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,woff2}"],
        runtimeCaching: [
          {
            // Der Produktindex ändert sich nur beim Deploy — einmal laden,
            // danach aus dem Cache. So funktioniert die Suche offline.
            urlPattern: /de-foods\.json$/,
            handler: "CacheFirst",
            options: {
              cacheName: "produktindex",
              expiration: { maxEntries: 2, maxAgeSeconds: 60 * 60 * 24 * 90 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/world\.openfoodfacts\.org\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "openfoodfacts",
              expiration: { maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        // Große, selten gebrauchte Bibliotheken bekommen eigene Chunks,
        // damit der erste Start nur lädt, was der Heute-Screen braucht.
        codeSplitting: {
          groups: [
            { name: "charts", test: /node_modules[\\/]recharts/ },
            { name: "scanner", test: /node_modules[\\/]html5-qrcode/ },
            { name: "anthropic", test: /node_modules[\\/]@anthropic-ai/ },
          ],
        },
      },
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    clearMocks: true,
  },
});
