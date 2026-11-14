import type { Titulo } from '../tipos';
import { Boton } from './Boton';
import { MetaTitulo } from './InfoTitulo';
import { Poster } from './Poster';

export type Ronda = 'cuartos' | 'semifinal' | 'final';

const NOMBRE_RONDA: Record<Ronda, string> = {
  cuartos: 'Cuartos de final',
  semifinal: 'Semifinal',
  final: 'Final',
};

interface Props {
  a: Titulo;
  b: Titulo;
  ronda: Ronda;
  /** Se toca un título para elegirlo. */
  onElegir: (elegido: Titulo) => void;
  onYaLaVi: (titulo: Titulo) => void;
}

function Lado({
  titulo,
  onElegir,
  onYaLaVi,
}: {
  titulo: Titulo;
  onElegir: Props['onElegir'];
  onYaLaVi: Props['onYaLaVi'];
}) {
  return (
    <div className="duelo__lado">
      {/* Toda la tarjeta es pulsable: el botón del título la cubre entera con un ::after. */}
      <div className="duelo__tarjeta">
        <Poster poster={titulo.poster} titulo={titulo.titulo} anio={titulo.anio} />
        <h3 className="titulo__nombre">
          <button type="button" className="duelo__elegir" onClick={() => onElegir(titulo)}>
            {titulo.titulo}
          </button>
        </h3>
        <MetaTitulo titulo={titulo} />
      </div>
      <Boton variante="fantasma" onClick={() => onYaLaVi(titulo)}>
        Ya la vi
      </Boton>
    </div>
  );
}

/** Dos títulos enfrentados: «¿esta o esta?». Se elige tocando uno. */
export function Duelo({ a, b, ronda, onElegir, onYaLaVi }: Props) {
  return (
    <section className="duelo" aria-label={NOMBRE_RONDA[ronda]}>
      <header className="duelo__cabecera">
        <span className="duelo__ronda">{NOMBRE_RONDA[ronda]}</span>
        <h2 className="duelo__pregunta">¿Esta o esta?</h2>
      </header>
      <div className="duelo__lados">
        <Lado titulo={a} onElegir={onElegir} onYaLaVi={onYaLaVi} />
        <span className="duelo__o" aria-hidden="true">
          o
        </span>
        <Lado titulo={b} onElegir={onElegir} onYaLaVi={onYaLaVi} />
      </div>
    </section>
  );
}
