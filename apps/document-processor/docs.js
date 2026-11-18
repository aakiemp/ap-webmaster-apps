/**
 * AI Document Processor demo.
 * Screens: Inbox, a review page per document (preview beside the fields it
 * read), Exports and Settings. "Reading" is simulated on built-in sample
 * files: nothing is uploaded and no real AI runs. Approved customer forms can
 * become CRM contacts, and work orders can become draft invoices.
 */
import { html, raw, icon, $, $$, plural, date, ago } from '../../assets/js/core/dom.js';
import * as store from '../../assets/js/core/store.js';
import * as ind from '../../assets/js/core/industry.js';
import * as router from '../../assets/js/core/router.js';
import { openPanel, toast, confirmDialog } from '../../assets/js/core/ui.js';
import { badge, button, card, stat, emptyState, segmented, bindSegmented, dataTable, barList } from '../../assets/js/core/components.js';

/* ------------------------------------------------------------------ */
/* Document types and samples                                          */
/* ------------------------------------------------------------------ */

const DAY = 86400000;
const href = (p) => router.href(p);

const TYPES = {
  invoice: { label: 'Supplier invoice', icon: 'receipt', tone: 'blue', key: 'vendor', amount: 'total', fields: [['vendor', 'Vendor'], ['number', 'Invoice number'], ['date', 'Invoice date'], ['due', 'Due date'], ['subtotal', 'Subtotal'], ['tax', 'Tax'], ['total', 'Total']] },
  receipt: { label: 'Receipt', icon: 'file-text', tone: 'green', key: 'merchant', amount: 'total', fields: [['merchant', 'Merchant'], ['date', 'Date'], ['category', 'Category'], ['payment', 'Paid with'], ['total', 'Total']] },
  intake: { label: 'New customer form', icon: 'user-plus', tone: 'purple', key: 'name', fields: [['first', 'First name'], ['last', 'Last name'], ['phone', 'Phone'], ['email', 'Email'], ['city', 'City'], ['service', 'Service needed'], ['when', 'Preferred date']] },
  workorder: { label: 'Work order', icon: 'clipboard-check', tone: 'amber', key: 'customer', amount: 'amount', fields: [['number', 'Work order'], ['customer', 'Customer'], ['tech', 'Technician'], ['work', 'Work done'], ['hours', 'Hours'], ['amount', 'Amount to bill']] },
};

const STATUS = {
  processing: { label: 'Reading…', tone: 'gray' },
  review: { label: 'Needs review', tone: 'amber' },
  approved: { label: 'Approved', tone: 'green' },
  exported: { label: 'Exported', tone: 'blue' },
};

/* f(value, confidence) */
const f = (v, c = 0.98) => ({ v, c });

/** Sample files a visitor can "upload". Built fresh each time. */
function samples() {
  const contacts = store.all('contacts');
  const pick = (i) => contacts[i % Math.max(1, contacts.length)];
  const d = (n) => date(new Date(Date.now() - n * DAY).toISOString(), true);
  const w1 = pick(5);
  const w2 = pick(11);
  const out = [
    { type: 'invoice', file: 'acme-supply-inv-20931.pdf', from: 'Email inbox', f: { vendor: f('Acme Supply Co.'), number: f('20931'), date: f(d(2)), due: f(d(-28), 0.71), subtotal: f('$1,148.15'), tax: f('$91.85'), total: f('$1,240.00') }, lines: [['Copper pipe 3/4" x 10ft', 12, '$418.80'], ['PEX fittings, box', 6, '$329.70'], ['Shutoff valves', 15, '$399.65']] },
    { type: 'receipt', file: 'IMG_4471.jpg', from: 'Phone scan', f: { merchant: f('Lakeside Fuel Stop'), date: f(d(1)), category: f('Fuel'), payment: f('Card ending 4417', 0.97), total: f('$86.40') } },
    { type: 'intake', file: 'new-customer-form-scan.pdf', from: 'Upload', f: { first: f('Dana'), last: f('Whitfield'), phone: f('(330) 555-0188', 0.82), email: f('dana.whitfield@example.com'), city: f('Lakewood'), service: f('Gutter cleaning'), when: f('Next Tuesday morning', 0.76) } },
    { type: 'workorder', file: 'work-order-5512.pdf', from: 'Email inbox', contactId: w1 && w1.id, f: { number: f('WO-5512'), customer: f(w1 ? store.contactName(w1) : 'Customer'), tech: f('Marcus Reed'), work: f('Replaced condensate pump, flushed drain line'), hours: f('2.5', 0.79), amount: f('$385.00') } },
    { type: 'workorder', file: 'work-order-5517.pdf', from: 'Upload', contactId: w2 && w2.id, f: { number: f('WO-5517'), customer: f(w2 ? store.contactName(w2) : 'Customer'), tech: f('Priya Shah'), work: f('Annual furnace tune-up'), hours: f('1.5'), amount: f('$129.00') } },
    { type: 'invoice', file: 'brightline-electric-7781.pdf', from: 'Email inbox', f: { vendor: f('Brightline Electric Supply'), number: f('7781'), date: f(d(9)), due: f(d(-21)), subtotal: f('$612.00'), tax: f('$48.96'), total: f('$666.96', 0.68) }, lines: [['20A breakers', 12, '$228.00'], ['12/2 wire, 250ft', 2, '$384.00']] },
  ];
  const P = ind.pack().docs;
  if (P) {
    const ren = (o, k, v) => { o.f[k] = f(v, o.f[k].c); };
    ren(out[0], 'vendor', P.vendor); out[0].lines.forEach((l, i) => { l[0] = P.lines[i] || l[0]; }); out[0].file = `${P.vendor.toLowerCase().replace(/[^a-z]+/g, '-')}inv-20931.pdf`;
    ren(out[1], 'merchant', P.merchant); ren(out[1], 'category', P.category);
    ren(out[2], 'service', P.service);
    ren(out[3], 'work', P.work1); ren(out[4], 'work', P.work2);
    ren(out[5], 'vendor', P.vendor2); out[5].lines.forEach((l, i) => { l[0] = P.lines2[i] || l[0]; }); out[5].file = `${P.vendor2.toLowerCase().replace(/[^a-z]+/g, '-')}-7781.pdf`;
  }
  return out;
}

function makeDoc(sample, status, receivedAt) {
  return {
    type: sample.type,
    file: sample.file,
    from: sample.from,
    status,
    receivedAt,
    contactId: sample.contactId || null,
    lines: sample.lines || null,
    fields: TYPES[sample.type].fields.map(([k, label]) => ({ k, label, v: sample.f[k] ? sample.f[k].v : '', c: sample.f[k] ? sample.f[k].c : 0.5, edited: false })),
    events: [{ at: receivedAt, text: `Received from ${sample.from.toLowerCase()}` }, { at: receivedAt, text: `Read ${TYPES[sample.type].fields.length} fields automatically` }],
  };
}

function seed() {
  const s = samples();
  const now = Date.now();
  const iso = (h) => new Date(now - h * 3600000).toISOString();
  const rows = [
    [s[0], 'review', 2], [s[2], 'review', 5], [s[3], 'review', 20], [s[5], 'review', 26],
    [s[1], 'approved', 30], [s[4], 'approved', 50],
  ].map(([smp, st, h], i) => ({ id: `doc${i + 1}`, createdAt: iso(h), ...makeDoc(smp, st, iso(h)) }));
  // Older history, already exported.
  const old = [['Acme Supply Co.', 'invoice', 4], ['Lakeside Fuel Stop', 'receipt', 6], ['Northgate Hardware', 'receipt', 8], ['Brightline Electric Supply', 'invoice', 11], ['Acme Supply Co.', 'invoice', 15], ['City Water Dept.', 'invoice', 19]];
  old.forEach(([name0, type, days], i) => {
    const name = ((ind.pack().docs || {}).old || [])[i] || name0;
    const base = samples().find((x) => x.type === type);
    const doc = makeDoc({ ...base, f: { ...base.f, [TYPES[type].key]: f(name), [TYPES[type].amount]: f(`$${(120 + i * 97.35).toFixed(2)}`) } }, 'exported', new Date(now - days * DAY).toISOString());
    doc.fields.forEach((x) => { x.c = Math.max(x.c, 0.9); });
    doc.exportedAt = new Date(now - (days - 1) * DAY).toISOString();
    doc.exportTo = i % 2 ? 'QuickBooks' : 'CSV file';
    doc.file = `${name.toLowerCase().replace(/[^a-z]+/g, '-')}${i}.pdf`;
    rows.push({ id: `doc${rows.length + 1}`, createdAt: doc.receivedAt, ...doc });
  });
  return {
    documents: rows,
    docSettings: { autoApprove: true, checkTotals: true, threshold: 0.9, exportTo: 'CSV file', inbox: `docs@${ind.slug()}.example` },
  };
}

const docs = () => store.ensure('documents', seed) && store.all('documents');
const cfg = () => { store.ensure('documents', seed); return store.get().docSettings; };
const val = (doc, k) => (doc.fields.find((x) => x.k === k) || {}).v || '';
const title = (doc) => (doc.type === 'intake' ? `${val(doc, 'first')} ${val(doc, 'last')}`.trim() : val(doc, TYPES[doc.type].key)) || doc.file;
const amount = (doc) => (TYPES[doc.type].amount ? val(doc, TYPES[doc.type].amount) : '');
const toNum = (s) => Number(String(s).replace(/[^0-9.-]/g, '')) || 0;
const unsure = (doc) => doc.fields.filter((x) => !x.edited && x.c < cfg().threshold);
const statusBadge = (doc) => badge(STATUS[doc.status].label, STATUS[doc.status].tone, { dot: true });

/** Problems a person should look at before approving. */
function issues(doc) {
  const out = unsure(doc).map((x) => ({ k: x.k, text: `${x.label}: not sure it read this right` }));
  if (doc.type === 'invoice' && cfg().checkTotals) {
    const sum = toNum(val(doc, 'subtotal')) + toNum(val(doc, 'tax'));
    if (Math.abs(sum - toNum(val(doc, 'total'))) > 0.01) out.push({ k: 'total', text: `Totals don't add up: subtotal plus tax is $${sum.toFixed(2)}` });
  }
  return out;
}

function addEvent(doc, text) { return [...doc.events, { at: new Date().toISOString(), text }]; }

/* ------------------------------------------------------------------ */
/* Actions                                                              */
/* ------------------------------------------------------------------ */

const timers = new Set();

function upload(list) {
  const now = new Date().toISOString();
  const made = list.map((smp) => store.insert('documents', makeDoc(smp, 'processing', now)));
  made.forEach((doc, i) => {
    const t = setTimeout(() => {
      timers.delete(t);
      const cur = store.find('documents', doc.id);
      if (!cur) return;
      const clean = !issues(cur).length;
      const auto = clean && cfg().autoApprove;
      store.patch('documents', doc.id, { status: auto ? 'approved' : 'review', events: auto ? addEvent(cur, 'Approved automatically: every field read with high confidence') : cur.events });
      if (i === made.length - 1) toast(made.length > 1 ? `${plural(made.length, 'document')} read. Check the ones marked Needs review.` : `${title(cur)} is ready${auto ? ' and approved automatically' : ' to review'}.`, { title: 'Reading finished' });
    }, 1400 + i * 650);
    timers.add(t);
  });
}

function approve(doc, next = true) {
  const left = issues(doc);
  store.patch('documents', doc.id, { status: 'approved', fields: doc.fields.map((x) => ({ ...x, c: Math.max(x.c, 0.99) })), events: addEvent(doc, left.length ? `Approved with ${plural(left.length, 'warning')} accepted` : 'Approved after review') });
  toast(`${title(doc)} is approved and ready to export.`, { title: 'Approved' });
  if (!next) return;
  const queue = docs().filter((d) => d.status === 'review' && d.id !== doc.id);
  router.go(queue.length ? `document-processor/doc/${queue[0].id}` : 'document-processor/inbox');
}

function removeDoc(doc) {
  confirmDialog({ title: `Delete ${doc.file}?`, message: 'It disappears from the inbox. Nothing else changes.', confirmLabel: 'Delete', tone: 'danger' }).then((ok) => {
    if (!ok) return;
    store.remove('documents', doc.id);
    toast(`${doc.file} deleted.`, { title: 'Document deleted' });
    router.go('document-processor/inbox');
  });
}

function addToCrm(doc) {
  const email = val(doc, 'email').toLowerCase();
  const found = store.all('contacts').find((c) => email && (c.email || '').toLowerCase() === email);
  if (found) { store.patch('documents', doc.id, { contactId: found.id }); toast(`${store.contactName(found)} is already in your contacts, so the form was linked to them.`, { title: 'Already a contact' }); return; }
  const row = store.insert('contacts', {
    firstName: val(doc, 'first'), lastName: val(doc, 'last'), company: '', title: '', email: val(doc, 'email'), phone: val(doc, 'phone'),
    status: 'lead', source: 'Document Processor', ownerId: store.get().currentUserId, city: val(doc, 'city'), state: 'OH', tags: ['New customer form'], lastActivityAt: new Date().toISOString(),
  });
  store.logActivity({ type: 'note', contactId: row.id, text: `Created from a new customer form. Wants: ${val(doc, 'service')}, ${val(doc, 'when')}.` });
  store.patch('documents', doc.id, { contactId: row.id, events: addEvent(store.find('documents', doc.id), 'Added to Customer Manager') });
  toast(`${store.contactName(row)} was added to Customer Manager.`, { title: 'Contact created' });
}

function billWorkOrder(doc) {
  const inv = store.get().invoicing;
  if (!inv || !doc.contactId) { toast('This work order has no matching customer.', { tone: 'danger', title: 'Cannot bill' }); return; }
  const now = Date.now();
  const number = `${inv.prefix}${inv.nextNumber}`;
  store.update((s) => { s.invoicing.nextNumber += 1; });
  const row = store.insert('invoices', {
    number, contactId: doc.contactId, source: { type: 'document', id: doc.id }, items: [{ desc: `${val(doc, 'work')} (${val(doc, 'number')})`, qty: 1, price: toNum(val(doc, 'amount')) }],
    taxRate: inv.taxRate || 0, notes: '', status: 'draft', payments: [], issuedAt: new Date(now).toISOString(), dueAt: new Date(now + (inv.terms || 14) * DAY).toISOString(),
    events: [{ at: new Date(now).toISOString(), type: 'created', text: `Draft created from work order ${val(doc, 'number')}` }],
  });
  store.patch('documents', doc.id, { invoiceId: row.id, events: addEvent(store.find('documents', doc.id), `Draft invoice ${number} created`) });
  toast(`Draft ${number} for ${val(doc, 'customer')} is waiting in Invoices.`, { title: 'Invoice drafted' });
}

function csvFor(list) {
  const q = (s) => `"${String(s).replace(/"/g, '""')}"`;
  const keys = [];
  list.forEach((d) => d.fields.forEach((x) => { if (!keys.includes(x.label)) keys.push(x.label); }));
  const head = ['Document', 'Type', 'Received', ...keys].map(q).join(',');
  const rows = list.map((d) => [d.file, TYPES[d.type].label, date(d.receivedAt, true), ...keys.map((k) => (d.fields.find((x) => x.label === k) || {}).v || '')].map(q).join(','));
  return [head, ...rows].join('\r\n');
}

function exportDocs(list, to) {
  if (!list.length) return;
  if (to === 'CSV file') {
    const blob = new Blob([csvFor(list)], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `documents-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }
  const at = new Date().toISOString();
  store.update((s) => { s.documents.forEach((d) => { if (list.some((x) => x.id === d.id)) { d.status = 'exported'; d.exportedAt = at; d.exportTo = to; d.events = [...d.events, { at, text: `Exported to ${to}` }]; } }); });
  if (to === 'CSV file') toast(`${plural(list.length, 'document')} saved to a CSV file on this device.`, { title: 'Exported' });
  else toast(`${plural(list.length, 'document')} would be sent to ${to}. Nothing left this browser.`, { tone: 'info', title: 'Simulated in demo mode' });
}

/* ------------------------------------------------------------------ */
/* Upload panel                                                         */
/* ------------------------------------------------------------------ */

function openUpload() {
  const list = samples();
  openPanel({
    title: 'Add documents',
    subtitle: 'Pick sample files to see how the reading works.',
    size: 'md',
    body: html`<div class="dp-up">
      <div class="dp-up__drop">${icon('scan')}<strong>In the full version you drop files here, forward email or snap a photo</strong><span>This demo never reads files from your device. Use the samples below instead.</span></div>
      <ul class="dp-up__list">${list.map((smp, i) => html`<li><label class="dp-up__item"><input type="checkbox" value="${i}" ${i < 2 ? raw('checked') : ''}><span class="dp-ic apwa-tone--${TYPES[smp.type].tone}">${icon(TYPES[smp.type].icon)}</span><span class="dp-up__text"><strong>${smp.file}</strong><span>${TYPES[smp.type].label} · ${smp.from}</span></span></label></li>`)}</ul>
    </div>`,
    buttons: [{ label: 'Cancel' }, { label: 'Read selected', kind: 'primary', onClick: (close, panel) => {
      const picked = $$('input[type=checkbox]:checked', panel).map((c) => list[Number(c.value)]);
      if (!picked.length) { toast('Pick at least one sample.', { tone: 'danger', title: 'Nothing selected' }); return false; }
      upload(picked);
      router.go('document-processor/inbox');
      return true;
    } }],
  });
}

/* ------------------------------------------------------------------ */
/* Inbox                                                                */
/* ------------------------------------------------------------------ */

const ui = { tab: 'review' };
const TABS = { review: (d) => d.status === 'review' || d.status === 'processing', approved: (d) => d.status === 'approved', exported: (d) => d.status === 'exported', all: () => true };

function confidence(doc) {
  if (doc.status === 'processing') return html`<span class="dp-reading"><i></i><i></i><i></i></span>`;
  const n = issues(doc).length;
  return n ? html`<span class="dp-flag">${icon('alert')}${plural(n, 'thing')} to check</span>` : html`<span class="dp-ok">${icon('check-circle')}All fields clear</span>`;
}

function inboxView(ctx) {
  const all = docs().slice().sort((a, b) => (a.receivedAt < b.receivedAt ? 1 : -1));
  if (ctx.query.tab && TABS[ctx.query.tab]) ui.tab = ctx.query.tab;
  const rows = all.filter(TABS[ui.tab]);
  const week = all.filter((d) => Date.now() - new Date(d.receivedAt).getTime() < 7 * DAY && d.status !== 'processing');
  const fields = week.reduce((t, d) => t + d.fields.length, 0);
  const auto = week.reduce((t, d) => t + d.fields.filter((x) => !x.edited).length, 0);
  const cols = [
    { key: 'doc', label: 'Document', render: (d) => html`<span class="dp-cell"><span class="dp-ic apwa-tone--${TYPES[d.type].tone}">${icon(TYPES[d.type].icon)}</span><span><strong>${title(d)}</strong><span class="apwa-cell-sub">${TYPES[d.type].label} · ${d.file}</span></span></span>` },
    { key: 'amt', label: 'Amount', align: 'right', render: (d) => amount(d) || '—', hideOn: 'tablet' },
    { key: 'from', label: 'Received', render: (d) => html`${ago(d.receivedAt)}<div class="apwa-cell-sub">${d.from}</div>` },
    { key: 'check', label: 'Check', render: confidence },
    { key: 'status', label: 'Status', render: statusBadge },
  ];
  return {
    title: 'Document inbox',
    subtitle: 'Invoices, receipts and forms read for you. Check the flagged fields, approve, export.',
    actions: [{ label: 'Add documents', icon: 'plus', kind: 'primary', primary: true, fabIcon: 'scan', onClick: openUpload }],
    body: html`
      <div class="apwa-stats dp-stats">
        ${stat({ label: 'Needs review', value: all.filter((d) => d.status === 'review').length, sub: 'Waiting for a quick check', icon: 'alert', tone: 'amber' })}
        ${stat({ label: 'Read this week', value: week.length, sub: plural(fields, 'field'), icon: 'scan', tone: 'blue' })}
        ${stat({ label: 'Read without fixes', value: fields ? `${Math.round((auto / fields) * 100)}%` : '—', sub: 'Fields nobody had to change', icon: 'check-circle', tone: 'green' })}
        ${stat({ label: 'Typing saved', value: `${Math.max(1, Math.round((fields * 8) / 60))} min`, sub: 'About 8 seconds a field', icon: 'clock', tone: 'purple' })}
      </div>
      <div class="dp-toolbar">
        ${segmented('dtab', [
          { value: 'review', label: 'Needs review', count: all.filter(TABS.review).length },
          { value: 'approved', label: 'Approved', count: all.filter(TABS.approved).length },
          { value: 'exported', label: 'Exported', count: all.filter(TABS.exported).length },
          { value: 'all', label: 'All', count: all.length },
        ], ui.tab, { label: 'Document status' })}
        <span class="dp-toolbar__mail">${icon('mail')}Forward to <strong>${cfg().inbox}</strong></span>
      </div>
      ${card({ flush: true, body: dataTable(cols, rows, {
        rowLink: (d) => href(`document-processor/doc/${d.id}`),
        mobile: (d) => html`<span class="dp-mrow"><span class="dp-ic apwa-tone--${TYPES[d.type].tone}">${icon(TYPES[d.type].icon)}</span><span class="dp-mrow__main"><strong>${title(d)}</strong><span>${TYPES[d.type].label} · ${ago(d.receivedAt)}</span>${confidence(d)}</span>${statusBadge(d)}</span>`,
        empty: emptyState({ icon: 'inbox', title: ui.tab === 'review' ? 'All caught up' : 'Nothing here yet', text: ui.tab === 'review' ? 'New documents land here once they are read.' : '', action: ui.tab === 'review' ? button('Add documents', { kind: 'primary', icon: 'plus', attrs: { 'data-up': '1' } }) : '' }),
      }) })}`,
    mount(root) {
      root.addEventListener('click', (e) => {
        if (e.target.closest('[data-up]')) { openUpload(); return; }
        const tr = e.target.closest('tr[data-href]');
        if (tr) router.go(tr.dataset.href.replace(router.href(''), ''));
      });
      root.addEventListener('keydown', (e) => { const tr = e.target.closest('tr[data-href]'); if (tr && e.key === 'Enter') router.go(tr.dataset.href.replace(router.href(''), '')); });
      bindSegmented(root, { dtab: (v) => { ui.tab = v; if (ctx.query.tab) router.go('document-processor/inbox', { replace: true }); else ctx.rerender(); } });
    },
  };
}

/* ------------------------------------------------------------------ */
/* Review page                                                          */
/* ------------------------------------------------------------------ */

function paper(doc) {
  const v = (k) => html`<mark data-k="${k}">${val(doc, k) || '—'}</mark>`;
  const biz = store.get().business.name;
  if (doc.type === 'invoice') {
    return html`<div class="dp-paper__row"><div><b class="dp-paper__big">${v('vendor')}</b><small>Wholesale supply · Akron, OH</small></div><div class="dp-paper__r"><b>INVOICE</b><small>No. ${v('number')}</small></div></div>
      <div class="dp-paper__row"><small>Bill to<br><b>${biz}</b></small><small>Date ${v('date')}<br>Due ${v('due')}</small></div>
      <table class="dp-paper__tbl"><tr><th>Item</th><th>Qty</th><th>Amount</th></tr>${(doc.lines || []).map((l) => html`<tr><td>${l[0]}</td><td>${l[1]}</td><td>${l[2]}</td></tr>`)}</table>
      <div class="dp-paper__tot"><span>Subtotal ${v('subtotal')}</span><span>Tax ${v('tax')}</span><strong>Total ${v('total')}</strong></div>`;
  }
  if (doc.type === 'receipt') {
    return html`<div class="dp-paper__rcpt"><b class="dp-paper__big">${v('merchant')}</b><small>Store #2231</small><small>${v('date')} 7:42 AM</small><hr><div class="dp-paper__row"><span>Unleaded, 22.1 gal</span><span>${v('total')}</span></div><hr><div class="dp-paper__row"><b>TOTAL</b><b>${v('total')}</b></div><small>${v('payment')}</small><small>Category: ${v('category')}</small><small>Thank you!</small></div>`;
  }
  if (doc.type === 'intake') {
    return html`<b class="dp-paper__big">${biz}</b><small>New customer form</small>
      <div class="dp-paper__form"><span>First name</span>${v('first')}<span>Last name</span>${v('last')}<span>Phone</span>${v('phone')}<span>Email</span>${v('email')}<span>City</span>${v('city')}<span>What do you need?</span>${v('service')}<span>Best day to visit</span>${v('when')}</div>
      <small class="dp-paper__hand">Signed: ${val(doc, 'first')} ${val(doc, 'last')}</small>`;
  }
  return html`<div class="dp-paper__row"><div><b class="dp-paper__big">${biz}</b><small>Work order ${v('number')}</small></div><div class="dp-paper__r"><small>Tech</small><b>${v('tech')}</b></div></div>
    <div class="dp-paper__form"><span>Customer</span>${v('customer')}<span>Work done</span>${v('work')}<span>Hours on site</span>${v('hours')}<span>Amount to bill</span>${v('amount')}</div>
    <small class="dp-paper__hand">Customer signature on file</small>`;
}

function docView(ctx) {
  docs();
  const doc = store.find('documents', ctx.params.id);
  if (!doc) return { title: 'Document not found', back: href('document-processor/inbox'), body: emptyState({ icon: 'file-text', title: 'This document is gone', text: 'It may have been deleted or the demo was reset.', action: button('Back to inbox', { kind: 'primary', href: href('document-processor/inbox') }) }) };
  const t = TYPES[doc.type];
  const probs = issues(doc);
  const flagged = new Set(probs.map((p) => p.k));
  const contact = doc.contactId ? store.contact(doc.contactId) : null;
  const invoice = doc.invoiceId ? store.find('invoices', doc.invoiceId) : null;
  let extra = '';
  if (doc.status !== 'review' && doc.status !== 'processing') {
    if (doc.type === 'intake') extra = contact ? html`<p class="dp-link">${icon('check-circle')}In Customer Manager as <a href="${href(`crm/contacts/${contact.id}`)}">${store.contactName(contact)}</a></p>` : button('Add to Customer Manager', { icon: 'user-plus', attrs: { 'data-crm': '1' } });
    if (doc.type === 'workorder') extra = invoice ? html`<p class="dp-link">${icon('check-circle')}Billed on <a href="${href(`invoice-automation/invoices?inv=${invoice.id}`)}">${invoice.number}</a></p>` : button('Create draft invoice', { icon: 'receipt', attrs: { 'data-bill': '1' } });
  }
  return {
    title: title(doc),
    crumb: { label: 'Inbox', href: href('document-processor/inbox') },
    back: href('document-processor/inbox'),
    subtitle: `${t.label} · ${doc.file} · received ${ago(doc.receivedAt)} from ${doc.from.toLowerCase()}`,
    body: html`<div class="dp-review">
      <section class="dp-review__doc" aria-label="Document preview">
        <div class="dp-review__bar"><span>${icon('file-text')}${doc.file}</span><span class="apwa-text-3">Sample file</span></div>
        <div class="dp-paper dp-paper--${doc.type}">${paper(doc)}</div>
      </section>
      <section class="dp-review__fields">
        ${card({ title: 'What it read', actions: statusBadge(doc), body: html`
          ${doc.status === 'processing' ? html`<p class="dp-wait"><span class="dp-reading"><i></i><i></i><i></i></span>Reading the document…</p>` : ''}
          ${probs.length && doc.status === 'review' ? html`<div class="dp-issues">${probs.map((p) => html`<p>${icon('alert')}${p.text}</p>`)}</div>` : ''}
          <form class="dp-fields" data-fields>${doc.fields.map((x) => html`<label class="dp-field ${flagged.has(x.k) ? 'is-flag' : ''}" data-k="${x.k}">
            <span class="dp-field__label">${x.label}${x.edited ? html`<em class="dp-tag">Edited</em>` : flagged.has(x.k) ? html`<em class="dp-tag dp-tag--warn">Check</em>` : html`<em class="dp-tag dp-tag--ok">${Math.round(x.c * 100)}%</em>`}</span>
            <input type="text" name="${x.k}" value="${x.v}" ${doc.status === 'exported' ? raw('readonly') : ''}>
          </label>`)}</form>
          <div class="dp-actions">
            ${doc.status === 'review' ? html`${button(probs.length ? 'Approve anyway' : 'Approve', { kind: 'primary', icon: 'check', attrs: { 'data-approve': '1' } })}` : ''}
            ${extra}
            ${doc.status !== 'exported' ? button('Delete', { kind: 'ghost', icon: 'trash', attrs: { 'data-del': '1' } }) : ''}
          </div>` })}
        ${card({ title: 'History', body: html`<ol class="dp-events">${[...doc.events].reverse().map((e) => html`<li><strong>${e.text}</strong><span>${date(e.at, true)}</span></li>`)}</ol>` })}
      </section>
    </div>`,
    mount(root) {
      const form = $('[data-fields]', root);
      const hi = (k, on) => $$(`mark[data-k="${k}"]`, root).forEach((m) => m.classList.toggle('is-hi', on));
      root.addEventListener('focusin', (e) => { const l = e.target.closest('[data-k]'); if (l && l.tagName === 'LABEL') hi(l.dataset.k, true); });
      root.addEventListener('focusout', (e) => { const l = e.target.closest('[data-k]'); if (l && l.tagName === 'LABEL') hi(l.dataset.k, false); });
      form.addEventListener('submit', (e) => e.preventDefault());
      const refresh = () => {
        const cur = store.find('documents', doc.id);
        if (!cur) return;
        const left = issues(cur);
        const keys = new Set(left.map((p) => p.k));
        cur.fields.forEach((x) => {
          const l = $(`label[data-k="${x.k}"]`, form);
          if (!l) return;
          l.classList.toggle('is-flag', keys.has(x.k));
          if (x.edited) $('.dp-tag', l).outerHTML = '<em class="dp-tag">Edited</em>';
        });
        const box = $('.dp-issues', root);
        if (box) { box.innerHTML = left.map((p) => `<p>${icon('alert')}${p.text.replace(/</g, '&lt;')}</p>`).join(''); box.hidden = !left.length; }
        const btn = $('[data-approve] span', root);
        if (btn) btn.textContent = left.length ? 'Approve anyway' : 'Approve';
      };
      form.addEventListener('input', (e) => {
        const name = e.target.name;
        if (!name) return;
        $$(`mark[data-k="${name}"]`, root).forEach((m) => { m.textContent = e.target.value || '—'; });
        store.quietly((s) => {
          const cur = (s.documents || []).find((d) => d.id === doc.id);
          const x = cur && cur.fields.find((y) => y.k === name);
          if (x) Object.assign(x, { v: e.target.value, edited: true, c: 1 });
        });
        refresh();
      });
      root.addEventListener('click', (e) => {
        const cur = store.find('documents', doc.id);
        if (!cur) return;
        if (e.target.closest('[data-approve]')) approve(cur);
        if (e.target.closest('[data-del]')) removeDoc(cur);
        if (e.target.closest('[data-crm]')) addToCrm(cur);
        if (e.target.closest('[data-bill]')) billWorkOrder(cur);
      });
    },
  };
}

/* ------------------------------------------------------------------ */
/* Exports                                                              */
/* ------------------------------------------------------------------ */

const DESTS = [['CSV file', 'download', 'Download a spreadsheet to this device'], ['QuickBooks', 'external', 'Bills and expenses, ready to match'], ['Google Sheets', 'external', 'Adds rows to a shared sheet']];

function exportsView() {
  const ready = docs().filter((d) => d.status === 'approved');
  const done = docs().filter((d) => d.status === 'exported').sort((a, b) => (a.exportedAt < b.exportedAt ? 1 : -1));
  const to = cfg().exportTo;
  const byType = Object.keys(TYPES).map((k) => ({ label: TYPES[k].label, value: done.filter((d) => d.type === k).length, tone: TYPES[k].tone })).filter((x) => x.value);
  return {
    title: 'Exports',
    subtitle: 'Send approved documents to your spreadsheet or accounting app.',
    body: html`<div class="apwa-grid apwa-grid--2 dp-grid">
      ${card({ title: `Ready to export (${ready.length})`, flush: true, body: ready.length ? html`<ul class="dp-pick">${ready.map((d) => html`<li><label><input type="checkbox" value="${d.id}" checked><span class="dp-ic apwa-tone--${TYPES[d.type].tone}">${icon(TYPES[d.type].icon)}</span><span class="dp-pick__main"><strong>${title(d)}</strong><span>${TYPES[d.type].label}${amount(d) ? ` · ${amount(d)}` : ''}</span></span></label></li>`)}</ul>
        <div class="dp-dest">${DESTS.map(([name, ic, sub]) => html`<label class="dp-dest__opt"><input type="radio" name="dest" value="${name}" ${name === to ? raw('checked') : ''}><span>${icon(ic)}<strong>${name}</strong><small>${sub}</small></span></label>`)}</div>
        <div class="dp-dest__go">${button('Export selected', { kind: 'primary', icon: 'download', attrs: { 'data-export': '1' } })}</div>`
        : emptyState({ icon: 'check-circle', title: 'Nothing waiting', text: 'Approve documents in the inbox and they show up here.', action: button('Open the inbox', { href: href('document-processor/inbox') }) }) })}
      ${card({ title: 'Exported so far', body: done.length ? html`${barList(byType)}<ul class="dp-hist">${done.slice(0, 6).map((d) => html`<li><a href="${href(`document-processor/doc/${d.id}`)}"><strong>${title(d)}</strong><span>${d.exportTo} · ${date(d.exportedAt)}</span></a></li>`)}</ul>` : emptyState({ icon: 'download', title: 'No exports yet' }) })}
    </div>`,
    mount(root) {
      root.addEventListener('change', (e) => { if (e.target.name === 'dest') store.update((s) => { s.docSettings.exportTo = e.target.value; }); });
      root.addEventListener('click', (e) => {
        if (!e.target.closest('[data-export]')) return;
        const ids = $$('.dp-pick input:checked', root).map((c) => c.value);
        if (!ids.length) { toast('Tick at least one document.', { tone: 'danger', title: 'Nothing selected' }); return; }
        exportDocs(docs().filter((d) => ids.includes(d.id)), cfg().exportTo);
      });
    },
  };
}

/* ------------------------------------------------------------------ */
/* Settings                                                             */
/* ------------------------------------------------------------------ */

function sw(name, checked, label, sub) {
  return html`<label class="dp-switch"><span><strong>${label}</strong><span>${sub}</span></span><input type="checkbox" role="switch" data-set="${name}" ${checked ? raw('checked') : ''}><i aria-hidden="true"></i></label>`;
}

function settingsView() {
  const c = cfg();
  return {
    title: 'Document settings',
    subtitle: 'Which documents it reads, what it pulls out and when it asks you to check.',
    body: html`<div class="apwa-grid apwa-grid--2 dp-grid">
      ${card({ title: 'Rules', body: html`
        ${sw('autoApprove', c.autoApprove, 'Approve clear documents automatically', 'When every field is read with high confidence, skip the review step.')}
        ${sw('checkTotals', c.checkTotals, 'Check that totals add up', 'Flag invoices where subtotal plus tax does not match the total.')}
        <label class="dp-range"><strong>Ask me to check fields below</strong><span><input type="range" min="0.7" max="0.99" step="0.01" value="${c.threshold}" data-threshold><b data-th>${Math.round(c.threshold * 100)}%</b></span><small>Lower means fewer checks, higher means more.</small></label>
        <p class="dp-mailbox">${icon('mail')}Documents emailed to <strong>${c.inbox}</strong> land in the inbox. Simulated in this demo.</p>` })}
      ${card({ title: 'Document types', flush: true, body: html`<ul class="dp-types">${Object.entries(TYPES).map(([k, t]) => html`<li><span class="dp-ic apwa-tone--${t.tone}">${icon(t.icon)}</span><span><strong>${t.label}</strong><span class="dp-types__f">${t.fields.map(([, l]) => html`<em>${l}</em>`)}</span></span></li>`)}</ul>
        <p class="dp-types__more">${icon('plus')}Your own document types and fields are set up during installation.</p>` })}
    </div>`,
    mount(root) {
      root.addEventListener('change', (e) => {
        const s = e.target.closest('[data-set]');
        if (s) { store.update((st) => { st.docSettings[s.dataset.set] = s.checked; }); toast('Saved.', { title: 'Setting updated' }); }
        if (e.target.matches('[data-threshold]')) { store.update((st) => { st.docSettings.threshold = Number(e.target.value); }); toast(`Fields under ${Math.round(Number(e.target.value) * 100)}% confidence will be flagged.`, { title: 'Saved' }); }
      });
      root.addEventListener('input', (e) => { if (e.target.matches('[data-threshold]')) $('[data-th]', root).textContent = `${Math.round(Number(e.target.value) * 100)}%`; });
    },
  };
}

/* ------------------------------------------------------------------ */
/* Module                                                               */
/* ------------------------------------------------------------------ */

// Anything still "reading" after a reload just finishes.
store.subscribe((change) => { if (change && change.type === 'reset') timers.forEach(clearTimeout); });
setTimeout(() => {
  const stuck = docs().filter((d) => d.status === 'processing');
  stuck.forEach((d) => store.patch('documents', d.id, { status: 'review' }));
}, 0);

function search(q) {
  const s = q.toLowerCase();
  return docs().filter((d) => `${title(d)} ${d.file} ${TYPES[d.type].label}`.toLowerCase().includes(s)).slice(0, 5)
    .map((d) => ({ label: title(d), sub: `${TYPES[d.type].label} · ${STATUS[d.status].label}`, href: href(`document-processor/doc/${d.id}`), icon: TYPES[d.type].icon, type: 'Document' }));
}

export default {
  slug: 'document-processor',
  nav: [
    { id: 'dp-inbox', path: 'document-processor/inbox', label: 'Inbox', icon: 'inbox' },
    { id: 'dp-exports', path: 'document-processor/exports', label: 'Exports', icon: 'download' },
    { id: 'dp-settings', path: 'document-processor/settings', label: 'Settings', icon: 'sliders' },
  ],
  routes: [
    { pattern: 'document-processor', redirect: 'document-processor/inbox' },
    { pattern: 'document-processor/inbox', view: inboxView, nav: 'dp-inbox' },
    { pattern: 'document-processor/doc/:id', view: docView, nav: 'dp-inbox' },
    { pattern: 'document-processor/exports', view: exportsView, nav: 'dp-exports' },
    { pattern: 'document-processor/settings', view: settingsView, nav: 'dp-settings' },
  ],
  quickActions: [
    { label: 'Add documents', icon: 'scan', run: () => openUpload() },
  ],
  search,
};
