// Galería provisional: enseña todos los componentes de src/ui con datos de ejemplo.
// La sustituirá el flujo real de pantallas.

import { useEffect, useState, type ReactNode } from 'react';
import { catalogoEjemplo } from './datos/ejemplo';
import type { Ficha, Genero, Modo, Tipo, Titulo } from './tipos';
import {
  Boton,
  CartaDeslizable,
  CartaFicha,
  CartaTitulo,
  Cargando,
  Duelo,
  HojaNota,
  Interruptores,
  Mensaje,
  Pantalla,
  PantallaPaso,
  SelectorGeneros,
  SelectorNota,
  type Ronda,
} from './ui';
import './App.css';

/** Póster de mentira (SVG en data URI) para ver cómo queda uno cargado de verdad. */
function posterFalso(titulo: string, tono: number): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 300"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${tono} 70% 45%)"/><stop offset="1" stop-color="hsl(${tono + 60} 60% 15%)"/></linearGradient></defs><rect width="200" height="300" fill="url(#g)"/><circle cx="100" cy="110" r="52" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="6"/><text x="100" y="262" text-anchor="middle" font-family="Georgia,serif" font-size="20" fill="#fff">${titulo}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function Seccion({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="galeria__seccion">
      <h2 className="galeria__etiqueta">{titulo}</h2>
      {children}
    </section>
  );
}

const RONDAS: Ronda[] = ['cuartos', 'semifinal', 'final'];

export function App() {
  const [pelis, setPelis] = useState<Titulo[]>([]);
  const [series, setSeries] = useState<Titulo[]>([]);
  const [conocidos, setConocidos] = useState<Ficha[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [tipo, setTipo] = useState<Tipo>('peli');
  const [modo, setModo] = useState<Modo>('solo');
  const [registro, setRegistro] = useState('Aquí aparece lo último que toques.');
  const [hojaAbierta, setHojaAbierta] = useState(false);
  const [indiceSwipe, setIndiceSwipe] = useState(0);
  const [indiceDuelo, setIndiceDuelo] = useState(0);
  const [generos, setGeneros] = useState<Genero[]>(['Terror', 'Bélica']);
  const [paso, setPaso] = useState(false);

  useEffect(() => {
    Promise.all([catalogoEjemplo.disponibles('peli'), catalogoEjemplo.disponibles('serie'), catalogoEjemplo.conocidos()])
      .then(([p, s, c]) => {
        setPelis(p);
        setSeries(s);
        setConocidos(c);
      })
      .catch(() => setError('No se han podido leer los datos de ejemplo.'));
  }, []);

  if (paso) {
    return (
      <PantallaPaso
        titulo="Ahora te toca a ti"
        mensaje="Pásale el móvil a tu novia. Los mismos títulos, tu turno."
        etiqueta="Vale, soy yo"
        onContinuar={() => {
          setPaso(false);
          setRegistro('Pantalla de paso: «Vale, soy yo».');
        }}
      />
    );
  }

  if (error) {
    return (
      <Pantalla>
        <Mensaje titulo="Algo ha fallado" texto={error} tipo="error" accion={{ etiqueta: 'Reintentar', onClick: () => location.reload() }} />
      </Pantalla>
    );
  }

  if (pelis.length === 0) return <Cargando pantalla mensaje="Buscando qué ver…" />;

  const lista = tipo === 'peli' ? pelis : series;
  const propuesta = lista[0]!;
  const serieDeEjemplo = series[0]!;
  const swipe = pelis[indiceSwipe % pelis.length]!;
  const duelo = [lista[(indiceDuelo * 2) % lista.length]!, lista[(indiceDuelo * 2 + 1) % lista.length]!] as const;
  const conPoster = { ...pelis[1]!, poster: posterFalso(pelis[1]!.titulo, 210) };
  const conPosterRoto = { ...pelis[2]!, poster: 'https://invalid.example/no-existe.jpg' };
  const avanzarSwipe = (texto: string) => {
    setRegistro(texto);
    setIndiceSwipe((i) => i + 1);
  };
  const avanzarDuelo = (texto: string) => {
    setRegistro(texto);
    setIndiceDuelo((i) => i + 1);
  };

  return (
    <Pantalla cabecera={<Interruptores tipo={tipo} modo={modo} onTipo={setTipo} onModo={setModo} />}>
      <div className="galeria">
        <p className="galeria__aviso">Galería provisional de componentes · tipo: {tipo} · modo: {modo}</p>
        <p className="galeria__registro" role="status">
          {registro}
        </p>

        <Seccion titulo="Carta de título (propuesta)">
          <CartaTitulo
            titulo={propuesta}
            onYaLaVi={() => setHojaAbierta(true)}
            onElegir={() => setRegistro('Elegir yo')}
          />
        </Seccion>

        <Seccion titulo="Carta de título (ganadora: sin «Elegir yo», sin tráiler)">
          <CartaTitulo titulo={{ ...serieDeEjemplo, trailer: null }} onYaLaVi={() => setHojaAbierta(true)} />
        </Seccion>

        <Seccion titulo="Póster cargado / póster que falla">
          <div className="galeria__pareja">
            <CartaFicha titulo={conPoster} />
            <CartaFicha titulo={conPosterRoto} />
          </div>
        </Seccion>

        <Seccion titulo="Selector de nota (swipe inicial)">
          <CartaFicha titulo={conocidos[0]!} />
          <SelectorNota
            onNota={(n) => setRegistro(`Nota: ${n}`)}
            onNoVista={() => setRegistro('No la he visto')}
          />
        </Seccion>

        <Seccion titulo="Selector de nota (series: con «La abandoné»)">
          <SelectorNota onNota={(n) => setRegistro(`Nota: ${n}`)} onAbandonada={() => setRegistro('La abandoné')} />
        </Seccion>

        <Seccion titulo="Duelo">
          <Duelo
            a={duelo[0]}
            b={duelo[1]}
            ronda={RONDAS[indiceDuelo % RONDAS.length]!}
            onElegir={(t) => avanzarDuelo(`Duelo: elegida «${t.titulo}»`)}
            onYaLaVi={(t) => avanzarDuelo(`Duelo: «${t.titulo}», ya la vi`)}
          />
        </Seccion>

        <Seccion titulo="Carta deslizable (Match)">
          <CartaDeslizable
            titulo={swipe}
            onSi={() => avanzarSwipe(`Sí a «${swipe.titulo}»`)}
            onNo={() => avanzarSwipe(`No a «${swipe.titulo}»`)}
            onYaLaVi={() => setHojaAbierta(true)}
          />
        </Seccion>

        <Seccion titulo="Selector de géneros («jamás»)">
          <SelectorGeneros seleccionados={generos} onCambio={setGeneros} etiqueta="Géneros que no quieres ver jamás" />
          <p className="galeria__aviso">Elegidos: {generos.length > 0 ? generos.join(', ') : 'ninguno'}</p>
        </Seccion>

        <Seccion titulo="Cargando, mensaje, error y pantalla de paso">
          <Cargando mensaje="Buscando qué ver…" />
          <Mensaje titulo="Aún no hay nada" texto="Prueba otra vez dentro de un rato." />
          <Mensaje
            titulo="Sin conexión"
            texto="No se han podido cargar los títulos."
            tipo="error"
            accion={{ etiqueta: 'Reintentar', onClick: () => setRegistro('Reintentar') }}
          />
          <Boton ancho variante="primario" onClick={() => setPaso(true)}>
            Ver pantalla de paso
          </Boton>
        </Seccion>
      </div>

      {hojaAbierta && (
        <HojaNota
          titulo={propuesta.titulo}
          onNota={(n) => {
            setHojaAbierta(false);
            setRegistro(`Ya la vi: nota ${n}`);
          }}
          onAbandonada={tipo === 'serie' ? () => (setHojaAbierta(false), setRegistro('Ya la vi: abandonada')) : undefined}
          onCerrar={() => setHojaAbierta(false)}
        />
      )}
    </Pantalla>
  );
}
