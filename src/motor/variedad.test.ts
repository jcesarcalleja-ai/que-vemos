// La variedad entre noches y la calidad de lo que se propone, con un catálogo del tamaño del real
// (cientos de títulos, generados con semilla: no hace falta ningún archivo) y un perfil que
// ha puntuado 15 títulos (le gustan drama, crimen y ciencia ficción).

import { describe, expect, it } from 'vitest';
import { catalogoSintetico, estadoConGustos } from './datos-prueba';
import { crearMatch, crearTorneo, proponer } from './index';
import type { Genero, Titulo } from '../tipos';

const GUSTADOS: Genero[] = ['Drama', 'Crimen', 'Ciencia ficción'];
const ES_ENTRE_SEMANA = (d: Date) => d.getDay() <= 4; // 21:30 de domingo a jueves
const ES_VIERNES_O_SABADO = (d: Date) => d.getDay() === 5 || d.getDay() === 6;

function esCorto(t: Titulo): boolean {
  return t.tipo === 'peli' ? t.duracionMin! < 105 : t.temporadas! <= 1 || t.episodios! < 10;
}

/** `cantidad` noches seguidas a las 21:30 desde `desde` (a la 21:30 del día `desde`). */
function noches(desde: Date, cantidad: number): Date[] {
  return Array.from({ length: cantidad }, (_, i) => new Date(2026, 10, desde.getDate() + i, 21, 30));
}

/** Diez noches seguidas de seis tandas distintas, para que un resultado bueno no sea cuestión de suerte. */
const VENTANAS = Array.from({ length: 6 }, (_, k) => noches(new Date(2026, 10, 16 + 23 * k, 21, 30), 10));

const estado = estadoConGustos();

describe.each([1, 2])('variedad con un catálogo grande (semilla %i)', (semilla) => {
  const catalogo = catalogoSintetico(semilla);

  describe.each([
    ['pelis', catalogo.pelis],
    ['series', catalogo.series],
  ] as const)('%s', (_nombre, titulos) => {
    const propuestas = (fechas: Date[]) => fechas.map((f) => proponer(titulos, estado, f)!);

    it('sin marcar nada, en 10 noches seguidas salen al menos 5 títulos distintos y ninguno ocupa más de 3', () => {
      for (const ventana of VENTANAS) {
        const veces = new Map<string, number>();
        for (const t of propuestas(ventana)) veces.set(t.id, (veces.get(t.id) ?? 0) + 1);
        expect(veces.size).toBeGreaterThanOrEqual(5);
        expect(Math.max(...veces.values())).toBeLessThanOrEqual(3);
      }
    });

    it('todas las propuestas tienen nota de 7,5 o más, también entre semana', () => {
      for (const ventana of VENTANAS) {
        for (const t of propuestas(ventana)) expect(t.nota).toBeGreaterThanOrEqual(7.5);
      }
    });

    it('los 8 de Duelos tienen nota media de 8,0 o más, también entre semana', () => {
      for (const ventana of VENTANAS) {
        for (const noche of ventana) {
          const cuadro = crearTorneo(titulos, estado, noche)!.cuadro;
          const media = cuadro.reduce((suma, t) => suma + t.nota, 0) / cuadro.length;
          expect(media).toBeGreaterThanOrEqual(8);
        }
      }
    });

    it('los 8 de Duelos cambian al menos 3 de una noche a la siguiente', () => {
      for (const ventana of VENTANAS) {
        const ids = ventana.map((n) => new Set(crearTorneo(titulos, estado, n)!.cuadro.map((t) => t.id)));
        for (let i = 1; i < ids.length; i++) {
          const repetidos = [...ids[i]!].filter((id) => ids[i - 1]!.has(id)).length;
          expect(8 - repetidos).toBeGreaterThanOrEqual(3);
        }
      }
    });

    it('entre semana al menos la mitad de las propuestas son cortas; viernes y sábado no se prefiere lo corto', () => {
      for (const ventana of VENTANAS) {
        const semana = ventana.filter(ES_ENTRE_SEMANA);
        const cortas = propuestas(semana).filter(esCorto).length;
        expect(cortas * 2).toBeGreaterThanOrEqual(semana.length);
      }
      // Viernes y sábado a las 21:30 no hay preferencia: salen bastantes menos cortas que de domingo a jueves.
      const proporcionCortas = (fechas: Date[]) => propuestas(fechas).filter(esCorto).length / fechas.length;
      const todas = VENTANAS.flat();
      expect(proporcionCortas(todas.filter(ES_VIERNES_O_SABADO))).toBeLessThan(
        proporcionCortas(todas.filter(ES_ENTRE_SEMANA)) - 0.25,
      );
    });

    it('los gustos mandan: la mayoría de propuestas son de sus géneros, sin ser todas de un único género', () => {
      for (const ventana of VENTANAS) {
        const propuesta = propuestas(ventana);
        const gustadas = propuesta.filter((t) => t.generos.some((g) => GUSTADOS.includes(g)));
        expect(gustadas.length).toBeGreaterThan(propuesta.length / 2);
        expect(propuesta.filter((t) => t.generos.length > 1).length).toBeGreaterThan(propuesta.length / 2);
      }
    });
  });
});

describe('lo demás también varía y se mantiene durante la noche', () => {
  const { pelis } = catalogoSintetico(1);
  const pareja = { ...estado, modo: 'pareja' as const };

  it('los 10 del Match cambian al menos 3 de una noche a la siguiente', () => {
    const ids = VENTANAS[0]!.map((n) => new Set(crearMatch(pelis, pareja, n)!.map((t) => t.id)));
    for (let i = 1; i < ids.length; i++) {
      const repetidos = [...ids[i]!].filter((id) => ids[i - 1]!.has(id)).length;
      expect(10 - repetidos).toBeGreaterThanOrEqual(3);
    }
  });

  it('los Duelos son los mismos durante toda la noche, de 06:00 a 06:00', () => {
    const cuadro = (h: Date) => crearTorneo(pelis, estado, h)!.cuadro.map((t) => t.id);
    const alAnochecer = cuadro(new Date(2026, 10, 17, 19, 0));
    expect(cuadro(new Date(2026, 10, 17, 23, 59))).toEqual(alAnochecer);
    expect(cuadro(new Date(2026, 10, 18, 5, 59))).toEqual(alAnochecer);
    expect(cuadro(new Date(2026, 10, 18, 6, 0))).not.toEqual(alAnochecer);
  });
});
