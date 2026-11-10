/**
 * Entry point for /apps/demo/. Loads demo data, every live app module and
 * its stylesheet, then mounts the shell.
 */
import * as store from './core/store.js';
import * as shell from './core/shell.js';
import dashboard from './dashboard.js';

const CONFIG = window.APWA_CONFIG || {};

function loadCss(href) {
  return new Promise((resolve) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `${href}?v=${encodeURIComponent(CONFIG.version || '')}`;
    link.onload = resolve;
    link.onerror = resolve;
    document.head.appendChild(link);
  });
}

async function boot() {
  store.load();
  const live = (CONFIG.apps || []).filter((a) => a.status === 'demo' && a.module);
  const loaded = await Promise.all(live.map(async (a) => {
    try {
      await Promise.all((a.styles || []).map(loadCss));
      const mod = await import(a.module);
      return { ...mod.default, slug: a.slug };
    } catch (err) {
      console.error(`Could not load ${a.slug}`, err);
      return null;
    }
  }));
  shell.register(loaded.filter(Boolean), dashboard);
  shell.mount(document.getElementById('apwa-root'));

  // Installable app (scoped service worker); skipped silently if unsupported.
  if ('serviceWorker' in navigator && CONFIG.swUrl && window.isSecureContext) {
    navigator.serviceWorker.register(CONFIG.swUrl, { scope: CONFIG.basePath }).catch(() => {});
  }
}

boot();
