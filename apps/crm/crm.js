/**
 * CRM & Sales Pipeline demo.
 * Screens: Contacts, Contact detail, Pipeline (board + list), Reports.
 * All records live in the shared demo store, so later apps (Smart Follow-Ups,
 * Booking Manager) can reuse the same contacts and opportunities.
 */
import { html, raw, el, esc, icon, on, $, $$, debounce, money, moneyShort, pct, num, plural, date, dateTime, ago, isoDay, fromDay, isPhone } from '../../assets/js/core/dom.js';
import * as store from '../../assets/js/core/store.js';
import * as ind from '../../assets/js/core/industry.js';
import * as router from '../../assets/js/core/router.js';
import * as metrics from '../../assets/js/core/metrics.js';
import { undoToast, openPanel, toast, simulated, confirmDialog, menu, formData, validate } from '../../assets/js/core/ui.js';
import {
  badge, avatar, userAvatar, contactStatus, dealStatus, CONTACT_STATUS, DEAL_STATUS, button, card, stat,
  emptyState, segmented, bindSegmented, field, formGrid, dataTable, sortRows, timeline, barList, columnChart, meter,
} from '../../assets/js/core/components.js';
import { kanban } from '../../assets/js/core/kanban.js';

/* ------------------------------------------------------------------ */
/* View state that survives re-renders                                  */
/* ------------------------------------------------------------------ */

const contactsUI = { q: '', status: 'all', owner: 'all', sort: { key: 'lastActivityAt', dir: 'desc' } };
const pipeUI = { q: '', owner: 'all', status: 'open', view: 'board', phoneCol: 'new', sort: { key: 'value', dir: 'desc' } };
const detailUI = { tab: 'activity', type: 'note' };

const href = (p) => router.href(p);
const contactHref = (c) => href(`crm/contacts/${c.id}`);
const name = (c) => store.contactName(c);

function ownerOptions() {
  return store.all('users').map((u) => ({ value: u.id, label: u.name }));
}
function stageOptions() {
  return metrics.stages().map((s) => ({ value: s.id, label: s.name }));
}
function sourceOptions() {
  return store.get().sources.map((s) => ({ value: s, label: s }));
}

function openDealsFor(contactId) {
  return store.all('deals').filter((d) => d.contactId === contactId && d.status === 'open');
}

/* ------------------------------------------------------------------ */
/* Forms                                                                */
/* ------------------------------------------------------------------ */

function openContactForm(existing = null, after = null) {
  const c = existing || { status: 'lead', ownerId: store.get().currentUserId, source: 'Website', state: 'OH' };
  const body = formGrid([
    { label: 'First name', name: 'firstName', value: c.firstName, required: true, attrs: { autocomplete: 'off' } },
    { label: 'Last name', name: 'lastName', value: c.lastName, attrs: { autocomplete: 'off' } },
    { label: 'Email', name: 'email', type: 'email', value: c.email, placeholder: 'name@example.com', attrs: { autocomplete: 'off', inputmode: 'email' } },
    { label: 'Phone', name: 'phone', type: 'tel', value: c.phone, placeholder: '(555) 555-0100', attrs: { autocomplete: 'off', inputmode: 'tel' } },
    { label: 'Company', name: 'company', value: c.company, placeholder: 'Optional' },
    { label: 'Job title', name: 'title', value: c.title, placeholder: 'Optional' },
    { label: 'Status', name: 'status', type: 'select', value: c.status, options: Object.entries(CONTACT_STATUS).map(([v, m]) => ({ value: v, label: m.label })) },
    { label: 'Owner', name: 'ownerId', type: 'select', value: c.ownerId, options: ownerOptions() },
    { label: 'Lead source', name: 'source', type: 'select', value: c.source, options: sourceOptions() },
    { label: 'City', name: 'city', value: c.city, placeholder: 'e.g. Lakewood' },
    { label: 'Tags', name: 'tags', value: (c.tags || []).join(', '), placeholder: 'Comma separated, e.g. VIP, Commercial', span: 2 },
  ]);
  openPanel({
    title: existing ? 'Edit contact' : 'New contact',
    subtitle: existing ? '' : 'Use made-up details. This demo stores data in your browser only.',
    body: `${body}`,
    size: 'lg',
    buttons: [
      { label: 'Cancel', kind: 'secondary' },
      { label: existing ? 'Save changes' : 'Create contact', kind: 'primary', type: 'submit' },
    ],
    onSubmit(form) {
      const ok = validate(form, {
        firstName: 'Enter a first name.',
        email: (v) => (v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? 'Enter a valid email address, or leave it blank.' : ''),
      });
      if (!ok) return false;
      const d = formData(form);
      const data = { ...d, tags: d.tags ? d.tags.split(',').map((t) => t.trim()).filter(Boolean).slice(0, 6) : [] };
      if (existing) {
        store.patch('contacts', existing.id, data);
        store.logActivity({ type: 'update', contactId: existing.id, text: 'Contact details updated' });
        toast(`${data.firstName} ${data.lastName} was updated.`, { title: 'Contact saved' });
        if (after) after(existing);
      } else {
        const row = store.insert('contacts', { ...data, state: 'OH', lastActivityAt: new Date().toISOString() });
        store.logActivity({ type: 'created', contactId: row.id, text: 'Contact created manually' });
        toast(`${data.firstName} ${data.lastName} was added to your contacts.`, { title: 'Contact created' });
        if (after) after(row); else router.go(`crm/contacts/${row.id}`);
      }
      return true;
    },
  });
}

function openDealForm(existing = null, preset = {}) {
  const d = existing || { stageId: preset.stageId || 'new', ownerId: store.get().currentUserId, source: 'Website', contactId: preset.contactId || '', expectedClose: new Date(Date.now() + 30 * 864e5).toISOString() };
  const contacts = store.all('contacts').slice().sort((a, b) => name(a).localeCompare(name(b)));
  const body = formGrid([
    { label: 'Opportunity name', name: 'name', value: d.name, required: true, placeholder: 'e.g. Kitchen remodel', span: 2 },
    { label: 'Contact', name: 'contactId', type: 'select', value: d.contactId, required: true, placeholder: 'Choose a contact', options: contacts.map((c) => ({ value: c.id, label: c.company ? `${name(c)} (${c.company})` : name(c) })) },
    { label: 'Value', name: 'value', type: 'money', value: d.value, required: true },
    { label: 'Stage', name: 'stageId', type: 'select', value: d.stageId, options: stageOptions() },
    { label: 'Owner', name: 'ownerId', type: 'select', value: d.ownerId, options: ownerOptions() },
    { label: 'Expected close', name: 'expectedClose', type: 'date', value: isoDay(d.expectedClose) },
    { label: 'Source', name: 'source', type: 'select', value: d.source, options: sourceOptions() },
  ]);
  openPanel({
    title: existing ? 'Edit opportunity' : 'New opportunity',
    body: `${body}`,
    size: 'lg',
    buttons: [
      { label: 'Cancel', kind: 'secondary' },
      { label: existing ? 'Save changes' : 'Create opportunity', kind: 'primary', type: 'submit' },
    ],
    onSubmit(form) {
      const ok = validate(form, {
        name: 'Give the opportunity a name.',
        contactId: 'Choose who this opportunity is for.',
        value: (v) => (v === '' || Number(v) < 0 || Number.isNaN(Number(v)) ? 'Enter a value of $0 or more.' : ''),
      });
      if (!ok) return false;
      const f = formData(form);
      const data = { ...f, value: Math.round(Number(f.value)), expectedClose: fromDay(f.expectedClose) };
      if (existing) {
        const stageChanged = existing.stageId !== data.stageId;
        store.patch('deals', existing.id, data);
        store.logActivity({ type: stageChanged ? 'stage' : 'update', contactId: data.contactId, dealId: existing.id, text: stageChanged ? `${data.name} moved to ${metrics.stageName(data.stageId)}` : `Opportunity updated: ${data.name}` });
        toast(`${data.name} was updated.`, { title: 'Opportunity saved' });
      } else {
        const row = store.insert('deals', { ...data, status: 'open', closedAt: null, lostReason: '' });
        store.logActivity({ type: 'deal', contactId: data.contactId, dealId: row.id, text: `Opportunity created: ${data.name}` });
        const c = store.contact(data.contactId);
        if (c && c.status === 'lead') store.patch('contacts', c.id, { status: 'prospect' });
        toast(`${data.name} (${money(data.value)}) was added to ${metrics.stageName(data.stageId)}.`, { title: 'Opportunity created' });
      }
      return true;
    },
  });
}

/* ------------------------------------------------------------------ */
/* Deal actions                                                          */
/* ------------------------------------------------------------------ */

function moveDeal(id, stageId) {
  const d = store.find('deals', id);
  if (!d || d.stageId === stageId) return;
  store.patch('deals', id, { stageId });
  store.logActivity({ type: 'stage', contactId: d.contactId, dealId: id, text: `${d.name} moved to ${metrics.stageName(stageId)}` });
  toast(`${d.name} moved to ${metrics.stageName(stageId)}.`, { title: 'Stage updated', timeout: 2600 });
}

function markWon(d) {
  store.patch('deals', d.id, { status: 'won', closedAt: new Date().toISOString(), lostReason: '' });
  store.logActivity({ type: 'won', contactId: d.contactId, dealId: d.id, text: `Deal won: ${d.name}` });
  const c = store.contact(d.contactId);
  if (c && c.status !== 'customer') store.patch('contacts', c.id, { status: 'customer' });
  toast(`${d.name} closed for ${money(d.value)}.`, { title: 'Deal won' });
}

function markLost(d, done) {
  const reasons = [`Went with another ${ind.type().word}`, 'Price too high', 'Postponed the project', 'No response', 'Other'];
  openPanel({
    title: 'Mark as lost',
    subtitle: d.name,
    size: 'sm',
    body: `${formGrid([{ label: 'Reason', name: 'reason', type: 'select', value: reasons[0], options: reasons.map((r) => ({ value: r, label: r })), span: 2 }])}`,
    buttons: [{ label: 'Cancel', kind: 'secondary' }, { label: 'Mark lost', kind: 'danger', type: 'submit' }],
    onSubmit(form) {
      const reason = formData(form).reason;
      store.patch('deals', d.id, { status: 'lost', closedAt: new Date().toISOString(), lostReason: reason });
      store.logActivity({ type: 'lost', contactId: d.contactId, dealId: d.id, text: `Deal lost: ${d.name} (${reason})` });
      toast(`${d.name} was marked lost.`, { title: 'Deal updated', tone: 'info' });
      if (done) done();
      return true;
    },
  });
}

function reopen(d) {
  store.patch('deals', d.id, { status: 'open', closedAt: null, lostReason: '' });
  store.logActivity({ type: 'update', contactId: d.contactId, dealId: d.id, text: `Deal reopened: ${d.name}` });
  toast(`${d.name} is open again.`, { title: 'Deal reopened' });
}

async function deleteDeal(d, done) {
  const ok = await confirmDialog({ title: 'Delete opportunity?', message: `${d.name} and its value will be removed from the pipeline.`, confirmLabel: 'Delete', tone: 'danger' });
  if (!ok) return;
  const snap = store.snapshot(['deals']);
  store.remove('deals', d.id);
  undoToast(`${d.name} was deleted.`, 'Opportunity deleted', snap);
  if (done) done();
}

/** Deal detail: side drawer on desktop, bottom sheet on phones. */
function openDeal(id) {
  const d0 = store.find('deals', id);
  if (!d0) return;
  let api = null;
  const render = () => {
    const d = store.find('deals', id);
    if (!d) { api.close(); return ''; }
    const c = store.contact(d.contactId);
    const st = metrics.stages();
    const idx = st.findIndex((s) => s.id === d.stageId);
    const acts = store.all('activities').filter((a) => a.dealId === d.id).sort((a, b) => (a.at < b.at ? 1 : -1));
    const overdue = d.status === 'open' && d.expectedClose && new Date(d.expectedClose) < new Date();
    return html`
      <div class="crm-deal">
        <div class="crm-deal__top">
          <div class="crm-deal__value">${money(d.value)}</div>
          ${dealStatus(d.status)}
          ${d.status === 'open' ? badge(`${Math.round((st[idx]?.probability || 0) * 100)}% likely`, 'gray') : ''}
        </div>
        <ol class="crm-stepper ${d.status !== 'open' ? 'is-closed' : ''}" aria-label="Pipeline stage">
          ${st.map((s, i) => html`<li><button type="button" class="crm-stepper__step ${i < idx ? 'is-done' : ''} ${i === idx ? 'is-current' : ''}" data-stage="${s.id}" ${d.status !== 'open' ? raw('disabled') : ''} aria-current="${i === idx ? 'step' : 'false'}" title="Move to ${s.name}">
            <span class="crm-stepper__bar"></span><span class="crm-stepper__label">${s.name}</span></button></li>`)}
        </ol>
        <div class="crm-deal__actions">
          ${d.status === 'open'
            ? html`${button('Mark won', { kind: 'success', icon: 'award', attrs: { 'data-deal-act': 'won' } })}
                   ${button('Mark lost', { kind: 'secondary', icon: 'x-circle', attrs: { 'data-deal-act': 'lost' } })}
                   ${idx < st.length - 1 ? button(`Move to ${st[idx + 1].name}`, { kind: 'secondary', icon: 'arrow-right', attrs: { 'data-deal-act': 'next' }, className: 'crm-deal__next' }) : ''}`
            : button('Reopen deal', { kind: 'secondary', icon: 'refresh', attrs: { 'data-deal-act': 'reopen' } })}
        </div>
        ${d.status === 'lost' && d.lostReason ? html`<div class="apwa-callout apwa-callout--danger"><span class="apwa-callout__icon">${icon('x-circle')}</span><div class="apwa-callout__body"><strong>Lost reason</strong><span>${d.lostReason}</span></div></div>` : ''}
        <dl class="crm-dl">
          <div><dt>Contact</dt><dd>${c ? html`<a href="${contactHref(c)}" data-close-panel>${name(c)}</a>${c.company ? html`<span class="apwa-text-3"> · ${c.company}</span>` : ''}` : '—'}</dd></div>
          <div><dt>Owner</dt><dd class="crm-dl__user">${userAvatar(d.ownerId, 'xs')}${store.user(d.ownerId)?.name || '—'}</dd></div>
          <div><dt>Expected close</dt><dd class="${overdue ? 'apwa-text-danger' : ''}">${date(d.expectedClose, true)}${overdue ? ' (overdue)' : ''}</dd></div>
          <div><dt>${d.status === 'open' ? 'Created' : 'Closed'}</dt><dd>${date(d.status === 'open' ? d.createdAt : d.closedAt, true)}</dd></div>
          <div><dt>Source</dt><dd>${d.source || '—'}</dd></div>
          <div><dt>Stage</dt><dd>${metrics.stageName(d.stageId)}</dd></div>
        </dl>
        <form class="crm-quicknote" data-quicknote>
          <label class="apwa-sr" for="crm-qn-${d.id}">Add a note</label>
          <input id="crm-qn-${d.id}" name="note" type="text" placeholder="Add a note to this deal…" autocomplete="off">
          <button type="submit" class="apwa-btn apwa-btn--secondary apwa-btn--sm">${icon('note')}<span>Add note</span></button>
        </form>
        <h3 class="crm-subhead">Activity</h3>
        ${timeline(acts, { emptyText: 'Notes and stage changes for this deal will appear here.' })}
      </div>`;
  };

  api = openPanel({
    title: d0.name,
    variant: 'drawer',
    size: 'md',
    body: `${render()}`,
    headActions: html`<button type="button" class="apwa-iconbtn" data-deal-menu aria-label="More actions" aria-haspopup="menu">${icon('more')}</button>`,
  });
  const refresh = () => {
    const d = store.find('deals', id);
    if (!d) { api.close(); return; }
    api.panel.querySelector('.apwa-panel__title').textContent = d.name;
    api.body.innerHTML = `${render()}`;
  };
  const unsub = store.subscribe(refresh);
  const origClose = api.close;
  api.close = () => { unsub(); origClose(); };

  api.panel.addEventListener('click', (e) => {
    const d = store.find('deals', id);
    if (!d) return;
    const stageBtn = e.target.closest('[data-stage]');
    if (stageBtn && !stageBtn.disabled) moveDeal(id, stageBtn.dataset.stage);
    const act = e.target.closest('[data-deal-act]');
    if (act) {
      const a = act.dataset.dealAct;
      if (a === 'won') markWon(d);
      if (a === 'lost') markLost(d);
      if (a === 'reopen') reopen(d);
      if (a === 'next') {
        const st = metrics.stages();
        const i = st.findIndex((s) => s.id === d.stageId);
        if (st[i + 1]) moveDeal(id, st[i + 1].id);
      }
    }
    if (e.target.closest('[data-close-panel]')) api.close();
    const more = e.target.closest('[data-deal-menu]');
    if (more) {
      menu(more, [
        { label: 'Edit opportunity', icon: 'edit', onClick: () => openDealForm(d) },
        { label: 'View contact', icon: 'user', onClick: () => { api.close(); router.go(`crm/contacts/${d.contactId}`); } },
        { divider: true },
        { label: 'Delete opportunity', icon: 'trash', tone: 'danger', onClick: () => deleteDeal(d, () => api.close()) },
      ], { title: d.name });
    }
  });
  api.panel.addEventListener('submit', (e) => {
    const f = e.target.closest('[data-quicknote]');
    if (!f) return;
    e.preventDefault();
    const text = f.elements.note.value.trim();
    if (!text) { f.elements.note.focus(); return; }
    const d = store.find('deals', id);
    store.logActivity({ type: 'note', contactId: d.contactId, dealId: d.id, text });
    toast('Note added to the deal.', { title: 'Saved', timeout: 2200 });
  });
}

/* ------------------------------------------------------------------ */
/* Contacts list                                                         */
/* ------------------------------------------------------------------ */

function filteredContacts() {
  const q = contactsUI.q.toLowerCase();
  let rows = store.all('contacts').filter((c) => {
    if (contactsUI.status !== 'all' && c.status !== contactsUI.status) return false;
    if (contactsUI.owner !== 'all' && c.ownerId !== contactsUI.owner) return false;
    if (!q) return true;
    return [name(c), c.email, c.company, c.phone, c.city, ...(c.tags || [])].join(' ').toLowerCase().includes(q);
  });
  rows = sortRows(rows, contactsUI.sort, {
    name: (c) => name(c).toLowerCase(),
    company: (c) => (c.company || '').toLowerCase() || null,
    lastActivityAt: (c) => c.lastActivityAt,
    openValue: (c) => openDealsFor(c.id).reduce((n, d) => n + d.value, 0),
    owner: (c) => store.user(c.ownerId)?.name,
  });
  return rows;
}

function contactsTable() {
  const rows = filteredContacts();
  const cols = [
    { key: 'name', label: 'Name', sortable: true, render: (c) => html`<div class="apwa-cell-person">${avatar(name(c))}<div><a class="apwa-cell-person__name" href="${contactHref(c)}">${name(c)}</a><div class="apwa-cell-sub">${c.email || '—'}</div></div></div>` },
    { key: 'company', label: 'Company', sortable: true, hideOn: 'tablet', render: (c) => c.company ? html`<div>${c.company}</div><div class="apwa-cell-sub">${c.title || ''}</div>` : html`<span class="apwa-text-3">Homeowner</span>` },
    { key: 'status', label: 'Status', render: (c) => contactStatus(c.status) },
    { key: 'phone', label: 'Phone', hideOn: 'tablet', render: (c) => html`<span class="apwa-nowrap">${c.phone || '—'}</span>` },
    { key: 'openValue', label: 'Open deals', sortable: true, align: 'right', render: (c) => { const v = openDealsFor(c.id).reduce((n, d) => n + d.value, 0); return v ? money(v) : html`<span class="apwa-text-3">—</span>`; } },
    { key: 'owner', label: 'Owner', sortable: true, hideOn: 'tablet', render: (c) => html`<span class="apwa-cell-owner">${userAvatar(c.ownerId, 'xs')}<span>${store.user(c.ownerId)?.name.split(' ')[0]}</span></span>` },
    { key: 'lastActivityAt', label: 'Last activity', sortable: true, render: (c) => html`<span class="apwa-nowrap" title="${dateTime(c.lastActivityAt)}">${ago(c.lastActivityAt)}</span>` },
  ];
  const hasFilters = contactsUI.q || contactsUI.status !== 'all' || contactsUI.owner !== 'all';
  return html`
    <div class="apwa-resultbar"><span>${num(rows.length)} ${rows.length === 1 ? 'contact' : 'contacts'}</span>${hasFilters ? html`<button type="button" class="apwa-link" data-clear-filters>Clear filters</button>` : ''}</div>
    ${dataTable(cols, rows, {
      sort: contactsUI.sort,
      rowLink: contactHref,
      mobile: (c) => html`${avatar(name(c))}<div class="apwa-list__main"><strong>${name(c)}</strong><span>${c.company || c.email}</span></div><div class="apwa-list__side">${contactStatus(c.status)}<span>${ago(c.lastActivityAt)}</span></div>`,
      empty: emptyState({ icon: 'users', title: 'No contacts match', text: 'Try a different search or clear the filters.', action: html`<button type="button" class="apwa-btn apwa-btn--secondary" data-clear-filters>Clear filters</button>` }),
    })}`;
}

function exportContactsCsv() {
  const rows = filteredContacts();
  const head = ['First name', 'Last name', 'Email', 'Phone', 'Company', 'Title', 'Status', 'Source', 'Owner', 'City', 'Tags'];
  const q = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines = [head.map(q).join(',')].concat(rows.map((c) => [c.firstName, c.lastName, c.email, c.phone, c.company, c.title, CONTACT_STATUS[c.status]?.label, c.source, store.user(c.ownerId)?.name, c.city, (c.tags || []).join('; ')].map(q).join(',')));
  const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'demo-contacts.csv';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  toast(`${rows.length} sample contacts exported to a CSV file on your device.`, { title: 'Export ready', tone: 'info' });
}

function contactsView(ctx) {
  const all = store.all('contacts');
  const counts = { all: all.length };
  Object.keys(CONTACT_STATUS).forEach((s) => { counts[s] = all.filter((c) => c.status === s).length; });
  if (ctx.query.new) {
    setTimeout(() => { router.go('crm/contacts', { replace: true }); openContactForm(); }, 0);
  }
  return {
    title: 'Contacts',
    subtitle: 'Everyone your business is talking to, in one list.',
    actions: [
      { label: 'Export CSV', icon: 'download', onClick: exportContactsCsv },
      { label: 'New contact', icon: 'user-plus', kind: 'primary', primary: true, fabIcon: 'user-plus', onClick: () => openContactForm() },
    ],
    body: html`<div class="apwa-card apwa-card--table">
      <div class="apwa-toolbar">
        <div class="apwa-input-search">${icon('search')}<input type="search" value="${contactsUI.q}" placeholder="Search name, email, company, tag…" aria-label="Search contacts" data-contacts-q></div>
        ${segmented('status', [{ value: 'all', label: 'All', count: counts.all }, ...Object.entries(CONTACT_STATUS).map(([v, m]) => ({ value: v, label: m.label, count: counts[v] }))], contactsUI.status, { label: 'Filter by status', className: 'apwa-seg--scroll' })}
        <div class="apwa-select apwa-select--sm"><select aria-label="Filter by owner" data-contacts-owner>
          <option value="all">All owners</option>
          ${ownerOptions().map((o) => html`<option value="${o.value}" ${o.value === contactsUI.owner ? raw('selected') : ''}>${o.label}</option>`)}
        </select>${icon('chevron-down')}</div>
      </div>
      <div data-contacts-results>${contactsTable()}</div>
    </div>`,
    mount(root) {
      const results = $('[data-contacts-results]', root);
      const refresh = () => { results.innerHTML = `${contactsTable()}`; };
      $('[data-contacts-q]', root).addEventListener('input', debounce((e) => { contactsUI.q = e.target.value.trim(); refresh(); }, 120));
      $('[data-contacts-owner]', root).addEventListener('change', (e) => { contactsUI.owner = e.target.value; refresh(); });
      bindSegmented(root, { status: (v) => { contactsUI.status = v; ctx.rerender(); } });
      on(root, 'click', '[data-sort]', (e, b) => {
        const k = b.dataset.sort;
        contactsUI.sort = { key: k, dir: contactsUI.sort.key === k && contactsUI.sort.dir === 'desc' ? 'asc' : 'desc' };
        refresh();
      });
      on(root, 'click', '[data-clear-filters]', () => { Object.assign(contactsUI, { q: '', status: 'all', owner: 'all' }); ctx.rerender(); });
      bindRowLinks(root);
    },
  };
}

/** Whole-row click for tables with data-href (links inside rows still work). */
function bindRowLinks(root) {
  on(root, 'click', 'tr[data-href]', (e, tr) => {
    if (e.target.closest('a, button, input, select')) return;
    router.go(tr.dataset.href.replace(router.href(''), ''));
  });
  on(root, 'keydown', 'tr[data-href]', (e, tr) => {
    if (e.key === 'Enter') router.go(tr.dataset.href.replace(router.href(''), ''));
  });
}

/* ------------------------------------------------------------------ */
/* Contact detail                                                        */
/* ------------------------------------------------------------------ */

function contactDetailView(ctx) {
  const c = store.contact(ctx.params.id);
  if (!c) {
    return {
      title: 'Contact not found',
      back: href('crm/contacts'),
      body: emptyState({ icon: 'user', title: 'This contact no longer exists', text: 'It may have been deleted, or the demo was reset.', action: button('Back to contacts', { kind: 'primary', href: href('crm/contacts') }) }),
    };
  }
  const deals = store.all('deals').filter((d) => d.contactId === c.id).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  const acts = store.all('activities').filter((a) => a.contactId === c.id).sort((a, b) => (a.at < b.at ? 1 : -1));
  const openVal = deals.filter((d) => d.status === 'open').reduce((n, d) => n + d.value, 0);
  const wonVal = deals.filter((d) => d.status === 'won').reduce((n, d) => n + d.value, 0);
  const owner = store.user(c.ownerId);
  const types = [
    { value: 'note', label: 'Note', icon: 'note' },
    { value: 'call', label: 'Call', icon: 'phone' },
    { value: 'email', label: 'Email', icon: 'mail' },
    { value: 'meeting', label: 'Meeting', icon: 'calendar' },
  ];
  const placeholder = {
    note: `Add a note about ${c.firstName}…`,
    call: `What did you and ${c.firstName} talk about?`,
    email: `Write an email to ${c.firstName}… (simulated, nothing is sent)`,
    meeting: 'Meeting notes…',
  }[detailUI.type];

  const actionsFor = () => ([
    { label: 'Edit contact', icon: 'edit', onClick: () => openContactForm(c) },
    { label: 'New opportunity', icon: 'briefcase', onClick: () => openDealForm(null, { contactId: c.id }) },
    { divider: true },
    { label: 'Delete contact', icon: 'trash', tone: 'danger', onClick: () => deleteContact(c) },
  ]);

  return {
    title: name(c),
    crumb: { href: href('crm/contacts'), label: 'Contacts' },
    back: href('crm/contacts'),
    hideHead: true,
    actions: [{ label: 'Log activity', icon: 'note', primary: true, kind: 'primary', fabIcon: 'note', onClick: () => { const t = document.querySelector('[data-composer] textarea'); if (t) { t.scrollIntoView({ block: 'center', behavior: 'smooth' }); t.focus({ preventScroll: true }); } } }],
    body: html`<div class="crm-contact">
      <aside class="crm-profile apwa-card">
        <div class="crm-profile__head">
          ${avatar(name(c), { size: 'xl' })}
          <div class="crm-profile__id">
            <h1 class="crm-profile__name">${name(c)}</h1>
            <div class="crm-profile__role">${c.title ? `${c.title}${c.company ? ' at ' : ''}` : ''}${c.company || (c.title ? '' : 'Homeowner')}</div>
            <div class="crm-profile__badges">${contactStatus(c.status)}${(c.tags || []).map((t) => badge(t, 'gray'))}</div>
          </div>
          <button type="button" class="apwa-iconbtn crm-profile__more" data-contact-menu aria-label="More actions" aria-haspopup="menu">${icon('more')}</button>
        </div>
        <div class="crm-profile__quick">
          <button type="button" class="crm-quick" data-quick="call">${icon('phone')}<span>Call</span></button>
          <button type="button" class="crm-quick" data-quick="email">${icon('mail')}<span>Email</span></button>
          <button type="button" class="crm-quick" data-quick="sms">${icon('note')}<span>Text</span></button>
          <button type="button" class="crm-quick" data-quick="deal">${icon('briefcase')}<span>Deal</span></button>
        </div>
        <div class="crm-profile__kpis">
          <div><span>Open deals</span><strong>${money(openVal)}</strong></div>
          <div><span>Won to date</span><strong>${money(wonVal)}</strong></div>
        </div>
        <dl class="crm-dl crm-dl--stack">
          <div><dt>Email</dt><dd>${c.email || '—'}</dd></div>
          <div><dt>Phone</dt><dd>${c.phone || '—'}</dd></div>
          <div><dt>Location</dt><dd>${c.city ? `${c.city}, ${c.state || ''}` : '—'}</dd></div>
          <div><dt>Owner</dt><dd class="crm-dl__user">${userAvatar(c.ownerId, 'xs')}${owner ? owner.name : '—'}</dd></div>
          <div><dt>Lead source</dt><dd>${c.source || '—'}</dd></div>
          <div><dt>Created</dt><dd>${date(c.createdAt, true)}</dd></div>
        </dl>
        <div class="crm-profile__status">
          <label for="crm-status">Change status</label>
          <div class="apwa-select apwa-select--sm"><select id="crm-status" data-contact-status>
            ${Object.entries(CONTACT_STATUS).map(([v, m]) => html`<option value="${v}" ${v === c.status ? raw('selected') : ''}>${m.label}</option>`)}
          </select>${icon('chevron-down')}</div>
        </div>
      </aside>
      <section class="crm-main">
        <div class="apwa-tabs" role="tablist">
          <button type="button" role="tab" class="apwa-tabs__tab ${detailUI.tab === 'activity' ? 'is-active' : ''}" aria-selected="${detailUI.tab === 'activity'}" data-tab="activity">Activity <span class="apwa-tabs__count">${acts.length}</span></button>
          <button type="button" role="tab" class="apwa-tabs__tab ${detailUI.tab === 'deals' ? 'is-active' : ''}" aria-selected="${detailUI.tab === 'deals'}" data-tab="deals">Opportunities <span class="apwa-tabs__count">${deals.length}</span></button>
        </div>
        ${detailUI.tab === 'activity' ? html`
          <form class="apwa-card crm-composer" data-composer>
            ${segmented('acttype', types, detailUI.type, { label: 'Activity type', className: 'apwa-seg--sm' })}
            <label class="apwa-sr" for="crm-composer-text">Activity details</label>
            <textarea id="crm-composer-text" name="text" rows="3" placeholder="${placeholder}"></textarea>
            <div class="crm-composer__foot">
              <span class="apwa-text-3 crm-composer__hint">${icon('lock')}Saved in this browser only${detailUI.type === 'email' ? '. The email is simulated.' : '.'}</span>
              <button type="submit" class="apwa-btn apwa-btn--primary apwa-btn--sm">${icon(detailUI.type === 'email' ? 'send' : 'check')}<span>${detailUI.type === 'email' ? 'Send (simulated)' : 'Log activity'}</span></button>
            </div>
          </form>
          <div class="apwa-card"><div class="apwa-card__body">${timeline(acts)}</div></div>`
        : html`<div class="apwa-card">
            <header class="apwa-card__head"><h3 class="apwa-card__title">Opportunities</h3><div class="apwa-card__actions">${button('New opportunity', { size: 'sm', icon: 'plus', attrs: { 'data-quick': 'deal' } })}</div></header>
            ${deals.length ? html`<ul class="crm-deallist" role="list">${deals.map((d) => html`<li><button type="button" class="crm-deallist__row" data-open-deal="${d.id}">
              <span class="crm-deallist__main"><strong>${d.name}</strong><span>${metrics.stageName(d.stageId)} · ${d.status === 'open' ? `closes ${date(d.expectedClose)}` : `closed ${date(d.closedAt)}`}</span></span>
              <span class="crm-deallist__side"><strong>${money(d.value)}</strong>${dealStatus(d.status)}</span>
            </button></li>`)}</ul>` : emptyState({ icon: 'briefcase', title: 'No opportunities yet', text: `Create one to track work you're quoting for ${c.firstName}.` })}
          </div>`}
      </section>
    </div>`,
    mount(root) {
      bindSegmented(root, { acttype: (v) => { detailUI.type = v; ctx.rerender(); } });
      on(root, 'click', '[data-tab]', (e, b) => { detailUI.tab = b.dataset.tab; ctx.rerender(); });
      on(root, 'click', '[data-open-deal]', (e, b) => openDeal(b.dataset.openDeal));
      on(root, 'click', '[data-contact-menu]', (e, b) => menu(b, actionsFor(), { title: name(c) }));
      on(root, 'change', '[data-contact-status]', (e, s) => {
        store.patch('contacts', c.id, { status: s.value });
        store.logActivity({ type: 'update', contactId: c.id, text: `Status changed to ${CONTACT_STATUS[s.value].label}` });
        toast(`${name(c)} is now a ${CONTACT_STATUS[s.value].label.toLowerCase()}.`, { title: 'Status updated', timeout: 2400 });
      });
      on(root, 'click', '[data-quick]', (e, b) => {
        const q = b.dataset.quick;
        if (q === 'deal') { openDealForm(null, { contactId: c.id }); return; }
        if (q === 'call') {
          store.logActivity({ type: 'call', contactId: c.id, text: `Outbound call to ${c.firstName} (simulated)`, simulated: true });
          simulated(`Call to ${c.phone || c.firstName} logged.`);
          return;
        }
        detailUI.tab = 'activity';
        detailUI.type = q === 'email' ? 'email' : 'note';
        ctx.rerender();
        requestAnimationFrame(() => { const t = document.querySelector('[data-composer] textarea'); if (t) t.focus(); });
        if (q === 'sms') toast('Texting is part of the full version. Log the message as a note here.', { tone: 'info', title: 'Two-way SMS' });
      });
      const form = $('[data-composer]', root);
      if (form) {
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          const text = form.elements.text.value.trim();
          if (!text) { form.elements.text.focus(); toast('Write something first.', { tone: 'warning', timeout: 2000 }); return; }
          const isEmail = detailUI.type === 'email';
          store.logActivity({ type: detailUI.type, contactId: c.id, text: isEmail ? `Email to ${c.firstName}: ${text}` : text, simulated: isEmail });
          if (isEmail) simulated(`Email to ${c.email || c.firstName} logged on the timeline.`);
          else toast('Added to the activity timeline.', { title: 'Activity logged', timeout: 2400 });
        });
        form.elements.text.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) form.requestSubmit();
        });
      }
    },
  };
}

async function deleteContact(c) {
  const deals = store.all('deals').filter((d) => d.contactId === c.id);
  const ok = await confirmDialog({
    title: 'Delete contact?',
    message: `${name(c)}${deals.length ? ` and ${deals.length} linked ${deals.length === 1 ? 'opportunity' : 'opportunities'}` : ''} will be removed from this demo.`,
    confirmLabel: 'Delete contact',
    tone: 'danger',
  });
  if (!ok) return;
  const snap = store.snapshot(['contacts', 'deals', 'activities']);
  store.update((s) => {
    s.contacts = s.contacts.filter((x) => x.id !== c.id);
    s.deals = s.deals.filter((d) => d.contactId !== c.id);
    s.activities = s.activities.filter((a) => a.contactId !== c.id);
  });
  undoToast(`${name(c)} was deleted.`, 'Contact deleted', snap, () => router.go(`crm/contacts/${c.id}`));
  router.go('crm/contacts');
}

/* ------------------------------------------------------------------ */
/* Pipeline                                                             */
/* ------------------------------------------------------------------ */

function filteredDeals() {
  const q = pipeUI.q.toLowerCase();
  return store.all('deals').filter((d) => {
    if (pipeUI.status !== 'all' && d.status !== pipeUI.status) return false;
    if (pipeUI.owner !== 'all' && d.ownerId !== pipeUI.owner) return false;
    if (!q) return true;
    const c = store.contact(d.contactId);
    return [d.name, name(c), c?.company].join(' ').toLowerCase().includes(q);
  });
}

function dealCard(d) {
  const c = store.contact(d.contactId);
  const overdue = d.status === 'open' && d.expectedClose && new Date(d.expectedClose) < new Date();
  return html`<div class="crm-kcard__top"><span class="crm-kcard__name">${d.name}</span>${d.status !== 'open' ? dealStatus(d.status) : ''}</div>
    <div class="crm-kcard__contact">${icon(c?.company ? 'building' : 'user')}<span>${c?.company || name(c)}</span></div>
    <div class="crm-kcard__foot">
      <strong class="crm-kcard__value">${money(d.value)}</strong>
      <span class="crm-kcard__date ${overdue ? 'is-overdue' : ''}" title="Expected close">${icon('clock')}${overdue ? 'Overdue' : date(d.expectedClose)}</span>
      ${userAvatar(d.ownerId, 'xs')}
    </div>`;
}

function pipelineBoard(deals) {
  const st = metrics.stages();
  if (!st.some((s) => s.id === pipeUI.phoneCol)) pipeUI.phoneCol = st[0].id;
  return kanban({
    columns: st.map((s) => {
      const items = deals.filter((d) => d.stageId === s.id).sort((a, b) => b.value - a.value);
      return { id: s.id, title: s.name, items, meta: html`<span>${money(items.reduce((n, d) => n + d.value, 0))}</span><span class="apwa-text-3">${Math.round(s.probability * 100)}%</span>` };
    }),
    itemId: (d) => d.id,
    card: dealCard,
    activeColumn: pipeUI.phoneCol,
    onColumnChange: (id) => { pipeUI.phoneCol = id; },
    onOpen: openDeal,
    onMove: moveDeal,
    empty: () => html`<span>${icon('inbox')}Drop a deal here</span>`,
  });
}

function pipelineList(deals) {
  const rows = sortRows(deals, pipeUI.sort, {
    name: (d) => d.name.toLowerCase(),
    contact: (d) => name(store.contact(d.contactId)).toLowerCase(),
    stage: (d) => metrics.stages().findIndex((s) => s.id === d.stageId),
    expectedClose: (d) => d.expectedClose,
  });
  const cols = [
    { key: 'name', label: 'Opportunity', sortable: true, render: (d) => html`<button type="button" class="apwa-link apwa-link--strong" data-open-deal="${d.id}">${d.name}</button>` },
    { key: 'contact', label: 'Contact', sortable: true, render: (d) => { const c = store.contact(d.contactId); return c ? html`<a href="${contactHref(c)}">${name(c)}</a>` : '—'; } },
    { key: 'stage', label: 'Stage', sortable: true, render: (d) => metrics.stageName(d.stageId) },
    { key: 'status', label: 'Status', render: (d) => dealStatus(d.status) },
    { key: 'value', label: 'Value', sortable: true, align: 'right', render: (d) => html`<strong>${money(d.value)}</strong>` },
    { key: 'expectedClose', label: 'Close date', sortable: true, hideOn: 'tablet', render: (d) => date(d.status === 'open' ? d.expectedClose : d.closedAt) },
    { key: 'owner', label: 'Owner', hideOn: 'tablet', render: (d) => html`<span class="apwa-cell-owner">${userAvatar(d.ownerId, 'xs')}<span>${store.user(d.ownerId)?.name.split(' ')[0]}</span></span>` },
  ];
  return html`<div class="apwa-card apwa-card--table">${dataTable(cols, rows, {
    sort: pipeUI.sort,
    mobile: (d) => html`<button type="button" class="apwa-list__btn" data-open-deal="${d.id}"><div class="apwa-list__main"><strong>${d.name}</strong><span>${name(store.contact(d.contactId))} · ${metrics.stageName(d.stageId)}</span></div><div class="apwa-list__side"><strong>${money(d.value)}</strong>${dealStatus(d.status)}</div></button>`,
    empty: emptyState({ icon: 'briefcase', title: 'No opportunities match', text: 'Change the filters or create a new opportunity.' }),
  })}</div>`;
}

function pipeSummary(deals) {
  const total = deals.reduce((n, d) => n + d.value, 0);
  const st = metrics.stages();
  const weighted = deals.filter((d) => d.status === 'open').reduce((n, d) => n + d.value * (st.find((s) => s.id === d.stageId)?.probability || 0), 0);
  return html`
    <div><span>${pipeUI.status === 'all' ? 'All' : DEAL_STATUS[pipeUI.status].label} deals</span><strong>${num(deals.length)}</strong></div>
    <div><span>Total value</span><strong>${money(total)}</strong></div>
    ${pipeUI.status === 'open' ? html`<div><span>Weighted forecast</span><strong>${money(weighted)}</strong></div>` : ''}
    <div class="apwa-hide-phone"><span>Average deal</span><strong>${money(deals.length ? total / deals.length : 0)}</strong></div>`;
}

function pipelineView(ctx) {
  if (ctx.query.new) setTimeout(() => { router.go('crm/pipeline', { replace: true }); openDealForm(); }, 0);
  if (ctx.query.deal) setTimeout(() => { router.go('crm/pipeline', { replace: true }); openDeal(ctx.query.deal); }, 0);
  const all = store.all('deals');
  const counts = { open: 0, won: 0, lost: 0 };
  all.forEach((d) => { counts[d.status] += 1; });
  const board = pipeUI.view === 'board';

  return {
    title: 'Pipeline',
    subtitle: 'Drag deals between stages, or open one to update it.',
    pageClass: board ? 'apwa-page--wide' : '',
    actions: [{ label: 'New opportunity', icon: 'plus', kind: 'primary', primary: true, onClick: () => openDealForm() }],
    body: html`
      <div class="crm-pipebar">
        <div class="apwa-input-search">${icon('search')}<input type="search" value="${pipeUI.q}" placeholder="Search deals or contacts…" aria-label="Search deals" data-pipe-q></div>
        ${segmented('pstatus', [{ value: 'open', label: 'Open', count: counts.open }, { value: 'won', label: 'Won', count: counts.won }, { value: 'lost', label: 'Lost', count: counts.lost }, { value: 'all', label: 'All', count: all.length }], pipeUI.status, { label: 'Deal status' })}
        <div class="apwa-select apwa-select--sm"><select aria-label="Filter by owner" data-pipe-owner>
          <option value="all">All owners</option>
          ${ownerOptions().map((o) => html`<option value="${o.value}" ${o.value === pipeUI.owner ? raw('selected') : ''}>${o.label}</option>`)}
        </select>${icon('chevron-down')}</div>
        <div class="crm-pipebar__spacer"></div>
        ${segmented('pview', [{ value: 'board', icon: 'board', title: 'Board view', label: 'Board' }, { value: 'list', icon: 'list', title: 'List view', label: 'List' }], pipeUI.view, { label: 'View', className: 'apwa-seg--icons' })}
      </div>
      <div class="crm-pipesum" data-pipe-sum></div>
      <div data-pipe-area></div>`,
    mount(root) {
      const area = $('[data-pipe-area]', root);
      const sum = $('[data-pipe-sum]', root);
      const refresh = () => {
        const deals = filteredDeals();
        sum.innerHTML = `${pipeSummary(deals)}`;
        area.innerHTML = '';
        if (pipeUI.view === 'board') area.appendChild(pipelineBoard(deals));
        else area.innerHTML = `${pipelineList(deals)}`;
      };
      refresh();
      $('[data-pipe-q]', root).addEventListener('input', debounce((e) => { pipeUI.q = e.target.value.trim(); refresh(); }, 150));
      $('[data-pipe-owner]', root).addEventListener('change', (e) => { pipeUI.owner = e.target.value; refresh(); });
      bindSegmented(root, {
        pstatus: (v) => { pipeUI.status = v; ctx.rerender(); },
        pview: (v) => { pipeUI.view = v; ctx.rerender(); },
      });
      on(root, 'click', '[data-open-deal]', (e, b) => openDeal(b.dataset.openDeal));
      on(root, 'click', '[data-sort]', (e, b) => {
        const k = b.dataset.sort;
        pipeUI.sort = { key: k, dir: pipeUI.sort.key === k && pipeUI.sort.dir === 'desc' ? 'asc' : 'desc' };
        refresh();
      });
    },
  };
}

/* ------------------------------------------------------------------ */
/* Reports                                                              */
/* ------------------------------------------------------------------ */

function reportsView() {
  const m = metrics.pipeline();
  const months = metrics.wonByMonth(6);
  const sources = metrics.bySource();
  const owners = metrics.byOwner();
  return {
    title: 'Reports',
    subtitle: 'Pipeline health and results, calculated live from the demo data.',
    body: html`
      <div class="apwa-stats apwa-stats--6">
        ${stat({ label: 'Open pipeline', value: moneyShort(m.openValue), sub: plural(m.open.length, 'deal'), icon: 'pipeline', tone: 'blue' })}
        ${stat({ label: 'Weighted forecast', value: moneyShort(m.weighted), sub: 'By stage probability', icon: 'trending-up', tone: 'teal' })}
        ${stat({ label: 'Won (90 days)', value: moneyShort(m.wonValue90), sub: plural(m.won90.length, 'deal'), icon: 'award', tone: 'green' })}
        ${stat({ label: 'Win rate', value: pct(m.winRate), sub: 'Closed deals, 90 days', icon: 'target', tone: 'purple' })}
        ${stat({ label: 'Average deal', value: moneyShort(m.avgDeal), sub: 'Won, 90 days', icon: 'dollar', tone: 'amber' })}
        ${stat({ label: 'Sales cycle', value: `${Math.round(m.cycle)} days`, sub: 'Created to won', icon: 'clock', tone: 'pink' })}
      </div>
      <div class="apwa-grid apwa-grid--2">
        ${card({ title: 'Won revenue by month', body: columnChart(months, { label: 'Won revenue for the last six months' }) })}
        ${card({ title: 'Open pipeline by stage', body: barList(m.byStage.map((s) => ({ label: s.name, sub: `${plural(s.count, 'deal')} · ${Math.round(s.probability * 100)}%`, value: s.value }))) })}
        ${card({
          title: 'Lead sources',
          flush: true,
          body: html`<div class="apwa-tablewrap"><table class="apwa-table apwa-table--compact">
            <thead><tr><th scope="col">Source</th><th scope="col" class="is-right">Deals</th><th scope="col" class="is-right">Pipeline</th><th scope="col" class="is-right">Win rate</th></tr></thead>
            <tbody>${sources.map((s) => html`<tr><td>${s.source}</td><td class="is-right">${s.count}</td><td class="is-right">${moneyShort(s.value)}</td><td class="is-right">${s.winRate == null ? html`<span class="apwa-text-3">—</span>` : pct(s.winRate)}</td></tr>`)}</tbody>
          </table></div>`,
        })}
        ${card({
          title: 'Team performance',
          flush: true,
          body: html`<div class="apwa-tablewrap"><table class="apwa-table apwa-table--compact">
            <thead><tr><th scope="col">Owner</th><th scope="col" class="is-right">Open</th><th scope="col" class="is-right">Won</th><th scope="col" class="is-right apwa-hide-phone">Win rate</th></tr></thead>
            <tbody>${owners.map((o) => html`<tr><td><span class="apwa-cell-owner">${avatar(o.user.name, { size: 'xs' })}<span>${o.user.name}</span></span></td><td class="is-right">${moneyShort(o.openValue)}<div class="apwa-cell-sub">${plural(o.openCount, 'deal')}</div></td><td class="is-right">${moneyShort(o.wonValue)}</td><td class="is-right apwa-hide-phone"><span class="crm-rate">${o.winRate == null ? '—' : pct(o.winRate)}${o.winRate == null ? '' : meter(o.winRate, 'green')}</span></td></tr>`)}</tbody>
          </table></div>`,
        })}
      </div>`,
  };
}

/* ------------------------------------------------------------------ */
/* Today: the calm first screen                                         */
/* ------------------------------------------------------------------ */

function todayView() {
  const now = Date.now();
  const needs = store.all('deals').filter((d) => d.status === 'open')
    .sort((a, b) => (a.updatedAt < b.updatedAt ? -1 : 1)).slice(0, 3);
  const bk = store.get().booking;
  const svcName = (id) => ((bk && bk.services) || []).find((s) => s.id === id)?.name || 'Appointment';
  const upcoming = store.all('appointments')
    .filter((a) => a.status !== 'cancelled' && new Date(a.start).getTime() > now)
    .sort((a, b) => (a.start < b.start ? -1 : 1)).slice(0, 2);
  const recent = store.all('contacts').slice()
    .sort((a, b) => ((a.lastActivityAt || '') < (b.lastActivityAt || '') ? 1 : -1)).slice(0, 4);
  const m = metrics.pipeline();
  const row = (c, sub, side = '') => html`<li><a class="crm-today__row" href="${contactHref(c)}">${avatar(name(c))}<span class="crm-today__main"><strong>${name(c)}</strong><span>${sub}</span></span>${side}${icon('chevron-right')}</a></li>`;

  return {
    title: 'Today',
    subtitle: needs.length ? `${plural(needs.length, 'customer')} could use a follow-up. Start there.` : 'Nobody is waiting on you right now.',
    actions: [{ label: 'Add a customer', icon: 'user-plus', kind: 'primary', primary: true, fabIcon: 'user-plus', onClick: () => openContactForm() }],
    body: html`<div class="crm-today">
      <div class="crm-today__col">
        <section class="apwa-card" data-tour="today" aria-labelledby="crm-today-needs">
          <h2 class="crm-today__h" id="crm-today-needs">Needs you today</h2>
          ${needs.length ? html`<ul class="crm-today__list">${needs.map((d) => {
            const c = store.contact(d.contactId);
            return c ? row(c, `${d.name} · ${metrics.stageName(d.stageId)}`, html`<span class="crm-today__tag">Follow up</span>`) : '';
          })}</ul>` : emptyState({ icon: 'check-circle', title: 'All caught up' })}
        </section>
        <section class="apwa-card" aria-labelledby="crm-today-next">
          <h2 class="crm-today__h" id="crm-today-next">Coming up</h2>
          ${upcoming.length ? html`<ul class="crm-today__list">${upcoming.map((a) => {
            const c = store.contact(a.contactId);
            return c ? row(c, `${svcName(a.serviceId)} · ${dateTime(a.start)}`) : '';
          })}</ul>` : html`<p class="crm-today__none">Nothing booked yet.</p>`}
        </section>
      </div>
      <div class="crm-today__col">
        <section class="apwa-card" data-tour="recent" aria-labelledby="crm-today-recent">
          <div class="crm-today__hrow"><h2 class="crm-today__h" id="crm-today-recent">Recent customers</h2><a class="apwa-link" href="${href('crm/contacts')}">See all</a></div>
          <ul class="crm-today__list">${recent.map((c) => row(c, c.lastActivityAt ? `Last contact ${ago(c.lastActivityAt)}` : (c.company || c.email || '')))}</ul>
        </section>
        <details class="apwa-card crm-today__nums">
          <summary><span>Show the numbers</span>${icon('chevron-down')}</summary>
          <dl>
            <div><dt>Open opportunities</dt><dd>${m.open.length}</dd></div>
            <div><dt>Won in the last 90 days</dt><dd>${m.won90.length}</dd></div>
            <div><dt>Win rate</dt><dd>${pct(m.winRate)}</dd></div>
          </dl>
          <p class="crm-today__links"><a class="apwa-link" href="${href('crm/pipeline')}">Open the pipeline</a><a class="apwa-link" href="${href('crm/reports')}">Full reports</a></p>
        </details>
      </div>
    </div>`,
  };
}

/* ------------------------------------------------------------------ */
/* Global search provider                                               */
/* ------------------------------------------------------------------ */

function search(q) {
  const s = q.toLowerCase();
  const contacts = store.all('contacts')
    .filter((c) => [name(c), c.email, c.company, c.phone].join(' ').toLowerCase().includes(s))
    .slice(0, 5)
    .map((c) => ({ label: name(c), sub: c.company || c.email, href: contactHref(c), avatar: true, type: 'Contact' }));
  const deals = store.all('deals')
    .filter((d) => [d.name, name(store.contact(d.contactId))].join(' ').toLowerCase().includes(s))
    .slice(0, 4)
    .map((d) => ({ label: d.name, sub: `${money(d.value)} · ${metrics.stageName(d.stageId)}`, href: href(`crm/pipeline?deal=${d.id}`), icon: 'briefcase', type: 'Deal' }));
  return [...contacts, ...deals];
}

/* ------------------------------------------------------------------ */
/* Module definition                                                    */
/* ------------------------------------------------------------------ */

export default {
  slug: 'crm',
  nav: [
    { id: 'crm-today', path: 'crm/today', label: 'Today', icon: 'home' },
    { id: 'crm-contacts', path: 'crm/contacts', label: 'Contacts', icon: 'users' },
    { id: 'crm-pipeline', path: 'crm/pipeline', label: 'Pipeline', icon: 'pipeline' },
    { id: 'crm-reports', path: 'crm/reports', label: 'Reports', icon: 'bar-chart' },
  ],
  routes: [
    { pattern: 'crm', redirect: 'crm/today' },
    { pattern: 'crm/today', view: todayView, nav: 'crm-today' },
    { pattern: 'crm/contacts', view: contactsView, nav: 'crm-contacts' },
    { pattern: 'crm/contacts/:id', view: contactDetailView, nav: 'crm-contacts' },
    { pattern: 'crm/pipeline', view: pipelineView, nav: 'crm-pipeline' },
    { pattern: 'crm/reports', view: reportsView, nav: 'crm-reports' },
  ],
  quickActions: [
    { label: 'New contact', icon: 'user-plus', run: () => openContactForm() },
    { label: 'New opportunity', icon: 'briefcase', run: () => openDealForm() },
  ],
  search,
};

export { esc, el, $$, isPhone, num };
