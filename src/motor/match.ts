// Match (modo pareja): 10 títulos, ella desliza sí/no y luego yo; gana el mejor con sí de los dos.

import type { Estado, Titulo } from '../tipos';
import { mejores, ordenar } from './puntuar';

export const TITULOS_MATCH = 10;

/** Lo que deslizó una persona: `true` = sí, `false` = no, por `Titulo.id`. Lo que falte cuenta como no. */
export type Deslizados = Record<string, boolean>;

/** Los 10 títulos del Match, del mejor al peor. null si no hay 10. */
export function crearMatch(candidatos: Titulo[], estado: Estado, ahora: Date): Titulo[] | null {
  const top = mejores(candidatos, estado, ahora, TITULOS_MATCH);
  return top.length < TITULOS_MATCH ? null : top;
}

/**
 * La ganadora: la mejor con sí de los dos; si no hay coincidencia, la mejor con sí de alguno;
 * si nadie marcó ninguna, la mejor de todas. null solo si la lista está vacía.
 */
export function ganadoraMatch(
  titulos: Titulo[],
  ella: Deslizados,
  yo: Deslizados,
  estado: Estado,
  ahora: Date,
): Titulo | null {
  const ordenados = ordenar(titulos, estado, ahora);
  return (
    ordenados.find((t) => ella[t.id] && yo[t.id]) ??
    ordenados.find((t) => ella[t.id] || yo[t.id]) ??
    ordenados[0] ??
    null
  );
}

/**
 * "Ya la vi" en Match: cambia el título por el mejor que no esté ya en juego ni visto, en la misma posición.
 * Pasa el `estado` ya con la nota del título que se sustituye. null si no está en la lista o no hay recambio.
 * La pantalla debe olvidar lo que se deslizó del título viejo: el nuevo empieza sin deslizar.
 */
export function sustituirEnMatch(
  titulos: Titulo[],
  idViejo: string,
  candidatos: Titulo[],
  estado: Estado,
  ahora: Date,
): Titulo[] | null {
  if (!titulos.some((t) => t.id === idViejo)) return null;
  const nuevo = mejores(candidatos, estado, ahora, 1, new Set(titulos.map((t) => t.id)))[0];
  if (!nuevo) return null;
  return titulos.map((t) => (t.id === idViejo ? nuevo : t));
}
