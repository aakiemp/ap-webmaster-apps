/**
 * Application shell: sidebar (desktop), icon rail (tablet), top bar and
 * bottom tab bar (phone), page header, global search, quick-add menu and
 * the Demo Mode indicator. Apps plug in through a small module contract
 * (see docs/ARCHITECTURE.md).
 */
import { html, raw, el, esc, icon, on, $, $$, debounce, isPhone, mqPhone } from './dom.js';
import * as store from './store.js';
import * as router from './router.js';
import { menu, popover, openPanel, toast, confirmDialog, closeMenu } from './ui.js';
import { avatar, emptyState, button } from './components.js';

const CONFIG = window.APWA_CONFIG || {};

let modules = [];
let dashboardView = null;
let root;
let current = null;
let renderQueued = false;

/* ---------------- Module registry ---------------- */

export function register(mods, dashboard) {
  modules = mods;
  dashboardView = dashboard;
}

function appMeta(slug) { return (CONFIG.apps || []).find((a) => a.slug === slug); }
function moduleFor(slug) { return modules.find((m) => m.slug === slug); }

/* ---------------- Route resolution ---------------- */

function resolve(rel) {
  if (!rel) return { slug: '', view: dashboardView, params: {} };
  const slug = rel.split('/')[0];
  const mod = moduleFor(slug);
  const meta = appMeta(slug);
  if (mod) {
    for (const r of mod.routes) {
      const params = router.match(r.pattern, rel);
      if (params) {
        if (r.redirect) return { redirect: r.redirect };
        return { slug, view: r.view, params, navId: r.nav || r.pattern };
      }
    }
    return { slug, view: notFoundView, params: {} };
  }
  if (meta) return { slug, view: comingSoonView, params: { meta } };
  return { slug: '', view: notFoundView, params: {} };
}

/* ---------------- Frame ---------------- */

function navItems() {
  const items = [{ id: 'home', href: router.href(''), label: 'Dashboard', icon: 'home', slug: '' }];
  modules.forEach((m) => {
    m.nav.forEach((n) => items.push({ ...n, href: router.href(n.path), slug: m.slug, group: appMeta(m.slug)?.name }));
  });
  return items;
}

function sidebar() {
  const items = navItems();
  const live = items.filter((i) => i.group);
  const groups = [...new Set(live.map((i) => i.group))];
  const soon = (CONFIG.apps || []).filter((a) => a.status !== 'demo');
  const b = store.get().business;
  return html`<aside class="apwa-sidebar" aria-label="Main navigation">
    <div class="apwa-brand">
      <span class="apwa-brand__mark" aria-hidden="true"><img src="${CONFIG.assetsUrl}assets/img/ap-mark.png" alt=""></span>
      <span class="apwa-brand__text"><strong>AP Webmaster</strong><span>Apps</span></span>
    </div>
    <div class="apwa-workspace" title="Fictional demo business">
      <span class="apwa-workspace__mark" aria-hidden="true">${b.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}</span>
      <span class="apwa-workspace__text"><strong>${b.name}</strong><span>Demo workspace</span></span>
    </div>
    <nav class="apwa-nav">
      <a class="apwa-nav__item" data-nav="home" href="${items[0].href}" title="Dashboard">${icon('home')}<span>Dashboard</span></a>
      ${groups.map((g) => html`<div class="apwa-nav__group">${g}</div>
        ${live.filter((i) => i.group === g).map((i) => html`<a class="apwa-nav__item" data-nav="${i.id}" href="${i.href}" title="${i.label}">${icon(i.icon)}<span>${i.label}</span></a>`)}`)}
      ${soon.length ? html`<div class="apwa-nav__group">More apps</div>
        ${soon.map((a) => html`<a class="apwa-nav__item is-soon" data-nav="app:${a.slug}" href="${router.href(`${a.slug}/`)}" title="${a.name} (coming soon)">${icon(a.icon)}<span>${a.shortName || a.name}</span><em class="apwa-soon">Soon</em></a>`)}` : ''}
    </nav>
    <div class="apwa-sidebar__foot">
      <a class="apwa-nav__item" href="${CONFIG.marketplace || '#'}" data-external title="Browse all apps">${icon('grid')}<span>Browse all apps</span></a>
      <button type="button" class="apwa-nav__item" data-action="reset" title="Reset demo data">${icon('refresh')}<span>Reset demo data</span></button>
    </div>
  </aside>`;
}

function topbar() {
  const u = store.currentUser();
  return html`<header class="apwa-topbar">
    <div class="apwa-topbar__left">
      <a class="apwa-topbar__back apwa-show-phone" href="#" hidden aria-label="Back">${icon('chevron-left')}</a>
      <span class="apwa-topbar__logo apwa-show-phone" aria-hidden="true"><img src="${CONFIG.assetsUrl}assets/img/ap-mark.png" alt=""></span>
      <nav class="apwa-crumbs" aria-label="Breadcrumb"></nav>
    </div>
    <div class="apwa-search apwa-hide-phone" role="search">
      ${icon('search')}
      <input type="search" placeholder="Search contacts and deals" aria-label="Search contacts and deals" autocomplete="off" data-search>
      <kbd>/</kbd>
      <div class="apwa-search__results" hidden></div>
    </div>
    <div class="apwa-topbar__right">
      <button type="button" class="apwa-iconbtn apwa-show-phone" data-action="search" aria-label="Search">${icon('search')}</button>
      <button type="button" class="apwa-btn apwa-btn--primary apwa-btn--sm apwa-hide-phone" data-action="quick-add" aria-haspopup="menu" aria-expanded="false">${icon('plus')}<span>New</span></button>
      <button type="button" class="apwa-demo-pill" data-action="demo-info" aria-haspopup="dialog">
        <i aria-hidden="true"></i><span>Demo<span class="apwa-hide-phone"> mode</span></span>
      </button>
      <button type="button" class="apwa-userbtn apwa-hide-phone" data-action="user-menu" aria-haspopup="menu" aria-expanded="false" aria-label="Account menu">
        ${avatar(u.name, { size: 'sm' })}
      </button>
    </div>
  </header>`;
}

function tabbar() {
  return html`<nav class="apwa-tabbar apwa-show-phone" aria-label="App navigation"></nav>`;
}

function renderTabbar(slug) {
  const nav = $('.apwa-tabbar', root);
  if (!nav) return;
  const mod = moduleFor(slug) || modules[0];
  const tabs = [{ id: 'home', href: router.href(''), label: 'Home', icon: 'home' }];
  (mod ? (mod.tabs || mod.nav) : []).slice(0, 3).forEach((n) => tabs.push({ id: n.id, href: router.href(n.path), label: n.short || n.label, icon: n.icon }));
  nav.innerHTML = html`${tabs.map((t) => html`<a class="apwa-tab" data-nav="${t.id}" href="${t.href}">${icon(t.icon)}<span>${t.label}</span></a>`)}
    <button type="button" class="apwa-tab" data-action="apps-sheet">${icon('grid')}<span>Apps</span></button>`;
}

/* ---------------- Mount ---------------- */

export function mount(container) {
  root = container;
  root.innerHTML = html`<div class="apwa-app">
    ${sidebar()}
    <div class="apwa-main">
      ${topbar()}
      <main class="apwa-content" id="apwa-main" tabindex="-1">
        <div class="apwa-page"></div>
      </main>
    </div>
    ${tabbar()}
    <button type="button" class="apwa-fab apwa-show-phone" hidden></button>
  </div>`;

  bindGlobal();
  store.subscribe(() => queueRender());
  mqPhone.addEventListener('change', () => queueRender());
  router.start(CONFIG.basePath || '/', (ev) => render(ev));
  render({ type: 'initial' });
}

function queueRender() {
  if (renderQueued) return;
  renderQueued = true;
  requestAnimationFrame(() => { renderQueued = false; render({ type: 'data' }); });
}

/* ---------------- Render ---------------- */

function render(ev) {
  closeMenu();
  const rel = router.path();
  const r = resolve(rel);
  if (r.redirect) { router.go(r.redirect, { replace: true }); return; }

  const main = $('.apwa-content', root);
  const keepScroll = ev.type === 'data' || ev.type === 'same';
  const scrollTop = main.scrollTop;
  const winScroll = window.scrollY;

  if (current && current.cleanup) current.cleanup();
  const ctx = { params: r.params, query: router.query(), path: rel, go: router.go, href: router.href, rerender: queueRender };
  let v;
  try {
    v = r.view(ctx) || {};
  } catch (err) {
    console.error(err);
    v = { title: 'Something went wrong', body: emptyState({ icon: 'alert', title: 'This screen could not load', text: 'Try resetting the demo data from the menu.' }) };
  }
  current = { ...v, slug: r.slug, navId: r.navId || (r.slug ? `app:${r.slug}` : 'home') };

  // Document title.
  const meta = appMeta(r.slug);
  document.title = `${v.title || 'Dashboard'} · ${meta ? meta.shortName : 'AP Webmaster Apps'}`;

  // Breadcrumbs (desktop) / title (phone).
  const crumbs = $('.apwa-crumbs', root);
  const crumbItems = [];
  if (meta) crumbItems.push(html`<a href="${router.href(`${r.slug}/`)}">${meta.shortName}</a>`);
  if (v.crumb) crumbItems.push(html`<a href="${v.crumb.href}">${v.crumb.label}</a>`);
  crumbItems.push(html`<span aria-current="page">${v.title || 'Dashboard'}</span>`);
  crumbs.innerHTML = crumbItems.join(`<span class="apwa-crumbs__sep" aria-hidden="true">${icon('chevron-right')}</span>`);

  const back = $('.apwa-topbar__back', root);
  const logo = $('.apwa-topbar__logo', root);
  if (v.back) { back.hidden = false; back.href = v.back; logo.hidden = true; } else { back.hidden = true; logo.hidden = false; }

  // Page.
  const page = $('.apwa-page', root);
  page.className = `apwa-page ${v.pageClass || ''}`;
  const actions = (v.actions || []);
  page.innerHTML = html`
    ${v.hideHead ? '' : html`<div class="apwa-pagehead">
      <div class="apwa-pagehead__titles">
        <h1 class="apwa-pagehead__title">${v.titleHtml || v.title || ''}</h1>
        ${v.subtitle ? html`<p class="apwa-pagehead__sub">${v.subtitle}</p>` : ''}
      </div>
      ${actions.length ? html`<div class="apwa-pagehead__actions">${actions.map((a, i) => html`<button type="button" class="apwa-btn apwa-btn--${a.kind || 'secondary'} ${a.primary ? 'apwa-hide-phone' : ''}" data-page-action="${i}">${a.icon ? icon(a.icon) : ''}<span>${a.label}</span></button>`)}</div>` : ''}
    </div>`}
    <div class="apwa-pagebody"></div>`;
  const body = $('.apwa-pagebody', page);
  if (v.body instanceof Element) body.appendChild(v.body);
  else body.innerHTML = String(v.body || '');
  $$('[data-page-action]', page).forEach((b) => b.addEventListener('click', () => actions[Number(b.dataset.pageAction)].onClick(b)));

  // Phone floating action button for the primary action.
  const fab = $('.apwa-fab', root);
  const primary = actions.find((a) => a.primary);
  if (primary) {
    fab.hidden = false;
    fab.innerHTML = html`${icon(primary.fabIcon || 'plus')}<span class="apwa-sr">${primary.label}</span>`;
    fab.setAttribute('aria-label', primary.label);
    fab.onclick = () => primary.onClick(fab);
  } else {
    fab.hidden = true;
    fab.onclick = null;
  }

  if (v.mount) {
    try { v.mount(body, ctx); } catch (err) { console.error(err); }
  }

  // Active nav.
  renderTabbar(r.slug);
  $$('[data-nav]', root).forEach((a) => {
    const active = a.dataset.nav === current.navId;
    a.classList.toggle('is-active', active);
    if (active) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });

  if (keepScroll) {
    main.scrollTop = scrollTop;
    window.scrollTo(0, winScroll);
  } else {
    main.scrollTop = 0;
    window.scrollTo(0, 0);
    if (ev.type === 'push' || ev.type === 'pop') main.focus({ preventScroll: true });
  }
}

/* ---------------- Built-in views ---------------- */

function comingSoonView({ params }) {
  const a = params.meta;
  return {
    title: a.name,
    subtitle: a.tagline,
    back: router.href(''),
    body: html`<div class="apwa-soonpage">
      <div class="apwa-card apwa-soonpage__card">
        <div class="apwa-soonpage__icon apwa-tone--${a.color}">${icon(a.icon)}</div>
        <div>
          <span class="apwa-badge apwa-badge--amber">In development</span>
          <h2 class="apwa-soonpage__title">The ${a.name} demo is on the way</h2>
          <p class="apwa-text-2">${a.tagline}</p>
          ${a.audience && a.audience.length ? html`<p class="apwa-soonpage__aud"><strong>Built for:</strong> ${a.audience.join(', ')}</p>` : ''}
          <div class="apwa-soonpage__actions">
            ${button('Ask about this app', { kind: 'primary', href: CONFIG.inquiryUrl || '#', icon: 'send', attrs: { 'data-external': '', target: '_blank', rel: 'noopener' } })}
            ${button('Explore the CRM demo', { href: router.href('crm/'), icon: 'arrow-right' })}
          </div>
        </div>
      </div>
    </div>`,
  };
}

function notFoundView() {
  return {
    title: 'Page not found',
    body: emptyState({ icon: 'search', title: 'We could not find that screen', text: 'It may have moved, or the record was deleted in this demo.', action: button('Go to dashboard', { kind: 'primary', href: router.href('') }) }),
  };
}

/* ---------------- Global interactions ---------------- */

function quickActions() {
  return modules.flatMap((m) => (m.quickActions || []));
}

function bindGlobal() {
  on(root, 'click', '[data-action]', (e, btn) => {
    const act = btn.dataset.action;
    if (act === 'reset') resetDemo();
    if (act === 'quick-add') {
      menu(btn, quickActions().map((q) => ({ label: q.label, icon: q.icon, onClick: q.run })), { title: 'Create new' });
    }
    if (act === 'demo-info') demoInfo(btn);
    if (act === 'user-menu') userMenu(btn);
    if (act === 'search') openSearchSheet();
    if (act === 'apps-sheet') appsSheet();
  });

  // Desktop search.
  const input = $('[data-search]', root);
  const results = $('.apwa-search__results', root);
  const runSearch = debounce(() => {
    const q = input.value.trim();
    if (!q) { results.hidden = true; return; }
    results.innerHTML = String(searchResults(q));
    results.hidden = false;
  }, 80);
  input.addEventListener('input', runSearch);
  input.addEventListener('focus', runSearch);
  input.addEventListener('keydown', (e) => {
    const links = $$('a', results);
    const i = links.indexOf(document.activeElement);
    if (e.key === 'ArrowDown' && links.length) { e.preventDefault(); links[0].focus(); }
    if (e.key === 'Enter' && links.length) { e.preventDefault(); links[0].click(); }
    if (e.key === 'Escape') { input.value = ''; results.hidden = true; input.blur(); }
    return i;
  });
  results.addEventListener('keydown', (e) => {
    const links = $$('a', results);
    const i = links.indexOf(document.activeElement);
    if (e.key === 'ArrowDown') { e.preventDefault(); (links[i + 1] || links[0]).focus(); }
    if (e.key === 'ArrowUp') { e.preventDefault(); if (i <= 0) input.focus(); else links[i - 1].focus(); }
    if (e.key === 'Escape') { results.hidden = true; input.focus(); }
  });
  results.addEventListener('click', (e) => { if (e.target.closest('a')) { results.hidden = true; input.value = ''; } });
  document.addEventListener('click', (e) => { if (!e.target.closest('.apwa-search')) results.hidden = true; });
  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && !e.target.closest('input, textarea, select, [contenteditable]') && !isPhone()) {
      e.preventDefault();
      input.focus();
    }
  });
}

function searchResults(q) {
  const groups = modules.map((m) => (m.search ? m.search(q) : [])).flat();
  if (!groups.length) return html`<div class="apwa-search__empty">No matches for “${q}”</div>`;
  return html`${groups.slice(0, 8).map((r) => html`<a class="apwa-search__item" href="${r.href}">
    <span class="apwa-search__icon">${r.avatar ? avatar(r.label, { size: 'sm' }) : icon(r.icon || 'search')}</span>
    <span class="apwa-search__text"><strong>${r.label}</strong><span>${r.sub || ''}</span></span>
    <span class="apwa-search__type">${r.type || ''}</span>
  </a>`)}`;
}

function openSearchSheet() {
  const box = el(html`<div class="apwa-sheetsearch">
    <div class="apwa-search apwa-search--sheet">${icon('search')}<input type="search" placeholder="Search contacts and deals" aria-label="Search contacts and deals" autocomplete="off" autofocus></div>
    <div class="apwa-sheetsearch__results"><p class="apwa-text-3 apwa-sheetsearch__hint">Try “kitchen”, “Delgado” or “HVAC”.</p></div>
  </div>`);
  const p = openPanel({ title: 'Search', body: box, size: 'lg' });
  const input = $('input', box);
  const out = $('.apwa-sheetsearch__results', box);
  input.addEventListener('input', debounce(() => {
    const q = input.value.trim();
    out.innerHTML = q ? String(searchResults(q)) : '<p class="apwa-text-3 apwa-sheetsearch__hint">Try “kitchen”, “Delgado” or “HVAC”.</p>';
  }, 80));
  out.addEventListener('click', (e) => { if (e.target.closest('a')) p.close(); });
}

function demoInfo(btn) {
  const body = el(html`<div class="apwa-demoinfo">
    <p><strong>You're exploring a live demo.</strong> The business, people and deals are fictional sample data.</p>
    <ul>
      <li>${icon('lock')}<span>Everything you enter stays in this browser only. Nothing is sent to us or anyone else.</span></li>
      <li>${icon('mail')}<span>Emails, texts and calls are simulated. Nothing actually goes out.</span></li>
      <li>${icon('alert')}<span>Please don't enter real personal, medical or financial information.</span></li>
    </ul>
    <div class="apwa-demoinfo__actions">
      <button type="button" class="apwa-btn apwa-btn--secondary apwa-btn--sm" data-demo-reset>${icon('refresh')}<span>Reset demo data</span></button>
      <a class="apwa-btn apwa-btn--primary apwa-btn--sm" href="${CONFIG.inquiryUrl || '#'}" target="_blank" rel="noopener">${icon('send')}<span>Get this for your business</span></a>
    </div>
    ${store.isPersistent() ? '' : html`<p class="apwa-text-3">Your browser is blocking storage, so changes will reset when you leave this page.</p>`}
  </div>`);
  const p = popover(btn, { title: 'Demo mode', body, width: 340 });
  body.querySelector('[data-demo-reset]').addEventListener('click', () => { p.close(); resetDemo(); });
}

function userMenu(btn) {
  const u = store.currentUser();
  menu(btn, [
    { heading: `${u.name} · ${u.role}` },
    { label: 'About this demo', icon: 'info', onClick: () => demoInfo(btn) },
    { label: 'Reset demo data', icon: 'refresh', onClick: resetDemo },
    { divider: true },
    { label: 'Browse all apps', icon: 'grid', href: CONFIG.marketplace },
    { label: `Back to ${CONFIG.siteName || 'website'}`, icon: 'log-out', href: CONFIG.siteUrl },
  ], { minWidth: 230 });
}

function appsSheet() {
  const apps = CONFIG.apps || [];
  const body = el(html`<div class="apwa-appsheet">
    <div class="apwa-appsheet__grid">
      ${apps.map((a) => html`<a class="apwa-appsheet__app ${a.status !== 'demo' ? 'is-soon' : ''}" href="${router.href(`${a.slug}/`)}">
        <span class="apwa-appsheet__icon apwa-tone--${a.color}">${icon(a.icon)}</span>
        <span class="apwa-appsheet__name">${a.shortName || a.name}</span>
        ${a.status !== 'demo' ? html`<em class="apwa-soon">Soon</em>` : ''}
      </a>`)}
    </div>
    <div class="apwa-sheetmenu">
      <button type="button" class="apwa-menu__item" data-sheet="new">${icon('plus')}<span class="apwa-menu__label">Create new…</span></button>
      <button type="button" class="apwa-menu__item" data-sheet="demo">${icon('info')}<span class="apwa-menu__label">About this demo</span></button>
      <button type="button" class="apwa-menu__item" data-sheet="reset">${icon('refresh')}<span class="apwa-menu__label">Reset demo data</span></button>
      <a class="apwa-menu__item" href="${CONFIG.marketplace}">${icon('grid')}<span class="apwa-menu__label">Browse all apps</span></a>
      <a class="apwa-menu__item" href="${CONFIG.siteUrl}">${icon('log-out')}<span class="apwa-menu__label">Back to ${CONFIG.siteName || 'website'}</span></a>
    </div>
  </div>`);
  const p = openPanel({ title: 'Apps', body, size: 'md' });
  body.addEventListener('click', (e) => {
    const t = e.target.closest('[data-sheet], a');
    if (!t) return;
    p.close();
    if (t.dataset.sheet === 'new') setTimeout(() => menu($('.apwa-fab', root) || t, quickActions().map((q) => ({ label: q.label, icon: q.icon, onClick: q.run })), { title: 'Create new' }), 230);
    if (t.dataset.sheet === 'demo') setTimeout(() => demoInfo(t), 230);
    if (t.dataset.sheet === 'reset') setTimeout(resetDemo, 230);
  });
}

async function resetDemo() {
  const ok = await confirmDialog({
    title: 'Reset demo data?',
    message: 'This replaces everything in this demo with fresh sample data. Changes you made will be lost.',
    confirmLabel: 'Reset demo',
    tone: 'danger',
  });
  if (!ok) return;
  store.reset();
  toast('Fresh sample data is loaded.', { title: 'Demo reset' });
}

export { esc, raw };
