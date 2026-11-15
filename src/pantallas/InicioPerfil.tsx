import { useEffect, useState } from 'react';
import { cambiarModo, fijarJamas, marcarInicioHecho, useEstado, valorar } from '../estado';
import type { Ficha, Perfil } from '../tipos';
import { Boton, Cargando, CartaFicha, Pantalla, PantallaPaso, SelectorGeneros, SelectorNota } from '../ui';
import { Barra, useArriba } from './Barra';
import { pendientesDeInicio } from './flujo';

interface Props {
  perfil: Perfil;
  conocidos: Ficha[];
  /** Ajustes desde el primer swipe de yo, para importar una copia en un móvil nuevo. */
  onAjustes: () => void;
}

/**
 * Lo que hace cada perfil la primera vez: puntuar los títulos conocidos (nota o «No la he visto»).
 * Ella, además, recibe el móvil con una pantalla de paso y al final marca sus «jamás».
 */
export function InicioPerfil({ perfil, conocidos, onAjustes }: Props) {
  const { estado, cambiar } = useEstado();
  const [fase, setFase] = useState<'paso' | 'swipe' | 'jamas'>(perfil === 'ella' ? 'paso' : 'swipe');
  const [pendientes] = useState(() => pendientesDeInicio(conocidos, estado, perfil));
  const [indice, setIndice] = useState(0);
  const terminado = indice >= pendientes.length;
  useArriba(indice);

  // Al acabar los títulos: yo ya ha terminado; ella pasa a sus «jamás».
  useEffect(() => {
    if (fase !== 'swipe' || !terminado) return;
    if (perfil === 'yo') cambiar((e) => marcarInicioHecho(e, 'yo'));
    else setFase('jamas');
  }, [fase, terminado, perfil, cambiar]);

  /** Por si se activó «Con mi novia» sin querer: se vuelve a «Solo»; lo que ya puntuó ella se queda guardado. */
  const volverASolo = () => cambiar((e) => cambiarModo(e, 'solo'));
  const ahoraNo = (
    <Boton variante="fantasma" className="boton--chico boton--centrado" onClick={volverASolo}>
      Ahora no, volver a Solo
    </Boton>
  );

  if (fase === 'paso') {
    return (
      <PantallaPaso
        titulo="Ahora, tu novia"
        mensaje="Pásale el móvil: va a puntuar unos cuantos títulos y a marcar lo que no quiere ver jamás."
        etiqueta="Vale, soy yo"
        onContinuar={() => setFase('swipe')}
        salida={{ etiqueta: 'Ahora no, volver a Solo', onClick: volverASolo }}
      />
    );
  }

  if (fase === 'jamas') {
    return (
      <Pantalla
        cabecera={<Barra titulo="Lo que no quieres ver jamás" onVolver={volverASolo} />}
        pie={
          <>
            <Boton variante="primario" ancho onClick={() => cambiar((e) => marcarInicioHecho(e, 'ella'))}>
              Listo
            </Boton>
            {ahoraNo}
          </>
        }
      >
        <div className="jamas">
          <p className="jamas__texto">
            Marca los géneros que no se propondrán nunca cuando veáis algo juntos. Se pueden cambiar luego en Ajustes.
          </p>
          <SelectorGeneros
            seleccionados={estado.perfiles.ella.jamas}
            onCambio={(generos) => cambiar((e) => fijarJamas(e, 'ella', generos))}
            etiqueta="Géneros que no quieres ver jamás"
          />
        </div>
      </Pantalla>
    );
  }

  const ficha = pendientes[indice];
  if (!ficha) return <Cargando pantalla />;
  const quedan = pendientes.length - indice;
  const quien = perfil === 'ella' ? 'Turno de tu novia' : 'Para conocer tus gustos';

  function responder(nota: number | null) {
    if (nota !== null) cambiar((e) => valorar(e, perfil, ficha!, nota));
    setIndice((i) => i + 1);
  }

  return (
    <Pantalla
      cabecera={
        <Barra
          titulo={`${quien} · ${quedan === 1 ? 'queda 1' : `quedan ${quedan}`}`}
          onVolver={perfil === 'ella' ? volverASolo : undefined}
        />
      }
      pie={
        perfil === 'ella' ? (
          ahoraNo
        ) : (
          <Boton variante="fantasma" className="boton--chico boton--centrado" onClick={onAjustes}>
            Ajustes
          </Boton>
        )
      }
    >
      <div className="inicio">
        <CartaFicha titulo={ficha} />
        <SelectorNota onNota={responder} onNoVista={() => responder(null)} />
      </div>
    </Pantalla>
  );
}
