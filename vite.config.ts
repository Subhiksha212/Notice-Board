import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// Set the base path to the repository name for GitHub Pages deployment
const REPO_NAME = "/Notice-Board/"; 

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // ------------------------------------------------------------------
  // 🚀 CRITICAL FIX: Add the 'base' property
  base: REPO_NAME,
  // ------------------------------------------------------------------
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));