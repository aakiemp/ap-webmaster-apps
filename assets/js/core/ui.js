/**
 * Overlay UI: toasts, modals, drawers, bottom sheets, menus and confirms.
 * On phones, modals and drawers become bottom sheets and menus become
 * action sheets, so every overlay feels native on touch screens.
 */
import { html, raw, el, esc, icon, isPhone, $ } from './dom.js';

let layer = null;
function overlayRoot() {
  if (!layer) {
    layer = el('<div class="apwa-layer"></div>');
    document.body.appendChild(layer);
  }
  return layer;
}

/* ---------------- Toasts ---------------- */

let toastBox = null;
export function toast(message, opts = {}) {
  const { tone = 'success', title = '', timeout = 4200 } = opts;
  if (!toastBox) {
    toastBox = el('<div class="apwa-toasts" role="status" aria-live="polite"></div>');
    overlayRoot().appendChild(toastBox);
  }
  const iconName = { success: 'check-circle', info: 'info', danger: 'alert', warning: 'alert' }[tone] || 'info';
  const t = el(html`<div class="apwa-toast apwa-toast--${tone}">
    <span class="apwa-toast__icon">${icon(iconName)}</span>
    <div class="apwa-toast__body">${title ? html`<strong>${title}</strong>` : ''}<span>${message}</span></div>
    <button type="button" class="apwa-iconbtn apwa-iconbtn--sm" aria-label="Dismiss">${icon('x')}</button>
  </div>`);
  const close = () => {
    t.classList.add('is-leaving');
    setTimeout(() => t.remove(), 180);
  };
  t.querySelector('button').addEventListener('click', close);
  toastBox.appendChild(t);
  requestAnimationFrame(() => t.classList.add('is-in'));
  if (timeout) setTimeout(close, timeout);
  return close;
}

/** The standard truthful notice for anything that would normally contact someone. */
export function simulated(what) {
  toast(`${what} No email, text or call was actually sent.`, { tone: 'info', title: 'Simulated in demo mode' });
}

/* ---------------- Focus management ---------------- */

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type=hidden]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function trapFocus(container, e) {
  if (e.key !== 'Tab') return;
  const items = Array.from(container.querySelectorAll(FOCUSABLE)).filter((n) => n.offsetParent !== null);
  if (!items.length) return;
  const first = items[0];
  const last = items[items.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
}

const stack = [];
document.addEventListener('keydown', (e) => {
  const top = stack[stack.length - 1];
  if (!top) return;
  if (e.key === 'Escape') { e.preventDefault(); top.close(); }
  else trapFocus(top.panel, e);
});

/**
 * Open a dialog.
 * @param {object} o
 * @param {string} o.title
 * @param {string|Element} o.body
 * @param {Array}  o.buttons [{label, kind:'primary'|'secondary'|'danger', onClick(close, panel) => false to keep open, type}]
 * @param {'modal'|'drawer'} o.variant
 * @param {'sm'|'md'|'lg'} o.size
 * @param {Function} o.onClose
 * @param {Function} o.onSubmit  If set, the body is wrapped in a form; return false to keep open.
 */
export function openPanel(o) {
  const variant = isPhone() ? 'sheet' : (o.variant || 'modal');
  const size = o.size || 'md';
  const prevFocus = document.activeElement;
  const titleId = `apwa-dlg-${Math.random().toString(36).slice(2, 8)}`;
  const Tag = o.onSubmit ? 'form' : 'div';

  const wrap = el(html`<div class="apwa-overlay apwa-overlay--${variant}">
    <div class="apwa-backdrop" data-close></div>
    <${raw(Tag)} class="apwa-panel apwa-panel--${variant} apwa-panel--${size}" role="dialog" aria-modal="true" aria-labelledby="${titleId}" ${o.onSubmit ? raw('novalidate') : ''}>
      ${variant === 'sheet' ? html`<div class="apwa-panel__grab" aria-hidden="true"></div>` : ''}
      <header class="apwa-panel__head">
        <div class="apwa-panel__titles">
          <h2 class="apwa-panel__title" id="${titleId}">${o.title || ''}</h2>
          ${o.subtitle ? html`<p class="apwa-panel__subtitle">${o.subtitle}</p>` : ''}
        </div>
        ${o.headActions || ''}
        <button type="button" class="apwa-iconbtn" data-close aria-label="Close">${icon('x')}</button>
      </header>
      <div class="apwa-panel__body"></div>
      ${o.buttons && o.buttons.length ? html`<footer class="apwa-panel__foot"></footer>` : ''}
    </${raw(Tag)}>
  </div>`);

  const panel = wrap.querySelector('.apwa-panel');
  const body = panel.querySelector('.apwa-panel__body');
  if (o.body instanceof Element) body.appendChild(o.body);
  else body.innerHTML = String(o.body || '');

  let closed = false;
  const api = {
    panel,
    body,
    close() {
      if (closed) return;
      closed = true;
      const i = stack.indexOf(api);
      if (i >= 0) stack.splice(i, 1);
      wrap.classList.remove('is-open');
      setTimeout(() => wrap.remove(), 220);
      if (!stack.length) document.documentElement.classList.remove('apwa-noscroll');
      if (o.onClose) o.onClose();
      if (prevFocus && prevFocus.focus) prevFocus.focus({ preventScroll: true });
    },
  };

  const foot = panel.querySelector('.apwa-panel__foot');
  (o.buttons || []).forEach((b) => {
    const btn = el(html`<button type="${b.type || 'button'}" class="apwa-btn apwa-btn--${b.kind || 'secondary'}">${b.icon ? icon(b.icon) : ''}<span>${b.label}</span></button>`);
    if (b.className) btn.classList.add(b.className);
    if (b.type !== 'submit') {
      btn.addEventListener('click', () => {
        const keep = b.onClick ? b.onClick(api.close, panel) : undefined;
        if (keep !== false) api.close();
      });
    }
    foot.appendChild(btn);
  });

  if (o.onSubmit) {
    panel.addEventListener('submit', (e) => {
      e.preventDefault();
      if (o.onSubmit(panel, api.close) !== false) api.close();
    });
  }

  wrap.addEventListener('click', (e) => {
    if (e.target.closest('[data-close]')) api.close();
  });

  overlayRoot().appendChild(wrap);
  stack.push(api);
  document.documentElement.classList.add('apwa-noscroll');
  requestAnimationFrame(() => {
    wrap.classList.add('is-open');
    const first = panel.querySelector('[autofocus]') || (isPhone() ? null : panel.querySelector('.apwa-panel__body ' + FOCUSABLE));
    (first || panel.querySelector('[data-close].apwa-iconbtn')).focus({ preventScroll: true });
  });
  if (o.onOpen) o.onOpen(panel, api);
  return api;
}

/** Confirm dialog. Resolves true/false. */
export function confirmDialog({ title, message, confirmLabel = 'Confirm', tone = 'primary' }) {
  return new Promise((resolve) => {
    let ok = false;
    openPanel({
      title,
      size: 'sm',
      body: `<p class="apwa-text">${esc(message)}</p>`,
      buttons: [
        { label: 'Cancel', kind: 'secondary' },
        { label: confirmLabel, kind: tone === 'danger' ? 'danger' : 'primary', onClick: () => { ok = true; } },
      ],
      onClose: () => resolve(ok),
    });
  });
}

/* ---------------- Menus / action sheets ---------------- */

let openMenu = null;
function closeMenu() {
  if (openMenu) { openMenu.close(); openMenu = null; }
}
document.addEventListener('click', (e) => {
  if (openMenu && !openMenu.node.contains(e.target) && !openMenu.anchor.contains(e.target)) closeMenu();
});
window.addEventListener('resize', closeMenu);

/**
 * Dropdown menu anchored to a button; action sheet on phones.
 * items: [{label, icon, onClick, tone:'danger', disabled, hint, href, external, divider, heading}]
 */
export function menu(anchor, items, opts = {}) {
  if (openMenu && openMenu.anchor === anchor) { closeMenu(); return; }
  closeMenu();
  if (isPhone() && opts.sheet !== false) {
    const list = el('<div class="apwa-sheetmenu" role="menu"></div>');
    let panelApi = null;
    renderItems(list, items, () => panelApi && panelApi.close());
    panelApi = openPanel({ title: opts.title || 'Actions', body: list, size: 'sm' });
    return;
  }
  const node = el('<div class="apwa-menu" role="menu"></div>');
  renderItems(node, items, closeMenu);
  overlayRoot().appendChild(node);
  const r = anchor.getBoundingClientRect();
  const w = Math.max(node.offsetWidth, opts.minWidth || 200);
  node.style.minWidth = `${w}px`;
  let left = opts.align === 'left' ? r.left : r.right - w;
  left = Math.max(8, Math.min(left, window.innerWidth - w - 8));
  let top = r.bottom + 6;
  if (top + node.offsetHeight > window.innerHeight - 8) top = Math.max(8, r.top - node.offsetHeight - 6);
  node.style.left = `${left}px`;
  node.style.top = `${top}px`;
  anchor.setAttribute('aria-expanded', 'true');
  openMenu = {
    node,
    anchor,
    close() { node.remove(); anchor.setAttribute('aria-expanded', 'false'); },
  };
  const first = node.querySelector('[role=menuitem]:not([disabled])');
  if (first) first.focus({ preventScroll: true });
  node.addEventListener('keydown', (e) => {
    const btns = Array.from(node.querySelectorAll('[role=menuitem]:not([disabled])'));
    const i = btns.indexOf(document.activeElement);
    if (e.key === 'ArrowDown') { e.preventDefault(); (btns[i + 1] || btns[0]).focus(); }
    if (e.key === 'ArrowUp') { e.preventDefault(); (btns[i - 1] || btns[btns.length - 1]).focus(); }
    if (e.key === 'Escape') { e.preventDefault(); closeMenu(); anchor.focus(); }
  });
}

function renderItems(container, items, done) {
  items.forEach((it) => {
    if (it.divider) { container.appendChild(el('<div class="apwa-menu__divider" role="separator"></div>')); return; }
    if (it.heading) { container.appendChild(el(html`<div class="apwa-menu__heading">${it.heading}</div>`)); return; }
    const tag = it.href ? 'a' : 'button';
    const node = el(html`<${raw(tag)} class="apwa-menu__item ${it.tone === 'danger' ? 'is-danger' : ''} ${it.active ? 'is-active' : ''}" role="menuitem"
      ${it.href ? raw(`href="${esc(it.href)}"`) : raw('type="button"')} ${it.external ? raw('target="_blank" rel="noopener"') : ''} ${it.disabled ? raw('disabled aria-disabled="true"') : ''}>
      ${it.icon ? icon(it.icon) : ''}<span class="apwa-menu__label">${it.label}</span>${it.hint ? html`<span class="apwa-menu__hint">${it.hint}</span>` : ''}${it.active ? icon('check', 'apwa-menu__check') : ''}
    </${raw(tag)}>`);
    node.addEventListener('click', (e) => {
      if (it.disabled) { e.preventDefault(); return; }
      done();
      if (it.onClick) { e.preventDefault(); it.onClick(); }
    });
    container.appendChild(node);
  });
}

/** Popover with arbitrary content anchored to an element (sheet on phones). */
export function popover(anchor, { title, body, width = 320 }) {
  if (isPhone()) {
    return openPanel({ title, body, size: 'sm' });
  }
  closeMenu();
  const node = el(html`<div class="apwa-menu apwa-popover" role="dialog" aria-label="${title}" tabindex="-1"></div>`);
  if (body instanceof Element) node.appendChild(body);
  else node.innerHTML = body;
  overlayRoot().appendChild(node);
  const r = anchor.getBoundingClientRect();
  node.style.width = `${width}px`;
  node.style.left = `${Math.max(8, Math.min(r.right - width, window.innerWidth - width - 8))}px`;
  node.style.top = `${r.bottom + 6}px`;
  openMenu = { node, anchor, close() { node.remove(); } };
  node.focus({ preventScroll: true });
  node.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeMenu(); anchor.focus(); } });
  return { close: closeMenu, body: node };
}

export { closeMenu, overlayRoot };

/** Read a form into a plain object (trimmed strings). */
export function formData(form) {
  const out = {};
  new FormData(form).forEach((v, k) => { out[k] = typeof v === 'string' ? v.trim() : v; });
  return out;
}

/** Mark invalid fields; returns true if valid. rules: {name: message} for required. */
export function validate(form, rules) {
  let ok = true;
  form.querySelectorAll('.apwa-field.is-invalid').forEach((f) => {
    f.classList.remove('is-invalid');
    const m = f.querySelector('.apwa-field__error');
    if (m) m.remove();
  });
  Object.entries(rules).forEach(([name, check]) => {
    const input = form.elements[name];
    if (!input) return;
    const msg = typeof check === 'function' ? check(input.value.trim()) : (input.value.trim() ? '' : check);
    if (msg) {
      ok = false;
      const field = input.closest('.apwa-field');
      field.classList.add('is-invalid');
      field.appendChild(el(html`<div class="apwa-field__error">${msg}</div>`));
      input.setAttribute('aria-invalid', 'true');
    } else {
      input.removeAttribute('aria-invalid');
    }
  });
  if (!ok) {
    const firstBad = form.querySelector('.is-invalid input, .is-invalid select, .is-invalid textarea');
    if (firstBad) firstBad.focus();
  }
  return ok;
}

export { $ };
