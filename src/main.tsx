import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
const callbackPath = `${basePath}/callback`;
const isCallbackRoute = window.location.pathname === '/callback' || window.location.pathname === callbackPath;

// Simple routing without react-router
if (isCallbackRoute) {
  import('./pages/Callback').then(({ Callback }) => {
    ReactDOM.createRoot(document.getElementById('root')!).render(
      <React.StrictMode>
        <Callback />
      </React.StrictMode>
    );
  });
} else {
  import('./pages/App').then(({ App }) => {
    ReactDOM.createRoot(document.getElementById('root')!).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  });
}
