import type { Estado, Titulo } from '../tipos';
import { mejores } from './puntuar';

/** El título a proponer al abrir la app, o null si no queda ninguno elegible. No modifica el estado. */
export function proponer(candidatos: Titulo[], estado: Estado, ahora: Date): Titulo | null {
  return mejores(candidatos, estado, ahora, 1)[0] ?? null;
}
