import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
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
      {completo && <Sinopsis key={completo.id} texto={completo.sinopsis} lineas={lineas} />}
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

/** Recortada a `lineas`; si no cabe, un toque la abre entera (y otro la vuelve a recoger). */
function Sinopsis({ texto, lineas }: { texto: string; lineas: number }) {
  const parrafo = useRef<HTMLParagraphElement>(null);
  const [abierta, setAbierta] = useState(false);
  const [recortada, setRecortada] = useState(false);

  useLayoutEffect(() => {
    const p = parrafo.current;
    if (p && !abierta) setRecortada(p.scrollHeight > p.clientHeight + 1);
  }, [texto, abierta]);

  const parte = (
    <p
      ref={parrafo}
      className={`sinopsis${abierta ? ' sinopsis--abierta' : ''}`}
      style={{ '--lineas': lineas } as CSSProperties}
    >
      {texto}
    </p>
  );
  if (!recortada && !abierta) return parte;
  return (
    <button type="button" className="sinopsis__boton" aria-expanded={abierta} onClick={() => setAbierta((a) => !a)}>
      {parte}
      <span className="sinopsis__mas">{abierta ? 'Ver menos' : 'Ver más'}</span>
    </button>
  );
}
