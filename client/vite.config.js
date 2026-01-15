import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: 'timekit.io',
    proxy: {
      '/api': {
        target: 'http://timekit.io:3001',
        changeOrigin: true
      }
    }
  }
});
