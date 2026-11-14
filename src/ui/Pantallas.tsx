import type { ReactNode } from 'react';
import { Boton } from './Boton';

interface PantallaProps {
  /** Arriba (p. ej. los interruptores). */
  cabecera?: ReactNode;
  /** Abajo, en la zona del pulgar, respetando la zona segura. */
  pie?: ReactNode;
  children: ReactNode;
}

/** Marco de una pantalla: zonas seguras, ancho de móvil y botones abajo. */
export function Pantalla({ cabecera, pie, children }: PantallaProps) {
  return (
    <main className="pantalla">
      {cabecera && <header className="pantalla__cabecera">{cabecera}</header>}
      <div className="pantalla__cuerpo">{children}</div>
      {pie && <footer className="pantalla__pie">{pie}</footer>}
    </main>
  );
}

interface PasoProps {
  titulo: string;
  mensaje?: string;
  /** Texto del botón, p. ej. «Vale, soy yo». */
  etiqueta: string;
  onContinuar: () => void;
}

/** Pantalla completa con un mensaje y un botón; p. ej. «Ahora te toca a ti» al cambiar de turno. */
export function PantallaPaso({ titulo, mensaje, etiqueta, onContinuar }: PasoProps) {
  return (
    <main className="paso">
      <div className="paso__centro">
        <h1 className="paso__titulo">{titulo}</h1>
        {mensaje && <p className="paso__mensaje">{mensaje}</p>}
      </div>
      <Boton variante="primario" className="paso__boton" onClick={onContinuar}>
        {etiqueta}
      </Boton>
    </main>
  );
}

interface CargandoProps {
  mensaje?: string;
  /** Ocupa toda la pantalla. */
  pantalla?: boolean;
}

export function Cargando({ mensaje = 'Cargando…', pantalla }: CargandoProps) {
  return (
    <div className={`cargando${pantalla ? ' cargando--pantalla' : ''}`} role="status">
      <div className="cargando__rueda" aria-hidden="true" />
      <p>{mensaje}</p>
    </div>
  );
}

interface MensajeProps {
  titulo: string;
  texto?: string;
  /** Un error se anuncia a los lectores de pantalla y lleva borde de aviso. */
  tipo?: 'info' | 'error';
  /** Botón opcional, p. ej. «Reintentar». */
  accion?: { etiqueta: string; onClick: () => void };
}

export function Mensaje({ titulo, texto, tipo = 'info', accion }: MensajeProps) {
  return (
    <div className={`mensaje${tipo === 'error' ? ' mensaje--error' : ''}`} role={tipo === 'error' ? 'alert' : 'status'}>
      <h2 className="mensaje__titulo">{titulo}</h2>
      {texto && <p className="mensaje__texto">{texto}</p>}
      {accion && <Boton onClick={accion.onClick}>{accion.etiqueta}</Boton>}
    </div>
  );
}
