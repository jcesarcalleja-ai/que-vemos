import { describe, expect, it } from 'vitest';
import type { Ficha } from '../tipos';
import {
  apuntarGesto,
  descartar,
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
      animo: null,
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

  it('descartar apunta un «No me apetece» con el año del título y la noche, solo en el perfil indicado', () => {
    const e = descartar(estadoInicial(), 'yo', ficha, 20500);
    expect(e.perfiles.yo.valoraciones['peli-1']).toEqual({
      tipo: 'peli',
      titulo: 'Alien',
      generos: ['Terror', 'Ciencia ficción'],
      nota: 'no-apetece',
      anio: 1979,
      noche: 20500,
    });
    expect(e.perfiles.ella.valoraciones).toEqual({});
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

  it('el estado nuevo no muta el original ni comparte listas con lo que se le pasó', () => {
    const original = estadoInicial();
    const copia = structuredClone(original);
    const jamas = ['Terror' as const];
    const generos = [...ficha.generos];

    const e = fijarJamas(valorar(original, 'yo', { ...ficha, generos }, 9), 'ella', jamas);
    jamas.push('Bélica' as never);
    generos.push('Drama');

    expect(original).toEqual(copia);
    expect(e.perfiles.ella.jamas).toEqual(['Terror']);
    expect(e.perfiles.yo.valoraciones['peli-1'].generos).toEqual(['Terror', 'Ciencia ficción']);
  });
});
