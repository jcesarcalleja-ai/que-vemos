// El catálogo real: lee public/catalogo.json, que prepara scripts/generar-catalogo.mjs cada día.
// La ruta es relativa a la página para que valga bajo /que-vemos/ en GitHub Pages.

import type { Ficha, Titulo } from '../tipos';

export interface DatosCatalogo {
  pelis: Titulo[];
  series: Titulo[];
  /** Unos 20 títulos muy conocidos, pelis y series mezcladas, para el swipe inicial. */
  conocidos: Ficha[];
}

const SIN_CONEXION = 'No se pudo cargar el catálogo de títulos. Comprueba la conexión e inténtalo de nuevo.';
const ARCHIVO_ROTO = 'El catálogo de títulos no es válido. Inténtalo de nuevo más tarde.';

/** Descarga y valida `catalogo.json`. */
export async function cargarCatalogo(): Promise<DatosCatalogo> {
  let respuesta: Response;
  try {
    respuesta = await fetch('catalogo.json');
  } catch (causa) {
    throw new Error(SIN_CONEXION, { cause: causa });
  }
  if (!respuesta.ok) throw new Error(SIN_CONEXION, { cause: respuesta.status });
  let datos: DatosCatalogo;
  try {
    datos = await respuesta.json();
  } catch (causa) {
    throw new Error(ARCHIVO_ROTO, { cause: causa });
  }
  if (!Array.isArray(datos?.pelis) || !Array.isArray(datos.series) || !Array.isArray(datos.conocidos)) throw new Error(ARCHIVO_ROTO);
  return datos;
}
