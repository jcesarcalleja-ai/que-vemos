import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import type { Ficha, Titulo } from '../tipos';
import { Boton } from './Boton';
import { InfoTitulo } from './InfoTitulo';
import { Poster } from './Poster';

/** Distancia (px) a partir de la cual soltar la carta cuenta como un sí o un no. */
const UMBRAL = 90;
const MS_SALIDA = 220;

interface Props {
  titulo: Ficha | Titulo;
  /** Deslizar a la derecha, o pulsar «Sí». */
  onSi: () => void;
  /** Deslizar a la izquierda, o pulsar «No». */
  onNo: () => void;
  /** Si no se pasa, no aparece «Ya la vi». */
  onYaLaVi?: () => void;
}

function reducirMovimiento() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function Carta({ titulo, onSi, onNo, onYaLaVi }: Props) {
  const [dx, setDx] = useState(0);
  const [arrastrando, setArrastrando] = useState(false);
  const [saliendo, setSaliendo] = useState(false);
  const inicio = useRef<number | null>(null);
  const temporizador = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(temporizador.current), []);

  function salir(si: boolean) {
    if (saliendo) return;
    setSaliendo(true);
    setArrastrando(false);
    const alTerminar = si ? onSi : onNo;
    if (reducirMovimiento()) {
      alTerminar();
      return;
    }
    setDx((si ? 1 : -1) * window.innerWidth);
    temporizador.current = window.setTimeout(alTerminar, MS_SALIDA);
  }

  function alPulsar(e: PointerEvent<HTMLDivElement>) {
    if (saliendo) return;
    inicio.current = e.clientX - dx;
    setArrastrando(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function alMover(e: PointerEvent<HTMLDivElement>) {
    if (inicio.current === null || saliendo) return;
    setDx(e.clientX - inicio.current);
  }

  function alSoltar() {
    if (inicio.current === null || saliendo) return;
    inicio.current = null;
    if (Math.abs(dx) >= UMBRAL) salir(dx > 0);
    else {
      setArrastrando(false);
      setDx(0);
    }
  }

  const fuerza = Math.min(Math.abs(dx) / UMBRAL, 1);
  const estilo = {
    '--dx': `${dx}px`,
    '--giro': dx / 18,
    '--op-si': dx > 0 ? fuerza : 0,
    '--op-no': dx < 0 ? fuerza : 0,
  } as CSSProperties;

  return (
    <section className="deslizable" aria-label="Carta para deslizar">
      <div className="deslizable__zona">
        <div
          className={`deslizable__carta${arrastrando ? ' deslizable__carta--arrastrando' : ''}`}
          style={estilo}
          onPointerDown={alPulsar}
          onPointerMove={alMover}
          onPointerUp={alSoltar}
          onPointerCancel={alSoltar}
        >
          <span className="deslizable__sello deslizable__sello--si" aria-hidden="true">
            SÍ
          </span>
          <span className="deslizable__sello deslizable__sello--no" aria-hidden="true">
            NO
          </span>
          <Poster poster={titulo.poster} titulo={titulo.titulo} anio={titulo.anio} />
          <div className="deslizable__info">
            <InfoTitulo titulo={titulo} lineas={2} />
          </div>
        </div>
      </div>
      <div className="deslizable__pie">
        <div className="deslizable__botones">
          <Boton variante="no" disabled={saliendo} onClick={() => salir(false)}>
            ✕ No
          </Boton>
          <Boton variante="si" disabled={saliendo} onClick={() => salir(true)}>
            ♥ Sí
          </Boton>
        </div>
        {onYaLaVi && (
          <Boton variante="fantasma" ancho disabled={saliendo} onClick={onYaLaVi}>
            Ya la vi
          </Boton>
        )}
      </div>
    </section>
  );
}

/**
 * Carta que se desliza a la derecha (sí) o a la izquierda (no), con botones equivalentes.
 * Al cambiar de título (`titulo.id`) se reinicia sola.
 */
export function CartaDeslizable(props: Props) {
  return <Carta key={props.titulo.id} {...props} />;
}
