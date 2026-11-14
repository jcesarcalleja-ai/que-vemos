import { describe, expect, it, vi } from 'vitest';
import type { Ficha } from '../tipos';
import { cambiarModo, valorar } from './estado';
import { CLAVE_ALMACEN, importarEstado, type Almacen } from './persistencia';
import { crearTienda } from './useEstado';

function almacenFalso(): Almacen & { datos: Record<string, string> } {
  const datos: Record<string, string> = {};
  return {
    datos,
    getItem: (clave) => datos[clave] ?? null,
    setItem: (clave, valor) => {
      datos[clave] = valor;
    },
  };
}

const peli: Ficha = { id: 'peli-1', tipo: 'peli', titulo: 'Alien', anio: 1979, poster: null, generos: ['Terror'] };

describe('crearTienda', () => {
  it('cada cambio se aplica, se guarda y avisa a los suscritos', () => {
    const almacen = almacenFalso();
    const tienda = crearTienda(almacen);
    const oyente = vi.fn();
    tienda.suscribir(oyente);

    tienda.cambiar((e) => cambiarModo(e, 'pareja'));
    tienda.cambiar((e) => valorar(e, 'yo', peli, 7));

    const { estado } = tienda.leer();
    expect(estado.modo).toBe('pareja');
    expect(estado.perfiles.yo.valoraciones['peli-1'].nota).toBe(7);
    expect(oyente).toHaveBeenCalledTimes(2);
    expect(importarEstado(almacen.datos[CLAVE_ALMACEN])).toEqual(estado);
  });

  it('dos cambios seguidos se encadenan: el segundo parte del resultado del primero', () => {
    const tienda = crearTienda(almacenFalso());
    tienda.cambiar((e) => cambiarModo(e, 'pareja'));
    tienda.cambiar((e) => valorar(e, 'ella', peli, 5));
    const { estado } = tienda.leer();
    expect(estado.modo).toBe('pareja');
    expect(estado.perfiles.ella.valoraciones['peli-1']).toBeDefined();
  });

  it('un suscrito que se da de baja deja de recibir avisos', () => {
    const tienda = crearTienda(almacenFalso());
    const oyente = vi.fn();
    const baja = tienda.suscribir(oyente);
    baja();
    tienda.cambiar((e) => cambiarModo(e, 'pareja'));
    expect(oyente).not.toHaveBeenCalled();
  });

  it('si no se puede guardar, el cambio se aplica igualmente y se avisa con guardadoFallido', () => {
    const tienda = crearTienda(null);
    expect(tienda.leer().guardadoFallido).toBe(false);
    tienda.cambiar((e) => cambiarModo(e, 'pareja'));
    expect(tienda.leer().estado.modo).toBe('pareja');
    expect(tienda.leer().guardadoFallido).toBe(true);
  });
});
