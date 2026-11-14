import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Rutas relativas: la app se sirve bajo /que-vemos/ en GitHub Pages.
  base: './',
  plugins: [react()],
});
