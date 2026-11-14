import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Ficha, Titulo } from '../tipos';
import { cargarCatalogo } from './catalogo';

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

describe('cargarCatalogo', () => {
  it('devuelve pelis, series y conocidos del archivo, pedido con una ruta relativa', async () => {
    const fetchSimulado = simularFetch(() => json(archivo));

    const datos = await cargarCatalogo();

    expect(datos.pelis).toEqual([peli]);
    expect(datos.series).toEqual([serie]);
    expect(datos.conocidos).toEqual([conocida]);
    expect(fetchSimulado.mock.calls[0][0]).toBe('catalogo.json');
  });

  it.each([
    ['no hay red', () => Promise.reject(new TypeError('Failed to fetch'))],
    ['el servidor responde con error', () => json({}, 404)],
  ])('si %s, falla con un mensaje en español para el usuario', async (_caso, respuesta) => {
    simularFetch(respuesta);
    await expect(cargarCatalogo()).rejects.toThrow(/No se pudo cargar el catálogo.*conexión/);
  });

  it.each([
    ['no es JSON (por ejemplo, una página de wifi de pago)', () => Promise.resolve(new Response('<html>Inicia sesión</html>'))],
    ['le faltan las listas', () => json({ generado: 'hoy' })],
  ])('si el archivo %s, falla con un mensaje legible', async (_caso, respuesta) => {
    simularFetch(respuesta);
    await expect(cargarCatalogo()).rejects.toThrow(/catálogo de títulos no es válido/);
  });
});
