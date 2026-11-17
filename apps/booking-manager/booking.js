/**
 * Booking Manager demo.
 * Screens: Calendar (week, team day view, phone agenda), Requests,
 * Bookings list, Booking page (what customers see) and Settings.
 * Customers are the shared CRM contacts, and every booking action is logged
 * on the shared activity timeline. Nothing is ever sent to anyone.
 */
import { html, raw, icon, on, $, debounce, money, plural, ago, isoDay, isPhone, uid } from '../../assets/js/core/dom.js';
import * as store from '../../assets/js/core/store.js';
import * as router from '../../assets/js/core/router.js';
import { openPanel, toast, simulated, confirmDialog, menu, formData, validate } from '../../assets/js/core/ui.js';
import { badge, avatar, button, card, stat, emptyState, segmented, bindSegmented, formGrid, dataTable, timeline } from '../../assets/js/core/components.js';

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */

const MIN = 60000;
const HOUR_PX = 56;
const STATUS = {
  requested: { label: 'Requested', tone: 'amber' },
  confirmed: { label: 'Confirmed', tone: 'blue' },
  completed: { label: 'Completed', tone: 'green' },
  noshow: { label: 'No-show', tone: 'gray' },
  cancelled: { label: 'Cancelled', tone: 'red' },
};
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const fTime = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' });
const fHour = new Intl.DateTimeFormat('en-US', { hour: 'numeric' });
const fDow = new Intl.DateTimeFormat('en-US', { weekday: 'short' });
const fLong = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
const fShort = new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
const fMonth = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' });

const href = (p) => router.href(p);
const cfg = () => store.get().booking;
const services = () => cfg().services;
const service = (id) => services().find((s) => s.id === id) || services()[0];
const staffIds = () => cfg().staff;
const staffName = (id) => store.user(id)?.name || 'Any available';
const appts = () => store.all('appointments');
const custName = (a) => store.contactName(store.contact(a.contactId));
/** "Maria G." for tight calendar blocks. */
const custShort = (a) => { const p = custName(a).trim().split(/\s+/); return p.length > 1 ? `${p[0]} ${p[p.length - 1][0]}.` : p[0]; };
const first = (a) => store.contact(a.contactId)?.firstName || 'there';
const live = (a) => a.status !== 'cancelled';

function startOfDay(d) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function startOfWeek(d) { const x = startOfDay(d); return addDays(x, -((x.getDay() + 6) % 7)); }
const sameDay = (a, b) => startOfDay(a).getTime() === startOfDay(b).getTime();
const endOf = (a) => new Date(new Date(a.start).getTime() + a.minutes * MIN);
const timeRange = (a) => `${fTime.format(new Date(a.start))} – ${fTime.format(endOf(a))}`;
const when = (a) => `${fShort.format(new Date(a.start))}, ${fTime.format(new Date(a.start))}`;
const isWorkDay = (d) => cfg().hours.days.includes(new Date(d).getDay());
const priceLabel = (s) => (s.price ? money(s.price) : 'Free');
const statusBadge = (s) => badge((STATUS[s] || STATUS.confirmed).label, (STATUS[s] || STATUS.confirmed).tone, { dot: true });

/* Sample visits for any work day someone browses to that has none yet, so the
   demo calendar never runs dry, whichever week or month they look at. */
const FILL_SLOTS = { u1: [[8, 0], [10, 30], [13, 0], [15, 30]], u2: [[9, 0], [11, 30], [14, 0], [16, 0]], u3: [[8, 30], [12, 0], [14, 30], [16, 0]] };
function fillDays(from, count) {
  const st = store.get();
  if (!st.booking || !st.appointments) return;
  const before = st.booking.filledDays || [];
  const filled = new Set(before);
  const people = store.all('contacts').filter((c) => c.status !== 'inactive');
  const rows = [];
  for (let i = 0; i < count && people.length; i += 1) {
    const day = startOfDay(addDays(from, i));
    const key = `${day.getFullYear()}-${day.getMonth() + 1}-${day.getDate()}`;
    if (filled.has(key) || !isWorkDay(day) || dayAppts(day).length) continue;
    filled.add(key);
    let seed = day.getFullYear() * 10000 + (day.getMonth() + 1) * 100 + day.getDate();
    const r = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
    staffIds().forEach((staffId) => {
      const slots = FILL_SLOTS[staffId] || FILL_SLOTS.u1;
      const n = day.getDay() === 6 ? (r() > 0.5 ? 1 : 0) : 1 + (r() > 0.45 ? 1 : 0);
      [0, 1, 2, 3].sort(() => r() - 0.5).slice(0, n).forEach((k) => {
        const start = new Date(day);
        start.setHours(slots[k][0], slots[k][1], 0, 0);
        const svc = services()[Math.floor(r() * services().length)];
        const x = r();
        const status = start.getTime() + svc.minutes * MIN < Date.now() ? (x < 0.08 ? 'noshow' : x < 0.15 ? 'cancelled' : 'completed') : 'confirmed';
        const made = new Date(Math.min(Date.now(), start.getTime()) - (2 + Math.floor(r() * 9)) * 86400000).toISOString();
        rows.push({ id: uid('app'), contactId: people[Math.floor(r() * people.length)].id, serviceId: svc.id, staffId, start: start.toISOString(), minutes: svc.minutes, status, source: r() < 0.5 ? 'Online booking' : 'Phone', notes: '', seriesId: '', createdAt: made, updatedAt: made });
      });
    });
  }
  if (filled.size === before.length) return;
  store.quietly((s) => { s.booking.filledDays = [...filled].slice(-500); s.appointments.push(...rows); });
}

function dayAppts(day, staff = 'all') {
  return appts()
    .filter((a) => sameDay(a.start, day) && (staff === 'all' || a.staffId === staff))
    .sort((a, b) => (a.start < b.start ? -1 : 1));
}

/** Open start times on a day for a service length, honoring hours, buffer and notice. */
function slotsFor(day, minutes, staff = 'any', excludeId = null) {
  const { hours, rules } = cfg();
  if (!isWorkDay(day)) return [];
  const buf = (rules.bufferMin || 0) * MIN;
  const earliest = Date.now() + (rules.noticeHours || 0) * 3600000;
  const people = staff === 'any' ? staffIds() : [staff];
  const base = startOfDay(day).getTime();
  const out = [];
  for (let m = hours.start * 60; m + minutes <= hours.end * 60; m += 30) {
    const s = base + m * MIN;
    const e = s + minutes * MIN;
    if (s < earliest) continue;
    const free = people.find((p) => !appts().some((a) => a.id !== excludeId && live(a) && a.status !== 'noshow' && a.staffId === p
      && new Date(a.start).getTime() < e + buf && endOf(a).getTime() + buf > s));
    if (free) out.push({ start: new Date(s).toISOString(), staffId: free });
  }
  return out;
}

function isFree(start, minutes, staffId, excludeId) {
  return slotsFor(start, minutes, staffId, excludeId).some((s) => s.start === new Date(start).toISOString());
}

function log(a, text, type = 'booking', extra = {}) {
  store.logActivity({ type, contactId: a.contactId, text, ...extra });
}

function fill(msg, a) {
  const d = new Date(a.start);
  return msg.replace(/\{first_name\}/g, first(a)).replace(/\{service\}/g, service(a.serviceId).name.toLowerCase())
    .replace(/\{date\}/g, fShort.format(d)).replace(/\{time\}/g, fTime.format(d));
}

/* ------------------------------------------------------------------ */
/* Actions                                                              */
/* ------------------------------------------------------------------ */

function accept(a) {
  store.patch('appointments', a.id, { status: 'confirmed' });
  log(a, `Booking confirmed: ${service(a.serviceId).name} on ${when(a)}`);
  if (cfg().reminders.confirmation) {
    log(a, `Confirmation sent to ${first(a)} for ${when(a)}`, 'reminder', { simulated: true });
    simulated(`${custName(a)}'s booking is confirmed and a confirmation message was simulated.`);
  } else {
    toast(`${custName(a)} is booked for ${when(a)}.`, { title: 'Booking confirmed' });
  }
}

async function decline(a) {
  const ok = await confirmDialog({ title: 'Decline this request?', message: `${custName(a)} asked for ${service(a.serviceId).name} on ${when(a)}. The time will open up again.`, confirmLabel: 'Decline request', tone: 'danger' });
  if (!ok) return;
  store.patch('appointments', a.id, { status: 'cancelled' });
  log(a, `Booking request declined: ${service(a.serviceId).name} on ${when(a)}`);
  toast('The request was declined and the time is open again.', { title: 'Request declined', tone: 'info' });
}

async function cancel(a, series = false) {
  const later = series ? appts().filter((x) => x.seriesId === a.seriesId && x.start >= a.start && live(x) && x.status !== 'completed') : [a];
  const ok = await confirmDialog({
    title: series ? 'Cancel this and later visits?' : 'Cancel this appointment?',
    message: series ? `${plural(later.length, 'visit')} for ${custName(a)} will be cancelled.` : `${custName(a)}'s ${service(a.serviceId).name.toLowerCase()} on ${when(a)} will be cancelled.`,
    confirmLabel: series ? 'Cancel visits' : 'Cancel appointment',
    tone: 'danger',
  });
  if (!ok) return;
  later.forEach((x) => store.patch('appointments', x.id, { status: 'cancelled' }));
  log(a, series ? `${plural(later.length, 'visit')} in a recurring series cancelled` : `Appointment cancelled: ${service(a.serviceId).name} on ${when(a)}`);
  toast(series ? `${plural(later.length, 'visit')} cancelled.` : 'The appointment was cancelled and the time is open again.', { title: 'Cancelled', tone: 'info' });
}

function setStatus(a, status) {
  store.patch('appointments', a.id, { status });
  log(a, `${service(a.serviceId).name} on ${when(a)} marked ${STATUS[status].label.toLowerCase()}`);
  toast(`Marked as ${STATUS[status].label.toLowerCase()}.`, { title: 'Appointment updated' });
}

function sendReminder(a) {
  log(a, `Reminder sent to ${first(a)} for ${when(a)}`, 'reminder', { simulated: true });
  simulated(`Reminder to ${custName(a)} for ${when(a)}.`);
}

function restore(a) {
  if (!isFree(a.start, a.minutes, a.staffId, a.id)) {
    toast('That time has been booked since. Reschedule it instead.', { title: 'Time no longer open', tone: 'warning' });
    openApptForm(a);
    return;
  }
  store.patch('appointments', a.id, { status: 'confirmed' });
  log(a, `Appointment restored: ${service(a.serviceId).name} on ${when(a)}`);
  toast('The appointment is back on the calendar.', { title: 'Restored' });
}

/* ------------------------------------------------------------------ */
/* New / edit appointment                                               */
/* ------------------------------------------------------------------ */

function openApptForm(existing = null, preset = {}) {
  const a = existing || {
    contactId: preset.contactId || '',
    serviceId: preset.serviceId || services()[0].id,
    staffId: preset.staffId || 'any',
    start: preset.start || null,
  };
  const day0 = a.start ? new Date(a.start) : (() => { let d = addDays(new Date(), 1); while (!isWorkDay(d)) d = addDays(d, 1); return d; })();
  const contacts = store.all('contacts').slice().sort((x, y) => store.contactName(x).localeCompare(store.contactName(y)));
  const reschedule = !!existing;

  const body = html`
    ${reschedule ? html`<div class="bk-formnote">${icon('calendar')}<span><strong>${custName(a)}</strong> · ${service(a.serviceId).name}<br>Currently ${when(a)} with ${staffName(a.staffId)}</span></div>` : formGrid([
      { label: 'Customer', name: 'contactId', type: 'select', value: a.contactId, required: true, placeholder: 'Choose a customer', span: 2,
        options: [{ value: '__new', label: '+ New customer' }, ...contacts.map((c) => ({ value: c.id, label: c.company ? `${store.contactName(c)} (${c.company})` : store.contactName(c) }))] },
    ])}
    <div class="apwa-formgrid bk-newcust" data-newcust hidden>
      ${formGrid([
        { label: 'First name', name: 'firstName', placeholder: 'Made-up name', attrs: { autocomplete: 'off' } },
        { label: 'Last name', name: 'lastName', attrs: { autocomplete: 'off' } },
      ])}
    </div>
    ${formGrid([
      ...(reschedule ? [] : [{ label: 'Service', name: 'serviceId', type: 'select', value: a.serviceId, options: services().map((s) => ({ value: s.id, label: `${s.name} · ${s.minutes} min · ${priceLabel(s)}` })) }]),
      { label: 'Team member', name: 'staffId', type: 'select', value: a.staffId, options: [{ value: 'any', label: 'Any available' }, ...staffIds().map((id) => ({ value: id, label: staffName(id) }))] },
      { label: 'Date', name: 'day', type: 'date', value: isoDay(day0), required: true },
      { label: 'Time', name: 'slot', type: 'select', value: '', required: true, options: [], span: 2, hint: 'Only open times are listed, based on working hours and existing bookings.' },
      ...(reschedule ? [] : [
        { label: 'Repeat', name: 'repeat', type: 'select', value: '0', options: [{ value: '0', label: 'Does not repeat' }, { value: '7', label: 'Weekly, 4 visits' }, { value: '14', label: 'Every 2 weeks, 4 visits' }] },
        { label: 'Notes', name: 'notes', placeholder: 'Optional, e.g. gate code on file', value: '' },
      ]),
    ])}`;

  const api = openPanel({
    title: reschedule ? 'Reschedule appointment' : 'New appointment',
    subtitle: reschedule ? '' : 'Use made-up details. This demo stores data in your browser only.',
    body: `${body}`,
    size: 'lg',
    buttons: [
      { label: 'Cancel', kind: 'secondary' },
      { label: reschedule ? 'Save new time' : 'Book appointment', kind: 'primary', type: 'submit' },
    ],
    onSubmit(form) {
      const f = formData(form);
      const ok = validate(form, {
        ...(reschedule ? {} : { contactId: 'Choose a customer.' }),
        slot: 'Pick an open time.',
        ...(f.contactId === '__new' ? { firstName: 'Enter a first name.' } : {}),
      });
      if (!ok) return false;
      const [start, staffId] = f.slot.split('|');
      if (reschedule) {
        store.patch('appointments', existing.id, { start, staffId });
        log(existing, `Rescheduled to ${when({ ...existing, start })} with ${staffName(staffId)}`);
        if (cfg().reminders.confirmation) simulated(`${custName(existing)} was moved to ${when({ ...existing, start })} and an updated confirmation was simulated.`);
        else toast(`Moved to ${when({ ...existing, start })}.`, { title: 'Rescheduled' });
        return true;
      }
      let contactId = f.contactId;
      if (contactId === '__new') {
        const c = store.insert('contacts', { firstName: f.firstName, lastName: f.lastName || '', email: '', phone: '', company: '', title: '', status: 'lead', source: 'Phone', ownerId: store.get().currentUserId, city: '', state: 'OH', tags: [], lastActivityAt: new Date().toISOString() });
        store.logActivity({ type: 'created', contactId: c.id, text: 'Contact created from a booking' });
        contactId = c.id;
      }
      const svc = service(f.serviceId);
      const step = Number(f.repeat || 0);
      const seriesId = step ? uid('ser') : '';
      let made = 0;
      let skipped = 0;
      for (let k = 0; k < (step ? 4 : 1); k += 1) {
        const s = new Date(start);
        s.setDate(s.getDate() + step * k);
        let who = staffId;
        if (k > 0 && !isFree(s, svc.minutes, who)) {
          const alt = staffIds().find((p) => isFree(s, svc.minutes, p));
          if (!alt) { skipped += 1; continue; }
          who = alt;
        }
        store.insert('appointments', { contactId, serviceId: svc.id, staffId: who, start: s.toISOString(), minutes: svc.minutes, status: 'confirmed', source: 'Manual', notes: f.notes || '', seriesId });
        made += 1;
      }
      const tmp = { contactId, start };
      log(tmp, step ? `${plural(made, 'visit')} booked for ${svc.name}, starting ${when(tmp)}` : `Booked ${svc.name} for ${when(tmp)}`);
      const extra = skipped ? ` ${plural(skipped, 'date')} had no open time and was skipped.` : '';
      if (cfg().reminders.confirmation) simulated(`${step ? `${plural(made, 'visit')} booked` : 'Appointment booked'} for ${custName(tmp)}.${extra} The confirmation message was simulated.`);
      else toast(`${step ? plural(made, 'visit') : 'Appointment'} booked for ${custName(tmp)}.${extra}`, { title: 'Booked' });
      calUI.anchor = startOfDay(start);
      return true;
    },
  });

  const form = api.panel;
  const fillSlots = () => {
    const fd = formData(form);
    const svc = service(reschedule ? a.serviceId : fd.serviceId);
    const sel = form.querySelector('[name=slot]');
    const slots = fd.day ? slotsFor(new Date(`${fd.day}T12:00:00`), svc.minutes, fd.staffId || 'any', existing ? existing.id : null) : [];
    const want = preset.start ? new Date(preset.start).toISOString() : '';
    sel.innerHTML = slots.length
      ? `${html`<option value="">Choose a time</option>${slots.map((s) => html`<option value="${s.start}|${s.staffId}" ${s.start === want ? raw('selected') : ''}>${fTime.format(new Date(s.start))}${fd.staffId === 'any' ? ` with ${staffName(s.staffId)}` : ''}</option>`)}`}`
      : `${html`<option value="">No open times this day. Try another date.</option>`}`;
  };
  fillSlots();
  form.addEventListener('change', (e) => {
    if (e.target.name === 'contactId') form.querySelector('[data-newcust]').hidden = e.target.value !== '__new';
    if (['serviceId', 'staffId', 'day'].includes(e.target.name)) { preset.start = null; fillSlots(); }
  });
}

/* ------------------------------------------------------------------ */
/* Appointment drawer                                                   */
/* ------------------------------------------------------------------ */

function reminderRows(a) {
  const r = cfg().reminders;
  const start = new Date(a.start).getTime();
  const sent = store.all('activities').filter((x) => x.type === 'reminder' && x.contactId === a.contactId && x.text.includes(when(a)));
  const row = (label, on, at, done) => html`<li class="${on ? '' : 'is-off'}">
    <span class="bk-rem__icon ${done ? 'is-done' : ''}">${icon(done ? 'check' : on ? 'clock' : 'x')}</span>
    <span class="bk-rem__label">${label}</span>
    <span class="bk-rem__when">${!on ? 'Off' : done ? 'Sent (simulated)' : a.status === 'requested' ? 'After you accept' : at}</span>
  </li>`;
  const past = (t) => t < Date.now();
  return html`<ul class="bk-rem">
    ${row('Booking confirmation', r.confirmation, 'When booked', a.status !== 'requested' && (sent.some((x) => x.text.startsWith('Confirmation')) || new Date(a.createdAt).getTime() < Date.now() - 3600000))}
    ${row('Email reminder, 1 day before', r.dayBefore, fShort.format(new Date(start - 86400000)), a.status !== 'requested' && past(start - 86400000))}
    ${row('Text reminder, 2 hours before', r.twoHour, fTime.format(new Date(start - 7200000)), a.status !== 'requested' && past(start - 7200000))}
  </ul>`;
}

function openAppt(id) {
  if (!store.find('appointments', id)) return;
  let api = null;
  const render = () => {
    const a = store.find('appointments', id);
    const svc = service(a.serviceId);
    const c = store.contact(a.contactId);
    const series = a.seriesId ? appts().filter((x) => x.seriesId === a.seriesId).sort((x, y) => (x.start < y.start ? -1 : 1)) : [];
    const others = appts().filter((x) => x.contactId === a.contactId && x.id !== a.id && !series.includes(x)).sort((x, y) => (x.start < y.start ? 1 : -1)).slice(0, 4);
    let acts;
    if (a.status === 'requested') {
      acts = html`${button('Accept', { kind: 'primary', icon: 'check', attrs: { 'data-act': 'accept' } })}${button('Suggest another time', { icon: 'calendar', attrs: { 'data-act': 'move' } })}${button('Decline', { icon: 'x', attrs: { 'data-act': 'decline' } })}`;
    } else if (a.status === 'confirmed') {
      acts = html`${button('Reschedule', { kind: 'primary', icon: 'calendar', attrs: { 'data-act': 'move' } })}${button('Send reminder', { icon: 'send', attrs: { 'data-act': 'remind' } })}${button('Mark completed', { icon: 'check-circle', attrs: { 'data-act': 'complete' } })}`;
    } else if (a.status === 'cancelled') {
      acts = html`${button('Restore booking', { kind: 'primary', icon: 'refresh', attrs: { 'data-act': 'restore' } })}`;
    } else {
      acts = html`${button('Book again', { kind: 'primary', icon: 'repeat', attrs: { 'data-act': 'again' } })}`;
    }
    return html`<div class="bk-appt bk-tone--${svc.color}">
      <div class="bk-appt__head">
        <span class="bk-appt__swatch"></span>
        <div><div class="bk-appt__svc">${svc.name}</div><div class="bk-appt__when">${fLong.format(new Date(a.start))}<br>${timeRange(a)}</div></div>
      </div>
      <div class="bk-appt__badges">${statusBadge(a.status)}${a.seriesId ? badge(`Visit ${series.findIndex((x) => x.id === a.id) + 1} of ${series.length}`, 'purple') : ''}${badge(a.source || 'Manual', 'gray')}</div>
      <div class="bk-appt__actions">${acts}</div>
      <dl class="bk-dl">
        <div><dt>Customer</dt><dd>${c ? html`<a href="${href(`crm/contacts/${c.id}`)}" data-close-panel>${store.contactName(c)}</a>` : 'Unknown customer'}</dd></div>
        <div><dt>Phone</dt><dd>${c?.phone || '—'}</dd></div>
        <div><dt>Team member</dt><dd class="bk-dl__user">${avatar(staffName(a.staffId), { size: 'xs' })}${staffName(a.staffId)}</dd></div>
        <div><dt>Price</dt><dd>${priceLabel(svc)} · ${a.minutes} min</dd></div>
        ${a.notes ? html`<div class="bk-dl__wide"><dt>Notes</dt><dd>${a.notes}</dd></div>` : ''}
      </dl>
      <h3 class="bk-subhead">Reminders</h3>
      ${reminderRows(a)}
      ${series.length ? html`<h3 class="bk-subhead">Recurring visits</h3><ul class="bk-mini">${series.map((x) => html`<li class="${x.id === a.id ? 'is-current' : ''}"><button type="button" data-goto="${x.id}"><span>${when(x)}</span>${statusBadge(x.status)}</button></li>`)}</ul>` : ''}
      ${others.length ? html`<h3 class="bk-subhead">Other bookings for ${c ? c.firstName : 'this customer'}</h3><ul class="bk-mini">${others.map((x) => html`<li><button type="button" data-goto="${x.id}"><span>${service(x.serviceId).name} · ${when(x)}</span>${statusBadge(x.status)}</button></li>`)}</ul>` : ''}
    </div>`;
  };

  const a0 = store.find('appointments', id);
  api = openPanel({
    title: custName(a0),
    variant: 'drawer',
    size: 'md',
    body: `${render()}`,
    headActions: html`<button type="button" class="apwa-iconbtn" data-appt-menu aria-label="More actions" aria-haspopup="menu">${icon('more')}</button>`,
  });
  const refresh = () => {
    if (!store.find('appointments', id)) { api.close(); return; }
    api.panel.querySelector('.apwa-panel__title').textContent = custName(store.find('appointments', id));
    api.body.innerHTML = `${render()}`;
  };
  const unsub = store.subscribe(refresh);
  const origClose = api.close;
  api.close = () => { unsub(); origClose(); };

  api.panel.addEventListener('click', (e) => {
    const a = store.find('appointments', id);
    if (!a) return;
    if (e.target.closest('[data-close-panel]')) { api.close(); return; }
    const go = e.target.closest('[data-goto]');
    if (go) { api.close(); setTimeout(() => openAppt(go.dataset.goto), 240); return; }
    if (e.target.closest('[data-appt-menu]')) {
      const items = [];
      if (a.status === 'confirmed' || a.status === 'requested') {
        items.push({ label: 'Mark as no-show', icon: 'x-circle', onClick: () => setStatus(a, 'noshow') });
        items.push({ label: 'Cancel appointment', icon: 'trash', tone: 'danger', onClick: () => cancel(a) });
        if (a.seriesId) items.push({ label: 'Cancel this and later visits', icon: 'trash', tone: 'danger', onClick: () => cancel(a, true) });
      } else {
        items.push({ label: 'Book again', icon: 'repeat', onClick: () => { api.close(); bookAgain(a); } });
      }
      menu(e.target.closest('[data-appt-menu]'), items);
      return;
    }
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const act = b.dataset.act;
    if (act === 'accept') accept(a);
    if (act === 'decline') decline(a);
    if (act === 'remind') sendReminder(a);
    if (act === 'complete') setStatus(a, 'completed');
    if (act === 'restore') restore(a);
    if (act === 'move') { api.close(); setTimeout(() => openApptForm(a), 240); }
    if (act === 'again') { api.close(); setTimeout(() => bookAgain(a), 240); }
  });
}

function bookAgain(a) {
  let d = addDays(new Date(Math.max(Date.now(), new Date(a.start).getTime())), 7);
  while (!isWorkDay(d)) d = addDays(d, 1);
  openApptForm(null, { contactId: a.contactId, serviceId: a.serviceId, staffId: 'any', start: (() => { const x = new Date(d); x.setHours(new Date(a.start).getHours(), new Date(a.start).getMinutes(), 0, 0); return x.toISOString(); })() });
}

/* ------------------------------------------------------------------ */
/* Calendar                                                             */
/* ------------------------------------------------------------------ */

const calUI = { view: '', anchor: startOfDay(new Date()), staff: 'all' };

/** Lay out overlapping events side by side. */
function lanes(list) {
  const out = [];
  let group = [];
  let groupEnd = 0;
  const flush = () => {
    const ends = [];
    group.forEach((a) => {
      let lane = ends.findIndex((t) => t <= new Date(a.start).getTime());
      if (lane < 0) { lane = ends.length; ends.push(0); }
      ends[lane] = endOf(a).getTime();
      out.push({ a, lane });
    });
    const n = ends.length;
    out.slice(-group.length).forEach((x) => { x.of = n; });
    group = [];
  };
  list.forEach((a) => {
    const s = new Date(a.start).getTime();
    if (group.length && s >= groupEnd) flush();
    group.push(a);
    groupEnd = Math.max(groupEnd, endOf(a).getTime());
  });
  if (group.length) flush();
  return out;
}

function gridCols() {
  if (calUI.view === 'day') {
    const people = calUI.staff === 'all' ? staffIds() : [calUI.staff];
    return people.map((p) => ({ day: calUI.anchor, staff: p, head: html`${avatar(staffName(p), { size: 'xs' })}<strong>${staffName(p)}</strong>`, today: false }));
  }
  const w = startOfWeek(calUI.anchor);
  return Array.from({ length: 7 }, (_, i) => {
    const d = addDays(w, i);
    return { day: d, staff: calUI.staff, head: html`<span>${fDow.format(d)}</span><strong>${d.getDate()}</strong>`, today: sameDay(d, new Date()) };
  });
}

function calendarGrid() {
  const { hours } = cfg();
  const h0 = hours.start;
  const h1 = hours.end;
  const cols = gridCols();
  const now = new Date();
  const nowTop = ((now.getHours() - h0) * 60 + now.getMinutes()) / 60 * HOUR_PX;
  return html`<div class="bk-cal ${calUI.view === 'day' ? 'bk-cal--day' : ''}" style="--bk-cols:${cols.length};--bk-h:${HOUR_PX}px">
    <div class="bk-cal__head"><div class="bk-cal__corner"></div>${cols.map((c) => html`<div class="bk-cal__colhead ${c.today ? 'is-today' : ''} ${isWorkDay(c.day) ? '' : 'is-closed'}">${c.head}</div>`)}</div>
    <div class="bk-cal__body" style="height:${(h1 - h0) * HOUR_PX}px">
      <div class="bk-cal__times">${Array.from({ length: h1 - h0 }, (_, i) => html`<div class="bk-cal__time"><span>${i ? fHour.format(new Date(2000, 0, 1, h0 + i)) : ''}</span></div>`)}</div>
      ${cols.map((c) => {
        const list = dayAppts(c.day, c.staff === 'all' ? 'all' : c.staff).filter(live);
        const open = isWorkDay(c.day);
        const slots = [];
        for (let m = h0 * 60; m < h1 * 60; m += 30) {
          const inHours = open && m >= hours.start * 60 && m < hours.end * 60;
          const t = new Date(c.day); t.setHours(0, m, 0, 0);
          slots.push(inHours && t.getTime() > Date.now()
            ? html`<button type="button" class="bk-cal__slot" data-new="${t.toISOString()}" data-staff="${c.staff === 'all' ? '' : c.staff}" aria-label="New appointment ${fShort.format(t)} at ${fTime.format(t)}"></button>`
            : html`<div class="bk-cal__slot ${inHours ? '' : 'is-off'}"></div>`);
        }
        return html`<div class="bk-cal__col ${open ? '' : 'is-closed'}">
          ${slots}
          ${lanes(list).map(({ a, lane, of }) => {
            const s = new Date(a.start);
            const top = ((s.getHours() - h0) * 60 + s.getMinutes()) / 60 * HOUR_PX;
            const svc = service(a.serviceId);
            return html`<button type="button" class="bk-ev bk-tone--${svc.color} is-${a.status} ${of > 1 ? 'is-narrow' : ''}" data-appt="${a.id}" title="${custName(a)} · ${fTime.format(s)} · ${svc.name}" style="top:${top + 1}px;height:${a.minutes / 60 * HOUR_PX - 3}px;left:calc(${(lane / of) * 100}% + 2px);width:calc(${100 / of}% - ${of > 1 ? 3 : 5}px)">
              <strong>${of > 1 ? custShort(a) : custName(a)}</strong><span>${fTime.format(s)} · ${svc.name}</span>${a.status === 'requested' ? html`<em>Request</em>` : ''}
            </button>`;
          })}
          ${sameDay(c.day, now) && nowTop > 0 && nowTop < (h1 - h0) * HOUR_PX ? html`<div class="bk-now" style="top:${nowTop}px"></div>` : ''}
        </div>`;
      })}
    </div>
  </div>`;
}

function agenda() {
  const w = startOfWeek(calUI.anchor);
  const days = Array.from({ length: 7 }, (_, i) => addDays(w, i));
  const list = dayAppts(calUI.anchor, calUI.staff);
  const open = slotsFor(calUI.anchor, 60, calUI.staff === 'all' ? 'any' : calUI.staff).length;
  return html`<div class="bk-strip" role="tablist" aria-label="Days">${days.map((d) => {
      const n = dayAppts(d, calUI.staff).filter(live).length;
      return html`<button type="button" role="tab" class="bk-strip__day ${sameDay(d, calUI.anchor) ? 'is-active' : ''} ${sameDay(d, new Date()) ? 'is-today' : ''}" aria-selected="${sameDay(d, calUI.anchor)}" data-day="${d.toISOString()}">
        <span>${fDow.format(d)}</span><strong>${d.getDate()}</strong><i>${n ? Array.from({ length: Math.min(n, 3) }, () => raw('<b></b>')) : ''}</i></button>`;
    })}</div>
    <div class="bk-agenda__head"><strong>${fLong.format(calUI.anchor)}</strong><span>${isWorkDay(calUI.anchor) ? `${plural(list.filter(live).length, 'appointment')} · ${plural(open, 'open hour slot')}` : 'Closed'}</span></div>
    ${list.length ? html`<ul class="bk-agenda">${list.map((a) => {
      const svc = service(a.serviceId);
      return html`<li><button type="button" class="bk-agenda__item bk-tone--${svc.color} is-${a.status}" data-appt="${a.id}">
        <span class="bk-agenda__time"><strong>${fTime.format(new Date(a.start))}</strong><span>${a.minutes} min</span></span>
        <span class="bk-agenda__main"><strong>${custName(a)}</strong><span>${svc.name} · ${staffName(a.staffId)}</span></span>
        ${a.status !== 'confirmed' ? statusBadge(a.status) : ''}
      </button></li>`;
    })}</ul>` : emptyState({ icon: 'calendar', title: isWorkDay(calUI.anchor) ? 'Nothing booked yet' : 'Closed this day', text: isWorkDay(calUI.anchor) ? 'Tap + to book an appointment.' : 'Change working hours in Settings.' })}`;
}

function calendarView(ctx) {
  if (!calUI.view) calUI.view = 'week';
  fillDays(startOfDay(new Date()), 14);
  fillDays(startOfWeek(calUI.anchor), 7);
  if (ctx.query.appt) setTimeout(() => { router.go('booking-manager/calendar', { replace: true }); openAppt(ctx.query.appt); }, 0);
  const phone = isPhone();
  const today = new Date();
  const wk = startOfWeek(today);
  const weekList = appts().filter((a) => live(a) && new Date(a.start) >= wk && new Date(a.start) < addDays(wk, 7));
  const reqs = appts().filter((a) => a.status === 'requested').length;
  const todays = dayAppts(today).filter((a) => live(a) && a.status !== 'requested');
  const openToday = slotsFor(today, 60, 'any').length;
  const label = calUI.view === 'day' && !phone ? fLong.format(calUI.anchor) : fMonth.format(addDays(startOfWeek(calUI.anchor), 3));
  const staffSel = html`<div class="apwa-select apwa-select--sm"><select aria-label="Filter by team member" data-bk-staff>
    <option value="all">Whole team</option>${staffIds().map((id) => html`<option value="${id}" ${id === calUI.staff ? raw('selected') : ''}>${staffName(id)}</option>`)}
  </select>${icon('chevron-down')}</div>`;

  return {
    title: 'Calendar',
    subtitle: 'Click an open time to book it, or open any appointment to manage it.',
    pageClass: 'apwa-page--wide',
    actions: [{ label: 'New appointment', icon: 'plus', kind: 'primary', primary: true, onClick: () => openApptForm() }],
    body: html`
      <div class="apwa-stats apwa-stats--4 bk-stats">
        ${stat({ label: 'Today', value: todays.length, sub: todays.length ? `Next: ${todays.find((a) => endOf(a) > today) ? fTime.format(new Date(todays.find((a) => endOf(a) > today).start)) : 'done for the day'}` : 'No visits booked', icon: 'calendar', tone: 'blue' })}
        ${stat({ label: 'This week', value: weekList.length, sub: `${money(weekList.reduce((t, a) => t + service(a.serviceId).price, 0))} booked`, icon: 'calendar-check', tone: 'purple' })}
        ${stat({ label: 'Requests waiting', value: reqs, sub: reqs ? 'Need a yes or no' : 'All caught up', icon: 'inbox', tone: 'amber' })}
        ${stat({ label: 'Open today', value: openToday, sub: 'One-hour times left', icon: 'clock', tone: 'green' })}
      </div>
      ${reqs ? html`<div class="apwa-callout"><span class="apwa-callout__icon">${icon('inbox')}</span><div class="apwa-callout__body"><strong>${plural(reqs, 'booking request')} waiting</strong><span>Customers picked these times on your booking page.</span></div><div class="apwa-callout__actions">${button('Review requests', { kind: 'secondary', size: 'sm', href: href('booking-manager/requests') })}</div></div>` : ''}
      <div class="bk-toolbar">
        <div class="bk-nav">
          <button type="button" class="apwa-iconbtn" data-cal-move="-1" aria-label="Previous">${icon('chevron-left')}</button>
          <button type="button" class="apwa-btn apwa-btn--secondary apwa-btn--sm" data-cal-today>Today</button>
          <button type="button" class="apwa-iconbtn" data-cal-move="1" aria-label="Next">${icon('chevron-right')}</button>
          <h2 class="bk-nav__label">${label}</h2>
        </div>
        <div class="bk-toolbar__spacer"></div>
        ${staffSel}
        ${phone ? '' : segmented('calview', [{ value: 'week', label: 'Week' }, { value: 'day', label: 'Team day' }], calUI.view, { label: 'Calendar view' })}
      </div>
      ${phone ? '' : html`<div class="bk-legend">${services().map((s) => html`<span class="bk-tone--${s.color}"><i></i>${s.name}</span>`)}<span class="bk-legend__req"><i></i>Request</span></div>`}
      <div class="bk-calwrap">${phone ? agenda() : calendarGrid()}</div>`,
    mount(root) {
      const step = () => (phone || calUI.view === 'week' ? 7 : 1);
      on(root, 'click', '[data-cal-move]', (e, b) => { calUI.anchor = addDays(calUI.anchor, Number(b.dataset.calMove) * step()); ctx.rerender(); });
      on(root, 'click', '[data-cal-today]', () => { calUI.anchor = startOfDay(new Date()); ctx.rerender(); });
      on(root, 'click', '[data-day]', (e, b) => { calUI.anchor = startOfDay(b.dataset.day); ctx.rerender(); });
      on(root, 'click', '[data-appt]', (e, b) => openAppt(b.dataset.appt));
      on(root, 'click', '[data-new]', (e, b) => openApptForm(null, { start: b.dataset.new, staffId: b.dataset.staff || 'any' }));
      $('[data-bk-staff]', root).addEventListener('change', (e) => { calUI.staff = e.target.value; ctx.rerender(); });
      bindSegmented(root, { calview: (v) => { calUI.view = v; ctx.rerender(); } });
    },
  };
}

/* ------------------------------------------------------------------ */
/* Requests                                                             */
/* ------------------------------------------------------------------ */

function simulateRequest() {
  const people = store.all('contacts').filter((c) => c.status !== 'inactive');
  const c = people[Math.floor(Math.random() * people.length)];
  const svc = services()[Math.floor(Math.random() * services().length)];
  let d = addDays(new Date(), 1);
  let slot = null;
  for (let i = 0; i < 10 && !slot; i += 1) {
    const s = slotsFor(d, svc.minutes, 'any');
    if (s.length) slot = s[Math.floor(Math.random() * s.length)];
    d = addDays(d, 1);
  }
  if (!slot) { toast('No open times in the next 10 days for a sample request.', { tone: 'warning' }); return; }
  const a = store.insert('appointments', { contactId: c.id, serviceId: svc.id, staffId: slot.staffId, start: slot.start, minutes: svc.minutes, status: 'requested', source: 'Online booking', notes: 'Booked from the website.', seriesId: '' });
  log(a, `Booking request received: ${svc.name} on ${when(a)}`);
  toast(`${store.contactName(c)} asked for ${svc.name.toLowerCase()} on ${when(a)}. This sample request was generated by the demo.`, { title: 'New booking request', tone: 'info' });
}

function requestsView() {
  const list = appts().filter((a) => a.status === 'requested').sort((a, b) => (a.start < b.start ? -1 : 1));
  return {
    title: 'Requests',
    subtitle: 'Times customers picked on your booking page. Accept, suggest another time or decline.',
    actions: [{ label: 'Simulate a new request', icon: 'zap', kind: 'secondary', onClick: simulateRequest }],
    body: list.length ? html`<ul class="bk-reqs">${list.map((a) => {
      const svc = service(a.serviceId);
      const c = store.contact(a.contactId);
      return html`<li class="bk-req bk-tone--${svc.color}">
        <div class="bk-req__date"><span>${fDow.format(new Date(a.start))}</span><strong>${new Date(a.start).getDate()}</strong><span>${new Intl.DateTimeFormat('en-US', { month: 'short' }).format(new Date(a.start))}</span></div>
        <div class="bk-req__main">
          <div class="bk-req__who">${avatar(custName(a), { size: 'sm' })}<div><strong>${custName(a)}</strong><span>${c?.phone || ''}${c?.city ? ` · ${c.city}` : ''}</span></div></div>
          <div class="bk-req__what"><span class="bk-req__svc"><i></i>${svc.name}</span><span>${timeRange(a)}</span><span>${staffName(a.staffId)}</span><span>${priceLabel(svc)}</span></div>
          ${a.notes ? html`<p class="bk-req__note">“${a.notes}”</p>` : ''}
          <div class="bk-req__meta">Requested ${ago(a.createdAt)} · ${a.source}</div>
        </div>
        <div class="bk-req__actions">
          ${button('Accept', { kind: 'primary', icon: 'check', attrs: { 'data-req': `accept|${a.id}` } })}
          ${button('Suggest time', { icon: 'calendar', attrs: { 'data-req': `move|${a.id}` } })}
          ${button('Decline', { kind: 'ghost', attrs: { 'data-req': `decline|${a.id}` } })}
        </div>
      </li>`;
    })}</ul>` : emptyState({ icon: 'inbox', title: 'No requests waiting', text: 'New requests from your booking page land here. Try one with “Simulate a new request”.', action: button('Simulate a new request', { kind: 'primary', icon: 'zap', attrs: { 'data-sim': '1' } }) }),
    mount(root) {
      on(root, 'click', '[data-sim]', simulateRequest);
      on(root, 'click', '[data-req]', (e, b) => {
        const [act, id] = b.dataset.req.split('|');
        const a = store.find('appointments', id);
        if (!a) return;
        if (act === 'accept') accept(a);
        if (act === 'decline') decline(a);
        if (act === 'move') openApptForm(a);
      });
    },
  };
}

/* ------------------------------------------------------------------ */
/* Bookings list                                                        */
/* ------------------------------------------------------------------ */

const listUI = { tab: 'upcoming', q: '' };

function bookingsView(ctx) {
  fillDays(startOfDay(new Date()), 14);
  if (ctx.query.appt) setTimeout(() => { router.go('booking-manager/bookings', { replace: true }); openAppt(ctx.query.appt); }, 0);
  const now = Date.now();
  const groups = {
    upcoming: (a) => ['confirmed', 'requested'].includes(a.status) && endOf(a).getTime() >= now,
    past: (a) => ['completed', 'noshow'].includes(a.status) || (a.status === 'confirmed' && endOf(a).getTime() < now),
    cancelled: (a) => a.status === 'cancelled',
  };
  const all = appts();
  const q = listUI.q.toLowerCase();
  let rows = all.filter(groups[listUI.tab]).filter((a) => !q || `${custName(a)} ${service(a.serviceId).name} ${staffName(a.staffId)}`.toLowerCase().includes(q));
  rows = rows.sort((a, b) => (listUI.tab === 'upcoming' ? (a.start < b.start ? -1 : 1) : (a.start < b.start ? 1 : -1)));
  const cols = [
    { key: 'start', label: 'When', render: (a) => html`<strong>${fShort.format(new Date(a.start))}</strong><div class="apwa-cell-sub">${timeRange(a)}</div>` },
    { key: 'customer', label: 'Customer', render: (a) => html`<span class="apwa-cell-owner">${avatar(custName(a), { size: 'xs' })}<span>${custName(a)}</span></span>` },
    { key: 'service', label: 'Service', render: (a) => html`<span class="bk-svc bk-tone--${service(a.serviceId).color}"><i></i>${service(a.serviceId).name}</span>`, hideOn: 'tablet' },
    { key: 'staff', label: 'Team member', render: (a) => staffName(a.staffId), hideOn: 'tablet' },
    { key: 'status', label: 'Status', render: (a) => html`${statusBadge(a.status)}${a.seriesId ? html` ${badge('Recurring', 'purple')}` : ''}` },
    { key: 'price', label: 'Price', align: 'right', render: (a) => priceLabel(service(a.serviceId)) },
  ];
  return {
    title: 'Bookings',
    subtitle: 'Every appointment, with its status and customer.',
    actions: [{ label: 'New appointment', icon: 'plus', kind: 'primary', primary: true, onClick: () => openApptForm() }],
    body: html`
      <div class="bk-toolbar">
        <div class="apwa-input-search">${icon('search')}<input type="search" value="${listUI.q}" placeholder="Search customer, service or team member…" aria-label="Search bookings" data-bk-q></div>
        ${segmented('btab', [
          { value: 'upcoming', label: 'Upcoming', count: all.filter(groups.upcoming).length },
          { value: 'past', label: 'Past', count: all.filter(groups.past).length },
          { value: 'cancelled', label: 'Cancelled', count: all.filter(groups.cancelled).length },
        ], listUI.tab, { label: 'Booking status' })}
      </div>
      <div data-bk-list>${card({ flush: true, body: dataTable(cols, rows, {
        rowLink: (a) => href(`booking-manager/bookings?appt=${a.id}`),
        mobile: (a) => html`<span class="bk-mrow bk-tone--${service(a.serviceId).color}"><i></i><span><strong>${custName(a)}</strong><span>${service(a.serviceId).name} · ${when(a)}</span></span>${a.status !== 'confirmed' ? statusBadge(a.status) : ''}</span>`,
        empty: emptyState({ icon: 'calendar', title: 'No bookings here', text: listUI.q ? 'Try a different search.' : 'Bookings will show up here.' }),
      }) })}</div>`,
    mount(root) {
      const openRow = (tr) => openAppt(new URL(tr.dataset.href, location.href).searchParams.get('appt'));
      root.addEventListener('click', (e) => { const tr = e.target.closest('tr[data-href]'); if (tr && !e.target.closest('a, button, input')) openRow(tr); });
      root.addEventListener('keydown', (e) => { const tr = e.target.closest('tr[data-href]'); if (tr && e.key === 'Enter') openRow(tr); });
      const input = $('[data-bk-q]', root);
      input.addEventListener('input', debounce((e) => { listUI.q = e.target.value.trim(); ctx.rerender(); setTimeout(() => { const i = $('[data-bk-q]'); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }, 0); }, 250));
      bindSegmented(root, { btab: (v) => { listUI.tab = v; ctx.rerender(); } });
    },
  };
}

/* ------------------------------------------------------------------ */
/* Customer booking page (preview)                                      */
/* ------------------------------------------------------------------ */

const pageUI = { serviceId: '', day: '', slot: '', done: null };

function bookingPageView(ctx) {
  const svc = pageUI.serviceId ? service(pageUI.serviceId) : null;
  const days = [];
  for (let d = addDays(new Date(), 0); days.length < 8; d = addDays(d, 1)) if (isWorkDay(d)) days.push(startOfDay(d));
  if (svc && !pageUI.day) pageUI.day = days.find((d) => slotsFor(d, svc.minutes).length)?.toISOString() || days[0].toISOString();
  const slots = svc && pageUI.day ? slotsFor(new Date(pageUI.day), svc.minutes) : [];
  const biz = store.get().business.name;
  const auto = cfg().rules.autoConfirm;

  const widget = pageUI.done ? html`<div class="bk-bp__done">
      <span class="bk-bp__check">${icon('check')}</span>
      <h3>${auto ? 'You’re booked!' : 'Request sent!'}</h3>
      <p>${service(pageUI.done.serviceId).name}<br><strong>${fLong.format(new Date(pageUI.done.start))} at ${fTime.format(new Date(pageUI.done.start))}</strong></p>
      <p class="bk-bp__fine">${auto ? 'A confirmation would be emailed in a live setup. This demo sends nothing.' : `${biz} will confirm shortly. In this demo nothing is sent.`}</p>
      ${button('Book another', { kind: 'secondary', attrs: { 'data-bp-reset': '1' } })}
    </div>`
    : html`<div class="bk-bp__step"><span>1</span>Choose a service</div>
      <div class="bk-bp__svcs">${services().map((s) => html`<button type="button" class="bk-bp__svc bk-tone--${s.color} ${s.id === pageUI.serviceId ? 'is-active' : ''}" data-bp-svc="${s.id}"><i></i><strong>${s.name}</strong><span>${s.minutes} min · ${priceLabel(s)}</span></button>`)}</div>
      ${svc ? html`<div class="bk-bp__step"><span>2</span>Pick a day</div>
      <div class="bk-bp__days">${days.map((d) => {
        const n = slotsFor(d, svc.minutes).length;
        return html`<button type="button" class="bk-bp__day ${d.toISOString() === pageUI.day ? 'is-active' : ''}" data-bp-day="${d.toISOString()}" ${n ? '' : raw('disabled')}><span>${fDow.format(d)}</span><strong>${d.getDate()}</strong><em>${n ? `${n} open` : 'Full'}</em></button>`;
      })}</div>
      <div class="bk-bp__step"><span>3</span>Pick a time</div>
      ${slots.length ? html`<div class="bk-bp__times">${slots.map((s) => html`<button type="button" class="bk-bp__time ${pageUI.slot === `${s.start}|${s.staffId}` ? 'is-active' : ''}" data-bp-slot="${s.start}|${s.staffId}">${fTime.format(new Date(s.start))}</button>`)}</div>` : html`<p class="bk-bp__fine">No open times this day.</p>`}
      ${pageUI.slot ? html`<form class="bk-bp__form" data-bp-form novalidate>
        <div class="bk-bp__step"><span>4</span>Your details</div>
        ${formGrid([
          { label: 'First name', name: 'firstName', required: true, placeholder: 'Made-up name', attrs: { autocomplete: 'off' } },
          { label: 'Last name', name: 'lastName', attrs: { autocomplete: 'off' } },
          { label: 'Notes for the visit', name: 'notes', span: 2, placeholder: 'Optional' },
        ])}
        <button type="submit" class="apwa-btn apwa-btn--primary bk-bp__submit">${auto ? 'Book appointment' : 'Request this time'}</button>
      </form>` : ''}` : ''}`;

  return {
    title: 'Booking page',
    subtitle: 'What your customers see when they book online. Try booking a time.',
    pageClass: 'apwa-page--wide',
    body: html`<div class="bk-bp">
      <div class="bk-bp__frame">
        <div class="bk-bp__bar"><i></i><i></i><i></i><span>${icon('lock')}summithomeservices.example/book</span></div>
        <div class="bk-bp__inner">
          <div class="bk-bp__brand"><span class="bk-bp__logo">S</span><div><strong>${biz}</strong><span>Book a visit online</span></div></div>
          ${widget}
        </div>
      </div>
      <aside class="bk-bp__side">
        ${card({ title: 'How it works', body: html`<ol class="bk-steps">
          <li><strong>Customers pick an open time.</strong><span>Only times that fit your hours, team and existing bookings are shown.</span></li>
          <li><strong>${auto ? 'It goes straight on the calendar.' : 'You get a request.'}</strong><span>${auto ? 'Auto-confirm is on in Settings.' : 'Accept, suggest another time or decline from Requests.'}</span></li>
          <li><strong>Reminders go out on their own.</strong><span>Confirmation, day-before and same-day reminders cut no-shows.</span></li>
        </ol>` })}
        ${card({ title: 'In a live setup', body: html`<ul class="bk-bullets"><li>Embedded on your website or shared as a link</li><li>Two-way sync with Google or Outlook calendars</li><li>Deposits or card on file for bookings</li><li>Real email and text reminders</li></ul>` })}
      </aside>
    </div>`,
    mount(root) {
      on(root, 'click', '[data-bp-svc]', (e, b) => { pageUI.serviceId = b.dataset.bpSvc; pageUI.day = ''; pageUI.slot = ''; ctx.rerender(); });
      on(root, 'click', '[data-bp-day]', (e, b) => { pageUI.day = b.dataset.bpDay; pageUI.slot = ''; ctx.rerender(); });
      on(root, 'click', '[data-bp-slot]', (e, b) => { pageUI.slot = b.dataset.bpSlot; ctx.rerender(); setTimeout(() => $('[data-bp-form] input')?.focus(), 0); });
      on(root, 'click', '[data-bp-reset]', () => { pageUI.serviceId = ''; pageUI.day = ''; pageUI.slot = ''; pageUI.done = null; ctx.rerender(); });
      const form = $('[data-bp-form]', root);
      if (form) form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!validate(form, { firstName: 'Enter a first name.' })) return;
        const f = formData(form);
        const [start, staffId] = pageUI.slot.split('|');
        const s = service(pageUI.serviceId);
        if (!isFree(start, s.minutes, staffId)) { toast('That time was just taken. Pick another.', { tone: 'warning' }); pageUI.slot = ''; ctx.rerender(); return; }
        const c = store.insert('contacts', { firstName: f.firstName, lastName: f.lastName || '', email: '', phone: '', company: '', title: '', status: 'lead', source: 'Website', ownerId: store.get().currentUserId, city: '', state: 'OH', tags: [], lastActivityAt: new Date().toISOString() });
        store.logActivity({ type: 'created', contactId: c.id, text: 'Contact created from the online booking page' });
        const status = cfg().rules.autoConfirm ? 'confirmed' : 'requested';
        const a = store.insert('appointments', { contactId: c.id, serviceId: s.id, staffId, start, minutes: s.minutes, status, source: 'Online booking', notes: f.notes || '', seriesId: '' });
        log(a, status === 'requested' ? `Booking request received: ${s.name} on ${when(a)}` : `Booked online: ${s.name} on ${when(a)}`);
        pageUI.done = { serviceId: s.id, start };
        pageUI.slot = '';
        toast(status === 'requested' ? 'The request is waiting in Requests.' : 'The booking is on the calendar.', { title: status === 'requested' ? 'Request received' : 'Booked online', tone: 'info' });
      });
    },
  };
}

/* ------------------------------------------------------------------ */
/* Settings                                                             */
/* ------------------------------------------------------------------ */

function sw(name, checked, label, sub = '') {
  return html`<label class="bk-switch"><span class="bk-switch__text"><strong>${label}</strong>${sub ? html`<span>${sub}</span>` : ''}</span>
    <input type="checkbox" role="switch" data-set="${name}" ${checked ? raw('checked') : ''}><span class="bk-switch__ui" aria-hidden="true"></span></label>`;
}

function editService(id) {
  const s = service(id);
  openPanel({
    title: 'Edit service',
    body: `${formGrid([
      { label: 'Name', name: 'name', value: s.name, required: true, span: 2 },
      { label: 'Length', name: 'minutes', type: 'select', value: s.minutes, options: [30, 60, 90, 120, 180, 240].map((m) => ({ value: m, label: `${m} min` })) },
      { label: 'Price', name: 'price', type: 'money', value: s.price },
    ])}`,
    buttons: [{ label: 'Cancel', kind: 'secondary' }, { label: 'Save service', kind: 'primary', type: 'submit' }],
    onSubmit(form) {
      if (!validate(form, { name: 'Give the service a name.' })) return false;
      const f = formData(form);
      store.update((st) => { Object.assign(st.booking.services.find((x) => x.id === id), { name: f.name, minutes: Number(f.minutes), price: Math.max(0, Math.round(Number(f.price) || 0)) }); });
      toast(`${f.name} was updated. New bookings use the new length.`, { title: 'Service saved' });
      return true;
    },
  });
}

function settingsView() {
  const { hours, rules, reminders } = cfg();
  const sample = appts().find((a) => a.status === 'confirmed' && new Date(a.start) > new Date()) || appts()[0];
  const hourOpts = (v, from, to) => Array.from({ length: to - from + 1 }, (_, i) => from + i).map((h) => html`<option value="${h}" ${h === v ? raw('selected') : ''}>${fHour.format(new Date(2000, 0, 1, h))}</option>`);
  return {
    title: 'Booking settings',
    subtitle: 'Services, hours, booking rules and reminders. Changes apply right away.',
    body: html`<div class="apwa-grid apwa-grid--2 bk-settings">
      ${card({ title: 'Services', flush: true, body: html`<ul class="bk-svclist">${services().map((s) => html`<li class="bk-tone--${s.color}"><i></i><span><strong>${s.name}</strong><span>${s.minutes} min · ${priceLabel(s)}</span></span><button type="button" class="apwa-btn apwa-btn--ghost apwa-btn--sm" data-edit-svc="${s.id}">${icon('edit')}<span>Edit</span></button></li>`)}</ul>` })}
      ${card({ title: 'Working hours', body: html`
        <div class="bk-days" role="group" aria-label="Open days">${[1, 2, 3, 4, 5, 6, 0].map((d) => html`<button type="button" class="bk-days__d ${hours.days.includes(d) ? 'is-on' : ''}" aria-pressed="${hours.days.includes(d)}" data-dayt="${d}">${DAYS[d]}</button>`)}</div>
        <div class="bk-hours">
          <label>Opens<div class="apwa-select apwa-select--sm"><select data-hours="start">${hourOpts(hours.start, 6, 12)}</select>${icon('chevron-down')}</div></label>
          <label>Closes<div class="apwa-select apwa-select--sm"><select data-hours="end">${hourOpts(hours.end, 14, 21)}</select>${icon('chevron-down')}</div></label>
        </div>
        <h4 class="bk-subhead">Booking rules</h4>
        <div class="bk-hours">
          <label>Gap between visits<div class="apwa-select apwa-select--sm"><select data-rule="bufferMin">${[0, 15, 30, 60].map((m) => html`<option value="${m}" ${m === rules.bufferMin ? raw('selected') : ''}>${m ? `${m} min` : 'None'}</option>`)}</select>${icon('chevron-down')}</div></label>
          <label>Minimum notice<div class="apwa-select apwa-select--sm"><select data-rule="noticeHours">${[0, 2, 12, 24, 48].map((m) => html`<option value="${m}" ${m === rules.noticeHours ? raw('selected') : ''}>${m ? plural(m, 'hour') : 'None'}</option>`)}</select>${icon('chevron-down')}</div></label>
        </div>
        ${sw('rules.autoConfirm', rules.autoConfirm, 'Auto-confirm online bookings', 'Skip the request step for times picked on your booking page.')}` })}
      ${card({ title: 'Reminders', className: 'bk-settings__wide', body: html`<div class="bk-remset">
        <div>
          ${sw('reminders.confirmation', reminders.confirmation, 'Booking confirmation', 'Sent when a booking is made or accepted.')}
          ${sw('reminders.dayBefore', reminders.dayBefore, 'Email reminder, 1 day before')}
          ${sw('reminders.twoHour', reminders.twoHour, 'Text reminder, 2 hours before')}
          <div class="apwa-field"><label for="bk-msg">Reminder message</label><textarea id="bk-msg" rows="4" data-msg>${reminders.message}</textarea><div class="apwa-field__hint">Use {first_name}, {service}, {date} and {time}.</div></div>
        </div>
        <div class="bk-preview">
          <div class="bk-preview__label">Preview for ${sample ? custName(sample) : 'a customer'}</div>
          <div class="bk-preview__phone"><div class="bk-preview__bubble" data-preview>${sample ? fill(reminders.message, sample) : reminders.message}</div><span>Text message · simulated</span></div>
          ${button('Send a test reminder', { icon: 'send', attrs: { 'data-test-rem': '1' } })}
        </div>
      </div>` })}
    </div>`,
    mount(root) {
      on(root, 'click', '[data-edit-svc]', (e, b) => editService(b.dataset.editSvc));
      on(root, 'click', '[data-dayt]', (e, b) => {
        const d = Number(b.dataset.dayt);
        store.update((st) => { const ds = st.booking.hours.days; st.booking.hours.days = ds.includes(d) ? ds.filter((x) => x !== d) : [...ds, d]; });
      });
      on(root, 'change', '[data-hours]', (e, s) => {
        const k = s.dataset.hours;
        const v = Number(s.value);
        const h = cfg().hours;
        if ((k === 'start' && v >= h.end) || (k === 'end' && v <= h.start)) { toast('Closing time has to be after opening time.', { tone: 'warning' }); s.value = h[k]; return; }
        store.update((st) => { st.booking.hours[k] = v; });
        toast('Working hours updated.', { title: 'Saved' });
      });
      on(root, 'change', '[data-rule]', (e, s) => { store.update((st) => { st.booking.rules[s.dataset.rule] = Number(s.value); }); toast('Booking rule updated.', { title: 'Saved' }); });
      on(root, 'change', '[data-set]', (e, s) => {
        const [grp, key] = s.dataset.set.split('.');
        store.update((st) => { st.booking[grp][key] = s.checked; });
      });
      const msg = $('[data-msg]', root);
      const prev = $('[data-preview]', root);
      msg.addEventListener('input', () => { prev.textContent = sample ? fill(msg.value, sample) : msg.value; });
      msg.addEventListener('change', () => { store.update((st) => { st.booking.reminders.message = msg.value.slice(0, 320); }); toast('Reminder message saved.', { title: 'Saved' }); });
      on(root, 'click', '[data-test-rem]', () => simulated('A test reminder to your own phone.'));
    },
  };
}

/* ------------------------------------------------------------------ */
/* Search and module contract                                           */
/* ------------------------------------------------------------------ */

function search(q) {
  const s = q.toLowerCase();
  return appts()
    .filter((a) => `${custName(a)} ${service(a.serviceId).name}`.toLowerCase().includes(s))
    .sort((a, b) => Math.abs(new Date(a.start) - Date.now()) - Math.abs(new Date(b.start) - Date.now()))
    .slice(0, 5)
    .map((a) => ({ label: `${custName(a)} · ${service(a.serviceId).name}`, sub: `${when(a)} · ${STATUS[a.status].label}`, href: href(`booking-manager/bookings?appt=${a.id}`), icon: 'calendar', type: 'Booking' }));
}

export default {
  slug: 'booking-manager',
  nav: [
    { id: 'bk-calendar', path: 'booking-manager/calendar', label: 'Calendar', icon: 'calendar' },
    { id: 'bk-requests', path: 'booking-manager/requests', label: 'Requests', icon: 'inbox' },
    { id: 'bk-bookings', path: 'booking-manager/bookings', label: 'Bookings', icon: 'list' },
    { id: 'bk-page', path: 'booking-manager/page', label: 'Booking page', icon: 'calendar-check' },
    { id: 'bk-settings', path: 'booking-manager/settings', label: 'Settings', icon: 'sliders' },
  ],
  routes: [
    { pattern: 'booking-manager', redirect: 'booking-manager/calendar' },
    { pattern: 'booking-manager/calendar', view: calendarView, nav: 'bk-calendar' },
    { pattern: 'booking-manager/requests', view: requestsView, nav: 'bk-requests' },
    { pattern: 'booking-manager/bookings', view: bookingsView, nav: 'bk-bookings' },
    { pattern: 'booking-manager/page', view: bookingPageView, nav: 'bk-page' },
    { pattern: 'booking-manager/settings', view: settingsView, nav: 'bk-settings' },
  ],
  quickActions: [
    { label: 'New appointment', icon: 'calendar-check', run: () => openApptForm() },
  ],
  search,
};
