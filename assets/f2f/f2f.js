/**
 * Field 2 Forest booking app demo. One file, no build step.
 * Made-up families and sitters, saved in this browser only. Nothing is sent,
 * charged or posted anywhere: Square, calendars and messages are simulated.
 */
const CFG = window.APWA_CONFIG || {};
const IMG = CFG.img || '';
const KEY = 'f2f.demo.v4';
const TOUR_KEY = 'f2f.tour.v2';

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
};
const icon = (n, cls = '') => raw(`<svg class="f2f-icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${EXTRA[n] || (CFG.icons || {})[n] || (CFG.icons || {}).grid || ''}</svg>`);
const uid = (p) => `${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const money = (n) => `$${(Math.round(n * 100) / 100).toFixed(Number.isInteger(Math.round(n * 100) / 100) ? 0 : 2)}`;
const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/* ---------- dates ---------- */
const pad = (n) => String(n).padStart(2, '0');
const isoOf = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const dayOf = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const T0 = new Date(); T0.setHours(0, 0, 0, 0);
const TODAY = isoOf(T0);
const addDays = (s, n) => { const d = dayOf(s); d.setDate(d.getDate() + n); return isoOf(d); };
const plus = (n) => addDays(TODAY, n);
const weekStart = (s) => addDays(s, -dayOf(s).getDay());
const monthStart = (s) => `${s.slice(0, 8)}01`;
const addMonths = (s, n) => { const d = dayOf(monthStart(s)); d.setMonth(d.getMonth() + n); return isoOf(d); };
const diffDays = (a, b) => Math.round((dayOf(b) - dayOf(a)) / 86400000);
const fWk = new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
const fMd = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });
const fMon = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' });
const fLong = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
const md = (s) => fMd.format(dayOf(s));
const dayLabel = (s) => { const k = diffDays(TODAY, s); return k === 0 ? 'Today' : k === 1 ? 'Tomorrow' : k === -1 ? 'Yesterday' : fWk.format(dayOf(s)); };
const shortDay = (s) => fWk.format(dayOf(s));
const t12 = (t, ap = true) => { let [h, m] = t.split(':').map(Number); const pm = h >= 12; h = h % 12 || 12; return `${h}${m ? `:${pad(m)}` : ''}${ap ? (pm ? ' PM' : ' AM') : ''}`; };
const span = (a, b) => ((+a.slice(0, 2) >= 12) === (+b.slice(0, 2) >= 12) ? `${t12(a, false)}–${t12(b)}` : `${t12(a)}–${t12(b)}`);
const hrs = (a, b) => { const m = (s) => +s.slice(0, 2) * 60 + +s.slice(3); return (m(b) - m(a)) / 60; };
const ago = (ts) => { const s = (Date.now() - ts) / 1000; if (s < 60) return 'Just now'; if (s < 3600) return `${Math.floor(s / 60)} min ago`; if (s < 86400) return `${Math.floor(s / 3600)} hr ago`; const d = Math.floor(s / 86400); return d === 1 ? 'Yesterday' : `${d} days ago`; };
const HOUR = 3600000;
const covers = (j, d) => d >= j.date && d <= (j.end_d || j.date);

/* ---------- pricing (Field 2 Forest's current rules) ---------- */
const FEES = [40, 60, 80, 100, 120, 140, 160, 180, 200, 200];
const bookingFee = (n) => (n <= 0 ? 0 : n > 10 ? 200 : FEES[n - 1]);
const RATE = { 1: 30, 2: 32, 3: 35, 4: 40 };
const hourly = (kids) => RATE[Math.min(Math.max(kids, 1), 4)];
const depRate = (kids) => (kids >= 4 ? 10 : 9);
const PET = { feeNew: 20, feeBack: 10, overnight: (p) => (p >= 3 ? 95 : 85), visit: (p) => (p >= 3 ? 33 : 28) };

/* ---------- sample data ---------- */
const SITTERS = [
  { id: 'maya', name: 'Sitter One', color: '#b9862a' },
  { id: 'jordan', name: 'Sitter Two', color: '#5d7a3a' },
  { id: 'elena', name: 'Sitter Three', color: '#5f7686' },
  { id: 'avery', name: 'Sitter Four', color: '#8a6a86' },
];
const ME = 'maya';
const STAFF = { id: 'staff', name: 'Field 2 Forest staff', color: '#fff' };
const kidsLine = (k, ages) => `${plural(k, 'kid')} · ${k === 1 ? 'age' : 'ages'} ${ages}`;
function postFor(r) {
  if (r.type === 'pet') return [`${r.service}${r.end ? ` · ${plural(diffDays(r.date, r.end), 'night')}` : ''}`, r.pets, `📍${r.loc}`].join('\n');
  return [kidsLine(r.kids, r.ages), `📍${r.loc}`, r.allergy ? `Allergy: ${r.allergy}` : '', r.care || '', r.event ? `💒 ${r.event}` : ''].filter(Boolean).join('\n');
}

function seed() {
  const now = Date.now();
  const fams = [
    { id: 'f1', name: 'Parent A', type: 'childcare', returning: false, contact: { phone: '(555) 555-0101', email: 'parent.a@example.com', address: '123 Main St, Anytown' }, extra: { adults: 'Both parents out', insurance: 'No' } },
    { id: 'f2', name: 'Parent B', type: 'pet', returning: false, contact: { phone: '(555) 555-0102', email: 'parent.b@example.com', address: '45 Oak Ave, Anytown' }, extra: { vet: 'Anytown Vet Clinic (sample)', trained: 'House-trained, spayed/neutered, vaccines current' } },
    { id: 'f3', name: 'Parent C', type: 'childcare', returning: true, contact: { phone: '(555) 555-0103', email: 'parent.c@example.com', address: '9 Elm St, Anytown' } },
    { id: 'f4', name: 'Parent D', type: 'childcare', returning: true, contact: { phone: '(555) 555-0104', email: 'parent.d@example.com', address: '300 Maple Dr, Anytown' } },
    { id: 'f5', name: 'Parent E', type: 'pet', returning: true, billed: true, contact: { phone: '(555) 555-0105', email: 'parent.e@example.com', address: '77 Pine Rd, Anytown' } },
    { id: 'f6', name: 'Parent F', type: 'childcare', returning: true, contact: { phone: '(555) 555-0106', email: 'parent.f@example.com', address: '15 Sesame St, Anytown' } },
    { id: 'f7', name: 'Parent G', type: 'childcare', returning: true, billed: true, contact: { phone: '(555) 555-0107', email: 'parent.g@example.com', address: '6 Cedar Ln, Anytown' } },
  ];
  const kRow = (n, date, start, end, extra = {}) => ({ n, date, start, end, kids: 2, ages: '4 & 7', loc: 'Anytown: Main St', allergy: 'peanuts (EpiPen in the kitchen)', care: 'Bedtime 8 PM · no screens after dinner', ...extra });
  const r1rows = [
    kRow(1, plus(3), '17:00', '21:00'),
    kRow(2, plus(5), '09:00', '13:00'),
    kRow(3, plus(8), '18:00', '22:00'),
    kRow(4, plus(10), '17:00', '21:00'),
    kRow(5, plus(12), '12:00', '18:00', { kids: 3, ages: '4, 7 & 10 (cousin visiting)', event: 'Wedding' }),
  ].map((r) => ({ ...r, type: 'childcare', post: postFor({ ...r, type: 'childcare' }) }));
  const petRow = { n: 1, type: 'pet', date: plus(6), end: plus(9), start: '18:00', end_t: '09:00', service: 'Overnight stay', pets: '2 dogs: Dog 1 (large) and Dog 2 (small)', loc: 'Anytown: Oak Ave' };
  petRow.post = postFor(petRow);
  const requests = [
    { id: 'r1', fam: 'f1', type: 'childcare', status: 'review', at: now - 2 * HOUR, rows: r1rows, notes: 'Friendly dog in the house. Bedtime is 8 PM. Snacks in the pantry are fine.' },
    { id: 'r2', fam: 'f2', type: 'pet', status: 'review', at: now - 5 * HOUR, rows: [petRow], notes: 'Feed twice a day. The small dog gets one pill with dinner. Free meet and greet requested.' },
  ];
  const J = (o) => ({ interested: [], sitter: null, status: 'open', checks: {}, ...o });
  const jr = { type: 'childcare', kids: 2, ages: '3 & 8', loc: 'Anytown: Cedar Ln', care: 'Bedtime 7:30 PM · vegetarian meals' };
  const jobs = [
    J({ id: 'j1', fam: 'f3', type: 'childcare', n: 1, date: plus(1), start: '18:00', end: '22:00', kids: 3, ages: '2, 5 & 9', loc: 'Anytown: Elm St', allergy: 'dairy (oat milk in the fridge)', care: 'Bedtimes 7, 8 and 9 PM by age', status: 'backup', sitter: 'jordan', backupNote: 'Family emergency, so sorry!' }),
    J({ id: 'j2', fam: 'f3', type: 'childcare', n: 2, date: plus(2), start: '17:00', end: '23:00', kids: 3, ages: '2, 5 & 9', loc: 'Anytown: Elm St', allergy: 'dairy (oat milk in the fridge)', care: 'Bedtimes 7, 8 and 9 PM by age', status: 'assigned', sitter: 'elena' }),
    J({ id: 'j3', fam: 'f4', type: 'childcare', n: 1, date: plus(2), start: '13:00', end: '17:00', kids: 1, ages: '3', loc: 'Anytown: Maple Dr', care: 'Nap at 1 PM · gluten-free snacks only', status: 'assigned', sitter: 'maya' }),
    J({ id: 'j4', fam: 'f4', type: 'childcare', n: 2, date: plus(4), start: '16:00', end: '22:00', kids: 1, ages: '3', loc: 'Anytown: Maple Dr', care: 'Nap at 1 PM · gluten-free snacks only' }),
    J({ id: 'j5', fam: 'f5', type: 'pet', n: 2, date: TODAY, start: '12:00', end: '12:30', service: '30-minute drop-in', pets: '2 cats: Cat 1 and Cat 2', loc: 'Anytown: Pine Rd', status: 'assigned', sitter: 'maya', mg: 'done', list: ['Fresh food and water', 'Scoop the litter box', 'Playtime and cuddles', 'Send the family a photo'] }),
    J({ id: 'j6', fam: 'f6', type: 'childcare', n: 1, date: plus(7), start: '18:00', end: '23:00', kids: 2, ages: '1 & 6', loc: 'Anytown: Sesame St', allergy: 'tree nuts', care: 'Baby bottle at 7 PM · bedtime 8:30 PM', status: 'interest', interested: [{ id: 'avery', at: now - 3 * HOUR }] }),
    J({ id: 'j7', fam: 'f7', n: 1, date: plus(-12), start: '17:00', end: '21:00', status: 'done', sitter: 'avery', ...jr }),
    J({ id: 'j8', fam: 'f7', n: 2, date: plus(-5), start: '18:00', end: '22:00', status: 'done', sitter: 'jordan', ...jr }),
    J({ id: 'j9', fam: 'f7', n: 3, date: plus(16), start: '17:00', end: '22:00', status: 'assigned', sitter: 'avery', ...jr }),
    J({ id: 'j10', fam: 'f7', n: 4, date: plus(20), start: '10:00', end: '15:00', status: 'assigned', sitter: 'jordan', ...jr }),
    J({ id: 'j11', fam: 'f5', type: 'pet', n: 1, date: plus(-2), start: '12:00', end: '12:30', service: '30-minute drop-in', pets: '2 cats: Cat 1 and Cat 2', loc: 'Anytown: Pine Rd', status: 'done', sitter: 'maya', mg: 'done' }),
  ];
  jobs.forEach((j) => { j.post = postFor(j); });
  const history = [
    { at: now - 26 * HOUR, who: 'staff', text: `Assigned Sitter Three to Parent C · ${shortDay(plus(2))}`, job: 'j2' },
    { at: now - 20 * HOUR, who: 'staff', text: `Assigned Sitter One to Parent D · ${shortDay(plus(2))}`, job: 'j3' },
    { at: now - 5 * HOUR, who: 'system', text: 'New pet-sitting request from Parent B', fam: 'f2' },
    { at: now - 3 * HOUR, who: 'avery', text: `Interested in Parent F · ${shortDay(plus(7))}`, job: 'j6' },
    { at: now - 2 * HOUR, who: 'system', text: 'New babysitting request from Parent A (5 dates)', fam: 'f1' },
    { at: now - 40 * 60000, who: 'jordan', text: `Asked for a backup on Parent C · ${shortDay(plus(1))}`, job: 'j1' },
  ];
  const invoices = [{ id: 'i1', fam: 'f4', status: 'draft', at: now - 19 * HOUR }, { id: 'i2', fam: 'f3', status: 'draft', at: now - 25 * HOUR }];
  return { v: 4, role: 'owner', fams, requests, jobs, invoices, history };
}

let db;
try { db = JSON.parse(localStorage.getItem(KEY)); } catch (e) { db = null; }
if (!db || db.v !== 4) db = seed();
let saveT;
const save = () => { clearTimeout(saveT); saveT = setTimeout(() => { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) { /* private mode: lasts this visit */ } }, 120); };

let tour = (() => { try { return JSON.parse(localStorage.getItem(TOUR_KEY)) || {}; } catch (e) { return {}; } })();
const saveTour = () => { try { localStorage.setItem(TOUR_KEY, JSON.stringify(tour)); } catch (e) { /* fine */ } };

const ui = { tab: 'today', seg: 'review', need: null, filter: 'all', q: '', stab: 'open', sheet: null, more: false, edit: false, cal: { mode: 'week', ref: TODAY, day: null } };
let coach = null;

/* ---------- lookups ---------- */
const fam = (id) => db.fams.find((f) => f.id === id) || { name: '?' };
const job = (id) => db.jobs.find((j) => j.id === id);
const req = (id) => db.requests.find((r) => r.id === id);
const inv = (id) => db.invoices.find((i) => i.id === id);
const person = (id) => (id === 'staff' ? STAFF : SITTERS.find((s) => s.id === id) || { name: 'Website', color: '#a0a897' });
const first = (id) => (id === 'staff' ? 'Staff' : person(id).name);
const ini = (n) => { const w = n.split(/\s+/); const num = { One: '1', Two: '2', Three: '3', Four: '4' }[w[1]]; return num ? `S${num}` : w.map((p) => p[0]).join('').slice(0, 2).toUpperCase(); };
const PERSON = (bg, shirt, skin, hairBack, hairTop) => `<rect width="40" height="40" fill="${bg}"/>${hairBack}<path d="M7 41 C7 31.5 12.5 27.5 20 27.5 C27.5 27.5 33 31.5 33 41 Z" fill="${shirt}"/><rect x="17.4" y="21" width="5.2" height="7.5" rx="2.4" fill="${skin}"/><circle cx="20" cy="17" r="7" fill="${skin}"/>${hairTop}`;
const FACES = {
  maya: PERSON('#f4e6c6', '#b9862a', '#f0c9a6', '<path d="M11.8 18 Q11.8 8.6 20 8.6 Q28.2 8.6 28.2 18 V27 Q20 29 11.8 27 Z" fill="#4a3426"/>', '<path d="M12.8 17 Q13 9.6 20 9.6 Q27 9.6 27.2 17 Q23 12.4 16.5 13.6 Q14.2 14.6 12.8 17 Z" fill="#4a3426"/>'),
  jordan: PERSON('#e0e9d4', '#5d7a3a', '#c48d63', '', '<path d="M12.9 16.4 Q12.9 9.4 20 9.4 Q27.1 9.4 27.1 16.4 Q25.4 12.8 20 13 Q14.6 12.8 12.9 16.4 Z" fill="#231c17"/>'),
  elena: PERSON('#dfe6eb', '#5f7686', '#e7b48e', '', '<circle cx="20" cy="8.6" r="3.4" fill="#6b4428"/><path d="M12.9 16.6 Q12.9 9.8 20 9.8 Q27.1 9.8 27.1 16.6 Q24.6 13 20 13.4 Q15.4 13 12.9 16.6 Z" fill="#6b4428"/>'),
  avery: PERSON('#ede2eb', '#8a6a86', '#8f5c3d', '', '<g fill="#2a1f19"><circle cx="14.2" cy="13.6" r="3"/><circle cx="17.4" cy="10.6" r="3.2"/><circle cx="21.4" cy="10" r="3.2"/><circle cx="25" cy="12" r="3.1"/><circle cx="26.4" cy="15.4" r="2.4"/><circle cx="13.2" cy="16.4" r="2.2"/></g>'),
};
const face = (id) => `<svg viewBox="3 4 34 34" width="100%" height="100%" aria-hidden="true">${FACES[id] || FACES.maya}</svg>`;
const av = (id, cls = '') => {
  if (id === 'staff') return html`<span class="av staff ${cls}" title="Field 2 Forest staff"><img src="${IMG}f2f-mark.png" alt=""></span>`;
  const p = person(id);
  return html`<span class="av ${cls}" style="background:${p.color}" title="${p.name}">${p.id ? raw(face(p.id)) : raw(icon('sparkles').s)}</span>`;
};
const isOwner = () => db.role === 'owner';
const active = (j) => j.status !== 'closed';
const upcoming = (j) => (j.end_d || j.date) >= TODAY;
const famJobs = (fid) => db.jobs.filter((j) => j.fam === fid);
const famInvoice = (fid) => db.invoices.find((i) => i.fam === fid);
const typeIcon = (t) => (t === 'pet' ? 'paw' : 'kid');
const typeLabel = (t) => (t === 'pet' ? 'Pet sitting' : 'Babysitting');
const when = (j) => (j.type === 'pet' && j.end_d ? `${md(j.date)}–${md(j.end_d)}` : `${dayLabel(j.date)} · ${span(j.start, j.end)}`);
const what = (j) => (j.type === 'pet' ? j.pets.split(':')[0] : kidsLine(j.kids, j.ages));
const log = (who, text, ref = {}) => { db.history.push({ at: Date.now(), who, text, ...ref }); };

/* ---------- invoices ---------- */
// Dates to bill: the family's booked dates, or the request's dates before it's approved.
function famDates(fid) {
  const js = famJobs(fid).filter((j) => active(j) && j.status !== 'done');
  if (js.length) return js.sort((a, b) => a.date.localeCompare(b.date));
  const r = db.requests.find((x) => x.fam === fid);
  if (!r) return [];
  return r.rows.map((row) => ({ type: row.type, date: row.date, end_d: row.type === 'pet' ? row.end : undefined, start: row.start, end: row.type === 'pet' ? row.end_t : row.end, kids: row.kids, pets: row.pets, service: row.service }));
}
function invoiceFor(fid) {
  const f = fam(fid);
  const js = famDates(fid);
  const lines = [];
  if (f.type === 'pet') {
    lines.push({ label: `Booking Fee${f.returning ? '' : ' (first booking)'}`, amt: f.returning ? PET.feeBack : PET.feeNew });
    js.forEach((j) => {
      const pets = Number((j.pets.match(/\d+/) || [2])[0]);
      if (j.end_d) { const n = diffDays(j.date, j.end_d); lines.push({ label: `Overnight stay — ${md(j.date)} to ${md(j.end_d)}`, sub: `${plural(n, 'night')} × ${money(PET.overnight(pets))} (${plural(pets, 'pet')})`, amt: n * PET.overnight(pets) }); } else { lines.push({ label: `${j.service} — ${shortDay(j.date)}`, sub: `1 visit × ${money(PET.visit(pets))}`, amt: PET.visit(pets) }); }
    });
    return { title: `Field 2 Forest — Pet Sitting — ${f.name}`, lines, note: 'Pet-sitting prices come from your public rates. Holiday surcharges and deposit rules can be added before this goes live.', proposal: true, total: lines.reduce((t, l) => t + l.amt, 0) };
  }
  lines.push({ label: `Booking Fee — ${plural(js.length, 'Date')}`, amt: bookingFee(js.length) });
  const tiers = new Set();
  js.forEach((j) => {
    const h = hrs(j.start, j.end); const d = depRate(j.kids); tiers.add(Math.min(j.kids, 4));
    lines.push({ label: `Babysitting Deposit — ${shortDay(j.date)}, ${span(j.start, j.end)} · ${plural(j.kids, 'child', 'children')}`, sub: `${h} hrs × ${money(d)}/hr`, amt: h * d });
  });
  const note = `Your sitter is paid directly at the visit. ${[...tiers].sort().map((k) => `${k >= 4 ? '4+' : k} ${k === 1 ? 'child' : 'children'}: ${money(hourly(k))}/hr total, ${money(depRate(k))}/hr deposit paid here, ${money(hourly(k) - depRate(k))}/hr to your sitter.`).join(' ')}`;
  return { title: `Field 2 Forest — Babysitting Booking — ${f.name}`, lines, note, proposal: false, total: lines.reduce((t, l) => t + l.amt, 0) };
}
// An invoice keeps its own copy of the lines, so staff can edit it before Square.
function invData(i) {
  if (!i.lines) {
    const c = invoiceFor(i.fam);
    const n = famDates(i.fam).length;
    i.lines = c.lines.map((l) => ({ ...l }));
    i.title = c.title; i.note = c.note; i.proposal = c.proposal;
    i.msg = `Thank you for booking with Field 2 Forest! This invoice includes the ${c.proposal ? 'booking fee and pet-sitting services' : `booking fee and childcare deposit for your scheduled booking ${n === 1 ? 'date' : 'dates'}`}.`;
  }
  return i;
}
const invTotal = (i) => invData(i).lines.reduce((t, l) => t + (Number(l.amt) || 0), 0);
const invPill = (i) => (i.status === 'square' ? 'assigned' : fam(i.fam).type === 'pet' ? 'proposal' : 'draft');
const invLabel = (i) => (i.status === 'square' ? 'In Square' : fam(i.fam).type === 'pet' ? 'Proposal' : 'Draft');

/* ---------- what needs staff ---------- */
function needs() {
  const out = [];
  db.requests.filter((r) => r.status !== 'approved').forEach((r) => out.push({ k: 'req', ic: 'inbox', tone: 'gold', title: `New request from ${fam(r.fam).name}`, sub: r.type === 'pet' ? `Pet sitting · ${r.rows[0].service}, ${plural(diffDays(r.rows[0].date, r.rows[0].end), 'night')}` : `Babysitting · ${plural(r.rows.length, 'date')}`, act: 'open-req', id: r.id, btn: 'Review' }));
  const js = db.jobs.filter((j) => active(j) && upcoming(j) && j.status !== 'done').sort((a, b) => a.date.localeCompare(b.date));
  js.filter((j) => j.status === 'backup').forEach((j) => out.push({ k: 'sit', ic: 'alert', tone: 'red', title: `${first(j.sitter)} needs a backup`, sub: `${fam(j.fam).name} · ${when(j)}`, act: 'open-job', id: j.id, btn: 'Find backup' }));
  js.filter((j) => j.status === 'interest').forEach((j) => out.push({ k: 'int', ic: 'user-plus', tone: 'green', title: `${j.interested.map((i) => first(i.id)).join(' and ')} ${j.interested.length > 1 ? 'are' : 'is'} interested`, sub: `${fam(j.fam).name} · ${when(j)}`, act: 'open-job', id: j.id, btn: 'Assign' }));
  const open = js.filter((j) => j.status === 'open' && diffDays(TODAY, j.date) <= 7);
  [...new Set(open.map((j) => j.fam))].forEach((fid) => {
    const list = open.filter((j) => j.fam === fid);
    out.push({ k: 'sit', ic: 'calendar', tone: 'gold', title: 'No sitter yet', sub: `${fam(fid).name} · ${list.length > 1 ? `${list.length} dates this week, first ${dayLabel(list[0].date)}` : when(list[0])}`, act: 'open-job', id: list[0].id, btn: 'Find sitter' });
  });
  [...new Set(js.map((j) => j.fam))].forEach((fid) => {
    if (famInvoice(fid) || fam(fid).billed) return;
    if (!famJobs(fid).some((j) => j.status === 'assigned' || j.status === 'backup')) return;
    const f = fam(fid);
    out.push({ k: 'inv', ic: 'receipt', tone: 'sage', title: `Ready to invoice: ${f.name}`, sub: f.type === 'pet' ? 'Pet-sitting invoice' : `Booking fee and deposits · ${plural(famDates(fid).length, 'date')}`, act: 'invoice', id: fid, btn: 'Preview' });
  });
  const drafts = db.invoices.filter((i) => i.status === 'draft');
  if (drafts.length) out.push({ k: 'inv', ic: 'receipt', tone: 'sage', title: drafts.length === 1 ? `Invoice draft: ${fam(drafts[0].fam).name}` : `${drafts.length} invoice drafts to check`, sub: 'Look them over, then send them to Square', act: drafts.length === 1 ? 'open-inv' : 'tab', id: drafts[0].id, tab: 'invoices', btn: 'Check' });
  return out;
}

/* ---------- short guide: Next, Back or Skip ---------- */
const COACH = {
  owner: [
    { t: 'today', tab: 'today', title: 'Welcome to Field 2 Forest', text: 'This is a quick look at the booking app. Home shows what needs staff: new requests, sitters who raised a hand and backups. Tap a tile to see just those.' },
    { t: 'tab-requests', tab: 'requests', title: 'Requests from your website', text: 'Review each request, edit what sitters will see, then approve it. You can generate the invoice right from the request.' },
    { t: 'tab-schedule', tab: 'schedule', title: 'Your calendar', text: 'Flip through the weeks or the month to see every babysitting and pet booking, and who is covering it.' },
    { t: 'tab-invoices', tab: 'invoices', title: 'Invoices for Square', text: 'Preview the booking fee and deposits, change anything you need, then send it to Square as a draft.' },
    { t: 'who', tab: 'today', title: 'Try the sitter view', text: 'See what your sitters get on their phones. You can switch back here any time.', cta: 'Show sitter view' },
  ],
  sitter: [
    { t: 'who', tab: 'open', title: 'This is the sitter view', text: 'It’s what your sitters see on their phones. Tap here at the top right any time to go back to the staff view.', cta: 'Got it' },
  ],
};
function coachHtml() {
  if (!coach) return '';
  const steps = COACH[coach.set];
  const s = steps[coach.i];
  const last = coach.i === steps.length - 1;
  return html`<div class="coach" role="dialog" aria-modal="true" aria-labelledby="coach-t"><div class="coach-shield"></div><div class="coach-spot" aria-hidden="true"></div>
    <div class="coach-tip">${steps.length > 1 ? html`<div class="coach-head"><span>${coach.i + 1} of ${steps.length}</span><button data-act="coach-skip">Skip</button></div>` : ''}
      <h3 id="coach-t">${s.title}</h3><p>${s.text}</p>
      <div class="coach-foot"><span class="coach-dots" aria-hidden="true">${steps.length > 1 ? steps.map((_, k) => raw(`<i class="${k === coach.i ? 'on' : ''}"></i>`)) : ''}</span>
        ${coach.i > 0 ? html`<button class="btn sec sm" data-act="coach-back">Back</button>` : ''}<button class="btn pri sm" data-act="coach-next" id="coach-next">${last ? s.cta || 'Done' : 'Next'}</button></div></div></div>`;
}
function positionCoach() {
  const w = document.querySelector('.coach');
  if (!w || !coach) return;
  const s = COACH[coach.set][coach.i];
  const el = document.querySelector(`[data-coach="${s.t}"]`);
  const spot = w.querySelector('.coach-spot');
  const tip = w.querySelector('.coach-tip');
  const vw = window.innerWidth; const vh = window.innerHeight;
  const tw = Math.min(360, vw - 24);
  tip.style.width = `${tw}px`;
  const th = tip.offsetHeight || 180;
  if (!el) { spot.style.opacity = '0'; tip.style.left = `${(vw - tw) / 2}px`; tip.style.top = `${Math.max(12, (vh - th) / 2)}px`; return; }
  const r = el.getBoundingClientRect(); const p = 6;
  Object.assign(spot.style, { left: `${r.left - p}px`, top: `${r.top - p}px`, width: `${r.width + 2 * p}px`, height: `${r.height + 2 * p}px`, opacity: '1' });
  let L; let T;
  if (vw >= 900 && r.width < 320 && r.right + 20 + tw <= vw - 12) { L = r.right + 20; T = clamp(r.top + r.height / 2 - th / 2, 12, vh - th - 12); } else {
    L = clamp(r.left + r.width / 2 - tw / 2, 12, vw - tw - 12);
    T = clamp(r.top + r.height / 2 > vh / 2 ? r.top - p - 14 - th : r.bottom + p + 14, 12, vh - th - 12);
  }
  tip.style.left = `${L}px`; tip.style.top = `${T}px`;
}
function coachGo() {
  const s = COACH[coach.set][coach.i];
  if (s.tab) { if (coach.set === 'owner') ui.tab = s.tab; else ui.stab = s.tab; }
  ui.sheet = null; window.scrollTo(0, 0); render();
  document.getElementById('coach-next')?.focus({ preventScroll: true });
}
function coachStart(set) { coach = { set, i: 0 }; coachGo(); }
function coachEnd() { if (coach) { tour[coach.set] = true; saveTour(); } coach = null; }

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

/* ---------- views: staff ---------- */
function needCard(n) {
  return html`<button class="card need t-${n.tone}" data-act="${n.act}" data-id="${n.id || ''}" data-tab="${n.tab || ''}">
    <span class="ic ${n.tone}">${icon(n.ic)}</span>
    <span class="grow"><span class="ttl trunc">${n.title}</span><span class="line2 trunc">${n.sub}</span></span>
    <span class="act">${n.btn}</span></button>`;
}
function statusLabel(j) {
  return { open: 'Needs a sitter', interest: `${plural(j.interested.length, 'sitter')} interested`, assigned: first(j.sitter || ''), backup: 'Needs backup', closed: 'Closed', done: 'Done' }[j.status] || j.status;
}
function visitRow(j, showFam = true) {
  const right = j.status === 'assigned' ? av(j.sitter, 'sm') : html`<span class="pill ${j.status}">${statusLabel(j)}</span>`;
  const multi = j.type === 'pet' && j.end_d;
  return html`<button class="visit ${j.status === 'done' ? 'past' : ''}" data-act="open-job" data-id="${j.id}">
    <span class="time"><b>${multi ? md(j.date) : t12(j.start)}</b>${multi ? plural(diffDays(j.date, j.end_d), 'night') : dayLabel(j.date).replace(/^\w+, /, '')}</span>
    <span class="grow"><span class="ttl trunc">${showFam ? fam(j.fam).name : what(j)}</span><span class="line2 trunc">${icon(typeIcon(j.type), 'mini')}${showFam ? what(j) : j.loc}</span></span>
    ${right}</button>`;
}
function greet() { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; }
const TILES = [['req', 'inbox', 'gold', 'New requests'], ['sit', 'users', 'gold', 'Bookings need a sitter'], ['int', 'user-plus', 'green', 'Sitters interested'], ['inv', 'receipt', 'sage', 'Invoices to send']];

function viewToday() {
  const ns = needs();
  const count = (k) => ns.filter((n) => n.k === k).length;
  const red = ns.some((n) => n.tone === 'red');
  const shown = ui.need ? ns.filter((n) => n.k === ui.need) : ns;
  const next = db.jobs.filter((j) => active(j) && upcoming(j) && (j.status === 'assigned' || j.status === 'backup')).sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start)).slice(0, 5);
  const tile = ([k, ic, tone, label]) => { const c = count(k); const t = k === 'sit' && red ? 'red' : tone; return html`<button class="tile ${t} ${c ? '' : 'zero'} ${ui.need === k ? 'on' : ''}" data-act="need-f" data-k="${k}" aria-pressed="${ui.need === k}"><span class="tile-ic">${icon(ic)}</span><b>${c}</b><span class="tile-l">${label}</span></button>`; };
  const label = ui.need ? TILES.find((x) => x[0] === ui.need)[3] : 'Needs you';
  return html`<h1>${greet()}</h1>
    <p class="sub">${fLong.format(T0)} · ${ns.length ? `${plural(ns.length, 'thing')} ${ns.length === 1 ? 'needs' : 'need'} you` : 'Nothing needs you right now'}</p>
    <div class="tiles" data-coach="today">${TILES.map(tile)}</div>
    <div class="dash">
      <section><div class="sec-h"><h2>${label}</h2>${ui.need ? html`<button class="chip-btn" data-act="need-f" data-k="${ui.need}">Show all</button>` : ''}</div>
        ${shown.length ? html`<div class="needs">${shown.map(needCard)}</div>` : html`<div class="card allclear"><span class="ic green">${icon('check')}</span><b>All caught up</b><div class="line2">New requests and sitter updates show up here.</div></div>`}</section>
      <section><div class="sec-h"><h2>Coming up</h2><button class="chip-btn" data-act="tab" data-tab="schedule">${icon('calendar', 'mini')}Calendar</button></div>
        <div class="card">${next.length ? next.map((j) => visitRow(j)) : html`<div class="empty">No visits booked yet.</div>`}</div></section>
    </div>`;
}

function invBtn(fid, sm = true) {
  const i = famInvoice(fid);
  if (i) return html`<button class="btn sec ${sm ? 'sm' : ''}" data-act="open-inv" data-id="${i.id}">${icon('receipt')} View invoice</button>`;
  if (fam(fid).billed) return html`<span class="pill done">Billed</span>`;
  return html`<button class="btn sec ${sm ? 'sm' : ''}" data-act="invoice" data-id="${fid}">${icon('receipt')} Generate invoice</button>`;
}
function viewRequests() {
  const review = db.requests.filter((r) => r.status !== 'approved');
  const seg = html`<div class="seg" role="tablist"><button class="${ui.seg === 'review' ? 'on' : ''}" data-act="seg" data-seg="review">To review${review.length ? ` (${review.length})` : ''}</button><button class="${ui.seg === 'booked' ? 'on' : ''}" data-act="seg" data-seg="booked">Booked</button></div>`;
  if (ui.seg === 'review') {
    return html`<h1>Requests</h1><p class="sub">From your website forms. Nothing reaches sitters until you approve it.</p>${seg}
      <div class="grid2">${review.length ? review.map((r) => { const f = fam(r.fam); return html`<div class="card req-card">
        <button class="req-main" data-act="open-req" data-id="${r.id}"><span class="ic ${r.type === 'pet' ? 'sage' : 'gold'}">${icon(typeIcon(r.type))}</span><span class="grow"><span class="ttl">${f.name}</span><span class="line2">${typeLabel(r.type)} · ${r.type === 'pet' ? `${md(r.rows[0].date)}–${md(r.rows[0].end)}` : plural(r.rows.length, 'date')} · ${ago(r.at)}</span></span>${r.status === 'draft' ? html`<span class="pill gray">Draft</span>` : ''}</button>
        <div class="req-sum"><span>${icon('dollar', 'mini')}Invoice total</span><b>${money(famInvoice(r.fam) ? invTotal(famInvoice(r.fam)) : invoiceFor(r.fam).total)}</b></div>
        <div class="acts"><button class="btn pri sm" data-act="open-req" data-id="${r.id}">Review</button>${invBtn(r.fam)}</div></div>`; }) : html`<div class="card empty">You're all caught up. New requests land here.</div>`}</div>`;
  }
  const q = ui.q.trim().toLowerCase();
  const fids = [...new Set(db.jobs.map((j) => j.fam))]
    .map((fid) => ({ f: fam(fid), js: famJobs(fid).sort((a, b) => a.date.localeCompare(b.date)) }))
    .filter(({ f, js }) => !q || `${f.name} ${typeLabel(f.type)} ${js.map((j) => `${shortDay(j.date)} ${dayLabel(j.date)} ${j.loc} ${j.service || ''}`).join(' ')}`.toLowerCase().includes(q))
    .sort((a, b) => (a.js.find(upcoming) || a.js[0]).date.localeCompare((b.js.find(upcoming) || b.js[0]).date));
  return html`<h1>Requests</h1><p class="sub">Each family stays together. Every date can be handled on its own.</p>${seg}
    <label class="search">${icon('search')}<span class="sr">Search bookings</span><input id="q" data-input="q" type="search" placeholder="Search a family, date or service" value="${ui.q}"></label>
    <div class="grid2">${fids.length ? fids.map(({ f, js }) => { const i = famInvoice(f.id); return html`<div class="card">
      <div class="fam-h"><span class="ic ${f.type === 'pet' ? 'sage' : 'gold'}">${icon(typeIcon(f.type))}</span><span class="grow"><span class="ttl">${f.name}</span><span class="line2">${typeLabel(f.type)} · ${plural(js.length, 'date')}</span></span>${i ? html`<span class="pill ${invPill(i)}">${invLabel(i)}</span>` : ''}</div>
      ${js.map((j) => visitRow(j, false))}
      <div class="fam-f"><span class="muted small">${i ? `Invoice · ${money(invTotal(i))}` : f.billed ? 'Invoice already sent' : `Invoice total · ${money(invoiceFor(f.id).total)}`}</span>${invBtn(f.id)}</div></div>`; }) : html`<div class="card empty">No bookings match “${ui.q}”.</div>`}</div>`;
}

const dotCls = (j) => (j.status === 'backup' ? 'backup' : j.status === 'open' || j.status === 'interest' ? 'open' : 'ok');
function viewSchedule() {
  const c = ui.cal;
  const week = c.mode === 'week';
  const fit = (j) => ui.filter === 'all' || (ui.filter === 'open' ? j.status === 'open' || j.status === 'interest' : ui.filter === 'assigned' ? j.status === 'assigned' || j.status === 'done' : j.status === ui.filter);
  const all = db.jobs.filter((j) => active(j) && fit(j));
  let a; let b; let label; let grid;
  if (week) {
    a = weekStart(c.ref); b = addDays(a, 6);
    label = a.slice(5, 7) === b.slice(5, 7) ? `${md(a)} – ${dayOf(b).getDate()}` : `${md(a)} – ${md(b)}`;
    grid = html`<div class="week">${Array.from({ length: 7 }, (_, k) => addDays(a, k)).map((d) => { const js = all.filter((j) => covers(j, d)); const dd = dayOf(d); return html`<button class="day ${c.day === d ? 'on' : ''} ${d === TODAY ? 'today' : ''}" data-act="cal-day" data-day="${d}" aria-pressed="${c.day === d}"><span>${dd.toLocaleDateString('en-US', { weekday: 'short' })}</span><b>${dd.getDate()}</b><span class="dots">${js.slice(0, 3).map((j) => raw(`<i class="${dotCls(j)}"></i>`))}</span></button>`; })}</div>`;
  } else {
    a = monthStart(c.ref); b = addDays(addMonths(a, 1), -1);
    label = fMon.format(dayOf(a));
    const g0 = weekStart(a); const n = diffDays(g0, addDays(weekStart(b), 6)) + 1;
    grid = html`<div class="month"><div class="mhead">${['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((x) => raw(`<span>${x}</span>`))}</div><div class="mgrid">${Array.from({ length: n }, (_, k) => addDays(g0, k)).map((d) => { const js = all.filter((j) => covers(j, d)); const out = d < a || d > b; return html`<button class="mday ${out ? 'out' : ''} ${d === TODAY ? 'today' : ''} ${c.day === d ? 'on' : ''}" data-act="cal-day" data-day="${d}" aria-label="${fLong.format(dayOf(d))}, ${plural(js.length, 'booking')}"><span class="num">${dayOf(d).getDate()}</span><span class="dots">${js.slice(0, 3).map((j) => raw(`<i class="${dotCls(j)}"></i>`))}</span>${js.length > 3 ? raw(`<em>+${js.length - 3}</em>`) : ''}</button>`; })}</div></div>`;
  }
  const inRange = all.filter((j) => (j.end_d || j.date) >= a && j.date <= b);
  const list = (c.day ? inRange.filter((j) => covers(j, c.day)) : inRange).sort((x, y) => (x.date + x.start).localeCompare(y.date + y.start));
  const key = (j) => c.day || (j.date < a ? a : j.date);
  const groups = [...new Set(list.map(key))].sort();
  const F = [['all', 'All'], ['open', 'Open'], ['assigned', 'Covered'], ['backup', 'Needs backup']];
  const span1 = c.day ? 'on this day' : week ? 'this week' : 'this month';
  return html`<h1>Calendar</h1><p class="sub">Babysitting and pet visits together, with who's covering each one.</p>
    <div class="cal">
      <div class="cal-main">
        <div class="cal-bar"><div class="seg sm"><button class="${week ? 'on' : ''}" data-act="cal-mode" data-m="week">Week</button><button class="${week ? '' : 'on'}" data-act="cal-mode" data-m="month">Month</button></div>
          <button class="chip-btn" data-act="cal-today">Today</button></div>
        <div class="cal-nav"><button class="icon-btn" data-act="cal-move" data-n="-1" aria-label="Previous ${week ? 'week' : 'month'}">${icon('chevron-left')}</button><b>${label}</b><button class="icon-btn" data-act="cal-move" data-n="1" aria-label="Next ${week ? 'week' : 'month'}">${icon('chevron-right')}</button></div>
        <div data-swipe>${grid}</div>
        <div class="legend"><span><i class="ok"></i>Covered</span><span><i class="open"></i>Needs a sitter</span><span><i class="backup"></i>Needs backup</span></div>
      </div>
      <div class="cal-list">
        <div class="filters">${F.map(([k, l]) => html`<button class="${ui.filter === k ? 'on' : ''}" data-act="filter" data-f="${k}">${l}</button>`)}</div>
        ${c.day ? html`<div class="sec-h"><h2>${fLong.format(dayOf(c.day))}</h2><button class="chip-btn" data-act="cal-day" data-day="${c.day}">Show all</button></div>` : ''}
        ${groups.length ? groups.map((d) => html`${c.day ? '' : html`<div class="group-day">${dayLabel(d)}${/^(Today|Tomorrow|Yesterday)$/.test(dayLabel(d)) ? `, ${md(d)}` : ''}</div>`}<div class="card">${list.filter((j) => key(j) === d).map((j) => visitRow(j))}</div>`) : html`<div class="card empty">Nothing ${ui.filter === 'all' ? 'booked' : 'here'} ${span1}.</div>`}
      </div>
    </div>`;
}

function viewInvoices() {
  const list = [...db.invoices].sort((x, y) => y.at - x.at);
  const drafts = list.filter((i) => i.status === 'draft');
  const ready = [...new Set([...db.jobs.filter((j) => active(j) && upcoming(j)).map((j) => j.fam), ...db.requests.filter((r) => r.status !== 'approved').map((r) => r.fam)])].filter((fid) => !famInvoice(fid) && !fam(fid).billed && famDates(fid).length);
  return html`<h1>Invoices</h1><p class="sub">Preview each invoice with your fees and deposits, edit it if you need to, then send it to Square as a draft.</p>
    <div class="inv-sum"><div><b>${drafts.length}</b><span>To check</span></div><div><b>${list.length - drafts.length}</b><span>In Square</span></div><div><b>${money(drafts.reduce((t, i) => t + invTotal(i), 0))}</b><span>Waiting to send</span></div></div>
    <div class="sec-h"><h2>Invoices</h2></div>
    <div class="grid2">${list.length ? list.map((i) => { const f = fam(i.fam); return html`<button class="card inv-row" data-act="open-inv" data-id="${i.id}"><span class="ic ${f.type === 'pet' ? 'sage' : 'green'}">${icon('receipt')}</span><span class="grow"><span class="ttl">${f.name}</span><span class="line2">${typeLabel(f.type)} · ${ago(i.at)}</span></span><span class="amt"><b>${money(invTotal(i))}</b><span class="pill ${invPill(i)}">${invLabel(i)}</span></span></button>`; }) : html`<div class="card empty">No invoices yet.</div>`}</div>
    ${ready.length ? html`<div class="sec-h"><h2>Ready to invoice</h2></div><div class="grid2">${ready.map((fid) => { const f = fam(fid); return html`<div class="card inv-row"><span class="ic ${f.type === 'pet' ? 'sage' : 'gold'}">${icon(typeIcon(f.type))}</span><span class="grow"><span class="ttl">${f.name}</span><span class="line2">${typeLabel(f.type)} · ${money(invoiceFor(fid).total)}</span></span>${invBtn(fid)}</div>`; })}</div>` : ''}`;
}

/* ---------- views: sitter ---------- */
function jobCardSitter(j, mine) {
  const iAm = j.interested.some((i) => i.id === ME);
  let actions;
  if (mine) {
    actions = j.status === 'backup'
      ? html`<div class="wait">${icon('clock')}<span><b>Backup requested.</b> Staff are finding someone.</span></div>`
      : j.type === 'pet'
        ? html`<div class="acts"><button class="btn ${j.visitDone ? 'done' : 'pri'} sm" data-act="visit" data-id="${j.id}">${j.visitDone ? raw(`${icon('check').s} Visit done`) : 'Start visit'}</button><button class="btn sec sm" data-act="cal" data-id="${j.id}">${icon('calendar')} Add to calendar</button></div>`
        : html`<div class="acts"><button class="btn sec sm" data-act="cal" data-id="${j.id}">${icon('calendar')} Add to calendar</button><button class="btn sec sm" data-act="ask-backup" data-id="${j.id}">Need a backup?</button></div>`;
  } else {
    actions = iAm
      ? html`<div class="wait ok">${icon('check')}<span><b>Interest sent.</b> Staff will confirm who's booked.</span></div>`
      : html`<button class="btn pri sm block" data-act="interest" data-id="${j.id}">I'm interested</button>`;
  }
  return html`<div class="pad job">
    <div class="row"><b class="grow">${j.type === 'pet' && j.end_d ? `${shortDay(j.date)} to ${shortDay(j.end_d)}` : `${dayLabel(j.date)} · ${span(j.start, j.end)}`}</b>${j.status === 'backup' && !mine ? html`<span class="pill backup">Backup needed</span>` : ''}</div>
    <div class="post">${j.post}</div>${actions}</div>`;
}
const openForMe = () => db.jobs.filter((j) => active(j) && upcoming(j) && j.sitter !== ME && ['open', 'interest', 'backup'].includes(j.status));
function viewSitterOpen() {
  const js = openForMe();
  const fids = [...new Set(js.sort((a, b) => a.date.localeCompare(b.date)).map((j) => j.fam))];
  return html`<h1>Open jobs</h1><p class="sub">Tap I'm interested on any date. Staff confirm who's booked.</p>
    <div class="stack">${fids.length ? fids.map((fid) => { const f = fam(fid); return html`<div class="card"><div class="fam-h"><span class="ic ${f.type === 'pet' ? 'sage' : 'gold'}">${icon(typeIcon(f.type))}</span><span class="grow"><span class="ttl">${f.name}</span><span class="line2">${typeLabel(f.type)}</span></span></div>${js.filter((j) => j.fam === fid).map((j) => jobCardSitter(j, false))}</div>`; }) : html`<div class="card empty">No open jobs right now. New ones show up here as soon as staff post them.</div>`}</div>`;
}
function viewSitterMine() {
  const next = db.jobs.filter((j) => j.sitter === ME && active(j) && upcoming(j) && j.status !== 'done').sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
  return html`<h1>My jobs</h1><p class="sub">${next.length ? `You have ${plural(next.length, 'visit')} coming up.` : 'Nothing booked yet.'}</p>
    <div class="stack">${next.map((j) => html`<div class="card"><div class="fam-h"><span class="ic ${j.type === 'pet' ? 'sage' : 'green'}">${icon(typeIcon(j.type))}</span><span class="grow"><span class="ttl">${fam(j.fam).name}</span><span class="line2">${typeLabel(j.type)}${j.mg ? ` · Meet and greet ${j.mg === 'done' ? 'done' : 'scheduled'}` : ''}</span></span></div>${jobCardSitter(j, true)}</div>`)}</div>`;
}

/* ---------- sheets ---------- */
function sheetShell(title, body, foot = '', lead = '', wide = false) {
  const back = ui.sheet && ui.sheet.back ? html`<button class="icon-btn" data-act="back" aria-label="Back">${icon('arrow-left')}</button>` : '';
  return html`<div class="sheet-wrap"><div class="scrim" data-act="close"></div><div class="sheet ${wide ? 'wide' : ''}" role="dialog" aria-modal="true" aria-label="${title || 'Field 2 Forest'}"><span class="grab"></span>
    <div class="sheet-h">${back}${lead ? raw(lead) : ''}<h2>${title}</h2><button class="icon-btn" data-act="close" aria-label="Close">${icon('x')}</button></div>
    <div class="sheet-b">${body}</div>${foot ? html`<div class="sheet-f">${foot}</div>` : ''}</div></div>`;
}
const privateBox = (f, extra = true) => html`<div class="lock">${icon('lock')} Only staff see this</div>
  <div class="private"><div>${icon('phone')} ${f.contact.phone}</div><div>${icon('mail')} ${f.contact.email}</div><div>${icon('map-pin')} ${f.contact.address}</div>${extra ? Object.values(f.extra || {}).map((v) => html`<div class="muted">${v}</div>`) : ''}</div>`;

function sheetReq(r) {
  const f = fam(r.fam);
  const i = famInvoice(r.fam);
  const c = invoiceFor(r.fam);
  const rows = r.rows.map((row, k) => html`<div class="post-row"><span class="n">${row.n}</span><div class="grow"><b class="small-b">${r.type === 'pet' ? `${shortDay(row.date)} to ${shortDay(row.end)} · from ${t12(row.start)}` : `${dayLabel(row.date)} · ${span(row.start, row.end)}`}</b>
    <textarea rows="${row.post.split('\n').length}" data-input="post" data-id="${r.id}" data-k="${k}" aria-label="Job post for date ${row.n}">${row.post}</textarea></div></div>`);
  const body = html`<p class="muted small top0">${typeLabel(r.type)} · received ${ago(r.at)} from your website form${r.status === 'draft' ? ' · saved as a draft' : ''}</p>
    <div class="inv-mini"><span class="ic sage">${icon('receipt')}</span><span class="grow"><span class="ttl">${i ? `Invoice · ${invLabel(i)}` : 'Invoice'}</span><span class="line2">${c.proposal ? 'Booking fee and pet sitting' : 'Booking fee and deposits'} · ${money(i ? invTotal(i) : c.total)}</span></span>${i ? html`<button class="btn sec sm" data-act="open-inv" data-id="${i.id}">View</button>` : html`<button class="btn sec sm" data-act="invoice" data-id="${r.fam}">Generate invoice</button>`}</div>
    <div class="sec-h"><h2>What sitters will see</h2></div>
    <div class="card pad"><div class="fam-preview">${f.name}</div>${rows}</div>
    <p class="hint">Edit any line. Your version is what goes on the board. Addresses stay short (City: Street).</p>
    <div class="field"><label for="notes">Notes for sitters (kept separate from the job)</label><textarea id="notes" rows="2" data-input="notes" data-id="${r.id}">${r.notes}</textarea></div>
    ${privateBox(f)}`;
  const n = r.rows.length;
  const foot = html`${r.status !== 'draft' ? html`<button class="btn sec" data-act="to-draft" data-id="${r.id}">Save as draft</button>` : ''}<button class="btn pri" data-act="approve" data-id="${r.id}">${icon('check')} ${r.type === 'pet' ? 'Approve and post' : `Approve ${plural(n, 'date')}`}</button>`;
  return sheetShell(f.name, body, foot, `<span class="ic ${r.type === 'pet' ? 'sage' : 'gold'}">${icon(typeIcon(r.type)).s}</span>`);
}

function sitterPick(j, ids, label = 'Assign') {
  return ids.map((id) => { const it = j.interested.find((x) => x.id === id); return html`<div class="person">${av(id)}<span class="grow"><span class="ttl">${person(id).name}</span>${it ? html`<span class="line2">Interested ${ago(it.at).toLowerCase()}</span>` : ''}</span><button class="btn pri sm" data-act="assign" data-id="${j.id}" data-s="${id}">${label}</button></div>`; });
}
function sheetJobOwner(j) {
  const f = fam(j.fam);
  const others = SITTERS.map((s) => s.id).filter((id) => id !== j.sitter && !j.interested.some((i) => i.id === id));
  let cover;
  if (j.status === 'closed') cover = html`<p class="muted">This date is closed. Reopen it to put it back on the board.</p>`;
  else if (j.status === 'done') cover = html`<div class="person">${av(j.sitter)}<span class="grow"><span class="ttl">${person(j.sitter).name}</span><span class="line2">Visit done</span></span></div>`;
  else if (j.status === 'assigned') cover = html`<div class="person">${av(j.sitter)}<span class="grow"><span class="ttl">${person(j.sitter).name}</span><span class="line2">Booked for this date</span></span><button class="btn sec sm" data-act="more">${ui.more ? 'Keep' : 'Reassign'}</button></div>${ui.more ? sitterPick(j, SITTERS.map((s) => s.id).filter((id) => id !== j.sitter)) : ''}`;
  else if (j.status === 'backup') cover = html`<div class="note">${first(j.sitter)} asked for a backup${j.backupNote ? `: “${j.backupNote}”` : '.'}</div>${sitterPick(j, SITTERS.map((s) => s.id).filter((id) => id !== j.sitter))}<p class="hint">Or leave ${first(j.sitter)} on it if you sort it out together.</p>`;
  else if (j.status === 'interest') cover = html`${sitterPick(j, j.interested.map((i) => i.id))}<details><summary>Assign someone else</summary>${sitterPick(j, others)}</details>`;
  else cover = html`<p class="muted top0">No one has raised a hand yet.</p><button class="btn sec block" data-act="ask" data-id="${j.id}">${icon('send')} Ask my sitters</button><details><summary>Or assign someone directly</summary>${sitterPick(j, others)}</details>`;
  const i = famInvoice(j.fam);
  const hist = db.history.filter((h) => h.job === j.id || (h.fam === j.fam && !h.job)).slice(-5).reverse();
  const body = html`<div class="row mb"><span class="pill ${j.status}">${j.status === 'assigned' ? 'Covered' : statusLabel(j)}</span><span class="muted small">${typeLabel(j.type)} · date ${j.n} of ${famJobs(j.fam).length}</span></div>
    <div class="facts">
      <div class="fact">${icon('clock')}<div><b>${j.type === 'pet' && j.end_d ? `${shortDay(j.date)} to ${shortDay(j.end_d)}` : dayLabel(j.date) + (Math.abs(diffDays(TODAY, j.date)) < 2 ? `, ${md(j.date)}` : '')}</b><div class="line2">${j.type === 'pet' && j.end_d ? `${plural(diffDays(j.date, j.end_d), 'night')}, from ${t12(j.start)}` : `${span(j.start, j.end)} · ${hrs(j.start, j.end)} hours`}</div></div></div>
      <div class="fact">${icon(typeIcon(j.type))}<div>${j.type === 'pet' ? j.pets : kidsLine(j.kids, j.ages)}</div></div>
      <div class="fact">${icon('map-pin')}<div>${j.loc}</div></div>
      ${j.care ? html`<div class="fact">${icon('info')}<div>${j.care}</div></div>` : ''}
      ${j.allergy ? html`<div><span class="tag">${icon('alert')} Allergy: ${j.allergy}</span></div>` : ''}
      ${j.type === 'pet' ? html`<div class="fact">${icon('users')}<div class="grow row">Meet and greet: <b>${j.mg === 'done' ? 'done' : 'scheduled'}</b>${j.mg !== 'done' ? html`<button class="chip-btn" data-act="mg" data-id="${j.id}">Mark done</button>` : ''}</div></div>` : ''}
    </div>
    <div class="sec-h"><h2>Who's covering</h2></div><div>${cover}</div>
    <div class="sec-h"><h2>Job post</h2></div><div class="card pad post">${j.post}</div>
    <div class="acts mt">
      <button class="btn sec sm" data-act="cal" data-id="${j.id}">${icon('calendar')} Calendar link</button>
      ${i ? html`<button class="btn sec sm" data-act="open-inv" data-id="${i.id}">${icon('receipt')} View invoice</button>` : f.billed ? html`<span class="btn sec sm is-static">${icon('check')} Billed</span>` : html`<button class="btn sec sm" data-act="invoice" data-id="${j.fam}">${icon('receipt')} Generate invoice</button>`}
      ${j.status === 'done' ? '' : j.status === 'closed' ? html`<button class="btn sec sm span2" data-act="reopen" data-id="${j.id}">${icon('refresh')} Reopen date</button>` : html`<button class="btn warn sm span2" data-act="close-job" data-id="${j.id}">Close this date</button>`}
    </div>
    ${privateBox(f, false)}
    ${hist.length ? html`<div class="sec-h"><h2>History</h2></div><div class="hist">${hist.map((h) => html`<div>${av(h.who, 'sm')}<span>${h.text}</span><time>${ago(h.at)}</time></div>`)}</div>` : ''}`;
  return sheetShell(f.name, body, '', `<span class="ic ${j.type === 'pet' ? 'sage' : 'gold'}">${icon(typeIcon(j.type)).s}</span>`);
}
function sheetJobSitter(j) {
  return sheetShell(fam(j.fam).name, html`<div class="card">${jobCardSitter(j, j.sitter === ME)}</div>`);
}

function sheetVisit(j) {
  const list = j.list || ['Check in with the pets', 'Food and fresh water', 'Potty break or walk', 'Send the family a photo'];
  const body = html`<p class="muted small top0">${j.service} · ${j.pets}</p>
    <div class="card pad">${list.map((item, k) => html`<button class="check ${j.checks[k] ? 'on' : ''}" data-act="check" data-id="${j.id}" data-k="${k}" aria-pressed="${!!j.checks[k]}"><span class="box">${j.checks[k] ? icon('check') : ''}</span><span>${item}</span></button>`)}</div>
    <p class="hint">In the live app the photo goes to the family, and staff see the visit is done.</p>`;
  const all = list.every((_, k) => j.checks[k]);
  return sheetShell(`Visit for ${fam(j.fam).name}`, body, html`<button class="btn pri" data-act="visit-done" data-id="${j.id}" ${all ? '' : 'disabled'}>${icon('check')} Mark visit complete</button>`);
}

function sheetInvoice(i) {
  invData(i);
  const f = fam(i.fam);
  const edit = ui.edit && i.status === 'draft';
  const amtStr = (n) => (Number.isInteger(n) ? String(n) : (Math.round(n * 100) / 100).toFixed(2));
  const ribbon = i.status === 'square'
    ? html`<div class="ribbon ok">${icon('check-circle')} In Square as draft #${i.no} (simulated). Send it to the family from Square.</div>`
    : html`<div class="ribbon">${icon('info')} ${i.proposal ? 'Pet-sitting invoices aren’t automated yet. This shows how they could look. ' : ''}Preview only. Nothing is in Square or charged yet.</div>`;
  const lines = edit
    ? html`${i.lines.map((l, k) => html`<div class="inv-eline"><input id="il-l-${k}" class="inp grow" data-input="il" data-f="label" data-k="${k}" value="${l.label}" aria-label="Line ${k + 1} description"><label class="amt-in"><span>$</span><input id="il-a-${k}" class="inp" inputmode="decimal" data-input="il" data-f="amt" data-k="${k}" value="${amtStr(Number(l.amt) || 0)}" aria-label="Line ${k + 1} amount"></label><button class="icon-btn sm" data-act="il-del" data-k="${k}" aria-label="Remove line ${k + 1}">${icon('trash')}</button></div>`)}
      <button class="btn ghost sm" data-act="il-add">${icon('plus')} Add a line</button>`
    : i.lines.map((l) => html`<div class="inv-line"><span>${l.label}${l.sub ? html`<small>${l.sub}</small>` : ''}</span><span>${money(Number(l.amt) || 0)}</span></div>`);
  const body = html`${ribbon}
    <div class="inv ${edit ? 'editing' : ''}"><div class="inv-top"><div class="grow">${edit ? html`<input id="it" class="inp title" data-input="it" value="${i.title}" aria-label="Invoice title">` : html`<h3>${i.title}</h3>`}<div class="muted small">Due in 30 days · For ${f.name}</div></div><img src="${IMG}f2f-mark.png" alt="Field 2 Forest"></div>
      ${edit ? html`<textarea id="im" class="inp msg" rows="3" data-input="im" aria-label="Message to the family">${i.msg}</textarea>` : html`<p class="small muted msg">${i.msg}</p>`}
      ${lines}
      <div class="inv-total"><span>Total due now</span><span data-total>${money(invTotal(i))}</span></div>
      <div class="inv-note">${i.note}</div></div>`;
  const foot = i.status === 'square'
    ? html`<button class="btn pri" data-act="close">Done</button>`
    : edit
      ? html`<button class="btn pri" data-act="inv-edit">${icon('check')} Done editing</button>`
      : html`<button class="btn sec" data-act="inv-edit">${icon('edit')} Edit invoice</button><button class="btn pri" data-act="send-sq" data-id="${i.id}">${icon('send')} Send to Square</button>`;
  return sheetShell(edit ? 'Edit invoice' : 'Invoice preview', body, foot, '', true);
}
function sheetSquare(s) {
  const i = inv(s.id);
  const f = fam(i.fam);
  if (s.phase === 'working') {
    return sheetShell('Send to Square', html`<div class="sq-wait"><span class="spin" aria-hidden="true"></span><b>Creating the draft in Square…</b><p class="muted small">${f.name} · ${plural(i.lines.length, 'line')} · ${money(invTotal(i))}</p></div>`);
  }
  const body = html`<div class="welcome"><span class="ic green big">${icon('check')}</span><h2>Draft created in Square</h2><p class="muted">Simulated for the demo. In the live app it lands in your Square account, ready for you to send to ${f.name}.</p></div>
    <div class="sq-card"><div class="sq-h"><b>Square invoice</b><span class="pill draft">Draft</span></div>
      <div class="sq-row"><span>Invoice</span><b>#${i.no}</b></div><div class="sq-row"><span>Customer</span><b>${f.name}</b></div>
      <div class="sq-row"><span>Amount</span><b>${money(invTotal(i))}</b></div><div class="sq-row"><span>Due</span><b>${md(plus(30))}</b></div>
      <div class="sq-row"><span>Sent by</span><b>You, from Square</b></div></div>`;
  return sheetShell('', body, html`<button class="btn sec" data-act="open-inv" data-id="${i.id}">View invoice</button><button class="btn pri" data-act="close">Done</button>`);
}

function sheetRole() {
  const opt = (role, id, title, sub) => html`<button class="choice ${db.role === role ? 'on' : ''}" data-act="set-role" data-role="${role}">${av(id, 'lg')}<span class="grow"><span class="ttl">${title}</span><span class="line2">${sub}</span></span>${db.role === role ? icon('check') : ''}</button>`;
  const body = html`${opt('owner', 'staff', 'Staff view', 'Requests, calendar, sitters and invoices')}${opt('sitter', ME, 'Sitter view', 'Open jobs and booked visits, on a sitter’s phone')}
    <div class="sec-h"><h2>Demo</h2></div>
    <button class="menu-item" data-act="activity">${icon('activity')} Activity</button>
    <button class="menu-item" data-act="coach">${icon('sparkles')} Show me around</button>
    <button class="menu-item" data-act="install">${icon('smartphone')} Put it on your home screen</button>
    <button class="menu-item" data-act="reset">${icon('refresh')} Start over with fresh sample data</button>
    <p class="foot">A demo by AP Webmaster. Sample families and sitters only. Nothing is sent, posted or charged.</p>`;
  return sheetShell('Switch view', body);
}
function sheetActivity() {
  const list = [...db.history].reverse().slice(0, 25);
  return sheetShell('Activity', html`<div class="hist">${list.map((h) => html`<div>${av(h.who, 'sm')}<span><b>${h.who === 'system' ? 'Website' : first(h.who)}</b> · ${h.text}</span><time>${ago(h.at)}</time></div>`)}</div>`);
}
function sheetInstall() {
  return sheetShell('Put it on your home screen', html`<p class="muted top0">It opens full screen like any other app, with the Field 2 Forest icon.</p>
    <div class="sec-h"><h2>iPhone</h2></div><ol class="steps"><li>Open this page in Safari.</li><li>Tap the <b>Share</b> button.</li><li>Tap <b>Add to Home Screen</b>, then <b>Add</b>.</li></ol>
    <div class="sec-h"><h2>Android</h2></div><ol class="steps"><li>Open this page in Chrome.</li><li>Tap the <b>⋮</b> menu.</li><li>Tap <b>Add to Home screen</b> or <b>Install app</b>.</li></ol>`);
}
function sheetBackup(j) {
  return sheetShell('Ask for a backup?', html`<p class="top0">Staff will find someone for <b>${fam(j.fam).name} · ${when(j)}</b>. You stay on it until they do.</p>
    <div class="field"><label for="why">Anything staff should know? (optional)</label><textarea id="why" rows="2" placeholder="e.g. I'm sick"></textarea></div>`,
  html`<button class="btn sec" data-act="close">Never mind</button><button class="btn pri" data-act="backup" data-id="${j.id}">Ask for a backup</button>`);
}
function renderSheet() {
  const s = ui.sheet;
  if (!s) return '';
  if (s.t === 'req') return sheetReq(req(s.id));
  if (s.t === 'job') return isOwner() ? sheetJobOwner(job(s.id)) : sheetJobSitter(job(s.id));
  if (s.t === 'inv') return sheetInvoice(inv(s.id));
  if (s.t === 'sq') return sheetSquare(s);
  if (s.t === 'visit') return sheetVisit(job(s.id));
  if (s.t === 'backup') return sheetBackup(job(s.id));
  return { role: sheetRole, activity: sheetActivity, install: sheetInstall }[s.t]?.() || '';
}

/* ---------- frame ---------- */
function frame() {
  const owner = isOwner();
  const ns = owner ? needs().length : 0;
  const reqN = db.requests.filter((r) => r.status !== 'approved').length;
  const tabs = owner
    ? [['today', 'home', 'Home', ns], ['requests', 'inbox', 'Requests', reqN], ['schedule', 'calendar', 'Calendar', 0], ['invoices', 'receipt', 'Invoices', 0]]
    : [['open', 'search', 'Open jobs', openForMe().filter((j) => !j.interested.some((i) => i.id === ME)).length], ['mine', 'calendar-check', 'My jobs', 0]];
  const cur = owner ? ui.tab : ui.stab;
  const view = owner ? { today: viewToday, requests: viewRequests, schedule: viewSchedule, invoices: viewInvoices }[ui.tab]() : ui.stab === 'mine' ? viewSitterMine() : viewSitterOpen();
  const newAct = db.history.length > (db.seenAct || 0);
  const app = html`<div class="app ${owner ? 'owner' : 'sitter'}">
    <header class="top"><div class="brand"><img src="${IMG}f2f-mark.png" alt=""><div><b>Field 2 Forest</b><small>${owner ? 'Bookings' : 'Sitter app'}<span class="demo-tag">Demo</span></small></div></div><span class="grow"></span>
      ${owner ? html`<button class="icon-btn" data-act="activity" aria-label="Activity">${icon('bell')}${newAct ? raw('<span class="dot"></span>') : ''}</button>` : ''}
      <button class="who" data-act="role" data-coach="who" aria-label="Switch view">${av(owner ? 'staff' : ME, 'sm')}<span>${owner ? 'Staff' : 'Sitter'}<span class="wide-only"> view</span></span>${icon('chevron-down', 'chev')}</button></header>
    <nav class="tabs" aria-label="Main">${tabs.map(([id, ic, label, badge]) => html`<button class="tab ${cur === id ? 'on' : ''}" data-act="tab" data-tab="${id}" data-coach="tab-${id}" aria-current="${cur === id ? 'page' : 'false'}"><span class="tab-ic">${icon(ic)}</span><span class="tab-l">${label}</span>${badge ? html`<span class="badge">${badge}</span>` : ''}</button>`)}
      ${owner ? html`<div class="side-card"><b>Sitter view</b><p>See what your sitters get on their phones.</p><button class="btn sec sm block" data-act="set-role" data-role="sitter">${icon('smartphone')} Open sitter view</button></div>` : ''}</nav>
    <main class="main" id="main">${view}</main>
    ${renderSheet()}
    <div class="toasts" aria-live="polite"></div>
  </div>`;
  if (owner) return app;
  return html`<div class="stage"><div class="stage-note"><img src="${IMG}f2f-mark.png" alt=""><h2>Sitter view</h2><p>What your sitters see on their phones: open jobs to raise a hand for and their own visits. No private family details.</p><button class="btn sec" data-act="set-role" data-role="owner">${icon('arrow-left')} Back to staff view</button></div>${app}</div>`;
}

/* ---------- render ---------- */
const root = document.getElementById('f2f-root');
function render() {
  const a = document.activeElement;
  const focusId = a && a.id;
  const sel = a && 'selectionStart' in a ? a.selectionStart : null;
  const mainTop = document.getElementById('main')?.scrollTop || 0;
  const winTop = window.scrollY;
  const sb = document.querySelector('.sheet-b');
  const sheetTop = sb ? sb.scrollTop : 0;
  const oldToasts = document.querySelector('.toasts');
  const keep = oldToasts ? [...oldToasts.children] : [];
  document.body.classList.toggle('sitter-frame', !isOwner());
  root.innerHTML = frame().s + coachHtml().s;
  const nt = document.querySelector('.toasts');
  keep.forEach((t) => nt.appendChild(t));
  const m = document.getElementById('main'); if (m) m.scrollTop = mainTop;
  window.scrollTo(0, winTop);
  const nsb = document.querySelector('.sheet-b'); if (nsb && ui.keepSheetScroll) nsb.scrollTop = sheetTop;
  ui.keepSheetScroll = false;
  if (focusId) { const f = document.getElementById(focusId); if (f) { f.focus({ preventScroll: true }); if (sel != null && f.setSelectionRange) try { f.setSelectionRange(sel, sel); } catch (e) { /* ignore */ } } }
  positionCoach();
  save();
}

/* ---------- actions ---------- */
function openSheet(sheet) { ui.sheet = sheet; ui.more = false; render(); const b = document.querySelector('.sheet .icon-btn[data-act="close"]'); if (b) b.focus({ preventScroll: true }); }
const backFrom = () => (ui.sheet && (ui.sheet.t === 'req' || ui.sheet.t === 'job') ? ui.sheet : null);
function setRole(role) {
  db.role = role; ui.sheet = null; window.scrollTo(0, 0);
  hideHint();
  render();
  if (role === 'sitter' && !tour.sitter) { tour.sitter = true; saveTour(); showHint(); return; }
  toast(role === 'sitter' ? 'Now in the sitter view' : 'Back to the staff view');
}
/* Small, non-blocking hint by the view switcher (no dimming, nothing to click through). */
let hintTimer = 0;
function hideHint() { clearTimeout(hintTimer); document.querySelector('.hint')?.remove(); document.removeEventListener('pointerdown', hideHint, true); window.removeEventListener('resize', placeHint); }
function placeHint() {
  const h = document.querySelector('.hint'); const who = document.querySelector('.who');
  if (!h || !who) return;
  const r = who.getBoundingClientRect(); const w = h.offsetWidth;
  const left = Math.max(10, Math.min(window.innerWidth - w - 10, r.right - w));
  h.style.left = `${left}px`; h.style.top = `${r.bottom + 10}px`;
  h.style.setProperty('--ax', `${Math.min(w - 18, Math.max(18, r.left + r.width / 2 - left))}px`);
}
function showHint() {
  hideHint();
  const h = document.createElement('div');
  h.className = 'hint'; h.setAttribute('role', 'status');
  h.innerHTML = `${icon('arrow-left').s}<span>Tap here to go back to the staff view</span>`;
  document.body.appendChild(h); placeHint();
  requestAnimationFrame(() => h.classList.add('in'));
  window.addEventListener('resize', placeHint);
  setTimeout(() => document.addEventListener('pointerdown', hideHint, true), 300);
  hintTimer = setTimeout(hideHint, 6000);
}
const A = {
  tab: (d) => { if (isOwner()) ui.tab = d.tab; else ui.stab = d.tab; ui.sheet = null; window.scrollTo(0, 0); render(); },
  seg: (d) => { ui.seg = d.seg; render(); },
  'need-f': (d) => { ui.need = ui.need === d.k ? null : d.k; render(); },
  filter: (d) => { ui.filter = d.f; render(); },
  'cal-mode': (d) => { ui.cal.mode = d.m; ui.cal.day = null; render(); },
  'cal-move': (d) => { const n = Number(d.n); ui.cal.ref = ui.cal.mode === 'week' ? addDays(ui.cal.ref, 7 * n) : addMonths(ui.cal.ref, n); ui.cal.day = null; render(); },
  'cal-today': () => { ui.cal.ref = TODAY; ui.cal.day = ui.cal.day === TODAY ? null : TODAY; render(); },
  'cal-day': (d) => { ui.cal.day = ui.cal.day === d.day ? null : d.day; render(); },
  close: () => { ui.sheet = null; ui.edit = false; render(); },
  back: () => { ui.sheet = ui.sheet.back; ui.edit = false; render(); },
  role: () => openSheet({ t: 'role' }),
  'set-role': (d) => setRole(d.role),
  'open-req': (d) => openSheet({ t: 'req', id: d.id }),
  'open-job': (d) => openSheet({ t: 'job', id: d.id }),
  'open-inv': (d) => { ui.edit = false; openSheet({ t: 'inv', id: d.id, back: backFrom() }); },
  more: () => { ui.more = !ui.more; ui.keepSheetScroll = true; render(); },
  approve: (d) => {
    const r = req(d.id);
    r.status = 'approved';
    r.rows.forEach((row) => {
      db.jobs.push({ id: uid('j'), fam: r.fam, type: r.type, n: row.n, date: row.date, end_d: row.type === 'pet' ? row.end : undefined, start: row.start, end: row.type === 'pet' ? row.end_t : row.end, kids: row.kids, ages: row.ages, loc: row.loc, allergy: row.allergy, care: row.care, event: row.event, service: row.service, pets: row.pets, post: row.post, notes: r.notes, status: 'open', interested: [], sitter: null, checks: {}, mg: row.type === 'pet' ? 'scheduled' : undefined });
    });
    const f = fam(r.fam);
    log('staff', `Approved ${f.name} and posted ${r.type === 'pet' ? 'the stay' : plural(r.rows.length, 'date')} to the job board`, { fam: r.fam });
    ui.sheet = null;
    // Let a sitter respond so the board feels alive.
    setTimeout(() => { const j = db.jobs.filter((x) => x.fam === r.fam && x.status === 'open')[0]; if (!j) return; j.interested.push({ id: 'elena', at: Date.now() }); j.status = 'interest'; log('elena', `Interested in ${f.name} · ${shortDay(j.date)}`, { job: j.id }); render(); toast(`${first('elena')} is interested in ${f.name}, ${shortDay(j.date)}`, { label: 'View', run: () => openSheet({ t: 'job', id: j.id }) }); }, 4000);
    render();
    toast(r.type === 'pet' ? `${f.name}'s stay is on the job board` : `${plural(r.rows.length, 'date')} posted for ${f.name}`);
  },
  'to-draft': (d) => { const r = req(d.id); r.status = 'draft'; log('staff', `Saved ${fam(r.fam).name}'s request as a draft`, { fam: r.fam }); ui.sheet = null; render(); toast('Saved as a draft. It stays in Requests.'); },
  interest: (d) => {
    const j = job(d.id);
    if (j.interested.some((i) => i.id === ME)) return;
    j.interested.push({ id: ME, at: Date.now() });
    if (j.status === 'open') j.status = 'interest';
    log(ME, `Interested in ${fam(j.fam).name} · ${shortDay(j.date)}`, { job: j.id });
    ui.sheet = null; render(); toast('Sent. Staff will confirm who’s booked.');
  },
  assign: (d) => {
    const j = job(d.id);
    const was = j.sitter;
    j.sitter = d.s; j.status = 'assigned'; j.interested = []; j.backupNote = '';
    log('staff', was && was !== d.s ? `Moved ${fam(j.fam).name} · ${shortDay(j.date)} from ${first(was)} to ${person(d.s).name}` : `Assigned ${person(d.s).name} to ${fam(j.fam).name} · ${shortDay(j.date)}`, { job: j.id });
    ui.more = false; ui.keepSheetScroll = true; render();
    toast(`${first(d.s)} is booked and sees it under My jobs.`);
  },
  ask: (d) => {
    const j = job(d.id);
    toast('Sent to your sitters (simulated)');
    log('staff', `Asked sitters about ${fam(j.fam).name} · ${shortDay(j.date)}`, { job: j.id });
    ui.keepSheetScroll = true;
    setTimeout(() => { if (j.status !== 'open') return; j.interested.push({ id: 'elena', at: Date.now() }); j.status = 'interest'; log('elena', `Interested in ${fam(j.fam).name} · ${shortDay(j.date)}`, { job: j.id }); ui.keepSheetScroll = true; render(); toast(`${first('elena')} is interested in ${fam(j.fam).name}, ${shortDay(j.date)}`); }, 2500);
    render();
  },
  'ask-backup': (d) => openSheet({ t: 'backup', id: d.id }),
  backup: (d) => {
    const j = job(d.id);
    j.status = 'backup'; j.backupNote = (document.getElementById('why')?.value || '').trim();
    log(ME, `Asked for a backup on ${fam(j.fam).name} · ${shortDay(j.date)}`, { job: j.id });
    ui.sheet = null; render(); toast('Staff have been asked to find a backup.');
  },
  'close-job': (d) => { const j = job(d.id); j.prev = j.status; j.status = 'closed'; log('staff', `Closed ${fam(j.fam).name} · ${shortDay(j.date)}`, { job: j.id }); ui.keepSheetScroll = true; render(); toast('Date closed', { label: 'Undo', run: () => A.reopen(d) }); },
  reopen: (d) => { const j = job(d.id); j.status = j.prev && j.prev !== 'closed' ? j.prev : 'open'; log('staff', `Reopened ${fam(j.fam).name} · ${shortDay(j.date)}`, { job: j.id }); ui.keepSheetScroll = true; render(); },
  mg: (d) => { const j = job(d.id); j.mg = 'done'; log('staff', `Meet and greet done for ${fam(j.fam).name}`, { job: j.id }); ui.keepSheetScroll = true; render(); },
  visit: (d) => openSheet({ t: 'visit', id: d.id }),
  check: (d) => { const j = job(d.id); j.checks[d.k] = !j.checks[d.k]; ui.keepSheetScroll = true; render(); },
  'visit-done': (d) => { const j = job(d.id); j.visitDone = true; log(ME, `Finished the visit for ${fam(j.fam).name} and sent a photo`, { job: j.id }); ui.sheet = null; render(); toast('Visit complete. The family and staff can see it.'); },
  invoice: (d) => {
    let i = famInvoice(d.id);
    if (!i) { i = { id: uid('i'), fam: d.id, status: 'draft', at: Date.now() }; invData(i); db.invoices.push(i); log('staff', `Generated an invoice for ${fam(d.id).name} (${money(invTotal(i))})`, { fam: d.id }); }
    ui.edit = false;
    openSheet({ t: 'inv', id: i.id, back: backFrom() });
  },
  'inv-edit': () => { ui.edit = !ui.edit; ui.keepSheetScroll = true; render(); if (!ui.edit) toast('Invoice updated'); },
  'il-add': () => { const i = inv(ui.sheet.id); i.lines.push({ label: 'New item', amt: 0 }); ui.keepSheetScroll = true; render(); const el = document.getElementById(`il-l-${i.lines.length - 1}`); if (el) { el.focus(); el.select(); } },
  'il-del': (d) => { const i = inv(ui.sheet.id); const [gone] = i.lines.splice(Number(d.k), 1); ui.keepSheetScroll = true; render(); toast('Line removed', { label: 'Undo', run: () => { i.lines.splice(Number(d.k), 0, gone); ui.keepSheetScroll = true; render(); } }); },
  'send-sq': (d) => {
    const i = inv(d.id);
    ui.edit = false; ui.sheet = { t: 'sq', id: i.id, phase: 'working' }; render();
    setTimeout(() => {
      i.status = 'square'; i.no = i.no || 1040 + db.invoices.filter((x) => x.no).length + 1;
      log('staff', `Sent ${fam(i.fam).name}'s invoice to Square as a draft (${money(invTotal(i))})`, { fam: i.fam });
      if (ui.sheet && ui.sheet.t === 'sq' && ui.sheet.id === i.id) ui.sheet.phase = 'done';
      render();
    }, 1200);
  },
  cal: (d) => {
    const j = job(d.id);
    const end = j.type === 'pet' && j.end_d ? j.end_d : j.date;
    const st = `${j.date.replace(/-/g, '')}T${j.start.replace(':', '')}00`;
    const en = `${end.replace(/-/g, '')}T${(j.end || j.start).replace(':', '')}00`;
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`Field 2 Forest: ${fam(j.fam).name} (sample)`)}&dates=${st}/${en}&details=${encodeURIComponent(`${j.post}\n\nSample booking from the Field 2 Forest demo.`)}&location=${encodeURIComponent(j.loc)}`;
    window.open(url, '_blank', 'noopener');
  },
  activity: () => { db.seenAct = db.history.length; openSheet({ t: 'activity' }); },
  install: () => openSheet({ t: 'install' }),
  reset: () => { db = seed(); Object.assign(ui, { tab: 'today', seg: 'review', need: null, sheet: null, stab: 'open', edit: false, cal: { mode: 'week', ref: TODAY, day: null } }); coach = null; render(); toast('Fresh sample data loaded'); },
  coach: () => { tour.seen = true; saveTour(); if (isOwner()) coachStart('owner'); else { ui.more = false; render(); showHint(); } },
  'coach-next': () => {
    const steps = COACH[coach.set];
    if (coach.i < steps.length - 1) { coach.i += 1; coachGo(); return; }
    const set = coach.set;
    coachEnd();
    if (set === 'owner') setRole('sitter'); else render();
  },
  'coach-back': () => { if (coach.i > 0) { coach.i -= 1; coachGo(); } },
  'coach-skip': () => { coachEnd(); render(); },
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
  if (k === 'notes') { req(t.dataset.id).notes = t.value; save(); return; }
  const i = ui.sheet && ui.sheet.t === 'inv' ? inv(ui.sheet.id) : null;
  if (!i) return;
  if (k === 'il') {
    const l = i.lines[+t.dataset.k];
    if (t.dataset.f === 'amt') { l.amt = parseFloat(t.value.replace(/[^0-9.]/g, '')) || 0; l.sub = ''; } else l.label = t.value;
    document.querySelectorAll('[data-total]').forEach((el) => { el.textContent = money(invTotal(i)); });
  }
  if (k === 'it') i.title = t.value;
  if (k === 'im') i.msg = t.value;
  save();
});
// Swipe the calendar left or right to move a week or a month.
let touch = null;
root.addEventListener('touchstart', (e) => { touch = e.target.closest('[data-swipe]') ? [e.touches[0].clientX, e.touches[0].clientY] : null; }, { passive: true });
root.addEventListener('touchend', (e) => {
  if (!touch) return;
  const t = e.changedTouches[0]; const dx = t.clientX - touch[0]; const dy = t.clientY - touch[1]; touch = null;
  if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) A['cal-move']({ n: dx < 0 ? '1' : '-1' });
});
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (coach) A['coach-skip']();
  else if (ui.sheet) A.close();
});
window.addEventListener('resize', positionCoach);
window.addEventListener('scroll', positionCoach, { passive: true });

if (!tour.seen) { tour.seen = true; saveTour(); db.role = 'owner'; coach = { set: 'owner', i: 0 }; }
render();

{
  const sp = document.getElementById('f2f-splash');
  if (sp) {
    const wait = Math.max(0, 700 - performance.now());
    setTimeout(() => { sp.classList.add('out'); setTimeout(() => sp.remove(), 450); }, wait);
  }
}

if ('serviceWorker' in navigator && CFG.swUrl && location.protocol === 'https:') {
  navigator.serviceWorker.register(CFG.swUrl, { scope: CFG.basePath }).catch(() => {});
}
