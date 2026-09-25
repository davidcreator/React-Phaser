import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Servidor de dev pensado para o preview do Arena (aceita host externo, bind 0.0.0.0)
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    allowedHosts: true,
  },
  build: {
    chunkSizeWarningLimit: 3000,
  },
});
