import { describe, expect, it } from 'vitest';
import { GENEROS, type Plataforma } from '../tipos';
import { catalogoEjemplo } from './ejemplo';

describe('catálogo de ejemplo', () => {
  it('tiene al menos 40 pelis y 25 series repartidas entre las cuatro plataformas', async () => {
    const pelis = await catalogoEjemplo.disponibles('peli');
    const series = await catalogoEjemplo.disponibles('serie');
    expect(pelis.length).toBeGreaterThanOrEqual(40);
    expect(series.length).toBeGreaterThanOrEqual(25);
    for (const lista of [pelis, series]) {
      const plataformas = new Set<Plataforma>(lista.map((t) => t.plataforma));
      expect([...plataformas].sort()).toEqual(['max', 'movistar', 'netflix', 'prime']);
    }
  });

  it('mezcla pelis cortas y largas, y miniseries y series largas', async () => {
    const pelis = await catalogoEjemplo.disponibles('peli');
    const series = await catalogoEjemplo.disponibles('serie');
    expect(pelis.some((p) => p.duracionMin! < 105)).toBe(true);
    expect(pelis.some((p) => p.duracionMin! > 150)).toBe(true);
    expect(series.some((s) => s.temporadas === 1)).toBe(true);
    expect(series.some((s) => s.episodios! > 60)).toBe(true);
  });

  it('cumple el contrato: ids únicos, sin pósters, géneros válidos y datos propios de cada tipo', async () => {
    const todos = [...(await catalogoEjemplo.disponibles('peli')), ...(await catalogoEjemplo.disponibles('serie'))];
    expect(new Set(todos.map((t) => t.id)).size).toBe(todos.length);
    for (const t of todos) {
      expect(t.id.startsWith(`${t.tipo}-`)).toBe(true);
      expect(t.poster).toBeNull();
      expect(t.generos.length).toBeGreaterThan(0);
      expect(t.generos.every((g) => GENEROS.includes(g))).toBe(true);
      expect(t.nota).toBeGreaterThan(0);
      expect(t.nota).toBeLessThanOrEqual(10);
      expect(t.enlace).toMatch(/^https:\/\//);
      if (t.trailer !== null) expect(t.trailer).toMatch(/^https:\/\//);
      if (t.tipo === 'peli') expect(t.duracionMin).toBeGreaterThan(0);
      else expect(t.temporadas! > 0 && t.episodios! > 0).toBe(true);
    }
    expect(todos.some((t) => t.trailer === null)).toBe(true);
  });

  it('el enlace busca el título en la plataforma, bien codificado', async () => {
    const pelis = await catalogoEjemplo.disponibles('peli');
    const t = pelis.find((p) => p.titulo === 'Spider-Man: Un nuevo universo')!;
    expect(t.enlace).toContain(encodeURIComponent('Spider-Man: Un nuevo universo'));
  });

  it('conocidos(): unos 20, pelis y series mezcladas, sin repetir y como fichas', async () => {
    const conocidos = await catalogoEjemplo.conocidos();
    expect(conocidos).toHaveLength(20);
    expect(new Set(conocidos.map((f) => f.id)).size).toBe(20);
    expect(conocidos.filter((f) => f.tipo === 'peli').length).toBeGreaterThanOrEqual(8);
    expect(conocidos.filter((f) => f.tipo === 'serie').length).toBeGreaterThanOrEqual(8);
    expect('plataforma' in conocidos[0]!).toBe(false);
  });
});
