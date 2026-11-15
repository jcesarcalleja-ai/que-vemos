// Lógica del flujo de pantallas que no depende de React: quién tiene que hacer su swipe inicial,
// qué toca deslizar en el Match y cómo se sustituye un título. Las pantallas solo la llaman.

import { numeroDeNoche, sustituirEnMatch, type Deslizados } from '../motor';
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

// --- «No me apetece» ---

/** A la de tres «No me apetece» en una noche ya no sale otra propuesta: se pasa a Duelos o al Match. */
export const TOPE_NO_APETECE = 3;

/** Cuántos «No me apetece» lleva `yo` (quien descarta en la propuesta) la noche de `ahora`. */
export function descartesDeLaNoche(estado: Estado, ahora: Date): number {
  const noche = numeroDeNoche(ahora);
  return Object.values(estado.perfiles.yo.valoraciones).filter((v) => v.nota === 'no-apetece' && v.noche === noche)
    .length;
}

// --- Match ---

/** Los 10 títulos y lo que ha deslizado cada uno. */
interface PartidaMatch {
  titulos: Titulo[];
  ella: Deslizados;
  yo: Deslizados;
}

type TurnoMatch = Perfil | 'fin';

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
 * "Ya la vi" en el Match, pulsado por `quien` está deslizando: el título nuevo ocupa el sitio del viejo y
 * empieza sin deslizar. Si ya desliza `yo`, ella no llega a verlo: cuenta como un «no» suyo, para que el
 * móvil no tenga que volver a ella. Pasa el `estado` ya con la nota. null si no hay recambio.
 */
export function sustituirEnPartida(
  p: PartidaMatch,
  idViejo: string,
  quien: Perfil,
  candidatos: Titulo[],
  estado: Estado,
  ahora: Date,
): PartidaMatch | null {
  const titulos = sustituirEnMatch(p.titulos, idViejo, candidatos, estado, ahora);
  if (!titulos) return null;
  const nuevo = titulos[p.titulos.findIndex((t) => t.id === idViejo)]!;
  const sin = (d: Deslizados): Deslizados => Object.fromEntries(Object.entries(d).filter(([id]) => id !== idViejo));
  return { titulos, ella: quien === 'yo' ? { ...sin(p.ella), [nuevo.id]: false } : sin(p.ella), yo: sin(p.yo) };
}
