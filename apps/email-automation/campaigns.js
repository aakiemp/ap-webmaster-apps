/**
 * Email Campaigns demo.
 * Screens: Campaigns (list and a page per campaign: editor with live preview
 * for drafts, results for sent ones), Automations (follow-up sequences) and
 * Audiences (segments built from CRM contacts). Sending is simulated: no
 * email ever leaves the browser.
 */
import { html, raw, icon, $, $$, plural, date, ago } from '../../assets/js/core/dom.js';
import * as store from '../../assets/js/core/store.js';
import * as ind from '../../assets/js/core/industry.js';
import * as router from '../../assets/js/core/router.js';
import { openPanel, toast, simulated, confirmDialog, formData, validate } from '../../assets/js/core/ui.js';
import { badge, button, card, stat, emptyState, segmented, bindSegmented, formGrid, dataTable, barList, columnChart, meter } from '../../assets/js/core/components.js';

const DAY = 86400000;
const href = (p) => router.href(p);
const pct = (n, d) => (d ? Math.round((n / d) * 100) : 0);

/* ------------------------------------------------------------------ */
/* Audiences                                                            */
/* ------------------------------------------------------------------ */

const STATUSES = [['customer', 'Customers'], ['lead', 'Leads'], ['prospect', 'Prospects'], ['inactive', 'Inactive']];

function members(seg) {
  if (!seg) return [];
  const r = seg.rules || {};
  const unsub = new Set(cfg().unsubscribed);
  return store.all('contacts').filter((c) => c.email && !unsub.has(c.id)
    && (!r.status || !r.status.length || r.status.includes(c.status))
    && (!r.tag || (c.tags || []).includes(r.tag))
    && (!r.city || c.city === r.city));
}

function ruleText(seg) {
  const r = seg.rules || {};
  const parts = [];
  parts.push(r.status && r.status.length ? r.status.map((s) => (STATUSES.find((x) => x[0] === s) || [s, s])[1]).join(' or ') : 'Everyone');
  if (r.tag) parts.push(`tagged ${r.tag}`);
  if (r.city) parts.push(`in ${r.city}`);
  return parts.join(', ');
}

/* ------------------------------------------------------------------ */
/* Templates and seed                                                   */
/* ------------------------------------------------------------------ */

const TEMPLATES_HOME = {
  seasonal: { label: 'Seasonal offer', icon: 'tag', subject: 'Get your home ready for winter', preview: 'Book a furnace tune-up this month and save 15%.', heading: 'Winter is coming, {first_name}', body: 'Cold nights are around the corner. Book a furnace tune-up before December 15 and take 15% off. It takes about an hour and keeps surprise breakdowns away.', cta: 'Book a tune-up' },
  review: { label: 'Review request', icon: 'star', subject: 'How did we do?', preview: 'A quick review helps neighbors find us.', heading: 'Thanks for choosing us, {first_name}', body: 'If we did a good job, would you leave a short review? It takes a minute and helps other families in town find a team they can trust.', cta: 'Leave a review' },
  newsletter: { label: 'Monthly newsletter', icon: 'mail', subject: 'Your home checklist for November', preview: 'Three quick jobs that save money this season.', heading: 'November home checklist', body: 'Swap your furnace filter, clean the gutters before the first freeze and test your smoke detectors. Want us to handle any of it? Reply to this email or book online.', cta: 'See this month’s tips' },
  winback: { label: 'We miss you', icon: 'repeat', subject: 'It has been a while, {first_name}', preview: 'Here is $25 off your next visit.', heading: 'We’d love to see you again', body: 'It has been a while since your last visit. Here is $25 off your next service as a thank you for being a customer. The offer is good through the end of the month.', cta: 'Claim $25 off' },
};

const tpl = () => Object.fromEntries(Object.entries(TEMPLATES_HOME).map(([k, v]) => [k, { ...v, ...((ind.pack().templates || {})[k] || {}) }]));

function seed() {
  const TEMPLATES = tpl();
  const now = Date.now();
  const iso = (d) => new Date(now - d * DAY).toISOString();
  const segments = [
    { id: 'seg1', name: 'All customers', rules: { status: ['customer'] }, builtIn: true },
    { id: 'seg2', name: 'Leads and prospects', rules: { status: ['lead', 'prospect'] }, builtIn: true },
    { id: 'seg3', name: 'Commercial accounts', rules: { tag: 'Commercial' } },
    { id: 'seg4', name: 'Repeat customers', rules: { status: ['customer'], tag: 'Repeat' } },
    { id: 'seg5', name: 'Everyone', rules: {}, builtIn: true },
  ];
  const sent = (id, t, seg, days, n, o, c, b) => ({ id, ...copy(TEMPLATES[t]), template: t, name: `${TEMPLATES[t].label}: ${new Date(now - days * DAY).toLocaleString('en-US', { month: 'long' })}`, segmentId: seg, status: 'sent', createdAt: iso(days + 2), sentAt: iso(days), stats: { recipients: n, opened: o, clicked: c, unsub: Math.round(n * 0.006), booked: b, curve: curve(o) } });
  const campaigns = [
    { id: 'cmp1', ...copy(TEMPLATES.seasonal), template: 'seasonal', name: ind.pack().offerName || 'Winter tune-up offer', segmentId: 'seg1', status: 'draft', createdAt: iso(0.2) },
    { id: 'cmp2', ...copy(TEMPLATES.newsletter), template: 'newsletter', name: 'November newsletter', segmentId: 'seg5', status: 'scheduled', scheduledFor: new Date(now + 2 * DAY).toISOString(), createdAt: iso(1) },
    sent('cmp3', 'review', 'seg4', 6, 14, 9, 5, 0),
    sent('cmp4', 'winback', 'seg1', 19, 26, 12, 6, 3),
    sent('cmp5', 'newsletter', 'seg5', 34, 48, 21, 7, 2),
    sent('cmp6', 'seasonal', 'seg1', 61, 25, 13, 6, 4),
  ];
  const sequences = [
    { id: 'seq1', name: 'Welcome new leads', trigger: 'A new lead is added in Customer Manager', on: true, enrolled: 7, done: 18, steps: [{ wait: 0, subject: 'Thanks for reaching out, {first_name}' }, { wait: 2, subject: 'What our customers say about us' }, { wait: 5, subject: ind.at('seqSubjects', 0, 'Ready when you are: book a free estimate') }] },
    { id: 'seq2', name: 'After every job', trigger: 'A booking is marked completed', on: true, enrolled: 4, done: 41, steps: [{ wait: 1, subject: 'How did we do?' }, { wait: 7, subject: ind.at('seqSubjects', 1, 'A quick tip to keep things running') }] },
    { id: 'seq3', name: 'Paid invoice thank-you', trigger: 'An invoice is paid in full', on: true, enrolled: 2, done: 29, steps: [{ wait: 0, subject: 'Thank you for your payment' }] },
    { id: 'seq4', name: 'Win back quiet customers', trigger: 'No booking in 6 months', on: false, enrolled: 0, done: 9, steps: [{ wait: 0, subject: 'It has been a while, {first_name}' }, { wait: 10, subject: 'Your $25 credit ends soon' }] },
  ];
  return { campaigns, sequences, segments, emailSettings: { fromName: store.get().business.name, replyTo: `hello@${ind.slug()}.example`, unsubscribed: ['c9', 'c23'] } };
}

function copy(t) { return { subject: t.subject, preview: t.preview, heading: t.heading, body: t.body, cta: t.cta }; }
function curve(opened) { const cum = [0.42, 0.62, 0.74, 0.83, 0.9, 0.95, 1]; let prev = 0; return cum.map((c) => { const t = Math.round(opened * c); const v = t - prev; prev = t; return v; }); }

const ready = () => store.ensure('campaigns', seed);
const cfg = () => { ready(); return store.get().emailSettings; };
const campaigns = () => { ready(); return store.all('campaigns'); };
const sequences = () => { ready(); return store.all('sequences'); };
const segments = () => { ready(); return store.all('segments'); };
const segment = (id) => segments().find((s) => s.id === id) || null;

const STATUS = { draft: ['Draft', 'gray'], scheduled: ['Scheduled', 'blue'], sending: ['Sending…', 'amber'], sent: ['Sent', 'green'] };
const statusBadge = (c) => badge(STATUS[c.status][0], STATUS[c.status][1], { dot: true });

/* ------------------------------------------------------------------ */
/* Email preview                                                        */
/* ------------------------------------------------------------------ */

const sampleFirst = (seg) => (members(seg)[0] || {}).firstName || 'Avery';
const fill = (s, first) => String(s || '').replace(/\{first_name\}/g, first);

function emailPreview(c, first) {
  const biz = store.get().business.name;
  return html`<div class="ec-mail">
    <div class="ec-mail__env"><span><b data-pv="fromName">${cfg().fromName}</b> &lt;${cfg().replyTo}&gt;</span><strong data-pv="subject">${fill(c.subject, first)}</strong><span data-pv="preview">${fill(c.preview, first)}</span></div>
    <div class="ec-mail__body">
      <div class="ec-mail__brand"><span>${biz.split(' ').map((w) => w[0]).join('').slice(0, 2)}</span>${biz}</div>
      <h2 data-pv="heading">${fill(c.heading, first)}</h2>
      <p data-pv="body">${fill(c.body, first)}</p>
      <span class="ec-mail__btn" data-pv="cta">${c.cta}</span>
      <p class="ec-mail__foot">${biz} · Lakewood, OH<br>You get these emails because you are a customer. <u>Unsubscribe</u></p>
    </div>
  </div>`;
}

/* ------------------------------------------------------------------ */
/* Actions                                                              */
/* ------------------------------------------------------------------ */

function newCampaign() {
  openPanel({
    title: 'New campaign',
    subtitle: 'Start from a template. You can change every word.',
    size: 'md',
    body: html`<div class="ec-tpls">${Object.entries(tpl()).map(([k, t], i) => html`<label class="ec-tpl"><input type="radio" name="tpl" value="${k}" ${i === 0 ? raw('checked') : ''}><span>${icon(t.icon)}<strong>${t.label}</strong><small>${t.preview}</small></span></label>`)}</div>`,
    buttons: [{ label: 'Cancel' }, { label: 'Create draft', kind: 'primary', onClick: (close, panel) => {
      const k = $('input[name=tpl]:checked', panel).value;
      const row = store.insert('campaigns', { ...copy(tpl()[k]), template: k, name: `${tpl()[k].label} (new)`, segmentId: k === 'review' ? 'seg4' : 'seg1', status: 'draft' });
      router.go(`email-automation/campaign/${row.id}`);
      return true;
    } }],
  });
}

function sendNow(c) {
  const n = members(segment(c.segmentId)).length;
  if (!n) { toast('This audience has nobody in it yet. Pick another one.', { tone: 'danger', title: 'No recipients' }); return; }
  confirmDialog({ title: `Send to ${plural(n, 'person', 'people')}?`, message: `"${c.subject}" goes to ${segment(c.segmentId).name}. This is a demo, so nothing is actually emailed.`, confirmLabel: 'Send campaign' }).then((ok) => {
    if (!ok) return;
    store.patch('campaigns', c.id, { status: 'sending', sentAt: new Date().toISOString(), scheduledFor: null });
    setTimeout(() => {
      const cur = store.find('campaigns', c.id);
      if (!cur || cur.status !== 'sending') return;
      const opened = Math.round(n * 0.46);
      store.patch('campaigns', c.id, { status: 'sent', stats: { recipients: n, opened, clicked: Math.round(n * 0.17), unsub: n > 30 ? 1 : 0, booked: Math.max(1, Math.round(n * 0.06)), curve: curve(opened) } });
      toast(`Showing sample results for ${plural(n, 'recipient')}. No email was actually sent.`, { tone: 'info', title: 'Simulated in demo mode' });
    }, 1800);
  });
}

function schedule(c) {
  const d = new Date(Date.now() + 2 * DAY);
  const day = d.toISOString().slice(0, 10);
  openPanel({
    title: 'Schedule campaign',
    size: 'sm',
    onSubmit(form) {
      if (!validate(form, { day: 'Pick a day' })) return false;
      const v = formData(form);
      const when = new Date(`${v.day}T${v.time || '09:00'}`);
      if (when.getTime() < Date.now()) { toast('Pick a time in the future.', { tone: 'danger', title: 'That time has passed' }); return false; }
      store.patch('campaigns', c.id, { status: 'scheduled', scheduledFor: when.toISOString() });
      toast(`Set to go out ${date(when.toISOString(), true)}. In this demo it stays scheduled and never sends.`, { title: 'Campaign scheduled' });
      return true;
    },
    body: formGrid([{ label: 'Day', name: 'day', type: 'date', value: day, required: true }, { label: 'Time', name: 'time', type: 'time', value: '09:00' }]),
    buttons: [{ label: 'Cancel' }, { label: 'Schedule', kind: 'primary', type: 'submit' }],
  });
}

/* ------------------------------------------------------------------ */
/* Campaign list                                                        */
/* ------------------------------------------------------------------ */

const ui = { tab: 'all' };
const TABS = { all: () => true, draft: (c) => c.status === 'draft' || c.status === 'scheduled', sent: (c) => c.status === 'sent' || c.status === 'sending' };

function rate(c, k) { return c.stats ? `${pct(c.stats[k], c.stats.recipients)}%` : '—'; }
function when(c) {
  if (c.status === 'scheduled') return html`Goes out ${date(c.scheduledFor, true)}`;
  if (c.status === 'draft') return html`Edited ${ago(c.updatedAt || c.createdAt)}`;
  return html`Sent ${date(c.sentAt)}`;
}

function listView(ctx) {
  const all = campaigns().slice().sort((a, b) => ((b.sentAt || b.createdAt) > (a.sentAt || a.createdAt) ? 1 : -1));
  const sent = all.filter((c) => c.status === 'sent');
  const sum = (k) => sent.reduce((t, c) => t + c.stats[k], 0);
  const rows = all.filter(TABS[ui.tab]);
  const cols = [
    { key: 'name', label: 'Campaign', render: (c) => html`<strong>${c.name}</strong><div class="apwa-cell-sub">${c.subject.replace(/\{first_name\}/g, 'Avery')}</div>` },
    { key: 'aud', label: 'Audience', hideOn: 'tablet', render: (c) => html`${(segment(c.segmentId) || {}).name || '—'}<div class="apwa-cell-sub">${c.stats ? plural(c.stats.recipients, 'recipient') : plural(members(segment(c.segmentId)).length, 'person', 'people')}</div>` },
    { key: 'when', label: 'When', render: when },
    { key: 'open', label: 'Opened', align: 'right', render: (c) => rate(c, 'opened') },
    { key: 'click', label: 'Clicked', align: 'right', hideOn: 'tablet', render: (c) => rate(c, 'clicked') },
    { key: 'st', label: 'Status', render: statusBadge },
  ];
  return {
    title: 'Campaigns',
    subtitle: 'Emails to the customers already in Customer Manager. Write once, send to the right people.',
    actions: [{ label: 'New campaign', icon: 'plus', kind: 'primary', primary: true, onClick: newCampaign }],
    body: html`
      <div class="apwa-stats ec-stats">
        ${stat({ label: 'Emails sent', value: sum('recipients'), sub: 'Last 90 days', icon: 'send', tone: 'pink' })}
        ${stat({ label: 'Open rate', value: `${pct(sum('opened'), sum('recipients'))}%`, sub: 'Typical for local services: 35 to 45%', icon: 'mail', tone: 'blue' })}
        ${stat({ label: 'Click rate', value: `${pct(sum('clicked'), sum('recipients'))}%`, sub: plural(sum('clicked'), 'click'), icon: 'zap', tone: 'purple' })}
        ${stat({ label: 'Bookings from email', value: sum('booked'), sub: 'Booked within 7 days of a click', icon: 'calendar-check', tone: 'green' })}
      </div>
      <div class="ec-toolbar">${segmented('etab', [
        { value: 'all', label: 'All', count: all.length },
        { value: 'draft', label: 'Drafts and scheduled', count: all.filter(TABS.draft).length },
        { value: 'sent', label: 'Sent', count: all.filter(TABS.sent).length },
      ], ui.tab, { label: 'Campaign status' })}</div>
      ${card({ flush: true, body: dataTable(cols, rows, {
        rowLink: (c) => href(`email-automation/campaign/${c.id}`),
        mobile: (c) => html`<span class="ec-mrow"><span class="ec-mrow__main"><strong>${c.name}</strong><span>${when(c)}${c.stats ? ` · ${rate(c, 'opened')} opened` : ''}</span></span>${statusBadge(c)}</span>`,
        empty: emptyState({ icon: 'megaphone', title: 'No campaigns here', action: button('New campaign', { kind: 'primary', icon: 'plus', attrs: { 'data-new': '1' } }) }),
      }) })}`,
    mount(root) {
      root.addEventListener('click', (e) => {
        if (e.target.closest('[data-new]')) { newCampaign(); return; }
        const tr = e.target.closest('tr[data-href]');
        if (tr) router.go(tr.dataset.href.replace(router.href(''), ''));
      });
      root.addEventListener('keydown', (e) => { const tr = e.target.closest('tr[data-href]'); if (tr && e.key === 'Enter') router.go(tr.dataset.href.replace(router.href(''), '')); });
      bindSegmented(root, { etab: (v) => { ui.tab = v; ctx.rerender(); } });
    },
  };
}

/* ------------------------------------------------------------------ */
/* Campaign page                                                        */
/* ------------------------------------------------------------------ */

function editor(c) {
  const segOpts = segments().map((s) => ({ value: s.id, label: `${s.name} (${members(s).length})` }));
  return html`<form class="ec-form" data-ed>
    ${formGrid([
      { label: 'Campaign name', name: 'name', value: c.name, span: 2, hint: 'Only you see this.' },
      { label: 'Send to', name: 'segmentId', type: 'select', value: c.segmentId, options: segOpts, span: 2 },
      { label: 'Subject line', name: 'subject', value: c.subject, span: 2, hint: 'Type {first_name} to use each person’s first name.' },
      { label: 'Preview text', name: 'preview', value: c.preview, span: 2 },
      { label: 'Heading', name: 'heading', value: c.heading, span: 2 },
      { label: 'Message', name: 'body', type: 'textarea', rows: 5, value: c.body, span: 2 },
      { label: 'Button', name: 'cta', value: c.cta, span: 2 },
    ])}
  </form>`;
}

function results(c) {
  const s = c.stats;
  const labels = ['1h', '6h', '12h', '1d', '2d', '4d', '7d'];
  return html`<div class="apwa-stats ec-stats">
      ${stat({ label: 'Delivered', value: s.recipients, sub: (segment(c.segmentId) || {}).name || '', icon: 'send', tone: 'pink' })}
      ${stat({ label: 'Opened', value: `${pct(s.opened, s.recipients)}%`, sub: plural(s.opened, 'person', 'people'), icon: 'mail', tone: 'blue' })}
      ${stat({ label: 'Clicked', value: `${pct(s.clicked, s.recipients)}%`, sub: plural(s.clicked, 'person', 'people'), icon: 'zap', tone: 'purple' })}
      ${stat({ label: 'Booked a job', value: s.booked, sub: `${plural(s.unsub, 'unsubscribe')}`, icon: 'calendar-check', tone: 'green' })}
    </div>
    ${card({ title: 'When people opened it', body: columnChart(s.curve.map((v, i) => ({ label: labels[i], value: v, highlight: i === 0 })), { format: (v) => String(v), label: 'Opens over the first week' }) })}
    ${card({ title: 'Funnel', body: html`<div class="ec-funnel">${[['Delivered', s.recipients, 'pink'], ['Opened', s.opened, 'blue'], ['Clicked', s.clicked, 'purple'], ['Booked', s.booked, 'green']].map(([l, v, t]) => html`<div><span>${l}</span>${meter(v / s.recipients, t)}<b>${v}</b></div>`)}</div>` })}`;
}

function campaignView(ctx) {
  const c = campaigns().find((x) => x.id === ctx.params.id);
  if (!c) return { title: 'Campaign not found', back: href('email-automation/campaigns'), body: emptyState({ icon: 'megaphone', title: 'This campaign is gone', text: 'It may have been deleted or the demo was reset.', action: button('Back to campaigns', { kind: 'primary', href: href('email-automation/campaigns') }) }) };
  const seg = segment(c.segmentId);
  const first = sampleFirst(seg);
  const editable = c.status === 'draft' || c.status === 'scheduled';
  const actions = editable ? [
    { label: 'Send test', icon: 'mail', onClick: () => simulated(`A test of "${fill(c.subject, first)}" would go to ${cfg().replyTo}.`) },
    { label: c.status === 'scheduled' ? 'Reschedule' : 'Schedule', icon: 'clock', onClick: () => schedule(store.find('campaigns', c.id)) },
    { label: 'Send now', icon: 'send', kind: 'primary', primary: true, onClick: () => sendNow(store.find('campaigns', c.id)) },
  ] : [{ label: 'Duplicate', icon: 'repeat', onClick: () => { const row = store.insert('campaigns', { ...copy(c), template: c.template, name: `${c.name} (copy)`, segmentId: c.segmentId, status: 'draft' }); router.go(`email-automation/campaign/${row.id}`); toast('A new draft was made from this campaign.', { title: 'Duplicated' }); } }];
  return {
    title: c.name,
    crumb: { label: 'Campaigns', href: href('email-automation/campaigns') },
    back: href('email-automation/campaigns'),
    subtitle: html`${statusBadge(c)} <span class="ec-sub">${when(c)} · ${seg ? `${seg.name}, ${plural(c.stats ? c.stats.recipients : members(seg).length, 'person', 'people')}` : 'No audience'}</span>`,
    actions,
    body: c.status === 'sending' ? card({ body: html`<p class="ec-sending"><span class="ec-dots"><i></i><i></i><i></i></span>Sending to ${plural(members(seg).length, 'person', 'people')}…</p>` })
      : html`<div class="ec-split ${editable ? '' : 'is-sent'}">
        <div class="ec-split__main">${editable ? card({ title: 'Email', body: editor(c) }) : results(c)}
          ${editable ? html`<div class="ec-del">${button('Delete draft', { kind: 'ghost', icon: 'trash', attrs: { 'data-del': '1' } })}</div>` : ''}</div>
        <div class="ec-split__side">
          <div class="ec-pvhead"><strong>Preview</strong>${segmented('pv', [{ value: 'desk', icon: 'grid', title: 'Desktop' }, { value: 'phone', icon: 'smartphone', title: 'Phone' }], 'desk', { label: 'Preview size' })}</div>
          <div class="ec-pv" data-pvbox>${emailPreview(c, first)}</div>
          <p class="ec-pvnote">${icon('user')}Shown as ${first} would see it.</p>
        </div>
      </div>`,
    mount(root) {
      bindSegmented(root, { pv: (v) => { const box = $('[data-pvbox]', root); box.classList.toggle('is-phone', v === 'phone'); $$('[data-seg="pv"] .apwa-seg__btn', root).forEach((b) => { const on = b.dataset.value === v; b.classList.toggle('is-active', on); b.setAttribute('aria-checked', on); }); } });
      const form = $('[data-ed]', root);
      if (form) {
        form.addEventListener('submit', (e) => e.preventDefault());
        form.addEventListener('input', (e) => {
          const { name, value } = e.target;
          if (!name || name === 'segmentId') return;
          store.quietly((s) => { const cur = s.campaigns.find((x) => x.id === c.id); if (cur) { cur[name] = value; cur.updatedAt = new Date().toISOString(); } });
          const pv = $(`[data-pv="${name}"]`, root);
          if (pv) pv.textContent = name === 'cta' ? value : fill(value, first);
        });
        form.addEventListener('change', (e) => { if (e.target.name === 'segmentId') store.patch('campaigns', c.id, { segmentId: e.target.value }); });
      }
      root.addEventListener('click', (e) => {
        if (!e.target.closest('[data-del]')) return;
        confirmDialog({ title: 'Delete this draft?', message: `"${c.name}" will be removed.`, confirmLabel: 'Delete', tone: 'danger' }).then((ok) => {
          if (!ok) return;
          store.remove('campaigns', c.id);
          toast('Draft deleted.', { title: 'Deleted' });
          router.go('email-automation/campaigns');
        });
      });
    },
  };
}

/* ------------------------------------------------------------------ */
/* Automations                                                          */
/* ------------------------------------------------------------------ */

function sw(id, on) {
  return html`<label class="ec-switch" title="${on ? 'Turn off' : 'Turn on'}"><input type="checkbox" role="switch" data-seq="${id}" ${on ? raw('checked') : ''} aria-label="Sequence on"><i aria-hidden="true"></i></label>`;
}

function editStep(seq, i) {
  const st = seq.steps[i];
  openPanel({
    title: `Email ${i + 1} of ${seq.steps.length}`,
    subtitle: seq.name,
    size: 'sm',
    onSubmit(form) {
      if (!validate(form, { subject: 'Add a subject line' })) return false;
      const v = formData(form);
      const steps = seq.steps.map((x, j) => (j === i ? { wait: Math.max(0, Number(v.wait) || 0), subject: v.subject } : x));
      store.patch('sequences', seq.id, { steps });
      toast('Step saved.', { title: 'Sequence updated' });
      return true;
    },
    body: formGrid([
      { label: i ? 'Days after the last email' : 'Days after the trigger', name: 'wait', type: 'number', value: st.wait, attrs: { min: 0, max: 60 } },
      { label: 'Subject line', name: 'subject', value: st.subject, required: true, span: 2 },
    ]),
    buttons: [{ label: 'Cancel' }, { label: 'Save step', kind: 'primary', type: 'submit' }],
  });
}

function automationsView() {
  const list = sequences();
  return {
    title: 'Automations',
    subtitle: 'Follow-up emails that send themselves when something happens in Customer Manager, bookings or invoices.',
    body: html`<div class="ec-seqs">${list.map((s) => card({ title: s.name, actions: sw(s.id, s.on), body: html`
      <p class="ec-trigger">${icon('zap')}<span>When <strong>${s.trigger.charAt(0).toLowerCase() + s.trigger.slice(1)}</strong></span></p>
      <ol class="ec-steps">${s.steps.map((st, i) => html`<li><span class="ec-steps__wait">${st.wait ? `Wait ${plural(st.wait, 'day')}` : 'Right away'}</span><button type="button" class="ec-steps__mail" data-step="${s.id}:${i}">${icon('mail')}<span>${st.subject}</span>${icon('edit')}</button></li>`)}</ol>
      <div class="ec-seqfoot"><span>${s.on ? html`<b>${s.enrolled}</b> in it now` : 'Paused'}</span><span><b>${s.done}</b> finished</span></div>` }))}</div>`,
    mount(root) {
      root.addEventListener('change', (e) => {
        const t = e.target.closest('[data-seq]');
        if (!t) return;
        const s = store.find('sequences', t.dataset.seq);
        store.patch('sequences', s.id, { on: t.checked, enrolled: t.checked ? Math.max(1, s.enrolled) : 0 });
        toast(t.checked ? `${s.name} is on. New matches get the first email ${s.steps[0].wait ? `after ${plural(s.steps[0].wait, 'day')}` : 'right away'} (simulated).` : `${s.name} is paused. Nobody new will be added.`, { title: t.checked ? 'Automation on' : 'Automation paused' });
      });
      root.addEventListener('click', (e) => {
        const b = e.target.closest('[data-step]');
        if (!b) return;
        const [id, i] = b.dataset.step.split(':');
        editStep(store.find('sequences', id), Number(i));
      });
    },
  };
}

/* ------------------------------------------------------------------ */
/* Audiences                                                            */
/* ------------------------------------------------------------------ */

function newSegment() {
  const contacts = store.all('contacts');
  const tags = [...new Set(contacts.flatMap((c) => c.tags || []))].sort();
  const cities = [...new Set(contacts.map((c) => c.city).filter(Boolean))].sort();
  openPanel({
    title: 'New audience',
    subtitle: 'Pick who should be in it. It updates itself as your contacts change.',
    size: 'md',
    onSubmit(form) {
      if (!validate(form, { name: 'Give it a name' })) return false;
      const v = formData(form);
      const status = $$('input[name=st]:checked', form).map((x) => x.value);
      store.insert('segments', { name: v.name, rules: { status, tag: v.tag || '', city: v.city || '' } });
      toast(`${v.name} saved.`, { title: 'Audience created' });
      return true;
    },
    onOpen(panel) {
      const upd = () => {
        const status = $$('input[name=st]:checked', panel).map((x) => x.value);
        const n = members({ rules: { status, tag: panel.querySelector('[name=tag]').value, city: panel.querySelector('[name=city]').value } }).length;
        $('[data-count]', panel).textContent = `${plural(n, 'person', 'people')} match right now`;
      };
      panel.addEventListener('change', upd); upd();
    },
    body: html`${formGrid([
      { label: 'Name', name: 'name', required: true, placeholder: 'e.g. Lakewood customers', span: 2 },
      { label: 'Tag', name: 'tag', type: 'select', placeholder: 'Any tag', options: tags.map((t) => ({ value: t, label: t })) },
      { label: 'City', name: 'city', type: 'select', placeholder: 'Any city', options: cities.map((t) => ({ value: t, label: t })) },
    ])}
      <fieldset class="ec-checks"><legend>Contact status</legend>${STATUSES.map(([v, l]) => html`<label><input type="checkbox" name="st" value="${v}" ${v === 'customer' ? raw('checked') : ''}>${l}</label>`)}</fieldset>
      <p class="ec-count" data-count></p>`,
    buttons: [{ label: 'Cancel' }, { label: 'Save audience', kind: 'primary', type: 'submit' }],
  });
}

function audiencesView() {
  const segs = segments();
  const unsub = cfg().unsubscribed.map((id) => store.contact(id)).filter(Boolean);
  return {
    title: 'Audiences',
    subtitle: 'Groups of contacts from Customer Manager. Contacts without an email or who unsubscribed are left out.',
    actions: [{ label: 'New audience', icon: 'plus', kind: 'primary', primary: true, onClick: newSegment }],
    body: html`<div class="apwa-grid apwa-grid--2 ec-grid">
      ${card({ title: 'Your audiences', flush: true, body: html`<ul class="ec-segs">${segs.map((s) => { const m = members(s); return html`<li><span class="ec-segs__ic">${icon('users')}</span><span class="ec-segs__main"><strong>${s.name}</strong><span>${ruleText(s)}</span><span class="ec-faces">${m.slice(0, 5).map((c) => html`<i title="${store.contactName(c)}">${c.firstName[0]}${(c.lastName || ' ')[0]}</i>`)}${m.length > 5 ? html`<i>+${m.length - 5}</i>` : ''}</span></span><b>${m.length}</b>${s.builtIn ? '' : html`<button type="button" class="apwa-iconbtn" data-rm="${s.id}" aria-label="Delete ${s.name}">${icon('trash')}</button>`}</li>`; })}</ul>` })}
      <div class="ec-col">
        ${card({ title: 'Contacts by status', body: barList(STATUSES.map(([v, l], i) => ({ label: l, value: members({ rules: { status: [v] } }).length, tone: ['green', 'blue', 'purple', 'gray'][i] })), { format: (v) => String(v) }) })}
        ${card({ title: `Unsubscribed (${unsub.length})`, body: unsub.length ? html`<ul class="ec-unsub">${unsub.map((c) => html`<li><a href="${href(`crm/contacts/${c.id}`)}">${store.contactName(c)}</a><span>Never emailed again</span></li>`)}</ul>` : html`<p class="apwa-text-3">Nobody has unsubscribed.</p>` })}
      </div>
    </div>`,
    mount(root) {
      root.addEventListener('click', (e) => {
        const b = e.target.closest('[data-rm]');
        if (!b) return;
        const s = store.find('segments', b.dataset.rm);
        const used = campaigns().some((c) => c.segmentId === s.id && c.status !== 'sent');
        if (used) { toast('A draft or scheduled campaign uses this audience. Change that campaign first.', { tone: 'danger', title: 'Still in use' }); return; }
        store.remove('segments', s.id);
        toast(`${s.name} deleted. Your contacts are untouched.`, { title: 'Audience deleted' });
      });
    },
  };
}

/* ------------------------------------------------------------------ */
/* Module                                                               */
/* ------------------------------------------------------------------ */

// A campaign left "sending" by a reload goes back to draft.
setTimeout(() => { campaigns().filter((c) => c.status === 'sending').forEach((c) => { store.patch('campaigns', c.id, { status: 'draft', sentAt: null }); }); }, 0);

function search(q) {
  const s = q.toLowerCase();
  return campaigns().filter((c) => `${c.name} ${c.subject}`.toLowerCase().includes(s)).slice(0, 5)
    .map((c) => ({ label: c.name, sub: `Campaign · ${STATUS[c.status][0]}`, href: href(`email-automation/campaign/${c.id}`), icon: 'megaphone', type: 'Campaign' }));
}

export default {
  slug: 'email-automation',
  nav: [
    { id: 'ec-campaigns', path: 'email-automation/campaigns', label: 'Campaigns', icon: 'megaphone' },
    { id: 'ec-auto', path: 'email-automation/automations', label: 'Automations', icon: 'zap' },
    { id: 'ec-aud', path: 'email-automation/audiences', label: 'Audiences', icon: 'users' },
  ],
  routes: [
    { pattern: 'email-automation', redirect: 'email-automation/campaigns' },
    { pattern: 'email-automation/campaigns', view: listView, nav: 'ec-campaigns' },
    { pattern: 'email-automation/campaign/:id', view: campaignView, nav: 'ec-campaigns' },
    { pattern: 'email-automation/automations', view: automationsView, nav: 'ec-auto' },
    { pattern: 'email-automation/audiences', view: audiencesView, nav: 'ec-aud' },
  ],
  quickActions: [{ label: 'New campaign', icon: 'megaphone', run: () => newCampaign() }],
  search,
};
