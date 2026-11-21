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
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  preview: {
    host: '0.0.0.0',
    port: Number(process.env.PORT) || 4173,
    strictPort: true,
    allowedHosts: true,
  },
  // Vitest: solo los archivos *.spec.* (los *.test.js existentes usan node:test)
  test: {
    environment: 'jsdom',
    include: ['src/**/*.spec.{js,jsx}'],
    setupFiles: ['./src/test/setupVitest.js'],
    globals: true,
  },
});
