// El catálogo real: lee public/catalogo.json, que prepara scripts/generar-catalogo.mjs cada día.
// La ruta es relativa a la página para que valga bajo /que-vemos/ en GitHub Pages.

import type { Catalogo, Ficha, Titulo } from '../tipos';

interface Archivo {
  generado: string;
  pelis: Titulo[];
  series: Titulo[];
  conocidos: Ficha[];
}

const SIN_CONEXION = 'No se pudo cargar el catálogo de títulos. Comprueba la conexión e inténtalo de nuevo.';
const ARCHIVO_ROTO = 'El catálogo de títulos no es válido. Inténtalo de nuevo más tarde.';

async function descargar(url: string): Promise<Archivo> {
  let respuesta: Response;
  try {
    respuesta = await fetch(url);
  } catch (causa) {
    throw new Error(SIN_CONEXION, { cause: causa });
  }
  if (!respuesta.ok) throw new Error(SIN_CONEXION, { cause: respuesta.status });
  let datos: Archivo;
  try {
    datos = await respuesta.json();
  } catch (causa) {
    throw new Error(ARCHIVO_ROTO, { cause: causa });
  }
  if (!Array.isArray(datos?.pelis) || !Array.isArray(datos.series) || !Array.isArray(datos.conocidos)) throw new Error(ARCHIVO_ROTO);
  return datos;
}

/** Catálogo que descarga el archivo una sola vez; si falla, el siguiente intento vuelve a descargarlo. */
export function crearCatalogo(url = 'catalogo.json'): Catalogo {
  let carga: Promise<Archivo> | null = null;
  const leer = () =>
    (carga ??= descargar(url).catch((error) => {
      carga = null;
      throw error;
    }));
  return {
    async disponibles(tipo) {
      const archivo = await leer();
      return [...(tipo === 'peli' ? archivo.pelis : archivo.series)];
    },
    async conocidos() {
      return [...(await leer()).conocidos];
    },
  };
}

export const catalogo: Catalogo = crearCatalogo();
