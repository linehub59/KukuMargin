
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["kukumargin.svg"],
      manifest: {
        name: "KukuMargin Poultry Profit Calculator",
        short_name: "KukuMargin",
        description:
          "Calculate poultry production costs, break-even prices and estimated profit.",
        theme_color: "#075c42",
        background_color: "#f5f7f3",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        scope: "/",
        icons: [
          {
            src: "/kukumargin.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,ico,png,woff2}"],
      },
    }),
  ],
});
