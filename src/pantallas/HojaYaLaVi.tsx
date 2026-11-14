import type { Titulo } from '../tipos';
import { HojaNota } from '../ui';

interface Props {
  titulo: Titulo;
  onNota: (nota: number | 'abandonada') => void;
  onCerrar: () => void;
}

/** «Ya la vi»: pide la nota; en series, también «La abandoné». */
export function HojaYaLaVi({ titulo, onNota, onCerrar }: Props) {
  return (
    <HojaNota
      titulo={titulo.titulo}
      onNota={onNota}
      onAbandonada={titulo.tipo === 'serie' ? () => onNota('abandonada') : undefined}
      onCerrar={onCerrar}
    />
  );
}
