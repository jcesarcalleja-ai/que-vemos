import { useEffect, useState } from 'react';
import { cargarCatalogo, type DatosCatalogo } from '../datos/catalogo';

type Carga =
  | { estado: 'cargando' }
  | { estado: 'listo'; datos: DatosCatalogo }
  | { estado: 'error'; mensaje: string };

/** Carga el catálogo al abrir la app. `reintentar` vuelve a pedirlo si falló. */
export function useCatalogo(): { carga: Carga; reintentar: () => void } {
  const [carga, setCarga] = useState<Carga>({ estado: 'cargando' });
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let vigente = true;
    cargarCatalogo()
      .then((datos) => vigente && setCarga({ estado: 'listo', datos }))
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
