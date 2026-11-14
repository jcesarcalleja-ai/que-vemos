// Service worker de ¿Qué vemos?: guarda la app entera al instalarse para que abra sin conexión.
// vite.config.ts rellena VERSION y ARCHIVOS (los textos entre comillas) al construir: cada versión nueva de la app
// cambia este archivo, el navegador lo detecta, instala la nueva caché y borra la vieja.
// Todo son rutas relativas a este archivo, así que vale bajo cualquier subruta (/que-vemos/).

const VERSION = '__VERSION__';
const ARCHIVOS = '__ARCHIVOS__';
const CACHE = `que-vemos-${VERSION}`;

self.addEventListener('install', (evento) => {
  evento.waitUntil(
    caches
      .open(CACHE)
      // cache: 'reload' salta la caché HTTP (GitHub Pages cachea 10 min): si no, una versión nueva podría guardar un index.html viejo.
      .then((cache) => cache.addAll(ARCHIVOS.map((url) => new Request(url, { cache: 'reload' }))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((claves) =>
        Promise.all(claves.filter((c) => c.startsWith('que-vemos-') && c !== CACHE).map((c) => caches.delete(c))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (evento) => {
  const peticion = evento.request;
  if (peticion.method !== 'GET' || new URL(peticion.url).origin !== self.location.origin) return;
  evento.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const guardada = await cache.match(peticion, { ignoreSearch: true });
      if (guardada) return guardada;
      try {
        return await fetch(peticion);
      } catch (error) {
        // Sin red y sin copia: para una página, la app; para lo demás, el fallo de siempre.
        if (peticion.mode === 'navigate') {
          const inicio = await cache.match('./');
          if (inicio) return inicio;
        }
        throw error;
      }
    }),
  );
});
