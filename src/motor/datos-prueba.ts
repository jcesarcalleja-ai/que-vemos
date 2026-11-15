// Ayudas solo para los tests del motor.

import { valorar } from '../estado';
import type { Estado, Genero, Modo, Titulo } from '../tipos';

/** Un martes a las 21:00 (entre semana). */
export const MARTES_21 = new Date(2026, 10, 17, 21, 0);
/** La noche del martes, pasada la medianoche (sigue siendo la misma noche). */
export const MIERCOLES_02 = new Date(2026, 10, 18, 2, 0);
export const SABADO_21 = new Date(2026, 10, 14, 21, 0);
export const SABADO_2330 = new Date(2026, 10, 14, 23, 30);

export function peli(n: string, extra: Partial<Titulo> = {}): Titulo {
  return {
    id: `peli-${n}`,
    tipo: 'peli',
    titulo: `Peli ${n}`,
    anio: 2020,
    poster: null,
    generos: ['Drama'],
    nota: 7,
    sinopsis: '',
    plataforma: 'netflix',
    enlace: 'https://example.com',
    trailer: null,
    duracionMin: 120,
    ...extra,
  };
}

export function serie(n: string, extra: Partial<Titulo> = {}): Titulo {
  return {
    ...peli(n),
    id: `serie-${n}`,
    tipo: 'serie',
    duracionMin: undefined,
    temporadas: 4,
    episodios: 40,
    ...extra,
  };
}

export function estadoVacio(modo: Modo = 'solo'): Estado {
  const perfil = () => ({ valoraciones: {}, gestos: {}, jamas: [], inicioHecho: true });
  return { version: 1, tipo: 'peli', modo, perfiles: { yo: perfil(), ella: perfil() }, animo: null };
}

/** `cantidad` pelis distintas, con nota creciente (1, 2, 3…) para que el orden sea claro. */
export function pelisConNotaCreciente(cantidad: number): Titulo[] {
  return Array.from({ length: cantidad }, (_, i) => peli(String(i + 1).padStart(2, '0'), { nota: i + 1 }));
}

/** `cantidad` títulos distintos con las mismas características: para comparar dos grupos sin que el azar de una noche decida. */
export function clones(prefijo: string, cantidad: number, plantilla: Titulo): Titulo[] {
  return Array.from({ length: cantidad }, (_, i) => ({
    ...plantilla,
    id: `${plantilla.tipo}-${prefijo}${i}`,
    titulo: `${prefijo} ${i}`,
  }));
}

/** Generador pseudoaleatorio con semilla (mulberry32): el mismo catálogo en cada ejecución. */
function azar(semilla: number): () => number {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const GENEROS_PELI: [Genero, number][] = [
  ['Drama', 200], ['Acción', 190], ['Suspense', 160], ['Aventura', 150], ['Comedia', 145], ['Ciencia ficción', 110],
  ['Crimen', 100], ['Fantasía', 90], ['Terror', 70], ['Animación', 60], ['Familia', 60], ['Misterio', 60],
  ['Romance', 55], ['Historia', 25], ['Bélica', 25],
];
const GENEROS_SERIE: [Genero, number][] = [
  ['Drama', 330], ['Ciencia ficción', 180], ['Fantasía', 180], ['Comedia', 150], ['Acción', 145], ['Aventura', 145],
  ['Crimen', 120], ['Animación', 110], ['Misterio', 100], ['Familia', 50], ['Bélica', 12],
];

function sortearGeneros(r: () => number, tabla: [Genero, number][], cantidad: number): Genero[] {
  const elegidos: Genero[] = [];
  while (elegidos.length < cantidad) {
    let x = r() * tabla.reduce((s, [, p]) => s + p, 0);
    const g = tabla.find(([, p]) => (x -= p) < 0)![0];
    if (!elegidos.includes(g)) elegidos.push(g);
  }
  return elegidos;
}

/** Normal de media `m` y desviación `d`, recortada a [min, max] y con un decimal. */
function normal(r: () => number, m: number, d: number, min: number, max: number): number {
  const z = Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
  return Math.round(Math.min(max, Math.max(min, m + d * z)) * 10) / 10;
}

/**
 * Un catálogo con la forma del real (unos 550 pelis y 480 series): notas de 6 a 9,5 con pocas muy altas,
 * 1 a 5 géneros por título, y lo corto algo peor valorado que lo largo, que es lo que lo hace difícil.
 */
export function catalogoSintetico(semilla: number): { pelis: Titulo[]; series: Titulo[] } {
  const r = azar(semilla);
  const pelis = Array.from({ length: 550 }, (_, i) => {
    const duracionMin = Math.round(normal(r, 121, 22, 75, 209));
    const corta = duracionMin < 105;
    return peli(`s${semilla}-${i}`, {
      nota: normal(r, corta ? 7.1 : 7.35, 0.7, 6, 9.3),
      duracionMin,
      generos: sortearGeneros(r, GENEROS_PELI, 1 + Math.floor(r() * r() * 5 + r() * 2)),
    });
  });
  const series = Array.from({ length: 480 }, (_, i) => {
    const mini = r() < 0.08; // miniseries: pocas temporadas y menos de 10 episodios
    const temporadas = mini ? 1 + Math.floor(r() * 3) : Math.max(1, Math.round(Math.exp(1.4 + 0.7 * normal(r, 0, 1, -3, 3))));
    const episodios = mini ? 4 + Math.floor(r() * 6) : Math.max(5, Math.round(temporadas * (5 + r() * 15)));
    const corta = temporadas <= 1 || episodios < 10;
    return serie(`s${semilla}-${i}`, {
      nota: normal(r, corta ? 8 : 7.85, 0.67, 6, 9.5),
      temporadas,
      episodios,
      generos: sortearGeneros(r, GENEROS_SERIE, 1 + Math.floor(r() * r() * 6 + r() * 2)),
    });
  });
  return { pelis, series };
}

/**
 * Perfil con 15 notas de alguien a quien le gustan el drama, el crimen y la ciencia ficción
 * (notas de 8 a 10), y no tanto la comedia, la animación ni el terror (notas bajas).
 */
export function estadoConGustos(): Estado {
  const notas: [string, number, Genero[]][] = [
    ['padrino', 10, ['Drama', 'Crimen']],
    ['breaking', 10, ['Drama', 'Crimen']],
    ['pulp', 9, ['Crimen', 'Suspense']],
    ['origen', 9, ['Ciencia ficción']],
    ['matrix', 9, ['Ciencia ficción']],
    ['regreso', 8, ['Ciencia ficción', 'Comedia']],
    ['forrest', 8, ['Drama', 'Comedia']],
    ['juego', 8, ['Drama', 'Fantasía']],
    ['titanic', 5, ['Drama', 'Romance']],
    ['shrek', 6, ['Animación', 'Comedia']],
    ['friends', 6, ['Comedia']],
    ['rey', 6, ['Animación', 'Familia']],
    ['toy', 4, ['Animación', 'Familia']],
    ['resaca', 4, ['Comedia']],
    ['resplandor', 3, ['Terror']],
  ];
  return notas.reduce((e, [n, nota, generos]) => valorar(e, 'yo', peli(n, { generos }), nota), estadoVacio());
}
