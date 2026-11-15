import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { prologueStorage } from './prologue';

// ?reset=1 → olvida el prólogo visto (útil para demos y pruebas). Se ejecuta una sola vez.
if (new URLSearchParams(window.location.search).get('reset') === '1') {
  prologueStorage.clear();
  ['ecos.app.progress.v1', 'ecos.app.logrosSeen.v1'].forEach((k) => localStorage.removeItem(k));
  // Quita el parámetro para que recargar la página no vuelva a borrar el progreso.
  const url = new URL(window.location.href);
  url.searchParams.delete('reset');
  window.history.replaceState(window.history.state, '', url);
}

// Si se publica una versión nueva mientras alguien usa la app, los archivos viejos dejan de existir
// y la pantalla podría quedar en negro: recargamos una sola vez para traer la versión nueva.
window.addEventListener('vite:preloadError', (e) => {
  const KEY = 'ecos.reloadedForUpdate';
  if (sessionStorage.getItem(KEY)) return;
  sessionStorage.setItem(KEY, '1');
  e.preventDefault();
  window.location.reload();
});
window.addEventListener('load', () => setTimeout(() => sessionStorage.removeItem('ecos.reloadedForUpdate'), 10000));

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
