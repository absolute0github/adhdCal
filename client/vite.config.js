import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: 'adhdcal.local',
    proxy: {
      '/api': {
        target: 'http://adhdcal.local:3001',
        changeOrigin: true
      }
    }
  }
});
