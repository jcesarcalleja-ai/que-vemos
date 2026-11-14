import { describe, expect, it } from 'vitest';
import { estadoVacio, MARTES_21, peli, pelisConNotaCreciente, valorar, vetar } from './datos-prueba';
import { crearMatch, ganadoraMatch, sustituirEnMatch } from './match';

const ahora = MARTES_21;
const estado = estadoVacio('pareja');

describe('Match: elección de los 10', () => {
  it('saca 10 títulos distintos, los mejores, sin vistos ni "jamás" de ella', () => {
    const candidatos = [...pelisConNotaCreciente(16), peli('terror', { generos: ['Terror'], nota: 20 })];
    let e = vetar(estado, 'ella', 'Terror');
    e = valorar(e, 'yo', candidatos[15], 8); // la de mejor nota entre las normales
    e = valorar(e, 'ella', candidatos[14], 'abandonada');

    const match = crearMatch(candidatos, e, ahora)!;
    const ids = match.map((t) => t.id);
    expect(match).toHaveLength(10);
    expect(new Set(ids).size).toBe(10);
    expect(ids).not.toContain('peli-terror');
    expect(ids).not.toContain(candidatos[15].id);
    expect(ids).not.toContain(candidatos[14].id);
    expect(match.every((t) => t.nota >= 4)).toBe(true); // lo peor (notas 1 a 3) se queda fuera
  });

  it('es null si no hay 10 elegibles, sin lanzar', () => {
    expect(crearMatch(pelisConNotaCreciente(9), estado, ahora)).toBeNull();
    expect(crearMatch([], estado, ahora)).toBeNull();
  });
});

describe('Match: la ganadora', () => {
  // Diez títulos con notas 1..10: t1 es el peor y t10 el mejor.
  const titulos = pelisConNotaCreciente(10);
  const t = (n: number) => titulos[n - 1];
  const si = (...ns: number[]) => Object.fromEntries(ns.map((n) => [t(n).id, true]));

  it('si coinciden en alguna, gana la mejor con sí de los dos', () => {
    const ella = si(2, 5, 9);
    const yo = si(2, 5, 8);
    // Coinciden la 2 y la 5; la 9 y la 8 tienen mejor nota pero solo un sí.
    expect(ganadoraMatch(titulos, ella, yo, estado, ahora)).toBe(t(5));
  });

  it('un no explícito cuenta igual que no deslizar', () => {
    const ella = { ...si(7), [t(3).id]: false };
    const yo = { ...si(7), [t(3).id]: true };
    expect(ganadoraMatch(titulos, ella, yo, estado, ahora)).toBe(t(7));
  });

  it('si no coinciden en ninguna, gana la mejor entre las que alguno marcó con sí', () => {
    const ella = si(1, 4);
    const yo = si(3, 8);
    expect(ganadoraMatch(titulos, ella, yo, estado, ahora)).toBe(t(8));
    expect(ganadoraMatch(titulos, si(6), {}, estado, ahora)).toBe(t(6));
    expect(ganadoraMatch(titulos, {}, si(2), estado, ahora)).toBe(t(2));
  });

  it('si nadie marcó ninguna, gana la mejor de las 10', () => {
    expect(ganadoraMatch(titulos, {}, {}, estado, ahora)).toBe(t(10));
  });

  it('con la lista vacía es null, sin lanzar', () => {
    expect(ganadoraMatch([], {}, {}, estado, ahora)).toBeNull();
  });

  it('el orden de la lista no cambia la ganadora', () => {
    const al_reves = [...titulos].reverse();
    expect(ganadoraMatch(al_reves, si(2, 5), si(2, 5), estado, ahora)).toBe(t(5));
  });
});

describe('Match: "Ya la vi" sustituye un título', () => {
  const candidatos = pelisConNotaCreciente(14);

  it('cambia el título, en su posición, por otro que no está en juego ni visto', () => {
    const match = crearMatch(candidatos, estado, ahora)!;
    const viejo = match[3];
    const e = valorar(estado, 'ella', viejo, 7);

    const nuevo = sustituirEnMatch(match, viejo.id, candidatos, e, ahora)!;
    expect(nuevo).toHaveLength(10);
    expect(nuevo.map((x) => x.id)).not.toContain(viejo.id);
    expect(new Set(nuevo.map((x) => x.id)).size).toBe(10);
    expect(nuevo[3].id).not.toBe(viejo.id);
    expect(match.map((x) => x.id)).not.toContain(nuevo[3].id); // no estaba ya en juego
    expect(nuevo.filter((_, i) => i !== 3)).toEqual(match.filter((_, i) => i !== 3));
  });

  it('respeta los "jamás" y lo visto por cualquiera de los dos al elegir el recambio', () => {
    const extra = [peli('terror', { generos: ['Terror'], nota: 30 }), peli('visto', { nota: 29 })];
    const todos = [...candidatos, ...extra];
    let e = vetar(estado, 'ella', 'Terror');
    e = valorar(e, 'yo', extra[1], 9);
    const match = crearMatch(todos, e, ahora)!;
    const nuevo = sustituirEnMatch(match, match[0].id, todos, valorar(e, 'yo', match[0], 8), ahora)!;
    const ids = nuevo.map((x) => x.id);
    expect(ids).not.toContain('peli-terror');
    expect(ids).not.toContain('peli-visto');
  });

  it('es null, sin lanzar, si el título no está o no queda recambio', () => {
    const justos = pelisConNotaCreciente(10);
    const match = crearMatch(justos, estado, ahora)!;
    expect(sustituirEnMatch(match, match[0].id, justos, estado, ahora)).toBeNull();
    expect(sustituirEnMatch(match, 'no-existe', candidatos, estado, ahora)).toBeNull();
  });
});
