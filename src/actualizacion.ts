// Aviso de que hay una versión nueva de la app lista (la ha instalado el service worker en `main.tsx`).
// La app la estrena recargando, pero solo cuando no corta nada: ver `App.tsx`.

import { useSyncExternalStore } from 'react';

let lista = false;
const avisar = new Set<() => void>();

export function marcarActualizacionLista() {
  lista = true;
  for (const f of avisar) f();
}

export function useActualizacionLista(): boolean {
  return useSyncExternalStore(
    (f) => {
      avisar.add(f);
      return () => avisar.delete(f);
    },
    () => lista,
  );
}
