import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Sin conexión y con actualización automática (solo en la versión publicada, no en `npm run dev`).
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    // En la primera visita aún no hay service worker al mando: no hace falta recargar cuando lo coja.
    const teniaControl = navigator.serviceWorker.controller !== null;
    let recargando = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!teniaControl || recargando) return;
      recargando = true;
      location.reload(); // ha llegado una versión nueva: se abre ya con ella
    });
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
