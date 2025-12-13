import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
// Импортируем регистрацию Service Worker
import * as serviceWorkerRegistration from './serviceWorkerRegistration'; // Убедитесь, что этот файл есть в проекте
console.log('[BOOT] FG app index.js loaded');

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// В dev CRA не генерирует service-worker.js, поэтому регистрируем его только в проде.
if (process.env.NODE_ENV === 'production') {
  serviceWorkerRegistration.register();
} else {
  serviceWorkerRegistration.unregister();
}

// Если хотите логировать производительность, оставьте reportWebVitals
reportWebVitals();






