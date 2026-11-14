import { useRef, useState, type ChangeEvent } from 'react';
import { exportarEstado, fijarJamas, importarEstado, useEstado } from '../estado';
import type { Estado } from '../tipos';
import { Boton, Mensaje, Pantalla, SelectorGeneros } from '../ui';
import { Barra } from './Barra';

interface Aviso {
  tipo: 'info' | 'error';
  titulo: string;
  texto: string;
}

const CREDITOS =
  'Datos de TMDB; disponibilidad de JustWatch; notas de IMDb. Esta app usa la API de TMDB pero no está avalada ni certificada por TMDB.';

/** Fecha local como AAAA-MM-DD, para el nombre del archivo. */
function hoy(): string {
  const d = new Date();
  const dos = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`;
}

function notasDe(estado: Estado, perfil: 'yo' | 'ella'): number {
  return Object.keys(estado.perfiles[perfil].valoraciones).length;
}

interface Props {
  onVolver: () => void;
}

export function Ajustes({ onVolver }: Props) {
  const { estado, cambiar } = useEstado();
  const entrada = useRef<HTMLInputElement>(null);
  const [aviso, setAviso] = useState<Aviso | null>(null);
  /** La copia leída y válida, esperando a que se confirme que sustituye a todo. */
  const [copia, setCopia] = useState<Estado | null>(null);

  function exportar() {
    const enlace = document.createElement('a');
    enlace.href = URL.createObjectURL(new Blob([exportarEstado(estado)], { type: 'application/json' }));
    enlace.download = `que-vemos-${hoy()}.json`;
    document.body.append(enlace);
    enlace.click();
    enlace.remove();
    URL.revokeObjectURL(enlace.href);
    setAviso({ tipo: 'info', titulo: 'Copia guardada', texto: 'Se ha descargado un archivo con tus notas y las de tu novia.' });
  }

  async function elegirArchivo(e: ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    e.target.value = ''; // para poder elegir el mismo archivo otra vez
    if (!archivo) return;
    setAviso(null);
    setCopia(null);
    try {
      setCopia(importarEstado(await archivo.text()));
    } catch (error) {
      setAviso({
        tipo: 'error',
        titulo: 'No se ha podido importar',
        texto: error instanceof Error ? error.message : 'No se pudo leer el archivo.',
      });
    }
  }

  function confirmarImportacion() {
    if (!copia) return;
    cambiar(() => copia);
    setCopia(null);
    setAviso({ tipo: 'info', titulo: 'Copia importada', texto: 'Ya tienes las notas del archivo.' });
  }

  return (
    <Pantalla cabecera={<Barra titulo="Ajustes" onVolver={onVolver} />}>
      <div className="ajustes">
        <section className="ajustes__seccion" aria-labelledby="ajustes-notas">
          <h2 className="ajustes__titulo" id="ajustes-notas">
            Tus notas
          </h2>
          <p className="ajustes__texto">
            Viven solo en este móvil. Guarda una copia en un archivo para no perderlas o para pasarlas a otro móvil.
          </p>
          <Boton ancho onClick={exportar}>
            Exportar notas a un archivo
          </Boton>
          <Boton ancho onClick={() => entrada.current?.click()}>
            Importar notas desde un archivo
          </Boton>
          <input ref={entrada} type="file" accept=".json,application/json" hidden onChange={elegirArchivo} />
          {copia && (
            <div className="mensaje" role="alertdialog" aria-labelledby="ajustes-confirmar">
              <h3 className="mensaje__titulo" id="ajustes-confirmar">
                ¿Sustituir todo?
              </h3>
              <p className="mensaje__texto">
                El archivo trae {notasDe(copia, 'yo')} notas tuyas y {notasDe(copia, 'ella')} de tu novia. Al importarlo
                se pierde todo lo que hay ahora en este móvil.
              </p>
              <div className="acciones">
                <Boton onClick={() => setCopia(null)}>Cancelar</Boton>
                <Boton variante="primario" onClick={confirmarImportacion}>
                  Importar
                </Boton>
              </div>
            </div>
          )}
          {aviso && <Mensaje titulo={aviso.titulo} texto={aviso.texto} tipo={aviso.tipo} />}
        </section>

        <section className="ajustes__seccion" aria-labelledby="ajustes-jamas">
          <h2 className="ajustes__titulo" id="ajustes-jamas">
            Los «jamás» de tu novia
          </h2>
          <p className="ajustes__texto">Estos géneros no se proponen cuando veis algo juntos.</p>
          <SelectorGeneros
            seleccionados={estado.perfiles.ella.jamas}
            onCambio={(generos) => cambiar((e) => fijarJamas(e, 'ella', generos))}
            etiqueta="Géneros que tu novia no quiere ver jamás"
          />
        </section>

        <section className="ajustes__seccion" aria-labelledby="ajustes-creditos">
          <h2 className="ajustes__titulo" id="ajustes-creditos">
            Créditos
          </h2>
          <p className="ajustes__texto">{CREDITOS}</p>
        </section>
      </div>
    </Pantalla>
  );
}
