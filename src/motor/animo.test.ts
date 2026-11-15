import { describe, expect, it } from 'vitest';
import { fijarAnimo, fijarJamas } from '../estado';
import { clones, estadoVacio, MARTES_21, MIERCOLES_02, peli, serie } from './datos-prueba';
import { animoDeHoy, animosDisponibles, titulosDeHoy } from './animo';
import { proponer } from './proponer';
import { numeroDeNoche } from './puntuar';

const miedo = clones('miedo', 12, peli('m', { generos: ['Terror', 'Suspense'], nota: 7.6 }));
const risa = clones('risa', 12, peli('r', { generos: ['Comedia'], nota: 8.6 }));
const catalogo = [...miedo, ...risa];
const conAnimo = (clave: Parameters<typeof fijarAnimo>[1], ahora = MARTES_21, modo: 'solo' | 'pareja' = 'solo') =>
  fijarAnimo(estadoVacio(modo), clave, numeroDeNoche(ahora));

describe('«Hoy nos apetece…»', () => {
  it('sin elegir nada propone como siempre: la comedia, que tiene mejor nota', () => {
    expect(proponer(titulosDeHoy(catalogo, estadoVacio(), MARTES_21), estadoVacio(), MARTES_21)!.generos).toContain('Comedia');
  });

  it('con «Miedo» solo entra lo de miedo, aunque haya cosas mejor puntuadas', () => {
    const e = conAnimo('miedo');
    expect(titulosDeHoy(catalogo, e, MARTES_21)).toEqual(miedo);
    expect(proponer(titulosDeHoy(catalogo, e, MARTES_21), e, MARTES_21)!.generos).toContain('Terror');
  });

  it('se puede cambiar: lo último elegido manda; y quitar, con null', () => {
    const e = fijarAnimo(conAnimo('miedo'), 'risa', numeroDeNoche(MARTES_21));
    expect(animoDeHoy(catalogo, e, MARTES_21)).toBe('risa');
    expect(titulosDeHoy(catalogo, fijarAnimo(e, null, 0), MARTES_21)).toEqual(catalogo);
  });

  it('vale toda la noche (también pasadas las 00:00) y al día siguiente ya no cuenta', () => {
    const e = conAnimo('miedo');
    expect(animoDeHoy(catalogo, e, MIERCOLES_02)).toBe('miedo');
    expect(animoDeHoy(catalogo, e, new Date(2026, 10, 18, 21, 0))).toBeNull();
  });

  it('un botón solo sale si hay al menos 10 títulos de ese estilo', () => {
    expect(animosDisponibles(catalogo, estadoVacio())).toEqual(['risa', 'miedo', 'intriga']);
    // En series no hay terror: «Miedo» no sale, y si estaba elegido no deja la lista vacía.
    const series = clones('s', 12, serie('s', { generos: ['Comedia'] }));
    expect(animosDisponibles(series, estadoVacio())).toEqual(['risa']);
    expect(titulosDeHoy(series, conAnimo('miedo'), MARTES_21)).toEqual(series);
  });

  it('en pareja no salen los botones que caen enteros en los «jamás» de ella', () => {
    const e = fijarJamas(estadoVacio('pareja'), 'ella', ['Terror']);
    expect(animosDisponibles(catalogo, e)).not.toContain('miedo');
    expect(animosDisponibles(catalogo, fijarJamas(estadoVacio('solo'), 'ella', ['Terror']))).toContain('miedo');
  });
});
