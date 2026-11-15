// Contrato de datos compartido de ¿Qué vemos? (ver ESPECIFICACION.md).
// Lo mantiene el orquestador: si necesitas cambiarlo, hazlo y avísalo en tu informe.

export type Tipo = 'peli' | 'serie';
export type Modo = 'solo' | 'pareja';
export type Perfil = 'yo' | 'ella';
export type Plataforma = 'netflix' | 'prime' | 'max' | 'movistar';

/** Vocabulario único de géneros para pelis y series. Los "jamás" se eligen de aquí. */
export const GENEROS = [
  'Acción',
  'Aventura',
  'Animación',
  'Comedia',
  'Crimen',
  'Documental',
  'Drama',
  'Familia',
  'Fantasía',
  'Historia',
  'Terror',
  'Música',
  'Misterio',
  'Romance',
  'Ciencia ficción',
  'Suspense',
  'Bélica',
  'Western',
  'Reality',
] as const;
export type Genero = (typeof GENEROS)[number];

/** Lo mínimo de un título: basta para puntuarlo y aprender de él. */
export interface Ficha {
  /** Único en toda la app: `${tipo}-${idExterno}`. */
  id: string;
  tipo: Tipo;
  titulo: string;
  anio: number;
  /** URL completa del póster, o null si no hay. */
  poster: string | null;
  generos: Genero[];
}

/** Un título que se puede proponer: está disponible en una de las cuatro plataformas. */
export interface Titulo extends Ficha {
  /** Nota general del 0 al 10. */
  nota: number;
  sinopsis: string;
  plataforma: Plataforma;
  /** URL que abre "Ver en [plataforma]". */
  enlace: string;
  /** URL del tráiler, o null si no hay. */
  trailer: string | null;
  /** Solo pelis. */
  duracionMin?: number;
  /** Solo series. */
  temporadas?: number;
  /** Solo series. */
  episodios?: number;
}

interface DatosValoracion {
  tipo: Tipo;
  titulo: string;
  generos: Genero[];
}

/** Lo que alguien opina de un título que ya vio. */
interface Vista extends DatosValoracion {
  /** Nota del 1 al 10, o 'abandonada' (solo series). */
  nota: number | 'abandonada';
}

/** «No me apetece»: un título descartado sin verlo. Enseña menos que una mala nota. */
interface Descarte extends DatosValoracion {
  nota: 'no-apetece';
  anio: number;
  /** La noche en que se descartó (`numeroDeNoche`), para contar cuántos van esa noche. */
  noche: number;
}

export type Valoracion = Vista | Descarte;

/** Un desliz del Match: señal más débil que una nota. */
export interface Gesto {
  generos: Genero[];
  si: boolean;
}

export interface DatosPerfil {
  /** Por `Ficha.id`. Todo lo que hay aquí no se vuelve a proponer. */
  valoraciones: Record<string, Valoracion>;
  /** Por `Ficha.id`. */
  gestos: Record<string, Gesto>;
  /** Géneros vetados. */
  jamas: Genero[];
  /** Ya hizo el swipe inicial. */
  inicioHecho: boolean;
}

/** Los botones de «Hoy nos apetece…» (qué géneros son cada uno: `src/motor/animo.ts`). */
export const ANIMOS_CLAVES = [
  'risa',
  'miedo',
  'intriga',
  'accion',
  'romantica',
  'drama',
  'ciencia-ficcion',
  'fantasia',
] as const;
export type Animo = (typeof ANIMOS_CLAVES)[number];

/** Todo lo que se guarda en el móvil. */
export interface Estado {
  version: 1;
  tipo: Tipo;
  modo: Modo;
  perfiles: Record<Perfil, DatosPerfil>;
  /** «Hoy nos apetece…»: el estilo elegido y la noche (`numeroDeNoche`) en que vale. Al día siguiente ya no cuenta. */
  animo: { clave: Animo; noche: number } | null;
}
