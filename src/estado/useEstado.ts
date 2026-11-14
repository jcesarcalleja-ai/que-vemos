import { useSyncExternalStore } from 'react';
import type { Estado } from '../tipos';
import { almacenDelNavegador } from './persistencia';
import { crearTienda, type Tienda } from './tienda';

// Una sola tienda para toda la app: todos los componentes ven el mismo estado.
let tienda: Tienda | undefined;

/** El estado de la app y la forma de cambiarlo; cada cambio se guarda en el navegador. */
export function useEstado(): {
  estado: Estado;
  /** `cambiar((e) => valorar(e, 'yo', ficha, 8))`. Para importar: `cambiar(() => estadoImportado)`. */
  cambiar: Tienda['cambiar'];
  /** true si el último cambio no se pudo guardar: conviene avisar al usuario. */
  guardadoFallido: boolean;
} {
  tienda ??= crearTienda(almacenDelNavegador());
  const t = tienda;
  const estado = useSyncExternalStore(t.suscribir, t.estado);
  const guardadoFallido = useSyncExternalStore(t.suscribir, t.guardadoFallido);
  return { estado, cambiar: t.cambiar, guardadoFallido };
}
