// El flujo de pantallas de ¿Qué vemos? (ver ESPECIFICACION.md). Sin rutas: la pantalla es un estado.

import { useState } from 'react';
import { useEstado } from './estado';
import { perfilPendienteDeInicio } from './pantallas/flujo';
import { Ajustes } from './pantallas/Ajustes';
import { Duelos } from './pantallas/Duelos';
import { InicioPerfil } from './pantallas/InicioPerfil';
import { Match } from './pantallas/Match';
import { Propuesta } from './pantallas/Propuesta';
import { useCatalogo } from './pantallas/useCatalogo';
import { Cargando, Mensaje, Pantalla } from './ui';

type Vista = 'propuesta' | 'duelos' | 'match' | 'ajustes';

export function App() {
  const { estado, guardadoFallido } = useEstado();
  const { carga, reintentar } = useCatalogo();
  const [vista, setVista] = useState<Vista>('propuesta');
  /** La propuesta que no convenció al pulsar «Elegir yo»: no entra en Duelos ni en el Match. */
  const [rechazada, setRechazada] = useState<string | null>(null);
  const volver = () => setVista('propuesta');

  let contenido;
  if (carga.estado === 'cargando') {
    contenido = <Cargando pantalla mensaje="Buscando qué ver…" />;
  } else if (carga.estado === 'error') {
    contenido = (
      <Pantalla>
        <Mensaje
          titulo="No se han podido cargar los títulos"
          texto={carga.mensaje}
          tipo="error"
          accion={{ etiqueta: 'Reintentar', onClick: reintentar }}
        />
      </Pantalla>
    );
  } else {
    const { datos } = carga;
    const titulos = estado.tipo === 'peli' ? datos.pelis : datos.series;
    const pendiente = perfilPendienteDeInicio(estado);
    if (vista === 'ajustes') {
      // También antes del swipe inicial: así una copia se puede importar en un móvil nuevo sin puntuar nada.
      contenido = <Ajustes onVolver={volver} />;
    } else if (pendiente) {
      contenido = (
        <InicioPerfil
          key={pendiente}
          perfil={pendiente}
          conocidos={datos.conocidos}
          onAjustes={() => setVista('ajustes')}
        />
      );
    } else if (vista === 'duelos' || vista === 'match') {
      const Eleccion = vista === 'duelos' ? Duelos : Match;
      contenido = <Eleccion titulos={titulos.filter((t) => t.id !== rechazada)} onVolver={volver} />;
    } else {
      contenido = (
        <Propuesta
          titulos={titulos}
          onElegir={(propuesta) => {
            setRechazada(propuesta.id);
            setVista(estado.modo === 'solo' ? 'duelos' : 'match');
          }}
          onAjustes={() => setVista('ajustes')}
        />
      );
    }
  }

  return (
    <>
      {guardadoFallido && (
        <div className="aviso-guardado">
          <Mensaje
            titulo="No se ha podido guardar"
            texto="Este móvil no deja guardar lo que haces: se perderá al cerrar la app. En Ajustes puedes exportar una copia."
            tipo="error"
          />
        </div>
      )}
      {contenido}
    </>
  );
}
