import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
const callbackPath = `${basePath}/callback`;
const normalizedPathname = window.location.pathname.replace(/\/$/, '') || '/';
const hasOAuthCode = new URLSearchParams(window.location.search).has('code') || new URLSearchParams(window.location.search).has('error');
const isCallbackRoute =
  normalizedPathname === '/callback' ||
  normalizedPathname === callbackPath ||
  hasOAuthCode;

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
