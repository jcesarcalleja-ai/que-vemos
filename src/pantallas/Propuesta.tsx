import { useMemo, useState } from 'react';
import { cambiarModo, cambiarTipo, descartar, fijarAnimo, useEstado, valorar } from '../estado';
import { ANIMOS, animoDeHoy, animosDisponibles, numeroDeNoche, proponer, titulosDeHoy } from '../motor';
import type { Titulo } from '../tipos';
import { Boton, CartaTitulo, Interruptores, Mensaje, Pantalla, SelectorAnimo } from '../ui';
import { useArriba } from './Barra';
import { descartesDeLaNoche, TOPE_NO_APETECE } from './flujo';
import { HojaYaLaVi } from './HojaYaLaVi';

interface Props {
  /** Los títulos disponibles del tipo elegido (todos: el «Hoy nos apetece…» se aplica aquí). */
  titulos: Titulo[];
  /** «Elegir yo», o el último «No me apetece» que cabe en una noche: recibe la propuesta que no ha convencido. */
  onElegir: (propuesta: Titulo) => void;
  onAjustes: () => void;
}

/** La pantalla de siempre: ya hay un título propuesto, con los dos interruptores arriba. */
export function Propuesta({ titulos, onElegir, onAjustes }: Props) {
  const { estado, cambiar } = useEstado();
  const propuesta = useMemo(() => proponer(titulosDeHoy(titulos, estado, new Date()), estado, new Date()), [titulos, estado]);
  const disponibles = animosDisponibles(titulos, estado);
  const animo = animoDeHoy(titulos, estado, new Date());
  const textoAnimo = ANIMOS.find((a) => a.clave === animo)?.texto;
  const [puntuando, setPuntuando] = useState(false);
  useArriba(propuesta?.id);

  /** «No me apetece»: ese título no vuelve y sale otro; al llegar al tope de la noche, toca elegir. */
  function noApetece(titulo: Titulo) {
    const ahora = new Date();
    cambiar((e) => descartar(e, 'yo', titulo, numeroDeNoche(ahora)));
    if (descartesDeLaNoche(estado, ahora) + 1 >= TOPE_NO_APETECE) onElegir(titulo);
  }

  return (
    <Pantalla
      cabecera={
        <>
          <Interruptores
            tipo={estado.tipo}
            modo={estado.modo}
            onTipo={(tipo) => cambiar((e) => cambiarTipo(e, tipo))}
            onModo={(modo) => cambiar((e) => cambiarModo(e, modo))}
          />
          <SelectorAnimo
            opciones={ANIMOS.filter((a) => disponibles.includes(a.clave))}
            elegido={animo}
            onCambio={(clave) => cambiar((e) => fijarAnimo(e, clave, numeroDeNoche(new Date())))}
          />
        </>
      }
      pie={
        <Boton variante="fantasma" className="boton--chico boton--centrado" onClick={onAjustes}>
          Ajustes
        </Boton>
      }
    >
      {propuesta ? (
        <CartaTitulo
          titulo={propuesta}
          onYaLaVi={() => setPuntuando(true)}
          onNoApetece={() => noApetece(propuesta)}
          onElegir={() => onElegir(propuesta)}
        />
      ) : (
        <Mensaje
          titulo="No queda nada por proponer"
          texto={
            textoAnimo
              ? `Ya habéis visto o descartado todo lo de «${textoAnimo}» que hay ahora mismo.`
              : 'Ya has visto todo lo que hay disponible ahora mismo.'
          }
          accion={textoAnimo ? { etiqueta: `Quitar «${textoAnimo}»`, onClick: () => cambiar((e) => fijarAnimo(e, null, 0)) } : undefined}
        />
      )}
      {puntuando && propuesta && (
        <HojaYaLaVi
          titulo={propuesta}
          onCerrar={() => setPuntuando(false)}
          onNota={(nota) => {
            cambiar((e) => valorar(e, 'yo', propuesta, nota));
            setPuntuando(false);
          }}
        />
      )}
    </Pantalla>
  );
}
