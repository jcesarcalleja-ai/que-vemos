import { GENEROS, type Genero } from '../tipos';

interface Props {
  seleccionados: readonly Genero[];
  onCambio: (seleccionados: Genero[]) => void;
  /** Texto para lectores de pantalla. */
  etiqueta?: string;
}

/** Elegir varios géneros de `GENEROS` (p. ej. los «jamás»). Controlado por quien lo usa. */
export function SelectorGeneros({ seleccionados, onCambio, etiqueta = 'Géneros' }: Props) {
  function alternar(g: Genero) {
    const nuevos = seleccionados.includes(g) ? seleccionados.filter((x) => x !== g) : [...seleccionados, g];
    onCambio(GENEROS.filter((x) => nuevos.includes(x))); // siempre en el orden de GENEROS
  }
  return (
    <div className="generos-selector" role="group" aria-label={etiqueta}>
      {GENEROS.map((g) => (
        <button
          key={g}
          type="button"
          className="chip"
          aria-pressed={seleccionados.includes(g)}
          onClick={() => alternar(g)}
        >
          {g}
        </button>
      ))}
    </div>
  );
}
