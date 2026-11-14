import { useState, type CSSProperties } from 'react';

interface Props {
  /** URL del póster, o null si no hay. */
  poster: string | null;
  titulo: string;
  anio?: number;
}

/** Tono (0–359) estable a partir del título, para que cada sustituto tenga su color. */
function tono(texto: string): number {
  let h = 0;
  for (const c of texto) h = (h * 31 + c.charCodeAt(0)) % 360;
  return h;
}

/** Póster 2:3. Sin URL, o si la imagen falla al cargar, muestra un sustituto con el título. */
export function Poster({ poster, titulo, anio }: Props) {
  const [roto, setRoto] = useState<string | null>(null);

  if (poster && roto !== poster) {
    return (
      <div className="poster">
        <img
          className="poster__img"
          src={poster}
          alt={`Póster de ${titulo}`}
          draggable={false}
          onError={() => setRoto(poster)}
        />
      </div>
    );
  }
  return (
    <div
      className="poster poster--vacio"
      role="img"
      aria-label={`Sin póster: ${titulo}`}
      style={{ '--tono': tono(titulo) } as CSSProperties}
    >
      <span className="poster__titulo" aria-hidden="true">
        {titulo}
      </span>
      {anio != null && (
        <span className="poster__anio" aria-hidden="true">
          {anio}
        </span>
      )}
    </div>
  );
}
