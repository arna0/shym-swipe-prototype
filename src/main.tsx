import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import {installMockApi} from './demo/mockApi';

// On GitHub Pages there is no Express server: run the API in the browser instead.
if (import.meta.env.VITE_STATIC_DEMO === 'true') {
  installMockApi();
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
