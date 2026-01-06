import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
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
      },
    },
  },
});


