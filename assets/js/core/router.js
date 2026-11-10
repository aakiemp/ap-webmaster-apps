/**
 * History-API router for everything under the demo base path
 * (e.g. /apps/demo/crm/contacts/c4). Server rewrites send every such URL to
 * the same page, so any screen can be deep-linked and refreshed.
 */

let base = '/';
let handler = () => {};

export function start(basePath, onChange) {
  base = basePath.endsWith('/') ? basePath : `${basePath}/`;
  handler = onChange;
  window.addEventListener('popstate', () => handler({ type: 'pop' }));
  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest('a[href]');
    if (!a || a.target === '_blank' || a.hasAttribute('download') || a.dataset.external != null) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin || !url.pathname.startsWith(base)) return;
    e.preventDefault();
    go(url.pathname.slice(base.length) + url.search);
  });
}

/** Current path relative to the base, without leading/trailing slashes. */
export function path() {
  const p = location.pathname.startsWith(base) ? location.pathname.slice(base.length) : '';
  return p.replace(/^\/+|\/+$/g, '');
}

export function query() {
  return Object.fromEntries(new URLSearchParams(location.search));
}

/** Absolute href for a relative app path. */
export function href(rel = '') {
  return base + String(rel).replace(/^\/+/, '');
}

export function go(rel, { replace = false } = {}) {
  const url = href(rel);
  if (url === location.pathname + location.search) return handler({ type: 'same' });
  history[replace ? 'replaceState' : 'pushState']({}, '', url);
  handler({ type: replace ? 'replace' : 'push' });
}

/** Match "contacts/:id" against "contacts/c4". */
export function match(pattern, rel) {
  const a = pattern.split('/').filter(Boolean);
  const b = rel.split('/').filter(Boolean);
  if (a.length !== b.length) return null;
  const params = {};
  for (let i = 0; i < a.length; i += 1) {
    if (a[i].startsWith(':')) params[a[i].slice(1)] = decodeURIComponent(b[i]);
    else if (a[i] !== b[i]) return null;
  }
  return params;
}
