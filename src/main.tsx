import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import AdminApp from './AdminApp.tsx';
import './index.css';

const isAdminPath = window.location.pathname.startsWith('/admin');

function upsertMeta(name: string, content: string) {
  let meta = document.querySelector(`meta[name="${name}"]`);
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', name);
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', content);
}

document.documentElement.lang = 'zh-CN';
document.title = isAdminPath
  ? '名有意后台管理'
  : '名有意 | AI网名生成器，生成有寓意、像你的专属网名';
upsertMeta('robots', isAdminPath ? 'noindex,nofollow' : 'index,follow,max-image-preview:large');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isAdminPath ? <AdminApp /> : <App />}
  </StrictMode>,
);
