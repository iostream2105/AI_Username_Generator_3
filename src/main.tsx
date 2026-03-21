import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import AdminApp from './AdminApp.tsx';
import './index.css';

const isAdminPath = window.location.pathname.startsWith('/admin');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isAdminPath ? <AdminApp /> : <App />}
  </StrictMode>,
);
