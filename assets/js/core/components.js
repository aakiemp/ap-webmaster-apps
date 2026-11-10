/**
 * Reusable building blocks. Each returns html`` markup (or wires behaviour
 * onto an element) so every app looks and behaves the same.
 */
import { html, raw, esc, icon, initials, toneFor, money, moneyShort, ago, dateTime, on } from './dom.js';
import * as store from './store.js';

/* ---------- Badges, avatars ---------- */

export function badge(text, tone = 'gray', opts = {}) {
  return html`<span class="apwa-badge apwa-badge--${tone}">${opts.dot ? html`<i class="apwa-badge__dot"></i>` : ''}${text}</span>`;
}

export function avatar(name, opts = {}) {
  const size = opts.size || 'md';
  const tone = opts.tone || toneFor(name);
  return html`<span class="apwa-avatar apwa-avatar--${size} apwa-tone--${tone}" ${opts.title ? raw(`title="${esc(name)}"`) : ''} aria-hidden="${opts.title ? 'false' : 'true'}">${initials(name)}</span>`;
}

export function userAvatar(userId, size = 'sm') {
  const u = store.user(userId);
  return u ? avatar(u.name, { size, title: true }) : '';
}

export const CONTACT_STATUS = {
  lead: { label: 'Lead', tone: 'blue' },
  prospect: { label: 'Prospect', tone: 'purple' },
  customer: { label: 'Customer', tone: 'green' },
  inactive: { label: 'Inactive', tone: 'gray' },
};

export const DEAL_STATUS = {
  open: { label: 'Open', tone: 'blue' },
  won: { label: 'Won', tone: 'green' },
  lost: { label: 'Lost', tone: 'red' },
};

export function contactStatus(s) {
  const m = CONTACT_STATUS[s] || CONTACT_STATUS.lead;
  return badge(m.label, m.tone, { dot: true });
}

export function dealStatus(s) {
  const m = DEAL_STATUS[s] || DEAL_STATUS.open;
  return badge(m.label, m.tone);
}

/* ---------- Buttons ---------- */

export function button(label, opts = {}) {
  const kind = opts.kind || 'secondary';
  const attrs = Object.entries(opts.attrs || {}).map(([k, v]) => `${k}="${esc(v)}"`).join(' ');
  if (opts.href) {
    return html`<a class="apwa-btn apwa-btn--${kind} ${opts.size ? `apwa-btn--${opts.size}` : ''} ${opts.className || ''}" href="${opts.href}" ${raw(attrs)}>${opts.icon ? icon(opts.icon) : ''}<span>${label}</span></a>`;
  }
  return html`<button type="${opts.type || 'button'}" class="apwa-btn apwa-btn--${kind} ${opts.size ? `apwa-btn--${opts.size}` : ''} ${opts.className || ''}" ${raw(attrs)}>${opts.icon ? icon(opts.icon) : ''}<span>${label}</span></button>`;
}

/* ---------- Cards and stats ---------- */

export function card({ title, actions = '', body, flush = false, className = '' }) {
  return html`<section class="apwa-card ${className}">
    ${title ? html`<header class="apwa-card__head"><h3 class="apwa-card__title">${title}</h3><div class="apwa-card__actions">${actions}</div></header>` : ''}
    <div class="apwa-card__body ${flush ? 'apwa-card__body--flush' : ''}">${body}</div>
  </section>`;
}

export function stat({ label, value, sub = '', icon: ic = '', tone = 'blue', trend = null }) {
  return html`<div class="apwa-stat">
    <div class="apwa-stat__top">
      <span class="apwa-stat__label">${label}</span>
      ${ic ? html`<span class="apwa-stat__icon apwa-tone--${tone}">${icon(ic)}</span>` : ''}
    </div>
    <div class="apwa-stat__value">${value}</div>
    <div class="apwa-stat__sub">${trend ? html`<span class="apwa-trend apwa-trend--${trend.dir}">${icon(trend.dir === 'up' ? 'trending-up' : 'activity')}${trend.text}</span>` : ''}${sub}</div>
  </div>`;
}

export function emptyState({ icon: ic = 'inbox', title, text = '', action = '' }) {
  return html`<div class="apwa-empty">
    <div class="apwa-empty__icon">${icon(ic)}</div>
    <div class="apwa-empty__title">${title}</div>
    ${text ? html`<p class="apwa-empty__text">${text}</p>` : ''}
    ${action}
  </div>`;
}

/* ---------- Segmented control and tabs ---------- */

/** options: [{value, label, icon, count}] */
export function segmented(name, options, value, opts = {}) {
  return html`<div class="apwa-seg ${opts.className || ''}" role="radiogroup" aria-label="${opts.label || name}" data-seg="${name}">
    ${options.map((o) => html`<button type="button" role="radio" class="apwa-seg__btn ${o.value === value ? 'is-active' : ''}" aria-checked="${o.value === value}" data-value="${o.value}" ${o.title ? raw(`title="${esc(o.title)}"`) : ''}>
      ${o.icon ? icon(o.icon) : ''}${o.label ? html`<span>${o.label}</span>` : ''}${o.count != null ? html`<span class="apwa-seg__count">${o.count}</span>` : ''}
    </button>`)}
  </div>`;
}

/** Wire segmented controls in root: handlers = {name: fn(value)} */
export function bindSegmented(root, handlers) {
  return on(root, 'click', '[data-seg] .apwa-seg__btn', (e, btn) => {
    const name = btn.closest('[data-seg]').dataset.seg;
    if (handlers[name]) handlers[name](btn.dataset.value);
  });
}

/* ---------- Form fields ---------- */

/**
 * field({label, name, type, value, options:[{value,label}], required, placeholder, span:2, hint, attrs})
 */
export function field(f) {
  const id = `f-${f.name}-${Math.random().toString(36).slice(2, 6)}`;
  const req = f.required ? raw('required aria-required="true"') : '';
  const attrs = raw(Object.entries(f.attrs || {}).map(([k, v]) => `${k}="${esc(v)}"`).join(' '));
  let control;
  if (f.type === 'select') {
    control = html`<div class="apwa-select"><select id="${id}" name="${f.name}" ${req} ${attrs}>
      ${f.placeholder ? html`<option value="">${f.placeholder}</option>` : ''}
      ${(f.options || []).map((o) => html`<option value="${o.value}" ${String(o.value) === String(f.value ?? '') ? raw('selected') : ''}>${o.label}</option>`)}
    </select>${icon('chevron-down')}</div>`;
  } else if (f.type === 'textarea') {
    control = html`<textarea id="${id}" name="${f.name}" rows="${f.rows || 3}" placeholder="${f.placeholder || ''}" ${req} ${attrs}>${f.value || ''}</textarea>`;
  } else if (f.type === 'money') {
    control = html`<div class="apwa-input-affix"><span>$</span><input id="${id}" name="${f.name}" type="number" inputmode="decimal" min="0" step="50" value="${f.value ?? ''}" placeholder="${f.placeholder || '0'}" ${req} ${attrs}></div>`;
  } else {
    control = html`<input id="${id}" name="${f.name}" type="${f.type || 'text'}" value="${f.value ?? ''}" placeholder="${f.placeholder || ''}" ${req} ${attrs}>`;
  }
  return html`<div class="apwa-field ${f.span === 2 ? 'apwa-field--wide' : ''}">
    <label for="${id}">${f.label}${f.required ? html`<span class="apwa-req" aria-hidden="true">*</span>` : ''}</label>
    ${control}
    ${f.hint ? html`<div class="apwa-field__hint">${f.hint}</div>` : ''}
  </div>`;
}

export function formGrid(fields) {
  return html`<div class="apwa-formgrid">${fields.map(field)}</div>`;
}

/* ---------- Data table (cards on phones) ---------- */

/**
 * columns: [{key, label, render(row), sortable, align, className, hideOn:'tablet'}]
 * opts: {rows, sort:{key,dir}, rowLink(row) => href, mobile(row) => html, empty}
 */
export function dataTable(columns, rows, opts = {}) {
  if (!rows.length) return opts.empty || emptyState({ title: 'Nothing here yet' });
  const sort = opts.sort || {};
  const head = columns.map((c) => {
    const active = sort.key === c.key;
    const aria = active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none';
    const inner = c.sortable
      ? html`<button type="button" class="apwa-th-sort ${active ? 'is-active' : ''}" data-sort="${c.key}">${c.label}${icon(active && sort.dir === 'asc' ? 'chevron-up' : 'chevron-down')}</button>`
      : c.label;
    return html`<th scope="col" class="${c.align === 'right' ? 'is-right' : ''} ${c.hideOn ? `apwa-hide-${c.hideOn}` : ''} ${c.className || ''}" ${c.sortable ? raw(`aria-sort="${aria}"`) : ''}>${inner}</th>`;
  });
  const body = rows.map((r) => html`<tr ${opts.rowLink ? raw(`data-href="${esc(opts.rowLink(r))}" tabindex="0"`) : ''}>
    ${columns.map((c) => html`<td class="${c.align === 'right' ? 'is-right' : ''} ${c.hideOn ? `apwa-hide-${c.hideOn}` : ''} ${c.className || ''}">${c.render ? c.render(r) : r[c.key]}</td>`)}
  </tr>`);
  const mobile = opts.mobile
    ? html`<ul class="apwa-list apwa-show-phone" role="list">${rows.map((r) => html`<li>${opts.rowLink ? html`<a class="apwa-list__item" href="${opts.rowLink(r)}">${opts.mobile(r)}${icon('chevron-right', 'apwa-list__chev')}</a>` : html`<div class="apwa-list__item">${opts.mobile(r)}</div>`}</li>`)}</ul>`
    : '';
  return html`<div class="apwa-tablewrap ${opts.mobile ? 'apwa-hide-phone' : ''}"><table class="apwa-table ${opts.rowLink ? 'is-clickable' : ''}">
    <thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>${mobile}`;
}

/** Sort helper used with dataTable. */
export function sortRows(rows, sort, getters = {}) {
  if (!sort || !sort.key) return rows;
  const get = getters[sort.key] || ((r) => r[sort.key]);
  const dir = sort.dir === 'asc' ? 1 : -1;
  return [...rows].sort((a, b) => {
    const x = get(a);
    const y = get(b);
    if (x == null && y == null) return 0;
    if (x == null) return 1;
    if (y == null) return -1;
    return (typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y))) * dir;
  });
}

/* ---------- Activity timeline ---------- */

const ACTIVITY = {
  note: { icon: 'note', tone: 'amber', label: 'Note' },
  call: { icon: 'phone', tone: 'green', label: 'Call' },
  email: { icon: 'mail', tone: 'blue', label: 'Email' },
  meeting: { icon: 'calendar', tone: 'purple', label: 'Meeting' },
  created: { icon: 'user-plus', tone: 'gray', label: 'Created' },
  deal: { icon: 'briefcase', tone: 'teal', label: 'Opportunity' },
  stage: { icon: 'move', tone: 'teal', label: 'Stage change' },
  won: { icon: 'award', tone: 'green', label: 'Won' },
  lost: { icon: 'x-circle', tone: 'red', label: 'Lost' },
  update: { icon: 'edit', tone: 'gray', label: 'Updated' },
};
export const ACTIVITY_TYPES = ACTIVITY;

export function timeline(items, opts = {}) {
  if (!items.length) return emptyState({ icon: 'activity', title: 'No activity yet', text: opts.emptyText || 'Calls, notes and emails you log will show up here.' });
  return html`<ol class="apwa-timeline">${items.map((a) => {
    const m = ACTIVITY[a.type] || ACTIVITY.note;
    const u = store.user(a.userId);
    const c = opts.showContact && a.contactId ? store.contact(a.contactId) : null;
    return html`<li class="apwa-timeline__item">
      <span class="apwa-timeline__icon apwa-tone--${m.tone}">${icon(m.icon)}</span>
      <div class="apwa-timeline__body">
        <div class="apwa-timeline__text">${a.text}</div>
        <div class="apwa-timeline__meta">
          ${c && opts.contactLink ? html`<a href="${opts.contactLink(c)}">${store.contactName(c)}</a><span aria-hidden="true">·</span>` : ''}
          <span>${m.label}</span><span aria-hidden="true">·</span>
          <span>${u ? u.name : 'System'}</span><span aria-hidden="true">·</span>
          <time datetime="${a.at}" title="${dateTime(a.at)}">${ago(a.at)}</time>
          ${a.simulated ? html`<span class="apwa-badge apwa-badge--gray apwa-badge--xs">Simulated</span>` : ''}
        </div>
      </div>
    </li>`;
  })}</ol>`;
}

/* ---------- Charts (dependency-free) ---------- */

/** Horizontal bars. items: [{label, value, sub, tone}] */
export function barList(items, opts = {}) {
  const max = Math.max(1, ...items.map((i) => i.value));
  const fmt = opts.format || moneyShort;
  return html`<ul class="apwa-bars" role="list">${items.map((i) => html`<li class="apwa-bars__row">
    <div class="apwa-bars__label"><span>${i.label}</span>${i.sub ? html`<span class="apwa-bars__sub">${i.sub}</span>` : ''}</div>
    <div class="apwa-bars__track" role="img" aria-label="${i.label}: ${fmt(i.value)}"><div class="apwa-bars__fill apwa-fill--${i.tone || 'blue'}" style="width:${Math.max(i.value ? 2 : 0, (i.value / max) * 100).toFixed(1)}%"></div></div>
    <div class="apwa-bars__value">${fmt(i.value)}</div>
  </li>`)}</ul>`;
}

/** Vertical columns. items: [{label, value}] */
export function columnChart(items, opts = {}) {
  const max = Math.max(1, ...items.map((i) => i.value));
  const fmt = opts.format || moneyShort;
  return html`<div class="apwa-cols" role="img" aria-label="${opts.label || 'Chart'}">
    ${items.map((i) => html`<div class="apwa-cols__col">
      <div class="apwa-cols__value">${i.value ? fmt(i.value) : ''}</div>
      <div class="apwa-cols__bar-wrap"><div class="apwa-cols__bar ${i.highlight ? 'is-highlight' : ''}" style="height:${((i.value / max) * 100).toFixed(1)}%"></div></div>
      <div class="apwa-cols__label">${i.label}</div>
    </div>`)}
  </div>`;
}

/** Thin progress meter. */
export function meter(value, tone = 'blue') {
  const v = Math.max(0, Math.min(1, value || 0));
  return html`<span class="apwa-meter" role="meter" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(v * 100)}"><span class="apwa-fill--${tone}" style="width:${(v * 100).toFixed(0)}%"></span></span>`;
}

export { money, moneyShort };
