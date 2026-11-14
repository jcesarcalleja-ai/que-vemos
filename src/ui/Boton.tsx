import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from 'react';

type VarianteBoton = 'primario' | 'secundario' | 'fantasma' | 'si' | 'no';

interface Comun {
  variante?: VarianteBoton;
  /** Ocupa todo el ancho disponible. */
  ancho?: boolean;
}

function clases({ variante = 'secundario', ancho }: Comun, extra?: string) {
  return ['boton', `boton--${variante}`, ancho && 'boton--ancho', extra].filter(Boolean).join(' ');
}

export function Boton({
  variante,
  ancho,
  className,
  type = 'button',
  ...resto
}: Comun & ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type={type} className={clases({ variante, ancho }, className)} {...resto} />;
}

/** Enlace con aspecto de botón. Abre en otra pestaña/app. */
export function EnlaceBoton({
  variante,
  ancho,
  className,
  ...resto
}: Comun & AnchorHTMLAttributes<HTMLAnchorElement>) {
  return <a target="_blank" rel="noopener noreferrer" className={clases({ variante, ancho }, className)} {...resto} />;
}
