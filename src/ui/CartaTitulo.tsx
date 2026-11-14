import type { Titulo } from '../tipos';
import { Boton, EnlaceBoton } from './Boton';
import { InfoTitulo } from './InfoTitulo';
import { NOMBRE_PLATAFORMA } from './formato';
import { Poster } from './Poster';

interface Props {
  titulo: Titulo;
  onYaLaVi: () => void;
  /** Si no se pasa, no aparece «Elegir yo» (p. ej. en la pantalla de la ganadora). */
  onElegir?: () => void;
}

/** La propuesta (y la ganadora): póster grande, datos y los botones de acción. */
export function CartaTitulo({ titulo, onYaLaVi, onElegir }: Props) {
  return (
    <article className="carta">
      <div className="carta__poster">
        <Poster poster={titulo.poster} titulo={titulo.titulo} anio={titulo.anio} />
      </div>
      <InfoTitulo titulo={titulo} />
      <div className="carta__acciones">
        <EnlaceBoton variante="primario" ancho href={titulo.enlace}>
          Ver en {NOMBRE_PLATAFORMA[titulo.plataforma]}
        </EnlaceBoton>
        <div className="acciones">
          {titulo.trailer && <EnlaceBoton href={titulo.trailer}>Tráiler</EnlaceBoton>}
          <Boton onClick={onYaLaVi}>Ya la vi</Boton>
          {onElegir && <Boton onClick={onElegir}>Elegir yo</Boton>}
        </div>
      </div>
    </article>
  );
}
