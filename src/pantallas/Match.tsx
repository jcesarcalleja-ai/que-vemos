import { useMemo, useState } from 'react';
import { apuntarGesto, useEstado, valorar } from '../estado';
import { crearMatch, ganadoraMatch, TITULOS_MATCH } from '../motor';
import type { Perfil, Titulo } from '../tipos';
import { CartaDeslizable, Mensaje, Pantalla, PantallaPaso } from '../ui';
import { Barra, useArriba } from './Barra';
import { Ganadora } from './Ganadora';
import { HojaYaLaVi } from './HojaYaLaVi';
import { deslizar, nuevaPartida, sustituirEnPartida, turnoMatch } from './flujo';

const PASO: Record<Perfil, { titulo: string; mensaje: string }> = {
  ella: {
    titulo: 'Primero, tu novia',
    mensaje: 'Pásale el móvil. Desliza a la derecha lo que te apetezca ver y a la izquierda lo que no.',
  },
  yo: {
    titulo: 'Ahora te toca a ti',
    mensaje: 'Devuélvele el móvil a quien lo traía. Los mismos títulos, tu turno.',
  },
};

interface Props {
  /** Los títulos disponibles del tipo elegido. */
  titulos: Titulo[];
  onVolver: () => void;
}

/** Modo pareja: 10 títulos; ella desliza los 10, luego yo los mismos, y sale la ganadora. */
export function Match({ titulos, onVolver }: Props) {
  const { estado, cambiar } = useEstado();
  const [partida, setPartida] = useState(() => {
    const elegidos = crearMatch(titulos, estado, new Date());
    return elegidos && nuevaPartida(elegidos);
  });
  const [pasoVisto, setPasoVisto] = useState<Record<Perfil, boolean>>({ ella: false, yo: false });
  const [puntuando, setPuntuando] = useState<Titulo | null>(null);

  const { turno, pendiente, numero } = partida ? turnoMatch(partida) : { turno: 'fin' as const, pendiente: null, numero: 0 };
  useArriba(`${turno}-${pendiente?.id}`);
  const ganadora = useMemo(
    () => (partida && turno === 'fin' ? ganadoraMatch(partida.titulos, partida.ella, partida.yo, estado, new Date()) : null),
    [partida, turno, estado],
  );

  if (!partida) {
    return (
      <Pantalla>
        <Mensaje
          titulo="No hay títulos para el Match"
          texto={`Quedan menos de ${TITULOS_MATCH} títulos sin ver que gusten a los dos.`}
          accion={{ etiqueta: 'Volver a la propuesta', onClick: onVolver }}
        />
      </Pantalla>
    );
  }
  if (turno === 'fin') return ganadora ? <Ganadora titulo={ganadora} onVolver={onVolver} /> : null;
  if (!pasoVisto[turno]) {
    return (
      <PantallaPaso
        {...PASO[turno]}
        etiqueta="Vale, soy yo"
        onContinuar={() => setPasoVisto((v) => ({ ...v, [turno]: true }))}
      />
    );
  }

  /** Cada desliz se apunta como gesto de quien desliza. */
  function responder(titulo: Titulo, si: boolean) {
    cambiar((e) => apuntarGesto(e, turno as Perfil, titulo, si));
    setPartida((p) => p && deslizar(p, turno as Perfil, titulo.id, si));
  }

  /** «Ya la vi» puntúa con quien está deslizando y cambia el título por otro, sin deslizar. */
  function puntuar(titulo: Titulo, nota: number | 'abandonada') {
    const nuevo = valorar(estado, turno as Perfil, titulo, nota);
    cambiar(() => nuevo);
    setPuntuando(null);
    const siguiente = sustituirEnPartida(partida!, titulo.id, turno as Perfil, titulos, nuevo, new Date());
    if (siguiente) setPartida(siguiente);
    else onVolver();
  }

  const quien = turno === 'ella' ? 'Turno de tu novia' : 'Tu turno';
  return (
    <Pantalla cabecera={<Barra titulo={`${quien} · ${numero} de ${partida.titulos.length}`} onVolver={onVolver} />}>
      <CartaDeslizable
        titulo={pendiente!}
        onSi={() => responder(pendiente!, true)}
        onNo={() => responder(pendiente!, false)}
        onYaLaVi={() => setPuntuando(pendiente!)}
      />
      {puntuando && (
        <HojaYaLaVi titulo={puntuando} onNota={(nota) => puntuar(puntuando, nota)} onCerrar={() => setPuntuando(null)} />
      )}
    </Pantalla>
  );
}
