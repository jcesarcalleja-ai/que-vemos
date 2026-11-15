// Estado de la app y operaciones puras sobre él: cada una devuelve un Estado nuevo y no toca el anterior.

import type { DatosPerfil, Estado, Ficha, Genero, Modo, Perfil, Tipo, Valoracion } from '../tipos';

function perfilVacio(): DatosPerfil {
  return { valoraciones: {}, gestos: {}, jamas: [], inicioHecho: false };
}

/** Estado de una instalación nueva. */
export function estadoInicial(): Estado {
  return {
    version: 1,
    tipo: 'peli',
    modo: 'solo',
    perfiles: { yo: perfilVacio(), ella: perfilVacio() },
  };
}

function conPerfil(estado: Estado, perfil: Perfil, cambios: Partial<DatosPerfil>): Estado {
  return {
    ...estado,
    perfiles: { ...estado.perfiles, [perfil]: { ...estado.perfiles[perfil], ...cambios } },
  };
}

export function cambiarTipo(estado: Estado, tipo: Tipo): Estado {
  return { ...estado, tipo };
}

export function cambiarModo(estado: Estado, modo: Modo): Estado {
  return { ...estado, modo };
}

/** Apunta la nota (entera, 1–10) o 'abandonada' de `perfil` sobre `ficha`. Si ya había una, la sustituye. */
export function valorar(
  estado: Estado,
  perfil: Perfil,
  ficha: Ficha,
  nota: number | 'abandonada',
): Estado {
  if (nota !== 'abandonada' && !(Number.isInteger(nota) && nota >= 1 && nota <= 10)) {
    // Si se guardara una nota inválida, al releer el estado se descartaría entero.
    throw new RangeError(`Nota fuera de 1–10: ${nota}`);
  }
  const { tipo, titulo, generos } = ficha;
  return conValoracion(estado, perfil, ficha.id, { tipo, titulo, generos: [...generos], nota });
}

/** «No me apetece»: `perfil` descarta `ficha` sin verla, la noche número `noche`. No se le vuelve a proponer. */
export function descartar(estado: Estado, perfil: Perfil, ficha: Ficha, noche: number): Estado {
  const { tipo, titulo, generos, anio } = ficha;
  return conValoracion(estado, perfil, ficha.id, { tipo, titulo, generos: [...generos], nota: 'no-apetece', anio, noche });
}

function conValoracion(estado: Estado, perfil: Perfil, id: string, valoracion: Valoracion): Estado {
  return conPerfil(estado, perfil, {
    valoraciones: { ...estado.perfiles[perfil].valoraciones, [id]: valoracion },
  });
}

/** Apunta el sí/no del Match de `perfil` sobre `ficha`. Si ya había uno, lo sustituye. */
export function apuntarGesto(estado: Estado, perfil: Perfil, ficha: Ficha, si: boolean): Estado {
  return conPerfil(estado, perfil, {
    gestos: { ...estado.perfiles[perfil].gestos, [ficha.id]: { generos: [...ficha.generos], si } },
  });
}

/** Sustituye los géneros "jamás" de `perfil`. */
export function fijarJamas(estado: Estado, perfil: Perfil, generos: readonly Genero[]): Estado {
  return conPerfil(estado, perfil, { jamas: [...generos] });
}

export function marcarInicioHecho(estado: Estado, perfil: Perfil): Estado {
  return conPerfil(estado, perfil, { inicioHecho: true });
}
