import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
// Импортируем регистрацию Service Worker
import * as serviceWorkerRegistration from './serviceWorkerRegistration'; // Убедитесь, что этот файл есть в проекте

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Регистрируем Service Worker для PWA
serviceWorkerRegistration.register(); // Регистрируем service worker

// Если хотите логировать производительность, оставьте reportWebVitals
reportWebVitals();

