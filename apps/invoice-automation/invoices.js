/**
 * Invoice Automations demo.
 * Screens: Overview, Invoices and Automations, plus an invoice drawer, an
 * editor, a payment form and a preview of what the customer sees.
 * Customers are the shared CRM contacts; finished Booking Manager visits can
 * become draft invoices. Nothing is ever emailed, texted or charged.
 */
import { html, raw, icon, $, debounce, money, plural, isoDay, fromDay, date } from '../../assets/js/core/dom.js';
import * as store from '../../assets/js/core/store.js';
import * as router from '../../assets/js/core/router.js';
import { openPanel, toast, simulated, confirmDialog, menu, formData, validate } from '../../assets/js/core/ui.js';
import { badge, avatar, button, card, stat, emptyState, segmented, bindSegmented, formGrid, dataTable, barList } from '../../assets/js/core/components.js';

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */

const DAY = 86400000;
const STATUS = {
  draft: { label: 'Draft', tone: 'gray' },
  open: { label: 'Due', tone: 'blue' },
  partial: { label: 'Partly paid', tone: 'purple' },
  overdue: { label: 'Overdue', tone: 'red' },
  paid: { label: 'Paid', tone: 'green' },
  void: { label: 'Void', tone: 'gray' },
};
const METHODS = ['Card', 'Check', 'Cash', 'Bank transfer'];
const TERMS = [[0, 'Due on receipt'], [7, 'Net 7'], [14, 'Net 14'], [30, 'Net 30']];
const TAXES = [0, 5.75, 7.25, 8];

const cents = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const usd = (n) => cents.format(Number(n) || 0);
const href = (p) => router.href(p);
const cfg = () => store.get().invoicing;
const invoices = () => store.all('invoices');
const custName = (inv) => store.contactName(store.contact(inv.contactId));
const firstName = (inv) => (store.contact(inv.contactId) || {}).firstName || 'there';

export const subtotal = (inv) => inv.items.reduce((t, it) => t + (Number(it.qty) || 0) * (Number(it.price) || 0), 0);
const taxOf = (inv) => Math.round(subtotal(inv) * (inv.taxRate || 0)) / 100;
export const total = (inv) => subtotal(inv) + taxOf(inv);
const paidOf = (inv) => inv.payments.reduce((t, p) => t + p.amount, 0);
const balance = (inv) => Math.max(0, Math.round((total(inv) - paidOf(inv)) * 100) / 100);
const daysLate = (inv) => Math.floor((Date.now() - new Date(inv.dueAt).getTime()) / DAY);

export function statusOf(inv) {
  if (inv.status === 'void' || inv.status === 'draft') return inv.status;
  if (balance(inv) <= 0) return 'paid';
  if (new Date(inv.dueAt).getTime() < Date.now() - DAY / 2) return 'overdue';
  return paidOf(inv) > 0 ? 'partial' : 'open';
}
const unpaid = (inv) => ['open', 'partial', 'overdue'].includes(statusOf(inv));
const statusBadge = (inv) => { const m = STATUS[statusOf(inv)]; return badge(m.label, m.tone, { dot: true }); };

function dueLabel(inv) {
  const s = statusOf(inv);
  if (s === 'paid') { const p = inv.payments[inv.payments.length - 1]; return p ? `Paid ${date(p.at)}` : 'Paid'; }
  if (s === 'draft') return 'Not sent yet';
  if (s === 'void') return 'Voided';
  const d = daysLate(inv);
  if (d > 0) return `${plural(d, 'day')} late`;
  if (d === 0) return 'Due today';
  return `Due ${date(inv.dueAt)}`;
}

function nextNumber() {
  const c = cfg();
  const n = `${c.prefix}${c.nextNumber}`;
  store.update((s) => { s.invoicing.nextNumber += 1; });
  return n;
}

function event(inv, type, text) {
  return [...inv.events, { at: new Date().toISOString(), type, text }];
}

function log(inv, text, type = 'invoice', extra = {}) {
  store.logActivity({ type, contactId: inv.contactId, text, ...extra });
}

/** The next automatic reminder for an unpaid invoice, if any. */
function nextReminder(inv) {
  if (!unpaid(inv)) return null;
  const due = new Date(inv.dueAt).getTime();
  const rule = cfg().reminders.filter((r) => r.on).find((r) => due + r.offset * DAY > Date.now());
  return rule ? { rule, at: new Date(due + rule.offset * DAY) } : null;
}

function fillMessage(msg, inv) {
  return msg
    .replaceAll('{first_name}', firstName(inv))
    .replaceAll('{number}', inv.number)
    .replaceAll('{amount}', usd(balance(inv) || total(inv)))
    .replaceAll('{due_date}', date(inv.dueAt, true));
}

/* ------------------------------------------------------------------ */
/* Actions                                                              */
/* ------------------------------------------------------------------ */

function send(inv) {
  const now = Date.now();
  const terms = Math.round((new Date(inv.dueAt) - new Date(inv.issuedAt)) / DAY);
  store.patch('invoices', inv.id, { status: 'sent', issuedAt: new Date(now).toISOString(), dueAt: new Date(now + Math.max(0, terms) * DAY).toISOString(), events: event(inv, 'sent', 'Invoice emailed to the customer') });
  log(inv, `Invoice ${inv.number} sent for ${usd(total(inv))}`, 'invoice', { simulated: true });
  simulated(`Invoice ${inv.number} to ${custName(inv)}.`);
}

function remind(inv) {
  store.patch('invoices', inv.id, { events: event(inv, 'reminder', 'Payment reminder sent') });
  log(inv, `Payment reminder for ${inv.number} (${usd(balance(inv))})`, 'reminder', { simulated: true });
  simulated(`Payment reminder for ${inv.number} to ${custName(inv)}.`);
}

function recordPayment(inv, amount, method, at) {
  const payments = [...inv.payments, { id: `pay_${Date.now().toString(36)}`, at, amount, method }];
  const full = amount >= balance(inv) - 0.005;
  store.patch('invoices', inv.id, { payments, events: event(inv, 'payment', `${full ? 'Payment received in full' : 'Partial payment received'}: ${usd(amount)} by ${method.toLowerCase()}`) });
  log(inv, `${usd(amount)} received on ${inv.number}`, 'payment');
  const fresh = store.find('invoices', inv.id);
  if (full && cfg().thankYou) {
    store.patch('invoices', inv.id, { events: event(fresh, 'receipt', 'Thank-you receipt sent') });
    simulated(`Payment recorded and a thank-you receipt to ${custName(inv)}.`);
  } else {
    toast(`${usd(amount)} recorded on ${inv.number}.`, { title: 'Payment recorded' });
  }
}

function voidInvoice(inv) {
  confirmDialog({ title: `Void ${inv.number}?`, message: 'The customer will no longer owe this amount and reminders stop.', confirmLabel: 'Void invoice', tone: 'danger' }).then((ok) => {
    if (!ok) return;
    store.patch('invoices', inv.id, { status: 'void', events: event(inv, 'void', 'Invoice voided') });
    log(inv, `Invoice ${inv.number} voided`);
    toast(`${inv.number} is void.`, { title: 'Invoice voided' });
  });
}

function removeDraft(inv, after) {
  confirmDialog({ title: `Delete draft ${inv.number}?`, message: 'This draft has not been sent, so nobody will notice.', confirmLabel: 'Delete draft', tone: 'danger' }).then((ok) => {
    if (!ok) return;
    store.remove('invoices', inv.id);
    toast(`Draft ${inv.number} deleted.`, { title: 'Draft deleted' });
    if (after) after();
  });
}

function createInvoice({ contactId, items, terms, taxRate = cfg().taxRate, notes = '', source = { type: 'manual' }, status = 'draft' }) {
  const now = Date.now();
  const inv = store.insert('invoices', {
    number: nextNumber(), contactId, source, items, taxRate, notes, status: 'draft', payments: [],
    issuedAt: new Date(now).toISOString(), dueAt: new Date(now + terms * DAY).toISOString(),
    events: [{ at: new Date(now).toISOString(), type: 'created', text: source.type === 'appointment' ? 'Draft created from a finished visit' : 'Draft created' }],
  });
  if (status === 'sent') send(inv);
  return inv;
}

/* Finished visits that have a price but no invoice yet. */
function readyJobs() {
  const billed = new Set(invoices().filter((i) => i.source && i.source.type === 'appointment').map((i) => i.source.id));
  const services = (store.get().booking || {}).services || [];
  return store.all('appointments')
    .filter((a) => a.status === 'completed' && !billed.has(a.id))
    .map((a) => ({ a, s: services.find((s) => s.id === a.serviceId) }))
    .filter(({ s }) => s && s.price > 0)
    .sort((x, y) => (x.a.start < y.a.start ? 1 : -1));
}

function invoiceJob({ a, s }) {
  return createInvoice({ contactId: a.contactId, items: [{ desc: s.name, qty: 1, price: s.price }], terms: cfg().terms, source: { type: 'appointment', id: a.id } });
}

// Automation: a visit marked complete in Booking Manager gets a draft invoice.
store.subscribe((change) => {
  if (!change || change.col !== 'appointments' || change.type !== 'patch') return;
  const c = cfg();
  if (!c || !c.autoDraft) return;
  const job = readyJobs().find((j) => j.a.id === change.id);
  if (!job) return;
  const inv = invoiceJob(job);
  toast(`Draft ${inv.number} for ${custName(inv)} is ready in Invoices.`, { title: 'Invoice drafted automatically', tone: 'info' });
});

/* ------------------------------------------------------------------ */
/* Invoice document (shared by the drawer and the customer view)       */
/* ------------------------------------------------------------------ */

function doc(inv) {
  const c = store.contact(inv.contactId);
  const biz = store.get().business;
  return html`<article class="inv-doc">
    <header class="inv-doc__head">
      <div><div class="inv-doc__biz">${biz.name}</div><div class="inv-doc__muted">Invoice ${inv.number}</div></div>
      <div class="inv-doc__amt"><span>${statusOf(inv) === 'paid' ? 'Paid' : 'Amount due'}</span><strong>${usd(statusOf(inv) === 'paid' ? total(inv) : balance(inv))}</strong></div>
    </header>
    <dl class="inv-doc__meta">
      <div><dt>Billed to</dt><dd>${c ? store.contactName(c) : 'Customer'}${c && c.company ? html`<br>${c.company}` : ''}</dd></div>
      <div><dt>Issued</dt><dd>${date(inv.issuedAt, true)}</dd></div>
      <div><dt>Due</dt><dd>${date(inv.dueAt, true)}</dd></div>
    </dl>
    <table class="inv-doc__lines">
      <thead><tr><th>Item</th><th class="is-right">Qty</th><th class="is-right">Amount</th></tr></thead>
      <tbody>${inv.items.map((it) => html`<tr><td>${it.desc}</td><td class="is-right">${it.qty}</td><td class="is-right">${usd(it.qty * it.price)}</td></tr>`)}</tbody>
    </table>
    <dl class="inv-doc__totals">
      <div><dt>Subtotal</dt><dd>${usd(subtotal(inv))}</dd></div>
      ${inv.taxRate ? html`<div><dt>Tax (${inv.taxRate}%)</dt><dd>${usd(taxOf(inv))}</dd></div>` : ''}
      <div class="is-total"><dt>Total</dt><dd>${usd(total(inv))}</dd></div>
      ${paidOf(inv) ? html`<div><dt>Paid</dt><dd>−${usd(paidOf(inv))}</dd></div><div class="is-total"><dt>Balance</dt><dd>${usd(balance(inv))}</dd></div>` : ''}
    </dl>
    ${inv.notes ? html`<p class="inv-doc__notes">${inv.notes}</p>` : ''}
  </article>`;
}

/* ------------------------------------------------------------------ */
/* Drawer                                                               */
/* ------------------------------------------------------------------ */

const EVENT_ICON = { sent: ['send', 'blue'], reminder: ['clock', 'amber'], payment: ['dollar', 'green'], receipt: ['check-circle', 'green'], created: ['edit', 'gray'], void: ['x-circle', 'gray'], viewed: ['external', 'purple'] };

function openInvoice(id) {
  if (!store.find('invoices', id)) return;
  let api = null;
  const render = () => {
    const inv = store.find('invoices', id);
    const s = statusOf(inv);
    const c = store.contact(inv.contactId);
    const nr = nextReminder(inv);
    let acts = '';
    if (s === 'draft') acts = html`${button('Send invoice', { kind: 'primary', icon: 'send', attrs: { 'data-act': 'send' } })}${button('Edit', { icon: 'edit', attrs: { 'data-act': 'edit' } })}`;
    else if (unpaid(inv)) acts = html`${button('Record payment', { kind: 'primary', icon: 'dollar', attrs: { 'data-act': 'pay' } })}${button('Send reminder', { icon: 'send', attrs: { 'data-act': 'remind' } })}${button('Customer view', { icon: 'external', attrs: { 'data-act': 'view' } })}`;
    else if (s === 'paid') acts = html`${button('Customer view', { icon: 'external', attrs: { 'data-act': 'view' } })}${button('Duplicate', { icon: 'repeat', attrs: { 'data-act': 'dup' } })}`;
    const appt = inv.source && inv.source.type === 'appointment' ? store.find('appointments', inv.source.id) : null;
    const deal = inv.source && inv.source.type === 'deal' ? store.find('deals', inv.source.id) : null;
    return html`<div class="inv-drawer">
      <div class="inv-drawer__top">
        <div><div class="inv-drawer__num">${inv.number} ${statusBadge(inv)}</div><div class="inv-drawer__due ${s === 'overdue' ? 'is-late' : ''}">${dueLabel(inv)}</div></div>
        <div class="inv-drawer__amt">${usd(unpaid(inv) ? balance(inv) : total(inv))}<span>${unpaid(inv) ? 'balance' : 'total'}</span></div>
      </div>
      ${acts ? html`<div class="inv-drawer__actions">${acts}</div>` : ''}
      <dl class="inv-dl">
        <div><dt>Customer</dt><dd>${c ? html`<a href="${href(`crm/contacts/${c.id}`)}" data-close-panel>${store.contactName(c)}</a>` : '—'}</dd></div>
        <div><dt>Email</dt><dd>${c ? c.email : '—'}</dd></div>
        <div><dt>From</dt><dd>${appt ? html`<a href="${href(`booking-manager/bookings?appt=${appt.id}`)}" data-close-panel>Booking on ${date(appt.start)}</a>` : deal ? html`<a href="${href(`crm/pipeline?deal=${deal.id}`)}" data-close-panel>${deal.name}</a>` : 'Created by hand'}</dd></div>
        <div><dt>Automatic reminders</dt><dd>${nr ? `Next: ${date(nr.at.toISOString())} (${nr.rule.label})` : unpaid(inv) ? 'None left on the schedule' : s === 'draft' ? 'Start when it is sent' : 'Stopped, nothing owed'}</dd></div>
      </dl>
      ${doc(inv)}
      <h3 class="inv-subhead">History</h3>
      <ol class="inv-events">${[...inv.events].reverse().map((e) => { const [ic, tone] = EVENT_ICON[e.type] || ['info', 'gray']; return html`<li><span class="apwa-tone--${tone}">${icon(ic)}</span><div><strong>${e.text}</strong><span>${date(e.at, true)}${['sent', 'reminder', 'receipt'].includes(e.type) ? ' · simulated' : ''}</span></div></li>`; })}</ol>
    </div>`;
  };
  const inv0 = store.find('invoices', id);
  api = openPanel({
    title: custName(inv0),
    variant: 'drawer',
    size: 'md',
    body: `${render()}`,
    headActions: html`<button type="button" class="apwa-iconbtn" data-inv-menu aria-label="More actions" aria-haspopup="menu">${icon('more')}</button>`,
  });
  const refresh = () => {
    if (!store.find('invoices', id)) { api.close(); return; }
    api.body.innerHTML = `${render()}`;
  };
  const unsub = store.subscribe(refresh);
  const origClose = api.close;
  api.close = () => { unsub(); origClose(); };
  const later = (fn) => { api.close(); setTimeout(fn, 240); };

  api.panel.addEventListener('click', (e) => {
    const inv = store.find('invoices', id);
    if (!inv) return;
    if (e.target.closest('[data-close-panel]')) { api.close(); return; }
    const m = e.target.closest('[data-inv-menu]');
    if (m) {
      const s = statusOf(inv);
      const items = [];
      if (!inv.payments.length && s !== 'void') items.push({ label: 'Edit invoice', icon: 'edit', onClick: () => later(() => openEditor(inv)) });
      items.push({ label: 'Duplicate', icon: 'repeat', onClick: () => later(() => duplicate(inv)) });
      if (s !== 'draft' && s !== 'void') items.push({ label: 'Customer view', icon: 'external', onClick: () => customerView(inv) });
      if (s === 'draft') items.push({ label: 'Delete draft', icon: 'trash', tone: 'danger', onClick: () => removeDraft(inv) });
      else if (s !== 'void' && s !== 'paid') items.push({ label: 'Void invoice', icon: 'x-circle', tone: 'danger', onClick: () => voidInvoice(inv) });
      menu(m, items);
      return;
    }
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const act = b.dataset.act;
    if (act === 'send') send(inv);
    if (act === 'remind') remind(inv);
    if (act === 'pay') openPayment(inv);
    if (act === 'view') customerView(inv);
    if (act === 'edit') later(() => openEditor(inv));
    if (act === 'dup') later(() => duplicate(inv));
  });
}

function duplicate(inv) {
  const copy = createInvoice({ contactId: inv.contactId, items: inv.items.map((it) => ({ ...it })), terms: cfg().terms, taxRate: inv.taxRate, notes: inv.notes });
  toast(`Draft ${copy.number} created from ${inv.number}.`, { title: 'Invoice duplicated' });
  openInvoice(copy.id);
}

/* ------------------------------------------------------------------ */
/* Payment form and customer view                                      */
/* ------------------------------------------------------------------ */

function openPayment(inv) {
  openPanel({
    title: `Record a payment on ${inv.number}`,
    subtitle: `${custName(inv)} owes ${usd(balance(inv))}.`,
    size: 'sm',
    body: html`${formGrid([
      { label: 'Amount', name: 'amount', type: 'number', value: balance(inv).toFixed(2), required: true, attrs: { min: '0.01', step: '0.01', inputmode: 'decimal' } },
      { label: 'Method', name: 'method', type: 'select', value: 'Card', options: METHODS.map((m) => ({ value: m, label: m })) },
      { label: 'Date received', name: 'day', type: 'date', value: isoDay(new Date().toISOString()), span: 2 },
    ])}`,
    buttons: [{ label: 'Cancel' }, { label: 'Record payment', kind: 'primary', type: 'submit' }],
    onSubmit(form) {
      const amt = Number(form.elements.amount.value);
      if (!validate(form, { amount: (v) => (Number(v) > 0 ? (Number(v) > balance(inv) + 0.005 ? `That is more than the ${usd(balance(inv))} owed.` : '') : 'Enter an amount.') })) return false;
      const d = formData(form);
      recordPayment(store.find('invoices', inv.id), Math.round(amt * 100) / 100, d.method, d.day ? fromDay(d.day) : new Date().toISOString());
      return true;
    },
  });
}

function customerView(inv) {
  const can = unpaid(inv);
  openPanel({
    title: 'What your customer sees',
    subtitle: 'The payment page linked from every invoice and reminder.',
    size: 'md',
    body: html`<div class="inv-customer">
      ${doc(inv)}
      ${can ? html`<button type="button" class="apwa-btn apwa-btn--primary inv-customer__pay" data-demo-pay>${icon('lock')}<span>Pay ${usd(balance(inv))}</span></button>
        <p class="inv-customer__note">Demo only: pressing Pay records a test payment. No card is asked for or charged.</p>`
        : html`<p class="inv-customer__note">${statusOf(inv) === 'paid' ? 'This invoice is paid in full.' : 'Nothing to pay on this invoice.'}</p>`}
    </div>`,
    onOpen(panel, api) {
      const b = panel.querySelector('[data-demo-pay]');
      if (b) {
        b.addEventListener('click', () => {
          const fresh = store.find('invoices', inv.id);
          const amt = balance(fresh);
          const payments = [...fresh.payments, { id: `pay_${Date.now().toString(36)}`, at: new Date().toISOString(), amount: amt, method: 'Card' }];
          store.patch('invoices', inv.id, { payments, events: event(fresh, 'payment', `Paid online: ${usd(amt)} by card (test payment)`) });
          log(fresh, `${custName(fresh)} paid ${fresh.number} online (${usd(amt)})`, 'payment', { simulated: true });
          api.close();
          toast(`${custName(fresh)} paid ${usd(amt)} online. No card was charged.`, { tone: 'info', title: 'Simulated in demo mode' });
        });
      }
    },
  });
}

/* ------------------------------------------------------------------ */
/* Editor                                                               */
/* ------------------------------------------------------------------ */

function openEditor(existing = null, preset = {}) {
  const c = cfg();
  const lines = existing ? existing.items.map((it) => ({ ...it })) : (preset.items || [{ desc: '', qty: 1, price: '' }]);
  const terms0 = existing ? Math.round((new Date(existing.dueAt) - new Date(existing.issuedAt)) / DAY) : c.terms;
  const contacts = store.all('contacts').slice().sort((a, b) => store.contactName(a).localeCompare(store.contactName(b)));
  const lineRows = () => html`${lines.map((l, i) => html`<div class="inv-line" data-line="${i}">
      <input type="text" name="desc" value="${l.desc}" placeholder="Description" aria-label="Item ${i + 1} description">
      <input type="number" name="qty" value="${l.qty}" min="1" step="1" inputmode="numeric" aria-label="Item ${i + 1} quantity">
      <div class="apwa-input-affix"><span>$</span><input type="number" name="price" value="${l.price}" min="0" step="0.01" inputmode="decimal" placeholder="0.00" aria-label="Item ${i + 1} price"></div>
      <button type="button" class="apwa-iconbtn apwa-iconbtn--sm" data-del-line="${i}" aria-label="Remove item ${i + 1}" ${lines.length === 1 ? raw('disabled') : ''}>${icon('trash')}</button>
    </div>`)}`;
  const totals = (taxRate) => {
    const sub = lines.reduce((t, l) => t + (Number(l.qty) || 0) * (Number(l.price) || 0), 0);
    const tax = Math.round(sub * taxRate) / 100;
    return html`<span>Subtotal ${usd(sub)}</span>${taxRate ? html`<span>Tax ${usd(tax)}</span>` : ''}<strong>Total ${usd(sub + tax)}</strong>`;
  };
  openPanel({
    title: existing ? `Edit ${existing.number}` : 'New invoice',
    size: 'lg',
    body: html`${formGrid([
      { label: 'Customer', name: 'contactId', type: 'select', value: existing ? existing.contactId : (preset.contactId || ''), placeholder: 'Choose a customer', required: true, options: contacts.map((x) => ({ value: x.id, label: `${store.contactName(x)}${x.company ? ` · ${x.company}` : ''}` })) },
      { label: 'Payment terms', name: 'terms', type: 'select', value: terms0, options: TERMS.map(([v, l]) => ({ value: v, label: l })) },
    ])}
      <div class="inv-lines">
        <div class="inv-lines__head" aria-hidden="true"><span>Item</span><span>Qty</span><span>Price</span><span></span></div>
        <div data-lines>${lineRows()}</div>
        <button type="button" class="apwa-btn apwa-btn--ghost apwa-btn--sm" data-add-line>${icon('plus')}<span>Add item</span></button>
      </div>
      ${formGrid([
        { label: 'Sales tax', name: 'taxRate', type: 'select', value: existing ? existing.taxRate : c.taxRate, options: TAXES.map((t) => ({ value: t, label: t ? `${t}%` : 'No tax' })) },
        { label: 'Note to customer', name: 'notes', type: 'text', value: existing ? existing.notes : '', placeholder: 'Thank you for your business!' },
      ])}
      <div class="inv-lines__totals" data-totals>${totals(existing ? existing.taxRate : c.taxRate)}</div>`,
    buttons: existing && existing.status !== 'draft'
      ? [{ label: 'Cancel' }, { label: 'Save changes', kind: 'primary', type: 'submit' }]
      : [{ label: 'Cancel' }, { label: 'Save draft', kind: 'secondary', onClick: (close, panel) => { panel.dataset.mode = 'draft'; panel.requestSubmit(); return false; } }, { label: 'Save and send', kind: 'primary', type: 'submit' }],
    onOpen(panel) {
      const box = $('[data-lines]', panel);
      const tax = () => Number(panel.elements.taxRate.value) || 0;
      const redrawTotals = () => { $('[data-totals]', panel).innerHTML = `${totals(tax())}`; };
      const redraw = () => { box.innerHTML = `${lineRows()}`; redrawTotals(); };
      box.addEventListener('input', (e) => {
        const row = e.target.closest('[data-line]');
        if (!row) return;
        lines[Number(row.dataset.line)][e.target.name] = e.target.name === 'desc' ? e.target.value : e.target.value;
        redrawTotals();
      });
      panel.elements.taxRate.addEventListener('change', redrawTotals);
      panel.addEventListener('click', (e) => {
        if (e.target.closest('[data-add-line]')) { lines.push({ desc: '', qty: 1, price: '' }); redraw(); const ins = box.querySelectorAll('input[name=desc]'); ins[ins.length - 1].focus(); }
        const del = e.target.closest('[data-del-line]');
        if (del && lines.length > 1) { lines.splice(Number(del.dataset.delLine), 1); redraw(); }
      });
    },
    onSubmit(form) {
      const mode = form.dataset.mode || 'send';
      form.dataset.mode = '';
      const items = lines.map((l) => ({ desc: String(l.desc).trim(), qty: Math.max(1, Math.round(Number(l.qty) || 1)), price: Math.round((Number(l.price) || 0) * 100) / 100 })).filter((l) => l.desc || l.price);
      if (!validate(form, { contactId: 'Choose a customer.' })) return false;
      if (!items.length || items.some((l) => !l.desc)) { toast('Give every item a description.', { tone: 'danger', title: 'Almost there' }); return false; }
      const d = formData(form);
      const terms = Number(d.terms) || 0;
      const taxRate = Number(d.taxRate) || 0;
      if (existing) {
        store.patch('invoices', existing.id, { contactId: d.contactId, items, taxRate, notes: d.notes, dueAt: new Date(new Date(existing.issuedAt).getTime() + terms * DAY).toISOString() });
        if (existing.status === 'draft' && mode === 'send') send(store.find('invoices', existing.id));
        else toast(`${existing.number} saved.`, { title: 'Invoice updated' });
        return true;
      }
      const inv = createInvoice({ contactId: d.contactId, items, terms, taxRate, notes: d.notes, source: preset.source || { type: 'manual' }, status: mode === 'send' ? 'sent' : 'draft' });
      if (mode !== 'send') toast(`Draft ${inv.number} saved.`, { title: 'Draft saved' });
      return true;
    },
  });
}

/* ------------------------------------------------------------------ */
/* Overview                                                             */
/* ------------------------------------------------------------------ */

function overviewView() {
  const all = invoices();
  const open = all.filter(unpaid);
  const late = open.filter((i) => statusOf(i) === 'overdue');
  const since = Date.now() - 30 * DAY;
  const collected = all.flatMap((i) => i.payments).filter((p) => new Date(p.at).getTime() >= since).reduce((t, p) => t + p.amount, 0);
  const paidRecent = all.filter((i) => statusOf(i) === 'paid' && i.payments.length && Date.now() - new Date(i.issuedAt).getTime() < 120 * DAY);
  const avgDays = paidRecent.length ? Math.round(paidRecent.reduce((t, i) => t + (new Date(i.payments[i.payments.length - 1].at) - new Date(i.issuedAt)) / DAY, 0) / paidRecent.length) : 0;
  const ready = readyJobs();
  const age = (lo, hi) => open.filter((i) => { const d = daysLate(i); return d >= lo && d <= hi; }).reduce((t, i) => t + balance(i), 0);
  const upcoming = open.map((i) => ({ i, n: nextReminder(i) })).filter((x) => x.n).sort((a, b) => a.n.at - b.n.at).slice(0, 5);
  const payments = all.flatMap((i) => i.payments.map((p) => ({ p, i }))).sort((a, b) => (a.p.at < b.p.at ? 1 : -1)).slice(0, 5);
  const row = (i, right) => html`<li><button type="button" class="inv-row" data-open="${i.id}">${avatar(custName(i), { size: 'sm' })}<span class="inv-row__main"><strong>${custName(i)}</strong><span>${i.number} · ${dueLabel(i)}</span></span>${right}</button></li>`;
  return {
    title: 'Invoices overview',
    subtitle: 'What you are owed, what came in, and the reminders working for you.',
    actions: [{ label: 'New invoice', icon: 'plus', kind: 'primary', primary: true, onClick: () => openEditor() }],
    body: html`
      <div class="apwa-stats inv-stats">
        ${stat({ label: 'Outstanding', value: money(open.reduce((t, i) => t + balance(i), 0)), sub: plural(open.length, 'unpaid invoice'), icon: 'receipt', tone: 'blue' })}
        ${stat({ label: 'Overdue', value: money(late.reduce((t, i) => t + balance(i), 0)), sub: late.length ? plural(late.length, 'invoice') : 'Nothing late', icon: 'alert', tone: late.length ? 'red' : 'green' })}
        ${stat({ label: 'Collected, last 30 days', value: money(collected), sub: 'Card, check and transfer', icon: 'dollar', tone: 'green' })}
        ${stat({ label: 'Average time to get paid', value: avgDays ? plural(avgDays, 'day') : '—', sub: 'From invoice to payment', icon: 'clock', tone: 'purple' })}
      </div>
      ${ready.length ? html`<div class="apwa-callout inv-callout"><span class="apwa-callout__icon">${icon('check-circle')}</span><div class="apwa-callout__body"><strong>${plural(ready.length, 'finished job')} ready to invoice</strong><span>${ready.slice(0, 3).map(({ a, s }) => `${store.contactName(store.contact(a.contactId))} (${s.name})`).join(', ')}</span></div><div class="apwa-callout__actions">${button(`Create ${ready.length === 1 ? 'invoice' : `${ready.length} invoices`}`, { kind: 'primary', size: 'sm', attrs: { 'data-bill-all': '1' } })}</div></div>` : ''}
      <div class="apwa-grid apwa-grid--2 inv-grid">
        ${card({ title: 'Needs attention', actions: button('All invoices', { kind: 'ghost', size: 'sm', href: href('invoice-automation/invoices?tab=overdue') }), flush: true, body: late.length ? html`<ul class="inv-rows">${late.sort((a, b) => daysLate(b) - daysLate(a)).slice(0, 5).map((i) => row(i, html`<span class="inv-row__amt is-late">${usd(balance(i))}</span>`))}</ul>` : emptyState({ icon: 'check-circle', title: 'Nothing overdue', text: 'Every sent invoice is paid or not due yet.' }) })}
        ${card({ title: 'What customers owe', body: html`${barList([
          { label: 'Not due yet', value: age(-9999, 0), tone: 'blue' },
          { label: '1 to 15 days late', value: age(1, 15), tone: 'amber' },
          { label: '16 to 30 days late', value: age(16, 30), tone: 'amber' },
          { label: 'Over 30 days late', value: age(31, 99999), tone: 'red' },
        ])}` })}
        ${card({ title: 'Next automatic reminders', actions: button('Edit schedule', { kind: 'ghost', size: 'sm', href: href('invoice-automation/automations') }), flush: true, body: upcoming.length ? html`<ul class="inv-rows">${upcoming.map(({ i, n }) => row(i, html`<span class="inv-row__when">${icon('clock')}${date(n.at.toISOString())}</span>`))}</ul>` : emptyState({ icon: 'clock', title: 'No reminders scheduled', text: 'Turn reminders on in Automations.' }) })}
        ${card({ title: 'Recent payments', flush: true, body: payments.length ? html`<ul class="inv-rows">${payments.map(({ p, i }) => html`<li><button type="button" class="inv-row" data-open="${i.id}"><span class="inv-row__icon">${icon('dollar')}</span><span class="inv-row__main"><strong>${custName(i)}</strong><span>${i.number} · ${p.method} · ${date(p.at)}</span></span><span class="inv-row__amt is-paid">+${usd(p.amount)}</span></button></li>`)}</ul>` : emptyState({ icon: 'dollar', title: 'No payments yet' }) })}
      </div>`,
    mount(root) {
      root.addEventListener('click', (e) => {
        const o = e.target.closest('[data-open]');
        if (o) { openInvoice(o.dataset.open); return; }
        if (e.target.closest('[data-bill-all]')) {
          const made = readyJobs().map(invoiceJob);
          toast(`${plural(made.length, 'draft invoice')} created. Review and send them from Invoices.`, { title: 'Drafts ready' });
        }
      });
    },
  };
}

/* ------------------------------------------------------------------ */
/* Invoices list                                                        */
/* ------------------------------------------------------------------ */

const listUI = { tab: 'all', q: '' };
const TABS = {
  all: () => true,
  draft: (i) => statusOf(i) === 'draft',
  unpaid: (i) => ['open', 'partial'].includes(statusOf(i)),
  overdue: (i) => statusOf(i) === 'overdue',
  paid: (i) => statusOf(i) === 'paid',
};

function invoicesView(ctx) {
  if (ctx.query.tab && TABS[ctx.query.tab]) { listUI.tab = ctx.query.tab; }
  if (ctx.query.inv) setTimeout(() => { router.go('invoice-automation/invoices', { replace: true }); openInvoice(ctx.query.inv); }, 0);
  const all = invoices().slice().sort((a, b) => (a.issuedAt < b.issuedAt ? 1 : -1));
  const q = listUI.q.toLowerCase();
  const rows = all.filter(TABS[listUI.tab]).filter((i) => !q || `${i.number} ${custName(i)} ${i.items.map((x) => x.desc).join(' ')}`.toLowerCase().includes(q));
  const cols = [
    { key: 'number', label: 'Invoice', render: (i) => html`<strong>${i.number}</strong><div class="apwa-cell-sub">${i.items[0] ? i.items[0].desc : ''}</div>` },
    { key: 'customer', label: 'Customer', render: (i) => html`<span class="apwa-cell-owner">${avatar(custName(i), { size: 'xs' })}<span>${custName(i)}</span></span>` },
    { key: 'issued', label: 'Issued', render: (i) => date(i.issuedAt), hideOn: 'tablet' },
    { key: 'due', label: 'Due', render: (i) => html`<span class="${statusOf(i) === 'overdue' ? 'inv-late' : ''}">${dueLabel(i)}</span>` },
    { key: 'status', label: 'Status', render: statusBadge },
    { key: 'total', label: 'Amount', align: 'right', render: (i) => html`<strong>${usd(total(i))}</strong>${unpaid(i) && paidOf(i) ? html`<div class="apwa-cell-sub">${usd(balance(i))} left</div>` : ''}` },
  ];
  return {
    title: 'Invoices',
    subtitle: 'Every invoice, its status and what is still owed.',
    actions: [{ label: 'New invoice', icon: 'plus', kind: 'primary', primary: true, onClick: () => openEditor() }],
    body: html`
      <div class="inv-toolbar">
        <div class="apwa-input-search">${icon('search')}<input type="search" value="${listUI.q}" placeholder="Search number, customer or item…" aria-label="Search invoices" data-inv-q></div>
        ${segmented('itab', [
          { value: 'all', label: 'All', count: all.length },
          { value: 'draft', label: 'Drafts', count: all.filter(TABS.draft).length },
          { value: 'unpaid', label: 'Unpaid', count: all.filter(TABS.unpaid).length },
          { value: 'overdue', label: 'Overdue', count: all.filter(TABS.overdue).length },
          { value: 'paid', label: 'Paid', count: all.filter(TABS.paid).length },
        ], listUI.tab, { label: 'Invoice status' })}
      </div>
      ${card({ flush: true, body: dataTable(cols, rows, {
        rowLink: (i) => href(`invoice-automation/invoices?inv=${i.id}`),
        mobile: (i) => html`<span class="inv-mrow"><span><strong>${custName(i)}</strong><span>${i.number} · ${dueLabel(i)}</span></span><span class="inv-mrow__amt"><strong>${usd(unpaid(i) ? balance(i) : total(i))}</strong>${statusBadge(i)}</span></span>`,
        empty: emptyState({ icon: 'receipt', title: 'No invoices here', text: listUI.q ? 'Try a different search.' : 'Invoices in this group will show up here.' }),
      }) })}`,
    mount(root) {
      const openRow = (tr) => openInvoice(new URL(tr.dataset.href, location.href).searchParams.get('inv'));
      root.addEventListener('click', (e) => { const tr = e.target.closest('tr[data-href]'); if (tr && !e.target.closest('a, button, input')) openRow(tr); });
      root.addEventListener('keydown', (e) => { const tr = e.target.closest('tr[data-href]'); if (tr && e.key === 'Enter') openRow(tr); });
      const input = $('[data-inv-q]', root);
      input.addEventListener('input', debounce((e) => { listUI.q = e.target.value.trim(); ctx.rerender(); setTimeout(() => { const i = $('[data-inv-q]'); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }, 0); }, 250));
      bindSegmented(root, { itab: (v) => { listUI.tab = v; if (ctx.query.tab) router.go('invoice-automation/invoices', { replace: true }); else ctx.rerender(); } });
    },
  };
}

/* ------------------------------------------------------------------ */
/* Automations                                                          */
/* ------------------------------------------------------------------ */

function sw(name, checked, label, sub = '') {
  return html`<label class="inv-switch"><span class="inv-switch__text"><strong>${label}</strong>${sub ? html`<span>${sub}</span>` : ''}</span>
    <input type="checkbox" role="switch" data-set="${name}" ${checked ? raw('checked') : ''}><span class="inv-switch__ui" aria-hidden="true"></span></label>`;
}

function automationsView() {
  const c = cfg();
  const sample = invoices().find((i) => statusOf(i) === 'overdue') || invoices().find(unpaid) || invoices()[0];
  const on = c.reminders.filter((r) => r.on).length;
  return {
    title: 'Automations',
    subtitle: 'Set it once and invoices, reminders and receipts take care of themselves.',
    body: html`
      <div class="apwa-callout"><span class="apwa-callout__icon">${icon('info')}</span><div class="apwa-callout__body"><strong>Nothing is emailed or texted in this demo</strong><span>Each reminder is logged on its invoice so you can see when it would go out.</span></div></div>
      <div class="apwa-grid apwa-grid--2 inv-auto">
        ${card({ title: 'Payment reminder schedule', className: 'inv-auto__wide', body: html`
          <p class="inv-help">${on ? `${plural(on, 'reminder')} go out for every unpaid invoice, then stop as soon as it is paid.` : 'Reminders are off. Turn on at least one step.'}</p>
          <ol class="inv-sched">
            <li class="inv-sched__start"><span class="inv-sched__dot">${icon('send')}</span><strong>Invoice sent</strong><span>Day 0</span></li>
            ${c.reminders.map((r) => html`<li class="${r.on ? 'is-on' : ''} ${r.offset > 0 ? 'is-late' : ''}">
              <span class="inv-sched__dot">${icon(r.offset > 0 ? 'alert' : 'clock')}</span>
              <strong>${r.label}</strong>
              <label class="inv-sched__toggle"><input type="checkbox" role="switch" data-rem="${r.id}" ${r.on ? raw('checked') : ''} aria-label="${r.label}"><span class="inv-switch__ui" aria-hidden="true"></span></label>
            </li>`)}
          </ol>` })}
        ${card({ title: 'Reminder message', body: html`
          <div class="apwa-field"><label for="inv-msg">Message</label><textarea id="inv-msg" rows="5" data-msg>${c.message}</textarea><div class="apwa-field__hint">Use {first_name}, {number}, {amount} and {due_date}. A secure pay link is added below it.</div></div>
          ${button('Send me a test', { icon: 'send', size: 'sm', attrs: { 'data-test': '1' } })}` })}
        ${card({ title: 'Preview', body: html`<div class="inv-email">
          <div class="inv-email__meta"><span>To: ${sample ? custName(sample) : 'Customer'}</span><span>Subject: Reminder: invoice ${sample ? sample.number : ''}</span></div>
          <p data-preview>${sample ? fillMessage(c.message, sample) : c.message}</p>
          <span class="inv-email__btn">Pay invoice</span>
        </div>` })}
        ${card({ title: 'Jobs, receipts and defaults', className: 'inv-auto__wide', body: html`<div class="inv-defaults">
          <div>
            ${sw('autoDraft', c.autoDraft, 'Draft an invoice when a job is finished', 'Marking a visit completed in Booking Manager creates a draft here.')}
            ${sw('thankYou', c.thankYou, 'Send a thank-you receipt when paid in full')}
          </div>
          <div class="inv-defaults__selects">
            <label>Default payment terms<div class="apwa-select apwa-select--sm"><select data-def="terms">${TERMS.map(([v, l]) => html`<option value="${v}" ${v === c.terms ? raw('selected') : ''}>${l}</option>`)}</select>${icon('chevron-down')}</div></label>
            <label>Default sales tax<div class="apwa-select apwa-select--sm"><select data-def="taxRate">${TAXES.map((t) => html`<option value="${t}" ${t === c.taxRate ? raw('selected') : ''}>${t ? `${t}%` : 'No tax'}</option>`)}</select>${icon('chevron-down')}</div></label>
          </div>
        </div>` })}
      </div>`,
    mount(root) {
      root.addEventListener('change', (e) => {
        const rem = e.target.closest('[data-rem]');
        if (rem) { store.update((s) => { s.invoicing.reminders.find((r) => r.id === rem.dataset.rem).on = rem.checked; }); toast(`${rem.checked ? 'On' : 'Off'}: ${cfg().reminders.find((r) => r.id === rem.dataset.rem).label}.`, { title: 'Schedule updated' }); return; }
        const set = e.target.closest('[data-set]');
        if (set) { store.update((s) => { s.invoicing[set.dataset.set] = set.checked; }); toast('Saved.', { title: 'Automation updated' }); return; }
        const def = e.target.closest('[data-def]');
        if (def) { store.update((s) => { s.invoicing[def.dataset.def] = Number(def.value); }); toast('New invoices will use this.', { title: 'Default saved' }); }
      });
      const msg = $('[data-msg]', root);
      const save = debounce(() => store.update((s) => { s.invoicing.message = msg.value; }), 600);
      msg.addEventListener('input', () => {
        const prev = $('[data-preview]', root);
        if (prev && sample) prev.textContent = fillMessage(msg.value, sample);
        save();
      });
      root.addEventListener('click', (e) => {
        if (e.target.closest('[data-test]')) simulated('Test reminder to you.');
      });
    },
  };
}

/* ------------------------------------------------------------------ */
/* Module                                                               */
/* ------------------------------------------------------------------ */

function search(q) {
  const s = q.toLowerCase();
  return invoices()
    .filter((i) => `${i.number} ${custName(i)}`.toLowerCase().includes(s))
    .slice(0, 5)
    .map((i) => ({ label: `${i.number} · ${custName(i)}`, sub: `${usd(total(i))} · ${STATUS[statusOf(i)].label}`, href: href(`invoice-automation/invoices?inv=${i.id}`), icon: 'receipt', type: 'Invoice' }));
}

export default {
  slug: 'invoice-automation',
  nav: [
    { id: 'inv-overview', path: 'invoice-automation/overview', label: 'Overview', icon: 'bar-chart' },
    { id: 'inv-list', path: 'invoice-automation/invoices', label: 'Invoices', icon: 'receipt' },
    { id: 'inv-auto', path: 'invoice-automation/automations', label: 'Automations', icon: 'zap' },
  ],
  routes: [
    { pattern: 'invoice-automation', redirect: 'invoice-automation/overview' },
    { pattern: 'invoice-automation/overview', view: overviewView, nav: 'inv-overview' },
    { pattern: 'invoice-automation/invoices', view: invoicesView, nav: 'inv-list' },
    { pattern: 'invoice-automation/automations', view: automationsView, nav: 'inv-auto' },
  ],
  quickActions: [
    { label: 'New invoice', icon: 'receipt', run: () => openEditor() },
  ],
  search,
};
