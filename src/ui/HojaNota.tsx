import { useEffect, useRef } from 'react';
import { SelectorNota } from './SelectorNota';

interface Props {
  /** Título al que se pone nota (se muestra bajo la pregunta). */
  titulo: string;
  onNota: (nota: number) => void;
  /** «La abandoné»: pásalo solo para series. */
  onAbandonada?: () => void;
  /** Cerrar sin puntuar (fondo, Escape o ✕). */
  onCerrar: () => void;
}

/** «Ya la vi»: hoja que sube desde abajo pidiendo la nota. Se monta cuando hay que enseñarla. */
export function HojaNota({ titulo, onNota, onAbandonada, onCerrar }: Props) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const focoAnterior = useRef<Element | null>(null);

  useEffect(() => {
    const d = dialogo.current;
    focoAnterior.current ??= document.activeElement;
    if (d && !d.open) d.showModal();
    // La hoja se cierra desmontándola, sin close(): el foco hay que devolverlo a mano al botón que la abrió.
    return () => {
      const anterior = focoAnterior.current;
      if (anterior instanceof HTMLElement && anterior.isConnected) anterior.focus();
    };
  }, []);

  return (
    <dialog
      ref={dialogo}
      className="hoja"
      aria-labelledby="hoja-nota-titulo"
      onCancel={(e) => {
        e.preventDefault();
        onCerrar();
      }}
      onClick={(e) => e.target === dialogo.current && onCerrar()}
    >
      <div className="hoja__contenido">
        <div className="hoja__cabecera">
          <div>
            <h2 className="hoja__titulo" id="hoja-nota-titulo">
              ¿Qué nota le das?
            </h2>
            <p className="hoja__sub">{titulo}</p>
          </div>
          <button type="button" className="hoja__cerrar" aria-label="Cerrar" onClick={onCerrar}>
            ✕
          </button>
        </div>
        <SelectorNota onNota={onNota} onAbandonada={onAbandonada} />
      </div>
    </dialog>
  );
}
