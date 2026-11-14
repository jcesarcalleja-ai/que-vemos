import { describe, expect, it } from 'vitest';
// @ts-expect-error: son módulos .mjs de Node sin tipos; solo se prueba su comportamiento
import { elegirTrailer, traducirGeneros } from './generar-catalogo.mjs';
// @ts-expect-error: ídem
import { validarCatalogo } from './validar-catalogo.mjs';

const peli = {
  id: 'peli-238',
  tipo: 'peli',
  titulo: 'El padrino',
  anio: 1972,
  poster: 'https://image.tmdb.org/t/p/w500/a.jpg',
  generos: ['Drama', 'Crimen'],
  nota: 9.2,
  sinopsis: 'Una familia de la mafia.',
  plataforma: 'netflix',
  enlace: 'https://www.netflix.com/title/60011152',
  trailer: 'https://www.youtube.com/watch?v=abcdefghijk',
  duracionMin: 175,
};
const serie = { ...peli, id: 'serie-1396', tipo: 'serie', titulo: 'Breaking Bad', duracionMin: undefined, temporadas: 5, episodios: 62 };
const conocida = { id: 'peli-597', tipo: 'peli', titulo: 'Titanic', anio: 1997, poster: 'https://image.tmdb.org/t/p/w500/b.jpg', generos: ['Romance'] };
const valido = () => ({ generado: '2026-11-14T05:00:00.000Z', pelis: [{ ...peli }], series: [{ ...serie }], conocidos: [{ ...conocida }] });

describe('validar el catálogo generado', () => {
  it('acepta un catálogo que cumple el contrato', () => {
    expect(validarCatalogo(valido())).toEqual([]);
  });

  it.each([
    ['un género fuera del vocabulario', (c: any) => (c.pelis[0].generos = ['Drama', 'Película de TV']), /géneros fuera del vocabulario/],
    ['una nota por encima de 10', (c: any) => (c.pelis[0].nota = 10.5), /nota fuera de 0-10/],
    ['una peli sin duración', (c: any) => delete c.pelis[0].duracionMin, /sin duración/],
    ['una serie sin episodios', (c: any) => delete c.series[0].episodios, /sin episodios/],
    ['un título sin póster', (c: any) => (c.pelis[0].poster = null), /póster no válido/],
    ['una plataforma que no es una de las cuatro', (c: any) => (c.pelis[0].plataforma = 'disney'), /plataforma desconocida/],
    ['un tráiler que no es de YouTube', (c: any) => (c.pelis[0].trailer = 'https://vimeo.com/1'), /tráiler no válido/],
    ['un id repetido', (c: any) => (c.series[0].id = 'peli-238'), /id/],
    ['la fecha de generación ausente', (c: any) => delete c.generado, /generado/],
  ])('rechaza %s', (_caso, estropear, mensaje) => {
    const c = valido();
    estropear(c);
    expect(validarCatalogo(c).join('\n')).toMatch(mensaje);
  });
});

describe('traducir lo que da TMDB', () => {
  it('los géneros de series que agrupan dos dan los dos del vocabulario, sin repetir', () => {
    expect(traducirGeneros([10759, 18, 10765])).toEqual(['Acción', 'Aventura', 'Drama', 'Ciencia ficción', 'Fantasía']);
    expect(traducirGeneros([28, 10759])).toEqual(['Acción', 'Aventura']);
  });

  it('ignora los géneros sin equivalente', () => {
    expect(traducirGeneros([10770, 10763, 10767, 35])).toEqual(['Comedia']);
  });

  it('prefiere el tráiler en español, luego el original, luego inglés, y nunca algo que no sea de YouTube', () => {
    const v = (idioma: string, key: string, extra = {}) => ({ site: 'YouTube', type: 'Trailer', iso_639_1: idioma, key, official: true, published_at: '2020-01-01', ...extra });
    expect(elegirTrailer([v('en', 'ingles'), v('es', 'espanol')], 'en')).toBe('https://www.youtube.com/watch?v=espanol');
    expect(elegirTrailer([v('en', 'ingles'), v('fr', 'frances')], 'fr')).toBe('https://www.youtube.com/watch?v=frances');
    expect(elegirTrailer([v('en', 'vimeo', { site: 'Vimeo' }), v('en', 'clip', { type: 'Clip' })], 'en')).toBeNull();
    expect(elegirTrailer([], 'en')).toBeNull();
  });
});
