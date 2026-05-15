import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { enableOfflineMode } from './lib/firebase.ts';
import './index.css';

// No-op: kept for compatibility
enableOfflineMode();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
