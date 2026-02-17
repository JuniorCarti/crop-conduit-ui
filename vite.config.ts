import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  build: {
    sourcemap: false,
    minify: "esbuild",
    ...(mode === "production"
      ? {
          target: "es2020",
          rollupOptions: {
            treeshake: true,
          },
        }
      : {}),
  },
  esbuild: mode === "production" ? { drop: ["console", "debugger"] } : undefined,
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
