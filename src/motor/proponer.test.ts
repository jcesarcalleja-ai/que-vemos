import { describe, expect, it } from 'vitest';
import {
  estadoVacio,
  gestear,
  MARTES_21,
  MIERCOLES_02,
  peli,
  SABADO_21,
  SABADO_2330,
  serie,
  valorar,
  vetar,
} from './datos-prueba';
import { proponer } from './proponer';

describe('proponer: lo que nunca propone', () => {
  const buena = peli('buena', { nota: 9.5 });
  const normal = peli('normal', { nota: 5 });

  it('no propone lo valorado por yo en modo solo, ni lo abandonado', () => {
    const visto = valorar(estadoVacio('solo'), 'yo', buena, 8);
    expect(proponer([buena, normal], visto, MARTES_21)).toBe(normal);

    const laSerie = serie('larga', { nota: 9.5 });
    const otra = serie('otra', { nota: 5 });
    const abandonada = valorar(estadoVacio('solo'), 'yo', laSerie, 'abandonada');
    expect(proponer([laSerie, otra], abandonada, MARTES_21)).toBe(otra);
  });

  it('en solo, lo que vio ella no cuenta; en pareja sí, lo de cualquiera de los dos', () => {
    const vistoPorElla = valorar(estadoVacio('solo'), 'ella', buena, 8);
    expect(proponer([buena, normal], vistoPorElla, MARTES_21)).toBe(buena);

    const pareja = valorar(estadoVacio('pareja'), 'ella', buena, 8);
    expect(proponer([buena, normal], pareja, MARTES_21)).toBe(normal);
    const parejaYo = valorar(estadoVacio('pareja'), 'yo', buena, 8);
    expect(proponer([buena, normal], parejaYo, MARTES_21)).toBe(normal);
  });

  it('en pareja respeta los "jamás" de ella; en solo no', () => {
    const miedo = peli('miedo', { nota: 9.9, generos: ['Terror', 'Suspense'] });
    const comedia = peli('comedia', { nota: 6, generos: ['Comedia'] });

    expect(proponer([miedo, comedia], vetar(estadoVacio('pareja'), 'ella', 'Terror'), MARTES_21)).toBe(comedia);
    expect(proponer([miedo, comedia], vetar(estadoVacio('solo'), 'ella', 'Terror'), MARTES_21)).toBe(miedo);
  });

  it('devuelve null si no queda nada y no modifica el estado', () => {
    expect(proponer([], estadoVacio(), MARTES_21)).toBeNull();

    const estado = valorar(estadoVacio('pareja'), 'yo', buena, 3);
    const antes = structuredClone(estado);
    expect(proponer([buena], estado, MARTES_21)).toBeNull();
    expect(estado).toEqual(antes);
  });
});

describe('proponer: gustos aprendidos', () => {
  // La comedia tiene un punto más de nota general; solo los gustos pueden darle la vuelta.
  const drama = peli('drama', { generos: ['Drama'], nota: 7 });
  const comedia = peli('comedia', { generos: ['Comedia'], nota: 8 });
  const dramaVisto = peli('drama-visto', { generos: ['Drama'] });
  const comediaVista = peli('comedia-vista', { generos: ['Comedia'] });

  it('con los perfiles vacíos propone algo razonable: el de mejor nota', () => {
    expect(proponer([drama, comedia], estadoVacio(), MARTES_21)).toBe(comedia);
  });

  it('una nota de 7 o más hace que gusten los títulos de ese género', () => {
    const e = valorar(estadoVacio(), 'yo', dramaVisto, 7);
    expect(proponer([drama, comedia], e, MARTES_21)).toBe(drama);
  });

  it('una nota de 4 o menos, o abandonar, hace evitar ese género', () => {
    const baja = valorar(estadoVacio(), 'yo', comediaVista, 4);
    expect(proponer([drama, comedia], baja, MARTES_21)).toBe(drama);

    const seriesComedia = serie('c', { generos: ['Comedia'], nota: 8 });
    const seriesDrama = serie('d', { generos: ['Drama'], nota: 7 });
    const abandonada = valorar(estadoVacio(), 'yo', serie('c-vista', { generos: ['Comedia'] }), 'abandonada');
    expect(proponer([seriesComedia, seriesDrama], abandonada, MARTES_21)).toBe(seriesDrama);
  });

  it('las notas 5 y 6 no enseñan nada', () => {
    expect(proponer([drama, comedia], valorar(estadoVacio(), 'yo', dramaVisto, 6), MARTES_21)).toBe(comedia);
    expect(proponer([drama, comedia], valorar(estadoVacio(), 'yo', dramaVisto, 5), MARTES_21)).toBe(comedia);
  });

  it('en pareja cuentan los gustos de los dos; en solo, solo los míos', () => {
    const ellaAmaDrama = valorar(estadoVacio('pareja'), 'ella', dramaVisto, 9);
    expect(proponer([drama, comedia], ellaAmaDrama, MARTES_21)).toBe(drama);

    const soloIgnoraAElla = valorar(estadoVacio('solo'), 'ella', dramaVisto, 9);
    expect(proponer([drama, comedia], soloIgnoraAElla, MARTES_21)).toBe(comedia);
  });

  it('los gestos del Match orientan, pero pesan menos que una nota', () => {
    // Un gesto de "sí" no basta para remontar un punto de nota general...
    const unGesto = gestear(estadoVacio(), 'yo', peli('g', { generos: ['Drama'] }), true);
    expect(proponer([drama, comedia], unGesto, MARTES_21)).toBe(comedia);

    // ...pero varios "no" seguidos a un género sí lo apartan...
    let rechazos = estadoVacio();
    for (const n of ['1', '2', '3', '4']) rechazos = gestear(rechazos, 'yo', peli(`c${n}`, { generos: ['Comedia'] }), false);
    expect(proponer([drama, comedia], rechazos, MARTES_21)).toBe(drama);

    // ...y una sola nota alta pesa más que un solo gesto a favor del otro género.
    const nota = valorar(estadoVacio(), 'yo', dramaVisto, 9);
    const notaContraGesto = gestear(nota, 'yo', peli('gc', { generos: ['Comedia'] }), true);
    expect(proponer([drama, comedia], notaContraGesto, MARTES_21)).toBe(drama);
  });
});

describe('proponer: duración según día y hora', () => {
  // La larga tiene mucha mejor nota; solo la preferencia de duración puede darle la vuelta.
  const corta = peli('corta', { nota: 6.5, duracionMin: 95 });
  const larga = peli('larga', { nota: 8.5, duracionMin: 150 });

  it('un martes a las 21:00 prefiere la corta', () => {
    expect(proponer([larga, corta], estadoVacio(), MARTES_21)).toBe(corta);
  });

  it('un sábado a las 23:30 prefiere la corta', () => {
    expect(proponer([larga, corta], estadoVacio(), SABADO_2330)).toBe(corta);
  });

  it('un sábado a las 21:00 le da igual la duración: gana la de mejor nota', () => {
    expect(proponer([larga, corta], estadoVacio(), SABADO_21)).toBe(larga);
  });

  it('105 minutos justos ya no cuentan como corta', () => {
    const justa = peli('justa', { nota: 6.5, duracionMin: 105 });
    expect(proponer([larga, justa], estadoVacio(), MARTES_21)).toBe(larga);
  });

  it('también con series: 1 temporada o menos de 10 episodios cuentan como cortas', () => {
    const miniserie = serie('mini', { nota: 6.5, temporadas: 1, episodios: 12 });
    const cortaPorEpisodios = serie('ep', { nota: 6.5, temporadas: 3, episodios: 9 });
    const fleje = serie('fleje', { nota: 8.5, temporadas: 5, episodios: 60 });
    expect(proponer([fleje, miniserie], estadoVacio(), MARTES_21)).toBe(miniserie);
    expect(proponer([fleje, cortaPorEpisodios], estadoVacio(), MARTES_21)).toBe(cortaPorEpisodios);
    expect(proponer([fleje, miniserie], estadoVacio(), SABADO_21)).toBe(fleje);
  });

  it('es una preferencia, no un filtro: una larga muy superior sigue ganando', () => {
    const malaCorta = peli('mala-corta', { nota: 2, duracionMin: 80 });
    const granLarga = peli('gran-larga', { nota: 9.5, duracionMin: 170 });
    expect(proponer([malaCorta, granLarga], estadoVacio(), MARTES_21)).toBe(granLarga);
    expect(proponer([granLarga], estadoVacio(), MARTES_21)).toBe(granLarga);
  });
});

describe('proponer: estabilidad', () => {
  // Muchos títulos iguales: solo el desempate decide, así que es donde más se notaría una inestabilidad.
  const candidatos = Array.from({ length: 30 }, (_, i) => peli(String(i)));

  it('durante la misma noche (06:00 a 06:00) sale siempre el mismo título', () => {
    const e = estadoVacio();
    const alAnochecer = proponer(candidatos, e, new Date(2026, 10, 17, 19, 0));
    expect(proponer(candidatos, e, MARTES_21)).toBe(alAnochecer);
    expect(proponer(candidatos, e, new Date(2026, 10, 17, 23, 59))).toBe(alAnochecer);
    expect(proponer(candidatos, e, MIERCOLES_02)).toBe(alAnochecer);
    expect(proponer(candidatos, e, new Date(2026, 10, 18, 5, 59))).toBe(alAnochecer);
  });

  it('puede cambiar de una noche a otra', () => {
    const e = estadoVacio();
    const propuestas = new Set<string>();
    for (let dia = 1; dia <= 14; dia++) propuestas.add(proponer(candidatos, e, new Date(2026, 10, dia, 21, 0))!.id);
    expect(propuestas.size).toBeGreaterThan(1);
  });
});
