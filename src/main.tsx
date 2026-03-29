import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import AdminApp from './AdminApp.tsx';
import {resolveLandingPage} from './landingPages.ts';
import './index.css';

const isAdminPath = window.location.pathname.startsWith('/admin');
const landingPage = isAdminPath ? null : resolveLandingPage(window.location.pathname);

function upsertMeta(name: string, content: string) {
  let meta = document.querySelector(`meta[name="${name}"]`);
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', name);
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', content);
}

function upsertPropertyMeta(property: string, content: string) {
  let meta = document.querySelector(`meta[property="${property}"]`);
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('property', property);
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', content);
}

function upsertCanonical(href: string) {
  let link = document.querySelector('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', href);
}

document.documentElement.lang = 'zh-CN';
document.title = isAdminPath ? '名有意后台管理' : landingPage?.meta.title || '名有意 | AI网名生成器，生成有寓意、像你的专属网名';
upsertMeta('robots', isAdminPath ? 'noindex,nofollow' : 'index,follow,max-image-preview:large');

if (!isAdminPath && landingPage) {
  const canonicalUrl = `${window.location.origin}${landingPage.meta.canonicalPath}`;
  upsertMeta('description', landingPage.meta.description);
  upsertMeta('keywords', landingPage.meta.keywords.join(','));
  upsertCanonical(canonicalUrl);
  upsertPropertyMeta('og:title', landingPage.meta.title);
  upsertPropertyMeta('og:description', landingPage.meta.description);
  upsertPropertyMeta('og:url', canonicalUrl);
  upsertMeta('twitter:title', landingPage.meta.title);
  upsertMeta('twitter:description', landingPage.meta.description);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isAdminPath ? <AdminApp /> : <App landingPage={landingPage!} />}
  </StrictMode>,
);
