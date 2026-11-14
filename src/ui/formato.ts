import type { Ficha, Plataforma, Titulo } from '../tipos';

export const NOMBRE_PLATAFORMA: Record<Plataforma, string> = {
  netflix: 'Netflix',
  prime: 'Prime Video',
  max: 'Max',
  movistar: 'Movistar Plus+',
};

/** Una `Ficha` sola (swipe inicial) no trae plataforma, nota ni sinopsis; un `Titulo` sí. */
export function esTitulo(t: Ficha | Titulo): t is Titulo {
  return 'plataforma' in t;
}

/** Peli: «1 h 38 min». Serie: «1 temporada · 8 episodios». null si no hay datos. */
export function duracion(t: Titulo): string | null {
  if (t.tipo === 'peli') {
    if (t.duracionMin == null) return null;
    const h = Math.floor(t.duracionMin / 60);
    const m = t.duracionMin % 60;
    if (h === 0) return `${m} min`;
    return m === 0 ? `${h} h` : `${h} h ${m} min`;
  }
  const partes: string[] = [];
  if (t.temporadas != null) partes.push(`${t.temporadas} ${t.temporadas === 1 ? 'temporada' : 'temporadas'}`);
  if (t.episodios != null) partes.push(`${t.episodios} ${t.episodios === 1 ? 'episodio' : 'episodios'}`);
  return partes.length > 0 ? partes.join(' · ') : null;
}

/** 8.1 → «8,1» (coma decimal, como se escribe en español). */
export function formatearNota(nota: number): string {
  return nota.toFixed(1).replace('.', ',');
}
