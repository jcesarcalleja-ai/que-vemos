import { useEffect, useState } from 'react';
import { catalogo } from '../datos/catalogo';
import type { Ficha, Titulo } from '../tipos';

export interface DatosCatalogo {
  pelis: Titulo[];
  series: Titulo[];
  conocidos: Ficha[];
}

export type Carga =
  | { estado: 'cargando' }
  | { estado: 'listo'; datos: DatosCatalogo }
  | { estado: 'error'; mensaje: string };

/** Carga el catálogo al abrir la app. `reintentar` vuelve a pedirlo si falló. */
export function useCatalogo(): { carga: Carga; reintentar: () => void } {
  const [carga, setCarga] = useState<Carga>({ estado: 'cargando' });
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let vigente = true;
    Promise.all([catalogo.disponibles('peli'), catalogo.disponibles('serie'), catalogo.conocidos()])
      .then(([pelis, series, conocidos]) => vigente && setCarga({ estado: 'listo', datos: { pelis, series, conocidos } }))
      .catch(
        (error: unknown) =>
          vigente &&
          setCarga({
            estado: 'error',
            mensaje: error instanceof Error ? error.message : 'No se pudo cargar el catálogo de títulos.',
          }),
      );
    return () => {
      vigente = false;
    };
  }, [intento]);

  return {
    carga,
    reintentar: () => {
      setCarga({ estado: 'cargando' });
      setIntento((n) => n + 1);
    },
  };
}
