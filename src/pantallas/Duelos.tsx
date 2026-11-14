import { useState } from 'react';
import { useEstado, valorar } from '../estado';
import { crearTorneo, elegirEnDuelo, situacionTorneo, sustituirEnTorneo, TITULOS_DUELOS } from '../motor';
import type { Titulo } from '../tipos';
import { Duelo, Mensaje, Pantalla, type Ronda } from '../ui';
import { Barra, useArriba } from './Barra';
import { Ganadora } from './Ganadora';
import { HojaYaLaVi } from './HojaYaLaVi';

const RONDA: Record<'cuartos' | 'semis' | 'final', Ronda> = {
  cuartos: 'cuartos',
  semis: 'semifinal',
  final: 'final',
};

interface Props {
  /** Los títulos disponibles del tipo elegido. */
  titulos: Titulo[];
  onVolver: () => void;
}

/** Modo solo: 8 títulos enfrentados de dos en dos (7 toques) hasta que queda la ganadora. */
export function Duelos({ titulos, onVolver }: Props) {
  const { estado, cambiar } = useEstado();
  const [torneo, setTorneo] = useState(() => crearTorneo(titulos, estado, new Date()));
  const [puntuando, setPuntuando] = useState<Titulo | null>(null);
  useArriba(torneo?.elecciones.length);

  if (!torneo) {
    return (
      <Pantalla>
        <Mensaje
          titulo="No hay títulos para los duelos"
          texto={`Quedan menos de ${TITULOS_DUELOS} títulos sin ver.`}
          accion={{ etiqueta: 'Volver a la propuesta', onClick: onVolver }}
        />
      </Pantalla>
    );
  }

  const situacion = situacionTorneo(torneo);
  if (situacion.ganadora) return <Ganadora titulo={situacion.ganadora} onVolver={onVolver} />;
  const [a, b] = situacion.par!;
  const ronda = RONDA[situacion.ronda as keyof typeof RONDA];

  /** «Ya la vi» sustituye el título por otro que no esté en el torneo; si no hay recambio, se vuelve. */
  function puntuar(titulo: Titulo, nota: number | 'abandonada') {
    const nuevo = valorar(estado, 'yo', titulo, nota);
    cambiar(() => nuevo);
    setPuntuando(null);
    const siguiente = sustituirEnTorneo(torneo!, titulo.id, titulos, nuevo, new Date());
    if (siguiente) setTorneo(siguiente);
    else onVolver();
  }

  return (
    <Pantalla cabecera={<Barra titulo="Duelos" onVolver={onVolver} />}>
      <Duelo
        a={a}
        b={b}
        ronda={ronda}
        onElegir={(elegido) => setTorneo(elegirEnDuelo(torneo, elegido.id))}
        onYaLaVi={setPuntuando}
      />
      {puntuando && (
        <HojaYaLaVi titulo={puntuando} onNota={(nota) => puntuar(puntuando, nota)} onCerrar={() => setPuntuando(null)} />
      )}
    </Pantalla>
  );
}
