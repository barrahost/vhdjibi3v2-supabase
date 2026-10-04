// À importer AVANT App : le module s'abonne à `beforeinstallprompt` (émis une seule fois,
// très tôt) pour que le bandeau d'installation puisse l'utiliser plus tard.
import './lib/pwaInstall';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Après un déploiement, les anciens fichiers JS n'existent plus : un onglet resté
// ouvert sur l'ancienne version obtient une page blanche en naviguant (chunk 404).
// On recharge automatiquement pour récupérer la nouvelle version (une seule fois
// par minute pour éviter toute boucle de rechargement).
window.addEventListener('vite:preloadError', (event) => {
  const lastReload = Number(sessionStorage.getItem('chunk-reload-at') || 0);
  if (Date.now() - lastReload > 60_000) {
    sessionStorage.setItem('chunk-reload-at', String(Date.now()));
    event.preventDefault();
    window.location.reload();
  }
});

// Inscrit le service worker (requis pour les notifications push et pour une
// installabilité PWA fiable). L'abonnement push lui-même reste à part,
// déclenché seulement quand l'utilisateur l'active dans son profil.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.error('Échec de l\'inscription du service worker:', error);
    });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
