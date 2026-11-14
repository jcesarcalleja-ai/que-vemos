// Prepara public/catalogo.json: los títulos que hoy están por suscripción en Netflix, Prime Video, HBO Max
// o Movistar Plus+ en España, con la nota de IMDb. La app no llama a ninguna API: solo lee ese archivo.
//
// Uso:  node --env-file=.env.local scripts/generar-catalogo.mjs      (en local)
//       node scripts/generar-catalogo.mjs                            (en GitHub Actions, con TMDB_API_KEY en el entorno)
//
// Fuentes: TMDB (catálogo, textos, tráiler, disponibilidad), el volcado público de notas de IMDb y
// Wikidata (solo para enlazar a la ficha de Netflix; si falla, se enlaza a la búsqueda).
// Si algo falla o salen muy pocos títulos, termina con error y NO toca el catalogo.json anterior.

import { mkdirSync, renameSync, statSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { erroresTitulo, validarCatalogo } from './validar-catalogo.mjs';

const SALIDA = fileURLToPath(new URL('../public/catalogo.json', import.meta.url));

// ── Qué entra en el catálogo ────────────────────────────────────────────────────────────────────
// Por plataforma y tipo se piden dos listas (20 títulos por página): las más votadas (clásicos y éxitos) y las
// más populares ahora (novedades), las dos con un mínimo de votos y de nota en TMDB para que no entre relleno.
const PLATAFORMAS = {
  netflix: '8',
  prime: '119',
  max: '1899', // HBO Max
  movistar: '2241|149', // Movistar Plus+ y Movistar Plus+ Ficción Total
};
// Si un título está en varias, gana la primera de esta lista (Prime, la más grande, la última).
const PRIORIDAD = ['netflix', 'max', 'movistar', 'prime'];
const BUSQUEDA = {
  netflix: (q) => `https://www.netflix.com/search?q=${q}`,
  prime: (q) => `https://www.primevideo.com/search/?phrase=${q}`,
  max: (q) => `https://www.hbomax.com/search?q=${q}`,
  movistar: (q) => `https://www.movistarplus.es/buscador?q=${q}`,
};
const LISTAS = {
  peli: { ruta: 'movie', masVotadas: { paginas: 10, votos: 500 }, populares: { paginas: 4, votos: 150 } },
  serie: { ruta: 'tv', masVotadas: { paginas: 8, votos: 250 }, populares: { paginas: 3, votos: 100 } },
};
const NOTA_TMDB_MIN = 6.3; // en el filtro de TMDB
const NOTA_MIN = 6.0; // sobre la nota final (IMDb si la hay)
const MINIMO = { pelis: 300, series: 150, porPlataforma: 20, conocidos: 15 }; // por debajo, algo va mal: error

// Títulos muy conocidos para el primer swipe (id de TMDB), estén o no en las plataformas.
const CONOCIDOS = {
  peli: [
    597, // Titanic
    13, // Forrest Gump
    680, // Pulp Fiction
    862, // Toy Story
    27205, // Origen
    808, // Shrek
    238, // El padrino
    105, // Regreso al futuro
    8587, // El rey león
    603, // Matrix
    694, // El resplandor
    18785, // Resacón en Las Vegas
  ],
  serie: [
    1668, // Friends
    1396, // Breaking Bad
    1399, // Juego de tronos
    66732, // Stranger Things
    2316, // The Office (EE. UU.)
    71446, // La casa de papel
    456, // Los Simpson
    42009, // Black Mirror
  ],
};

// Géneros de TMDB (por id, que no cambia con el idioma) → vocabulario de GENEROS. Los que no tienen equivalente
// (película de TV, noticias, talk show, telenovela) se ignoran.
const GENERO = {
  28: ['Acción'],
  12: ['Aventura'],
  16: ['Animación'],
  35: ['Comedia'],
  80: ['Crimen'],
  99: ['Documental'],
  18: ['Drama'],
  10751: ['Familia'],
  14: ['Fantasía'],
  36: ['Historia'],
  27: ['Terror'],
  10402: ['Música'],
  9648: ['Misterio'],
  10749: ['Romance'],
  878: ['Ciencia ficción'],
  53: ['Suspense'],
  10752: ['Bélica'],
  37: ['Western'],
  // Solo series
  10759: ['Acción', 'Aventura'], // Action & Adventure
  10762: ['Familia'], // Kids
  10764: ['Reality'],
  10765: ['Ciencia ficción', 'Fantasía'], // Sci-Fi & Fantasy
  10768: ['Bélica'], // War & Politics
};

export function traducirGeneros(idsTmdb) {
  return [...new Set(idsTmdb.flatMap((id) => GENERO[id] ?? []))];
}

/** Mejor tráiler de YouTube: en español (de España primero), si no en el idioma original, si no en inglés. */
export function elegirTrailer(videos, idiomaOriginal) {
  const rango = (v) => {
    const idioma = v.iso_639_1;
    const lugar = idioma === 'es' ? (v.iso_3166_1 === 'ES' ? 0 : 1) : idioma === idiomaOriginal ? 2 : idioma === 'en' ? 3 : 4;
    return lugar * 2 + (v.type === 'Trailer' ? 0 : 1);
  };
  const mejor = videos
    .filter((v) => v.site === 'YouTube' && /^[\w-]{6,}$/.test(v.key ?? '') && (v.type === 'Trailer' || v.type === 'Teaser'))
    .sort((a, b) => rango(a) - rango(b) || Number(b.official) - Number(a.official) || String(b.published_at).localeCompare(String(a.published_at)))[0];
  return mejor ? `https://www.youtube.com/watch?v=${mejor.key}` : null;
}

// ── Red: reintenta los fallos pasajeros y nunca deja la clave en un mensaje de error ──────────────
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

async function pedir(url, { etiqueta, binario = false, init = {}, permitir404 = false }) {
  let ultimo = '';
  for (let intento = 1; intento <= 5; intento++) {
    let espera = 1000 * 2 ** (intento - 1);
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(60_000), ...init });
      if (r.ok) return binario ? Buffer.from(await r.arrayBuffer()) : await r.json();
      if (r.status === 404 && permitir404) return null;
      ultimo = `HTTP ${r.status}`;
      if (r.status !== 429 && r.status < 500) throw Object.assign(new Error(`${etiqueta}: ${ultimo}`), { definitivo: true });
      espera = Math.max(espera, Number(r.headers.get('retry-after') ?? 0) * 1000);
    } catch (e) {
      if (e.definitivo) throw e;
      ultimo = e.cause?.code ?? e.name; // sin e.message: podría llevar la dirección completa
    }
    if (intento < 5) await esperar(espera);
  }
  throw new Error(`${etiqueta}: sigue fallando tras 5 intentos (${ultimo})`);
}

async function enParalelo(lista, n, fn) {
  const salida = new Array(lista.length);
  let siguiente = 0;
  await Promise.all(
    Array.from({ length: n }, async () => {
      while (siguiente < lista.length) {
        const i = siguiente++;
        salida[i] = await fn(lista[i], i);
      }
    }),
  );
  return salida;
}

function crearTmdb(clave) {
  return (ruta, params = {}) => {
    const url = new URL(`https://api.themoviedb.org/3${ruta}`);
    url.searchParams.set('api_key', clave);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
    return pedir(url, { etiqueta: `TMDB ${ruta}`, permitir404: true });
  };
}

// ── Pasos ───────────────────────────────────────────────────────────────────────────────────────
async function buscarCandidatos(tmdb) {
  const candidatos = new Map(); // `${tipo}-${id}` → { tipo, id, plataformas: Set, item }
  const trabajos = [];
  for (const [tipo, cfg] of Object.entries(LISTAS)) {
    for (const [plataforma, proveedores] of Object.entries(PLATAFORMAS)) {
      for (const [orden, { paginas, votos }] of [
        ['vote_count.desc', cfg.masVotadas],
        ['popularity.desc', cfg.populares],
      ]) {
        for (let pagina = 1; pagina <= paginas; pagina++) trabajos.push({ tipo, cfg, plataforma, proveedores, orden, votos, pagina });
      }
    }
  }
  const paginas = await enParalelo(trabajos, 8, (t) =>
    tmdb(`/discover/${t.cfg.ruta}`, {
      watch_region: 'ES',
      with_watch_providers: t.proveedores,
      with_watch_monetization_types: 'flatrate',
      language: 'es-ES',
      include_adult: false,
      sort_by: t.orden,
      page: t.pagina,
      'vote_count.gte': t.votos,
      'vote_average.gte': NOTA_TMDB_MIN,
      ...(t.tipo === 'peli' ? { 'with_runtime.gte': 60 } : {}),
    }),
  );
  paginas.forEach((p, i) => {
    const { tipo, plataforma } = trabajos[i];
    for (const item of p?.results ?? []) {
      if (item.adult || !item.poster_path || !item.overview?.trim()) continue; // sin póster o sin sinopsis en español
      const clave = `${tipo}-${item.id}`;
      const c = candidatos.get(clave) ?? { tipo, id: item.id, plataformas: new Set(), item };
      c.plataformas.add(plataforma);
      candidatos.set(clave, c);
    }
  });
  return [...candidatos.values()];
}

/** Ficha completa de TMDB (en español) con duración o temporadas, id de IMDb y vídeos. */
async function detalle(tmdb, tipo, id) {
  const ruta = `/${LISTAS[tipo].ruta}/${id}`;
  const d = await tmdb(ruta, { language: 'es-ES', append_to_response: 'external_ids,videos', include_video_language: 'es,en,null' });
  if (!d) return null;
  let videos = d.videos?.results ?? [];
  let trailer = elegirTrailer(videos, d.original_language);
  if (!trailer && !['es', 'en'].includes(d.original_language)) {
    const v = await tmdb(`${ruta}/videos`, { include_video_language: d.original_language });
    trailer = elegirTrailer(v?.results ?? [], d.original_language);
  }
  return { ...d, trailer, imdb: d.external_ids?.imdb_id || null };
}

function titulo(d, tipo) {
  const anio = Number((d.release_date ?? d.first_air_date ?? '').slice(0, 4));
  return {
    id: `${tipo}-${d.id}`,
    tipo,
    titulo: (d.title ?? d.name ?? '').trim(),
    anio,
    poster: d.poster_path ? `https://image.tmdb.org/t/p/w500${d.poster_path}` : null,
    generos: traducirGeneros((d.genres ?? []).map((g) => g.id)),
  };
}

async function notasImdb(ids) {
  console.log('Descargando las notas de IMDb…');
  const buf = await pedir('https://datasets.imdbws.com/title.ratings.tsv.gz', { etiqueta: 'IMDb title.ratings', binario: true });
  const notas = new Map();
  for (const linea of gunzipSync(buf).toString('utf8').split('\n')) {
    const [id, nota] = linea.split('\t');
    if (ids.has(id)) notas.set(id, Number(nota));
  }
  if (notas.size < ids.size * 0.5) throw new Error(`IMDb: solo ${notas.size} notas para ${ids.size} títulos; el volcado parece incompleto`);
  return notas;
}

/** id de IMDb → id de Netflix, desde Wikidata. Si falla o es ambiguo, ese título se enlaza a la búsqueda. */
async function idsNetflix(imdbIds) {
  const netflix = new Map();
  try {
    for (let i = 0; i < imdbIds.length; i += 150) {
      const lote = imdbIds.slice(i, i + 150);
      const consulta = `SELECT ?imdb ?nf WHERE { VALUES ?imdb { ${lote.map((x) => `"${x}"`).join(' ')} } ?e wdt:P345 ?imdb ; wdt:P1874 ?nf }`;
      const r = await pedir('https://query.wikidata.org/sparql', {
        etiqueta: 'Wikidata',
        init: {
          method: 'POST',
          headers: {
            'User-Agent': 'que-vemos-catalogo/1.0 (https://github.com/jcesarcalleja-ai/que-vemos)',
            Accept: 'application/sparql-results+json',
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({ query: consulta }),
        },
      });
      const ids = new Map();
      for (const b of r.results.bindings) ids.set(b.imdb.value, new Set([...(ids.get(b.imdb.value) ?? []), b.nf.value]));
      for (const [imdb, conjunto] of ids) if (conjunto.size === 1) netflix.set(imdb, [...conjunto][0]);
    }
  } catch (e) {
    console.warn(`Aviso: sin fichas directas de Netflix (${e.message}); se usará la búsqueda.`);
  }
  return netflix;
}

function contar(lista, f) {
  const r = {};
  for (const x of lista) r[f(x)] = (r[f(x)] ?? 0) + 1;
  return r;
}

// ── Programa principal ──────────────────────────────────────────────────────────────────────────
export async function generar() {
  const clave = process.env.TMDB_API_KEY?.trim();
  if (!clave) throw new Error('Falta la variable TMDB_API_KEY (en local, ponla en .env.local y lanza el script con --env-file=.env.local).');
  const tmdb = crearTmdb(clave);

  console.log('Buscando títulos disponibles en España…');
  const candidatos = await buscarCandidatos(tmdb);
  console.log(`${candidatos.length} candidatos. Leyendo sus fichas…`);
  const fichas = await enParalelo(candidatos, 8, (c) => detalle(tmdb, c.tipo, c.id));

  const imdbIds = new Set(fichas.map((d) => d?.imdb).filter(Boolean));
  const notas = await notasImdb(imdbIds);

  let titulos = [];
  fichas.forEach((d, i) => {
    if (!d?.overview?.trim() || !d.poster_path) return;
    const { tipo, plataformas } = candidatos[i];
    const base = titulo(d, tipo);
    const imdb = d.imdb && notas.has(d.imdb) ? notas.get(d.imdb) : null;
    const nota = Math.round((imdb ?? d.vote_average) * 10) / 10;
    if (!base.titulo || !base.anio || base.generos.length === 0 || !(nota >= NOTA_MIN)) return;
    const plataforma = PRIORIDAD.find((p) => plataformas.has(p));
    const extra =
      tipo === 'peli'
        ? { duracionMin: d.runtime }
        : { temporadas: d.number_of_seasons, episodios: d.number_of_episodes };
    if (!Object.values(extra).every((x) => x > 0)) return;
    titulos.push({ ...base, nota, imdb: Boolean(imdb), sinopsis: d.overview.trim(), plataforma, enlace: '', trailer: d.trailer, ...extra, _imdb: d.imdb });
  });

  const netflix = await idsNetflix(titulos.filter((t) => t.plataforma === 'netflix' && t._imdb).map((t) => t._imdb));
  for (const t of titulos) {
    const ficha = t.plataforma === 'netflix' && netflix.get(t._imdb);
    t.enlace = /^\d+$/.test(ficha || '') ? `https://www.netflix.com/title/${ficha}` : BUSQUEDA[t.plataforma](encodeURIComponent(t.titulo));
  }
  const ordenar = (a, b) => b.nota - a.nota || a.titulo.localeCompare(b.titulo, 'es');
  const publico = ({ imdb: _a, _imdb, ...resto }) => resto; // lo que no es del contrato no va al archivo

  // Un título con un dato raro se descarta él solo: no debe dejar sin catálogo a todos los demás.
  titulos = titulos.filter((t) => {
    const errores = erroresTitulo(publico(t), t.tipo);
    if (errores.length) console.warn(`Aviso: se descarta ${t.id} (${t.titulo}): ${errores.join('; ')}`);
    return errores.length === 0;
  });

  const conocidos = (
    await enParalelo(
      Object.entries(CONOCIDOS).flatMap(([tipo, ids]) => ids.map((id) => ({ tipo, id }))),
      8,
      async ({ tipo, id }) => {
        const d = await detalle(tmdb, tipo, id);
        const f = d && titulo(d, tipo);
        if (f?.poster && f.generos.length > 0 && f.anio) return f;
        console.warn(`Aviso: no se pudo preparar el título conocido ${tipo}-${id}; se omite.`);
        return null;
      },
    )
  ).filter(Boolean);
  if (conocidos.length < MINIMO.conocidos) throw new Error(`Solo ${conocidos.length} títulos conocidos (mínimo ${MINIMO.conocidos}). No se escribe nada.`);
  // Pelis y series alternadas, para que el swipe inicial no sea una tanda de lo mismo.
  const pc = conocidos.filter((f) => f.tipo === 'peli');
  const sc = conocidos.filter((f) => f.tipo === 'serie');
  const mezcla = Array.from({ length: Math.max(pc.length, sc.length) }, (_, i) => [pc[i], sc[i]]).flat().filter(Boolean);

  const catalogo = {
    generado: new Date().toISOString(),
    pelis: titulos.filter((t) => t.tipo === 'peli').sort(ordenar).map(publico),
    series: titulos.filter((t) => t.tipo === 'serie').sort(ordenar).map(publico),
    conocidos: mezcla,
  };

  // Comprobaciones antes de escribir nada
  const problemas = validarCatalogo(catalogo);
  if (problemas.length) throw new Error(`El catálogo generado no cumple el contrato (${problemas.length} problemas):\n- ${problemas.slice(0, 15).join('\n- ')}`);
  if (catalogo.pelis.length < MINIMO.pelis || catalogo.series.length < MINIMO.series) {
    throw new Error(`Salen muy pocos títulos (${catalogo.pelis.length} pelis y ${catalogo.series.length} series; mínimo ${MINIMO.pelis} y ${MINIMO.series}). No se escribe nada.`);
  }
  for (const p of PRIORIDAD) {
    const n = [...catalogo.pelis, ...catalogo.series].filter((t) => t.plataforma === p).length;
    if (n < MINIMO.porPlataforma) throw new Error(`Solo ${n} títulos en ${p} (mínimo ${MINIMO.porPlataforma}). No se escribe nada.`);
  }

  // Se escribe a un archivo temporal y se renombra: nunca queda un catalogo.json a medias.
  mkdirSync(dirname(SALIDA), { recursive: true });
  const temporal = `${SALIDA}.tmp`;
  writeFileSync(temporal, JSON.stringify(catalogo));
  renameSync(temporal, SALIDA);

  const todos = titulos;
  console.log(`\nEscrito ${SALIDA} (${(statSync(SALIDA).size / 1024).toFixed(0)} KB)`);
  console.log(`Pelis: ${catalogo.pelis.length} · Series: ${catalogo.series.length} · Conocidos: ${catalogo.conocidos.length}`);
  for (const tipo of ['peli', 'serie']) {
    console.log(`Por plataforma (${tipo}s):`, contar(todos.filter((t) => t.tipo === tipo), (t) => t.plataforma));
  }
  console.log(`Con nota de IMDb: ${todos.filter((t) => t.imdb).length} de ${todos.length}`);
  console.log(`Con tráiler: ${todos.filter((t) => t.trailer).length} de ${todos.length}`);
  console.log(`Netflix con ficha directa: ${todos.filter((t) => t.enlace.includes('/title/')).length} de ${todos.filter((t) => t.plataforma === 'netflix').length}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  generar().catch((e) => {
    console.error(`\nERROR: ${e.message}`);
    process.exit(1);
  });
}
