import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Ficha, Titulo } from '../tipos';
import { crearCatalogo } from './catalogo';

const peli: Titulo = {
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
  trailer: null,
  duracionMin: 175,
};
const serie: Titulo = { ...peli, id: 'serie-1396', tipo: 'serie', titulo: 'Breaking Bad', duracionMin: undefined, temporadas: 5, episodios: 62 };
const conocida: Ficha = { id: 'peli-597', tipo: 'peli', titulo: 'Titanic', anio: 1997, poster: null, generos: ['Romance'] };
const archivo = { generado: '2026-11-14T05:00:00.000Z', pelis: [peli], series: [serie], conocidos: [conocida] };

function simularFetch(respuesta: () => Promise<Response>) {
  const fetchSimulado = vi.fn((_url: string) => respuesta());
  vi.stubGlobal('fetch', fetchSimulado);
  return fetchSimulado;
}
const json = (cuerpo: unknown, estado = 200) => Promise.resolve(new Response(JSON.stringify(cuerpo), { status: estado }));

afterEach(() => vi.unstubAllGlobals());

describe('catálogo real', () => {
  it('devuelve pelis, series y conocidos del archivo, con una sola descarga y una ruta relativa', async () => {
    const fetchSimulado = simularFetch(() => json(archivo));
    const catalogo = crearCatalogo();

    const [pelis, series, conocidos] = await Promise.all([catalogo.disponibles('peli'), catalogo.disponibles('serie'), catalogo.conocidos()]);
    await catalogo.disponibles('peli');

    expect(pelis).toEqual([peli]);
    expect(series).toEqual([serie]);
    expect(conocidos).toEqual([conocida]);
    expect(fetchSimulado).toHaveBeenCalledTimes(1);
    expect(fetchSimulado.mock.calls[0][0]).toBe('catalogo.json');
  });

  it('si quien lo usa ordena la lista, el catálogo no cambia', async () => {
    simularFetch(() => json({ ...archivo, pelis: [peli, { ...peli, id: 'peli-1' }] }));
    const catalogo = crearCatalogo();

    (await catalogo.disponibles('peli')).reverse();

    expect((await catalogo.disponibles('peli')).map((t) => t.id)).toEqual(['peli-238', 'peli-1']);
  });

  it.each([
    ['no hay red', () => Promise.reject(new TypeError('Failed to fetch'))],
    ['el servidor responde con error', () => json({}, 404)],
  ])('si %s, falla con un mensaje en español para el usuario', async (_caso, respuesta) => {
    simularFetch(respuesta);
    await expect(crearCatalogo().disponibles('peli')).rejects.toThrow(/No se pudo cargar el catálogo.*conexión/);
  });

  it.each([
    ['no es JSON (por ejemplo, una página de wifi de pago)', () => Promise.resolve(new Response('<html>Inicia sesión</html>'))],
    ['le faltan las listas', () => json({ generado: 'hoy' })],
  ])('si el archivo %s, falla con un mensaje legible', async (_caso, respuesta) => {
    simularFetch(respuesta);
    await expect(crearCatalogo().conocidos()).rejects.toThrow(/catálogo de títulos no es válido/);
  });

  it('tras un fallo, el siguiente intento vuelve a descargar', async () => {
    let intento = 0;
    const fetchSimulado = simularFetch(() => (++intento === 1 ? Promise.reject(new TypeError('Failed to fetch')) : json(archivo)));
    const catalogo = crearCatalogo();

    await expect(catalogo.disponibles('serie')).rejects.toThrow();
    expect(await catalogo.disponibles('serie')).toEqual([serie]);
    expect(fetchSimulado).toHaveBeenCalledTimes(2);
  });
});
