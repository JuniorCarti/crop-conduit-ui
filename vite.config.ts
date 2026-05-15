import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: "./",
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
            output: {
              manualChunks: {
                // Core vendor chunks
                "vendor-react": ["react", "react-dom", "react-router-dom"],
                "vendor-firebase": ["firebase/app", "firebase/auth", "firebase/firestore", "firebase/storage"],
                "vendor-ui": ["@radix-ui/react-dialog", "@radix-ui/react-dropdown-menu", "@radix-ui/react-tabs", "@radix-ui/react-tooltip", "@radix-ui/react-select", "@radix-ui/react-popover"],
                "vendor-charts": ["recharts", "d3-scale", "d3-shape", "d3-array"],
                "vendor-utils": ["date-fns", "zustand", "@tanstack/react-query", "zod"],
              },
            },
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
