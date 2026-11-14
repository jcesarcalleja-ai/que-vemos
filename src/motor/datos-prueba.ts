// Ayudas solo para los tests del motor.

import type { Estado, Genero, Modo, Perfil, Titulo } from '../tipos';

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
  return { version: 1, tipo: 'peli', modo, perfiles: { yo: perfil(), ella: perfil() } };
}

/** Copia del estado con la nota (o 'abandonada') de ese perfil para ese título. */
export function valorar(
  estado: Estado,
  perfil: Perfil,
  t: Titulo,
  nota: number | 'abandonada',
): Estado {
  const copia = structuredClone(estado);
  copia.perfiles[perfil].valoraciones[t.id] = { tipo: t.tipo, titulo: t.titulo, generos: t.generos, nota };
  return copia;
}

/** Copia del estado con un gesto del Match de ese perfil. */
export function gestear(estado: Estado, perfil: Perfil, t: Titulo, si: boolean): Estado {
  const copia = structuredClone(estado);
  copia.perfiles[perfil].gestos[t.id] = { generos: t.generos, si };
  return copia;
}

export function vetar(estado: Estado, perfil: Perfil, ...generos: Genero[]): Estado {
  const copia = structuredClone(estado);
  copia.perfiles[perfil].jamas = generos;
  return copia;
}

/** `cantidad` pelis distintas, con nota creciente (1, 2, 3…) para que el orden sea claro. */
export function pelisConNotaCreciente(cantidad: number): Titulo[] {
  return Array.from({ length: cantidad }, (_, i) => peli(String(i + 1).padStart(2, '0'), { nota: i + 1 }));
}
