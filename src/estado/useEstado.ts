// El estado vivo de la app: lo lee del almacén al crearse y guarda cada cambio.
// `crearTienda` no usa React, para poder probarla en Node; `useEstado` la conecta a los componentes.

import { useSyncExternalStore } from 'react';
import type { Estado } from '../tipos';
import { almacenDelNavegador, guardarEstado, leerEstado, type Almacen } from './persistencia';

export function crearTienda(almacen: Almacen | null) {
  // Un solo objeto que se sustituye entero en cada cambio: es lo que lee React.
  let actual = { estado: leerEstado(almacen), guardadoFallido: false };
  const oyentes = new Set<() => void>();
  return {
    leer: () => actual,
    /** Avisa tras cada cambio. Devuelve la función para dejar de avisar. */
    suscribir(oyente: () => void) {
      oyentes.add(oyente);
      return () => {
        oyentes.delete(oyente);
      };
    },
    /** Aplica una operación (o `() => estadoNuevo` para sustituirlo todo, como al importar) y guarda. */
    cambiar(operacion: (estado: Estado) => Estado) {
      const estado = operacion(actual.estado);
      // guardadoFallido: el último cambio no se pudo guardar (sin almacén, lleno o bloqueado).
      actual = { estado, guardadoFallido: !guardarEstado(estado, almacen) };
      oyentes.forEach((oyente) => oyente());
    },
  };
}

// Una sola tienda para toda la app: todos los componentes ven el mismo estado.
let tienda: ReturnType<typeof crearTienda> | undefined;

/** El estado de la app y la forma de cambiarlo (`cambiar((e) => valorar(e, 'yo', ficha, 8))`); cada cambio se guarda en el navegador. */
export function useEstado() {
  tienda ??= crearTienda(almacenDelNavegador());
  const { estado, guardadoFallido } = useSyncExternalStore(tienda.suscribir, tienda.leer);
  // guardadoFallido: conviene avisar al usuario.
  return { estado, cambiar: tienda.cambiar, guardadoFallido };
}
