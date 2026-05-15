import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { enableOfflineMode } from './lib/firebase.ts';
import { migrateToServantSchema } from './migrations/servantSchemaChanges.ts';
import './index.css';

// Enable offline persistence for Firestore
enableOfflineMode();

// Run the servant schema migration
migrateToServantSchema().then(result => {
  if (result.success) {
    console.log('Servant schema migration completed successfully:', result.stats);
  } else {
    console.error('Servant schema migration failed:', result.error);
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
