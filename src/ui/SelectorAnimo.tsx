import type { Animo } from '../tipos';

interface Props {
  /** Los botones que se ven, en orden, con su texto. */
  opciones: readonly { clave: Animo; texto: string }[];
  elegido: Animo | null;
  /** Un toque elige; otro toque en el mismo lo quita (null). */
  onCambio: (clave: Animo | null) => void;
}

/** «Hoy nos apetece…»: una fila de botones bajo los interruptores. Se cambia o se quita en cualquier momento. */
export function SelectorAnimo({ opciones, elegido, onCambio }: Props) {
  return (
    <div className="animo" role="group" aria-label="Hoy nos apetece">
      <span className="animo__texto" aria-hidden="true">
        Hoy:
      </span>
      {opciones.map((o) => (
        <button
          key={o.clave}
          type="button"
          className="chip"
          aria-pressed={o.clave === elegido}
          onClick={() => onCambio(o.clave === elegido ? null : o.clave)}
        >
          {o.texto}
        </button>
      ))}
    </div>
  );
}
