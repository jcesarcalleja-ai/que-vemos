import { describe, expect, it, vi } from 'vitest';
import type { Ficha } from '../tipos';
import { cambiarModo, estadoInicial, valorar } from './estado';
import { CLAVE_ALMACEN, exportarEstado, importarEstado, type Almacen } from './persistencia';
import { crearTienda } from './tienda';

function almacenFalso(inicial: Record<string, string> = {}): Almacen & { datos: Record<string, string> } {
  const datos = { ...inicial };
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
  it('arranca con el estado inicial si no hay nada guardado, y sin escribir nada', () => {
    const almacen = almacenFalso();
    const tienda = crearTienda(almacen);
    expect(tienda.estado()).toEqual(estadoInicial());
    expect(tienda.guardadoFallido()).toBe(false);
    expect(almacen.datos).toEqual({});
  });

  it('cada cambio se aplica, se guarda y avisa a los suscritos', () => {
    const almacen = almacenFalso();
    const tienda = crearTienda(almacen);
    const oyente = vi.fn();
    tienda.suscribir(oyente);

    tienda.cambiar((e) => cambiarModo(e, 'pareja'));
    tienda.cambiar((e) => valorar(e, 'yo', peli, 7));

    expect(tienda.estado().modo).toBe('pareja');
    expect(tienda.estado().perfiles.yo.valoraciones['peli-1'].nota).toBe(7);
    expect(oyente).toHaveBeenCalledTimes(2);
    expect(importarEstado(almacen.datos[CLAVE_ALMACEN])).toEqual(tienda.estado());
  });

  it('una tienda nueva sobre el mismo almacén recupera lo guardado (como al reabrir la app)', () => {
    const almacen = almacenFalso();
    crearTienda(almacen).cambiar((e) => cambiarModo(e, 'pareja'));
    expect(crearTienda(almacen).estado().modo).toBe('pareja');
  });

  it('dos cambios seguidos se encadenan: el segundo parte del resultado del primero', () => {
    const tienda = crearTienda(almacenFalso());
    tienda.cambiar((e) => cambiarModo(e, 'pareja'));
    tienda.cambiar((e) => valorar(e, 'ella', peli, 5));
    expect(tienda.estado().modo).toBe('pareja');
    expect(tienda.estado().perfiles.ella.valoraciones['peli-1']).toBeDefined();
  });

  it('un suscrito que se da de baja deja de recibir avisos', () => {
    const tienda = crearTienda(almacenFalso());
    const oyente = vi.fn();
    const baja = tienda.suscribir(oyente);
    baja();
    tienda.cambiar((e) => cambiarModo(e, 'pareja'));
    expect(oyente).not.toHaveBeenCalled();
  });

  it('importar sustituye todo lo anterior', () => {
    const almacen = almacenFalso();
    const tienda = crearTienda(almacen);
    tienda.cambiar((e) => valorar(e, 'yo', peli, 9));

    const importado = importarEstado(exportarEstado(cambiarModo(estadoInicial(), 'pareja')));
    tienda.cambiar(() => importado);

    expect(tienda.estado()).toEqual(importado);
    expect(tienda.estado().perfiles.yo.valoraciones).toEqual({});
    expect(importarEstado(almacen.datos[CLAVE_ALMACEN])).toEqual(importado);
  });

  it('si no se puede guardar, el cambio se aplica igualmente y se avisa con guardadoFallido', () => {
    const tienda = crearTienda(null);
    tienda.cambiar((e) => cambiarModo(e, 'pareja'));
    expect(tienda.estado().modo).toBe('pareja');
    expect(tienda.guardadoFallido()).toBe(true);
  });
});
