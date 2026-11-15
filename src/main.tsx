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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
