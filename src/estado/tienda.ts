// El estado vivo de la app: lo lee del almacén al crearse y guarda cada cambio.
// Sin React, para poder probarlo en Node; `useEstado` lo conecta a los componentes.

import type { Estado } from '../tipos';
import { guardarEstado, leerEstado, type Almacen } from './persistencia';

export interface Tienda {
  estado(): Estado;
  /** true si el último cambio no se pudo guardar (sin almacén, lleno o bloqueado). */
  guardadoFallido(): boolean;
  /** Avisa tras cada cambio. Devuelve la función para dejar de avisar. */
  suscribir(oyente: () => void): () => void;
  /** Aplica una operación (o `() => estadoNuevo` para sustituirlo todo, como al importar), y guarda. */
  cambiar(operacion: (estado: Estado) => Estado): void;
}

export function crearTienda(almacen: Almacen | null): Tienda {
  let estado = leerEstado(almacen);
  let fallo = false;
  const oyentes = new Set<() => void>();
  return {
    estado: () => estado,
    guardadoFallido: () => fallo,
    suscribir(oyente) {
      oyentes.add(oyente);
      return () => {
        oyentes.delete(oyente);
      };
    },
    cambiar(operacion) {
      estado = operacion(estado);
      fallo = !guardarEstado(estado, almacen);
      oyentes.forEach((oyente) => oyente());
    },
  };
}
