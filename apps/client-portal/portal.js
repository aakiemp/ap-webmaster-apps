/**
 * Projects & Client Portal demo.
 * Staff side: projects with phases, approvals, files, updates and change
 * requests. Client side: a preview of the portal each client signs in to,
 * where they can approve work and ask for changes. Uploads and client
 * notifications are simulated; nothing leaves the browser.
 */
import { html, raw, icon, $, $$, plural, date, ago } from '../../assets/js/core/dom.js';
import * as store from '../../assets/js/core/store.js';
import * as router from '../../assets/js/core/router.js';
import { openPanel, toast, simulated, formData, validate } from '../../assets/js/core/ui.js';
import { badge, button, card, stat, emptyState, segmented, bindSegmented, formGrid, meter } from '../../assets/js/core/components.js';

const DAY = 86400000;
const href = (p) => router.href(p);

/* ------------------------------------------------------------------ */
/* Seed                                                                 */
/* ------------------------------------------------------------------ */

function seed() {
  const now = Date.now();
  const iso = (d) => new Date(now + d * DAY).toISOString();
  const c = (i) => (store.all('contacts')[i] || store.all('contacts')[0] || {}).id;
  const ph = (names, done) => names.map((n, i) => ({ name: n, done: i < done }));
  const projects = [
    {
      id: 'prj1', name: 'Lobby and front office refresh', contactId: c(1), ownerId: 'u1', start: iso(-24), due: iso(18), value: 18400,
      phases: ph(['Site walk and measurements', 'Design and finish selections', 'Demo and prep', 'Install', 'Final walkthrough'], 2),
      onboarding: [{ t: 'Signed agreement', done: true }, { t: 'Deposit received', done: true }, { t: 'Building access details', done: true }, { t: 'Preferred work hours', done: false }],
      approvals: [{ id: 'ap1', title: 'Flooring: warm oak, matte finish', note: 'Two samples attached. Lead time is about 10 days once approved.', status: 'pending', at: iso(-1) }, { id: 'ap2', title: 'Paint colors for the lobby', note: 'Soft white walls with a navy accent wall.', status: 'approved', at: iso(-6), answeredAt: iso(-5) }],
      files: [['Signed agreement.pdf', 'Contract', -23], ['Floor plan v2.pdf', 'Plans', -12], ['Flooring samples.jpg', 'Photos', -1], ['Paint swatches.jpg', 'Photos', -6]].map(([n, k, d]) => ({ name: n, kind: k, at: iso(d) })),
      updates: [{ text: 'Paint colors approved. We ordered materials and booked the painters for the week of the 24th.', at: iso(-5), by: 'u1' }, { text: 'Measurements are done. The design draft is in Files.', at: iso(-12), by: 'u3' }],
      requests: [{ text: 'Can the crew start after 9 AM? The front desk opens at 8:30.', at: iso(-0.4), status: 'new' }],
    },
    {
      id: 'prj2', name: 'Basement finishing', contactId: c(7), ownerId: 'u3', start: iso(-40), due: iso(9), value: 29400,
      phases: ph(['Plans and permit', 'Framing', 'Electrical and plumbing', 'Drywall and paint', 'Flooring and trim'], 3),
      onboarding: [{ t: 'Signed agreement', done: true }, { t: 'Deposit received', done: true }, { t: 'Permit filed', done: true }],
      approvals: [{ id: 'ap3', title: 'Change order: add a bathroom vent fan', note: 'Adds $340 and half a day.', status: 'pending', at: iso(-2) }],
      files: [['Permit approval.pdf', 'Permits', -30], ['Electrical layout.pdf', 'Plans', -18], ['Framing progress.jpg', 'Photos', -10]].map(([n, k, d]) => ({ name: n, kind: k, at: iso(d) })),
      updates: [{ text: 'Electrical inspection passed. Drywall starts Monday.', at: iso(-3), by: 'u3' }],
      requests: [],
    },
    {
      id: 'prj3', name: 'Office HVAC service plan setup', contactId: c(4), ownerId: 'u2', start: iso(-6), due: iso(30), value: 9600,
      phases: ph(['Kickoff call', 'Equipment survey', 'Maintenance schedule', 'First service visit'], 1),
      onboarding: [{ t: 'Signed agreement', done: true }, { t: 'Deposit received', done: false }, { t: 'Equipment list', done: false }, { t: 'Main contact for visits', done: false }],
      approvals: [],
      files: [['Service agreement.pdf', 'Contract', -6]].map(([n, k, d]) => ({ name: n, kind: k, at: iso(d) })),
      updates: [{ text: 'Thanks for choosing us. Please finish the onboarding checklist so we can schedule the survey.', at: iso(-6), by: 'u2' }],
      requests: [],
    },
    {
      id: 'prj4', name: 'Whole-home window replacement', contactId: c(0), ownerId: 'u1', start: iso(-60), due: iso(-8), value: 12800, finished: iso(-9),
      phases: ph(['Measure', 'Order windows', 'Install', 'Final walkthrough'], 4),
      onboarding: [{ t: 'Signed agreement', done: true }, { t: 'Deposit received', done: true }],
      approvals: [{ id: 'ap4', title: 'Window style: white vinyl, grids on front only', note: '', status: 'approved', at: iso(-55), answeredAt: iso(-54) }],
      files: [['Warranty.pdf', 'Warranty', -9], ['Before and after.jpg', 'Photos', -9]].map(([n, k, d]) => ({ name: n, kind: k, at: iso(d) })),
      updates: [{ text: 'All done. Your warranty is in Files. Thank you!', at: iso(-9), by: 'u1' }],
      requests: [],
    },
  ];
  return { projects };
}

const projects = () => { store.ensure('projects', seed); return store.all('projects'); };
const project = (id) => projects().find((p) => p.id === id) || null;
const client = (p) => store.contact(p.contactId);
const clientName = (p) => { const c = client(p); return c ? (c.company || store.contactName(c)) : 'Client'; };
const progress = (p) => p.phases.filter((x) => x.done).length / p.phases.length;
const pending = (p) => p.approvals.filter((a) => a.status === 'pending');
const openReq = (p) => p.requests.filter((r) => r.status === 'new');
const isDone = (p) => p.phases.every((x) => x.done);
const nextPhase = (p) => p.phases.find((x) => !x.done);

function state(p) {
  if (isDone(p)) return ['Completed', 'green'];
  if (pending(p).length) return ['Waiting on client', 'amber'];
  if (new Date(p.due).getTime() < Date.now()) return ['Past due', 'red'];
  return ['In progress', 'blue'];
}
const stateBadge = (p) => { const [l, t] = state(p); return badge(l, t, { dot: true }); };

function mutate(id, fn) { store.update((s) => { const p = s.projects.find((x) => x.id === id); if (p) fn(p); }); }

/* ------------------------------------------------------------------ */
/* Actions                                                              */
/* ------------------------------------------------------------------ */

function requestApproval(p) {
  openPanel({
    title: 'Ask the client to approve',
    subtitle: `${clientName(p)} sees this in their portal.`,
    size: 'sm',
    onSubmit(form) {
      if (!validate(form, { title: 'Say what needs approval' })) return false;
      const v = formData(form);
      mutate(p.id, (x) => { x.approvals.unshift({ id: `ap${Date.now()}`, title: v.title, note: v.note, status: 'pending', at: new Date().toISOString() }); });
      simulated(`${clientName(p)} would get an email asking them to review "${v.title}".`);
      return true;
    },
    body: formGrid([{ label: 'What needs approval', name: 'title', required: true, placeholder: 'e.g. Cabinet hardware: brushed nickel', span: 2 }, { label: 'Details for the client', name: 'note', type: 'textarea', rows: 3, span: 2 }]),
    buttons: [{ label: 'Cancel' }, { label: 'Send request', kind: 'primary', type: 'submit' }],
  });
}

function postUpdate(p) {
  openPanel({
    title: 'Post an update',
    subtitle: 'It shows at the top of the client’s portal.',
    size: 'sm',
    onSubmit(form) {
      if (!validate(form, { text: 'Write the update' })) return false;
      const v = formData(form);
      mutate(p.id, (x) => { x.updates.unshift({ text: v.text, at: new Date().toISOString(), by: store.currentUser().id }); });
      simulated(`${clientName(p)} would get a notification about your update.`);
      return true;
    },
    body: formGrid([{ label: 'Update', name: 'text', type: 'textarea', rows: 4, required: true, placeholder: 'What happened and what comes next', span: 2 }]),
    buttons: [{ label: 'Cancel' }, { label: 'Post update', kind: 'primary', type: 'submit' }],
  });
}

const SAMPLE_FILES = [['Progress photo.jpg', 'Photos'], ['Revised estimate.pdf', 'Estimates'], ['Material spec sheet.pdf', 'Plans']];

function addFile(p) {
  openPanel({
    title: 'Share a file',
    subtitle: 'This demo never reads files from your device, so pick a sample.',
    size: 'sm',
    body: html`<div class="cp-picks">${SAMPLE_FILES.map(([n, k], i) => html`<label class="cp-pick"><input type="radio" name="f" value="${i}" ${i === 0 ? raw('checked') : ''}><span>${icon(k === 'Photos' ? 'scan' : 'file-text')}<strong>${n}</strong><small>${k}</small></span></label>`)}</div>`,
    buttons: [{ label: 'Cancel' }, { label: 'Share with client', kind: 'primary', onClick: (close, panel) => {
      const [n, k] = SAMPLE_FILES[Number($('input[name=f]:checked', panel).value)];
      mutate(p.id, (x) => { x.files.unshift({ name: n, kind: k, at: new Date().toISOString() }); });
      toast(`${n} is now in ${clientName(p)}’s portal.`, { title: 'File shared' });
      return true;
    } }],
  });
}

function answer(p, apId, ok, note = '') {
  mutate(p.id, (x) => {
    const a = x.approvals.find((y) => y.id === apId);
    if (a) Object.assign(a, { status: ok ? 'approved' : 'changes', answeredAt: new Date().toISOString(), reply: note });
    if (!ok) x.requests.unshift({ text: `Changes asked on "${a.title}": ${note || 'no details given'}`, at: new Date().toISOString(), status: 'new' });
  });
  toast(ok ? 'Approved. Your team sees it right away.' : 'Sent back to the team with your notes.', { title: ok ? 'Approved' : 'Changes requested' });
}

/* ------------------------------------------------------------------ */
/* Projects list                                                        */
/* ------------------------------------------------------------------ */

const ui = { tab: 'active' };

function projectCard(p) {
  const n = nextPhase(p);
  return html`<a class="cp-card" href="${href(`client-portal/project/${p.id}`)}">
    <span class="cp-card__top"><span class="cp-card__client">${clientName(p)}</span>${stateBadge(p)}</span>
    <strong class="cp-card__name">${p.name}</strong>
    <span class="cp-card__bar">${meter(progress(p), isDone(p) ? 'green' : 'purple')}<b>${Math.round(progress(p) * 100)}%</b></span>
    <span class="cp-card__meta">${n ? html`Next: ${n.name}` : 'All phases done'}</span>
    <span class="cp-card__foot"><span>${icon('calendar')}${isDone(p) ? `Finished ${date(p.finished || p.due)}` : `Due ${date(p.due)}`}</span>${pending(p).length ? html`<span class="cp-warn">${icon('clock')}${plural(pending(p).length, 'approval')}</span>` : ''}${openReq(p).length ? html`<span class="cp-new">${icon('inbox')}${plural(openReq(p).length, 'new request')}</span>` : ''}</span>
  </a>`;
}

function listView(ctx) {
  const all = projects();
  const active = all.filter((p) => !isDone(p));
  const rows = ui.tab === 'active' ? active : ui.tab === 'done' ? all.filter(isDone) : all;
  const waiting = all.reduce((t, p) => t + pending(p).length, 0);
  const reqs = all.reduce((t, p) => t + openReq(p).length, 0);
  return {
    title: 'Projects',
    subtitle: 'Every client job in one place. Clients follow along in their own portal.',
    actions: [{ label: 'Client view', icon: 'external', onClick: () => router.go(`client-portal/client/${(active[0] || all[0]).id}`) }],
    body: html`
      <div class="apwa-stats cp-stats">
        ${stat({ label: 'Active projects', value: active.length, sub: `${plural(all.length - active.length, 'finished')}`, icon: 'briefcase', tone: 'purple' })}
        ${stat({ label: 'Waiting on clients', value: waiting, sub: 'Approvals not answered yet', icon: 'clock', tone: 'amber' })}
        ${stat({ label: 'New requests', value: reqs, sub: 'From client portals', icon: 'inbox', tone: 'pink' })}
        ${stat({ label: 'Work in progress', value: `$${Math.round(active.reduce((t, p) => t + p.value, 0) / 1000)}k`, sub: 'Value of active projects', icon: 'dollar', tone: 'green' })}
      </div>
      <div class="cp-toolbar">${segmented('ptab', [{ value: 'active', label: 'Active', count: active.length }, { value: 'done', label: 'Completed', count: all.length - active.length }, { value: 'all', label: 'All', count: all.length }], ui.tab, { label: 'Project status' })}</div>
      ${rows.length ? html`<div class="cp-cards">${rows.map(projectCard)}</div>` : card({ body: emptyState({ icon: 'briefcase', title: 'No projects here' }) })}`,
    mount(root) { bindSegmented(root, { ptab: (v) => { ui.tab = v; ctx.rerender(); } }); },
  };
}

/* ------------------------------------------------------------------ */
/* Project page (staff)                                                 */
/* ------------------------------------------------------------------ */

function approvalList(p, asClient) {
  if (!p.approvals.length) return html`<p class="cp-muted">Nothing to approve yet.</p>`;
  const S = { pending: ['Waiting', 'amber'], approved: ['Approved', 'green'], changes: ['Changes asked', 'red'] };
  return html`<ul class="cp-aps">${p.approvals.map((a) => html`<li class="${a.status === 'pending' ? 'is-pending' : ''}">
    <div class="cp-aps__head"><strong>${a.title}</strong>${badge(S[a.status][0], S[a.status][1])}</div>
    ${a.note ? html`<p>${a.note}</p>` : ''}
    ${a.reply ? html`<p class="cp-aps__reply">${icon('note')}${a.reply}</p>` : ''}
    <span class="cp-aps__meta">${a.status === 'pending' ? `Asked ${ago(a.at)}` : `Answered ${ago(a.answeredAt)}`}</span>
    ${a.status === 'pending' ? (asClient
      ? html`<div class="cp-aps__btns">${button('Approve', { kind: 'primary', icon: 'check', attrs: { 'data-ok': a.id } })}${button('Ask for changes', { attrs: { 'data-no': a.id } })}</div>`
      : html`<div class="cp-aps__btns">${button('Send a reminder', { size: 'sm', icon: 'send', attrs: { 'data-remind': a.id } })}</div>`) : ''}
  </li>`)}</ul>`;
}

function fileList(p) {
  return html`<ul class="cp-files">${p.files.map((f) => html`<li><span class="cp-files__ic">${icon(f.kind === 'Photos' ? 'scan' : 'file-text')}</span><span><strong>${f.name}</strong><small>${f.kind} · ${date(f.at)}</small></span><button type="button" class="apwa-iconbtn" data-dl="${f.name}" aria-label="Download ${f.name}">${icon('download')}</button></li>`)}</ul>`;
}

function phaseList(p, editable) {
  return html`<ol class="cp-phases">${p.phases.map((x, i) => html`<li class="${x.done ? 'is-done' : nextPhase(p) === x ? 'is-next' : ''}">
    ${editable ? html`<label><input type="checkbox" data-phase="${i}" ${x.done ? raw('checked') : ''}><span>${x.name}</span></label>` : html`<span class="cp-phases__dot">${x.done ? icon('check') : i + 1}</span><span>${x.name}</span>`}
  </li>`)}</ol>`;
}

function projectView(ctx) {
  const p = project(ctx.params.id);
  if (!p) return { title: 'Project not found', back: href('client-portal/projects'), body: emptyState({ icon: 'briefcase', title: 'This project is gone', text: 'The demo may have been reset.', action: button('Back to projects', { kind: 'primary', href: href('client-portal/projects') }) }) };
  const c = client(p);
  const owner = store.user(p.ownerId);
  return {
    title: p.name,
    crumb: { label: 'Projects', href: href('client-portal/projects') },
    back: href('client-portal/projects'),
    subtitle: html`${stateBadge(p)} <span class="cp-sub">${c ? html`<a href="${href(`crm/contacts/${c.id}`)}">${clientName(p)}</a>` : ''} · ${owner ? owner.name : ''} · due ${date(p.due)}</span>`,
    actions: [
      { label: 'Client view', icon: 'external', onClick: () => router.go(`client-portal/client/${p.id}`) },
      { label: 'Post update', icon: 'note', onClick: () => postUpdate(project(p.id)) },
      { label: 'Ask for approval', icon: 'check-circle', kind: 'primary', primary: true, onClick: () => requestApproval(project(p.id)) },
    ],
    body: html`<div class="cp-split">
      <div class="cp-col">
        ${card({ title: 'Progress', actions: html`<b class="cp-pct">${Math.round(progress(p) * 100)}%</b>`, body: html`${meter(progress(p), isDone(p) ? 'green' : 'purple')}${phaseList(p, true)}` })}
        ${card({ title: 'Approvals', body: approvalList(p, false) })}
        ${card({ title: `Client requests${openReq(p).length ? ` (${openReq(p).length} new)` : ''}`, body: p.requests.length ? html`<ul class="cp-reqs">${p.requests.map((r, i) => html`<li class="${r.status === 'new' ? 'is-new' : ''}"><p>${r.text}</p><span>${ago(r.at)}${r.status === 'new' ? html` · <button type="button" class="cp-link" data-done="${i}">Mark handled</button>` : ' · Handled'}</span></li>`)}</ul>` : html`<p class="cp-muted">No requests from the client.</p>` })}
      </div>
      <div class="cp-col">
        ${card({ title: 'Onboarding checklist', body: html`<ul class="cp-onb">${p.onboarding.map((o, i) => html`<li><label><input type="checkbox" data-onb="${i}" ${o.done ? raw('checked') : ''}><span>${o.t}</span></label></li>`)}</ul>` })}
        ${card({ title: 'Files', actions: button('Share file', { size: 'sm', icon: 'plus', attrs: { 'data-add': '1' } }), flush: true, body: fileList(p) })}
        ${card({ title: 'Updates', body: html`<ul class="cp-ups">${p.updates.map((u) => html`<li><p>${u.text}</p><span>${(store.user(u.by) || {}).name || 'Team'} · ${ago(u.at)}</span></li>`)}</ul>` })}
      </div>
    </div>`,
    mount(root) {
      root.addEventListener('change', (e) => {
        const ph = e.target.closest('[data-phase]');
        if (ph) {
          const i = Number(ph.dataset.phase);
          mutate(p.id, (x) => { x.phases[i].done = ph.checked; if (x.phases.every((y) => y.done)) x.finished = new Date().toISOString(); else delete x.finished; });
          const cur = project(p.id);
          toast(isDone(cur) ? 'Every phase is done. The client sees the project as complete.' : `${cur.phases[i].name} marked ${ph.checked ? 'done' : 'not done'}. The client’s progress bar updates too.`, { title: 'Progress saved' });
        }
        const ob = e.target.closest('[data-onb]');
        if (ob) mutate(p.id, (x) => { x.onboarding[Number(ob.dataset.onb)].done = ob.checked; });
      });
      root.addEventListener('click', (e) => {
        if (e.target.closest('[data-add]')) addFile(project(p.id));
        const r = e.target.closest('[data-remind]');
        if (r) simulated(`${clientName(p)} would get a reminder to review "${p.approvals.find((a) => a.id === r.dataset.remind).title}".`);
        const d = e.target.closest('[data-dl]');
        if (d) toast(`${d.dataset.dl} is a sample, so there is nothing to download.`, { tone: 'info', title: 'Demo file' });
        const h = e.target.closest('[data-done]');
        if (h) { mutate(p.id, (x) => { x.requests[Number(h.dataset.done)].status = 'handled'; }); toast('Request marked handled.', { title: 'Done' }); }
      });
    },
  };
}

/* ------------------------------------------------------------------ */
/* Client view                                                          */
/* ------------------------------------------------------------------ */

function clientView(ctx) {
  const all = projects();
  const p = project(ctx.params.id) || all[0];
  const biz = store.get().business.name;
  const c = client(p);
  const n = nextPhase(p);
  const latest = p.updates[0];
  return {
    title: 'Client view',
    crumb: { label: 'Projects', href: href('client-portal/projects') },
    back: href(`client-portal/project/${p.id}`),
    subtitle: 'This is what your client sees when they sign in. Try approving or asking for changes as them.',
    body: html`
      <div class="cp-viewbar"><label>${icon('user')}<span>Viewing as</span><div class="apwa-select"><select data-as>${all.map((x) => html`<option value="${x.id}" ${x.id === p.id ? raw('selected') : ''}>${clientName(x)}: ${x.name}</option>`)}</select>${icon('chevron-down')}</div></label></div>
      <div class="cp-portal">
        <header class="cp-portal__head"><span class="cp-portal__logo">${biz.split(' ').map((w) => w[0]).join('').slice(0, 2)}</span><span><strong>${biz}</strong><small>Client portal</small></span><span class="cp-portal__me">${c ? (c.firstName || '').charAt(0) + (c.lastName || '').charAt(0) : ''}</span></header>
        <div class="cp-portal__body">
          <p class="cp-portal__hi">Hi ${c ? c.firstName : 'there'}, here is where your project stands.</p>
          <section class="cp-portal__hero">
            <span>${p.name}</span>
            <div class="cp-portal__pct"><b>${Math.round(progress(p) * 100)}%</b>${meter(progress(p), isDone(p) ? 'green' : 'purple')}</div>
            <p>${n ? html`Now: <strong>${n.name}</strong> · Expected finish ${date(p.due)}` : html`<strong>Your project is complete.</strong> Thank you!`}</p>
          </section>
          ${pending(p).length ? html`<section class="cp-portal__sec cp-portal__sec--ask"><h3>${icon('clock')}Waiting for you</h3>${approvalList({ ...p, approvals: pending(p) }, true)}</section>` : ''}
          ${latest ? html`<section class="cp-portal__sec"><h3>${icon('note')}Latest update</h3><p class="cp-portal__upd">${latest.text}</p><small class="cp-muted">${(store.user(latest.by) || {}).name || 'Team'} · ${ago(latest.at)}</small></section>` : ''}
          <div class="cp-portal__grid">
            <section class="cp-portal__sec"><h3>${icon('list')}Project steps</h3>${phaseList(p, false)}</section>
            <section class="cp-portal__sec"><h3>${icon('file-text')}Your files</h3>${fileList(p)}</section>
          </div>
          <section class="cp-portal__sec"><h3>${icon('edit')}Need something changed?</h3>
            <form class="cp-ask" data-ask><textarea name="text" rows="3" placeholder="Tell the team what you need" aria-label="Your request"></textarea>${button('Send to the team', { kind: 'primary', type: 'submit', icon: 'send' })}</form>
          </section>
        </div>
      </div>`,
    mount(root) {
      $('[data-as]', root).addEventListener('change', (e) => router.go(`client-portal/client/${e.target.value}`, { replace: true }));
      root.addEventListener('click', (e) => {
        const ok = e.target.closest('[data-ok]');
        if (ok) answer(p, ok.dataset.ok, true);
        const no = e.target.closest('[data-no]');
        if (no) {
          openPanel({
            title: 'Ask for changes', size: 'sm',
            onSubmit(form) { if (!validate(form, { note: 'Say what should change' })) return false; answer(p, no.dataset.no, false, formData(form).note); return true; },
            body: formGrid([{ label: 'What should change?', name: 'note', type: 'textarea', rows: 3, required: true, span: 2 }]),
            buttons: [{ label: 'Cancel' }, { label: 'Send', kind: 'primary', type: 'submit' }],
          });
        }
        const d = e.target.closest('[data-dl]');
        if (d) toast(`${d.dataset.dl} is a sample, so there is nothing to download.`, { tone: 'info', title: 'Demo file' });
      });
      $('[data-ask]', root).addEventListener('submit', (e) => {
        e.preventDefault();
        const text = e.target.elements.text.value.trim();
        if (!text) { toast('Write what you need first.', { tone: 'danger', title: 'Nothing to send' }); return; }
        mutate(p.id, (x) => { x.requests.unshift({ text, at: new Date().toISOString(), status: 'new' }); });
        toast('Sent. The team sees it on the project page.', { title: 'Request sent' });
      });
    },
  };
}

/* ------------------------------------------------------------------ */
/* Approvals                                                            */
/* ------------------------------------------------------------------ */

function approvalsView() {
  const rows = projects().flatMap((p) => p.approvals.map((a) => ({ p, a }))).sort((x, y) => (x.a.status === 'pending' ? -1 : 1) - (y.a.status === 'pending' ? -1 : 1) || (x.a.at < y.a.at ? 1 : -1));
  const S = { pending: ['Waiting', 'amber'], approved: ['Approved', 'green'], changes: ['Changes asked', 'red'] };
  return {
    title: 'Approvals',
    subtitle: 'Everything you asked clients to sign off on, newest first.',
    body: card({ flush: true, body: rows.length ? html`<ul class="cp-alist">${rows.map(({ p, a }) => html`<li><a href="${href(`client-portal/project/${p.id}`)}"><span class="cp-alist__main"><strong>${a.title}</strong><span>${clientName(p)} · ${p.name}</span></span><span class="cp-alist__side">${badge(S[a.status][0], S[a.status][1], { dot: true })}<small>${a.status === 'pending' ? `Asked ${ago(a.at)}` : `Answered ${ago(a.answeredAt)}`}</small></span></a></li>`)}</ul>` : emptyState({ icon: 'check-circle', title: 'No approvals yet' }) }),
  };
}

/* ------------------------------------------------------------------ */
/* Module                                                               */
/* ------------------------------------------------------------------ */

function search(q) {
  const s = q.toLowerCase();
  return projects().filter((p) => `${p.name} ${clientName(p)}`.toLowerCase().includes(s)).slice(0, 5)
    .map((p) => ({ label: p.name, sub: `Project · ${clientName(p)}`, href: href(`client-portal/project/${p.id}`), icon: 'briefcase', type: 'Project' }));
}

export default {
  slug: 'client-portal',
  nav: [
    { id: 'cp-projects', path: 'client-portal/projects', label: 'Projects', icon: 'briefcase' },
    { id: 'cp-approvals', path: 'client-portal/approvals', label: 'Approvals', icon: 'check-circle' },
    { id: 'cp-client', path: 'client-portal/client', label: 'Client view', short: 'Client view', icon: 'user' },
  ],
  routes: [
    { pattern: 'client-portal', redirect: 'client-portal/projects' },
    { pattern: 'client-portal/projects', view: listView, nav: 'cp-projects' },
    { pattern: 'client-portal/project/:id', view: projectView, nav: 'cp-projects' },
    { pattern: 'client-portal/approvals', view: approvalsView, nav: 'cp-approvals' },
    { pattern: 'client-portal/client', view: clientView, nav: 'cp-client' },
    { pattern: 'client-portal/client/:id', view: clientView, nav: 'cp-client' },
  ],
  quickActions: [{ label: 'Open the client portal', icon: 'briefcase', run: () => router.go('client-portal/client') }],
  search,
};
