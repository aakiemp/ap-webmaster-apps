/**
 * Customer Support demo.
 * Tickets from calls, email and the web form, a conversation page per ticket
 * with replies, internal notes and saved replies, a help center with a
 * request form, and customer feedback. Replies to customers are simulated.
 */
import { html, raw, icon, $, $$, plural, date, ago } from '../../assets/js/core/dom.js';
import * as store from '../../assets/js/core/store.js';
import * as router from '../../assets/js/core/router.js';
import { openPanel, toast, simulated, formData, validate, menu } from '../../assets/js/core/ui.js';
import { badge, button, card, stat, emptyState, segmented, bindSegmented, formGrid, dataTable, barList, avatar } from '../../assets/js/core/components.js';

const HOUR = 3600000;
const href = (p) => router.href(p);

const CHANNELS = { phone: ['Phone', 'phone'], email: ['Email', 'mail'], web: ['Web form', 'file-text'] };
const PRIORITY = { urgent: ['Urgent', 'red'], high: ['High', 'amber'], normal: ['Normal', 'gray'], low: ['Low', 'gray'] };
const STATUS = { open: ['Open', 'blue'], waiting: ['Waiting on customer', 'amber'], resolved: ['Resolved', 'green'] };
const SLA_HOURS = 4;

const SAVED = [
  ['Booking a visit', 'Thanks for reaching out. I can get a technician out to you. Does tomorrow between 9 and 11 AM work?'],
  ['Warranty question', 'Good news: that part is still under warranty, so there is no charge for the part. We only bill labor if it is not a defect.'],
  ['Running late', 'Sorry for the wait. Your technician is running about 30 minutes behind and will text you when they are on the way.'],
  ['Closing the loop', 'Glad we could help! I will close this ticket, but just reply here if anything else comes up.'],
];

/* ------------------------------------------------------------------ */
/* Seed                                                                 */
/* ------------------------------------------------------------------ */

function seed() {
  const now = Date.now();
  const iso = (h) => new Date(now - h * HOUR).toISOString();
  const cs = store.all('contacts');
  const c = (i) => (cs[i % Math.max(1, cs.length)] || {}).id;
  const t = (id, ci, subject, channel, priority, status, ownerId, hours, msgs, extra = {}) => ({
    id, contactId: c(ci), subject, channel, priority, status, ownerId, createdAt: iso(hours),
    messages: msgs.map(([from, text, h, by]) => ({ from, text, at: iso(h), ...(from === 'customer' ? {} : { by: by || ownerId || 'u4' }) })), ...extra,
  });
  const tickets = [
    t('tk1', 2, 'No heat upstairs since this morning', 'phone', 'urgent', 'open', 'u3', 1.2, [['customer', 'Called in: furnace runs but upstairs vents are cold. Two kids at home.', 1.2]]),
    t('tk2', 6, 'Water stain on the ceiling after the repair', 'email', 'high', 'open', null, 5.5, [['customer', 'Hi, a brown stain showed up under the bathroom you worked on last week. Can someone take a look?', 5.5]]),
    t('tk3', 9, 'Can I move my Thursday appointment?', 'web', 'normal', 'open', 'u4', 2.5, [['customer', 'Something came up at work. Is Friday morning possible instead?', 2.5]]),
    t('tk4', 1, 'Invoice shows the wrong address', 'email', 'normal', 'waiting', 'u4', 26, [['customer', 'Our invoice lists the old office. We moved to Suite 210.', 26], ['agent', 'Thanks Rosa! Is it 410 Market St, Suite 210? I will send a corrected copy as soon as you confirm.', 24, 'u4']]),
    t('tk5', 12, 'Thermostat keeps resetting', 'phone', 'high', 'waiting', 'u3', 30, [['customer', 'Thermostat goes back to 62 every night.', 30], ['note', 'Probably the schedule. Asked for a photo of the settings screen.', 29, 'u3'], ['agent', 'Could you send a photo of the thermostat’s schedule screen? That usually explains it.', 29, 'u3']]),
    t('tk6', 4, 'Question about the service plan', 'web', 'low', 'resolved', 'u2', 52, [['customer', 'Does the plan include two visits a year?', 52], ['agent', 'Yes, spring and fall, plus 15% off repairs.', 50, 'u2']], { resolvedAt: iso(49), firstReplyH: 2, rating: 5 }),
    t('tk7', 15, 'Gutter guard came loose', 'phone', 'normal', 'resolved', 'u3', 76, [['customer', 'One gutter guard is hanging on the north side.', 76], ['agent', 'Fixed it today at no charge. Sorry about that!', 52, 'u3']], { resolvedAt: iso(52), firstReplyH: 1.5, rating: 4 }),
    t('tk8', 20, 'Receipt for my last visit', 'email', 'low', 'resolved', 'u4', 96, [['customer', 'Can you resend my receipt from October?', 96], ['agent', 'Sent! It should be in your inbox.', 95, 'u4']], { resolvedAt: iso(95), firstReplyH: 1, rating: 5 }),
  ];
  const articles = [
    { id: 'kb1', title: 'How do I reschedule an appointment?', body: 'Use the link in your confirmation text or email, or reply to it. You can move a visit up to 24 hours before it starts at no charge.', views: 412, helpful: 0.91, cat: 'Bookings' },
    { id: 'kb2', title: 'What does the maintenance plan include?', body: 'Two tune-ups a year (spring and fall), priority scheduling and 15% off repairs. You can cancel any time.', views: 268, helpful: 0.88, cat: 'Plans' },
    { id: 'kb3', title: 'My furnace is running but blowing cold air', body: 'Check that the thermostat is set to Heat and the filter is not clogged. If it still blows cold after 10 minutes, call us and we will prioritize it.', views: 531, helpful: 0.79, cat: 'Troubleshooting' },
    { id: 'kb4', title: 'How do I pay my invoice online?', body: 'Every invoice email has a Pay now button. We take cards and bank transfers.', views: 199, helpful: 0.95, cat: 'Billing' },
    { id: 'kb5', title: 'Do you offer warranties on repairs?', body: 'Parts we install carry the maker’s warranty, and our labor is guaranteed for 90 days.', views: 154, helpful: 0.86, cat: 'Billing' },
  ];
  const feedback = [
    [5, 'Marcus was on time and explained everything.', 20], [5, 'Fast fix, super friendly.', 50], [4, 'Great work, just a bit late.', 70], [5, '', 95], [3, 'Fixed, but I had to call twice to get a time.', 120], [5, 'Best service company we have used.', 160], [4, '', 200], [5, 'Clean, careful and quick.', 230],
  ].map(([score, text, h], i) => ({ id: `fb${i + 1}`, score, text, contactId: c(i * 3 + 2), at: iso(h) }));
  return { tickets, articles, feedback };
}

const ready = () => store.ensure('tickets', seed);
const tickets = () => { ready(); return store.all('tickets'); };
const articles = () => { ready(); return store.all('articles'); };
const feedback = () => { ready(); return store.all('feedback'); };
const who = (t) => store.contactName(store.contact(t.contactId));
const ageH = (t) => (Date.now() - new Date(t.createdAt).getTime()) / HOUR;
const replied = (t) => t.messages.some((m) => m.from === 'agent');
const late = (t) => t.status === 'open' && !replied(t) && ageH(t) > SLA_HOURS;

function slaBadge(t) {
  if (t.status !== 'open' || replied(t)) return '';
  const left = SLA_HOURS - ageH(t);
  return left < 0 ? badge('Reply overdue', 'red') : badge(`Reply within ${left < 1 ? `${Math.max(1, Math.round(left * 60))} min` : `${Math.round(left)}h`}`, left < 1.5 ? 'amber' : 'gray');
}
const statusBadge = (t) => badge(STATUS[t.status][0], STATUS[t.status][1], { dot: true });
const prioBadge = (t) => badge(PRIORITY[t.priority][0], PRIORITY[t.priority][1]);

/* ------------------------------------------------------------------ */
/* New ticket                                                           */
/* ------------------------------------------------------------------ */

function newTicket() {
  const cs = store.all('contacts').slice().sort((a, b) => store.contactName(a).localeCompare(store.contactName(b)));
  openPanel({
    title: 'New ticket',
    subtitle: 'Log a call or an email so nothing slips.',
    size: 'md',
    onSubmit(form) {
      if (!validate(form, { contactId: 'Pick the customer', subject: 'Add a short summary', text: 'Write what they need' })) return false;
      const v = formData(form);
      const row = store.insert('tickets', { contactId: v.contactId, subject: v.subject, channel: v.channel, priority: v.priority, status: 'open', ownerId: v.ownerId || null, messages: [{ from: 'customer', text: v.text, at: new Date().toISOString() }] });
      toast(`Ticket created for ${who(row)}.`, { title: 'Ticket added' });
      router.go(`customer-support/ticket/${row.id}`);
      return true;
    },
    body: formGrid([
      { label: 'Customer', name: 'contactId', type: 'select', required: true, placeholder: 'Choose a customer', options: cs.map((c) => ({ value: c.id, label: store.contactName(c) })), span: 2 },
      { label: 'Summary', name: 'subject', required: true, placeholder: 'e.g. AC not cooling', span: 2 },
      { label: 'Came in by', name: 'channel', type: 'select', value: 'phone', options: Object.entries(CHANNELS).map(([v, [l]]) => ({ value: v, label: l })) },
      { label: 'Priority', name: 'priority', type: 'select', value: 'normal', options: Object.entries(PRIORITY).map(([v, [l]]) => ({ value: v, label: l })) },
      { label: 'Assign to', name: 'ownerId', type: 'select', placeholder: 'Unassigned', options: store.all('users').map((u) => ({ value: u.id, label: u.name })), span: 2 },
      { label: 'What they need', name: 'text', type: 'textarea', rows: 3, required: true, span: 2 },
    ]),
    buttons: [{ label: 'Cancel' }, { label: 'Create ticket', kind: 'primary', type: 'submit' }],
  });
}

/* ------------------------------------------------------------------ */
/* Ticket list                                                          */
/* ------------------------------------------------------------------ */

const ui = { tab: 'open' };
const TABS = { open: (t) => t.status === 'open', waiting: (t) => t.status === 'waiting', resolved: (t) => t.status === 'resolved', all: () => true };
const PR = { urgent: 0, high: 1, normal: 2, low: 3 };

function listView(ctx) {
  const all = tickets();
  const rows = all.filter(TABS[ui.tab]).sort((a, b) => (a.status === 'resolved' ? b.createdAt.localeCompare(a.createdAt) : PR[a.priority] - PR[b.priority] || a.createdAt.localeCompare(b.createdAt)));
  const done = all.filter((t) => t.status === 'resolved');
  const fr = done.filter((t) => t.firstReplyH).map((t) => t.firstReplyH);
  const fb = feedback();
  const cols = [
    { key: 'subj', label: 'Ticket', render: (t) => html`<span class="sp-cell"><span class="sp-ch">${icon(CHANNELS[t.channel][1])}</span><span><strong>${t.subject}</strong><span class="apwa-cell-sub">${who(t)} · ${CHANNELS[t.channel][0]}</span></span></span>` },
    { key: 'prio', label: 'Priority', render: prioBadge },
    { key: 'owner', label: 'Owner', hideOn: 'tablet', render: (t) => (t.ownerId ? html`<span class="sp-owner">${avatar(store.user(t.ownerId).name, { size: 'xs' })}${store.user(t.ownerId).name.split(' ')[0]}</span>` : html`<span class="sp-un">Unassigned</span>`) },
    { key: 'age', label: 'Opened', render: (t) => html`${ago(t.createdAt)}<div>${slaBadge(t)}</div>` },
    { key: 'st', label: 'Status', render: statusBadge },
  ];
  return {
    title: 'Tickets',
    subtitle: 'Calls, emails and web requests in one queue, with an owner and a status for each.',
    actions: [{ label: 'New ticket', icon: 'plus', kind: 'primary', primary: true, onClick: newTicket }],
    body: html`
      <div class="apwa-stats sp-stats">
        ${stat({ label: 'Open tickets', value: all.filter((t) => t.status === 'open').length, sub: `${plural(all.filter(late).length, 'reply', 'replies')} overdue`, icon: 'inbox', tone: 'pink' })}
        ${stat({ label: 'First reply', value: fr.length ? `${(fr.reduce((a, b) => a + b, 0) / fr.length).toFixed(1)}h` : '—', sub: `Goal: under ${SLA_HOURS} hours`, icon: 'clock', tone: 'blue' })}
        ${stat({ label: 'Resolved this week', value: done.filter((t) => Date.now() - new Date(t.resolvedAt).getTime() < 7 * 24 * HOUR).length, sub: plural(done.length, 'resolved ticket'), icon: 'check-circle', tone: 'green' })}
        ${stat({ label: 'Customer rating', value: `${(fb.reduce((a, f) => a + f.score, 0) / Math.max(1, fb.length)).toFixed(1)} / 5`, sub: plural(fb.length, 'rating'), icon: 'star', tone: 'amber' })}
      </div>
      <div class="sp-toolbar">${segmented('stab', [
        { value: 'open', label: 'Open', count: all.filter(TABS.open).length },
        { value: 'waiting', label: 'Waiting', count: all.filter(TABS.waiting).length },
        { value: 'resolved', label: 'Resolved', count: all.filter(TABS.resolved).length },
        { value: 'all', label: 'All', count: all.length },
      ], ui.tab, { label: 'Ticket status' })}</div>
      ${card({ flush: true, body: dataTable(cols, rows, {
        rowLink: (t) => href(`customer-support/ticket/${t.id}`),
        mobile: (t) => html`<span class="sp-mrow"><span class="sp-ch">${icon(CHANNELS[t.channel][1])}</span><span class="sp-mrow__main"><strong>${t.subject}</strong><span>${who(t)} · ${ago(t.createdAt)}</span><span class="sp-mrow__b">${prioBadge(t)}${slaBadge(t)}</span></span>${statusBadge(t)}</span>`,
        empty: emptyState({ icon: 'check-circle', title: ui.tab === 'open' ? 'Inbox zero' : 'Nothing here', text: ui.tab === 'open' ? 'Every ticket has an answer.' : '' }),
      }) })}`,
    mount(root) {
      root.addEventListener('click', (e) => { const tr = e.target.closest('tr[data-href]'); if (tr) router.go(tr.dataset.href.replace(router.href(''), '')); });
      root.addEventListener('keydown', (e) => { const tr = e.target.closest('tr[data-href]'); if (tr && e.key === 'Enter') router.go(tr.dataset.href.replace(router.href(''), '')); });
      bindSegmented(root, { stab: (v) => { ui.tab = v; ctx.rerender(); } });
    },
  };
}

/* ------------------------------------------------------------------ */
/* Ticket page                                                          */
/* ------------------------------------------------------------------ */

const draft = { id: null, mode: 'reply', text: '' };

function ticketView(ctx) {
  const t = tickets().find((x) => x.id === ctx.params.id);
  if (!t) return { title: 'Ticket not found', back: href('customer-support/tickets'), body: emptyState({ icon: 'inbox', title: 'This ticket is gone', text: 'The demo may have been reset.', action: button('Back to tickets', { kind: 'primary', href: href('customer-support/tickets') }) }) };
  if (draft.id !== t.id) Object.assign(draft, { id: t.id, mode: 'reply', text: '' });
  const c = store.contact(t.contactId);
  const others = tickets().filter((x) => x.contactId === t.contactId && x.id !== t.id);
  const sel = (name, value, opts) => html`<div class="apwa-select"><select name="${name}" data-meta>${opts.map(([v, l]) => html`<option value="${v}" ${v === (value || '') ? raw('selected') : ''}>${l}</option>`)}</select>${icon('chevron-down')}</div>`;
  return {
    title: t.subject,
    crumb: { label: 'Tickets', href: href('customer-support/tickets') },
    back: href('customer-support/tickets'),
    subtitle: html`${statusBadge(t)} ${prioBadge(t)} ${slaBadge(t)} <span class="sp-sub">${who(t)} · ${CHANNELS[t.channel][0]} · opened ${ago(t.createdAt)}</span>`,
    actions: t.status === 'resolved' ? [{ label: 'Reopen', icon: 'refresh', onClick: () => setStatus(t, 'open') }] : [{ label: 'Resolve', icon: 'check', kind: 'primary', primary: true, onClick: () => setStatus(t, 'resolved') }],
    body: html`<div class="sp-split">
      <div class="sp-main">
        ${card({ flush: true, body: html`<ol class="sp-thread">${t.messages.map((m) => html`<li class="sp-msg sp-msg--${m.from}">
          <span class="sp-msg__who">${m.from === 'customer' ? avatar(who(t), { size: 'sm' }) : avatar((store.user(m.by) || {}).name || 'Team', { size: 'sm' })}</span>
          <div class="sp-msg__bubble"><div class="sp-msg__meta"><strong>${m.from === 'customer' ? who(t) : (store.user(m.by) || {}).name || 'Team'}</strong>${m.from === 'note' ? badge('Internal note', 'amber') : ''}${m.simulated ? badge('Simulated', 'gray') : ''}<span>${ago(m.at)}</span></div><p>${m.text}</p></div>
        </li>`)}</ol>` })}
        ${card({ body: html`<form class="sp-compose sp-compose--${draft.mode}" data-compose>
          <div class="sp-compose__top">${segmented('cmode', [{ value: 'reply', label: 'Reply to customer', icon: 'send' }, { value: 'note', label: 'Internal note', icon: 'lock' }], draft.mode, { label: 'Message type' })}
            <button type="button" class="apwa-btn apwa-btn--ghost apwa-btn--sm" data-saved>${icon('list')}<span>Saved replies</span></button></div>
          <textarea name="text" rows="4" placeholder="${draft.mode === 'note' ? 'Only your team sees this' : `Write to ${c ? c.firstName : 'the customer'}`}" aria-label="Message">${draft.text}</textarea>
          <div class="sp-compose__foot"><span class="apwa-text-3">${draft.mode === 'note' ? 'Notes never go to the customer.' : `Goes to ${c && c.email ? c.email : 'the customer'} (simulated)`}</span>
            ${button(draft.mode === 'note' ? 'Add note' : 'Send reply', { kind: 'primary', type: 'submit', icon: draft.mode === 'note' ? 'note' : 'send' })}</div>
        </form>` })}
      </div>
      <div class="sp-side">
        ${card({ title: 'Details', body: html`<div class="sp-meta">
          <label><span>Status</span>${sel('status', t.status, Object.entries(STATUS).map(([v, [l]]) => [v, l]))}</label>
          <label><span>Priority</span>${sel('priority', t.priority, Object.entries(PRIORITY).map(([v, [l]]) => [v, l]))}</label>
          <label><span>Owner</span>${sel('ownerId', t.ownerId, [['', 'Unassigned'], ...store.all('users').map((u) => [u.id, u.name])])}</label>
        </div>` })}
        ${c ? card({ title: 'Customer', body: html`<div class="sp-cust">${avatar(store.contactName(c), { size: 'md' })}<span><a href="${href(`crm/contacts/${c.id}`)}"><strong>${store.contactName(c)}</strong></a><small>${c.company || c.city || ''}</small></span></div>
          <ul class="sp-cust__list"><li>${icon('mail')}${c.email || '—'}</li><li>${icon('phone')}${c.phone || '—'}</li></ul>
          ${others.length ? html`<p class="sp-cust__more">${plural(others.length, 'other ticket')}: ${others.slice(0, 3).map((o, i) => html`${i ? ', ' : ''}<a href="${href(`customer-support/ticket/${o.id}`)}">${o.subject}</a>`)}</p>` : ''}
          <div class="sp-cust__btns">${button('Book a visit', { size: 'sm', icon: 'calendar', href: href('booking-manager/calendar') })}${button('Open in CRM', { size: 'sm', icon: 'user', href: href(`crm/contacts/${c.id}`) })}</div>` }) : ''}
      </div>
    </div>`,
    mount(root) {
      const form = $('[data-compose]', root);
      const ta = form.elements.text;
      ta.addEventListener('input', () => { draft.text = ta.value; });
      bindSegmented(root, { cmode: (v) => { draft.mode = v; draft.text = ta.value; ctx.rerender(); } });
      $('[data-saved]', root).addEventListener('click', (e) => {
        menu(e.currentTarget, SAVED.map(([l, text]) => ({ label: l, icon: 'note', onClick: () => { ta.value = fillName(text, c); draft.text = ta.value; ta.focus(); } })));
      });
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = ta.value.trim();
        if (!text) { toast('Write something first.', { tone: 'danger', title: 'Empty message' }); return; }
        const note = draft.mode === 'note';
        const cur = store.find('tickets', t.id);
        const first = !note && !replied(cur);
        store.patch('tickets', t.id, {
          messages: [...cur.messages, { from: note ? 'note' : 'agent', text, at: new Date().toISOString(), by: store.currentUser().id, simulated: !note }],
          status: note ? cur.status : 'waiting',
          ownerId: cur.ownerId || store.currentUser().id,
          firstReplyH: first ? Math.round(ageH(cur) * 10) / 10 : cur.firstReplyH,
        });
        draft.text = '';
        if (note) toast('Note added. Only your team can see it.', { title: 'Note saved' });
        else simulated(`Your reply would be emailed to ${c ? store.contactName(c) : 'the customer'}. The ticket now waits on them.`);
      });
      root.addEventListener('change', (e) => {
        if (!e.target.matches('[data-meta]')) return;
        const { name, value } = e.target;
        if (name === 'status') { setStatus(store.find('tickets', t.id), value); return; }
        store.patch('tickets', t.id, { [name]: value || null });
        toast(name === 'ownerId' ? (value ? `Assigned to ${store.user(value).name}.` : 'Ticket unassigned.') : `Priority set to ${PRIORITY[value][0].toLowerCase()}.`, { title: 'Ticket updated' });
      });
    },
  };
}

function fillName(text, c) { return c ? `Hi ${c.firstName}, ${text.charAt(0).toLowerCase()}${text.slice(1)}` : text; }

function setStatus(t, status) {
  store.patch('tickets', t.id, { status, resolvedAt: status === 'resolved' ? new Date().toISOString() : null });
  toast(status === 'resolved' ? `${who(t)} would get a short "How did we do?" survey (simulated).` : `Ticket marked ${STATUS[status][0].toLowerCase()}.`, { title: status === 'resolved' ? 'Ticket resolved' : 'Status changed' });
}

/* ------------------------------------------------------------------ */
/* Help center                                                          */
/* ------------------------------------------------------------------ */

const hc = { q: '' };

function editArticle(a) {
  openPanel({
    title: a ? 'Edit article' : 'New article',
    size: 'md',
    onSubmit(form) {
      if (!validate(form, { title: 'Add a question', body: 'Write the answer' })) return false;
      const v = formData(form);
      if (a) store.patch('articles', a.id, { title: v.title, body: v.body, cat: v.cat });
      else store.insert('articles', { title: v.title, body: v.body, cat: v.cat || 'General', views: 0, helpful: 0 });
      toast(a ? 'Article updated in the help center.' : 'Article published to the help center.', { title: 'Saved' });
      return true;
    },
    body: formGrid([
      { label: 'Question', name: 'title', value: a ? a.title : '', required: true, span: 2 },
      { label: 'Topic', name: 'cat', value: a ? a.cat : '', placeholder: 'e.g. Billing', span: 2 },
      { label: 'Answer', name: 'body', type: 'textarea', rows: 5, value: a ? a.body : '', required: true, span: 2 },
    ]),
    buttons: [{ label: 'Cancel' }, { label: a ? 'Save' : 'Publish', kind: 'primary', type: 'submit' }],
  });
}

function helpView(ctx) {
  const list = articles().filter((a) => !hc.q || `${a.title} ${a.body}`.toLowerCase().includes(hc.q.toLowerCase())).sort((a, b) => b.views - a.views);
  const biz = store.get().business.name;
  const cs = store.all('contacts');
  return {
    title: 'Help center',
    subtitle: 'Answers customers find on their own, and the request form on your website.',
    actions: [{ label: 'New article', icon: 'plus', kind: 'primary', primary: true, onClick: () => editArticle(null) }],
    body: html`<div class="sp-help">
      <div class="sp-col">
        <div class="sp-hc">
          <div class="sp-hc__head"><strong>${biz} help center</strong><span>Public page on your website</span>
            <label class="sp-hc__search">${icon('search')}<input type="search" placeholder="Search answers" value="${hc.q}" data-q aria-label="Search answers"></label></div>
          <ul class="sp-kb">${list.map((a) => html`<li><details><summary><span><strong>${a.title}</strong><small>${a.cat} · ${plural(a.views, 'view')}${a.helpful ? ` · ${Math.round(a.helpful * 100)}% found it helpful` : ''}</small></span>${icon('chevron-down')}</summary><p>${a.body}</p><div class="sp-kb__btns"><span>Was this helpful?</span><button type="button" class="apwa-btn apwa-btn--secondary apwa-btn--sm" data-help="${a.id}">Yes</button><button type="button" class="apwa-btn apwa-btn--ghost apwa-btn--sm" data-edit="${a.id}">${icon('edit')}<span>Edit</span></button></div></details></li>`)}</ul>
          ${list.length ? '' : html`<p class="sp-kb__none">No answers match. The request form below catches the rest.</p>`}
        </div>
      </div>
      <div class="sp-col">
        ${card({ title: 'Service request form', body: html`<p class="apwa-text-3 sp-formnote">This form sits on your website. Try it: your request lands in Tickets.</p>
          <form class="sp-req" data-req>
            ${formGrid([
              { label: 'Your name', name: 'contactId', type: 'select', required: true, placeholder: 'Pick a sample customer', options: cs.slice(0, 12).map((c) => ({ value: c.id, label: store.contactName(c) })), span: 2 },
              { label: 'What do you need help with?', name: 'subject', required: true, placeholder: 'e.g. Dripping faucet', span: 2 },
              { label: 'Details', name: 'text', type: 'textarea', rows: 3, span: 2 },
            ])}
            ${button('Send request', { kind: 'primary', type: 'submit', icon: 'send' })}
          </form>` })}
      </div>
    </div>`,
    mount(root) {
      const q = $('[data-q]', root);
      q.addEventListener('input', () => { hc.q = q.value; ctx.rerender(); setTimeout(() => { const i = $('[data-q]'); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }, 0); });
      root.addEventListener('click', (e) => {
        const h = e.target.closest('[data-help]');
        if (h) { const a = store.find('articles', h.dataset.help); store.patch('articles', a.id, { views: a.views + 1, helpful: Math.min(1, (a.helpful * a.views + 1) / (a.views + 1)) }); toast('Thanks! That vote counts toward the article’s score.', { title: 'Feedback saved' }); }
        const ed = e.target.closest('[data-edit]');
        if (ed) editArticle(store.find('articles', ed.dataset.edit));
      });
      $('[data-req]', root).addEventListener('submit', (e) => {
        e.preventDefault();
        if (!validate(e.target, { contactId: 'Pick a name', subject: 'Say what you need' })) return;
        const v = formData(e.target);
        const row = store.insert('tickets', { contactId: v.contactId, subject: v.subject, channel: 'web', priority: 'normal', status: 'open', ownerId: null, messages: [{ from: 'customer', text: v.text || v.subject, at: new Date().toISOString() }] });
        toast(html`Request received. <a href="${href(`customer-support/ticket/${row.id}`)}">Open the new ticket</a>`, { title: 'Ticket created' });
      });
    },
  };
}

/* ------------------------------------------------------------------ */
/* Feedback                                                             */
/* ------------------------------------------------------------------ */

function feedbackView() {
  const fb = feedback().slice().sort((a, b) => b.at.localeCompare(a.at));
  const avg = fb.reduce((a, f) => a + f.score, 0) / Math.max(1, fb.length);
  const happy = fb.filter((f) => f.score >= 4).length;
  const stars = (n) => html`<span class="sp-stars" aria-label="${n} out of 5">${[1, 2, 3, 4, 5].map((i) => html`<i class="${i <= n ? 'on' : ''}">${icon('star')}</i>`)}</span>`;
  return {
    title: 'Customer feedback',
    subtitle: 'Each resolved ticket and finished job asks one question: how did we do?',
    body: html`<div class="apwa-grid apwa-grid--2 sp-grid">
      <div class="sp-col">
        ${card({ title: 'Overall', body: html`<div class="sp-score"><b>${avg.toFixed(1)}</b>${stars(Math.floor(avg))}<span>${Math.round((happy / Math.max(1, fb.length)) * 100)}% gave 4 or 5 stars</span></div>
          ${barList([5, 4, 3, 2, 1].map((s) => ({ label: s === 1 ? '1 star' : `${s} stars`, value: fb.filter((f) => f.score === s).length, tone: s >= 4 ? 'green' : s === 3 ? 'amber' : 'pink' })), { format: (v) => String(v) })}` })}
      </div>
      ${card({ title: 'Recent comments', flush: true, body: html`<ul class="sp-fb">${fb.map((f) => { const c = store.contact(f.contactId); return html`<li>${stars(f.score)}<p>${f.text || html`<span class="apwa-text-3">No comment</span>`}</p><small>${c ? store.contactName(c) : 'Customer'} · ${ago(f.at)}</small>${f.score <= 3 ? html`<button type="button" class="apwa-btn apwa-btn--secondary apwa-btn--sm" data-follow="${f.id}">${icon('phone')}<span>Follow up</span></button>` : ''}</li>`; })}</ul>` })}
    </div>`,
    mount(root) {
      root.addEventListener('click', (e) => {
        const b = e.target.closest('[data-follow]');
        if (!b) return;
        const f = store.find('feedback', b.dataset.follow);
        const row = store.insert('tickets', { contactId: f.contactId, subject: `Follow up on a ${f.score}-star rating`, channel: 'web', priority: 'high', status: 'open', ownerId: store.currentUser().id, messages: [{ from: 'customer', text: f.text || `Left a ${f.score}-star rating.`, at: f.at }] });
        router.go(`customer-support/ticket/${row.id}`);
        toast('A ticket was opened so someone calls them back.', { title: 'Follow-up started' });
      });
    },
  };
}

/* ------------------------------------------------------------------ */
/* Module                                                               */
/* ------------------------------------------------------------------ */

function search(q) {
  const s = q.toLowerCase();
  return tickets().filter((t) => `${t.subject} ${who(t)}`.toLowerCase().includes(s)).slice(0, 5)
    .map((t) => ({ label: t.subject, sub: `Ticket · ${who(t)} · ${STATUS[t.status][0]}`, href: href(`customer-support/ticket/${t.id}`), icon: 'inbox', type: 'Ticket' }));
}

export default {
  slug: 'customer-support',
  nav: [
    { id: 'sp-tickets', path: 'customer-support/tickets', label: 'Tickets', icon: 'inbox' },
    { id: 'sp-help', path: 'customer-support/help', label: 'Help center', icon: 'info' },
    { id: 'sp-fb', path: 'customer-support/feedback', label: 'Feedback', icon: 'star' },
  ],
  routes: [
    { pattern: 'customer-support', redirect: 'customer-support/tickets' },
    { pattern: 'customer-support/tickets', view: listView, nav: 'sp-tickets' },
    { pattern: 'customer-support/ticket/:id', view: ticketView, nav: 'sp-tickets' },
    { pattern: 'customer-support/help', view: helpView, nav: 'sp-help' },
    { pattern: 'customer-support/feedback', view: feedbackView, nav: 'sp-fb' },
  ],
  quickActions: [{ label: 'New ticket', icon: 'inbox', run: () => newTicket() }],
  search,
};
