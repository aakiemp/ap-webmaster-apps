/**
 * Field to Forest booking app demo. One file, no build step.
 * Made-up families and sitters, saved in this browser only. Nothing is sent,
 * charged or posted anywhere: Square, calendars and messages are simulated.
 */
const CFG = window.APWA_CONFIG || {};
const IMG = CFG.img || '';
const KEY = 'f2f.demo.v1';
const TOUR_KEY = 'f2f.tour.v1';

/* ---------- small helpers ---------- */
const esc = (v) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
class Raw { constructor(s) { this.s = s; } toString() { return this.s; } }
const raw = (s) => new Raw(String(s ?? ''));
const toH = (v) => (v == null || v === false ? '' : v instanceof Raw ? v.s : Array.isArray(v) ? v.map(toH).join('') : esc(v));
const html = (str, ...vals) => raw(str.reduce((o, s, i) => o + s + (i < vals.length ? toH(vals[i]) : ''), ''));
const EXTRA = {
  paw: '<circle cx="5.5" cy="10" r="2"/><circle cx="9.5" cy="5.5" r="2"/><circle cx="14.5" cy="5.5" r="2"/><circle cx="18.5" cy="10" r="2"/><path d="M12 11.5c-3 0-5.5 3.4-5.5 5.8 0 1.6 1.2 2.7 2.8 2.7 1.1 0 1.8-.6 2.7-.6s1.6.6 2.7.6c1.6 0 2.8-1.1 2.8-2.7 0-2.4-2.5-5.8-5.5-5.8z"/>',
  kid: '<circle cx="12" cy="12" r="9"/><path d="M8.5 14.5a4 4 0 0 0 7 0"/><path d="M9 9.5h.01M15 9.5h.01"/>',
  bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
  moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
};
const icon = (n, cls = '') => raw(`<svg class="f2f-icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${EXTRA[n] || (CFG.icons || {})[n] || (CFG.icons || {}).grid || ''}</svg>`);
const uid = (p) => `${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const money = (n) => `$${(Math.round(n * 100) / 100).toFixed(Number.isInteger(n) ? 0 : 2)}`;
const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/* ---------- dates ---------- */
const pad = (n) => String(n).padStart(2, '0');
const isoOf = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const dayOf = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const T0 = new Date(); T0.setHours(0, 0, 0, 0);
const TODAY = isoOf(T0);
const plus = (n) => { const d = new Date(T0); d.setDate(d.getDate() + n); return isoOf(d); };
const diffDays = (a, b) => Math.round((dayOf(b) - dayOf(a)) / 86400000);
const fWk = new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
const fMd = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });
const dayLabel = (s) => { const k = diffDays(TODAY, s); return k === 0 ? 'Today' : k === 1 ? 'Tomorrow' : fWk.format(dayOf(s)); };
const shortDay = (s) => fWk.format(dayOf(s));
const t12 = (t, ap = true) => { let [h, m] = t.split(':').map(Number); const pm = h >= 12; h = h % 12 || 12; return `${h}${m ? `:${pad(m)}` : ''}${ap ? (pm ? ' PM' : ' AM') : ''}`; };
const span = (a, b) => ((+a.slice(0, 2) >= 12) === (+b.slice(0, 2) >= 12) ? `${t12(a, false)}–${t12(b)}` : `${t12(a)}–${t12(b)}`);
const hrs = (a, b) => { const m = (s) => +s.slice(0, 2) * 60 + +s.slice(3); return (m(b) - m(a)) / 60; };
const ago = (ts) => { const s = (Date.now() - ts) / 1000; if (s < 60) return 'Just now'; if (s < 3600) return `${Math.floor(s / 60)} min ago`; if (s < 86400) return `${Math.floor(s / 3600)} hr ago`; const d = Math.floor(s / 86400); return d === 1 ? 'Yesterday' : `${d} days ago`; };
const HOUR = 3600000;

/* ---------- pricing (Field to Forest's current rules) ---------- */
const FEES = [40, 60, 80, 100, 120, 140, 160, 180, 200, 200];
const bookingFee = (n) => (n <= 0 ? 0 : n > 10 ? 200 : FEES[n - 1]);
const RATE = { 1: 30, 2: 32, 3: 35, 4: 40 };
const hourly = (kids) => RATE[Math.min(Math.max(kids, 1), 4)];
const depRate = (kids) => (kids >= 4 ? 10 : 9);
const PET = { feeNew: 20, feeBack: 10, overnight: (p) => (p >= 3 ? 95 : 85), visit: (p) => (p >= 3 ? 33 : 28) };

/* ---------- sample data ---------- */
const SITTERS = [
  { id: 'maya', name: 'Maya R.', color: '#b9862a' },
  { id: 'jordan', name: 'Jordan T.', color: '#5d7a3a' },
  { id: 'elena', name: 'Elena S.', color: '#5f7686' },
  { id: 'avery', name: 'Avery B.', color: '#8a6a86' },
];
const ME = 'maya';
const OWNER = { id: 'rachel', name: 'Rachel', color: '#42532b' };
const kidsLine = (k, ages) => `${plural(k, 'kid')} · ${k === 1 ? 'age' : 'ages'} ${ages}`;
function postFor(r) {
  if (r.type === 'pet') return [`${r.service}${r.end ? ` · ${plural(diffDays(r.date, r.end), 'night')}` : ''}`, r.pets, `📍${r.loc}`].join('\n');
  return [kidsLine(r.kids, r.ages), `📍${r.loc}`, r.allergy ? `Allergy: ${r.allergy}` : '', r.event ? `💒 ${r.event}` : ''].filter(Boolean).join('\n');
}

function seed() {
  const now = Date.now();
  const fams = [
    { id: 'f1', name: 'Sarah K.', type: 'childcare', returning: false, contact: { phone: '(406) 555-0142', email: 'sarah.k@example.com', address: '118 Birch Hill Rd, Whitefish' }, extra: { adults: 'Both parents out', insurance: 'No' } },
    { id: 'f2', name: 'Priya P.', type: 'pet', returning: false, contact: { phone: '(406) 555-0177', email: 'priya.p@example.com', address: '42 Cedar Ln, Columbia Falls' }, extra: { vet: 'Valley Animal Clinic (sample)', trained: 'House-trained, spayed/neutered, vaccines current' } },
    { id: 'f3', name: 'Dana L.', type: 'childcare', returning: true, contact: { phone: '(406) 555-0119', email: 'dana.l@example.com', address: '9 Larch Ct, Kalispell' } },
    { id: 'f4', name: 'Chris M.', type: 'childcare', returning: true, contact: { phone: '(406) 555-0163', email: 'chris.m@example.com', address: '301 Aspen Way, Whitefish' } },
    { id: 'f5', name: 'Morgan W.', type: 'pet', returning: true, billed: true, contact: { phone: '(406) 555-0128', email: 'morgan.w@example.com', address: '77 Spruce St, Whitefish' } },
    { id: 'f6', name: 'Taylor H.', type: 'childcare', returning: true, contact: { phone: '(406) 555-0185', email: 'taylor.h@example.com', address: '15 Juniper Dr, Bigfork' } },
  ];
  const kRow = (n, date, start, end, extra = {}) => ({ n, date, start, end, kids: 2, ages: '4 & 7', loc: 'Whitefish: Birch Hill Rd', allergy: 'peanuts (EpiPen in the kitchen)', ...extra });
  const r1rows = [
    kRow(1, plus(3), '17:00', '21:00'),
    kRow(2, plus(5), '09:00', '13:00'),
    kRow(3, plus(8), '18:00', '22:00'),
    kRow(4, plus(10), '17:00', '21:00'),
    kRow(5, plus(12), '12:00', '18:00', { kids: 3, ages: '4, 7 & 10 (cousin visiting)', event: 'Wedding' }),
  ].map((r) => ({ ...r, type: 'childcare', post: postFor({ ...r, type: 'childcare' }) }));
  const petRow = { n: 1, type: 'pet', date: plus(6), end: plus(9), start: '18:00', end_t: '09:00', service: 'Overnight stay', pets: '2 dogs: Biscuit (golden retriever) and Juniper (beagle mix)', loc: 'Columbia Falls: Cedar Ln' };
  petRow.post = postFor(petRow);
  const requests = [
    { id: 'r1', fam: 'f1', type: 'childcare', status: 'review', at: now - 2 * HOUR, rows: r1rows, notes: 'Friendly dog in the house. Bedtime is 8 PM. Snacks in the pantry are fine.' },
    { id: 'r2', fam: 'f2', type: 'pet', status: 'review', at: now - 5 * HOUR, rows: [petRow], notes: 'Feed twice a day. Juniper gets one pill with dinner. Free meet and greet requested.' },
  ];
  const J = (o) => ({ interested: [], sitter: null, status: 'open', checks: {}, ...o });
  const jobs = [
    J({ id: 'j1', fam: 'f3', type: 'childcare', n: 1, date: plus(1), start: '18:00', end: '22:00', kids: 3, ages: '2, 5 & 9', loc: 'Kalispell: Larch Ct', status: 'backup', sitter: 'jordan', backupNote: 'Family emergency, so sorry!' }),
    J({ id: 'j2', fam: 'f3', type: 'childcare', n: 2, date: plus(2), start: '17:00', end: '23:00', kids: 3, ages: '2, 5 & 9', loc: 'Kalispell: Larch Ct', status: 'assigned', sitter: 'elena' }),
    J({ id: 'j3', fam: 'f4', type: 'childcare', n: 1, date: plus(2), start: '13:00', end: '17:00', kids: 1, ages: '3', loc: 'Whitefish: Aspen Way', status: 'assigned', sitter: 'maya' }),
    J({ id: 'j4', fam: 'f4', type: 'childcare', n: 2, date: plus(4), start: '16:00', end: '22:00', kids: 1, ages: '3', loc: 'Whitefish: Aspen Way' }),
    J({ id: 'j5', fam: 'f5', type: 'pet', n: 1, date: TODAY, start: '12:00', end: '12:30', service: '30-minute drop-in', pets: '2 cats: Pepper and Mochi', loc: 'Whitefish: Spruce St', status: 'assigned', sitter: 'maya', mg: 'done', list: ['Fresh food and water', 'Scoop the litter box', 'Playtime and cuddles', 'Send the family a photo'] }),
    J({ id: 'j6', fam: 'f6', type: 'childcare', n: 1, date: plus(7), start: '18:00', end: '23:00', kids: 2, ages: '1 & 6', loc: 'Bigfork: Juniper Dr', status: 'interest', interested: [{ id: 'avery', at: now - 3 * HOUR }] }),
  ];
  jobs.forEach((j) => { j.post = postFor(j); });
  const history = [
    { at: now - 26 * HOUR, who: 'rachel', text: 'Assigned Elena S. to Dana L. · ' + shortDay(plus(2)), job: 'j2' },
    { at: now - 20 * HOUR, who: 'rachel', text: 'Assigned Maya R. to Chris M. · ' + shortDay(plus(2)), job: 'j3' },
    { at: now - 5 * HOUR, who: 'system', text: 'New pet-sitting request from Priya P.', fam: 'f2' },
    { at: now - 3 * HOUR, who: 'avery', text: 'Interested in Taylor H. · ' + shortDay(plus(7)), job: 'j6' },
    { at: now - 2 * HOUR, who: 'system', text: 'New babysitting request from Sarah K. (5 dates)', fam: 'f1' },
    { at: now - 40 * 60000, who: 'jordan', text: 'Asked for a backup on Dana L. · ' + shortDay(plus(1)), job: 'j1' },
  ];
  const invoices = [{ id: 'i1', fam: 'f4', status: 'draft', at: now - 19 * HOUR }, { id: 'i2', fam: 'f3', status: 'draft', at: now - 25 * HOUR }];
  return { v: 1, role: 'owner', fams, requests, jobs, invoices, history };
}

let db;
try { db = JSON.parse(localStorage.getItem(KEY)); } catch (e) { db = null; }
if (!db || db.v !== 1) db = seed();
let saveT;
const save = () => { clearTimeout(saveT); saveT = setTimeout(() => { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) { /* private mode: lasts this visit */ } }, 120); };

let tour = (() => { try { return JSON.parse(localStorage.getItem(TOUR_KEY)) || {}; } catch (e) { return {}; } })();
const saveTour = () => { try { localStorage.setItem(TOUR_KEY, JSON.stringify(tour)); } catch (e) { /* fine */ } };

const ui = { tab: 'today', seg: 'review', day: null, filter: 'all', q: '', stab: 'open', sheet: null, more: false };

/* ---------- lookups ---------- */
const fam = (id) => db.fams.find((f) => f.id === id) || { name: '?' };
const job = (id) => db.jobs.find((j) => j.id === id);
const req = (id) => db.requests.find((r) => r.id === id);
const inv = (id) => db.invoices.find((i) => i.id === id);
const person = (id) => (id === 'rachel' ? OWNER : SITTERS.find((s) => s.id === id) || { name: 'Field to Forest', color: '#a0a897' });
const first = (id) => person(id).name.split(' ')[0];
const ini = (n) => n.split(/\s+/).map((p) => p[0]).join('').slice(0, 2).toUpperCase();
const av = (id, cls = '') => { const p = person(id); return html`<span class="av ${cls}" style="background:${p.color}" title="${p.name}">${p.id ? ini(p.name) : raw(icon('sparkles').s)}</span>`; };
const isOwner = () => db.role === 'owner';
const active = (j) => j.status !== 'closed';
const upcoming = (j) => (j.end_d || j.date) >= TODAY;
const famJobs = (fid) => db.jobs.filter((j) => j.fam === fid);
const famInvoice = (fid) => db.invoices.find((i) => i.fam === fid);
const typeIcon = (t) => (t === 'pet' ? 'paw' : 'kid');
const typeLabel = (t) => (t === 'pet' ? 'Pet sitting' : 'Babysitting');
const when = (j) => (j.type === 'pet' && j.end_d ? `${fMd.format(dayOf(j.date))}–${fMd.format(dayOf(j.end_d))}` : `${dayLabel(j.date)} · ${span(j.start, j.end)}`);
const what = (j) => (j.type === 'pet' ? j.pets.split(':')[0] : kidsLine(j.kids, j.ages));
const log = (who, text, ref = {}) => { db.history.push({ at: Date.now(), who, text, ...ref }); };
const R1 = 'r1';
const isR1Fam = (fid) => fid === 'f1';

/* ---------- invoices ---------- */
function invoiceFor(fid) {
  const f = fam(fid);
  const js = famJobs(fid).filter(active).sort((a, b) => a.date.localeCompare(b.date));
  const lines = [];
  let note = '';
  if (f.type === 'pet') {
    lines.push({ label: `Booking Fee${f.returning ? '' : ' (first booking)'}`, amt: f.returning ? PET.feeBack : PET.feeNew });
    js.forEach((j) => {
      const pets = Number((j.pets.match(/\d+/) || [2])[0]);
      if (j.end_d) { const n = diffDays(j.date, j.end_d); lines.push({ label: `Overnight stay — ${fMd.format(dayOf(j.date))} to ${fMd.format(dayOf(j.end_d))}`, sub: `${plural(n, 'night')} × ${money(PET.overnight(pets))} (${plural(pets, 'pet')})`, amt: n * PET.overnight(pets) }); } else { lines.push({ label: `${j.service} — ${shortDay(j.date)}`, sub: `1 visit × ${money(PET.visit(pets))}`, amt: PET.visit(pets) }); }
    });
    note = 'Pet-sitting prices come from your public rates. Holiday surcharges and deposit rules can be added before this goes live.';
    return { title: `Field to Forest — Pet Sitting — ${f.name}`, lines, note, total: lines.reduce((t, l) => t + l.amt, 0), proposal: true };
  }
  lines.push({ label: `Booking Fee — ${plural(js.length, 'Date')}`, amt: bookingFee(js.length) });
  const tiers = new Set();
  js.forEach((j) => {
    const h = hrs(j.start, j.end); const d = depRate(j.kids); tiers.add(Math.min(j.kids, 4));
    lines.push({ label: `Babysitting Deposit — ${shortDay(j.date)}, ${span(j.start, j.end)} · ${plural(j.kids, 'child', 'children')}`, sub: `${h} hrs × ${money(d)}/hr`, amt: h * d });
  });
  note = 'Your sitter is paid directly at the visit. ' + [...tiers].sort().map((k) => `${k >= 4 ? '4+' : k} ${k === 1 ? 'child' : 'children'}: ${money(hourly(k))}/hr total, ${money(depRate(k))}/hr deposit paid here, ${money(hourly(k) - depRate(k))}/hr to your sitter.`).join(' ');
  return { title: `Field to Forest — Babysitting Booking — ${f.name}`, lines, note, total: lines.reduce((t, l) => t + l.amt, 0), proposal: false };
}

/* ---------- what needs Rachel ---------- */
function needs() {
  const out = [];
  db.requests.filter((r) => r.status !== 'approved').forEach((r) => out.push({ ic: 'inbox', tone: 'gold', title: `New request from ${fam(r.fam).name}`, sub: r.type === 'pet' ? `Pet sitting · ${r.rows[0].service}, ${plural(diffDays(r.rows[0].date, r.rows[0].end), 'night')}` : `Babysitting · ${plural(r.rows.length, 'date')}`, act: 'open-req', id: r.id, btn: 'Review', tour: r.id === R1 ? 'review' : '' }));
  const js = db.jobs.filter((j) => active(j) && upcoming(j)).sort((a, b) => a.date.localeCompare(b.date));
  js.filter((j) => j.status === 'backup').forEach((j) => out.push({ ic: 'alert', tone: 'red', title: `${first(j.sitter)} needs a backup`, sub: `${fam(j.fam).name} · ${when(j)}`, act: 'open-job', id: j.id, btn: 'Find backup' }));
  js.filter((j) => j.status === 'interest').forEach((j) => out.push({ ic: 'user-plus', tone: 'green', title: `${j.interested.map((i) => first(i.id)).join(' and ')} ${j.interested.length > 1 ? 'are' : 'is'} interested`, sub: `${fam(j.fam).name} · ${when(j)}`, act: 'open-job', id: j.id, btn: 'Assign', tour: isR1Fam(j.fam) ? 'assign' : '' }));
  const open = js.filter((j) => j.status === 'open' && diffDays(TODAY, j.date) <= 7);
  [...new Set(open.map((j) => j.fam))].forEach((fid) => {
    const list = open.filter((j) => j.fam === fid);
    out.push({ ic: 'calendar', tone: 'gold', title: 'No sitter yet', sub: `${fam(fid).name} · ${list.length > 1 ? `${list.length} dates this week, first ${dayLabel(list[0].date)}` : when(list[0])}`, act: 'open-job', id: list[0].id, btn: 'Find sitter' });
  });
  [...new Set(js.map((j) => j.fam))].forEach((fid) => {
    if (famInvoice(fid) || fam(fid).billed) return;
    if (!famJobs(fid).some((j) => j.status === 'assigned' || j.status === 'backup')) return;
    const f = fam(fid);
    out.push({ ic: 'receipt', tone: 'sage', title: `Ready to invoice: ${f.name}`, sub: f.type === 'pet' ? 'Pet-sitting draft' : `Booking fee and deposits · ${plural(famJobs(fid).filter(active).length, 'date')}`, act: 'invoice', id: fid, btn: 'Preview', tour: isR1Fam(fid) ? 'invoice' : '' });
  });
  return out;
}

/* ---------- guided tour ---------- */
const TOUR = [
  { id: 'review', text: 'A new babysitting request just came in from the website. Tap <b>Review</b>.', role: 'owner', go: () => { ui.tab = 'today'; ui.sheet = null; } },
  { id: 'approve', text: 'This is what sitters will see. Change any line if you like, then tap <b>Approve</b>.', role: 'owner', go: () => { ui.sheet = { t: 'req', id: R1 }; } },
  { id: 'switch', text: 'Now see it from a sitter’s phone. Tap <b>Rachel</b> at the top and choose Maya.', role: 'owner', go: () => { ui.sheet = null; }, spots: ['switch', 'to-sitter'] },
  { id: 'interest', text: 'Sarah K.’s five dates are on Maya’s board. Tap <b>I’m interested</b> on one.', role: 'sitter', go: () => { ui.stab = 'open'; ui.sheet = null; } },
  { id: 'switchback', text: 'Rachel gets that right away. Tap <b>Maya</b> at the top and switch back to Rachel.', role: 'sitter', go: () => { ui.sheet = null; }, spots: ['switch', 'to-owner'] },
  { id: 'assign', text: 'Maya’s interest is waiting on your Today screen. Tap <b>Assign</b>, then choose Maya.', role: 'owner', go: () => { ui.tab = 'today'; ui.sheet = null; }, spots: ['assign', 'assign-maya'] },
  { id: 'invoice', text: 'Last step: see the Square invoice draft for Sarah K. Tap <b>Create invoice</b> (or <b>Preview</b> on Today).', role: 'owner', go: () => { ui.tab = 'today'; ui.sheet = null; }, spots: ['invoice', 'invoice-btn'] },
];
const step = () => (tour.on ? TOUR[tour.step] : null);
function tourHit(id) {
  const s = step();
  if (!s || s.id !== id) return;
  tour.step += 1;
  if (tour.step >= TOUR.length) { tour.on = false; tour.done = true; tour.finish = true; }
  saveTour();
}

/* ---------- toasts ---------- */
function toast(msg, action) {
  const box = document.querySelector('.toasts');
  if (!box) return;
  const t = document.createElement('div');
  t.className = 'toast';
  t.setAttribute('role', 'status');
  t.innerHTML = `${icon('check-circle').s}<span>${esc(msg)}</span>${action ? `<button type="button">${esc(action.label)}</button>` : ''}`;
  if (action) t.querySelector('button').onclick = () => { t.remove(); action.run(); };
  box.appendChild(t);
  setTimeout(() => t.remove(), action ? 5000 : 3200);
}

/* ---------- views: owner ---------- */
function needCard(n) {
  return html`<button class="card need" data-act="${n.act}" data-id="${n.id}">
    <span class="ic ${n.tone}">${icon(n.ic)}</span>
    <span class="grow"><span class="ttl">${n.title}</span><span class="line2 trunc" style="display:block">${n.sub}</span></span>
    <span class="btn sec sm" data-tour="${n.tour || ''}">${n.btn}</span></button>`;
}
function visitRow(j, showFam = true) {
  const right = j.status === 'assigned' ? av(j.sitter, 'sm') : html`<span class="pill ${j.status}">${statusLabel(j)}</span>`;
  return html`<button class="visit" data-act="open-job" data-id="${j.id}">
    <span class="time"><b>${j.type === 'pet' && j.end_d ? fMd.format(dayOf(j.date)) : t12(j.start)}</b>${j.type === 'pet' && j.end_d ? `${diffDays(j.date, j.end_d)} nights` : dayLabel(j.date).replace(/^\w+, /, '')}</span>
    <span class="grow"><span class="ttl trunc" style="display:block">${showFam ? fam(j.fam).name : what(j)}</span><span class="line2 trunc" style="display:block">${icon(typeIcon(j.type), 'mini')}${showFam ? what(j) : j.loc}</span></span>
    ${right}</button>`;
}
function statusLabel(j) {
  return { open: 'Needs a sitter', interest: `${plural(j.interested.length, 'sitter')} interested`, assigned: first(j.sitter || ''), backup: 'Needs backup', closed: 'Closed', done: 'Done' }[j.status] || j.status;
}
function greet() { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; }

function viewToday() {
  const ns = needs();
  const next = db.jobs.filter((j) => active(j) && upcoming(j) && (j.status === 'assigned' || j.status === 'backup')).sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start)).slice(0, 4);
  return html`<h1>${greet()}, Rachel</h1>
    <p class="sub">${ns.length ? `${plural(ns.length, 'thing')} ${ns.length === 1 ? 'needs' : 'need'} you. Everything else is on track.` : 'Nothing needs you right now.'}</p>
    ${ns.length ? html`<div class="needs">${ns.map(needCard)}</div>` : html`<div class="card allclear"><span class="ic green">${icon('check')}</span><b>All caught up</b><div class="line2">New requests and sitter updates show up here.</div></div>`}
    <div class="sec"><h2>Coming up</h2><button class="chip-btn" data-act="tab" data-tab="schedule">See the week</button></div>
    <div class="card">${next.length ? next.map((j) => visitRow(j)) : html`<div class="empty">No visits booked yet.</div>`}</div>`;
}

function viewRequests() {
  const review = db.requests.filter((r) => r.status !== 'approved');
  const seg = html`<div class="seg" role="tablist"><button class="${ui.seg === 'review' ? 'on' : ''}" data-act="seg" data-seg="review">To review${review.length ? ` (${review.length})` : ''}</button><button class="${ui.seg === 'booked' ? 'on' : ''}" data-act="seg" data-seg="booked">Booked</button></div>`;
  if (ui.seg === 'review') {
    return html`<h1>Requests</h1><p class="sub">From your website forms. Nothing reaches sitters until you approve it.</p>${seg}
      <div class="stack">${review.length ? review.map((r) => { const f = fam(r.fam); return html`<button class="card need" data-act="open-req" data-id="${r.id}"><span class="ic ${r.type === 'pet' ? 'sage' : 'gold'}">${icon(typeIcon(r.type))}</span><span class="grow"><span class="ttl">${f.name}</span><span class="line2" style="display:block">${typeLabel(r.type)} · ${r.type === 'pet' ? `${fMd.format(dayOf(r.rows[0].date))}–${fMd.format(dayOf(r.rows[0].end))}` : plural(r.rows.length, 'date')} · ${ago(r.at)}</span></span>${r.status === 'draft' ? html`<span class="pill gray">Draft</span>` : ''}${icon('chevron-right')}</button>`; }) : html`<div class="card empty">You're all caught up. New requests land here.</div>`}</div>`;
  }
  const q = ui.q.trim().toLowerCase();
  const fids = [...new Set(db.jobs.map((j) => j.fam))]
    .map((fid) => ({ f: fam(fid), js: famJobs(fid).sort((a, b) => a.date.localeCompare(b.date)) }))
    .filter(({ f, js }) => !q || `${f.name} ${typeLabel(f.type)} ${js.map((j) => `${shortDay(j.date)} ${dayLabel(j.date)} ${j.loc} ${j.service || ''}`).join(' ')}`.toLowerCase().includes(q))
    .sort((a, b) => a.js[0].date.localeCompare(b.js[0].date));
  return html`<h1>Requests</h1><p class="sub">Each family stays together. Every date can be handled on its own.</p>${seg}
    <label class="search">${icon('search')}<span class="sr">Search bookings</span><input id="q" data-input="q" type="search" placeholder="Search a family, date or service" value="${ui.q}"></label>
    <div class="stack">${fids.length ? fids.map(({ f, js }) => { const i = famInvoice(f.id); return html`<div class="card">
      <div class="fam-h"><span class="ic ${f.type === 'pet' ? 'sage' : 'gold'}">${icon(typeIcon(f.type))}</span><span class="grow"><span class="ttl">${f.name}</span><span class="line2" style="display:block">${typeLabel(f.type)} · ${plural(js.length, 'date')}</span></span>${i ? html`<button class="pill ${invPill(i)}" data-act="open-inv" data-id="${i.id}">${invLabel(i)}</button>` : ''}</div>
      ${js.map((j) => visitRow(j, false))}</div>`; }) : html`<div class="card empty">No bookings match “${ui.q}”.</div>`}</div>`;
}

function viewSchedule() {
  const days = Array.from({ length: 7 }, (_, k) => plus(k));
  const inWeek = db.jobs.filter((j) => active(j) && j.date >= TODAY && j.date <= days[6]);
  const fit = (j) => ui.filter === 'all' || (ui.filter === 'open' ? j.status === 'open' || j.status === 'interest' : j.status === ui.filter);
  const list = inWeek.filter((j) => fit(j) && (!ui.day || j.date === ui.day)).sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
  const groups = [...new Set(list.map((j) => j.date))];
  const F = [['all', 'All'], ['open', 'Open'], ['assigned', 'Covered'], ['backup', 'Needs backup']];
  return html`<h1>This week</h1><p class="sub">Babysitting and pet visits together, with who's covering each one.</p>
    <div class="week">${days.map((d) => { const js = inWeek.filter((j) => j.date === d); const dd = dayOf(d); return html`<button class="day ${ui.day === d ? 'on' : ''}" data-act="day" data-day="${d}" aria-pressed="${ui.day === d}">${d === TODAY ? 'Today' : dd.toLocaleDateString('en-US', { weekday: 'short' })}<b>${dd.getDate()}</b><span class="dots">${js.slice(0, 3).map((j) => raw(`<i class="${j.status}"></i>`))}</span></button>`; })}</div>
    <div class="filters">${F.map(([k, l]) => html`<button class="${ui.filter === k ? 'on' : ''}" data-act="filter" data-f="${k}">${l}</button>`)}</div>
    ${groups.length ? groups.map((d) => html`<div class="group-day">${dayLabel(d)}${d === TODAY || diffDays(TODAY, d) === 1 ? `, ${fMd.format(dayOf(d))}` : ''}</div><div class="card">${list.filter((j) => j.date === d).map((j) => visitRow(j))}</div>`) : html`<div class="card empty">Nothing ${ui.filter === 'all' ? 'booked' : 'here'} ${ui.day ? 'on this day' : 'this week'}.</div>`}`;
}

const invPill = (i) => (i.status === 'sent' ? 'assigned' : fam(i.fam).type === 'pet' ? 'proposal' : 'draft');
const invLabel = (i) => (i.status === 'sent' ? 'Sent' : fam(i.fam).type === 'pet' ? 'Proposal' : 'Draft');
function viewInvoices() {
  const list = [...db.invoices].sort((a, b) => b.at - a.at);
  return html`<h1>Invoices</h1><p class="sub">Drafts are made in your Square account with the booking fee and deposits filled in. You look them over and send them from Square.</p>
    <div class="stack">${list.length ? list.map((i) => { const f = fam(i.fam); const c = invoiceFor(i.fam); return html`<button class="card need" data-act="open-inv" data-id="${i.id}"><span class="ic ${f.type === 'pet' ? 'sage' : 'green'}">${icon('receipt')}</span><span class="grow"><span class="ttl">${f.name}</span><span class="line2" style="display:block">${typeLabel(f.type)} · ${money(c.total)} · ${ago(i.at)}</span></span><span class="pill ${invPill(i)}">${invLabel(i)}</span></button>`; }) : html`<div class="card empty">No invoices yet.</div>`}</div>`;
}

/* ---------- views: sitter ---------- */
function jobCardSitter(j, mine) {
  const f = fam(j.fam);
  const iAm = j.interested.some((i) => i.id === ME);
  let actions;
  if (mine) {
    actions = j.status === 'backup'
      ? html`<span class="pill backup">Backup requested · Rachel is on it</span>`
      : j.type === 'pet'
        ? html`<button class="btn ${j.visitDone ? 'done' : 'pri'} sm" data-act="visit" data-id="${j.id}">${j.visitDone ? raw(`${icon('check').s} Visit done`) : 'Start visit'}</button><button class="btn ghost sm" data-act="cal" data-id="${j.id}">${icon('calendar')} Calendar</button>`
        : html`<button class="btn sec sm" data-act="cal" data-id="${j.id}">${icon('calendar')} Add to calendar</button><button class="btn ghost sm" data-act="ask-backup" data-id="${j.id}">Need a backup?</button>`;
  } else {
    actions = iAm
      ? html`<span class="btn done sm">${icon('check')} Interest sent · Rachel will confirm</span>`
      : html`<button class="btn pri sm" data-act="interest" data-id="${j.id}" data-tour="${isR1Fam(j.fam) ? 'interest' : ''}">I'm interested</button>`;
  }
  return html`<div class="pad" style="border-top:1px solid var(--line)">
    <div class="row"><span class="grow"><b>${j.type === 'pet' && j.end_d ? `${shortDay(j.date)} to ${shortDay(j.end_d)}` : `${dayLabel(j.date)} · ${span(j.start, j.end)}`}</b></span>${j.status === 'backup' && !mine ? html`<span class="pill backup">Backup needed</span>` : ''}</div>
    <div class="line2" style="white-space:pre-line;font-size:14px;color:var(--ink);margin:6px 0 12px">${j.post}</div>
    <div class="row" style="flex-wrap:wrap;gap:8px">${actions}</div></div>`;
}
function viewSitterOpen() {
  const js = db.jobs.filter((j) => active(j) && upcoming(j) && j.sitter !== ME && ['open', 'interest', 'backup'].includes(j.status));
  const fids = [...new Set(js.sort((a, b) => a.date.localeCompare(b.date)).map((j) => j.fam))];
  return html`<h1>Open jobs</h1><p class="sub">Tap I'm interested on any date. Rachel confirms who's booked.</p>
    <div class="stack">${fids.length ? fids.map((fid) => { const f = fam(fid); return html`<div class="card"><div class="fam-h"><span class="ic ${f.type === 'pet' ? 'sage' : 'gold'}">${icon(typeIcon(f.type))}</span><span class="grow"><span class="ttl">${f.name}</span><span class="line2" style="display:block">${typeLabel(f.type)}</span></span></div>${js.filter((j) => j.fam === fid).map((j) => jobCardSitter(j, false))}</div>`; }) : html`<div class="card empty">No open jobs right now. New ones show up here as soon as Rachel posts them.</div>`}</div>`;
}
function viewSitterMine() {
  const mine = db.jobs.filter((j) => j.sitter === ME && active(j)).sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
  const next = mine.filter((j) => upcoming(j));
  return html`<h1>My jobs</h1><p class="sub">${next.length ? `You have ${plural(next.length, 'visit')} coming up.` : 'Nothing booked yet.'}</p>
    <div class="stack">${next.map((j) => html`<div class="card"><div class="fam-h"><span class="ic ${j.type === 'pet' ? 'sage' : 'green'}">${icon(typeIcon(j.type))}</span><span class="grow"><span class="ttl">${fam(j.fam).name}</span><span class="line2" style="display:block">${typeLabel(j.type)}${j.mg ? ` · Meet and greet ${j.mg === 'done' ? 'done' : 'scheduled'}` : ''}</span></span></div>${jobCardSitter(j, true)}</div>`)}</div>`;
}

/* ---------- sheets ---------- */
function sheetShell(title, body, foot = '', lead = '') {
  return html`<div class="sheet-wrap"><div class="scrim" data-act="close"></div><div class="sheet" role="dialog" aria-modal="true" aria-label="${title}"><span class="grab"></span>
    <div class="sheet-h">${lead ? raw(lead) : ''}<h2>${title}</h2><button class="icon-btn" data-act="close" aria-label="Close">${icon('x')}</button></div>
    <div class="sheet-b">${tourTip()}${body}</div>${foot ? html`<div class="sheet-f">${foot}</div>` : ''}</div></div>`;
}
function tourTip() {
  const s = step();
  if (!s) return '';
  return html`<div class="guide" style="position:static;margin:0 0 14px;animation:none"><div class="k"><span>Step ${tour.step + 1} of ${TOUR.length}</span></div><p>${raw(s.text)}</p></div>`;
}

function sheetReq(r) {
  const f = fam(r.fam);
  const rows = r.rows.map((row, k) => html`<div class="post-row"><span class="n">${row.n}</span><div class="grow" style="flex:1"><b style="font-size:14px">${r.type === 'pet' ? `${shortDay(row.date)} to ${shortDay(row.end)} · from ${t12(row.start)}` : `${dayLabel(row.date)} · ${span(row.start, row.end)}`}</b>
    <textarea rows="${row.post.split('\n').length}" data-input="post" data-id="${r.id}" data-k="${k}" aria-label="Job post for date ${row.n}">${row.post}</textarea></div></div>`);
  const body = html`<p class="muted small" style="margin-top:0">${typeLabel(r.type)} · received ${ago(r.at)} from your website form${r.status === 'draft' ? ' · returned to draft' : ''}</p>
    <div class="sec" style="margin-top:8px"><h2>What sitters will see</h2></div>
    <div class="card pad"><div class="fam-preview">${f.name}</div>${rows}</div>
    <p class="hint">Edit any line. Your version is what goes on the board. Addresses stay short (City: Street).</p>
    <div class="field"><label for="notes">Notes for sitters (kept separate from the job)</label><textarea id="notes" rows="2" data-input="notes" data-id="${r.id}">${r.notes}</textarea></div>
    <div class="lock">${icon('lock')} Only you see this</div>
    <div class="private"><div>${icon('phone')} ${f.contact.phone}</div><div>${icon('mail')} ${f.contact.email}</div><div>${icon('map-pin')} ${f.contact.address}</div>${Object.values(f.extra || {}).map((v) => html`<div class="muted">${v}</div>`)}</div>`;
  const n = r.rows.length;
  const foot = html`${r.status !== 'draft' ? html`<button class="btn sec" data-act="to-draft" data-id="${r.id}">Save as draft</button>` : ''}<button class="btn pri" data-act="approve" data-id="${r.id}" data-tour="${r.id === R1 ? 'approve' : ''}">${icon('check')} Approve${r.type === 'pet' ? ' and post' : ` and post ${plural(n, 'date')}`}</button>`;
  return sheetShell(f.name, body, foot, `<span class="ic ${r.type === 'pet' ? 'sage' : 'gold'}">${icon(typeIcon(r.type)).s}</span>`);
}

function sitterPick(j, ids, label = 'Assign') {
  return ids.map((id) => html`<div class="person">${av(id)}<span class="grow"><span class="ttl">${person(id).name}</span>${j.interested.find((i) => i.id === id) ? html`<span class="line2" style="display:block">Interested ${ago(j.interested.find((i) => i.id === id).at).toLowerCase()}</span>` : ''}</span><button class="btn pri sm" data-act="assign" data-id="${j.id}" data-s="${id}" data-tour="${id === ME && isR1Fam(j.fam) ? 'assign-maya' : ''}">${label}</button></div>`);
}
function sheetJobOwner(j) {
  const f = fam(j.fam);
  const others = SITTERS.map((s) => s.id).filter((id) => id !== j.sitter && !j.interested.some((i) => i.id === id));
  let cover;
  if (j.status === 'closed') cover = html`<p class="muted">This date is closed. Reopen it to put it back on the board.</p>`;
  else if (j.status === 'assigned') cover = html`<div class="person">${av(j.sitter)}<span class="grow"><span class="ttl">${person(j.sitter).name}</span><span class="line2" style="display:block">Booked for this date</span></span><button class="btn sec sm" data-act="more">${ui.more ? 'Keep' : 'Reassign'}</button></div>${ui.more ? sitterPick(j, SITTERS.map((s) => s.id).filter((id) => id !== j.sitter)) : ''}`;
  else if (j.status === 'backup') cover = html`<div class="note">${first(j.sitter)} asked for a backup${j.backupNote ? `: “${j.backupNote}”` : '.'}</div>${sitterPick(j, SITTERS.map((s) => s.id).filter((id) => id !== j.sitter))}<p class="hint">Or leave ${first(j.sitter)} on it if you sort it out together.</p>`;
  else if (j.status === 'interest') cover = html`${sitterPick(j, j.interested.map((i) => i.id))}<details style="margin-top:6px"><summary class="small muted" style="cursor:pointer;padding:8px 0">Assign someone else</summary>${sitterPick(j, others)}</details>`;
  else cover = html`<p class="muted" style="margin:0 0 10px">No one has raised a hand yet.</p><button class="btn sec block" data-act="ask" data-id="${j.id}">${icon('send')} Ask my sitters</button><details style="margin-top:6px"><summary class="small muted" style="cursor:pointer;padding:8px 0">Or assign someone directly</summary>${sitterPick(j, others)}</details>`;
  const i = famInvoice(j.fam);
  const hist = db.history.filter((h) => h.job === j.id || (h.fam === j.fam && !h.job)).slice(-5).reverse();
  const body = html`<div class="row" style="margin-bottom:14px"><span class="pill ${j.status}">${j.status === 'assigned' ? 'Covered' : statusLabel(j)}</span><span class="muted small">${typeLabel(j.type)} · date ${j.n} of ${famJobs(j.fam).length}</span></div>
    <div class="facts">
      <div class="fact">${icon('clock')}<div><b>${j.type === 'pet' && j.end_d ? `${shortDay(j.date)} to ${shortDay(j.end_d)}` : dayLabel(j.date) + (diffDays(TODAY, j.date) < 2 ? `, ${fMd.format(dayOf(j.date))}` : '')}</b><div class="line2">${j.type === 'pet' && j.end_d ? `${plural(diffDays(j.date, j.end_d), 'night')}, from ${t12(j.start)}` : `${span(j.start, j.end)} · ${hrs(j.start, j.end)} hours`}</div></div></div>
      <div class="fact">${icon(typeIcon(j.type))}<div>${j.type === 'pet' ? j.pets : kidsLine(j.kids, j.ages)}</div></div>
      <div class="fact">${icon('map-pin')}<div>${j.loc}</div></div>
      ${j.allergy ? html`<div><span class="tag">${icon('alert')} Allergy: ${j.allergy}</span></div>` : ''}
      ${j.type === 'pet' ? html`<div class="fact">${icon('users')}<div class="grow">Meet and greet: <b>${j.mg === 'done' ? 'done' : 'scheduled'}</b>${j.mg !== 'done' ? html` <button class="chip-btn" data-act="mg" data-id="${j.id}" style="margin-left:6px">Mark done</button>` : ''}</div></div>` : ''}
    </div>
    <div class="sec"><h2>Who's covering</h2></div><div>${cover}</div>
    <div class="sec"><h2>Job post</h2></div><div class="card pad" style="white-space:pre-line;font-size:14px">${j.post}</div>
    <div class="row" style="flex-wrap:wrap;gap:8px;margin-top:14px">
      <button class="btn sec sm" data-act="cal" data-id="${j.id}">${icon('calendar')} Calendar link</button>
      ${i ? html`<button class="btn sec sm" data-act="open-inv" data-id="${i.id}">${icon('receipt')} View invoice</button>` : j.status !== 'closed' ? html`<button class="btn sec sm" data-act="invoice" data-id="${j.fam}" data-tour="${isR1Fam(j.fam) ? 'invoice-btn' : ''}">${icon('receipt')} Create invoice</button>` : ''}
      ${j.status === 'closed' ? html`<button class="btn sec sm" data-act="reopen" data-id="${j.id}">${icon('refresh')} Reopen date</button>` : html`<button class="btn warn sm" data-act="close-job" data-id="${j.id}">Close this date</button>`}
    </div>
    <div class="lock">${icon('lock')} Only you see this</div>
    <div class="private"><div>${icon('phone')} ${f.contact.phone}</div><div>${icon('mail')} ${f.contact.email}</div><div>${icon('map-pin')} ${f.contact.address}</div></div>
    ${hist.length ? html`<div class="sec"><h2>History</h2></div><div class="hist">${hist.map((h) => html`<div>${av(h.who, 'sm')}<span>${h.text}</span><time>${ago(h.at)}</time></div>`)}</div>` : ''}`;
  return sheetShell(f.name, body, '', `<span class="ic ${j.type === 'pet' ? 'sage' : 'gold'}">${icon(typeIcon(j.type)).s}</span>`);
}
function sheetJobSitter(j) {
  const mine = j.sitter === ME;
  return sheetShell(fam(j.fam).name, html`<div class="card" style="overflow:hidden">${jobCardSitter(j, mine)}</div>`);
}

function sheetVisit(j) {
  const list = j.list || ['Check in with the pets', 'Food and fresh water', 'Potty break or walk', 'Send the family a photo'];
  const body = html`<p class="muted small" style="margin-top:0">${j.service} · ${j.pets}</p>
    <div class="card pad">${list.map((item, k) => html`<button class="check ${j.checks[k] ? 'on' : ''}" data-act="check" data-id="${j.id}" data-k="${k}" aria-pressed="${!!j.checks[k]}"><span class="box">${j.checks[k] ? icon('check') : ''}</span><span>${item}</span></button>`)}</div>
    <p class="hint">In the live app a photo you send here goes to the family, and Rachel sees the visit is done.</p>`;
  const all = list.every((_, k) => j.checks[k]);
  return sheetShell(`Visit for ${fam(j.fam).name}`, body, html`<button class="btn pri" data-act="visit-done" data-id="${j.id}" ${all ? '' : 'disabled'}>${icon('check')} Mark visit complete</button>`);
}

function sheetInvoice(i) {
  const f = fam(i.fam);
  const c = invoiceFor(i.fam);
  const body = html`<div class="ribbon">${icon('info')} ${i.status === 'sent' ? 'Marked as sent (simulated).' : c.proposal ? 'Proposal: pet-sitting invoices aren’t automated yet. This shows how they could look.' : 'Draft in Square, not sent. Nothing is charged until you send it.'}</div>
    <div class="inv"><div class="inv-top"><div><h3>${c.title}</h3><div class="muted small">Due in 30 days · For ${f.name}</div></div><img src="${IMG}f2f-mark.png" alt="Field to Forest"></div>
      <p class="small muted" style="margin:0 0 10px">Thank you for booking with Field to Forest! This invoice includes the ${f.type === 'pet' ? 'booking fee and pet-sitting services' : `booking fee and childcare deposit for your scheduled ${famJobs(i.fam).filter(active).length === 1 ? 'booking date' : 'booking dates'}`}.</p>
      ${c.lines.map((l) => html`<div class="inv-line"><span>${l.label}${l.sub ? html`<small>${l.sub}</small>` : ''}</span><span>${money(l.amt)}</span></div>`)}
      <div class="inv-total"><span>Total due now</span><span>${money(c.total)}</span></div>
      <div class="inv-note">${c.note}</div></div>`;
  const foot = i.status === 'sent' ? '' : html`<button class="btn sec" data-act="close">Done</button><button class="btn pri" data-act="send-inv" data-id="${i.id}">${icon('external')} Open in Square</button>`;
  return sheetShell('Invoice preview', body, foot);
}

function sheetRole() {
  const opt = (role, id, title, sub) => html`<button class="choice ${db.role === role ? 'on' : ''}" data-act="set-role" data-role="${role}" data-tour="${role === 'sitter' ? 'to-sitter' : 'to-owner'}">${av(id, 'lg')}<span class="grow"><span class="ttl">${title}</span><span class="line2" style="display:block">${sub}</span></span>${db.role === role ? icon('check') : ''}</button>`;
  const body = html`${opt('owner', 'rachel', 'Rachel · Owner', 'Requests, coverage, invoices and every detail')}${opt('sitter', ME, 'Maya · Sitter', 'Open jobs and her own visits, on her phone')}
    <div class="sec"><h2>Demo</h2></div>
    <button class="menu-item" data-act="activity">${icon('activity')} Activity</button>
    <button class="menu-item" data-act="tour">${icon('sparkles')} Take the tour</button>
    <button class="menu-item" data-act="install">${icon('smartphone')} Put it on your home screen</button>
    <button class="menu-item" data-act="reset">${icon('refresh')} Start over with fresh sample data</button>
    <p class="foot">A demo by AP Webmaster. Sample families and sitters only. Nothing is sent, posted or charged.</p>`;
  return sheetShell('See the app as…', body);
}
function sheetActivity() {
  const list = [...db.history].reverse().slice(0, 25);
  return sheetShell('Activity', html`<div class="hist">${list.map((h) => html`<div>${av(h.who, 'sm')}<span><b>${h.who === 'system' ? 'Website' : first(h.who)}</b> · ${h.text}</span><time>${ago(h.at)}</time></div>`)}</div>`);
}
function sheetInstall() {
  return sheetShell('Put it on your home screen', html`<p class="muted" style="margin-top:0">It opens full screen like any other app, with the Field to Forest icon.</p>
    <div class="sec"><h2>iPhone</h2></div><ol class="steps"><li>Open this page in Safari.</li><li>Tap the <b>Share</b> button.</li><li>Tap <b>Add to Home Screen</b>, then <b>Add</b>.</li></ol>
    <div class="sec"><h2>Android</h2></div><ol class="steps"><li>Open this page in Chrome.</li><li>Tap the <b>⋮</b> menu.</li><li>Tap <b>Add to Home screen</b> or <b>Install app</b>.</li></ol>`);
}
function sheetBackup(j) {
  return sheetShell('Ask for a backup?', html`<p style="margin-top:0">Rachel will find someone for <b>${fam(j.fam).name} · ${when(j)}</b>. You stay on it until she does.</p>
    <div class="field"><label for="why">Anything Rachel should know? (optional)</label><textarea id="why" rows="2" placeholder="e.g. I'm sick"></textarea></div>`,
  html`<button class="btn sec" data-act="close">Never mind</button><button class="btn pri" data-act="backup" data-id="${j.id}">Ask for a backup</button>`);
}
function sheetWelcome() {
  return sheetShell('', html`<div class="welcome"><img src="${IMG}f2f-mark.png" alt="Field to Forest"><h2>Your booking app, Rachel</h2>
    <p class="muted" style="margin:0">A working demo of a Field to Forest app for you and your sitters, with made-up families and sitters.</p>
    <ul><li>${icon('inbox')} <span>Review requests and approve what sitters see</span></li><li>${icon('smartphone')} <span>Sitters raise their hand from their phones</span></li><li>${icon('receipt')} <span>Square invoice drafts with your fees and deposits</span></li></ul></div>`,
  html`<button class="btn sec" data-act="close">Look around</button><button class="btn pri" data-act="tour">Show me (2 min)</button>`);
}
function sheetFinish() {
  return sheetShell('', html`<div class="welcome"><span class="ic green" style="margin:6px auto 10px;width:56px;height:56px;border-radius:18px">${icon('check')}</span><h2>That's the whole loop</h2>
    <p class="muted" style="margin:0">A request came in, you approved it, a sitter raised her hand from her phone, you booked her, and the invoice drafted itself.</p>
    <ul><li>${icon('paw')} <span>Try the pet-sitting request from Priya P. next</span></li><li>${icon('calendar')} <span>See the whole week under This week</span></li><li>${icon('refresh')} <span>Start over any time from the menu at the top</span></li></ul></div>`,
  html`<button class="btn pri" data-act="close">Done</button>`);
}
function renderSheet() {
  const s = ui.sheet;
  if (!s) return '';
  if (s.t === 'req') return sheetReq(req(s.id));
  if (s.t === 'job') return isOwner() ? sheetJobOwner(job(s.id)) : sheetJobSitter(job(s.id));
  if (s.t === 'inv') return sheetInvoice(inv(s.id));
  if (s.t === 'visit') return sheetVisit(job(s.id));
  if (s.t === 'backup') return sheetBackup(job(s.id));
  return { role: sheetRole, activity: sheetActivity, install: sheetInstall, welcome: sheetWelcome, finish: sheetFinish }[s.t]?.() || '';
}

/* ---------- frame ---------- */
function frame() {
  const owner = isOwner();
  const ns = owner ? needs().length : 0;
  const reqN = db.requests.filter((r) => r.status !== 'approved').length;
  const tabs = owner
    ? [['today', 'home', 'Today', ns], ['requests', 'inbox', 'Requests', reqN], ['schedule', 'calendar', 'This week', 0], ['invoices', 'receipt', 'Invoices', 0]]
    : [['open', 'search', 'Open jobs', db.jobs.filter((j) => active(j) && upcoming(j) && j.sitter !== ME && ['open', 'interest', 'backup'].includes(j.status) && !j.interested.some((i) => i.id === ME)).length], ['mine', 'calendar-check', 'My jobs', 0]];
  const cur = owner ? ui.tab : ui.stab;
  const view = owner ? { today: viewToday, requests: viewRequests, schedule: viewSchedule, invoices: viewInvoices }[ui.tab]() : ui.stab === 'mine' ? viewSitterMine() : viewSitterOpen();
  const s = step();
  const showGuide = s && !ui.sheet;
  const newAct = db.history.length > (db.seenAct || 0);
  const app = html`<div class="app ${owner ? 'owner' : 'sitter'}">
    <header class="top"><div class="brand"><img src="${IMG}f2f-mark.png" alt=""><div><b>Field to Forest</b><small>${owner ? 'Bookings' : 'Sitter app'}<span class="demo-tag">Demo</span></small></div></div><span class="grow"></span>
      ${owner ? html`<button class="icon-btn" data-act="activity" aria-label="Activity">${icon('bell')}${newAct ? raw('<span class="dot"></span>') : ''}</button>` : ''}
      <button class="who" data-act="role" data-tour="switch" aria-label="Switch view">${av(owner ? 'rachel' : ME, 'sm')}${owner ? 'Rachel' : 'Maya'}${icon('chevron-down', 'chev')}</button></header>
    <nav class="tabs" aria-label="Main">${tabs.map(([id, ic, label, badge]) => html`<button class="tab ${cur === id ? 'on' : ''}" data-act="tab" data-tab="${id}" aria-current="${cur === id ? 'page' : 'false'}">${icon(ic)}<span>${label}</span>${badge ? html`<span class="badge">${badge}</span>` : ''}</button>`)}</nav>
    <main class="main" id="main">${view}</main>
    ${renderSheet()}
    <div class="toasts" aria-live="polite"></div>
    ${showGuide ? html`<div class="guide ${owner ? 'wide' : ''}" role="status"><div class="k"><span>Step ${tour.step + 1} of ${TOUR.length}</span><button data-act="tour-skip">End tour</button></div><p>${raw(s.text)}</p><button class="go" data-act="tour-go" hidden>Show me</button><div class="bar"><i style="width:${(tour.step / TOUR.length) * 100}%"></i></div></div>` : ''}
  </div>`;
  if (owner) return app;
  return html`<div class="stage"><div class="stage-note"><h2>Maya's phone</h2><p>This is what your sitters see. Open jobs, their own visits, and nothing private about families.</p><button class="btn sec" data-act="set-role" data-role="owner">Back to Rachel's view</button></div>${app}</div>`;
}

/* ---------- render ---------- */
const root = document.getElementById('f2f-root');
let toastsKeep = [];
function render() {
  const a = document.activeElement;
  const focusId = a && a.id;
  const sel = a && 'selectionStart' in a ? a.selectionStart : null;
  const mainTop = document.getElementById('main')?.scrollTop || 0;
  const winTop = window.scrollY;
  const sb = document.querySelector('.sheet-b');
  const sheetTop = sb ? sb.scrollTop : 0;
  const oldToasts = document.querySelector('.toasts');
  toastsKeep = oldToasts ? [...oldToasts.children] : [];
  document.body.classList.toggle('sitter-frame', !isOwner());
  root.innerHTML = frame().s;
  const nt = document.querySelector('.toasts');
  toastsKeep.forEach((t) => nt.appendChild(t));
  const m = document.getElementById('main'); if (m) m.scrollTop = mainTop;
  window.scrollTo(0, winTop);
  const nsb = document.querySelector('.sheet-b'); if (nsb && ui.keepSheetScroll) nsb.scrollTop = sheetTop;
  ui.keepSheetScroll = false;
  if (focusId) { const f = document.getElementById(focusId); if (f) { f.focus(); if (sel != null && f.setSelectionRange) try { f.setSelectionRange(sel, sel); } catch (e) { /* ignore */ } } }
  // Guided tour: pulse what to tap next, offer "Show me" when it's not on screen.
  const s = step();
  if (s) {
    const ids = s.spots || [s.id];
    let found = false;
    ids.forEach((id) => { const el = document.querySelector(`[data-tour="${id}"]`); if (el) { el.classList.add('spot'); found = true; } });
    const go = document.querySelector('.guide .go');
    if (go) go.hidden = found || (s.role !== db.role);
  }
  save();
}

/* ---------- actions ---------- */
function openSheet(sheet) { ui.sheet = sheet; ui.more = false; render(); const b = document.querySelector('.sheet .icon-btn'); if (b) b.focus({ preventScroll: true }); }
const A = {
  tab: (d) => { if (isOwner()) ui.tab = d.tab; else ui.stab = d.tab; ui.day = ui.tab === 'schedule' ? ui.day : null; window.scrollTo(0, 0); render(); },
  seg: (d) => { ui.seg = d.seg; render(); },
  day: (d) => { ui.day = ui.day === d.day ? null : d.day; render(); },
  filter: (d) => { ui.filter = d.f; render(); },
  close: () => { if (tour.finish) { tour.finish = false; saveTour(); ui.sheet = { t: 'finish' }; } else ui.sheet = null; render(); },
  role: () => openSheet({ t: 'role' }),
  'set-role': (d) => {
    db.role = d.role; ui.sheet = null; window.scrollTo(0, 0);
    tourHit(d.role === 'sitter' ? 'switch' : 'switchback');
    render();
    toast(d.role === 'sitter' ? 'Now viewing as Maya, a sitter' : 'Back to Rachel’s view');
  },
  'open-req': (d) => { tourHit(d.id === R1 ? 'review' : ''); openSheet({ t: 'req', id: d.id }); },
  'open-job': (d) => openSheet({ t: 'job', id: d.id }),
  'open-inv': (d) => { const i = inv(d.id); if (i && isR1Fam(i.fam)) tourHit('invoice'); openSheet({ t: 'inv', id: d.id }); },
  more: () => { ui.more = !ui.more; ui.keepSheetScroll = true; render(); },
  approve: (d) => {
    const r = req(d.id);
    r.status = 'approved';
    r.rows.forEach((row) => {
      db.jobs.push({ id: uid('j'), fam: r.fam, type: r.type, n: row.n, date: row.date, end_d: row.type === 'pet' ? row.end : undefined, start: row.start, end: row.type === 'pet' ? row.end_t : row.end, kids: row.kids, ages: row.ages, loc: row.loc, allergy: row.allergy, event: row.event, service: row.service, pets: row.pets, post: row.post, notes: r.notes, status: 'open', interested: [], sitter: null, checks: {}, mg: row.type === 'pet' ? 'scheduled' : undefined });
    });
    const f = fam(r.fam);
    log('rachel', `Approved ${f.name} and posted ${r.type === 'pet' ? 'the stay' : plural(r.rows.length, 'date')} to the job board`, { fam: r.fam });
    ui.sheet = null;
    tourHit(r.id === R1 ? 'approve' : '');
    if (!step()) { /* outside the tour, let some sitters respond so the board feels alive */
      setTimeout(() => { const j = db.jobs.filter((x) => x.fam === r.fam && x.status === 'open')[0]; if (!j) return; j.interested.push({ id: 'elena', at: Date.now() }); j.status = 'interest'; log('elena', `Interested in ${f.name} · ${shortDay(j.date)}`, { job: j.id }); render(); toast(`Elena is interested in ${f.name}, ${shortDay(j.date)}`, { label: 'View', run: () => openSheet({ t: 'job', id: j.id }) }); }, 4000);
    }
    render();
    toast(r.type === 'pet' ? `${f.name}'s stay is on the job board` : `${plural(r.rows.length, 'date')} posted for ${f.name}`);
  },
  'to-draft': (d) => { const r = req(d.id); r.status = 'draft'; log('rachel', `Saved ${fam(r.fam).name}'s request as a draft`, { fam: r.fam }); ui.sheet = null; render(); toast('Saved as a draft. It stays in Requests.'); },
  interest: (d) => {
    const j = job(d.id);
    if (j.interested.some((i) => i.id === ME)) return;
    j.interested.push({ id: ME, at: Date.now() });
    if (j.status === 'open') j.status = 'interest';
    log(ME, `Interested in ${fam(j.fam).name} · ${shortDay(j.date)}`, { job: j.id });
    if (isR1Fam(j.fam)) tourHit('interest');
    ui.sheet = null; render(); toast('Sent. Rachel will confirm who’s booked.');
  },
  assign: (d) => {
    const j = job(d.id);
    const was = j.sitter;
    j.sitter = d.s; j.status = 'assigned'; j.interested = []; j.backupNote = '';
    log('rachel', `${was && was !== d.s ? `Moved ${fam(j.fam).name} · ${shortDay(j.date)} from ${first(was)} to ${person(d.s).name}` : `Assigned ${person(d.s).name} to ${fam(j.fam).name} · ${shortDay(j.date)}`}`, { job: j.id });
    if (isR1Fam(j.fam) && d.s === ME) tourHit('assign');
    ui.more = false; ui.keepSheetScroll = true; render();
    toast(`${first(d.s)} is booked. ${first(d.s)} sees it under My jobs.`);
  },
  ask: (d) => {
    const j = job(d.id);
    toast('Sent to your sitters (simulated)');
    log('rachel', `Asked sitters about ${fam(j.fam).name} · ${shortDay(j.date)}`, { job: j.id });
    ui.keepSheetScroll = true;
    setTimeout(() => { if (j.status !== 'open') return; j.interested.push({ id: 'elena', at: Date.now() }); j.status = 'interest'; log('elena', `Interested in ${fam(j.fam).name} · ${shortDay(j.date)}`, { job: j.id }); ui.keepSheetScroll = true; render(); toast(`Elena is interested in ${fam(j.fam).name}, ${shortDay(j.date)}`); }, 2500);
    render();
  },
  'ask-backup': (d) => openSheet({ t: 'backup', id: d.id }),
  backup: (d) => {
    const j = job(d.id);
    j.status = 'backup'; j.backupNote = (document.getElementById('why')?.value || '').trim();
    log(ME, `Asked for a backup on ${fam(j.fam).name} · ${shortDay(j.date)}`, { job: j.id });
    ui.sheet = null; render(); toast('Rachel has been asked to find a backup.');
  },
  'close-job': (d) => { const j = job(d.id); j.prev = j.status; j.status = 'closed'; log('rachel', `Closed ${fam(j.fam).name} · ${shortDay(j.date)}`, { job: j.id }); ui.keepSheetScroll = true; render(); toast('Date closed', { label: 'Undo', run: () => A.reopen(d) }); },
  reopen: (d) => { const j = job(d.id); j.status = j.prev && j.prev !== 'closed' ? j.prev : 'open'; log('rachel', `Reopened ${fam(j.fam).name} · ${shortDay(j.date)}`, { job: j.id }); ui.keepSheetScroll = true; render(); },
  mg: (d) => { const j = job(d.id); j.mg = 'done'; log('rachel', `Meet and greet done for ${fam(j.fam).name}`, { job: j.id }); ui.keepSheetScroll = true; render(); },
  visit: (d) => openSheet({ t: 'visit', id: d.id }),
  check: (d) => { const j = job(d.id); j.checks[d.k] = !j.checks[d.k]; ui.keepSheetScroll = true; render(); },
  'visit-done': (d) => { const j = job(d.id); j.visitDone = true; log(ME, `Finished the visit for ${fam(j.fam).name} and sent a photo`, { job: j.id }); ui.sheet = null; render(); toast('Visit complete. The family and Rachel can see it.'); },
  invoice: (d) => {
    let i = famInvoice(d.id);
    if (!i) { i = { id: uid('i'), fam: d.id, status: 'draft', at: Date.now() }; db.invoices.push(i); log('rachel', `Created a Square ${fam(d.id).type === 'pet' ? 'invoice proposal' : 'invoice draft'} for ${fam(d.id).name}`, { fam: d.id }); }
    if (isR1Fam(d.id)) tourHit('invoice');
    openSheet({ t: 'inv', id: i.id });
  },
  'send-inv': () => toast('In the live app this opens the draft in your Square account to send.'),
  cal: (d) => {
    const j = job(d.id);
    const end = j.type === 'pet' && j.end_d ? j.end_d : j.date;
    const st = `${j.date.replace(/-/g, '')}T${j.start.replace(':', '')}00`;
    const en = `${end.replace(/-/g, '')}T${(j.end || j.start).replace(':', '')}00`;
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`Field to Forest: ${fam(j.fam).name} (sample)`)}&dates=${st}/${en}&details=${encodeURIComponent(`${j.post}\n\nSample booking from the Field to Forest demo.`)}&location=${encodeURIComponent(j.loc)}`;
    window.open(url, '_blank', 'noopener');
  },
  activity: () => { db.seenAct = db.history.length; openSheet({ t: 'activity' }); },
  install: () => openSheet({ t: 'install' }),
  reset: () => { db = seed(); ui.tab = 'today'; ui.seg = 'review'; ui.sheet = null; ui.stab = 'open'; tour.on = false; saveTour(); render(); toast('Fresh sample data loaded'); },
  tour: () => { db = seed(); ui.tab = 'today'; ui.seg = 'review'; ui.stab = 'open'; ui.sheet = null; tour = { on: true, step: 0, seen: true }; saveTour(); window.scrollTo(0, 0); render(); },
  'tour-skip': () => { tour.on = false; saveTour(); render(); toast('Tour ended. Restart it any time from the menu at the top.'); },
  'tour-go': () => { const s = step(); if (s && s.go) s.go(); render(); },
};

root.addEventListener('click', (e) => {
  const t = e.target.closest('[data-act]');
  if (!t || !root.contains(t)) return;
  const fn = A[t.dataset.act];
  if (!fn) return;
  e.preventDefault();
  fn(t.dataset);
});
root.addEventListener('input', (e) => {
  const t = e.target;
  const k = t.dataset && t.dataset.input;
  if (!k) return;
  if (k === 'q') { ui.q = t.value; render(); return; }
  if (k === 'post') { const r = req(t.dataset.id); r.rows[+t.dataset.k].post = t.value; t.rows = Math.max(2, t.value.split('\n').length); save(); return; }
  if (k === 'notes') { req(t.dataset.id).notes = t.value; save(); }
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && ui.sheet) A.close(); });

if (!tour.seen) { tour.seen = true; saveTour(); ui.sheet = { t: 'welcome' }; }
render();

if ('serviceWorker' in navigator && CFG.swUrl && location.protocol === 'https:') {
  navigator.serviceWorker.register(CFG.swUrl, { scope: CFG.basePath }).catch(() => {});
}
