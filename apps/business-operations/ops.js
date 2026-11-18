/**
 * Business Operations demo.
 * Recurring duties and checklists per person, step-by-step SOPs,
 * equipment with service dates, and inventory with low-stock alerts.
 * Reorders are simulated.
 */
import { html, raw, icon, $, plural, ago, money } from '../../assets/js/core/dom.js';
import * as store from '../../assets/js/core/store.js';
import * as ind from '../../assets/js/core/industry.js';
import * as router from '../../assets/js/core/router.js';
import { openPanel, toast, simulated, formData, validate } from '../../assets/js/core/ui.js';
import { numsToggle, badge, button, card, stat, emptyState, segmented, bindSegmented, formGrid, dataTable, avatar, meter } from '../../assets/js/core/components.js';

const DAY = 86400000;
const href = (p) => router.href(p);
const FREQ = { daily: 'Every day', weekly: 'Every week', monthly: 'Every month' };
const todayKey = () => new Date().toISOString().slice(0, 10);
const inDays = (n) => new Date(Date.now() + n * DAY).toISOString().slice(0, 10);
const daysUntil = (d) => Math.round((new Date(`${d}T12:00:00`).getTime() - Date.now()) / DAY);

/* ------------------------------------------------------------------ */
/* Seed                                                                 */
/* ------------------------------------------------------------------ */

function seed() {
  const today = todayKey();
  const duty = (id, title, ownerId, freq, sopId, done = false) => ({ id, title, ownerId, freq, sopId, doneOn: done ? today : null });
  const duties = [
    duty('d1', 'Open the shop and check voicemail', 'u4', 'daily', null, true),
    duty('d2', 'Load trucks for today’s jobs', 'u3', 'daily', 'sop2', true),
    duty('d3', 'Confirm tomorrow’s appointments', 'u4', 'daily', 'sop1'),
    duty('d4', 'Truck walk-around inspection', 'u3', 'daily', 'sop3'),
    duty('d5', 'Count van stock and log usage', 'u3', 'weekly', null),
    duty('d6', 'Review open quotes and follow up', 'u2', 'weekly', null, true),
    duty('d7', 'Back up job photos to the shared drive', 'u2', 'weekly', null),
    duty('d8', 'Close out the day: lock up, alarm on', 'u1', 'daily', 'sop4'),
    duty('d9', 'Reconcile card payments', 'u1', 'monthly', null),
  ];
  const sops = [
    { id: 'sop1', title: 'Confirming appointments', cat: 'Office', minutes: 15, updated: 12, steps: ['Open tomorrow on the calendar', 'Text each customer the time window', 'Call anyone who has not replied by 3 PM', 'Note gate codes and pets on the job', 'Flag cancellations to the scheduler'] },
    { id: 'sop2', title: 'Loading a truck', cat: 'Field', minutes: 20, updated: 30, steps: ['Print or open the day’s job list', 'Pull parts for each job from the shelf', 'Check the ladder, vacuum and drop cloths are on board', 'Scan anything taken from stock', 'Lock the truck and take the keys'] },
    { id: 'sop3', title: 'Truck walk-around', cat: 'Safety', minutes: 5, updated: 45, steps: ['Tires look full and undamaged', 'Lights and signals work', 'No new dents or warning lights', 'Fire extinguisher and first aid kit present', 'Log any issue on the equipment page'] },
    { id: 'sop4', title: 'Closing the shop', cat: 'Office', minutes: 10, updated: 8, steps: ['Plug in the tablets and radios', 'Turn off the shop heater', 'Lock the stock room', 'Set the alarm', 'Lock the front door'] },
    { id: 'sop5', title: 'Handling a no-heat emergency', cat: 'Field', minutes: 10, updated: 3, steps: ['Ask if anyone at home is vulnerable', 'Book the first open slot, or bump a routine job', 'Text the customer the technician’s name', 'Bring a space heater if the part may need ordering'] },
  ];
  const equipment = [
    { id: 'e1', name: 'Truck 1 (Ford Transit)', kind: 'Vehicle', ownerId: 'u3', lastService: inDays(-160), nextService: inDays(6), status: 'ok' },
    { id: 'e2', name: 'Truck 2 (Ram ProMaster)', kind: 'Vehicle', ownerId: 'u2', lastService: inDays(-40), nextService: inDays(50), status: 'ok' },
    { id: 'e3', name: 'Refrigerant recovery machine', kind: 'Tool', ownerId: 'u3', lastService: inDays(-370), nextService: inDays(-5), status: 'ok' },
    { id: 'e4', name: 'Drain camera', kind: 'Tool', ownerId: null, lastService: inDays(-90), nextService: inDays(90), status: 'repair' },
    { id: 'e5', name: '28 ft extension ladder', kind: 'Safety', ownerId: 'u3', lastService: inDays(-20), nextService: inDays(160), status: 'ok' },
    { id: 'e6', name: 'Office tablet (front desk)', kind: 'Device', ownerId: 'u4', lastService: inDays(-60), nextService: inDays(120), status: 'ok' },
  ];
  const inventory = [
    { id: 'i1', name: 'Furnace filters 16x25x1', sku: 'FLT-1625', qty: 6, min: 12, unit: 'each', cost: 9.5, vendor: 'Ferguson' },
    { id: 'i2', name: 'Thermostat (smart, Wi-Fi)', sku: 'THR-WIFI', qty: 4, min: 3, unit: 'each', cost: 119, vendor: 'Ferguson' },
    { id: 'i3', name: 'PEX tubing 1/2 in', sku: 'PEX-12', qty: 140, min: 100, unit: 'ft', cost: 0.62, vendor: 'Home Depot Pro' },
    { id: 'i4', name: 'Shut-off valves 1/2 in', sku: 'VLV-12', qty: 3, min: 8, unit: 'each', cost: 11.25, vendor: 'Home Depot Pro' },
    { id: 'i5', name: 'Capacitors 45/5 MFD', sku: 'CAP-455', qty: 9, min: 6, unit: 'each', cost: 18, vendor: 'Johnstone Supply' },
    { id: 'i6', name: 'Drop cloths', sku: 'DRP-9X12', qty: 2, min: 6, unit: 'each', cost: 14, vendor: 'Home Depot Pro' },
    { id: 'i7', name: 'Gutter guard sections', sku: 'GTR-4FT', qty: 30, min: 20, unit: 'each', cost: 6.8, vendor: 'ABC Supply' },
  ];
  duties.forEach((x, i) => { x.title = ind.at('duties', i, x.title); });
  sops.forEach((x, i) => { Object.assign(x, ind.at('sops', i, {})); });
  equipment.forEach((x, i) => { const o = ind.at('equipment', i, null); if (o) { x.name = o[0]; x.kind = o[1]; } });
  inventory.forEach((x, i) => { const o = ind.at('inventory', i, null); if (o) Object.assign(x, { name: o[0], sku: o[1], unit: o[2], cost: o[3], vendor: o[4] }); });
  return { duties, sops, equipment, inventory, opsRuns: {} };
}

const ready = () => store.ensure('duties', seed);
const col = (k) => { ready(); return store.all(k); };
const isDone = (d) => d.doneOn === todayKey();
const low = (i) => i.qty <= i.min;
const serviceDue = (e) => daysUntil(e.nextService) <= 14;
const userName = (id) => (id ? (store.user(id) || {}).name || 'Team' : 'Unassigned');

function dueBadge(e) {
  if (e.status === 'repair') return badge('Out for repair', 'red', { dot: true });
  const n = daysUntil(e.nextService);
  if (n < 0) return badge(`Service ${plural(-n, 'day')} overdue`, 'red');
  if (n <= 14) return badge(n === 0 ? 'Service due today' : `Service in ${plural(n, 'day')}`, 'amber');
  return badge('Good', 'green', { dot: true });
}

/* ------------------------------------------------------------------ */
/* Checklists                                                           */
/* ------------------------------------------------------------------ */

const ui = { who: 'all' };

function editDuty(d) {
  openPanel({
    title: d ? 'Edit duty' : 'New recurring duty',
    subtitle: 'It shows up on that person’s checklist on schedule.',
    size: 'md',
    onSubmit(form) {
      if (!validate(form, { title: 'Say what needs doing' })) return false;
      const v = formData(form);
      const rec = { title: v.title, ownerId: v.ownerId || null, freq: v.freq, sopId: v.sopId || null };
      if (d) store.patch('duties', d.id, rec); else store.insert('duties', { ...rec, doneOn: null });
      toast(d ? 'Duty updated.' : `Added to ${userName(rec.ownerId)}’s checklist.`, { title: 'Saved' });
      return true;
    },
    body: formGrid([
      { label: 'Duty', name: 'title', value: d ? d.title : '', required: true, placeholder: 'e.g. Restock the van', span: 2 },
      { label: 'Assign to', name: 'ownerId', type: 'select', value: d ? d.ownerId : '', placeholder: 'Unassigned', options: store.all('users').map((u) => ({ value: u.id, label: u.name })) },
      { label: 'Repeats', name: 'freq', type: 'select', value: d ? d.freq : 'daily', options: Object.entries(FREQ).map(([value, label]) => ({ value, label })) },
      { label: 'Linked how-to', name: 'sopId', type: 'select', value: d ? d.sopId : '', placeholder: 'None', options: col('sops').map((s) => ({ value: s.id, label: s.title })), span: 2 },
    ]),
    buttons: [{ label: 'Cancel' }, { label: d ? 'Save' : 'Add duty', kind: 'primary', type: 'submit' }],
  });
}

function checklistView(ctx) {
  const duties = col('duties');
  const users = store.all('users');
  const shown = duties.filter((d) => ui.who === 'all' || d.ownerId === ui.who);
  const doneCount = duties.filter(isDone).length;
  const lowItems = col('inventory').filter(low);
  const dueEq = col('equipment').filter((e) => e.status === 'repair' || serviceDue(e));
  const groups = users.map((u) => ({ u, items: shown.filter((d) => d.ownerId === u.id) })).filter((g) => g.items.length);
  const un = shown.filter((d) => !d.ownerId);
  const row = (d) => { const s = d.sopId && store.find('sops', d.sopId); return html`<li class="op-duty ${isDone(d) ? 'is-done' : ''}">
    <label><input type="checkbox" data-duty="${d.id}" ${isDone(d) ? raw('checked') : ''}><span class="op-duty__txt"><span>${d.title}</span><small>${FREQ[d.freq]}</small></span></label>
    ${s ? html`<a class="op-duty__how" href="${href(`business-operations/sop/${s.id}`)}">${icon('file-text')}How-to</a>` : ''}<button type="button" class="op-icon-btn" data-edit="${d.id}" aria-label="Edit ${d.title}">${icon('edit')}</button>
  </li>`; };
  const group = (title, sub, items) => { const done = items.filter(isDone).length; return card({ title: html`<span class="op-gtitle">${title}<small>${sub}</small></span>`, actions: html`<span class="op-gcount">${done}/${items.length}</span>`, body: html`${meter(items.length ? done / items.length : 0, done === items.length ? 'green' : 'amber')}<ul class="op-duties">${items.map(row)}</ul>` }); };
  return {
    title: 'Today’s checklists',
    subtitle: duties.length - doneCount ? `${plural(duties.length - doneCount, 'duty', 'duties')} still open today.` : 'Everything on today’s list is done.',
    actions: [{ label: 'New duty', icon: 'plus', kind: 'primary', primary: true, onClick: () => editDuty(null) }],
    body: html`
      ${numsToggle()}<div class="apwa-stats apwa-stats--calm op-stats">
        ${stat({ label: 'Done today', value: `${doneCount} of ${duties.length}`, sub: `${Math.round((doneCount / Math.max(1, duties.length)) * 100)}% complete`, icon: 'clipboard-check', tone: 'green' })}
        ${stat({ label: 'Still open', value: duties.length - doneCount, sub: 'Across the team', icon: 'clock', tone: 'amber' })}
        ${stat({ label: 'Low stock', value: lowItems.length, sub: lowItems.length ? lowItems.slice(0, 2).map((i) => i.name.split(',')[0].split(' ').slice(0, 2).join(' ')).join(', ') : 'All stocked', icon: 'alert', tone: lowItems.length ? 'pink' : 'green' })}
        ${stat({ label: 'Equipment needing service', value: dueEq.length, sub: 'Due within 2 weeks', icon: 'zap', tone: 'blue' })}
      </div>
      <div class="op-toolbar">${segmented('who', [{ value: 'all', label: 'Everyone' }, ...users.map((u) => ({ value: u.id, label: u.name.split(' ')[0], count: duties.filter((d) => d.ownerId === u.id && !isDone(d)).length }))], ui.who, { label: 'Show checklist for' })}</div>
      ${groups.length || un.length ? html`<div class="op-groups">${groups.map((g) => group(html`${avatar(g.u.name, { size: 'sm' })}${g.u.name}`, g.u.role || '', g.items))}${un.length ? group('Unassigned', 'Pick an owner', un) : ''}</div>` : emptyState({ icon: 'clipboard-check', title: 'No duties yet', text: 'Add a recurring duty to build this checklist.' })}`,
    mount(root) {
      bindSegmented(root, { who: (v) => { ui.who = v; ctx.rerender(); } });
      root.addEventListener('change', (e) => {
        const cb = e.target.closest('[data-duty]');
        if (!cb) return;
        const d = store.find('duties', cb.dataset.duty);
        store.patch('duties', d.id, { doneOn: cb.checked ? todayKey() : null });
        if (cb.checked && col('duties').every(isDone)) toast('Every duty on today’s list is done.', { title: 'All clear' });
      });
      root.addEventListener('click', (e) => { const b = e.target.closest('[data-edit]'); if (b) editDuty(store.find('duties', b.dataset.edit)); });
    },
  };
}

/* ------------------------------------------------------------------ */
/* SOPs                                                                 */
/* ------------------------------------------------------------------ */

function editSop(s) {
  openPanel({
    title: s ? 'Edit how-to' : 'New how-to',
    subtitle: 'One step per line.',
    size: 'md',
    onSubmit(form) {
      if (!validate(form, { title: 'Name it', steps: 'Add at least one step' })) return false;
      const v = formData(form);
      const rec = { title: v.title, cat: v.cat || 'General', minutes: Number(v.minutes) || 10, steps: v.steps.split('\n').map((x) => x.trim()).filter(Boolean), updated: 0 };
      const row = s ? (store.patch('sops', s.id, rec), s) : store.insert('sops', rec);
      toast('Your team can follow it from any checklist.', { title: s ? 'How-to updated' : 'How-to added' });
      router.go(`business-operations/sop/${row.id}`);
      return true;
    },
    body: formGrid([
      { label: 'Title', name: 'title', value: s ? s.title : '', required: true, span: 2 },
      { label: 'Area', name: 'cat', value: s ? s.cat : '', placeholder: 'e.g. Office' },
      { label: 'Minutes', name: 'minutes', type: 'number', value: s ? s.minutes : 10, attrs: 'min="1"' },
      { label: 'Steps', name: 'steps', type: 'textarea', rows: 6, value: s ? s.steps.join('\n') : '', required: true, span: 2 },
    ]),
    buttons: [{ label: 'Cancel' }, { label: 'Save', kind: 'primary', type: 'submit' }],
  });
}

function sopsView() {
  const list = col('sops');
  return {
    title: 'How-tos',
    subtitle: 'Step-by-step guides so every job is done the same way, by anyone.',
    actions: [{ label: 'New how-to', icon: 'plus', kind: 'primary', primary: true, onClick: () => editSop(null) }],
    body: html`<div class="op-sops">${list.map((s) => { const used = col('duties').filter((d) => d.sopId === s.id).length; return html`<a class="op-sop" href="${href(`business-operations/sop/${s.id}`)}">
      <span class="op-sop__ic">${icon('file-text')}</span>
      <span class="op-sop__main"><strong>${s.title}</strong><small>${s.cat} · ${plural(s.steps.length, 'step')} · about ${s.minutes} min</small></span>
      <span class="op-sop__side">${used ? badge(`On ${plural(used, 'checklist')}`, 'blue') : ''}<small>Updated ${s.updated ? `${s.updated} days ago` : 'today'}</small></span>
    </a>`; })}</div>`,
  };
}

function sopView(ctx) {
  const s = col('sops').find((x) => x.id === ctx.params.id);
  if (!s) return { title: 'How-to not found', back: href('business-operations/sops'), body: emptyState({ icon: 'file-text', title: 'This how-to is gone', text: 'The demo may have been reset.' }) };
  const runs = store.get().opsRuns || {};
  const done = runs[s.id] || [];
  const duties = col('duties').filter((d) => d.sopId === s.id);
  return {
    title: s.title,
    crumb: { label: 'How-tos', href: href('business-operations/sops') },
    back: href('business-operations/sops'),
    subtitle: `${s.cat} · about ${s.minutes} minutes`,
    actions: [{ label: 'Edit', icon: 'edit', onClick: () => editSop(s) }],
    body: html`<div class="op-split">
      ${card({ title: 'Follow along', actions: html`<span class="op-gcount">${done.length}/${s.steps.length}</span>`, body: html`${meter(done.length / s.steps.length, done.length === s.steps.length ? 'green' : 'amber')}
        <ol class="op-steps">${s.steps.map((st, i) => html`<li class="${done.includes(i) ? 'is-done' : ''}"><label><input type="checkbox" data-step="${i}" ${done.includes(i) ? raw('checked') : ''}><span class="op-steps__n">${i + 1}</span><span>${st}</span></label></li>`)}</ol>
        ${done.length ? html`<button type="button" class="apwa-btn apwa-btn--ghost apwa-btn--sm" data-restart>${icon('refresh')}<span>Start over</span></button>` : ''}` })}
      ${card({ title: 'Used on', body: duties.length ? html`<ul class="op-used">${duties.map((d) => html`<li>${avatar(userName(d.ownerId), { size: 'xs' })}<span>${d.title}<small>${userName(d.ownerId)} · ${FREQ[d.freq]}</small></span></li>`)}</ul>` : html`<p class="op-muted">Not linked to a checklist yet. Link it from any duty.</p>` })}
    </div>`,
    mount(root) {
      root.addEventListener('change', (e) => {
        const cb = e.target.closest('[data-step]');
        if (!cb) return;
        const i = Number(cb.dataset.step);
        store.update((st) => { st.opsRuns = st.opsRuns || {}; const cur = new Set(st.opsRuns[s.id] || []); cb.checked ? cur.add(i) : cur.delete(i); st.opsRuns[s.id] = [...cur]; });
        if ((store.get().opsRuns[s.id] || []).length === s.steps.length) toast(`"${s.title}" is complete.`, { title: 'All steps done' });
      });
      const r = $('[data-restart]', root);
      if (r) r.addEventListener('click', () => store.update((st) => { st.opsRuns[s.id] = []; }));
    },
  };
}

/* ------------------------------------------------------------------ */
/* Equipment                                                            */
/* ------------------------------------------------------------------ */

function logService(e) {
  openPanel({
    title: 'Log service',
    subtitle: e.name,
    size: 'sm',
    onSubmit(form) {
      const v = formData(form);
      store.patch('equipment', e.id, { lastService: todayKey(), nextService: inDays(Number(v.every) || 180), status: 'ok' });
      toast(`Next service set for ${new Date(Date.now() + (Number(v.every) || 180) * DAY).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}.`, { title: 'Service logged' });
      return true;
    },
    body: formGrid([
      { label: 'What was done', name: 'note', type: 'textarea', rows: 3, placeholder: 'e.g. Oil change and tire rotation', span: 2 },
      { label: 'Next service in', name: 'every', type: 'select', value: '180', options: [['30', '1 month'], ['90', '3 months'], ['180', '6 months'], ['365', '1 year']].map(([value, label]) => ({ value, label })), span: 2 },
    ]),
    buttons: [{ label: 'Cancel' }, { label: 'Log service', kind: 'primary', type: 'submit' }],
  });
}

function equipmentView() {
  const list = col('equipment').slice().sort((a, b) => (a.status === 'repair' ? -1 : b.status === 'repair' ? 1 : a.nextService.localeCompare(b.nextService)));
  const cols = [
    { key: 'name', label: 'Equipment', render: (e) => html`<strong>${e.name}</strong><span class="apwa-cell-sub">${e.kind}</span>` },
    { key: 'owner', label: 'Assigned to', hideOn: 'tablet', render: (e) => (e.ownerId ? html`<span class="op-owner">${avatar(userName(e.ownerId), { size: 'xs' })}${userName(e.ownerId)}</span>` : html`<span class="op-muted">In the shop</span>`) },
    { key: 'next', label: 'Next service', render: (e) => html`${new Date(`${e.nextService}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}<div>${dueBadge(e)}</div>` },
    { key: 'act', label: '', align: 'right', render: (e) => html`<button type="button" class="apwa-btn apwa-btn--secondary apwa-btn--sm" data-service="${e.id}">${icon('check')}<span>${e.status === 'repair' ? 'Back in service' : 'Log service'}</span></button>` },
  ];
  return {
    title: 'Equipment',
    subtitle: ind.pack().equipHint || 'Trucks, tools and devices: who has them and when each is due for service.',
    body: card({ flush: true, className: 'op-table', body: dataTable(cols, list, {
      mobile: (e) => html`<span class="op-mrow"><span class="op-mrow__main"><strong>${e.name}</strong><span>${userName(e.ownerId)} · ${e.kind}</span><span>${dueBadge(e)}</span></span><button type="button" class="apwa-btn apwa-btn--secondary apwa-btn--sm" data-service="${e.id}">${e.status === 'repair' ? 'Back' : 'Log'}</button></span>`,
    }) }),
    mount(root) {
      root.addEventListener('click', (ev) => { const b = ev.target.closest('[data-service]'); if (b) { ev.stopPropagation(); logService(store.find('equipment', b.dataset.service)); } });
    },
  };
}

/* ------------------------------------------------------------------ */
/* Inventory                                                            */
/* ------------------------------------------------------------------ */

const inv = { filter: 'all' };

function reorder(items) {
  const lines = items.map((i) => ({ ...i, order: Math.max(i.min * 2 - i.qty, i.min) }));
  const total = lines.reduce((a, l) => a + l.order * l.cost, 0);
  const vendors = [...new Set(lines.map((l) => l.vendor))];
  openPanel({
    title: 'Reorder low stock',
    subtitle: `${plural(lines.length, 'item')} from ${plural(vendors.length, 'supplier')}`,
    size: 'md',
    body: html`<ul class="op-po">${lines.map((l) => html`<li><span><strong>${l.name}</strong><small>${l.vendor} · ${l.sku}</small></span><span>${l.order} ${l.unit}</span><b>${money(l.order * l.cost)}</b></li>`)}</ul><p class="op-po__total">Estimated total <b>${money(total)}</b></p>`,
    buttons: [{ label: 'Cancel' }, { label: 'Send purchase orders', kind: 'primary', onClick: (close) => {
      store.update((st) => lines.forEach((l) => { const r = st.inventory.find((x) => x.id === l.id); r.onOrder = l.order; }));
      simulated(`${plural(vendors.length, 'purchase order')} would go to ${vendors.join(', ')}. Nothing was ordered or charged.`);
      close();
      return true;
    } }],
  });
}

function inventoryView(ctx) {
  const all = col('inventory');
  const lows = all.filter(low);
  const rows = inv.filter === 'low' ? lows : all;
  const value = all.reduce((a, i) => a + i.qty * i.cost, 0);
  const lvl = (i) => html`<span class="op-lvl">${meter(Math.min(1, i.qty / (i.min * 2)), low(i) ? 'red' : 'green')}<small>${i.qty} ${i.unit} · reorder at ${i.min}</small></span>`;
  const status = (i) => (i.onOrder ? badge(`${i.onOrder} on order`, 'blue') : low(i) ? badge('Low stock', 'red', { dot: true }) : badge('In stock', 'green', { dot: true }));
  const adj = (i) => html`<span class="op-adj"><button type="button" data-adj="-1" data-id="${i.id}" aria-label="Use one ${i.name}">${raw('&minus;')}</button><b>${i.qty}</b><button type="button" data-adj="1" data-id="${i.id}" aria-label="Add one ${i.name}">+</button></span>`;
  const cols = [
    { key: 'name', label: 'Item', render: (i) => html`<strong>${i.name}</strong><span class="apwa-cell-sub">${i.sku} · ${i.vendor}</span>` },
    { key: 'lvl', label: 'Stock level', hideOn: 'tablet', render: lvl },
    { key: 'st', label: 'Status', render: status },
    { key: 'adj', label: 'Count', align: 'right', render: adj },
  ];
  return {
    title: 'Inventory',
    subtitle: 'Parts and supplies with a reorder point, so you never run out mid-job.',
    actions: lows.length ? [{ label: `Reorder ${plural(lows.length, 'item')}`, icon: 'send', kind: 'primary', primary: true, onClick: () => reorder(col('inventory').filter(low)) }] : [],
    body: html`
      ${lows.length ? html`<div class="op-alert">${icon('alert')}<span><strong>${plural(lows.length, 'item')} at or below the reorder point.</strong> ${lows.map((i) => i.name).join(', ')}.</span></div>` : ''}
      <div class="apwa-stats op-stats op-stats--3">
        ${stat({ label: 'Items tracked', value: all.length, sub: plural(new Set(all.map((i) => i.vendor)).size, 'supplier'), icon: 'tag', tone: 'blue' })}
        ${stat({ label: 'Low stock', value: lows.length, sub: lows.length ? 'Reorder suggested' : 'Nothing low', icon: 'alert', tone: lows.length ? 'pink' : 'green' })}
        ${stat({ label: 'Stock value', value: money(value), sub: 'At cost', icon: 'dollar', tone: 'green' })}
      </div>
      <div class="op-toolbar">${segmented('inv', [{ value: 'all', label: 'All items', count: all.length }, { value: 'low', label: 'Low stock', count: lows.length }], inv.filter, { label: 'Filter' })}</div>
      ${card({ flush: true, className: 'op-table', body: dataTable(cols, rows, {
        mobile: (i) => html`<span class="op-mrow"><span class="op-mrow__main"><strong>${i.name}</strong>${lvl(i)}<span>${status(i)}</span></span>${adj(i)}</span>`,
        empty: emptyState({ icon: 'check-circle', title: 'Nothing is low', text: 'Every item is above its reorder point.' }),
      }) })}`,
    mount(root) {
      bindSegmented(root, { inv: (v) => { inv.filter = v; ctx.rerender(); } });
      root.addEventListener('click', (e) => {
        const b = e.target.closest('[data-adj]');
        if (!b) return;
        const i = store.find('inventory', b.dataset.id);
        const qty = Math.max(0, i.qty + Number(b.dataset.adj));
        const wasLow = low(i);
        store.patch('inventory', i.id, { qty });
        if (!wasLow && qty <= i.min) toast(`${i.name} hit its reorder point.`, { title: 'Low stock alert', tone: 'warning' });
      });
    },
  };
}

/* ------------------------------------------------------------------ */
/* Module                                                               */
/* ------------------------------------------------------------------ */

function search(q) {
  const s = q.toLowerCase();
  return [
    ...col('sops').filter((x) => x.title.toLowerCase().includes(s)).map((x) => ({ label: x.title, sub: 'How-to', href: href(`business-operations/sop/${x.id}`), icon: 'file-text', type: 'How-to' })),
    ...col('inventory').filter((x) => x.name.toLowerCase().includes(s)).map((x) => ({ label: x.name, sub: `Inventory · ${x.qty} ${x.unit}`, href: href('business-operations/inventory'), icon: 'tag', type: 'Item' })),
  ].slice(0, 6);
}

export default {
  slug: 'business-operations',
  nav: [
    { id: 'op-today', path: 'business-operations/checklists', label: 'Checklists', icon: 'clipboard-check' },
    { id: 'op-sops', path: 'business-operations/sops', label: 'How-tos', icon: 'file-text' },
    { id: 'op-eq', path: 'business-operations/equipment', label: 'Equipment', icon: 'zap' },
    { id: 'op-inv', path: 'business-operations/inventory', label: 'Inventory', icon: 'tag' },
  ],
  routes: [
    { pattern: 'business-operations', redirect: 'business-operations/checklists' },
    { pattern: 'business-operations/checklists', view: checklistView, nav: 'op-today' },
    { pattern: 'business-operations/sops', view: sopsView, nav: 'op-sops' },
    { pattern: 'business-operations/sop/:id', view: sopView, nav: 'op-sops' },
    { pattern: 'business-operations/equipment', view: equipmentView, nav: 'op-eq' },
    { pattern: 'business-operations/inventory', view: inventoryView, nav: 'op-inv' },
  ],
  quickActions: [{ label: 'New duty', icon: 'clipboard-check', run: () => editDuty(null) }],
  search,
};
