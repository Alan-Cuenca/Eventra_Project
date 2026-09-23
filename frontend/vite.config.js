import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Proxy para desarrollo local — redirige /api al backend en Render
    // (Axios en api.js ya apunta directo a Render; este proxy es para
    //  herramientas o peticiones que usen rutas relativas en dev)
    proxy: {
      '/api': {
        target: 'https://eventra-project-l3hl.onrender.com',
        changeOrigin: true,
        secure: true,
      },
    },
  },
});
