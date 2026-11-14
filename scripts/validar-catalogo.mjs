// Comprueba que un catalogo.json cumple el contrato de src/tipos.ts.
// Lo usa el generador antes de escribir el archivo (si algo no cuadra, no se publica nada)
// y se puede lanzar a mano: node scripts/validar-catalogo.mjs [ruta]   (por defecto public/catalogo.json)

import { readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { GENEROS } from '../src/tipos.ts';

const PLATAFORMAS = ['netflix', 'prime', 'max', 'movistar'];
const ES_URL = /^https:\/\/\S+$/;
const ES_YOUTUBE = /^https:\/\/www\.youtube\.com\/watch\?v=[\w-]{6,}$/;

const esTexto = (x) => typeof x === 'string' && x.trim() !== '';
const esEntero = (x, min) => Number.isInteger(x) && x >= min;

/** Errores de una ficha (lo mínimo común a Ficha y Titulo). */
function erroresFicha(f, tipo, anioMax) {
  const e = [];
  if (f === null || typeof f !== 'object') return ['no es un objeto'];
  if (f.tipo !== tipo) e.push(`tipo "${f.tipo}" donde se esperaba "${tipo}"`);
  if (!new RegExp(`^${tipo}-\\d+$`).test(String(f.id))) e.push(`id "${f.id}" no es "${tipo}-<número>"`);
  if (!esTexto(f.titulo)) e.push('sin título');
  if (!esEntero(f.anio, 1888) || f.anio > anioMax) e.push(`año fuera de rango: ${f.anio}`);
  if (typeof f.poster !== 'string' || !ES_URL.test(f.poster)) e.push(`póster no válido: ${f.poster}`);
  if (!Array.isArray(f.generos) || f.generos.length === 0) e.push('sin géneros');
  else {
    const raros = f.generos.filter((g) => !GENEROS.includes(g));
    if (raros.length) e.push(`géneros fuera del vocabulario: ${raros.join(', ')}`);
    if (new Set(f.generos).size !== f.generos.length) e.push('géneros repetidos');
  }
  return e;
}

function erroresTitulo(t, tipo, anioMax) {
  const e = erroresFicha(t, tipo, anioMax);
  if (t === null || typeof t !== 'object') return e;
  if (typeof t.nota !== 'number' || !(t.nota >= 0 && t.nota <= 10)) e.push(`nota fuera de 0-10: ${t.nota}`);
  if (!esTexto(t.sinopsis)) e.push('sin sinopsis');
  if (!PLATAFORMAS.includes(t.plataforma)) e.push(`plataforma desconocida: ${t.plataforma}`);
  if (typeof t.enlace !== 'string' || !ES_URL.test(t.enlace)) e.push(`enlace no válido: ${t.enlace}`);
  if (t.trailer !== null && !(typeof t.trailer === 'string' && ES_YOUTUBE.test(t.trailer))) e.push(`tráiler no válido: ${t.trailer}`);
  if (tipo === 'peli') {
    if (!esEntero(t.duracionMin, 1)) e.push(`peli sin duración válida: ${t.duracionMin}`);
    if (t.temporadas !== undefined || t.episodios !== undefined) e.push('peli con temporadas o episodios');
  } else {
    if (!esEntero(t.temporadas, 1)) e.push(`serie sin temporadas válidas: ${t.temporadas}`);
    if (!esEntero(t.episodios, 1)) e.push(`serie sin episodios válidos: ${t.episodios}`);
    if (t.duracionMin !== undefined) e.push('serie con duración de peli');
  }
  return e;
}

/** Devuelve la lista de problemas del catálogo (vacía si todo cumple el contrato). */
export function validarCatalogo(c) {
  const errores = [];
  if (c === null || typeof c !== 'object') return ['el catálogo no es un objeto'];
  if (!esTexto(c.generado) || Number.isNaN(Date.parse(c.generado))) errores.push('falta la fecha "generado"');
  const anioMax = new Date().getFullYear() + 2;
  const ids = new Set();
  const revisar = (lista, nombre, tipo, revisarUno) => {
    if (!Array.isArray(lista)) return errores.push(`"${nombre}" no es una lista`);
    lista.forEach((x, i) => {
      for (const m of revisarUno(x, tipo, anioMax)) errores.push(`${nombre}[${i}] (${x?.id ?? '?'} ${x?.titulo ?? ''}): ${m}`);
      if (nombre !== 'conocidos') {
        if (ids.has(x?.id)) errores.push(`${nombre}[${i}]: id repetido ${x?.id}`);
        ids.add(x?.id);
      }
    });
  };
  revisar(c.pelis, 'pelis', 'peli', erroresTitulo);
  revisar(c.series, 'series', 'serie', erroresTitulo);
  if (!Array.isArray(c.conocidos)) errores.push('"conocidos" no es una lista');
  else {
    c.conocidos.forEach((x, i) => {
      const m = erroresFicha(x, x?.tipo === 'serie' ? 'serie' : 'peli', anioMax);
      for (const msg of m) errores.push(`conocidos[${i}] (${x?.id ?? '?'} ${x?.titulo ?? ''}): ${msg}`);
    });
    if (new Set(c.conocidos.map((x) => x?.id)).size !== c.conocidos.length) errores.push('conocidos con ids repetidos');
  }
  return errores;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const ruta = process.argv[2] ?? fileURLToPath(new URL('../public/catalogo.json', import.meta.url));
  const c = JSON.parse(readFileSync(ruta, 'utf8'));
  const errores = validarCatalogo(c);
  if (errores.length) {
    console.error(`${errores.length} problemas en ${ruta}:\n- ${errores.slice(0, 30).join('\n- ')}`);
    process.exit(1);
  }
  console.log(`OK: ${c.pelis.length} pelis, ${c.series.length} series y ${c.conocidos.length} conocidos cumplen el contrato (${ruta}).`);
}
