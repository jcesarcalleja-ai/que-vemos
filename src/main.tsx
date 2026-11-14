import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Sin conexión (solo en la versión publicada, no en `npm run dev`). Una versión nueva se descarga por detrás y
// se usa la próxima vez que se abra la app: nunca se recarga sola, para no cortar unos Duelos o un Match a medias.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
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
