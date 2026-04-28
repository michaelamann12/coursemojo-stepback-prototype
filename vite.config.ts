import path from "node:path";
import { defineConfig } from "vite";
import preact from "@preact/preset-vite";

// https://vite.dev/config/
export default defineConfig({
  // Served from /coursemojo-stepback-prototype/ on GitHub Pages.
  // Override locally with VITE_BASE=/ for plain dev if needed.
  base: process.env.VITE_BASE ?? "/coursemojo-stepback-prototype/",
  plugins: [preact()],
  server: {
    host: "0.0.0.0",
    cors: true,
    port: 5173,
    proxy: {
      "/graphql": "http://localhost:5001",
    },
  },
  resolve: {
    alias: {
      "@components": path.resolve(__dirname, "./src/components"),
      "@styles": path.resolve(__dirname, "./src/styles"),
      "@lib": path.resolve(__dirname, "./src/lib"),
    },
  },
});
