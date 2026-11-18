/**
 * Smart Follow-Ups demo.
 * Open estimates with an automatic follow-up sequence (texts, emails and a
 * call reminder), a page per estimate with its message history, a sequence
 * editor, and recovered-revenue results. Every message is simulated.
 */
import { html, raw, icon, $, plural, money, moneyShort, pct, date, ago } from '../../assets/js/core/dom.js';
import * as store from '../../assets/js/core/store.js';
import * as guide from '../../assets/js/core/guide.js';
import * as router from '../../assets/js/core/router.js';
import { openPanel, toast, simulated, formData, validate, confirmDialog } from '../../assets/js/core/ui.js';
import { badge, card, stat, emptyState, segmented, bindSegmented, formGrid, dataTable, barList, columnChart } from '../../assets/js/core/components.js';

const DAY = 86400000;
const href = (p) => router.href(p);
const CH = { sms: ['Text', 'smartphone'], email: ['Email', 'mail'], call: ['Call reminder', 'phone'] };
const LOST = ['Went with another contractor', 'Price too high', 'Project postponed', 'No response'];

/* ------------------------------------------------------------------ */
/* Seed                                                                 */
/* ------------------------------------------------------------------ */

function seed() {
  const now = Date.now();
  const cs = store.all('contacts');
  const cid = (i) => (cs[i % Math.max(1, cs.length)] || {}).id;
  const steps = [
    { id: 'st1', day: 2, channel: 'sms', text: 'Hi {first_name}, it’s {my_name} from {business}. Just checking you got the estimate for {estimate}. Happy to answer any questions!' },
    { id: 'st2', day: 5, channel: 'email', subject: 'Your {estimate} estimate', text: 'Hi {first_name},\n\nI wanted to follow up on the {amount} estimate for {estimate}. If the timing or scope needs to change, I can adjust it. Reply here or tap the link to approve.\n\nThanks,\n{my_name}' },
    { id: 'st3', day: 9, channel: 'call', text: 'Call {first_name} about {estimate}. Ask if anything is holding them back.' },
    { id: 'st4', day: 16, channel: 'email', subject: 'Should I keep your spot?', text: 'Hi {first_name},\n\nI’m planning next month’s schedule and wanted to see if you’d like to go ahead with {estimate}. If not, no worries, just let me know and I’ll close it out.\n\n{my_name}' },
  ];
  const E = [
    // title, contact, amount, sentDaysAgo, stepsDone, status, extra
    ['Furnace replacement', 2, 7850, 1, 0, 'open'],
    ['Water heater swap', 5, 2400, 3, 1, 'open', { viewed: 2 }],
    ['Bathroom remodel', 8, 18600, 6, 2, 'open', { viewed: 5 }],
    ['AC tune-up and duct sealing', 11, 980, 10, 2, 'open'],
    ['Roof leak repair', 14, 1650, 12, 3, 'open', { viewed: 9 }],
    ['Kitchen backsplash', 17, 3200, 2, 0, 'open', { viewed: 1 }],
    ['Panel upgrade 200A', 20, 4300, 5, 1, 'open'],
    ['Sump pump install', 23, 1150, 17, 3, 'paused', { replied: 'Asked to wait until after the holidays' }],
    ['Whole-home repipe', 3, 14200, 24, 3, 'won', { wonDay: 14 }],
    ['Gutter replacement', 6, 3600, 30, 2, 'won', { wonDay: 7 }],
    ['Ductless mini-split', 9, 6900, 40, 1, 'won', { wonDay: 4 }],
    ['Deck staining', 12, 1800, 45, 0, 'won', { wonDay: 1 }],
    ['Basement waterproofing', 15, 9400, 52, 4, 'won', { wonDay: 18 }],
    ['Attic insulation', 18, 2650, 60, 4, 'lost', { lost: 'Went with another contractor' }],
    ['Fence repair', 21, 1300, 66, 4, 'lost', { lost: 'No response' }],
    ['Boiler service plan', 24, 720, 75, 2, 'won', { wonDay: 6 }],
  ];
  const estimates = E.map(([title, ci, amount, sent, done, status, x = {}], i) => {
    const sentAt = now - sent * DAY;
    const followUps = steps.slice(0, done).map((s) => ({ stepId: s.id, channel: s.channel, at: new Date(sentAt + s.day * DAY).toISOString() }));
    return {
      id: `est${i + 1}`, number: `EST-${2040 + i}`, title, contactId: cid(ci), amount, status,
      sentAt: new Date(sentAt).toISOString(),
      viewedAt: x.viewed ? new Date(now - x.viewed * DAY).toISOString() : null,
      followUps,
      wonAt: x.wonDay ? new Date(sentAt + x.wonDay * DAY).toISOString() : null,
      lostReason: x.lost || '',
      note: x.replied || '',
    };
  });
  return { estimates, fuSteps: steps, fuSettings: { stopOnReply: true, quietHours: true, skipWeekends: false } };
}

const ready = () => store.ensure('estimates', seed);
const estimates = () => { ready(); return store.all('estimates'); };
const steps = () => { ready(); return store.all('fuSteps').slice().sort((a, b) => a.day - b.day); };
const who = (e) => store.contactName(store.contact(e.contactId));
const age = (e) => Math.floor((Date.now() - new Date(e.sentAt).getTime()) / DAY);
const recovered = (e) => e.status === 'won' && e.followUps.length > 0;

function nextStep(e) {
  if (e.status !== 'open') return null;
  const s = steps()[e.followUps.length];
  if (!s) return null;
  const at = new Date(e.sentAt).getTime() + s.day * DAY;
  return { step: s, n: e.followUps.length + 1, at, due: at <= Date.now() + DAY / 2 };
}

function fill(text, e) {
  const c = store.contact(e.contactId) || {};
  return String(text || '')
    .replaceAll('{first_name}', c.firstName || 'there').replaceAll('{estimate}', e.title.toLowerCase())
    .replaceAll('{amount}', money(e.amount)).replaceAll('{business}', store.get().business.name)
    .replaceAll('{my_name}', store.currentUser().name.split(' ')[0]);
}

function statusBadge(e) {
  if (e.status === 'won') return badge(recovered(e) ? 'Won after follow-up' : 'Won', 'green', { dot: true });
  if (e.status === 'lost') return badge('Lost', 'gray', { dot: true });
  if (e.status === 'paused') return badge('Paused', 'amber', { dot: true });
  const n = nextStep(e);
  if (!n) return badge('Sequence finished', 'purple', { dot: true });
  return n.due ? badge('Follow-up due', 'red', { dot: true }) : badge('Following up', 'blue', { dot: true });
}

function nextLabel(e) {
  const n = nextStep(e);
  if (!n) return e.status === 'open' ? 'All steps sent' : '—';
  const d = Math.round((n.at - Date.now()) / DAY);
  return `${CH[n.step.channel][0]} ${n.due ? 'due now' : `in ${plural(d, 'day')}`}`;
}

/* ------------------------------------------------------------------ */
/* Actions                                                              */
/* ------------------------------------------------------------------ */

function sendNext(e) {
  const n = nextStep(e);
  if (!n) return;
  const cur = store.find('estimates', e.id);
  store.patch('estimates', e.id, { followUps: [...cur.followUps, { stepId: n.step.id, channel: n.step.channel, at: new Date().toISOString(), manual: true }] });
  if (n.step.channel === 'call') toast(`Call reminder logged for ${who(e)}.`, { title: 'Marked as done' });
  else simulated(`Follow-up ${n.n} would go to ${who(e)} by ${CH[n.step.channel][0].toLowerCase()}.`);
  guide.done('followup');
}

function markWon(e) {
  store.patch('estimates', e.id, { status: 'won', wonAt: new Date().toISOString() });
  toast(e.followUps.length ? `${money(e.amount)} recovered after ${plural(e.followUps.length, 'follow-up')}. Remaining follow-ups were cancelled.` : `${money(e.amount)} won.`, { title: 'Estimate won' });
}

function markLost(e) {
  openPanel({
    title: 'Mark as lost',
    subtitle: `${e.title} · ${who(e)}`,
    size: 'sm',
    onSubmit(form) {
      store.patch('estimates', e.id, { status: 'lost', lostReason: formData(form).reason });
      toast('Follow-ups stopped. The reason shows up in your results.', { title: 'Estimate closed' });
      return true;
    },
    body: formGrid([{ label: 'Why did it fall through?', name: 'reason', type: 'select', value: LOST[0], options: LOST.map((r) => ({ value: r, label: r })), span: 2 }]),
    buttons: [{ label: 'Cancel' }, { label: 'Mark lost', kind: 'primary', type: 'submit' }],
  });
}

function newEstimate() {
  const cs = store.all('contacts').slice().sort((a, b) => store.contactName(a).localeCompare(store.contactName(b)));
  openPanel({
    title: 'Add an estimate',
    subtitle: 'Follow-ups start on their own from the day it was sent.',
    size: 'md',
    onSubmit(form) {
      if (!validate(form, { contactId: 'Pick the customer', title: 'Name the job', amount: 'Add the amount' })) return false;
      const v = formData(form);
      const n = 2040 + store.all('estimates').length;
      const row = store.insert('estimates', { number: `EST-${n}`, title: v.title, contactId: v.contactId, amount: Number(v.amount) || 0, status: 'open', sentAt: new Date().toISOString(), viewedAt: null, followUps: [], wonAt: null, lostReason: '', note: '' });
      toast(`First follow-up goes out in ${plural(steps()[0].day, 'day')} unless ${who(row).split(' ')[0]} replies first.`, { title: 'Estimate added' });
      router.go(`quote-recovery/estimate/${row.id}`);
      return true;
    },
    body: formGrid([
      { label: 'Customer', name: 'contactId', type: 'select', required: true, placeholder: 'Choose a customer', options: cs.map((c) => ({ value: c.id, label: store.contactName(c) })), span: 2 },
      { label: 'Job', name: 'title', required: true, placeholder: 'e.g. Water heater replacement' },
      { label: 'Amount', name: 'amount', type: 'number', required: true, attrs: 'min="0" step="50"', placeholder: '0' },
    ]),
    buttons: [{ label: 'Cancel' }, { label: 'Add estimate', kind: 'primary', type: 'submit' }],
  });
}

/* ------------------------------------------------------------------ */
/* Estimates list                                                       */
/* ------------------------------------------------------------------ */

const ui = { tab: 'open' };
const TABS = { open: (e) => e.status === 'open' || e.status === 'paused', due: (e) => !!(nextStep(e) || {}).due, won: (e) => e.status === 'won', lost: (e) => e.status === 'lost' };

function listView(ctx) {
  const all = estimates();
  const open = all.filter(TABS.open);
  const due = all.filter(TABS.due);
  const qtr = Date.now() - 90 * DAY;
  const rec = all.filter((e) => recovered(e) && new Date(e.wonAt).getTime() > qtr);
  const closed = all.filter((e) => e.status === 'won' || e.status === 'lost');
  const rows = all.filter(TABS[ui.tab]).sort((a, b) => (ui.tab === 'won' || ui.tab === 'lost' ? b.sentAt.localeCompare(a.sentAt) : Number(TABS.due(b)) - Number(TABS.due(a)) || b.amount - a.amount));
  const cols = [
    { key: 'est', label: 'Estimate', render: (e) => html`<strong>${e.title}</strong><span class="apwa-cell-sub">${who(e)} · ${e.number}</span>` },
    { key: 'amt', label: 'Amount', align: 'right', render: (e) => money(e.amount) },
    { key: 'age', label: 'Sent', hideOn: 'tablet', render: (e) => html`${plural(age(e), 'day')} ago${e.viewedAt ? html`<span class="apwa-cell-sub">Viewed ${ago(e.viewedAt)}</span>` : ''}` },
    { key: 'next', label: 'Next follow-up', hideOn: 'tablet', render: (e) => html`<span class="fu-next">${e.status === 'open' && nextStep(e) ? icon(CH[nextStep(e).step.channel][1]) : ''}${nextLabel(e)}</span>` },
    { key: 'st', label: 'Status', render: statusBadge },
  ];
  return {
    title: 'Estimates',
    subtitle: 'Every open estimate gets a polite follow-up on schedule until the customer answers.',
    actions: [{ label: 'Add estimate', icon: 'plus', kind: 'primary', primary: true, onClick: newEstimate }],
    body: html`
      <div class="apwa-stats fu-stats">
        ${stat({ label: 'Open estimates', value: moneyShort(open.reduce((t, e) => t + e.amount, 0)), sub: plural(open.length, 'estimate'), icon: 'receipt', tone: 'blue' })}
        ${stat({ label: 'Follow-ups due', value: due.length, sub: due.length ? 'Ready to send' : 'All caught up', icon: 'clock', tone: due.length ? 'amber' : 'green' })}
        ${stat({ label: 'Recovered (90 days)', value: moneyShort(rec.reduce((t, e) => t + e.amount, 0)), sub: `Won after a follow-up`, icon: 'trending-up', tone: 'green' })}
        ${stat({ label: 'Close rate', value: pct(closed.length ? closed.filter((e) => e.status === 'won').length / closed.length : 0), sub: plural(closed.length, 'closed estimate'), icon: 'target', tone: 'purple' })}
      </div>
      <div class="fu-toolbar">${segmented('ftab', [
        { value: 'open', label: 'Open', count: open.length },
        { value: 'due', label: 'Due now', count: due.length },
        { value: 'won', label: 'Won', count: all.filter(TABS.won).length },
        { value: 'lost', label: 'Lost', count: all.filter(TABS.lost).length },
      ], ui.tab, { label: 'Estimate status' })}${due.length && ui.tab !== 'won' && ui.tab !== 'lost' ? html`<button type="button" class="apwa-btn apwa-btn--secondary apwa-btn--sm" data-sendall>${icon('send')}<span>Send ${plural(due.length, 'due follow-up')}</span></button>` : ''}</div>
      ${card({ flush: true, className: 'fu-table', body: dataTable(cols, rows, {
        rowLink: (e) => href(`quote-recovery/estimate/${e.id}`),
        mobile: (e) => html`<span class="fu-mrow"><span class="fu-mrow__main"><strong>${e.title}</strong><span>${who(e)} · ${money(e.amount)}</span><span>${statusBadge(e)} ${e.status === 'open' ? html`<small>${nextLabel(e)}</small>` : ''}</span></span>${icon('chevron-right')}</span>`,
        empty: emptyState({ icon: 'check-circle', title: ui.tab === 'due' ? 'No follow-ups due' : 'Nothing here', text: ui.tab === 'due' ? 'The next ones go out on schedule.' : '' }),
      }) })}`,
    mount(root) {
      root.addEventListener('click', (ev) => {
        if (ev.target.closest('[data-sendall]')) {
          const list = estimates().filter(TABS.due);
          list.forEach((e) => { const n = nextStep(e); const cur = store.find('estimates', e.id); store.quietly(() => { cur.followUps.push({ stepId: n.step.id, channel: n.step.channel, at: new Date().toISOString(), manual: true }); }); });
          store.update(() => {});
          simulated(`${plural(list.length, 'follow-up')} would go out to ${list.map(who).join(', ')}.`);
          guide.done('followup');
          return;
        }
        const tr = ev.target.closest('tr[data-href]');
        if (tr) router.go(tr.dataset.href.replace(router.href(''), ''));
      });
      bindSegmented(root, { ftab: (v) => { ui.tab = v; ctx.rerender(); } });
    },
  };
}

/* ------------------------------------------------------------------ */
/* Estimate page                                                        */
/* ------------------------------------------------------------------ */

function estimateView(ctx) {
  const e = estimates().find((x) => x.id === ctx.params.id);
  if (!e) return { title: 'Estimate not found', back: href('quote-recovery/estimates'), body: emptyState({ icon: 'receipt', title: 'This estimate is gone', text: 'The demo may have been reset.' }) };
  const n = nextStep(e);
  const st = steps();
  const c = store.contact(e.contactId);
  const events = [
    { at: e.sentAt, icon: 'send', title: `Estimate ${e.number} sent`, sub: money(e.amount) },
    ...(e.viewedAt ? [{ at: e.viewedAt, icon: 'external', title: 'Customer opened the estimate', sub: '' }] : []),
    ...e.followUps.map((f, i) => { const s = st.find((x) => x.id === f.stepId) || {}; return { at: f.at, icon: CH[f.channel][1], title: `Follow-up ${i + 1}: ${CH[f.channel][0].toLowerCase()}${f.channel === 'call' ? ' done' : ' sent'}`, sub: f.channel === 'call' ? '' : fill(s.subject ? `${s.subject}` : s.text, e), sim: f.channel !== 'call' }; }),
    ...(e.note ? [{ at: e.followUps.length ? e.followUps[e.followUps.length - 1].at : e.sentAt, icon: 'mail', title: 'Customer replied', sub: e.note }] : []),
    ...(e.wonAt ? [{ at: e.wonAt, icon: 'check-circle', title: 'Approved', sub: recovered(e) ? `Recovered after ${plural(e.followUps.length, 'follow-up')}` : 'Approved before any follow-up' }] : []),
    ...(e.status === 'lost' ? [{ at: e.followUps.length ? e.followUps[e.followUps.length - 1].at : e.sentAt, icon: 'x-circle', title: 'Marked lost', sub: e.lostReason }] : []),
  ].sort((a, b) => (a.at < b.at ? -1 : 1));
  const actions = e.status === 'open'
    ? [{ label: 'Mark won', icon: 'check', kind: 'primary', primary: true, onClick: () => markWon(e) }, { label: 'Mark lost', icon: 'x', onClick: () => markLost(e) }]
    : e.status === 'paused' ? [{ label: 'Resume follow-ups', icon: 'refresh', kind: 'primary', primary: true, onClick: () => { store.patch('estimates', e.id, { status: 'open' }); toast('Follow-ups pick up where they left off.', { title: 'Resumed' }); } }]
      : [];
  return {
    title: e.title,
    crumb: { label: 'Estimates', href: href('quote-recovery/estimates') },
    back: href('quote-recovery/estimates'),
    subtitle: html`${statusBadge(e)} <span class="fu-sub">${who(e)} · ${e.number} · ${money(e.amount)} · sent ${date(e.sentAt)}</span>`,
    actions,
    body: html`<div class="fu-split">
      <div class="fu-col">
        ${n ? card({ title: `Next: follow-up ${n.n} of ${st.length}`, className: 'fu-nextcard', actions: badge(n.due ? 'Due now' : `On ${date(new Date(n.at).toISOString())}`, n.due ? 'red' : 'blue'), body: html`
          <div class="fu-msg"><div class="fu-msg__head">${icon(CH[n.step.channel][1])}<span>${CH[n.step.channel][0]}${n.step.channel === 'call' ? '' : ` to ${n.step.channel === 'sms' ? (c && c.phone) || 'their phone' : (c && c.email) || 'their email'}`}</span></div>
            ${n.step.subject ? html`<strong>${fill(n.step.subject, e)}</strong>` : ''}<p>${fill(n.step.text, e)}</p></div>
          <div class="fu-btns"><button type="button" class="apwa-btn apwa-btn--primary apwa-btn--sm" data-send>${icon(n.step.channel === 'call' ? 'check' : 'send')}<span>${n.step.channel === 'call' ? 'Mark call done' : 'Send now'}</span></button><button type="button" class="apwa-btn apwa-btn--secondary apwa-btn--sm" data-pause>${icon('clock')}<span>Pause follow-ups</span></button></div>` }) : ''}
        ${e.status === 'open' && !n ? card({ body: html`<p class="fu-muted">Every step in the sequence has gone out. Mark the estimate won or lost when you hear back.</p>` }) : ''}
        ${card({ title: 'History', body: html`<ol class="fu-tl">${events.map((v) => html`<li><span class="fu-tl__ic">${icon(v.icon)}</span><div><strong>${v.title}</strong>${v.sim ? badge('Simulated', 'gray') : ''}<small>${date(v.at)}</small>${v.sub ? html`<p>${v.sub}</p>` : ''}</div></li>`)}</ol>` })}
      </div>
      <div class="fu-col">
        ${card({ title: 'Sequence', body: html`<ol class="fu-seq">${st.map((s, i) => html`<li class="${i < e.followUps.length ? 'is-done' : n && i === n.n - 1 ? 'is-next' : ''}"><span class="fu-seq__dot">${i < e.followUps.length ? icon('check') : i + 1}</span><span>Day ${s.day} · ${CH[s.channel][0]}</span></li>`)}</ol>
          <a class="fu-link" href="${href('quote-recovery/sequence')}">Edit the sequence</a>` })}
        ${c ? card({ title: 'Customer', body: html`<p class="fu-cust"><a href="${href(`crm/contacts/${c.id}`)}"><strong>${store.contactName(c)}</strong></a><span>${c.email || ''}</span><span>${c.phone || ''}</span></p>` }) : ''}
      </div>
    </div>`,
    mount(root) {
      const s = $('[data-send]', root);
      if (s) s.addEventListener('click', () => sendNext(store.find('estimates', e.id)));
      const p = $('[data-pause]', root);
      if (p) p.addEventListener('click', () => { store.patch('estimates', e.id, { status: 'paused' }); toast('No more follow-ups until you resume them.', { title: 'Paused' }); });
    },
  };
}

/* ------------------------------------------------------------------ */
/* Sequence                                                             */
/* ------------------------------------------------------------------ */

function editStep(s) {
  openPanel({
    title: s ? 'Edit follow-up' : 'Add a follow-up',
    subtitle: 'Use {first_name}, {estimate}, {amount}, {business} and {my_name}.',
    size: 'md',
    onSubmit(form) {
      if (!validate(form, { day: 'Pick a day', text: 'Write the message' })) return false;
      const v = formData(form);
      const rec = { day: Math.max(1, Number(v.day) || 1), channel: v.channel, subject: v.channel === 'email' ? v.subject : '', text: v.text };
      if (s) store.patch('fuSteps', s.id, rec); else store.insert('fuSteps', rec);
      toast('Open estimates use the new sequence from their next step.', { title: 'Sequence saved' });
      return true;
    },
    body: formGrid([
      { label: 'Days after sending', name: 'day', type: 'number', value: s ? s.day : 21, attrs: 'min="1" max="60"' },
      { label: 'Send as', name: 'channel', type: 'select', value: s ? s.channel : 'email', options: Object.entries(CH).map(([value, [label]]) => ({ value, label })) },
      { label: 'Email subject', name: 'subject', value: s ? s.subject || '' : '', span: 2, hint: 'Emails only' },
      { label: 'Message', name: 'text', type: 'textarea', rows: 6, value: s ? s.text : '', required: true, span: 2 },
    ]),
    buttons: [
      ...(s ? [{ label: 'Remove', kind: 'ghost', onClick: (close) => { confirmDialog({ title: 'Remove this follow-up?', message: 'Open estimates will skip it.', confirmLabel: 'Remove', tone: 'danger' }).then((ok) => { if (ok) { store.remove('fuSteps', s.id); close(); toast('Follow-up removed.', { title: 'Sequence saved' }); } }); return false; } }] : []),
      { label: 'Cancel' }, { label: 'Save', kind: 'primary', type: 'submit' },
    ],
  });
}

function sequenceView() {
  const st = steps();
  const cfg = store.get().fuSettings;
  const sample = estimates().find((e) => e.status === 'open') || estimates()[0];
  const sw = (k, label, sub) => html`<label class="fu-opt"><span><strong>${label}</strong><small>${sub}</small></span><span class="fu-switch"><input type="checkbox" data-opt="${k}" ${cfg[k] ? raw('checked') : ''}><i></i></span></label>`;
  return {
    title: 'Follow-up sequence',
    subtitle: 'What goes out, and when, after you send an estimate.',
    actions: [{ label: 'Add follow-up', icon: 'plus', kind: 'primary', primary: true, onClick: () => editStep(null) }],
    body: html`<div class="fu-split">
      ${card({ title: 'Steps', body: html`<ol class="fu-steps">
        <li class="fu-steps__start"><span class="fu-steps__ic">${icon('send')}</span><span><strong>Day 0</strong><small>You send the estimate</small></span></li>
        ${st.map((s, i) => html`<li><span class="fu-steps__ic">${icon(CH[s.channel][1])}</span><button type="button" class="fu-steps__card" data-step="${s.id}"><span class="fu-steps__top"><strong>Day ${s.day} · ${CH[s.channel][0]}</strong>${icon('edit')}</span>${s.subject ? html`<em>${fill(s.subject, sample)}</em>` : ''}<span class="fu-steps__txt">${fill(s.text, sample)}</span></button></li>`)}
      </ol>` })}
      <div class="fu-col">
        ${card({ title: 'Rules', body: html`<div class="fu-opts">
          ${sw('stopOnReply', 'Stop when they reply', 'Any text or email back pauses the sequence.')}
          ${sw('quietHours', 'Quiet hours', 'Only send between 8 AM and 7 PM their time.')}
          ${sw('skipWeekends', 'Skip weekends', 'Weekend steps move to Monday.')}
        </div>` })}
        ${card({ body: html`<p class="fu-muted">${icon('info')} Previews use ${who(sample)}’s ${sample.title.toLowerCase()} estimate. In this demo nothing is sent; in a real setup texts and emails go from your own number and address.</p>` })}
      </div>
    </div>`,
    mount(root) {
      root.addEventListener('click', (e) => { const b = e.target.closest('[data-step]'); if (b) editStep(store.find('fuSteps', b.dataset.step)); });
      root.addEventListener('change', (e) => { const cb = e.target.closest('[data-opt]'); if (!cb) return; store.update((s) => { s.fuSettings[cb.dataset.opt] = cb.checked; }); toast('Rule saved.', { title: 'Sequence updated' }); });
    },
  };
}

/* ------------------------------------------------------------------ */
/* Results                                                              */
/* ------------------------------------------------------------------ */

function resultsView() {
  const all = estimates();
  const won = all.filter((e) => e.status === 'won');
  const rec = won.filter(recovered);
  const closed = all.filter((e) => e.status === 'won' || e.status === 'lost');
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - i);
    const m = d.getMonth(); const y = d.getFullYear();
    const base = [9800, 12400, 8600, 14100, 0, 0][5 - i] || 0; // earlier months: sample history
    const live = rec.filter((e) => { const w = new Date(e.wonAt); return w.getMonth() === m && w.getFullYear() === y; }).reduce((t, e) => t + e.amount, 0);
    months.push({ label: d.toLocaleDateString('en-US', { month: 'short' }), value: base + live, highlight: i === 0 });
  }
  const byStep = steps().map((s, i) => ({ label: `Follow-up ${i + 1}`, sub: `Day ${s.day} · ${CH[s.channel][0]}`, value: rec.filter((e) => e.followUps.length === i + 1).length, tone: 'green' }));
  const lost = LOST.map((r) => ({ label: r, value: all.filter((e) => e.lostReason === r).length, tone: 'gray' })).filter((x) => x.value);
  return {
    title: 'Results',
    subtitle: 'How much revenue follow-ups win back that silence would have lost.',
    body: html`
      <div class="apwa-stats fu-stats">
        ${stat({ label: 'Recovered revenue', value: money(rec.reduce((t, e) => t + e.amount, 0)), sub: `${plural(rec.length, 'job')} won after a follow-up`, icon: 'trending-up', tone: 'green' })}
        ${stat({ label: 'Won with no follow-up', value: plural(won.length - rec.length, 'job'), sub: 'Approved right away', icon: 'check-circle', tone: 'blue' })}
        ${stat({ label: 'Close rate', value: pct(closed.length ? won.length / closed.length : 0), sub: plural(closed.length, 'closed estimate'), icon: 'target', tone: 'purple' })}
        ${stat({ label: 'Average days to yes', value: won.length ? (won.reduce((t, e) => t + (new Date(e.wonAt) - new Date(e.sentAt)) / DAY, 0) / won.length).toFixed(0) : '—', sub: 'From estimate to approval', icon: 'clock', tone: 'amber' })}
      </div>
      <div class="apwa-grid apwa-grid--2 fu-grid">
        ${card({ title: 'Recovered by month', body: columnChart(months, { label: 'Recovered revenue by month' }) })}
        ${card({ title: 'Which follow-up got the yes', body: barList(byStep, { format: (v) => plural(v, 'job') }) })}
      </div>
      ${lost.length ? card({ title: 'Why estimates were lost', body: barList(lost, { format: (v) => String(v) }) }) : ''}`,
  };
}

/* ------------------------------------------------------------------ */
/* Module                                                               */
/* ------------------------------------------------------------------ */

function search(q) {
  const s = q.toLowerCase();
  return estimates().filter((e) => `${e.title} ${who(e)} ${e.number}`.toLowerCase().includes(s)).slice(0, 5)
    .map((e) => ({ label: e.title, sub: `Estimate · ${who(e)} · ${money(e.amount)}`, href: href(`quote-recovery/estimate/${e.id}`), icon: 'receipt', type: 'Estimate' }));
}

export default {
  slug: 'quote-recovery',
  nav: [
    { id: 'fu-est', path: 'quote-recovery/estimates', label: 'Estimates', icon: 'receipt' },
    { id: 'fu-seq', path: 'quote-recovery/sequence', label: 'Sequence', icon: 'repeat' },
    { id: 'fu-res', path: 'quote-recovery/results', label: 'Results', icon: 'trending-up' },
  ],
  routes: [
    { pattern: 'quote-recovery', redirect: 'quote-recovery/estimates' },
    { pattern: 'quote-recovery/estimates', view: listView, nav: 'fu-est' },
    { pattern: 'quote-recovery/estimate/:id', view: estimateView, nav: 'fu-est' },
    { pattern: 'quote-recovery/sequence', view: sequenceView, nav: 'fu-seq' },
    { pattern: 'quote-recovery/results', view: resultsView, nav: 'fu-res' },
  ],
  quickActions: [{ label: 'Add an estimate', icon: 'receipt', run: () => newEstimate() }],
  search,
};
