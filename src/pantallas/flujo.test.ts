import { describe, expect, it } from 'vitest';
import { crearMatch, ganadoraMatch } from '../motor';
import { estadoVacio, MARTES_21, peli, pelisConNotaCreciente } from '../motor/datos-prueba';
import { apuntarGesto, estadoInicial, marcarInicioHecho, valorar } from '../estado';
import type { Ficha } from '../tipos';
import {
  deslizar,
  nuevaPartida,
  pendientesDeInicio,
  perfilPendienteDeInicio,
  sustituirEnPartida,
  turnoMatch,
} from './flujo';

describe('perfilPendienteDeInicio', () => {
  it('en una instalación nueva le toca a yo, aunque el modo sea pareja', () => {
    expect(perfilPendienteDeInicio(estadoInicial())).toBe('yo');
    expect(perfilPendienteDeInicio({ ...estadoInicial(), modo: 'pareja' })).toBe('yo');
  });

  it('ella solo hace su swipe en modo pareja, y una sola vez', () => {
    const yoHecho = marcarInicioHecho(estadoInicial(), 'yo');
    expect(perfilPendienteDeInicio(yoHecho)).toBeNull();
    expect(perfilPendienteDeInicio({ ...yoHecho, modo: 'pareja' })).toBe('ella');
    expect(perfilPendienteDeInicio(marcarInicioHecho({ ...yoHecho, modo: 'pareja' }, 'ella'))).toBeNull();
  });
});

describe('pendientesDeInicio', () => {
  const conocidos: Ficha[] = ['1', '2', '3'].map((n) => ({ ...peli(n), poster: null }));

  it('quita los que ese perfil ya puntuó, pero no los del otro', () => {
    const e = valorar(estadoInicial(), 'yo', conocidos[1]!, 8);
    expect(pendientesDeInicio(conocidos, e, 'yo').map((f) => f.id)).toEqual(['peli-1', 'peli-3']);
    expect(pendientesDeInicio(conocidos, e, 'ella')).toHaveLength(3);
  });
});

describe('Match: turnos', () => {
  const titulos = pelisConNotaCreciente(10);

  it('ella desliza los 10 en orden y después yo los mismos', () => {
    let p = nuevaPartida(titulos);
    expect(turnoMatch(p)).toMatchObject({ turno: 'ella', numero: 1, pendiente: titulos[0] });
    for (const t of titulos.slice(0, 9)) p = deslizar(p, 'ella', t.id, true);
    expect(turnoMatch(p)).toMatchObject({ turno: 'ella', numero: 10, pendiente: titulos[9] });
    p = deslizar(p, 'ella', titulos[9]!.id, false);
    expect(turnoMatch(p)).toMatchObject({ turno: 'yo', numero: 1, pendiente: titulos[0] });
    for (const t of titulos) p = deslizar(p, 'yo', t.id, false);
    expect(turnoMatch(p)).toMatchObject({ turno: 'fin', pendiente: null });
  });

  it('un «no» cuenta como deslizado: no vuelve a salir', () => {
    const p = deslizar(nuevaPartida(titulos), 'ella', titulos[0]!.id, false);
    expect(turnoMatch(p).pendiente).toBe(titulos[1]);
  });

  it('no modifica la partida anterior', () => {
    const p = nuevaPartida(titulos);
    deslizar(p, 'ella', titulos[0]!.id, true);
    expect(p.ella).toEqual({});
  });
});

describe('Match: «Ya la vi»', () => {
  const candidatos = pelisConNotaCreciente(14);
  const estado = estadoVacio('pareja');
  const inicial = crearMatch(candidatos, estado, MARTES_21)!;

  it('el título nuevo ocupa el mismo sitio, empieza sin deslizar y el viejo no vuelve', () => {
    let p = nuevaPartida(inicial);
    p = deslizar(p, 'ella', inicial[0]!.id, true);
    const viejo = inicial[1]!;
    const conNota = valorar(estado, 'ella', viejo, 9);
    const nueva = sustituirEnPartida(p, viejo.id, candidatos, conNota, MARTES_21)!;

    expect(nueva.titulos).toHaveLength(10);
    expect(nueva.titulos[1]!.id).not.toBe(viejo.id);
    expect(nueva.titulos.map((t) => t.id)).not.toContain(viejo.id);
    expect(new Set(nueva.titulos.map((t) => t.id)).size).toBe(10);
    expect(nueva.ella).toEqual({ [inicial[0]!.id]: true });
    expect(turnoMatch(nueva)).toMatchObject({ turno: 'ella', numero: 2, pendiente: nueva.titulos[1] });
  });

  it('olvida lo que se había deslizado del título viejo', () => {
    let p = nuevaPartida(inicial);
    for (const perfil of ['ella', 'yo'] as const) p = deslizar(p, perfil, inicial[2]!.id, true);
    const conNota = valorar(estado, 'yo', inicial[2]!, 3);
    const nueva = sustituirEnPartida(p, inicial[2]!.id, candidatos, conNota, MARTES_21)!;
    expect(nueva.ella).toEqual({});
    expect(nueva.yo).toEqual({});
  });

  it('devuelve null si no queda ningún recambio', () => {
    const sin = nuevaPartida(inicial);
    const conNota = valorar(estado, 'ella', inicial[0]!, 5);
    expect(sustituirEnPartida(sin, inicial[0]!.id, inicial, conNota, MARTES_21)).toBeNull();
  });
});

describe('Match de principio a fin', () => {
  it('con un sí de los dos en el mismo título, gana ese; los gestos se guardan en quien desliza', () => {
    const candidatos = pelisConNotaCreciente(12);
    let estado = estadoVacio('pareja');
    const titulos = crearMatch(candidatos, estado, MARTES_21)!;
    let p = nuevaPartida(titulos);
    const objetivo = titulos[4]!;
    for (let paso = 0; paso < 20; paso++) {
      const { turno, pendiente } = turnoMatch(p);
      if (turno === 'fin') break;
      const si = pendiente!.id === objetivo.id;
      estado = apuntarGesto(estado, turno, pendiente!, si);
      p = deslizar(p, turno, pendiente!.id, si);
    }
    expect(turnoMatch(p).turno).toBe('fin');
    expect(ganadoraMatch(p.titulos, p.ella, p.yo, estado, MARTES_21)).toBe(objetivo);
    expect(Object.keys(estado.perfiles.ella.gestos)).toHaveLength(10);
    expect(Object.keys(estado.perfiles.yo.gestos)).toHaveLength(10);
  });
});
