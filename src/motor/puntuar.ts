// Puntuar títulos: la única fuente de verdad de "qué título es mejor ahora".
// Proponer, Duelos y Match solo ordenan con esto. Código puro: sin hora real ni azar.

import type { Estado, Genero, Perfil, Titulo } from '../tipos';

/** Peso de los gustos aprendidos (afinidad en [-1, 1] × este peso). */
const PESO_GUSTOS = 4;
/** Cuánto vale un gesto del Match frente a una nota (señal más débil). */
const PESO_GESTO = 0.25;
/** Peso de la nota general (0 a 10). */
const PESO_NOTA = 0.6;
/** Puntos que suma lo corto y resta lo largo cuando toca preferir lo corto. */
const PESO_DURACION = 1.5;
/** Variedad entre noches: pequeña, para no tapar los gustos ni la nota. */
const VARIEDAD_NOCHE = 0.3;
const PELI_CORTA_MIN = 105;
const SERIE_CORTA_EPISODIOS = 10;

const HORAS_NOCHE_EMPIEZA = 6;

/** Perfiles cuyos datos cuentan: solo `yo` en solo; los dos en pareja. */
export function perfilesActivos(estado: Estado): Perfil[] {
  return estado.modo === 'pareja' ? ['yo', 'ella'] : ['yo'];
}

/** Una "noche" va de 06:00 a 06:00: la clave identifica la noche y `dia` es su día de la semana (0 = domingo). */
function noche(ahora: Date): { clave: string; dia: number } {
  const d = new Date(ahora.getTime() - HORAS_NOCHE_EMPIEZA * 3_600_000);
  return { clave: `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`, dia: d.getDay() };
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

/** Número estable en [0, 1) a partir de un texto (FNV-1a). */
function hash01(texto: string): number {
  let h = 2166136261;
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967296;
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

/** Devuelve la función que puntúa un título (más es mejor) para este estado y este momento. */
export function crearPuntuador(estado: Estado, ahora: Date): (t: Titulo) => number {
  const gustos = gustosPorGenero(estado);
  const corto = prefiereCorto(ahora);
  const { clave } = noche(ahora);

  return (t) => {
    const afinidad = t.generos.length
      ? t.generos.reduce((suma, g) => suma + Math.tanh((gustos.get(g) ?? 0) / 3), 0) / t.generos.length
      : 0;
    const cortoTitulo = corto ? esCorto(t) : null;
    const duracion = cortoTitulo === null ? 0 : cortoTitulo ? PESO_DURACION : -PESO_DURACION;
    return (
      afinidad * PESO_GUSTOS +
      t.nota * PESO_NOTA +
      duracion +
      hash01(`${clave}|${t.id}`) * VARIEDAD_NOCHE
    );
  };
}

/** Ordena de mejor a peor; los empates se deshacen por id para que el resultado sea siempre el mismo. */
export function ordenar(titulos: Titulo[], estado: Estado, ahora: Date): Titulo[] {
  const puntua = crearPuntuador(estado, ahora);
  return titulos
    .map((t) => ({ t, puntos: puntua(t) }))
    .sort((a, b) => b.puntos - a.puntos || (a.t.id < b.t.id ? -1 : 1))
    .map((x) => x.t);
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

/** Los `n` mejores elegibles (menos si no hay tantos). */
export function mejores(
  candidatos: Titulo[],
  estado: Estado,
  ahora: Date,
  n: number,
  excluirIds?: ReadonlySet<string>,
): Titulo[] {
  return ordenar(elegibles(candidatos, estado, excluirIds), estado, ahora).slice(0, n);
}
