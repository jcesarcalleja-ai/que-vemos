import { describe, expect, it } from 'vitest';
import type { Ficha } from '../tipos';
import {
  apuntarGesto,
  cambiarModo,
  cambiarTipo,
  estadoInicial,
  fijarJamas,
  marcarInicioHecho,
  valorar,
} from './estado';

const ficha: Ficha = {
  id: 'peli-1',
  tipo: 'peli',
  titulo: 'Alien',
  anio: 1979,
  poster: null,
  generos: ['Terror', 'Ciencia ficción'],
};

describe('estadoInicial', () => {
  it('arranca en peli y solo, con los dos perfiles vacíos y sin swipe inicial', () => {
    const vacio = { valoraciones: {}, gestos: {}, jamas: [], inicioHecho: false };
    expect(estadoInicial()).toEqual({
      version: 1,
      tipo: 'peli',
      modo: 'solo',
      perfiles: { yo: vacio, ella: vacio },
    });
  });

  it('cada llamada da un estado independiente', () => {
    const a = estadoInicial();
    const b = estadoInicial();
    expect(a).not.toBe(b);
    expect(a.perfiles.yo).not.toBe(b.perfiles.yo);
  });
});

describe('operaciones', () => {
  it('cambian el interruptor de tipo y el de modo', () => {
    const e = estadoInicial();
    expect(cambiarTipo(e, 'serie').tipo).toBe('serie');
    expect(cambiarModo(e, 'pareja').modo).toBe('pareja');
    expect(cambiarTipo(e, 'serie').modo).toBe('solo');
  });

  it('valorar apunta la nota solo en el perfil indicado, con los datos de la ficha', () => {
    const e = valorar(estadoInicial(), 'ella', ficha, 8);
    expect(e.perfiles.ella.valoraciones['peli-1']).toEqual({
      tipo: 'peli',
      titulo: 'Alien',
      generos: ['Terror', 'Ciencia ficción'],
      nota: 8,
    });
    expect(e.perfiles.yo.valoraciones).toEqual({});
  });

  it('valorar admite "abandonada" y una nueva nota sustituye a la anterior', () => {
    const serie: Ficha = { ...ficha, id: 'serie-9', tipo: 'serie' };
    let e = valorar(estadoInicial(), 'yo', serie, 'abandonada');
    expect(e.perfiles.yo.valoraciones['serie-9'].nota).toBe('abandonada');
    e = valorar(e, 'yo', serie, 3);
    expect(e.perfiles.yo.valoraciones['serie-9'].nota).toBe(3);
    expect(Object.keys(e.perfiles.yo.valoraciones)).toHaveLength(1);
  });

  it.each([0, 11, 5.5, NaN])('valorar rechaza la nota %s y no cambia nada', (nota) => {
    expect(() => valorar(estadoInicial(), 'yo', ficha, nota)).toThrow(RangeError);
  });

  it('apuntarGesto guarda el sí/no del perfil y lo puede cambiar', () => {
    let e = apuntarGesto(estadoInicial(), 'yo', ficha, true);
    expect(e.perfiles.yo.gestos['peli-1']).toEqual({ generos: ['Terror', 'Ciencia ficción'], si: true });
    expect(e.perfiles.ella.gestos).toEqual({});
    e = apuntarGesto(e, 'yo', ficha, false);
    expect(e.perfiles.yo.gestos['peli-1'].si).toBe(false);
  });

  it('fijarJamas sustituye la lista de géneros vetados del perfil', () => {
    let e = fijarJamas(estadoInicial(), 'ella', ['Terror', 'Bélica']);
    expect(e.perfiles.ella.jamas).toEqual(['Terror', 'Bélica']);
    expect(e.perfiles.yo.jamas).toEqual([]);
    e = fijarJamas(e, 'ella', ['Reality']);
    expect(e.perfiles.ella.jamas).toEqual(['Reality']);
  });

  it('marcarInicioHecho marca solo al perfil indicado', () => {
    const e = marcarInicioHecho(estadoInicial(), 'yo');
    expect(e.perfiles.yo.inicioHecho).toBe(true);
    expect(e.perfiles.ella.inicioHecho).toBe(false);
  });

  it('ninguna operación muta el estado de entrada ni los datos que se le pasan', () => {
    const original = estadoInicial();
    const copia = structuredClone(original);
    const jamas = ['Terror' as const];
    const fichaCopia = structuredClone(ficha);

    const e = [
      cambiarTipo(original, 'serie'),
      cambiarModo(original, 'pareja'),
      valorar(original, 'yo', ficha, 9),
      apuntarGesto(original, 'ella', ficha, true),
      fijarJamas(original, 'ella', jamas),
      marcarInicioHecho(original, 'yo'),
    ];

    expect(original).toEqual(copia);
    expect(ficha).toEqual(fichaCopia);
    // El estado nuevo no comparte listas con lo que se le pasó: cambiarlas después no lo altera.
    jamas.push('Bélica' as never);
    ficha.generos.push('Drama');
    expect(e[4].perfiles.ella.jamas).toEqual(['Terror']);
    expect(e[2].perfiles.yo.valoraciones['peli-1'].generos).toEqual(['Terror', 'Ciencia ficción']);
    ficha.generos.pop();
  });
});
