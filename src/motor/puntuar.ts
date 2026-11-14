// Puntuar títulos: la única fuente de verdad de "qué título es mejor ahora".
// Proponer, Duelos y Match solo ordenan con esto. Código puro: sin hora real ni azar.

import type { Estado, Genero, Perfil, Titulo } from '../tipos';

// Cómo se reparte el peso. Cada título tiene un MÉRITO (gustos + nota + lo corto) y, de entre los de más mérito,
// cada noche le toca a unos: ahí está la variedad. Para dar más o menos peso a cada cosa, toca estas constantes:
//   gustos    PESO_GUSTOS (lo que enseñan las notas) y PESO_GESTO (lo que enseña un gesto del Match)
//   nota      PESO_NOTA, PESO_NOTA_ALTA, NOTA_MINIMA, NOTA_TOPE y CASTIGO_NOTA_BAJA
//   lo corto  PESO_DURACION
//   variedad  TURNO_MINIMO y TURNO_POR_TITULO: cuántos de los mejores se turnan (más = más variedad, menos calidad);
//             MARGEN_TURNO: lo lejos del mejor que puede estar uno para turnarse
// Un punto de mérito equivale a un punto de nota general entre NOTA_MINIMA y NOTA_TOPE.

/** Máximo de puntos que dan los gustos: afinidad de -1 (lo evitas) a 1 (lo que más te gusta) por este peso. */
const PESO_GUSTOS = 3.5;
/** Cuánto vale un gesto del Match frente a una nota (señal más débil). */
const PESO_GESTO = 0.25;
/** Puntos por cada punto de nota general entre NOTA_MINIMA y NOTA_TOPE. */
const PESO_NOTA = 1;
/** Por encima de NOTA_TOPE la nota casi no cuenta: un 9,3 no debe ganar siempre a un 8,6, o saldría cada noche. */
const PESO_NOTA_ALTA = 0.3;
const NOTA_MINIMA = 7.5;
const NOTA_TOPE = 8.5;
/** Resta a todo título por debajo de NOTA_MINIMA: lo mediocre no compite por muy afín o corto que sea. */
const CASTIGO_NOTA_BAJA = 6;
/**
 * Puntos que suma ser corto cuando toca preferir lo corto, según lo buena que sea la nota:
 * todo con una nota de NOTA_TOPE o más, nada con NOTA_MINIMA o menos. Solo empuja a lo que ya es bueno.
 */
const PESO_DURACION = 4.25;
/** Cuántos de los mejores se turnan: al menos esto, y 1,5 veces los que se piden (8 en Duelos, 10 en Match). */
const TURNO_MINIMO = 13;
const TURNO_POR_TITULO = 1.5;
/** Y solo entra al turno quien no esté a más de estos puntos del mejor: si no hay bastantes parecidos, se toman los mejores. */
const MARGEN_TURNO = 6;
/** Paso entre noches y entre puestos del turno: irracionales, para que no se repitan en noches seguidas. */
const PASO_NOCHE = 0.6180339887;
const PASO_PUESTO = 0.41421356237;
const PELI_CORTA_MIN = 105;
const SERIE_CORTA_EPISODIOS = 10;

const HORAS_NOCHE_EMPIEZA = 6;
const MS_DIA = 86_400_000;

/** Perfiles cuyos datos cuentan: solo `yo` en solo; los dos en pareja. */
export function perfilesActivos(estado: Estado): Perfil[] {
  return estado.modo === 'pareja' ? ['yo', 'ella'] : ['yo'];
}

/** Una "noche" va de 06:00 a 06:00: `numero` cuenta las noches (una más cada día) y `dia` es su día de la semana (0 = domingo). */
function noche(ahora: Date): { numero: number; dia: number } {
  const d = new Date(ahora.getTime() - HORAS_NOCHE_EMPIEZA * 3_600_000);
  return { numero: Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / MS_DIA, dia: d.getDay() };
}

/** Entre semana = noches de domingo a jueves. Tarde = de 23:00 a 05:00. Si no, da igual. */
function prefiereCorto(ahora: Date): boolean {
  const entreSemana = noche(ahora).dia <= 4;
  const h = ahora.getHours();
  return entreSemana || h >= 23 || h < 5;
}

/** true/false si se sabe si es corto; null si el título no trae datos de duración. */
function esCorto(t: Titulo): boolean | null {
  if (t.tipo === 'peli') return t.duracionMin === undefined ? null : t.duracionMin < PELI_CORTA_MIN;
  if (t.temporadas === undefined && t.episodios === undefined) return null;
  return (t.temporadas ?? Infinity) <= 1 || (t.episodios ?? Infinity) < SERIE_CORTA_EPISODIOS;
}

/** Gusto acumulado por género: notas altas suman, bajas y abandonadas restan, los gestos pesan menos. */
function gustosPorGenero(estado: Estado): Map<Genero, number> {
  const gustos = new Map<Genero, number>();
  const sumar = (generos: Genero[], delta: number) => {
    for (const g of generos) gustos.set(g, (gustos.get(g) ?? 0) + delta);
  };
  for (const perfil of perfilesActivos(estado)) {
    const datos = estado.perfiles[perfil];
    for (const v of Object.values(datos.valoraciones)) {
      if (v.nota === 'abandonada' || v.nota <= 4) sumar(v.generos, -1);
      else if (v.nota >= 7) sumar(v.generos, 1);
      // 5 y 6 no enseñan nada.
    }
    for (const g of Object.values(datos.gestos)) sumar(g.generos, g.si ? PESO_GESTO : -PESO_GESTO);
  }
  return gustos;
}

/** Puntos de la nota general: lineales, más suaves por encima de NOTA_TOPE y con castigo por debajo de NOTA_MINIMA. */
function puntosNota(nota: number): number {
  const puntos = (Math.min(nota, NOTA_TOPE) - NOTA_MINIMA) * PESO_NOTA + Math.max(0, nota - NOTA_TOPE) * PESO_NOTA_ALTA;
  return nota < NOTA_MINIMA ? puntos - CASTIGO_NOTA_BAJA : puntos;
}

/** Devuelve la función que puntúa el mérito de un título (más es mejor) para este estado y este momento. */
export function crearPuntuador(estado: Estado, ahora: Date): (t: Titulo) => number {
  const gustos = gustosPorGenero(estado);
  const corto = prefiereCorto(ahora);

  return (t) => {
    // Suma entre √n géneros, sin pasar de 1: un título de un solo género no gana a otro de dos igual de afines,
    // pero tampoco se hunde si solo uno de sus géneros te gusta.
    const afinidad = t.generos.length
      ? t.generos.reduce((suma, g) => suma + Math.tanh((gustos.get(g) ?? 0) / 3), 0) / Math.sqrt(t.generos.length)
      : 0;
    const bueno = Math.min(1, Math.max(0, (t.nota - NOTA_MINIMA) / (NOTA_TOPE - NOTA_MINIMA)));
    const duracion = corto && esCorto(t) ? PESO_DURACION * bueno : 0;
    return Math.max(-1, Math.min(1, afinidad)) * PESO_GUSTOS + puntosNota(t.nota) + duracion;
  };
}

/** De mejor a peor mérito con sus puntos; los empates se deshacen por id para que el resultado sea siempre el mismo. */
function conPuntos(titulos: Titulo[], estado: Estado, ahora: Date): { titulo: Titulo; puntos: number }[] {
  const puntua = crearPuntuador(estado, ahora);
  return titulos
    .map((titulo) => ({ titulo, puntos: puntua(titulo) }))
    .sort((a, b) => b.puntos - a.puntos || (a.titulo.id < b.titulo.id ? -1 : 1));
}

/** Ordena de mejor a peor mérito, sin turnos: así elige la ganadora del Match entre los que ya se pusieron delante. */
export function ordenar(titulos: Titulo[], estado: Estado, ahora: Date): Titulo[] {
  return conPuntos(titulos, estado, ahora).map((x) => x.titulo);
}

/** Títulos que se pueden poner delante: sin valorar por quien toque y sin géneros "jamás" en pareja. */
export function elegibles(
  candidatos: Titulo[],
  estado: Estado,
  excluirIds: ReadonlySet<string> = new Set(),
): Titulo[] {
  const perfiles = perfilesActivos(estado);
  const jamas = new Set<Genero>(estado.modo === 'pareja' ? estado.perfiles.ella.jamas : []);
  return candidatos.filter(
    (t) =>
      !excluirIds.has(t.id) &&
      !perfiles.some((p) => Object.hasOwn(estado.perfiles[p].valoraciones, t.id)) &&
      !t.generos.some((g) => jamas.has(g)),
  );
}

/**
 * Los `n` que se ponen delante esta noche, de más a menos mérito.
 * Se turnan los de más mérito (TURNO_MINIMO o 1,5 × n): cada noche toca un grupo distinto y fijo, así que sin
 * marcar nada cambian de una noche a otra, ninguno se repite pronto y todos son buenos. Sin azar ni reloj.
 */
export function mejores(
  candidatos: Titulo[],
  estado: Estado,
  ahora: Date,
  n: number,
  excluirIds?: ReadonlySet<string>,
): Titulo[] {
  const ordenados = conPuntos(elegibles(candidatos, estado, excluirIds), estado, ahora);
  const corte = (ordenados[0]?.puntos ?? 0) - MARGEN_TURNO;
  const turno = ordenados
    .slice(0, Math.max(TURNO_MINIMO, Math.ceil(TURNO_POR_TITULO * n)))
    .filter((x) => x.puntos >= corte);
  if (turno.length <= n) return ordenados.slice(0, n).map((x) => x.titulo);
  const { numero } = noche(ahora);
  return turno
    .map((x, puesto) => ({ titulo: x.titulo, puesto, orden: (puesto * PASO_PUESTO + numero * PASO_NOCHE) % 1 }))
    .sort((a, b) => b.orden - a.orden)
    .slice(0, n)
    .sort((a, b) => a.puesto - b.puesto)
    .map((x) => x.titulo);
}
