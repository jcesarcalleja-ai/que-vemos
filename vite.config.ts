/// <reference types="node" />
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vitest/config';

/** Lista (rutas relativas, con "/") todos los archivos de una carpeta. */
function listar(carpeta: string, raiz = carpeta): string[] {
  return readdirSync(carpeta, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? listar(join(carpeta, e.name), raiz) : [relative(raiz, join(carpeta, e.name)).split('\\').join('/')],
  );
}

/**
 * Tras construir, rellena dist/sw.js con la lista de archivos de la app y un hash de su contenido:
 * el service worker los guarda todos para abrir sin conexión, y cambia (y se actualiza) con cada versión nueva.
 */
function precacheServiceWorker(): Plugin {
  let salida = '';
  return {
    name: 'que-vemos:precache-sw',
    apply: 'build',
    configResolved(config) {
      salida = resolve(config.root, config.build.outDir);
    },
    closeBundle() {
      // Las fuentes .woff (de respaldo) no hacen falta: todo navegador con service worker lee .woff2.
      const archivos = listar(salida).filter((f) => f !== 'sw.js' && !f.endsWith('.woff'));
      const hash = createHash('sha256');
      for (const f of archivos) hash.update(f).update(readFileSync(join(salida, f)));
      const ruta = join(salida, 'sw.js');
      const sw = readFileSync(ruta, 'utf8');
      for (const marcador of ["'__VERSION__'", "'__ARCHIVOS__'"]) {
        if (!sw.includes(marcador)) throw new Error(`public/sw.js no tiene el marcador ${marcador}`);
      }
      const lista = ['./', ...archivos].map((f) => (f === 'index.html' ? './' : f));
      writeFileSync(
        ruta,
        sw
          .replace("'__VERSION__'", JSON.stringify(hash.digest('hex').slice(0, 12)))
          .replace("'__ARCHIVOS__'", JSON.stringify([...new Set(lista)])),
      );
    },
  };
}

export default defineConfig({
  // Rutas relativas: la app se sirve bajo /que-vemos/ en GitHub Pages.
  base: './',
  plugins: [react(), precacheServiceWorker()],
});
