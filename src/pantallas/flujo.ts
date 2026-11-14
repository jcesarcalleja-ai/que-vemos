// Lógica del flujo de pantallas que no depende de React: quién tiene que hacer su swipe inicial,
// qué toca deslizar en el Match y cómo se sustituye un título. Las pantallas solo la llaman.

import { sustituirEnMatch, type Deslizados } from '../motor';
import type { Estado, Ficha, Perfil, Titulo } from '../tipos';

/** Quién tiene que hacer aún su swipe inicial (yo primero; ella solo en modo pareja), o null. */
export function perfilPendienteDeInicio(estado: Estado): Perfil | null {
  if (!estado.perfiles.yo.inicioHecho) return 'yo';
  if (estado.modo === 'pareja' && !estado.perfiles.ella.inicioHecho) return 'ella';
  return null;
}

/** Los conocidos que ese perfil aún no ha puntuado (si recarga a medias, sigue donde iba). */
export function pendientesDeInicio(conocidos: Ficha[], estado: Estado, perfil: Perfil): Ficha[] {
  const hechos = estado.perfiles[perfil].valoraciones;
  return conocidos.filter((f) => !Object.hasOwn(hechos, f.id));
}

// --- Match ---

/** Los 10 títulos y lo que ha deslizado cada uno. */
export interface PartidaMatch {
  titulos: Titulo[];
  ella: Deslizados;
  yo: Deslizados;
}

export type TurnoMatch = Perfil | 'fin';

export function nuevaPartida(titulos: Titulo[]): PartidaMatch {
  return { titulos, ella: {}, yo: {} };
}

/** Ella desliza todos primero, luego yo los mismos. `pendiente` es el título que toca ahora (null al terminar). */
export function turnoMatch(p: PartidaMatch): {
  turno: TurnoMatch;
  pendiente: Titulo | null;
  /** Posición (desde 1) del título actual para quien está deslizando. */
  numero: number;
} {
  for (const turno of ['ella', 'yo'] as const) {
    const i = p.titulos.findIndex((t) => !Object.hasOwn(p[turno], t.id));
    if (i >= 0) return { turno, pendiente: p.titulos[i]!, numero: i + 1 };
  }
  return { turno: 'fin', pendiente: null, numero: p.titulos.length };
}

export function deslizar(p: PartidaMatch, perfil: Perfil, idTitulo: string, si: boolean): PartidaMatch {
  return { ...p, [perfil]: { ...p[perfil], [idTitulo]: si } };
}

/**
 * "Ya la vi" en el Match: el título nuevo ocupa el sitio del viejo y empieza sin deslizar para los dos.
 * Pasa el `estado` ya con la nota. null si no hay recambio.
 */
export function sustituirEnPartida(
  p: PartidaMatch,
  idViejo: string,
  candidatos: Titulo[],
  estado: Estado,
  ahora: Date,
): PartidaMatch | null {
  const titulos = sustituirEnMatch(p.titulos, idViejo, candidatos, estado, ahora);
  if (!titulos) return null;
  const sin = (d: Deslizados): Deslizados => Object.fromEntries(Object.entries(d).filter(([id]) => id !== idViejo));
  return { titulos, ella: sin(p.ella), yo: sin(p.yo) };
}
