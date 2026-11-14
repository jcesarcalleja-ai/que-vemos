import { describe, expect, it } from 'vitest';
import type { Titulo } from '../tipos';
import { duracion, esTitulo, formatearNota } from './formato';

const base: Omit<Titulo, 'tipo'> = {
  id: 'x',
  titulo: 'X',
  anio: 2000,
  poster: null,
  generos: [],
  nota: 7,
  sinopsis: '',
  plataforma: 'netflix',
  enlace: '',
  trailer: null,
};

const peli = (duracionMin?: number): Titulo => ({ ...base, tipo: 'peli', duracionMin });
const serie = (temporadas?: number, episodios?: number): Titulo => ({ ...base, tipo: 'serie', temporadas, episodios });

describe('duracion', () => {
  it('escribe las pelis en horas y minutos', () => {
    expect(duracion(peli(98))).toBe('1 h 38 min');
    expect(duracion(peli(120))).toBe('2 h');
    expect(duracion(peli(45))).toBe('45 min');
  });

  it('escribe las series en temporadas y episodios, con singular y plural', () => {
    expect(duracion(serie(1, 8))).toBe('1 temporada · 8 episodios');
    expect(duracion(serie(3, 1))).toBe('3 temporadas · 1 episodio');
  });

  it('no inventa nada si faltan datos', () => {
    expect(duracion(peli())).toBeNull();
    expect(duracion(serie())).toBeNull();
    expect(duracion(serie(2, undefined))).toBe('2 temporadas');
  });
});

describe('formatearNota', () => {
  it('usa coma decimal y siempre un decimal', () => {
    expect(formatearNota(8.14)).toBe('8,1');
    expect(formatearNota(9)).toBe('9,0');
  });
});

describe('esTitulo', () => {
  it('distingue un título completo de una ficha', () => {
    const { plataforma: _p, nota: _n, sinopsis: _s, enlace: _e, trailer: _t, ...ficha } = peli(90);
    expect(esTitulo(peli(90))).toBe(true);
    expect(esTitulo(ficha)).toBe(false);
  });
});
