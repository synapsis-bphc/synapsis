// vite.config.js

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "localhost",
    port: 8080,
    proxy: {
      '/functions/v1': {
        target: 'https://noyakctxnzehdvbvbzga.supabase.co', // Your Supabase project URL
        changeOrigin: true, // Needed for CORS
        rewrite: (path) => path.replace(/^\/functions\/v1/, '/functions/v1'), // Ensure the path is correct
        // If you encounter SSL certificate issues in development, you might need:
        // secure: false,
      },
    },
  },
  plugins: [
    react()
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
