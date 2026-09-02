import { readFileSync } from "node:fs";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

const { version } = JSON.parse(readFileSync("./package.json", "utf-8")) as {
  version: string;
};

// Repo-Name als Basis, weil die App unter
// https://<user>.github.io/kalorien-foto-app/ liegt.
export default defineConfig({
  base: "/kalorien-foto-app/",
  define: {
    __APP_VERSION__: JSON.stringify(version),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "apple-touch-icon.png"],
      manifest: {
        name: "Kcal-Scanner",
        short_name: "Kcal",
        description: "Kalorien und Makros per Foto, Barcode oder Suche erfassen",
        lang: "de",
        theme_color: "#FFD400",
        background_color: "#FAFAF8",
        display: "standalone",
        orientation: "portrait",
        start_url: "/kalorien-foto-app/",
        scope: "/kalorien-foto-app/",
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
            // Produktdaten dürfen ruhig aus dem Cache kommen, wenn offline.
            urlPattern: /^https:\/\/(world|search)\.openfoodfacts\.org\/.*/i,
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
});
