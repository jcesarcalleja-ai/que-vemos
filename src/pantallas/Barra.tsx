import { useEffect } from 'react';
import { Boton } from '../ui';

interface Props {
  /** Qué pantalla es, o cómo va (p. ej. «Turno de tu novia · 3 de 10»). */
  titulo: string;
  /** Si se pasa, aparece «← Propuesta», discreto, a la derecha. */
  onVolver?: () => void;
}

/** Cabecera de las pantallas que no son la propuesta: dónde estás y una forma discreta de salir. */
export function Barra({ titulo, onVolver }: Props) {
  return (
    <div className="barra">
      <h1 className="barra__titulo">{titulo}</h1>
      {onVolver && (
        <Boton variante="fantasma" className="boton--chico" onClick={onVolver}>
          ← Propuesta
        </Boton>
      )}
    </div>
  );
}

/** Al cambiar `clave` (otro título, otro duelo…) sube al principio de la pantalla. */
export function useArriba(clave: unknown) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [clave]);
}
