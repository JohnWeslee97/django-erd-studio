import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  
  // Use relative paths so Flask can serve the built files correctly 
  // from its static directory regardless of the URL path
  base: './',
  
  build: {
    // Output the built frontend directly into the Python package's static directory
    outDir: '../django_erd_studio/static',
    // Clean the static directory before building
    emptyOutDir: true,
  },
  
  server: {
    // Proxy API requests to the Flask server during React development
    proxy: {
      '/api': {
        target: 'http://localhost:8765',
        changeOrigin: true,
        secure: false,
      }
    }
  }
});
