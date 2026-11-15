// «Hoy nos apetece…»: un toque elige un estilo y, esa noche, solo se proponen títulos de ese estilo.

import type { Animo, Estado, Genero, Titulo } from '../tipos';
import { numeroDeNoche } from './puntuar';

/** Cada botón y los géneros que cuentan como suyos (basta con uno). En este orden salen en pantalla. */
export const ANIMOS: readonly { clave: Animo; texto: string; generos: readonly Genero[] }[] = [
  { clave: 'risa', texto: 'Risa', generos: ['Comedia'] },
  { clave: 'miedo', texto: 'Miedo', generos: ['Terror'] },
  { clave: 'intriga', texto: 'Intriga', generos: ['Suspense', 'Misterio', 'Crimen'] },
  { clave: 'accion', texto: 'Acción', generos: ['Acción', 'Aventura'] },
  { clave: 'romantica', texto: 'Romántica', generos: ['Romance'] },
  { clave: 'drama', texto: 'Drama', generos: ['Drama'] },
  { clave: 'ciencia-ficcion', texto: 'Ciencia ficción', generos: ['Ciencia ficción'] },
  { clave: 'fantasia', texto: 'Fantasía', generos: ['Fantasía'] },
];

/** Con menos títulos que estos no da ni para un Match: el botón no sale. */
const MINIMO_TITULOS = 10;

/** Los títulos de ese estilo. */
export function deAnimo(titulos: Titulo[], clave: Animo): Titulo[] {
  const generos = ANIMOS.find((a) => a.clave === clave)!.generos;
  return titulos.filter((t) => t.generos.some((g) => generos.includes(g)));
}

/**
 * Los botones que tienen sentido ahora: con títulos suficientes de ese tipo (en series no hay «Miedo» ni
 * «Romántica») y, en pareja, sin los que caen enteros en los «jamás» de ella.
 */
export function animosDisponibles(titulos: Titulo[], estado: Estado): Animo[] {
  const jamas = estado.modo === 'pareja' ? estado.perfiles.ella.jamas : [];
  return ANIMOS.filter(
    (a) => !a.generos.every((g) => jamas.includes(g)) && deAnimo(titulos, a.clave).length >= MINIMO_TITULOS,
  ).map((a) => a.clave);
}

/** El estilo elegido para esta noche (06:00 a 06:00), o null si no hay o no sirve para estos títulos. */
export function animoDeHoy(titulos: Titulo[], estado: Estado, ahora: Date): Animo | null {
  const { animo } = estado;
  if (!animo || animo.noche !== numeroDeNoche(ahora)) return null;
  return animosDisponibles(titulos, estado).includes(animo.clave) ? animo.clave : null;
}

/** Los títulos entre los que se elige esta noche: los del estilo elegido, o todos si no hay. */
export function titulosDeHoy(titulos: Titulo[], estado: Estado, ahora: Date): Titulo[] {
  const animo = animoDeHoy(titulos, estado, ahora);
  return animo ? deAnimo(titulos, animo) : titulos;
}
