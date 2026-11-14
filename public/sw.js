// Service worker de ¿Qué vemos?: guarda la app entera al instalarse para que abra sin conexión.
// vite.config.ts rellena VERSION y ARCHIVOS (los textos entre comillas) al construir: cada versión nueva de la app
// cambia este archivo, el navegador lo detecta, instala la nueva caché y borra la vieja.
// Todo son rutas relativas a este archivo, así que vale bajo cualquier subruta (/que-vemos/).

const VERSION = '__VERSION__';
const ARCHIVOS = '__ARCHIVOS__';
const CACHE = `que-vemos-${VERSION}`;
// El catálogo cambia cada día y va aparte: no forma parte de la versión de la app, así que renovarlo no la actualiza.
const CACHE_CATALOGO = 'que-vemos-catalogo';
const URL_CATALOGO = new URL('catalogo.json', self.location.href).href;

/**
 * Descarga el catálogo y lo guarda. `no-cache` obliga a preguntar al servidor si hay uno nuevo.
 * Solo se guarda si de verdad es un catálogo: una wifi con portal de acceso devuelve su página con un 200.
 */
async function renovarCatalogo() {
  const respuesta = await fetch(URL_CATALOGO, { cache: 'no-cache' });
  const datos = respuesta.ok ? await respuesta.clone().json().catch(() => null) : null;
  if (Array.isArray(datos?.pelis) && Array.isArray(datos.series) && Array.isArray(datos.conocidos)) {
    await (await caches.open(CACHE_CATALOGO)).put(URL_CATALOGO, respuesta.clone());
  }
  return respuesta;
}

self.addEventListener('install', (evento) => {
  evento.waitUntil(
    Promise.all([
      caches
        .open(CACHE)
        // cache: 'reload' salta la caché HTTP (GitHub Pages cachea 10 min): si no, una versión nueva podría guardar un index.html viejo.
        .then((cache) => cache.addAll(ARCHIVOS.map((url) => new Request(url, { cache: 'reload' })))),
      // En la primera visita la página pidió el catálogo antes de existir este service worker: se guarda ya.
      renovarCatalogo().catch(() => {}),
    ]).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((claves) =>
        Promise.all(
          claves
            .filter((c) => c.startsWith('que-vemos-') && c !== CACHE && c !== CACHE_CATALOGO)
            .map((c) => caches.delete(c)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (evento) => {
  const peticion = evento.request;
  if (peticion.method !== 'GET' || new URL(peticion.url).origin !== self.location.origin) return;

  if (peticion.url === URL_CATALOGO) {
    // Se responde al instante con el catálogo guardado y se renueva por detrás para la próxima vez.
    evento.respondWith(
      caches.match(URL_CATALOGO, { cacheName: CACHE_CATALOGO }).then((guardado) => {
        const renovado = renovarCatalogo();
        if (!guardado) return renovado;
        evento.waitUntil(renovado.catch(() => {}));
        return guardado;
      }),
    );
    return;
  }

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
