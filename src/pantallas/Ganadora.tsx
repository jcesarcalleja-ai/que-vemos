import { useState } from 'react';
import { useEstado, valorar } from '../estado';
import type { Titulo } from '../tipos';
import { CartaTitulo, Pantalla } from '../ui';
import { Barra } from './Barra';
import { HojaYaLaVi } from './HojaYaLaVi';

interface Props {
  titulo: Titulo;
  onVolver: () => void;
}

/** La ganadora de Duelos o del Match: Ver, Tráiler y Ya la vi (sin «Elegir yo»). */
export function Ganadora({ titulo, onVolver }: Props) {
  const { cambiar } = useEstado();
  const [puntuando, setPuntuando] = useState(false);

  return (
    <Pantalla cabecera={<Barra titulo="Esta es la ganadora" onVolver={onVolver} />}>
      <CartaTitulo titulo={titulo} onYaLaVi={() => setPuntuando(true)} />
      {puntuando && (
        <HojaYaLaVi
          titulo={titulo}
          onCerrar={() => setPuntuando(false)}
          onNota={(nota) => {
            cambiar((e) => valorar(e, 'yo', titulo, nota));
            onVolver(); // vuelve a la propuesta, que ya no será esta
          }}
        />
      )}
    </Pantalla>
  );
}
