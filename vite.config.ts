import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import basicSsl from "@vitejs/plugin-basic-ssl";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    basicSsl(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: "autoUpdate",
      includeAssets: [
        "favicon.ico",
        "leadbox-icon.svg",
        "apple-touch-icon-180x180.png",
      ],
      manifest: {
        name: "Leadbox - Lead Management CRM",
        short_name: "Leadbox",
        description: "Manage and track your sales leads efficiently with Leadbox CRM.",
        theme_color: "#0d9488",
        background_color: "#f0fdfa",
        display: "standalone",
        scope: "/",
        start_url: "/",
        orientation: "portrait-primary",
        categories: ["business", "productivity"],
        icons: [
          {
            src: "pwa-64x64.png",
            sizes: "64x64",
            type: "image/png",
          },
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "maskable-icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      devOptions: {
        enabled: true, // Enable PWA in dev mode for testing
      },
    }),
  ],
  server: {
    host: '0.0.0.0', // Listen on all interfaces for local network access
    port: 5173
  },
  build: {
    // Production build optimizations using esbuild (built into Vite)
    minify: 'esbuild',
    sourcemap: false, // Disable sourcemaps in production for security
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          bootstrap: ['react-bootstrap', 'bootstrap'],
          charts: ['recharts', 'apexcharts', 'react-apexcharts']
        }
      }
    }
  },
  esbuild: {
    drop: ['console', 'debugger'], // Remove console.log and debugger in production
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@import "bootstrap/scss/functions";`,
        quietDeps: true, // Suppresses warnings from dependencies
        silenceDeprecations: ['import'], // Silence @import deprecation until Bootstrap migrates to @use
      },
    },
  },
});


