/**
 * Analytics & Reporting demo.
 * Website traffic, Google and Meta ads, SEO rankings and lead attribution in
 * one dashboard, plus a monthly report that sends itself. All numbers are
 * sample data; no ad account or analytics service is connected.
 */
import { html, raw, icon, $, plural, num, money, moneyShort, pct } from '../../assets/js/core/dom.js';
import * as store from '../../assets/js/core/store.js';
import * as ind from '../../assets/js/core/industry.js';
import * as router from '../../assets/js/core/router.js';
import { openPanel, toast, simulated, formData, validate } from '../../assets/js/core/ui.js';
import { badge, card, stat, segmented, bindSegmented, formGrid, dataTable, barList } from '../../assets/js/core/components.js';
import { bySource } from '../../assets/js/core/metrics.js';

const href = (p) => router.href(p);
const DAY = 86400000;

/* ------------------------------------------------------------------ */
/* Sample data                                                          */
/* ------------------------------------------------------------------ */

function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

/** 120 days of visitors and leads, oldest first, with a weekday rhythm and gentle growth. */
const SERIES = (() => {
  const r = rng(42);
  const out = [];
  for (let i = 119; i >= 0; i--) {
    const d = new Date(Date.now() - i * DAY);
    const wk = [0.62, 1.08, 1.12, 1.06, 1.02, 0.94, 0.7][d.getDay()];
    const visitors = Math.round((210 + (119 - i) * 0.9) * wk * (0.88 + r() * 0.24));
    out.push({ d, visitors, leads: Math.max(0, Math.round(visitors * (0.021 + r() * 0.012))) });
  }
  return out;
})();

const CHANNELS = [
  { id: 'organic', label: 'Organic search', share: 0.41, conv: 0.026, tone: 'green' },
  { id: 'google', label: 'Google Ads', share: 0.21, conv: 0.041, tone: 'blue' },
  { id: 'meta', label: 'Meta Ads', share: 0.14, conv: 0.022, tone: 'purple' },
  { id: 'direct', label: 'Direct', share: 0.13, conv: 0.03, tone: 'gray' },
  { id: 'referral', label: 'Referrals and maps', share: 0.07, conv: 0.045, tone: 'teal' },
  { id: 'email', label: 'Email', share: 0.04, conv: 0.05, tone: 'pink' },
];
const CLOSE = 0.34; // share of leads that book a job
const JOB_HOME = 640; // average job value
const JOB = () => ind.pack().job || JOB_HOME;

const PAGES_HOME = [['/', 'Home', 0.31], ['/services/furnace-repair/', 'Furnace repair', 0.17], ['/services/ac-repair/', 'AC repair', 0.12], ['/book/', 'Book a visit', 0.09], ['/maintenance-plan/', 'Maintenance plan', 0.07], ['/reviews/', 'Reviews', 0.05]];

const pages = () => PAGES_HOME.map((x, i) => { const o = ind.at('pages', i, null); return o ? [o[0], o[1], x[2]] : x; });

function seed() {
  const out = {
    adCampaigns: [
      { id: 'ad1', platform: 'google', name: 'Furnace repair - Search', spend: 1240, clicks: 980, leads: 44, active: true },
      { id: 'ad2', platform: 'google', name: 'Emergency HVAC - Search', spend: 860, clicks: 512, leads: 31, active: true },
      { id: 'ad3', platform: 'google', name: 'Local Services Ads', spend: 520, clicks: 0, leads: 22, active: true },
      { id: 'ad4', platform: 'meta', name: 'Fall tune-up offer', spend: 640, clicks: 1460, leads: 18, active: true },
      { id: 'ad5', platform: 'meta', name: 'Retargeting - site visitors', spend: 210, clicks: 380, leads: 7, active: true },
      { id: 'ad6', platform: 'meta', name: 'Summer AC promo', spend: 0, clicks: 0, leads: 0, active: false },
    ],
    keywords: [
      { id: 'k1', term: 'furnace repair near me', pos: 3, prev: 5, volume: 2900, url: '/services/furnace-repair/' },
      { id: 'k2', term: 'hvac company riverside', pos: 2, prev: 2, volume: 880, url: '/' },
      { id: 'k3', term: 'ac repair riverside', pos: 6, prev: 9, volume: 1300, url: '/services/ac-repair/' },
      { id: 'k4', term: 'furnace tune up cost', pos: 11, prev: 8, volume: 720, url: '/maintenance-plan/' },
      { id: 'k5', term: 'emergency plumber', pos: 14, prev: 19, volume: 4400, url: '/services/plumbing/' },
      { id: 'k6', term: 'water heater replacement', pos: 8, prev: 10, volume: 1600, url: '/services/water-heaters/' },
    ],
    reportSettings: { freq: 'monthly', day: '1', to: `owner@${ind.slug()}.example`, sections: ['traffic', 'ads', 'seo', 'leads'], lastSent: null },
  };
  out.adCampaigns.forEach((x, i) => { x.name = ind.at('ads', i, x.name); });
  out.keywords.forEach((x, i) => { const o = ind.at('keywords', i, null); if (o) { x.term = o[0]; x.url = o[1]; } });
  return out;
}

const ready = () => store.ensure('adCampaigns', seed);
const ui = { range: 30 };
const RANGES = [{ value: '7', label: '7 days' }, { value: '30', label: '30 days' }, { value: '90', label: '90 days' }];
const factor = () => ui.range / 30;
const rangeBar = (ctx) => html`<div class="an-toolbar">${segmented('range', RANGES, String(ui.range), { label: 'Date range' })}<span class="an-sample">${icon('info')}Sample data</span></div>`;
const bindRange = (root, ctx) => bindSegmented(root, { range: (v) => { ui.range = Number(v); ctx.rerender(); } });

function window_(days) { const now = SERIES.slice(-days); const prev = SERIES.slice(-days * 2, -days); return { now, prev }; }
const sum = (list, k) => list.reduce((a, x) => a + x[k], 0);
function delta(cur, prev, invert = false) {
  if (!prev) return '';
  const d = (cur - prev) / prev;
  const good = invert ? d < 0 : d > 0;
  return html`<span class="an-delta ${Math.abs(d) < 0.005 ? '' : good ? 'is-up' : 'is-down'}">${d >= 0 ? '+' : ''}${Math.round(d * 100)}% vs prior</span>`;
}
function adTotals() {
  const f = factor();
  const live = store.all('adCampaigns').filter((a) => a.active);
  return { spend: sum(live, 'spend') * f, leads: sum(live, 'leads') * f, clicks: sum(live, 'clicks') * f };
}

/* Small SVG area chart, two series. */
function trendChart(points) {
  const W = 640; const H = 200; const P = 8;
  const maxV = Math.max(...points.map((p) => p.visitors)) * 1.1;
  const maxL = Math.max(...points.map((p) => p.leads)) * 1.6;
  const x = (i) => P + (i * (W - 2 * P)) / Math.max(1, points.length - 1);
  const y = (v, m) => H - P - (v / m) * (H - 2 * P);
  const line = (k, m) => points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p[k], m).toFixed(1)}`).join(' ');
  const area = `${line('visitors', maxV)} L${x(points.length - 1).toFixed(1)},${H - P} L${x(0).toFixed(1)},${H - P} Z`;
  const step = Math.ceil(points.length / 6);
  return html`<div class="an-chart">
    <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="Visitors and leads over time">
      ${raw([0.25, 0.5, 0.75].map((g) => `<line x1="0" x2="${W}" y1="${(H * g).toFixed(0)}" y2="${(H * g).toFixed(0)}" class="an-grid"/>`).join(''))}
      <path d="${area}" class="an-area"/><path d="${line('visitors', maxV)}" class="an-line"/><path d="${line('leads', maxL)}" class="an-line an-line--leads"/>
    </svg>
    <div class="an-axis">${points.filter((_, i) => i % step === 0).map((p) => html`<span>${p.label}</span>`)}</div>
    <div class="an-legend"><span><i class="an-key"></i>Visitors</span><span><i class="an-key an-key--leads"></i>Leads</span></div>
  </div>`;
}
function chartPoints(days) {
  const fmt = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const list = SERIES.slice(-days);
  if (days <= 30) return list.map((p) => ({ ...p, label: fmt(p.d) }));
  const out = [];
  for (let i = 0; i < list.length; i += 7) { const wk = list.slice(i, i + 7); out.push({ visitors: sum(wk, 'visitors'), leads: sum(wk, 'leads'), label: fmt(wk[0].d) }); }
  return out;
}

/* ------------------------------------------------------------------ */
/* Overview                                                             */
/* ------------------------------------------------------------------ */

function overviewView(ctx) {
  ready();
  const { now, prev } = window_(ui.range);
  const v = sum(now, 'visitors'); const pv = sum(prev, 'visitors');
  const l = sum(now, 'leads'); const pl = sum(prev, 'leads');
  const ads = adTotals();
  const rev = Math.round(l * CLOSE * JOB());
  return {
    title: 'Marketing overview',
    subtitle: 'How the website, ads and search turn into leads and booked jobs.',
    actions: [{ label: 'Report settings', icon: 'mail', onClick: () => router.go('analytics-reporting/reports') }],
    body: html`${rangeBar(ctx)}
      <div class="apwa-stats an-stats">
        ${stat({ label: 'Website visitors', value: num(v), sub: delta(v, pv), icon: 'users', tone: 'blue' })}
        ${stat({ label: 'Leads', value: num(l), sub: delta(l, pl), icon: 'user-plus', tone: 'green' })}
        ${stat({ label: 'Cost per lead (ads)', value: money(ads.leads ? ads.spend / ads.leads : 0), sub: `${moneyShort(ads.spend)} ad spend`, icon: 'target', tone: 'amber' })}
        ${stat({ label: 'Revenue from marketing', value: moneyShort(rev), sub: `${pct(CLOSE)} of leads book a job`, icon: 'dollar', tone: 'purple' })}
      </div>
      <div class="an-split">
        ${card({ title: 'Visitors and leads', body: trendChart(chartPoints(ui.range)) })}
        ${card({ title: 'Lead funnel', body: html`<div class="an-funnel">${[['Visitors', v], ['Leads', l], ['Booked jobs', Math.round(l * CLOSE)]].map(([lab, n], i, a) => html`<div><span>${lab}</span><span class="an-funnel__bar"><i style="width:${Math.max(6, (n / a[0][1]) ** 0.35 * 100).toFixed(0)}%"></i></span><b>${num(n)}</b>${i ? html`<small>${pct(n / a[i - 1][1])}</small>` : html`<small></small>`}</div>`)}</div>` })}
      </div>
      <div class="apwa-grid apwa-grid--2 an-grid">
        ${card({ title: 'Leads by channel', actions: html`<a class="an-link" href="${href('analytics-reporting/leads')}">Attribution</a>`, body: barList(CHANNELS.map((c) => ({ label: c.label, sub: `${num(Math.round(v * c.share))} visitors`, value: Math.round(v * c.share * c.conv), tone: c.tone })), { format: (n) => num(n) }) })}
        ${card({ title: 'Top pages', flush: true, body: html`<ul class="an-pages">${pages().map(([url, name, s]) => html`<li><span><strong>${name}</strong><small>${url}</small></span><b>${num(Math.round(v * s))}</b></li>`)}</ul>` })}
      </div>`,
    mount(root) { bindRange(root, ctx); },
  };
}

/* ------------------------------------------------------------------ */
/* Ads                                                                  */
/* ------------------------------------------------------------------ */

const PLAT = { google: ['Google Ads', 'blue'], meta: ['Meta Ads', 'purple'] };

function adsView(ctx) {
  ready();
  const f = factor();
  const list = store.all('adCampaigns');
  const per = (p) => { const l = list.filter((a) => a.platform === p && a.active); return { spend: sum(l, 'spend') * f, leads: sum(l, 'leads') * f }; };
  const g = per('google'); const m = per('meta');
  const cpl = (a) => (a.leads ? a.spend / a.leads : 0);
  const cols = [
    { key: 'name', label: 'Campaign', render: (a) => html`<strong>${a.name}</strong><span class="apwa-cell-sub">${badge(PLAT[a.platform][0], PLAT[a.platform][1])}</span>` },
    { key: 'spend', label: 'Spend', align: 'right', render: (a) => (a.active ? money(a.spend * f) : '—') },
    { key: 'clicks', label: 'Clicks', align: 'right', hideOn: 'tablet', render: (a) => (a.active && a.clicks ? num(Math.round(a.clicks * f)) : '—') },
    { key: 'leads', label: 'Leads', align: 'right', render: (a) => (a.active ? num(Math.round(a.leads * f)) : '—') },
    { key: 'cpl', label: 'Cost / lead', align: 'right', render: (a) => (a.active && a.leads ? html`${money(cpl(a))}${cpl(a) > 34 ? html`<div>${badge('Above target', 'amber')}</div>` : ''}` : '—') },
    { key: 'on', label: 'Running', align: 'right', render: (a) => html`<label class="an-switch" aria-label="${a.active ? 'Pause' : 'Resume'} ${a.name}"><input type="checkbox" data-ad="${a.id}" ${a.active ? raw('checked') : ''}><i></i></label>` },
  ];
  return {
    title: 'Ads',
    subtitle: 'Google and Meta campaigns side by side, judged by the leads they bring.',
    body: html`${rangeBar(ctx)}
      <div class="apwa-grid apwa-grid--2 an-grid an-plats">
        ${[['google', g], ['meta', m]].map(([p, t]) => card({ body: html`<div class="an-plat"><span class="an-plat__ic an-plat__ic--${p}">${p === 'google' ? 'G' : 'M'}</span><span><strong>${PLAT[p][0]}</strong><small>${plural(list.filter((a) => a.platform === p && a.active).length, 'active campaign')}</small></span></div>
          <div class="an-plat__nums"><span><small>Spend</small><b>${money(t.spend)}</b></span><span><small>Leads</small><b>${num(Math.round(t.leads))}</b></span><span><small>Cost / lead</small><b>${money(t.leads ? t.spend / t.leads : 0)}</b></span></div>` }))}
      </div>
      ${card({ title: 'Campaigns', flush: true, className: 'an-table', body: dataTable(cols, list, {
        mobile: (a) => html`<span class="an-mrow"><span class="an-mrow__main"><strong>${a.name}</strong><span>${badge(PLAT[a.platform][0], PLAT[a.platform][1])}</span><span>${a.active ? `${money(a.spend * f)} · ${num(Math.round(a.leads * f))} leads · ${a.leads ? `${money(cpl(a))} per lead` : 'calls only'}` : 'Paused'}</span></span>${cols[5].render(a)}</span>`,
      }) })}
      <p class="an-note">${icon('info')}Pausing here is a demo. In a real setup it pauses the campaign in your ad account.</p>`,
    mount(root) {
      bindRange(root, ctx);
      root.addEventListener('change', (e) => {
        const cb = e.target.closest('[data-ad]');
        if (!cb) return;
        const a = store.find('adCampaigns', cb.dataset.ad);
        const fill = !a.spend && cb.checked ? { spend: 300, clicks: 520, leads: 8 } : {};
        store.patch('adCampaigns', a.id, { active: cb.checked, ...fill });
        toast(`"${a.name}" would be ${cb.checked ? 'resumed' : 'paused'} in ${PLAT[a.platform][0]}. No real ad account was changed.`, { title: 'Simulated in demo mode', tone: 'info' });
      });
    },
  };
}

/* ------------------------------------------------------------------ */
/* SEO                                                                  */
/* ------------------------------------------------------------------ */

function addKeyword() {
  openPanel({
    title: 'Track a keyword',
    subtitle: 'See where you rank on Google for a search your customers make.',
    size: 'sm',
    onSubmit(form) {
      if (!validate(form, { term: 'Type a search phrase' })) return false;
      const term = formData(form).term.trim().toLowerCase();
      let h = 0; for (const ch of term) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
      const pos = 4 + (h % 24);
      store.insert('keywords', { term, pos, prev: pos, volume: 200 + (h % 30) * 70, url: '/' });
      toast(`Sample ranking: position ${pos}. A real setup checks Google daily.`, { title: 'Keyword added' });
      return true;
    },
    body: formGrid([{ label: 'Search phrase', name: 'term', required: true, placeholder: 'e.g. boiler repair riverside', span: 2 }]),
    buttons: [{ label: 'Cancel' }, { label: 'Track keyword', kind: 'primary', type: 'submit' }],
  });
}

function seoView(ctx) {
  ready();
  const kws = store.all('keywords').slice().sort((a, b) => a.pos - b.pos);
  const f = factor();
  const clicks = Math.round(sum(SERIES.slice(-ui.range), 'visitors') * 0.41);
  const imp = Math.round(clicks * 14.6);
  const avg = kws.reduce((a, k) => a + k.pos, 0) / Math.max(1, kws.length);
  const move = (k) => { const d = k.prev - k.pos; return d > 0 ? html`<span class="an-move is-up">${icon('chevron-up')}${d}</span>` : d < 0 ? html`<span class="an-move is-down">${icon('chevron-down')}${-d}</span>` : html`<span class="an-move">—</span>`; };
  const posBadge = (k) => badge(`#${k.pos}`, k.pos <= 3 ? 'green' : k.pos <= 10 ? 'blue' : 'gray');
  const cols = [
    { key: 'term', label: 'Keyword', render: (k) => html`<strong>${k.term}</strong><span class="apwa-cell-sub">${k.url}</span>` },
    { key: 'pos', label: 'Position', align: 'right', render: (k) => html`${posBadge(k)} ${move(k)}` },
    { key: 'vol', label: 'Monthly searches', align: 'right', hideOn: 'tablet', render: (k) => num(k.volume) },
  ];
  return {
    title: 'SEO',
    subtitle: 'Google rankings for the searches that bring customers, with Search Console totals.',
    actions: [{ label: 'Track keyword', icon: 'plus', kind: 'primary', primary: true, onClick: addKeyword }],
    body: html`${rangeBar(ctx)}
      <div class="apwa-stats an-stats">
        ${stat({ label: 'Search clicks', value: num(clicks), sub: 'From Google Search Console', icon: 'search', tone: 'green' })}
        ${stat({ label: 'Impressions', value: num(imp), sub: 'Times you showed up', icon: 'trending-up', tone: 'blue' })}
        ${stat({ label: 'Click rate', value: `${((clicks / imp) * 100).toFixed(1)}%`, sub: 'Clicks per impression', icon: 'target', tone: 'amber' })}
        ${stat({ label: 'Average position', value: avg.toFixed(1), sub: `${kws.filter((k) => k.pos <= 10).length} of ${kws.length} on page one`, icon: 'award', tone: 'purple' })}
      </div>
      ${card({ title: 'Tracked keywords', flush: true, body: dataTable(cols, kws, {
        mobile: (k) => html`<span class="an-mrow"><span class="an-mrow__main"><strong>${k.term}</strong><span>${num(k.volume)} searches a month</span></span><span class="an-mrow__pos">${posBadge(k)}${move(k)}</span></span>`,
      }) })}`,
    mount(root) { bindRange(root, ctx); void f; },
  };
}

/* ------------------------------------------------------------------ */
/* Lead attribution                                                     */
/* ------------------------------------------------------------------ */

function leadsView(ctx) {
  ready();
  const v = sum(SERIES.slice(-ui.range), 'visitors');
  const f = factor();
  const ads = store.all('adCampaigns').filter((a) => a.active);
  const spendOf = (id) => (id === 'google' || id === 'meta' ? sum(ads.filter((a) => a.platform === id), 'spend') * f : id === 'email' ? 49 * f : 0);
  const rows = CHANNELS.map((c) => {
    const leads = Math.round(v * c.share * c.conv);
    const jobs = Math.round(leads * CLOSE);
    const revenue = jobs * JOB();
    const spend = spendOf(c.id);
    return { ...c, leads, jobs, revenue, spend, roi: spend ? revenue / spend : null };
  });
  const crm = bySource().filter((s) => s.wonValue > 0).sort((a, b) => b.wonValue - a.wonValue).slice(0, 6);
  const cols = [
    { key: 'label', label: 'Channel', render: (r) => html`<span class="an-ch"><i class="apwa-fill--${r.tone}"></i><strong>${r.label}</strong></span>` },
    { key: 'leads', label: 'Leads', align: 'right', render: (r) => num(r.leads) },
    { key: 'jobs', label: 'Booked jobs', align: 'right', hideOn: 'tablet', render: (r) => num(r.jobs) },
    { key: 'rev', label: 'Revenue', align: 'right', render: (r) => moneyShort(r.revenue) },
    { key: 'spend', label: 'Spend', align: 'right', hideOn: 'tablet', render: (r) => (r.spend ? money(r.spend) : '—') },
    { key: 'roi', label: 'Return', align: 'right', render: (r) => (r.roi ? badge(`${r.roi.toFixed(1)}x`, r.roi >= 3 ? 'green' : 'amber') : html`<span class="an-free">No spend</span>`) },
  ];
  return {
    title: 'Lead attribution',
    subtitle: 'Which channels bring leads that become paying jobs, and what each one returns.',
    body: html`${rangeBar(ctx)}
      ${card({ title: 'By channel', flush: true, body: dataTable(cols, rows, {
        mobile: (r) => html`<span class="an-mrow"><span class="an-mrow__main"><span class="an-ch"><i class="apwa-fill--${r.tone}"></i><strong>${r.label}</strong></span><span>${num(r.leads)} leads · ${num(r.jobs)} jobs · ${moneyShort(r.revenue)}${r.spend ? ` on ${money(r.spend)}` : ''}</span></span>${cols[5].render(r)}</span>`,
      }) })}
      <div class="apwa-grid apwa-grid--2 an-grid">
        ${card({ title: 'Won deals by source', actions: html`<a class="an-link" href="${href('crm/reports')}">Customer reports</a>`, body: crm.length ? barList(crm.map((s) => ({ label: s.source, sub: plural(s.count, 'deal'), value: s.wonValue, tone: 'green' }))) : html`<p class="an-muted">No deals yet.</p>` })}
        ${card({ title: 'How it is counted', body: html`<ul class="an-how"><li>${icon('check')}A lead is a call, form or booking with its first visit recorded.</li><li>${icon('check')}Revenue counts paid invoices linked to that lead.</li><li>${icon('check')}Return is revenue divided by what the channel cost.</li></ul>` })}
      </div>`,
    mount(root) { bindRange(root, ctx); },
  };
}

/* ------------------------------------------------------------------ */
/* Reports                                                              */
/* ------------------------------------------------------------------ */

const SECTIONS = [['traffic', 'Website traffic'], ['ads', 'Ads performance'], ['seo', 'SEO rankings'], ['leads', 'Leads and revenue']];
const FREQS = { weekly: 'Every Monday', monthly: 'Monthly' };

function reportsView(ctx) {
  ready();
  const s = store.get().reportSettings;
  const { now, prev } = window_(30);
  const v = sum(now, 'visitors'); const l = sum(now, 'leads');
  const ads = adTotals();
  const kws = store.all('keywords');
  const month = new Date(Date.now() - 15 * DAY).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const biz = store.get().business.name;
  const line = (lab, val, d) => html`<li><span>${lab}</span><b>${val}</b>${d || ''}</li>`;
  return {
    title: 'Automated reports',
    subtitle: 'A plain-English summary emailed on schedule, so nobody has to build it by hand.',
    body: html`<div class="an-rsplit">
      ${card({ title: 'Schedule', body: html`<form class="an-rform" data-rform>
        ${formGrid([
          { label: 'Send', name: 'freq', type: 'select', value: s.freq, options: Object.entries(FREQS).map(([value, label]) => ({ value, label })) },
          { label: 'On day', name: 'day', type: 'select', value: s.day, options: ['1', '2', '3', '5'].map((d) => ({ value: d, label: `${d}${d === '1' ? 'st' : d === '2' ? 'nd' : d === '3' ? 'rd' : 'th'} of the month` })), hint: 'Monthly reports only' },
          { label: 'Email to', name: 'to', value: s.to, required: true, span: 2, hint: 'Separate addresses with commas' },
        ])}
        <fieldset class="an-checks"><legend>Include</legend>${SECTIONS.map(([k, lab]) => html`<label><input type="checkbox" name="sec" value="${k}" ${s.sections.includes(k) ? raw('checked') : ''}>${lab}</label>`)}</fieldset>
        <div class="an-rform__btns"><button type="submit" class="apwa-btn apwa-btn--primary">${icon('check')}<span>Save schedule</span></button><button type="button" class="apwa-btn apwa-btn--secondary" data-test>${icon('send')}<span>Send a test</span></button></div>
        ${s.lastSent ? html`<p class="an-muted">Test sent ${new Date(s.lastSent).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} (simulated).</p>` : ''}
      </form>` })}
      <div class="an-report">
        <div class="an-report__env"><strong>Your ${s.freq === 'weekly' ? 'weekly' : 'monthly'} marketing report: ${month}</strong><span>To ${s.to}</span></div>
        <div class="an-report__body">
          <div class="an-report__brand"><span>AP</span>${biz}</div>
          <h2>${num(l)} leads last month, ${l >= sum(prev, 'leads') ? 'up' : 'down'} ${Math.abs(Math.round(((l - sum(prev, 'leads')) / sum(prev, 'leads')) * 100))}%</h2>
          ${s.sections.includes('traffic') ? html`<section><h3>Website</h3><ul>${line('Visitors', num(v), delta(v, sum(prev, 'visitors')))}${line('Best page', pages()[1][1])}</ul></section>` : ''}
          ${s.sections.includes('ads') ? html`<section><h3>Ads</h3><ul>${line('Spend', money(ads.spend))}${line('Leads from ads', num(Math.round(ads.leads)))}${line('Cost per lead', money(ads.leads ? ads.spend / ads.leads : 0))}</ul></section>` : ''}
          ${s.sections.includes('seo') ? html`<section><h3>Search</h3><ul>${line('Keywords on page one', `${kws.filter((k) => k.pos <= 10).length} of ${kws.length}`)}${line('Biggest gain', (kws.slice().sort((a, b) => b.prev - b.pos - (a.prev - a.pos))[0] || {}).term || '—')}</ul></section>` : ''}
          ${s.sections.includes('leads') ? html`<section><h3>Leads and revenue</h3><ul>${line('Booked jobs', num(Math.round(l * CLOSE)))}${line('Revenue from marketing', moneyShort(Math.round(l * CLOSE * JOB())))}</ul></section>` : ''}
          ${s.sections.length ? '' : html`<p class="an-muted">Pick at least one section to include.</p>`}
          <p class="an-report__foot">Sent automatically by AP Webmaster Apps. Numbers in this demo are sample data.</p>
        </div>
      </div>
    </div>`,
    mount(root) {
      const form = $('[data-rform]', root);
      const read = () => { const v2 = formData(form); return { freq: v2.freq, day: v2.day, to: v2.to, sections: [...form.querySelectorAll('[name=sec]:checked')].map((x) => x.value) }; };
      form.addEventListener('change', () => store.update((st) => Object.assign(st.reportSettings, read())));
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!validate(form, { to: 'Add at least one email address' })) return;
        store.update((st) => Object.assign(st.reportSettings, read()));
        const r = store.get().reportSettings;
        toast(r.freq === 'weekly' ? 'The report goes out every Monday morning.' : `The report goes out on day ${r.day} of each month.`, { title: 'Schedule saved' });
      });
      $('[data-test]', root).addEventListener('click', () => {
        if (!validate(form, { to: 'Add at least one email address' })) return;
        store.update((st) => { Object.assign(st.reportSettings, read()); st.reportSettings.lastSent = new Date().toISOString(); });
        simulated(`The report would be emailed to ${store.get().reportSettings.to}.`);
      });
    },
  };
}

/* ------------------------------------------------------------------ */
/* Module                                                               */
/* ------------------------------------------------------------------ */

function search(q) {
  ready();
  const s = q.toLowerCase();
  return [
    ...store.all('adCampaigns').filter((a) => a.name.toLowerCase().includes(s)).map((a) => ({ label: a.name, sub: `Ad campaign · ${PLAT[a.platform][0]}`, href: href('analytics-reporting/ads'), icon: 'megaphone', type: 'Campaign' })),
    ...store.all('keywords').filter((k) => k.term.includes(s)).map((k) => ({ label: k.term, sub: `Keyword · position ${k.pos}`, href: href('analytics-reporting/seo'), icon: 'search', type: 'Keyword' })),
  ].slice(0, 6);
}

export default {
  slug: 'analytics-reporting',
  nav: [
    { id: 'an-over', path: 'analytics-reporting/overview', label: 'Overview', icon: 'bar-chart' },
    { id: 'an-ads', path: 'analytics-reporting/ads', label: 'Ads', icon: 'megaphone' },
    { id: 'an-seo', path: 'analytics-reporting/seo', label: 'SEO', icon: 'search' },
    { id: 'an-leads', path: 'analytics-reporting/leads', label: 'Attribution', icon: 'target' },
    { id: 'an-rep', path: 'analytics-reporting/reports', label: 'Reports', icon: 'mail' },
  ],
  routes: [
    { pattern: 'analytics-reporting', redirect: 'analytics-reporting/overview' },
    { pattern: 'analytics-reporting/overview', view: overviewView, nav: 'an-over' },
    { pattern: 'analytics-reporting/ads', view: adsView, nav: 'an-ads' },
    { pattern: 'analytics-reporting/seo', view: seoView, nav: 'an-seo' },
    { pattern: 'analytics-reporting/leads', view: leadsView, nav: 'an-leads' },
    { pattern: 'analytics-reporting/reports', view: reportsView, nav: 'an-rep' },
  ],
  quickActions: [{ label: 'Track a keyword', icon: 'search', run: () => addKeyword() }],
  search,
};
