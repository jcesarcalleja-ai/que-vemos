// Duelos (modo solo): torneo de 8 títulos, 7 elecciones, siempre hay ganadora.
// El torneo es un dato simple (JSON) que la pantalla guarda y va pasando; aquí no se guarda nada.

import type { Estado, Titulo } from '../tipos';
import { mejores } from './puntuar';

export const TITULOS_DUELOS = 8;
const ELECCIONES_TOTALES = 7;

export interface Torneo {
  /** Los 8 títulos en orden de cuadro: cuartos = (0,1) (2,3) (4,5) (6,7). */
  cuadro: Titulo[];
  /** Ids elegidos en cada duelo, en orden: 4 de cuartos, 2 de semis, 1 de final. */
  elecciones: string[];
}

export type Ronda = 'cuartos' | 'semis' | 'final' | 'terminado';

export interface SituacionTorneo {
  ronda: Ronda;
  /** Posición del duelo actual dentro de su ronda (desde 0). */
  duelo: number;
  duelosEnRonda: number;
  /** Los dos títulos que toca enfrentar ahora; null cuando ya hay ganadora. */
  par: [Titulo, Titulo] | null;
  /** La ganadora; null mientras el torneo siga. */
  ganadora: Titulo | null;
  /** Elecciones hechas, de 0 a 7. */
  elegidas: number;
}

/** Cruce número `k` (0-3 cuartos, 4-5 semis, 6 final); solo vale si ya están decididos sus dos entrantes. */
function cruce(t: Torneo, k: number): [Titulo, Titulo] {
  const ganador = (i: number) => t.cuadro.find((x) => x.id === t.elecciones[i])!;
  if (k < 4) return [t.cuadro[2 * k], t.cuadro[2 * k + 1]];
  if (k < 6) return [ganador(2 * (k - 4)), ganador(2 * (k - 4) + 1)];
  return [ganador(4), ganador(5)];
}

/** Elige los 8 mejores y los coloca para que los favoritos no se crucen hasta el final. null si no hay 8. */
export function crearTorneo(candidatos: Titulo[], estado: Estado, ahora: Date): Torneo | null {
  const top = mejores(candidatos, estado, ahora, TITULOS_DUELOS);
  if (top.length < TITULOS_DUELOS) return null;
  const cuadro = [0, 7, 3, 4, 1, 6, 2, 5].map((i) => top[i]);
  return { cuadro, elecciones: [] };
}

export function situacionTorneo(t: Torneo): SituacionTorneo {
  const elegidas = t.elecciones.length;
  if (elegidas >= ELECCIONES_TOTALES) {
    const ganadora = t.cuadro.find((x) => x.id === t.elecciones[6])!;
    return { ronda: 'terminado', duelo: 0, duelosEnRonda: 0, par: null, ganadora, elegidas };
  }
  const par = cruce(t, elegidas);
  if (elegidas < 4) return { ronda: 'cuartos', duelo: elegidas, duelosEnRonda: 4, par, ganadora: null, elegidas };
  if (elegidas < 6) return { ronda: 'semis', duelo: elegidas - 4, duelosEnRonda: 2, par, ganadora: null, elegidas };
  return { ronda: 'final', duelo: 0, duelosEnRonda: 1, par, ganadora: null, elegidas };
}

/** Anota la elección del duelo actual y devuelve el torneo nuevo. Si el id no es de uno de los dos, lo devuelve igual. */
export function elegirEnDuelo(t: Torneo, idElegido: string): Torneo {
  const { par } = situacionTorneo(t);
  if (!par || !par.some((x) => x.id === idElegido)) return t;
  return { ...t, elecciones: [...t.elecciones, idElegido] };
}

/**
 * "Ya la vi" en Duelos: cambia un título aún en juego por el mejor que no esté en el torneo ni visto.
 * El nuevo ocupa su sitio y hereda sus victorias. null si no se puede (ya eliminado, torneo terminado o sin recambio).
 * Pasa el `estado` ya con la nota del título que se sustituye.
 */
export function sustituirEnTorneo(
  t: Torneo,
  idViejo: string,
  candidatos: Titulo[],
  estado: Estado,
  ahora: Date,
): Torneo | null {
  const jugados = t.elecciones.length;
  if (jugados >= ELECCIONES_TOTALES || !t.cuadro.some((x) => x.id === idViejo)) return null;
  for (let k = 0; k < jugados; k++) {
    const perdedor = cruce(t, k).find((x) => x.id !== t.elecciones[k]);
    if (perdedor?.id === idViejo) return null;
  }
  const nuevo = mejores(candidatos, estado, ahora, 1, new Set(t.cuadro.map((x) => x.id)))[0];
  if (!nuevo) return null;
  return {
    cuadro: t.cuadro.map((x) => (x.id === idViejo ? nuevo : x)),
    elecciones: t.elecciones.map((id) => (id === idViejo ? nuevo.id : id)),
  };
}
