/**
 * Small DOM and formatting helpers shared by every module.
 */

const CONFIG = window.APWA_CONFIG || {};

/** Escape text for safe use inside HTML strings. */
export function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

class RawHTML {
  constructor(s) { this.s = s; }
  toString() { return this.s; }
}

/** Mark a string as already-safe HTML. */
export function raw(s) { return new RawHTML(String(s ?? '')); }

function toHtml(v) {
  if (v == null || v === false) return '';
  if (v instanceof RawHTML) return v.s;
  if (Array.isArray(v)) return v.map(toHtml).join('');
  return esc(v);
}

/**
 * Tagged template that escapes every interpolation unless it is raw() or
 * another html`` result. Arrays are joined.
 */
export function html(strings, ...values) {
  let out = '';
  strings.forEach((s, i) => {
    out += s;
    if (i < values.length) out += toHtml(values[i]);
  });
  return new RawHTML(out);
}

/** Build one element from markup. */
export function el(markup) {
  const t = document.createElement('template');
  t.innerHTML = String(markup).trim();
  return t.content.firstElementChild;
}

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/** Delegated event listener. Returns an unsubscribe function. */
export function on(root, type, selector, handler, opts) {
  const fn = (e) => {
    const target = e.target.closest(selector);
    if (target && root.contains(target)) handler(e, target);
  };
  root.addEventListener(type, fn, opts);
  return () => root.removeEventListener(type, fn, opts);
}

/** SVG icon markup from the shared icon set (assets/icons/icons.json). */
export function icon(name, cls = '') {
  const icons = CONFIG.icons || {};
  const inner = icons[name] || icons.grid || '';
  return raw(`<svg class="apwa-icon ${esc(cls)}" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${inner}</svg>`);
}

export function uid(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

export function debounce(fn, ms = 150) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

const money0 = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

export function money(n) { return money0.format(Number(n) || 0); }

export function moneyShort(n) {
  const v = Number(n) || 0;
  if (Math.abs(v) >= 1e6) return `$${(v / 1e6).toFixed(v >= 1e7 ? 0 : 1)}M`;
  if (Math.abs(v) >= 1e3) return `$${(v / 1e3).toFixed(v >= 1e5 ? 0 : 1)}k`;
  return money(v);
}

export function num(n) { return new Intl.NumberFormat('en-US').format(Number(n) || 0); }

export function pct(n) { return `${Math.round((Number(n) || 0) * 100)}%`; }

const dShort = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });
const dLong = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const tShort = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' });

export function date(iso, long = false) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return (long || !sameYear ? dLong : dShort).format(d);
}

export function dateTime(iso) {
  if (!iso) return '—';
  return `${date(iso)}, ${tShort.format(new Date(iso))}`;
}

/** "3 hours ago", "Yesterday", "in 4 days". */
export function ago(iso) {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const future = diff < 0;
  const s = Math.abs(diff) / 1000;
  const fmt = (n, unit) => (future ? `in ${n} ${unit}${n === 1 ? '' : 's'}` : `${n} ${unit}${n === 1 ? '' : 's'} ago`);
  if (s < 60) return future ? 'Soon' : 'Just now';
  if (s < 3600) return fmt(Math.floor(s / 60), 'min');
  if (s < 86400) return fmt(Math.floor(s / 3600), 'hour');
  const days = Math.floor(s / 86400);
  if (days === 1) return future ? 'Tomorrow' : 'Yesterday';
  if (days < 30) return fmt(days, 'day');
  return date(iso);
}

/** yyyy-mm-dd for <input type=date>. */
export function isoDay(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Local noon of a yyyy-mm-dd string, as ISO. */
export function fromDay(day) {
  if (!day) return null;
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y, m - 1, d, 12).toISOString();
}

export function initials(name) {
  return String(name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('') || '?';
}

const TONES = ['blue', 'green', 'purple', 'amber', 'teal', 'pink', 'navy'];
export function toneFor(key) {
  let h = 0;
  for (const c of String(key)) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return TONES[h % TONES.length];
}

/** Matches the CSS breakpoint for the phone layout. */
export const mqPhone = window.matchMedia('(max-width: 767.98px)');
export const isPhone = () => mqPhone.matches;

/** "1 deal", "3 deals". */
export function plural(n, one, many = `${one}s`) {
  return `${num(n)} ${Number(n) === 1 ? one : many}`;
}
