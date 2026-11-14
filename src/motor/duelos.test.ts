import { describe, expect, it } from 'vitest';
import { clones, estadoVacio, MARTES_21, peli, pelisConNotaCreciente, valorar, vetar } from './datos-prueba';
import { crearTorneo, elegirEnDuelo, situacionTorneo, sustituirEnTorneo, type Torneo } from './duelos';

/** Juega el torneo entero eligiendo siempre con `regla`; devuelve cada situación vista y el torneo final. */
function jugar(t: Torneo, regla: (par: [{ id: string }, { id: string }]) => string) {
  const vistas = [];
  while (situacionTorneo(t).ronda !== 'terminado') {
    const s = situacionTorneo(t);
    vistas.push(s);
    t = elegirEnDuelo(t, regla(s.par!));
  }
  return { vistas, final: t };
}

describe('Duelos: elección de los 8', () => {
  it('elige los 8 mejores elegibles y no repite', () => {
    const candidatos = pelisConNotaCreciente(12);
    const t = crearTorneo(candidatos, estadoVacio(), MARTES_21)!;
    expect(new Set(t.cuadro.map((x) => x.id)).size).toBe(8);
    expect(t.cuadro.every((x) => x.nota >= 5)).toBe(true); // las notas 1 a 4 se quedan fuera
  });

  it('deja fuera lo valorado o abandonado, y las notas de ella no cuentan en solo', () => {
    const candidatos = pelisConNotaCreciente(12);
    let e = valorar(estadoVacio(), 'yo', candidatos[11], 8);
    e = valorar(e, 'yo', candidatos[10], 'abandonada');
    e = valorar(e, 'ella', candidatos[9], 8);
    const ids = crearTorneo(candidatos, e, MARTES_21)!.cuadro.map((x) => x.id);
    expect(ids).not.toContain(candidatos[11].id);
    expect(ids).not.toContain(candidatos[10].id);
    expect(ids).toContain(candidatos[9].id);
  });

  it('usa mis gustos: un género que evito queda fuera aunque tenga nota', () => {
    const terror = Array.from({ length: 4 }, (_, i) => peli(`t${i}`, { generos: ['Terror'], nota: 8 }));
    // Los Duelos se turnan entre unos cuantos de los mejores: hacen falta bastantes alternativas igual de buenas.
    const resto = clones('r', 20, peli('x', { nota: 8 }));
    let e = estadoVacio();
    for (let i = 0; i < 4; i++) e = valorar(e, 'yo', peli(`malo${i}`, { generos: ['Terror'] }), 2);
    const ids = crearTorneo([...terror, ...resto], e, MARTES_21)!.cuadro.map((x) => x.id);
    for (const t of terror) expect(ids).not.toContain(t.id);
  });

  it('es null si no hay 8 elegibles, sin lanzar', () => {
    expect(crearTorneo(pelisConNotaCreciente(7), estadoVacio(), MARTES_21)).toBeNull();
    const candidatos = pelisConNotaCreciente(8);
    expect(crearTorneo(candidatos, valorar(estadoVacio(), 'yo', candidatos[0], 5), MARTES_21)).toBeNull();
    expect(crearTorneo([], estadoVacio(), MARTES_21)).toBeNull();
  });

  it('no modifica el estado', () => {
    const e = valorar(estadoVacio(), 'yo', peli('x'), 8);
    const antes = structuredClone(e);
    crearTorneo(pelisConNotaCreciente(10), e, MARTES_21);
    expect(e).toEqual(antes);
  });
});

describe('Duelos: el torneo', () => {
  const nuevo = () => crearTorneo(pelisConNotaCreciente(10), estadoVacio(), MARTES_21)!;

  it('con 7 elecciones hay ganadora: 4 de cuartos, 2 de semis y 1 de final', () => {
    const { vistas, final } = jugar(nuevo(), (par) => par[0].id);
    expect(vistas.map((s) => s.ronda)).toEqual(['cuartos', 'cuartos', 'cuartos', 'cuartos', 'semis', 'semis', 'final']);
    expect(vistas.map((s) => s.duelo)).toEqual([0, 1, 2, 3, 0, 1, 0]);
    expect(vistas.map((s) => s.duelosEnRonda)).toEqual([4, 4, 4, 4, 2, 2, 1]);
    expect(situacionTorneo(final).ganadora).not.toBeNull();
    expect(situacionTorneo(final).par).toBeNull();
    expect(situacionTorneo(final).elegidas).toBe(7);
  });

  it('cada ganador pasa a la ronda siguiente y la ganadora es la que ganó la final', () => {
    // Siempre gana el primero de cada par.
    let t = nuevo();
    const cuadro = t.cuadro;
    const ganadoresCuartos = [cuadro[0], cuadro[2], cuadro[4], cuadro[6]];
    for (let i = 0; i < 4; i++) t = elegirEnDuelo(t, situacionTorneo(t).par![0].id);

    let s = situacionTorneo(t);
    expect(s.ronda).toBe('semis');
    expect(s.par!.map((x) => x.id)).toEqual([ganadoresCuartos[0].id, ganadoresCuartos[1].id]);
    t = elegirEnDuelo(t, s.par![1].id); // gana el segundo: ganadoresCuartos[1]
    s = situacionTorneo(t);
    expect(s.par!.map((x) => x.id)).toEqual([ganadoresCuartos[2].id, ganadoresCuartos[3].id]);
    t = elegirEnDuelo(t, s.par![0].id); // gana ganadoresCuartos[2]

    s = situacionTorneo(t);
    expect(s.ronda).toBe('final');
    expect(s.par!.map((x) => x.id)).toEqual([ganadoresCuartos[1].id, ganadoresCuartos[2].id]);
    t = elegirEnDuelo(t, ganadoresCuartos[2].id);
    expect(situacionTorneo(t).ganadora!.id).toBe(ganadoresCuartos[2].id);
  });

  it('el torneo se puede guardar y recuperar como JSON', () => {
    let t = nuevo();
    t = elegirEnDuelo(t, situacionTorneo(t).par![1].id);
    expect(situacionTorneo(JSON.parse(JSON.stringify(t)))).toEqual(situacionTorneo(t));
  });

  it('una elección que no es de los dos del duelo se ignora', () => {
    const t = nuevo();
    const fuera = t.cuadro[7].id;
    expect(situacionTorneo(t).par!.map((x) => x.id)).not.toContain(fuera);
    expect(elegirEnDuelo(t, fuera)).toEqual(t);
    expect(elegirEnDuelo(t, 'no-existe')).toEqual(t);
  });

  it('no se puede seguir eligiendo cuando ya hay ganadora', () => {
    const { final } = jugar(nuevo(), (par) => par[0].id);
    expect(elegirEnDuelo(final, final.cuadro[0].id)).toEqual(final);
  });
});

describe('Duelos: "Ya la vi" sustituye un título', () => {
  const candidatos = pelisConNotaCreciente(12);
  const ahora = MARTES_21;
  const empezado = () => crearTorneo(candidatos, estadoVacio(), ahora)!;

  it('cambia un título aún no jugado por otro que no está en juego ni visto', () => {
    const t = empezado();
    const viejo = t.cuadro[7];
    const e = valorar(estadoVacio(), 'yo', viejo, 8);
    const nuevo = sustituirEnTorneo(t, viejo.id, candidatos, e, ahora)!;

    const ids = nuevo.cuadro.map((x) => x.id);
    expect(ids).not.toContain(viejo.id);
    expect(new Set(ids).size).toBe(8);
    expect(t.cuadro.map((x) => x.id)).not.toContain(nuevo.cuadro[7].id);
    expect(e.perfiles.yo.valoraciones[nuevo.cuadro[7].id]).toBeUndefined();
    expect(situacionTorneo(nuevo).ronda).toBe('cuartos');
  });

  it('el título que entra no está visto ni vetado: se salta lo valorado y los "jamás" en pareja', () => {
    const vetado = peli('vetado', { generos: ['Terror'], nota: 10 });
    const todos = [...candidatos, vetado];
    let e = vetar(estadoVacio('pareja'), 'ella', 'Terror');
    const t = crearTorneo(todos, e, ahora)!;
    const viejo = t.cuadro[0];
    e = valorar(e, 'yo', viejo, 3);
    const nuevo = sustituirEnTorneo(t, viejo.id, todos, e, ahora)!;
    expect(nuevo.cuadro.map((x) => x.id)).not.toContain(vetado.id);
  });

  it('si el título ya había ganado un duelo, el que entra ocupa su lugar en la ronda siguiente', () => {
    let t = empezado();
    const ganador = situacionTorneo(t).par![0];
    t = elegirEnDuelo(t, ganador.id);
    t = elegirEnDuelo(t, situacionTorneo(t).par![0].id);
    t = elegirEnDuelo(t, situacionTorneo(t).par![0].id);
    t = elegirEnDuelo(t, situacionTorneo(t).par![0].id);

    const e = valorar(estadoVacio(), 'yo', ganador, 9);
    const sustituido = sustituirEnTorneo(t, ganador.id, candidatos, e, ahora)!;
    const semis = situacionTorneo(sustituido);
    expect(semis.ronda).toBe('semis');
    const ids = semis.par!.map((x) => x.id);
    expect(ids).not.toContain(ganador.id);
    expect(ids[0]).toBe(sustituido.cuadro[0].id);
    expect(sustituido.cuadro[0].id).not.toBe(ganador.id);
  });

  it('no sustituye lo ya resuelto: un título eliminado o la ganadora', () => {
    let t = empezado();
    const [a, b] = situacionTorneo(t).par!;
    t = elegirEnDuelo(t, a.id);
    expect(sustituirEnTorneo(t, b.id, candidatos, estadoVacio(), ahora)).toBeNull();

    const { final } = jugar(empezado(), (par) => par[0].id);
    const campeona = situacionTorneo(final).ganadora!;
    expect(sustituirEnTorneo(final, campeona.id, candidatos, estadoVacio(), ahora)).toBeNull();
    expect(sustituirEnTorneo(t, 'no-existe', candidatos, estadoVacio(), ahora)).toBeNull();
  });

  it('es null, sin lanzar, si no queda recambio', () => {
    const justos = pelisConNotaCreciente(8);
    const t = crearTorneo(justos, estadoVacio(), ahora)!;
    const e = valorar(estadoVacio(), 'yo', t.cuadro[0], 8);
    expect(sustituirEnTorneo(t, t.cuadro[0].id, justos, e, ahora)).toBeNull();
  });
});
