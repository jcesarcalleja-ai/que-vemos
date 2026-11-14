import type { Modo, Tipo } from '../tipos';

interface Opcion<T extends string> {
  valor: T;
  texto: string;
}

function Segmentado<T extends string>({
  etiqueta,
  valor,
  opciones,
  onCambio,
}: {
  etiqueta: string;
  valor: T;
  opciones: Opcion<T>[];
  onCambio: (v: T) => void;
}) {
  return (
    <div className="segmentado" role="group" aria-label={etiqueta}>
      {opciones.map((o) => (
        <button
          key={o.valor}
          type="button"
          className="segmentado__opcion"
          aria-pressed={o.valor === valor}
          onClick={() => o.valor !== valor && onCambio(o.valor)}
        >
          {o.texto}
        </button>
      ))}
    </div>
  );
}

interface Props {
  tipo: Tipo;
  modo: Modo;
  onTipo: (tipo: Tipo) => void;
  onModo: (modo: Modo) => void;
}

/** Los dos interruptores de arriba: Pelis / Series y Solo / Con mi novia. */
export function Interruptores({ tipo, modo, onTipo, onModo }: Props) {
  return (
    <div className="interruptores">
      <Segmentado
        etiqueta="Qué quieres ver"
        valor={tipo}
        onCambio={onTipo}
        opciones={[
          { valor: 'peli', texto: 'Pelis' },
          { valor: 'serie', texto: 'Series' },
        ]}
      />
      <Segmentado
        etiqueta="Con quién"
        valor={modo}
        onCambio={onModo}
        opciones={[
          { valor: 'solo', texto: 'Solo' },
          { valor: 'pareja', texto: 'Con mi novia' },
        ]}
      />
    </div>
  );
}
