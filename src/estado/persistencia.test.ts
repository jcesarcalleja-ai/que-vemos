import { describe, expect, it } from 'vitest';
import type { Estado, Ficha } from '../tipos';
import { apuntarGesto, cambiarModo, cambiarTipo, estadoInicial, fijarJamas, marcarInicioHecho, valorar } from './estado';
import {
  CLAVE_ALMACEN,
  exportarEstado,
  guardarEstado,
  importarEstado,
  leerEstado,
  type Almacen,
} from './persistencia';

function almacenFalso(inicial: Record<string, string> = {}): Almacen & { datos: Record<string, string> } {
  const datos = { ...inicial };
  return {
    datos,
    getItem: (clave) => datos[clave] ?? null,
    setItem: (clave, valor) => {
      datos[clave] = valor;
    },
  };
}

const peli: Ficha = { id: 'peli-1', tipo: 'peli', titulo: 'Alien', anio: 1979, poster: null, generos: ['Terror'] };
const serie: Ficha = { id: 'serie-2', tipo: 'serie', titulo: 'Dark', anio: 2017, poster: null, generos: ['Misterio'] };

/** Un estado con algo en cada rincón. */
function estadoConDatos(): Estado {
  let e = estadoInicial();
  e = cambiarTipo(e, 'serie');
  e = cambiarModo(e, 'pareja');
  e = valorar(e, 'yo', peli, 9);
  e = valorar(e, 'ella', serie, 'abandonada');
  e = apuntarGesto(e, 'ella', peli, false);
  e = fijarJamas(e, 'ella', ['Terror', 'Bélica']);
  e = marcarInicioHecho(e, 'yo');
  return e;
}

/** El estado con datos, como objeto JSON editable, para fabricar archivos corruptos. */
function archivoCon(cambio: (e: any) => void): string {
  const e = JSON.parse(exportarEstado(estadoConDatos()));
  cambio(e);
  return JSON.stringify(e);
}

describe('guardar y leer', () => {
  it('lo guardado se recupera igual', () => {
    const almacen = almacenFalso();
    const e = estadoConDatos();
    expect(guardarEstado(e, almacen)).toBe(true);
    expect(leerEstado(almacen)).toEqual(e);
  });

  it('sin nada guardado arranca con el estado inicial', () => {
    expect(leerEstado(almacenFalso())).toEqual(estadoInicial());
  });

  it('sin almacén (navegador que lo bloquea) arranca con el estado inicial y guardar avisa del fallo', () => {
    expect(leerEstado(null)).toEqual(estadoInicial());
    expect(guardarEstado(estadoInicial(), null)).toBe(false);
  });

  it.each([
    ['basura', 'esto no es json {{{'],
    ['JSON de otra forma', '{"hola": 1}'],
    ['una nota inválida', archivoCon((e) => (e.perfiles.yo.valoraciones['peli-1'].nota = 99))],
  ])('con datos ilegibles (%s) arranca con el estado inicial', (_nombre, texto) => {
    expect(leerEstado(almacenFalso({ [CLAVE_ALMACEN]: texto }))).toEqual(estadoInicial());
  });

  it('si el almacén lanza al leer, arranca con el estado inicial', () => {
    const roto: Almacen = {
      getItem: () => {
        throw new Error('SecurityError');
      },
      setItem: () => {},
    };
    expect(leerEstado(roto)).toEqual(estadoInicial());
  });

  it('si el almacén lanza al guardar (lleno), guardar devuelve false en vez de romper', () => {
    const lleno: Almacen = {
      getItem: () => null,
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
    };
    expect(guardarEstado(estadoInicial(), lleno)).toBe(false);
  });
});

describe('exportar e importar', () => {
  it('exportar y luego importar devuelve el mismo estado', () => {
    const e = estadoConDatos();
    expect(importarEstado(exportarEstado(e))).toEqual(e);
  });

  it('el estado inicial también sobrevive al viaje', () => {
    expect(importarEstado(exportarEstado(estadoInicial()))).toEqual(estadoInicial());
  });

  it('lo exportado es texto JSON', () => {
    expect(JSON.parse(exportarEstado(estadoConDatos())).version).toBe(1);
  });

  it('descarta campos desconocidos en lugar de colarlos en el estado', () => {
    const texto = archivoCon((e) => {
      e.intruso = true;
      e.perfiles.yo.otro = 1;
    });
    expect(importarEstado(texto)).toEqual(estadoConDatos());
  });

  it.each([
    ['texto que no es JSON', 'hola, esto no es json'],
    ['texto vacío', ''],
    ['JSON que no es un objeto', '[1, 2, 3]'],
    ['JSON de otra forma', '{"hola": "mundo"}'],
    ['otra versión', archivoCon((e) => (e.version = 2))],
    ['tipo desconocido', archivoCon((e) => (e.tipo = 'documental'))],
    ['modo desconocido', archivoCon((e) => (e.modo = 'grupo'))],
    ['sin perfiles', archivoCon((e) => delete e.perfiles)],
    ['sin el perfil de ella', archivoCon((e) => delete e.perfiles.ella)],
    ['inicioHecho que no es booleano', archivoCon((e) => (e.perfiles.yo.inicioHecho = 'sí'))],
    ['género inventado', archivoCon((e) => (e.perfiles.ella.jamas = ['Telenovela']))],
    ['género inventado en una nota', archivoCon((e) => (e.perfiles.yo.valoraciones['peli-1'].generos = ['Nada']))],
    ['gesto sin booleano', archivoCon((e) => (e.perfiles.ella.gestos['peli-1'].si = 'no'))],
    ['valoración sin título', archivoCon((e) => delete e.perfiles.yo.valoraciones['peli-1'].titulo)],
  ])('importar rechaza: %s', (_nombre, texto) => {
    expect(() => importarEstado(texto)).toThrow(Error);
  });

  it.each([0, 11, -3, 7.5, '8', null, 'abandonad'])('importar rechaza la nota %j (fuera de 1–10)', (nota) => {
    const texto = archivoCon((e) => (e.perfiles.yo.valoraciones['peli-1'].nota = nota));
    expect(() => importarEstado(texto)).toThrow(Error);
  });

  it.each([1, 10])('importar acepta la nota límite %s', (nota) => {
    const texto = archivoCon((e) => (e.perfiles.yo.valoraciones['peli-1'].nota = nota));
    expect(importarEstado(texto).perfiles.yo.valoraciones['peli-1'].nota).toBe(nota);
  });

  it('el error es un Error con mensaje en español, apto para enseñar tal cual', () => {
    let error: unknown;
    try {
      importarEstado('esto no es json');
    } catch (e) {
      error = e;
    }
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toMatch(/archivo/i);
  });

  it('un archivo con la clave __proto__ no contamina nada', () => {
    const texto = archivoCon(() => {}).replace('"peli-1"', '"__proto__"');
    const e = importarEstado(texto);
    expect(Object.keys(e.perfiles.yo.valoraciones)).toEqual(['__proto__']);
    expect(({} as { nota?: unknown }).nota).toBeUndefined();
  });

  it('importar sustituye todo lo anterior al guardarlo', () => {
    const almacen = almacenFalso();
    guardarEstado(estadoConDatos(), almacen);
    const importado = importarEstado(exportarEstado(estadoInicial()));
    guardarEstado(importado, almacen);
    expect(leerEstado(almacen)).toEqual(estadoInicial());
  });
});
