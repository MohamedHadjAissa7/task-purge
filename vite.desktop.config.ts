import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import path from "node:path";

// Standalone offline build used to package MyMind as a desktop (Electron) app.
export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss(), tsconfigPaths()],
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  publicDir: path.resolve(__dirname, "public"),
  build: {
    outDir: "dist-desktop",
    emptyOutDir: true,
    rollupOptions: { input: path.resolve(__dirname, "desktop/index.html") },
  },
});
