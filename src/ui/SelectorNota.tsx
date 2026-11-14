import type { CSSProperties } from 'react';
import { Boton } from './Boton';

const NOTAS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

interface Props {
  onNota: (nota: number) => void;
  /** «No la he visto» (swipe inicial). Si no se pasa, no aparece. */
  onNoVista?: () => void;
  /** «La abandoné» (solo series). Si no se pasa, no aparece. */
  onAbandonada?: () => void;
}

/** Números del 1 al 10 para pulsar, con acciones extra opcionales. */
export function SelectorNota({ onNota, onNoVista, onAbandonada }: Props) {
  return (
    <div className="nota">
      <div className="nota__numeros" role="group" aria-label="Nota del 1 al 10">
        {NOTAS.map((n) => (
          <button
            key={n}
            type="button"
            className="nota__numero"
            style={{ '--n': n } as CSSProperties}
            onClick={() => onNota(n)}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="nota__ayuda" aria-hidden="true">
        <span>1 · Fatal</span>
        <span>10 · Obra maestra</span>
      </div>
      {onAbandonada && (
        <Boton ancho onClick={onAbandonada}>
          La abandoné
        </Boton>
      )}
      {onNoVista && (
        <Boton ancho onClick={onNoVista}>
          No la he visto
        </Boton>
      )}
    </div>
  );
}
