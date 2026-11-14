// Guardar y leer el Estado en el almacén del navegador, y exportarlo/importarlo como texto JSON.
// Todo lo que viene de fuera (almacén o archivo) pasa por `importarEstado`, la única puerta de validación.

import { GENEROS } from '../tipos';
import type { DatosPerfil, Estado, Gesto, Genero, Perfil, Tipo, Valoracion } from '../tipos';
import { estadoInicial } from './estado';

/** Lo que usamos de `localStorage`; así los tests pasan un almacén falso. */
export interface Almacen {
  getItem(clave: string): string | null;
  setItem(clave: string, valor: string): void;
}

export const CLAVE_ALMACEN = 'que-vemos:estado';

/** `localStorage`, o null si el navegador lo bloquea (modo privado, datos desactivados). */
export function almacenDelNavegador(): Almacen | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

export function exportarEstado(estado: Estado): string {
  return JSON.stringify(estado, null, 2);
}

/**
 * Convierte el texto de un archivo en un Estado válido.
 * Lanza un `Error` con un mensaje en español apto para enseñar al usuario; nunca devuelve un estado a medias.
 */
export function importarEstado(texto: string): Estado {
  let datos: unknown;
  try {
    datos = JSON.parse(texto);
  } catch {
    throw new Error('El archivo no es una copia de ¿Qué vemos?: no tiene formato JSON.');
  }
  if (!esObjeto(datos) || !('version' in datos)) {
    throw new Error('El archivo no es una copia de ¿Qué vemos?: no tiene la estructura esperada.');
  }
  if (datos.version !== 1) {
    throw new Error(`Esta copia es de otra versión (${String(datos.version)}) y esta app solo entiende la 1.`);
  }
  const tipo = elegir(datos.tipo, ['peli', 'serie'] as const, 'el tipo (pelis o series)');
  const modo = elegir(datos.modo, ['solo', 'pareja'] as const, 'el modo (solo o con tu novia)');
  const perfiles = datos.perfiles;
  if (!esObjeto(perfiles)) invalido('faltan los perfiles');
  return {
    version: 1,
    tipo,
    modo,
    perfiles: { yo: leerPerfil(perfiles.yo, 'yo'), ella: leerPerfil(perfiles.ella, 'ella') },
  };
}

/** Lee el estado guardado. Si no hay nada, o no se puede leer, devuelve el estado inicial. */
export function leerEstado(almacen: Almacen | null): Estado {
  try {
    const texto = almacen?.getItem(CLAVE_ALMACEN);
    if (texto != null) return importarEstado(texto);
  } catch {
    // Ilegible o almacén roto: se arranca de cero en vez de romper la app.
  }
  return estadoInicial();
}

/** Guarda el estado. Devuelve false si no se pudo (sin almacén, lleno o bloqueado). */
export function guardarEstado(estado: Estado, almacen: Almacen | null): boolean {
  try {
    if (!almacen) return false;
    almacen.setItem(CLAVE_ALMACEN, exportarEstado(estado));
    return true;
  } catch {
    return false;
  }
}

// --- validación ---

function invalido(motivo: string): never {
  throw new Error(`El archivo no es una copia válida de ¿Qué vemos?: ${motivo}.`);
}

function esObjeto(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function elegir<T extends string>(v: unknown, validos: readonly T[], que: string): T {
  if (!validos.includes(v as T)) invalido(`${que} no es válido`);
  return v as T;
}

function leerGeneros(v: unknown, donde: string): Genero[] {
  if (!Array.isArray(v) || !v.every((g) => (GENEROS as readonly unknown[]).includes(g))) {
    invalido(`${donde}: hay géneros desconocidos o mal escritos`);
  }
  return [...(v as Genero[])];
}

function leerValoracion(v: unknown, perfil: Perfil): Valoracion {
  if (!esObjeto(v) || typeof v.titulo !== 'string') invalido(`una nota de «${perfil}» está incompleta`);
  const titulo = v.titulo;
  const nota = v.nota;
  const notaValida = nota === 'abandonada' || (typeof nota === 'number' && Number.isInteger(nota) && nota >= 1 && nota <= 10);
  if (!notaValida) invalido(`la nota de «${titulo}» (${perfil}) tiene que ser un número del 1 al 10 o «abandonada»`);
  return {
    tipo: elegir<Tipo>(v.tipo, ['peli', 'serie'], `el tipo de «${titulo}»`),
    titulo,
    generos: leerGeneros(v.generos, `«${titulo}» (${perfil})`),
    nota: nota as Valoracion['nota'],
  };
}

function leerGesto(v: unknown, perfil: Perfil): Gesto {
  if (!esObjeto(v) || typeof v.si !== 'boolean') invalido(`un sí/no del Match de «${perfil}» está incompleto`);
  return { generos: leerGeneros(v.generos, `un sí/no del Match de «${perfil}»`), si: v.si };
}

/** Reconstruye un `Record` copiando solo lo válido; `fromEntries` define claves propias (también `__proto__`). */
function leerMapa<T>(v: unknown, leer: (x: unknown) => T, que: string): Record<string, T> {
  if (!esObjeto(v)) invalido(`faltan ${que}`);
  return Object.fromEntries(Object.entries(v).map(([id, x]) => [id, leer(x)]));
}

function leerPerfil(v: unknown, perfil: Perfil): DatosPerfil {
  if (!esObjeto(v)) invalido(`falta el perfil «${perfil}»`);
  if (typeof v.inicioHecho !== 'boolean') invalido(`al perfil «${perfil}» le falta saber si hizo el swipe inicial`);
  return {
    valoraciones: leerMapa(v.valoraciones, (x) => leerValoracion(x, perfil), `las notas de «${perfil}»`),
    gestos: leerMapa(v.gestos, (x) => leerGesto(x, perfil), `los sí/no de «${perfil}»`),
    jamas: leerGeneros(v.jamas, `los «jamás» de «${perfil}»`),
    inicioHecho: v.inicioHecho,
  };
}
