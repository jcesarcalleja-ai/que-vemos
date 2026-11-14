import type { CSSProperties } from 'react';
import type { Ficha, Titulo } from '../tipos';
import { NOMBRE_PLATAFORMA, duracion, esTitulo, formatearNota } from './formato';

interface Props {
  titulo: Ficha | Titulo;
  /** Líneas de sinopsis antes de recortar (por defecto 3). */
  lineas?: number;
}

/** Una línea con año, duración, nota y plataforma. */
export function MetaTitulo({ titulo }: { titulo: Ficha | Titulo }) {
  const completo = esTitulo(titulo) ? titulo : null;
  const dur = completo ? duracion(completo) : null;
  return (
    <p className="meta">
      <span className="meta__dato">{titulo.anio}</span>
      {dur && <span className="meta__dato">{dur}</span>}
      {completo && (
        <span className="meta__dato meta__nota" aria-label={`Nota ${formatearNota(completo.nota)}`}>
          ★ {formatearNota(completo.nota)}
        </span>
      )}
      {completo && (
        <span className={`meta__dato plataforma plataforma--${completo.plataforma}`}>
          {NOMBRE_PLATAFORMA[completo.plataforma]}
        </span>
      )}
    </p>
  );
}

/** Título, año, duración, nota, plataforma y sinopsis recortada. Con una `Ficha` enseña los géneros. */
export function InfoTitulo({ titulo, lineas = 3 }: Props) {
  const completo = esTitulo(titulo) ? titulo : null;
  return (
    <div>
      <h2 className="titulo__nombre">{titulo.titulo}</h2>
      <MetaTitulo titulo={titulo} />
      {completo && (
        <p className="sinopsis" style={{ '--lineas': lineas } as CSSProperties}>
          {completo.sinopsis}
        </p>
      )}
      {!completo && titulo.generos.length > 0 && (
        <ul className="generos" aria-label="Géneros">
          {titulo.generos.map((g) => (
            <li key={g} className="generos__item">
              {g}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
