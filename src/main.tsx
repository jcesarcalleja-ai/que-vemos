import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { marcarActualizacionLista } from './actualizacion';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Sin conexión (solo en la versión publicada, no en `npm run dev`). Una versión nueva se descarga por detrás.
// Cuando el service worker que manda ya es de otra versión que esta página, se avisa a la app, que recarga en
// cuanto está en la propuesta (nunca a mitad de unos Duelos o un Match).
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  const sw = navigator.serviceWorker;
  const miScript = new URL(document.querySelector<HTMLScriptElement>('script[type=module]')!.src).pathname;
  sw.addEventListener('message', (evento) => {
    const archivos: unknown = evento.data?.archivos;
    if (!Array.isArray(archivos)) return;
    const base = new URL('./', location.href);
    if (!archivos.some((a) => new URL(a, base).pathname === miScript)) marcarActualizacionLista();
  });
  const preguntar = () => sw.controller?.postMessage('archivos');
  sw.addEventListener('controllerchange', preguntar);
  preguntar();
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('./sw.js')
      .then((registro) => {
        // Una app instalada casi nunca se recarga: al volver a ella, se busca versión nueva.
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') void registro.update();
        });
      })
      .catch(() => {}); // sin service worker la app funciona igual, solo que sin modo sin conexión
  });
}
