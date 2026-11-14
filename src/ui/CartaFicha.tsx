import type { Ficha, Titulo } from '../tipos';
import { InfoTitulo } from './InfoTitulo';
import { Poster } from './Poster';

/**
 * Póster grande con título, año y géneros (o todos los datos si es un `Titulo`), sin botones.
 * Para el swipe inicial: va encima de un `SelectorNota`.
 */
export function CartaFicha({ titulo }: { titulo: Ficha | Titulo }) {
  return (
    <article className="carta">
      <div className="carta__poster">
        <Poster poster={titulo.poster} titulo={titulo.titulo} anio={titulo.anio} />
      </div>
      <InfoTitulo titulo={titulo} lineas={2} />
    </article>
  );
}
