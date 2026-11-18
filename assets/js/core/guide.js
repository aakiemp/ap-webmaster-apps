/**
 * Guided first run: goal picker, short app tours, success moments and the
 * getting-started checklist. Progress lives in this browser only.
 */
import { html, raw, el, icon, $, $$ } from './dom.js';
import * as store from './store.js';
import * as router from './router.js';
import { overlayRoot, toast } from './ui.js';
import * as ind from './industry.js';

const KEY = 'apwa.guide';
let st = (() => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } })();
st.done = st.done || {};
st.tours = st.tours || {};
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) { /* private mode: progress lasts this visit only */ } };

let opts = { quoteUrl: '#', launcher: () => {} };

export const GOALS = [
  { id: 'win', title: 'Win more customers', sub: 'Keep track of leads and follow up', icon: 'user-plus', start: 'crm', next: 'quote-recovery', why: ['See who needs you today', 'Add a customer in seconds'], items: ['contact', 'followup', 'booking'] },
  { id: 'paid', title: 'Get paid faster', sub: 'Send invoices and see who owes you', icon: 'dollar', start: 'invoice-automation', next: 'client-portal', why: ['See who owes you at a glance', 'Reminders chase late payments for you'], items: ['invoice', 'followup', 'contact'] },
  { id: 'cal', title: 'Fill my calendar', sub: 'Let customers book a time online', icon: 'calendar-check', start: 'booking-manager', next: 'quote-recovery', why: ['Customers book themselves online', 'Reminders cut down on no-shows'], items: ['booking', 'contact', 'followup'] },
  { id: 'happy', title: 'Keep customers happy', sub: 'Answer questions and share updates', icon: 'inbox', start: 'customer-support', next: 'client-portal', why: ['Every question in one place', 'Nothing slips through the cracks'], items: ['ticket', 'contact', 'booking'] },
];

const BLURB = {
  'crm': 'Every customer, call and quote in one list.',
  'quote-recovery': 'Friendly reminders that go out for you.',
  'invoice-automation': 'Send invoices and get paid sooner.',
  'client-portal': 'One place for clients to see progress and files.',
  'booking-manager': 'A calendar your customers can book into.',
  'customer-support': 'Every customer question, tracked to done.',
};

const ITEMS = {
  contact: { label: 'Add a customer', path: 'crm/', app: 'crm' },
  followup: { label: 'Send a follow-up', path: 'quote-recovery/', app: 'quote-recovery' },
  booking: { label: 'Book an appointment', path: 'booking-manager/', app: 'booking-manager' },
  invoice: { label: 'Send an invoice', path: 'invoice-automation/', app: 'invoice-automation' },
  ticket: { label: 'Answer a customer', path: 'customer-support/', app: 'customer-support' },
};

const SUCCESS = {
  contact: (d) => [`Nice, ${d.name || 'your customer'} is in`, 'That’s the heart of Customer Manager. Their calls, quotes and notes now live in one place.'],
  followup: () => ['Nice, your follow-ups are on their way', 'In real life they go out by email or text. In this demo nothing is actually sent.'],
  booking: () => ['Nice, the appointment is booked', 'It’s on the calendar, and the reminder would go out on its own.'],
  invoice: () => ['Nice, the invoice is sent', 'Reminders keep following up until it’s paid. In this demo nothing is actually sent.'],
  ticket: () => ['Nice, your reply is in', 'The ticket now waits on the customer, and you can see the whole conversation in one place.'],
};

const PRIMARY = 'primary';
const TOURS = {
  'crm': [
    { sel: '[data-tour="today"]', title: 'What needs you today', text: 'Anyone waiting on a quote or a call back shows up here first, so nothing slips.' },
    { sel: '[data-tour="recent"]', title: 'Everything about a customer', text: 'Tap a name to see their calls, quotes and notes in one place.' },
    { sel: PRIMARY, title: 'Your turn', text: 'Add your first customer. Use made-up details, nothing leaves your browser.', cta: 'Add a customer' },
  ],
  'quote-recovery': [
    { sel: '.apwa-pagehead__titles', title: 'Quotes that follow up for you', text: 'Every estimate you send gets friendly reminders until the customer answers.' },
    { sel: '[data-sendall]', title: 'Your turn', text: 'Send the follow-ups that are due today. It’s a demo, so nothing actually goes out.', cta: 'Send them' },
  ],
  'booking-manager': [
    { sel: '.apwa-pagehead__titles', title: 'Your calendar', text: 'Bookings from your website land here, with reminders sent for you.' },
    { sel: PRIMARY, title: 'Your turn', text: 'Book an appointment for a customer.', cta: 'Book one' },
  ],
  'invoice-automation': [
    { sel: '.apwa-pagehead__titles', title: 'Who owes you, at a glance', text: 'Unpaid and overdue invoices sit at the top, and reminders go out on their own.' },
    { sel: PRIMARY, title: 'Your turn', text: 'Create an invoice and tap Save and send.', cta: 'New invoice' },
  ],
  'customer-support': [
    { sel: '.apwa-pagehead__titles', title: 'Every question in one place', text: 'Calls, emails and website requests all become tickets you can track to done.' },
    { sel: '.apwa-content tr[data-href]', title: 'Your turn', text: 'Open a customer’s question and send them a reply.', cta: 'Open it' },
  ],
};

const appMeta = (slug) => (window.APWA_CONFIG && (window.APWA_CONFIG.apps || []).find((a) => a.slug === slug)) || null;
const goalById = (id) => GOALS.find((g) => g.id === id) || null;

export function goal() { return goalById(st.goal); }
export function startHereSlug() { return (goal() || GOALS[0]).start; }
export function seen() { return !!st.seen; }
function items() { return (goal() || GOALS[0]).items; }

/* ---------------- Setup ---------------- */

export function setup(o) {
  opts = { ...opts, ...o };
  let queued = [];
  let timer = null;
  store.subscribe((ch) => {
    if (!ch) return;
    if (ch.type === 'reset') { st.done = {}; save(); return; }
    if (ch.type !== 'insert') return;
    if (ch.col === 'contacts') {
      const c = store.find('contacts', ch.id);
      queued.push(['contact', { name: c ? store.contactName(c) : '' }]);
    } else if (ch.col === 'appointments') queued.push(['booking', {}]);
    else return;
    clearTimeout(timer);
    timer = setTimeout(() => {
      // A booking can add a contact and an appointment together: celebrate the booking.
      const pick = queued.find(([k]) => k !== 'contact') || queued[0];
      queued.forEach(([k]) => { if (k !== pick[0]) mark(k); });
      queued = [];
      done(pick[0], pick[1]);
    }, 50);
  });
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-guide-yours]')) { makeItYours(); return; }
    const a = e.target.closest('[data-guide-item]');
    if (!a) return;
    const it = ITEMS[a.dataset.guideItem];
    if (it) { st.pending = it.app; st.force = true; save(); }
  });
}

function mark(key) {
  if (st.done[key]) return false;
  st.done[key] = Date.now();
  save();
  return true;
}

/** Record that someone tried one of the checklist tasks, and celebrate the first time. */
export function done(key, detail = {}) {
  if (!mark(key)) return;
  if (!items().includes(key)) return;
  setTimeout(() => success(key, detail), 650);
}

/* ---------------- Checklist ---------------- */

function progress() {
  const list = items();
  const n = list.filter((k) => st.done[k]).length;
  return { list, n, total: list.length, next: list.find((k) => !st.done[k]) || null };
}

function checklistHtml() {
  const p = progress();
  return html`<div class="apwa-guide-list">
    <div class="apwa-guide-list__bar" role="progressbar" aria-valuemin="0" aria-valuemax="${p.total}" aria-valuenow="${p.n}" aria-label="Getting started progress"><span style="width:${Math.round((p.n / p.total) * 100)}%"></span></div>
    <ul>${p.list.map((k) => html`<li class="${st.done[k] ? 'is-done' : ''}">
      <span class="apwa-guide-list__dot" aria-hidden="true">${st.done[k] ? icon('check') : ''}</span>
      ${st.done[k] ? html`<span class="apwa-guide-list__label">${ITEMS[k].label}<span class="apwa-sr"> (done)</span></span>` : html`<a class="apwa-guide-list__label" href="${router.href(ITEMS[k].path)}" data-guide-item="${k}">${ITEMS[k].label}</a>`}
    </li>`)}</ul>
  </div>`;
}

/** Getting-started card for the dashboard. */
export function checklistCard() {
  const p = progress();
  if (p.n === p.total) return '';
  return html`<section class="apwa-card apwa-guide-card" aria-labelledby="apwa-guide-card-t">
    <div class="apwa-guide-card__head">
      <div>
        <h2 class="apwa-guide-card__title" id="apwa-guide-card-t">Getting started</h2>
        <p class="apwa-guide-card__sub">Try these to see what the apps can do. ${p.n} of ${p.total} done.</p>
      </div>
      <div class="apwa-guide-card__btns">
        <button type="button" class="apwa-btn apwa-btn--ghost apwa-btn--sm" data-guide-yours aria-label="Make it yours">${icon('sparkles')}<span>Make it yours</span></button>
        <button type="button" class="apwa-btn apwa-btn--ghost apwa-btn--sm" data-guide-choose aria-label="Change goal">${icon('target')}<span>Change goal</span></button>
      </div>
    </div>
    ${checklistHtml()}
  </section>`;
}

/* ---------------- Shared overlay helper ---------------- */

function overlay(cls, label, inner) {
  const prevFocus = document.activeElement;
  const wrap = el(html`<div class="${cls}" role="dialog" aria-modal="true" aria-labelledby="${label}">${raw(inner)}</div>`);
  overlayRoot().appendChild(wrap);
  document.documentElement.classList.add('apwa-noscroll');
  const onKey = (e) => {
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); api.dismiss(); return; }
    if (e.key !== 'Tab') return;
    const f = $$('a[href], button:not([disabled])', wrap).filter((n) => n.offsetParent !== null);
    if (!f.length) return;
    if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
  };
  document.addEventListener('keydown', onKey, true);
  const api = {
    wrap,
    dismiss: () => api.close(),
    close(after) {
      if (!wrap.isConnected) return;
      document.removeEventListener('keydown', onKey, true);
      wrap.classList.remove('is-open');
      setTimeout(() => {
        wrap.remove();
        if (!document.querySelector('.apwa-lp, .apwa-wel, .apwa-win')) document.documentElement.classList.remove('apwa-noscroll');
        if (typeof after === 'function') after();
      }, 200);
      if (typeof after !== 'function' && prevFocus && prevFocus.focus) prevFocus.focus({ preventScroll: true });
    },
  };
  requestAnimationFrame(() => requestAnimationFrame(() => wrap.classList.add('is-open')));
  return api;
}

/* ---------------- Make it yours: business name and type ---------------- */

function yoursHtml(o) {
  const t = ind.type();
  return html`
    <div class="apwa-wel__top">
      <p class="apwa-wel__eyebrow">${o.eyebrow}</p>
      <button type="button" class="apwa-wel__x" data-wel-look aria-label="Close">${icon('x')}</button>
    </div>
    <h2 class="apwa-wel__title" id="apwa-wel-t">${o.title}</h2>
    <p class="apwa-wel__lead">${o.lead}</p>
    <label class="apwa-wel__field"><span>Business name</span>
      <input type="text" maxlength="40" autocomplete="organization" enterkeyhint="done" placeholder="${t.sample}" value="${ind.custom() ? ind.name() : ''}" data-biz-name>
    </label>
    <p class="apwa-wel__label" id="apwa-biz-t">Type of business</p>
    <div class="apwa-wel__types" role="radiogroup" aria-labelledby="apwa-biz-t">
      ${ind.TYPES.map((x) => html`<button type="button" class="apwa-wel__type ${x.id === t.id ? 'is-on' : ''}" role="radio" aria-checked="${x.id === t.id ? 'true' : 'false'}" data-biz-type="${x.id}">${icon(x.icon)}<span>${x.label}</span></button>`)}
    </div>
    <label class="apwa-wel__field" data-biz-whatrow ${t.id === 'other' ? '' : 'hidden'}><span>What do you do? <em>(optional)</em></span>
      <input type="text" maxlength="40" enterkeyhint="done" placeholder="For example: bakery, pet grooming, tutoring" value="${ind.what()}" data-biz-what>
    </label>
    <div class="apwa-wel__actions">
      <button type="button" class="apwa-btn apwa-btn--primary apwa-wel__cta" data-biz-save>${o.cta}</button>
      ${raw(o.extra || '')}
    </div>
    <p class="apwa-wel__fine">${icon('lock')}<span>Stays in this browser. Nothing is sent anywhere.</span></p>`;
}

/** Handles clicks inside the form. Returns 'save' when the visitor saved. */
function yoursClick(e, body) {
  const tb = e.target.closest('[data-biz-type]');
  if (tb) {
    $$('[data-biz-type]', body).forEach((b) => { const on = b === tb; b.classList.toggle('is-on', on); b.setAttribute('aria-checked', on ? 'true' : 'false'); });
    const t = ind.TYPES.find((x) => x.id === tb.dataset.bizType);
    $('[data-biz-name]', body).placeholder = t ? t.sample : '';
    $('[data-biz-whatrow]', body).hidden = tb.dataset.bizType !== 'other';
    return 'type';
  }
  return e.target.closest('[data-biz-save]') ? 'save' : '';
}

/** Saves the choice and reloads the sample data when it changed. */
function yoursSave(body) {
  const tb = $('[data-biz-type].is-on', body);
  ind.set($('[data-biz-name]', body).value, tb ? tb.dataset.bizType : 'home', $('[data-biz-what]', body).value);
  const b = store.get().business || {};
  if (b.name === ind.name() && (b.type || 'home') === ind.type().id && b.industry === ind.label()) return false;
  store.reset();
  return true;
}

function focusYours(body) {
  const fine = window.matchMedia && window.matchMedia('(pointer: fine)').matches;
  const n = fine ? $('[data-biz-name]', body) : $('[data-biz-type].is-on', body);
  if (n) n.focus({ preventScroll: true });
}

function yoursKeys(e, body, onSave) {
  if (e.key === 'Enter' && e.target.matches('[data-biz-name], [data-biz-what]')) { e.preventDefault(); onSave(); return; }
  const tb = e.target.closest('[data-biz-type]');
  if (!tb || !['ArrowDown', 'ArrowUp', 'ArrowRight', 'ArrowLeft'].includes(e.key)) return;
  e.preventDefault();
  const list = $$('[data-biz-type]', body);
  const nb = list[(list.indexOf(tb) + (e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : -1) + list.length) % list.length];
  nb.click(); nb.focus();
}

/** Change the business name and type later, from the menu or dashboard. */
export function makeItYours() {
  const o = overlay('apwa-wel', 'apwa-wel-t', html`<div class="apwa-wel__backdrop" data-wel-look></div>
    <div class="apwa-wel__panel"><div class="apwa-wel__body" data-wel-body></div></div>`);
  const body = $('[data-wel-body]', o.wrap);
  body.innerHTML = yoursHtml({
    eyebrow: 'Make it yours',
    title: 'Use your business in the demo',
    lead: 'The demo starts over with sample customers, services and numbers that fit your type of business.',
    cta: 'Save and start over',
    extra: html`<button type="button" class="apwa-wel__link" data-wel-look>Cancel</button>`,
  });
  const save = () => {
    const changed = yoursSave(body);
    o.close();
    if (changed) toast(`The demo now uses ${ind.name()}.`, { title: 'All set' });
  };
  o.wrap.addEventListener('click', (e) => {
    if (yoursClick(e, body) === 'save') { save(); return; }
    if (e.target.closest('[data-wel-look]')) o.dismiss();
  });
  o.wrap.addEventListener('keydown', (e) => yoursKeys(e, body, save));
  focusYours(body);
}

/* ---------------- Welcome: goal picker ---------------- */

export function welcome() {
  let picked = st.goal || 'win';
  const o = overlay('apwa-wel', 'apwa-wel-t', html`<div class="apwa-wel__backdrop" data-wel-look></div>
    <div class="apwa-wel__panel"><div class="apwa-wel__body" data-wel-body></div></div>`);
  o.dismiss = () => { st.seen = true; save(); o.close(opts.launcher); };
  const body = $('[data-wel-body]', o.wrap);

  const stepOne = () => {
    body.innerHTML = html`
      <div class="apwa-wel__top">
        <p class="apwa-wel__eyebrow">Welcome to the demo</p>
        <button type="button" class="apwa-wel__x" data-wel-look aria-label="Close and see all apps">${icon('x')}</button>
      </div>
      <h2 class="apwa-wel__title" id="apwa-wel-t">What would you like help with first?</h2>
      <p class="apwa-wel__lead">Pick one. I’ll open the app that fits and show you around. Everything else is one tap away.</p>
      <div class="apwa-wel__goals" role="radiogroup" aria-labelledby="apwa-wel-t">
        ${GOALS.map((g) => html`<button type="button" class="apwa-wel__goal ${g.id === picked ? 'is-on' : ''}" role="radio" aria-checked="${g.id === picked ? 'true' : 'false'}" data-goal="${g.id}">
          <span class="apwa-wel__gicon">${icon(g.icon)}</span>
          <span class="apwa-wel__gtext"><strong>${g.title}</strong><span>${g.sub}</span></span>
          <span class="apwa-wel__radio" aria-hidden="true"></span>
        </button>`)}
      </div>
      <div class="apwa-wel__actions">
        <button type="button" class="apwa-btn apwa-btn--primary apwa-wel__cta" data-wel-next>Continue</button>
        <button type="button" class="apwa-wel__link" data-wel-look>Just let me look around</button>
      </div>`;
    const first = $('.apwa-wel__goal.is-on', body);
    if (first) first.focus({ preventScroll: true });
  };

  const tile = (slug) => {
    const a = appMeta(slug);
    return a ? html`<span class="apwa-lp__icon apwa-lp--${a.color} apwa-wel__appicon">${icon(a.icon)}</span>` : '';
  };

  const stepTwo = () => {
    const g = goalById(picked);
    const a = appMeta(g.start);
    const n = appMeta(g.next);
    body.innerHTML = html`
      <div class="apwa-wel__top">
        <button type="button" class="apwa-wel__back" data-wel-back>${icon('chevron-left')}<span>Back</span></button>
        <button type="button" class="apwa-wel__x" data-wel-look aria-label="Close and see all apps">${icon('x')}</button>
      </div>
      <h2 class="apwa-wel__title" id="apwa-wel-t">Here’s where I’d start</h2>
      <p class="apwa-wel__lead">To ${g.title.charAt(0).toLowerCase() + g.title.slice(1)}, begin with ${a ? a.shortName : 'this app'}. The tour takes about a minute.</p>
      <div class="apwa-wel__start">
        <div class="apwa-wel__starthead"><span class="apwa-wel__pill">Start here</span></div>
        <div class="apwa-wel__app">${tile(g.start)}<span><strong>${a ? a.shortName : ''}</strong><span>${BLURB[g.start] || ''}</span></span></div>
        <ul class="apwa-wel__why">${g.why.map((w) => html`<li>${icon('check')}<span>${w}</span></li>`)}</ul>
        <button type="button" class="apwa-btn apwa-btn--primary apwa-wel__cta" data-wel-go="${g.start}">Show me around</button>
      </div>
      ${n ? html`<a class="apwa-wel__nextapp" href="${router.href(`${g.next}/`)}" data-wel-go="${g.next}">${tile(g.next)}<span><em>Up next</em><strong>${n.shortName}</strong><span>${BLURB[g.next] || ''}</span></span>${icon('chevron-right')}</a>` : ''}
      <div class="apwa-wel__actions"><button type="button" class="apwa-wel__link" data-wel-look>See all apps instead</button></div>`;
    $('[data-wel-go]', body).focus({ preventScroll: true });
  };

  o.wrap.addEventListener('click', (e) => {
    const gb = e.target.closest('[data-goal]');
    if (gb) {
      picked = gb.dataset.goal;
      $$('[data-goal]', body).forEach((b) => { const on = b === gb; b.classList.toggle('is-on', on); b.setAttribute('aria-checked', on ? 'true' : 'false'); });
      return;
    }
    const y = yoursClick(e, body);
    if (y === 'save') { yoursSave(body); stepOne(); return; }
    if (y) return;
    if (e.target.closest('[data-wel-skip]')) { stepOne(); return; }
    if (e.target.closest('[data-wel-next]')) { st.goal = picked; save(); stepTwo(); return; }
    if (e.target.closest('[data-wel-back]')) { stepOne(); return; }
    const go = e.target.closest('[data-wel-go]');
    if (go) {
      e.preventDefault();
      st.goal = picked; st.seen = true; st.pending = go.dataset.welGo; st.force = true; save();
      o.close(() => router.go(`${go.dataset.welGo}/`));
      return;
    }
    if (e.target.closest('[data-wel-look]')) o.dismiss();
  });
  o.wrap.addEventListener('keydown', (e) => {
    if ($('[data-biz-name]', body)) { yoursKeys(e, body, () => { yoursSave(body); stepOne(); }); return; }
    const gb = e.target.closest('[data-goal]');
    if (!gb || !['ArrowDown', 'ArrowUp', 'ArrowRight', 'ArrowLeft'].includes(e.key)) return;
    e.preventDefault();
    const list = $$('[data-goal]', body);
    const i = list.indexOf(gb) + (e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : -1);
    const nb = list[(i + list.length) % list.length];
    nb.click(); nb.focus();
  });
  if (ind.chosen()) { stepOne(); return; }
  body.innerHTML = yoursHtml({
    eyebrow: 'Welcome to the demo',
    title: 'First, make it yours',
    lead: 'Type your business name and pick your type. I’ll fill the demo with sample customers that fit.',
    cta: 'Continue',
    extra: html`<button type="button" class="apwa-wel__link" data-wel-skip>Skip, use the sample business</button>`,
  });
  focusYours(body);
}

/* ---------------- Success moment ---------------- */

let winOpen = null;
function success(key, detail) {
  if (winOpen) winOpen.close();
  $$('.apwa-toast').forEach((t) => t.remove());
  const [title, text] = (SUCCESS[key] || SUCCESS.contact)(detail);
  const p = progress();
  const all = p.n === p.total;
  const o = overlay('apwa-win', 'apwa-win-t', html`<div class="apwa-win__backdrop" data-win-close></div>
    <div class="apwa-win__panel">
      <span class="apwa-win__grab" aria-hidden="true"></span>
      <span class="apwa-win__check" aria-hidden="true">${icon('check')}</span>
      <h2 class="apwa-win__title" id="apwa-win-t">${all ? 'You’ve tried the essentials' : title}</h2>
      <p class="apwa-win__text">${all ? 'That’s how the apps work together. I can set the same thing up for your business, built around how you work.' : text}</p>
      <div class="apwa-win__list">
        <div class="apwa-win__listhead"><strong>Getting started</strong><span>${p.n} of ${p.total} done</span></div>
        ${checklistHtml()}
      </div>
      <div class="apwa-win__actions">
        ${all
          ? html`<a class="apwa-btn apwa-btn--primary apwa-wel__cta" href="${opts.quoteUrl}">Get a quote</a>`
          : html`<a class="apwa-btn apwa-btn--primary apwa-wel__cta" href="${router.href(ITEMS[p.next].path)}" data-guide-item="${p.next}" data-win-go>Next: ${ITEMS[p.next].label.charAt(0).toLowerCase() + ITEMS[p.next].label.slice(1)}</a>`}
        <button type="button" class="apwa-wel__link" data-win-close>Keep exploring</button>
      </div>
    </div>`);
  winOpen = o;
  o.dismiss = () => { winOpen = null; o.close(); };
  o.wrap.addEventListener('click', (e) => {
    if (e.target.closest('[data-win-close]')) { o.dismiss(); return; }
    if (e.target.closest('a[href]')) { winOpen = null; o.close(() => {}); }
  });
  setTimeout(() => { const b = $('.apwa-wel__cta', o.wrap); if (b) b.focus({ preventScroll: true }); }, 60);
}

/* ---------------- Tours ---------------- */

let tourOn = null;

/** Called by the shell after each screen renders. */
export function onRoute(slug) {
  if (!slug || !TOURS[slug]) return;
  const forced = st.pending === slug;
  if (!forced && st.tours[slug]) return;
  if (st.pending === slug) { st.pending = null; save(); }
  const force = forced && st.force;
  st.force = false;
  setTimeout(() => {
    if (document.querySelector('.apwa-panel, .apwa-lp, .apwa-wel, .apwa-win')) return;
    if (router.path().split('/')[0] !== slug) return;
    tour(slug, force);
  }, 450);
}

function visible(n) {
  if (!n) return false;
  const r = n.getBoundingClientRect();
  return r.width > 0 && r.height > 0;
}

function target(sel) {
  if (sel === PRIMARY) {
    const fab = document.querySelector('.apwa-fab');
    if (fab && !fab.hidden && visible(fab)) return fab;
    return $$('.apwa-content [data-page-action].apwa-btn--primary').find(visible) || null;
  }
  return $$(sel).find(visible) || null;
}

function tour(slug, force) {
  if (tourOn) tourOn();
  const steps = TOURS[slug].map((s) => ({ ...s, node: target(s.sel) })).filter((s) => s.node);
  if (!steps.length) return;
  if (!force && st.tours[slug]) return;
  let i = 0;
  const wrap = el(html`<div class="apwa-tour" role="dialog" aria-modal="true" aria-labelledby="apwa-tour-t">
    <div class="apwa-tour__shield"></div>
    <div class="apwa-tour__spot" aria-hidden="true"></div>
    <div class="apwa-tour__tip"><span class="apwa-tour__arrow" aria-hidden="true"></span><div data-tour-body></div></div>
  </div>`);
  overlayRoot().appendChild(wrap);
  const spot = $('.apwa-tour__spot', wrap);
  const tip = $('.apwa-tour__tip', wrap);
  const arrow = $('.apwa-tour__arrow', wrap);
  const bodyEl = $('[data-tour-body]', wrap);

  const place = () => {
    const s = steps[i];
    if (!s.node.isConnected) return;
    const r = s.node.getBoundingClientRect();
    const pad = 6;
    Object.assign(spot.style, { left: `${r.left - pad}px`, top: `${r.top - pad}px`, width: `${r.width + pad * 2}px`, height: `${r.height + pad * 2}px` });
    const W = window.innerWidth;
    const H = window.innerHeight;
    const w = Math.min(360, W - 32);
    tip.style.width = `${w}px`;
    const th = tip.offsetHeight;
    const cx = r.left + r.width / 2;
    const left = Math.max(16, Math.min(W - 16 - w, cx - w / 2));
    let top = r.bottom + pad + 14;
    let side = 'top';
    if (top + th > H - 12) { top = r.top - pad - 14 - th; side = 'bottom'; }
    if (top < 12) { top = H - th - 12; side = 'none'; }
    tip.style.left = `${left}px`;
    tip.style.top = `${top}px`;
    arrow.dataset.side = side;
    arrow.style.left = `${Math.max(18, Math.min(w - 34, cx - left - 8))}px`;
  };

  const show = () => {
    const s = steps[i];
    const last = i === steps.length - 1;
    bodyEl.innerHTML = html`
      <div class="apwa-tour__head"><span>Step ${i + 1} of ${steps.length}</span><button type="button" class="apwa-tour__skip" data-tour-skip>Skip tour</button></div>
      <h2 class="apwa-tour__title" id="apwa-tour-t">${s.title}</h2>
      <p class="apwa-tour__text">${s.text}</p>
      <div class="apwa-tour__foot">
        <span class="apwa-tour__dots" aria-hidden="true">${steps.map((x, k) => html`<span class="${k === i ? 'is-on' : ''}"></span>`)}</span>
        <span class="apwa-tour__btns">
          ${i > 0 ? html`<button type="button" class="apwa-btn apwa-btn--secondary apwa-btn--sm" data-tour-back>Back</button>` : ''}
          <button type="button" class="apwa-btn apwa-btn--primary apwa-btn--sm" data-tour-next>${last ? (s.cta || 'Got it') : 'Next'}</button>
        </span>
      </div>`;
    const fixed = getComputedStyle(s.node).position === 'fixed';
    if (!fixed) s.node.scrollIntoView({ block: 'center', inline: 'nearest' });
    place();
    requestAnimationFrame(place);
    $('[data-tour-next]', bodyEl).focus({ preventScroll: true });
  };

  let raf = 0;
  const onMove = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(place); };
  const end = (andClick) => {
    tourOn = null;
    st.tours[slug] = true;
    save();
    window.removeEventListener('resize', onMove);
    window.removeEventListener('scroll', onMove, true);
    document.removeEventListener('keydown', onKey, true);
    const node = steps[i].node;
    wrap.classList.remove('is-open');
    setTimeout(() => wrap.remove(), 180);
    if (andClick && node.isConnected) node.click();
  };
  const onKey = (e) => {
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); end(false); return; }
    if (e.key !== 'Tab') return;
    const f = $$('button', tip);
    if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
  };
  wrap.addEventListener('click', (e) => {
    if (e.target.closest('[data-tour-skip]')) { end(false); return; }
    if (e.target.closest('[data-tour-back]')) { i -= 1; show(); return; }
    if (e.target.closest('[data-tour-next]')) {
      if (i === steps.length - 1) end(!!steps[i].cta);
      else { i += 1; show(); }
    }
  });
  window.addEventListener('resize', onMove);
  window.addEventListener('scroll', onMove, true);
  document.addEventListener('keydown', onKey, true);
  tourOn = () => end(false);
  show();
  requestAnimationFrame(() => wrap.classList.add('is-open'));
}
