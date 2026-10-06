import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Register BroTime PWA Service Worker for standalone Android/iOS installability
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((reg) => {
        // Successful registration
        if (reg.installing) {
          console.log('[BroTime PWA] Service worker installing');
        } else if (reg.active) {
          console.log('[BroTime PWA] Service worker active');
        }
      })
      .catch((err) => {
        // Silently log; preview iframe sandboxes or file:// protocols might restrict workers
        console.warn('[BroTime PWA] Service worker registration note:', err?.message || err);
      });
  });
}

