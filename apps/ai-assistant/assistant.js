/**
 * AI Assistant demo.
 * A chat that answers questions about the demo business. Answers are
 * scripted: each one is built from the sample data in the other apps by
 * simple keyword matching. No AI service is called and nothing is sent.
 */
import { html, raw, icon, $, plural, money, moneyShort, date } from '../../assets/js/core/dom.js';
import * as store from '../../assets/js/core/store.js';
import * as router from '../../assets/js/core/router.js';
import { toast } from '../../assets/js/core/ui.js';
import { card } from '../../assets/js/core/components.js';
import { stageName } from '../../assets/js/core/metrics.js';
import { total, statusOf } from '../invoice-automation/invoices.js';

const DAY = 86400000;
const href = (p) => router.href(p);
const name = (id) => store.contactName(store.contact(id));
const first = (id) => (store.contact(id) || {}).firstName || 'there';
const time = (iso) => new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
const paid = (inv) => inv.payments.reduce((t, p) => t + p.amount, 0);
const owed = (inv) => Math.max(0, Math.round((total(inv) - paid(inv)) * 100) / 100);
const late = (inv) => Math.floor((Date.now() - new Date(inv.dueAt).getTime()) / DAY);
const invLink = (inv) => href(`invoice-automation/invoices?inv=${inv.id}`);

const SUGGEST = [
  ['Who owes me money?', 'dollar'],
  ['What’s on the schedule tomorrow?', 'calendar'],
  ['Draft a payment reminder', 'mail'],
  ['Which quotes need a follow-up?', 'briefcase'],
  ['How did sales go this month?', 'trending-up'],
];

/* ------------------------------------------------------------------ */
/* Scripted answers                                                     */
/* ------------------------------------------------------------------ */

const list = (items) => html`<ul class="ai-list">${items}</ul>`;
const overdueList = () => store.all('invoices').filter((i) => statusOf(i) === 'overdue').sort((a, b) => owed(b) - owed(a));

function aOverdue() {
  const od = overdueList();
  const open = store.all('invoices').filter((i) => ['open', 'partial'].includes(statusOf(i)));
  if (!od.length) return { html: html`<p>Nobody is late right now. ${open.length ? html`${plural(open.length, 'invoice')} worth ${money(open.reduce((t, i) => t + owed(i), 0))} ${open.length === 1 ? 'is' : 'are'} out but not yet due.` : 'Every invoice is paid.'}</p>` };
  const sum = od.reduce((t, i) => t + owed(i), 0);
  return {
    html: html`<p><strong>${money(sum)} is late</strong> across ${plural(od.length, 'invoice')} from ${plural(new Set(od.map((i) => i.contactId)).size, 'customer')}:</p>
      ${list(od.slice(0, 5).map((i) => html`<li><a href="${invLink(i)}">${name(i.contactId)}</a><span>${money(owed(i))} · ${i.number} · ${plural(late(i), 'day')} late</span></li>`))}
      ${open.length ? html`<p>Another ${money(open.reduce((t, i) => t + owed(i), 0))} is out but not yet due.</p>` : ''}`,
    follow: ['Draft a payment reminder'],
  };
}

function aReminder() {
  const inv = overdueList()[0];
  if (!inv) return { html: html`<p>No invoices are late, so there's no reminder to write. Nice.</p>` };
  const biz = store.get().business.name;
  const text = `Hi ${first(inv.contactId)},\n\nA quick reminder that invoice ${inv.number} for ${money(owed(inv))} was due on ${date(inv.dueAt)}. You can pay online from the original invoice email, or reply here if anything looks off.\n\nThanks so much,\n${store.currentUser().name.split(' ')[0]}\n${biz}`;
  return {
    html: html`<p>Here's a friendly reminder for <strong>${name(inv.contactId)}</strong>, your largest late invoice:</p>
      <div class="ai-draft"><pre>${text}</pre></div>
      <p class="ai-small">Nothing was sent. Copy it, or open the invoice to send a reminder from there.</p>`,
    actions: [{ label: 'Copy draft', icon: 'file-text', copy: text }, { label: 'Open invoice', icon: 'external', href: invLink(inv) }],
  };
}

function aSchedule(q) {
  const today = /today/.test(q);
  const day = new Date(); day.setHours(0, 0, 0, 0);
  if (!today) day.setTime(day.getTime() + DAY);
  const end = day.getTime() + DAY;
  const services = (store.get().booking || {}).services || [];
  const appts = store.all('appointments').filter((a) => { const t = new Date(a.start).getTime(); return t >= day.getTime() && t < end && ['confirmed', 'requested', 'completed'].includes(a.status); }).sort((a, b) => (a.start < b.start ? -1 : 1));
  const label = today ? 'today' : 'tomorrow';
  if (!appts.length) return { html: html`<p>Nothing is booked ${label}. It's a good day to catch up on quotes.</p>`, follow: ['Which quotes need a follow-up?'] };
  const req = appts.filter((a) => a.status === 'requested').length;
  return {
    html: html`<p><strong>${plural(appts.length, 'visit')} ${label}</strong>${req ? html`, and ${plural(req, 'request')} still need${req === 1 ? 's' : ''} your OK` : ''}:</p>
      ${list(appts.map((a) => { const s = services.find((x) => x.id === a.serviceId); return html`<li><a href="${href(`booking-manager/bookings?appt=${a.id}`)}">${time(a.start)} · ${name(a.contactId)}</a><span>${s ? s.name : 'Visit'} with ${((store.user(a.staffId) || {}).name || 'the team').split(' ')[0]}${a.status === 'requested' ? ' · waiting for approval' : ''}</span></li>`; }))}`,
    follow: [today ? 'What’s on the schedule tomorrow?' : 'What’s on the schedule today?'],
  };
}

function aQuotes() {
  const open = store.all('deals').filter((d) => d.status === 'open');
  if (!open.length) return { html: html`<p>There are no open quotes right now.</p>` };
  const days = (d) => Math.round((new Date(d.expectedClose).getTime() - Date.now()) / DAY);
  const pick = open.slice().sort((a, b) => days(a) - days(b)).slice(0, 5);
  const soon = open.filter((d) => days(d) <= 7).length;
  const when = (d) => { const n = days(d); return n < 0 ? `close date passed ${plural(-n, 'day')} ago` : n === 0 ? 'closes today' : `closes in ${plural(n, 'day')}`; };
  return {
    html: html`<p><strong>${soon ? `${plural(soon, 'quote')} ${soon === 1 ? 'is' : 'are'} due to close within a week` : 'No quote is due to close this week'}</strong>, out of ${open.length} open worth ${moneyShort(open.reduce((t, d) => t + d.value, 0))}. Follow up on these first:</p>
      ${list(pick.map((d) => html`<li><a href="${href(`crm/pipeline?deal=${d.id}`)}">${d.name}</a><span>${name(d.contactId)} · ${money(d.value)} · ${stageName(d.stageId)} · ${when(d)}</span></li>`))}`,
    follow: ['How did sales go this month?'],
  };
}

function aSummary() {
  const start = new Date(); start.setDate(1); start.setHours(0, 0, 0, 0);
  const prevStart = new Date(start); prevStart.setMonth(prevStart.getMonth() - 1);
  const inRange = (iso, a, b) => iso && new Date(iso) >= a && new Date(iso) < b;
  const now = new Date(Date.now() + DAY);
  const won = (a, b) => store.all('deals').filter((d) => d.status === 'won' && inRange(d.closedAt, a, b));
  const cash = (a, b) => store.all('invoices').reduce((t, i) => t + i.payments.filter((p) => inRange(p.at, a, b)).reduce((s, p) => s + p.amount, 0), 0);
  const visits = (a, b) => store.all('appointments').filter((x) => x.status === 'completed' && inRange(x.start, a, b)).length;
  const w = won(start, now); const pw = won(prevStart, start);
  const c = cash(start, now); const pc = cash(prevStart, start);
  const month = start.toLocaleDateString('en-US', { month: 'long' });
  const vs = (a, b, f) => (b ? html` <span class="ai-delta ${a >= b ? 'is-up' : 'is-down'}">${a >= b ? 'up' : 'down'} from ${f(b)} last month</span>` : '');
  return {
    html: html`<p>Here's ${month} so far:</p>
      ${list([
        html`<li><strong>${money(c)} collected</strong><span>From paid invoices.${vs(c, pc, moneyShort)}</span></li>`,
        html`<li><strong>${plural(w.length, 'job')} won, ${moneyShort(w.reduce((t, d) => t + d.value, 0))}</strong><span>${w.length ? w.slice(0, 2).map((d) => d.name).join(', ') : 'None closed yet.'}${vs(w.length, pw.length, String)}</span></li>`,
        html`<li><strong>${plural(visits(start, now), 'visit')} completed</strong><span>Across the booking calendar.</span></li>`,
      ])}
      <p class="ai-small">Want the full picture? <a href="${href('crm/reports')}">Open sales reports</a>.</p>`,
    follow: ['Who owes me money?'],
  };
}

function aTickets() {
  const t = store.get().tickets;
  if (!t) return { html: html`<p>Support isn't set up in this workspace yet. <a href="${href('customer-support/tickets')}">Open Customer Support</a> once and I can answer questions about tickets.</p>` };
  const open = t.filter((x) => x.status === 'open');
  const urgent = open.filter((x) => x.priority === 'urgent' || x.priority === 'high');
  return {
    html: html`<p><strong>${plural(open.length, 'open ticket')}</strong>${urgent.length ? html`, ${urgent.length} marked urgent or high` : ''}:</p>
      ${list(open.slice(0, 5).map((x) => html`<li><a href="${href(`customer-support/ticket/${x.id}`)}">${x.subject}</a><span>${name(x.contactId)} · ${x.priority}${x.ownerId ? '' : ' · unassigned'}</span></li>`))}`,
  };
}

function aContact(c) {
  const deals = store.all('deals').filter((d) => d.contactId === c.id);
  const invs = store.all('invoices').filter((i) => i.contactId === c.id);
  const bal = invs.reduce((t, i) => t + (['open', 'partial', 'overdue'].includes(statusOf(i)) ? owed(i) : 0), 0);
  const next = store.all('appointments').filter((a) => a.contactId === c.id && new Date(a.start) > new Date() && a.status === 'confirmed').sort((a, b) => (a.start < b.start ? -1 : 1))[0];
  return {
    html: html`<p><a href="${href(`crm/contacts/${c.id}`)}"><strong>${store.contactName(c)}</strong></a>${c.company ? ` at ${c.company}` : ''}${c.title ? `, ${c.title}` : ''}.</p>
      ${list([
        html`<li><strong>Deals</strong><span>${deals.length ? deals.map((d) => `${d.name} (${d.status === 'open' ? stageName(d.stageId) : d.status})`).join(', ') : 'None yet'}</span></li>`,
        html`<li><strong>Balance</strong><span>${bal ? `${money(bal)} unpaid` : 'All paid up'}</span></li>`,
        html`<li><strong>Next visit</strong><span>${next ? `${date(next.start)} at ${time(next.start)}` : 'Nothing booked'}</span></li>`,
      ])}`,
  };
}

function aHelp() {
  return { html: html`<p>I can look things up across your apps and draft messages for you. For example, I can tell you who owes you money, what's booked tomorrow, which quotes have gone quiet, or how the month is going. Pick one below to try it.</p>`, follow: SUGGEST.slice(0, 3).map((s) => s[0]) };
}

function answer(raw_) {
  const q = raw_.toLowerCase();
  const c = store.all('contacts').find((x) => x.firstName && x.lastName && (q.includes(`${x.firstName} ${x.lastName}`.toLowerCase()) || (q.split(/\W+/).includes(x.lastName.toLowerCase()) && x.lastName.length > 3)));
  if (/remind|reminder|chase|nudge/.test(q)) return aReminder();
  if (c) return aContact(c);
  if (/owe|overdue|unpaid|late|outstanding|invoice|paid/.test(q)) return aOverdue();
  if (/schedule|booking|booked|appointment|calendar|visit|today|tomorrow/.test(q)) return aSchedule(q);
  if (/quote|deal|pipeline|proposal|follow/.test(q)) return aQuotes();
  if (/summary|month|sales|revenue|how did|how are we|numbers/.test(q)) return aSummary();
  if (/ticket|support|complain/.test(q)) return aTickets();
  if (/^(hi|hello|hey)\b|help|what can you/.test(q)) return aHelp();
  return { html: html`<p>I don't have a scripted answer for that one. This demo answers a handful of common questions using your sample data. Try one of these:</p>`, follow: SUGGEST.map((s) => s[0]) };
}

/* ------------------------------------------------------------------ */
/* Chat view                                                            */
/* ------------------------------------------------------------------ */

const ready = () => store.ensure('aiChat', () => ({ aiChat: [] }));
let pending = false;

function ask(q) {
  const text = String(q || '').trim();
  if (!text || pending) return;
  ready();
  pending = true;
  store.update((st) => st.aiChat.push({ from: 'me', text, at: new Date().toISOString() }));
  setTimeout(() => {
    const a = answer(text);
    pending = false;
    store.update((st) => st.aiChat.push({ from: 'ai', html: String(a.html), actions: a.actions || [], follow: a.follow || [], at: new Date().toISOString() }));
  }, 700);
}

function chatView() {
  ready();
  const msgs = store.all('aiChat');
  const last = msgs[msgs.length - 1];
  const chips = (items) => html`<div class="ai-chips">${items.map((s) => html`<button type="button" class="ai-chip" data-ask="${s}">${s}</button>`)}</div>`;
  return {
    title: 'Ask AI',
    subtitle: 'Ask about your customers, quotes, bookings and invoices in plain English.',
    actions: msgs.length ? [{ label: 'New chat', icon: 'refresh', onClick: () => { store.update((st) => { st.aiChat = []; }); } }] : [],
    body: html`<div class="ai-wrap">
      <div class="ai-main">
        <div class="ai-banner">${icon('info')}<span>Demo: answers are scripted from your sample data. No AI service is connected and nothing is sent.</span></div>
        ${card({ flush: true, className: 'ai-card', body: html`<div class="ai-log" data-log aria-live="polite">
          ${msgs.length ? '' : html`<div class="ai-hello"><span class="ai-hello__ic">${icon('sparkles')}</span><strong>Hi ${store.currentUser().name.split(' ')[0]}, what do you need?</strong><p>I know your contacts, deals, bookings and invoices.</p>
            <div class="ai-start">${SUGGEST.map(([s, ic]) => html`<button type="button" data-ask="${s}">${icon(ic)}<span>${s}</span></button>`)}</div></div>`}
          ${msgs.map((m) => (m.from === 'me'
            ? html`<div class="ai-msg ai-msg--me"><p>${m.text}</p></div>`
            : html`<div class="ai-msg ai-msg--ai"><span class="ai-msg__ic">${icon('sparkles')}</span><div class="ai-msg__body">${raw(m.html)}
                ${m.actions && m.actions.length ? html`<div class="ai-acts">${m.actions.map((a, i) => (a.href ? html`<a class="apwa-btn apwa-btn--secondary apwa-btn--sm" href="${a.href}">${icon(a.icon)}<span>${a.label}</span></a>` : html`<button type="button" class="apwa-btn apwa-btn--secondary apwa-btn--sm" data-copy="${i}" data-at="${m.at}">${icon(a.icon)}<span>${a.label}</span></button>`))}</div>` : ''}
                ${m === last && m.follow && m.follow.length ? chips(m.follow) : ''}</div></div>`))}
          ${pending ? html`<div class="ai-msg ai-msg--ai"><span class="ai-msg__ic">${icon('sparkles')}</span><div class="ai-msg__body"><span class="ai-dots" aria-label="Thinking"><i></i><i></i><i></i></span></div></div>` : ''}
        </div>
        <form class="ai-compose" data-compose>
          <textarea name="q" rows="1" placeholder="Ask about a customer, a quote, an invoice…" aria-label="Ask a question" ${pending ? raw('disabled') : ''}></textarea>
          <button type="submit" class="apwa-btn apwa-btn--primary" aria-label="Send" ${pending ? raw('disabled') : ''}>${icon('send')}</button>
        </form>` })}
      </div>
      <aside class="ai-side">
        ${card({ title: 'Try asking', className: 'ai-tries-card', body: html`<div class="ai-tries">${SUGGEST.map(([s, ic]) => html`<button type="button" data-ask="${s}">${icon(ic)}<span>${s}</span></button>`)}<button type="button" data-ask="Tell me about Rosa Delgado">${icon('user')}<span>Tell me about Rosa Delgado</span></button></div>` })}
        ${card({ title: 'In a real setup', body: html`<ul class="ai-real"><li>${icon('check')}Connects to the AI provider you choose.</li><li>${icon('check')}Works across every app you install.</li><li>${icon('check')}Always asks before it sends or changes anything.</li></ul>` })}
      </aside>
    </div>`,
    mount(root) {
      const log = $('[data-log]', root);
      log.scrollTop = log.scrollHeight;
      const form = $('[data-compose]', root);
      const ta = form.elements.q;
      if (!pending && msgs.length) ta.focus({ preventScroll: true });
      form.addEventListener('submit', (e) => { e.preventDefault(); ask(ta.value); });
      ta.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ask(ta.value); } });
      root.addEventListener('click', (e) => {
        const b = e.target.closest('[data-ask]');
        if (b) { ask(b.dataset.ask); return; }
        const cp = e.target.closest('[data-copy]');
        if (cp) {
          const m = store.all('aiChat').find((x) => x.at === cp.dataset.at);
          const text = m && m.actions[Number(cp.dataset.copy)].copy;
          const done = () => toast('The draft is on your clipboard. Nothing was sent.', { title: 'Copied' });
          if (navigator.clipboard && text) navigator.clipboard.writeText(text).then(done, () => toast('Select the text in the draft to copy it.', { title: 'Couldn’t copy', tone: 'warning' }));
        }
      });
    },
  };
}

export default {
  slug: 'ai-assistant',
  nav: [{ id: 'ai-chat', path: 'ai-assistant/chat', label: 'Ask AI', icon: 'sparkles' }],
  routes: [
    { pattern: 'ai-assistant', redirect: 'ai-assistant/chat' },
    { pattern: 'ai-assistant/chat', view: chatView, nav: 'ai-chat' },
  ],
  quickActions: [{ label: 'Ask the AI Assistant', icon: 'sparkles', run: () => router.go('ai-assistant/chat') }],
  search: () => [],
};
