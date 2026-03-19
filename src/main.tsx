import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import AdminApp from './AdminApp.tsx';
import './index.css';

const isAdminPath = window.location.pathname.startsWith('/admin');
const enableAdmin =
  import.meta.env.VITE_ENABLE_ADMIN === 'true' ||
  (import.meta.env.DEV && import.meta.env.VITE_ENABLE_ADMIN !== 'false');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isAdminPath && enableAdmin ? <AdminApp /> : <App />}
  </StrictMode>,
);
