/**
 * Platform home: a snapshot across apps plus a launcher for every app.
 */
import { html, icon, money, moneyShort, pct, date, ago, plural } from './core/dom.js';
import * as store from './core/store.js';
import * as router from './core/router.js';
import * as guide from './core/guide.js';
import * as metrics from './core/metrics.js';
import { stat, card, barList, timeline, emptyState, userAvatar } from './core/components.js';

const CONFIG = window.APWA_CONFIG || {};
const UI_KEY = 'apwa.ui.welcomeDismissed';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function welcomeDismissed() {
  try { return window.localStorage.getItem(UI_KEY) === '1'; } catch (e) { return false; }
}

export default function dashboard() {
  const m = metrics.pipeline();
  const u = store.currentUser();
  const b = store.get().business;
  const recent = store.all('activities').slice().sort((a, c) => (a.at < c.at ? 1 : -1)).slice(0, 7);
  const contactHref = (c) => router.href(`crm/contacts/${c.id}`);

  const welcome = welcomeDismissed() ? '' : html`<div class="apwa-callout" data-welcome>
    <span class="apwa-callout__icon">${icon('info')}</span>
    <div class="apwa-callout__body">
      <strong>Welcome to the AP Webmaster Apps demo.</strong>
      <span>${b.custom ? `Sample data made for ${b.name}.` : `${b.name} is a fictional business.`} Add contacts, drag deals through the pipeline and log activity. Everything stays in your browser.</span>
    </div>
    <div class="apwa-callout__actions">
      <a class="apwa-btn apwa-btn--primary apwa-btn--sm" href="${router.href('crm/pipeline')}">${icon('pipeline')}<span>Open the pipeline</span></a>
      <button type="button" class="apwa-iconbtn apwa-iconbtn--sm" data-dismiss-welcome aria-label="Dismiss welcome message">${icon('x')}</button>
    </div>
  </div>`;

  const apps = (CONFIG.apps || []).map((a) => html`<a class="apwa-applink ${a.status !== 'demo' ? 'is-soon' : ''}" href="${router.href(`${a.slug}/`)}">
    <span class="apwa-applink__icon apwa-tone--${a.color}">${icon(a.icon)}</span>
    <span class="apwa-applink__text"><strong>${a.name}</strong><span>${a.status === 'demo' ? 'Live demo' : 'Coming soon'}</span></span>
    ${icon('chevron-right', 'apwa-applink__chev')}
  </a>`);

  const closing = m.closingSoon.slice(0, 5);
  const closingList = closing.length
    ? html`<ul class="apwa-mini" role="list">${closing.map((d) => {
      const c = store.contact(d.contactId);
      const overdue = new Date(d.expectedClose) < new Date();
      return html`<li><a class="apwa-mini__row" href="${router.href(`crm/pipeline?deal=${d.id}`)}">
        <span class="apwa-mini__main"><strong>${d.name}</strong><span>${store.contactName(c)} · ${metrics.stageName(d.stageId)}</span></span>
        <span class="apwa-mini__side"><strong>${money(d.value)}</strong><span class="${overdue ? 'apwa-text-danger' : ''}">${overdue ? 'Overdue' : date(d.expectedClose)}</span></span>
        ${userAvatar(d.ownerId)}
      </a></li>`;
    })}</ul>`
    : emptyState({ icon: 'calendar', title: 'Nothing closing in the next two weeks' });

  return {
    title: 'Dashboard',
    titleHtml: html`${greeting()}, ${u.name.split(' ')[0]}`,
    subtitle: `Here's how ${b.name} is doing today.`,
    actions: [
      { label: 'New contact', icon: 'user-plus', onClick: () => router.go('crm/contacts?new=1') },
      { label: 'New opportunity', icon: 'plus', kind: 'primary', primary: true, onClick: () => router.go('crm/pipeline?new=1') },
    ],
    body: html`
      ${guide.checklistCard() || welcome}
      <div class="apwa-stats">
        ${stat({ label: 'Open pipeline', value: moneyShort(m.openValue), sub: plural(m.open.length, 'open deal'), icon: 'pipeline', tone: 'blue' })}
        ${stat({ label: 'Won this month', value: moneyShort(m.wonThisMonthValue), sub: `${plural(m.wonThisMonth.length, 'deal')} closed`, icon: 'award', tone: 'green' })}
        ${stat({ label: 'Win rate', value: pct(m.winRate), sub: 'Last 90 days', icon: 'target', tone: 'purple' })}
        ${stat({ label: 'New leads', value: String(m.newLeads7), sub: 'Last 7 days', icon: 'user-plus', tone: 'amber' })}
      </div>
      <div class="apwa-grid apwa-grid--dash">
        ${card({
          title: 'Pipeline by stage',
          actions: html`<a class="apwa-link" href="${router.href('crm/pipeline')}">View pipeline</a>`,
          body: barList(m.byStage.map((s) => ({ label: s.name, sub: plural(s.count, 'deal'), value: s.value }))),
          className: 'apwa-span-2',
        })}
        ${card({ title: 'Closing in the next 14 days', body: closingList, flush: true, actions: html`<a class="apwa-link" href="${router.href('crm/reports')}">Reports</a>` })}
        ${card({
          title: 'Recent activity',
          body: timeline(recent, { showContact: true, contactLink: contactHref }),
          className: 'apwa-span-2',
        })}
        ${card({ title: 'Your apps', body: html`<div class="apwa-applinks">${apps}</div>`, flush: true })}
      </div>`,
    mount(el) {
      const btn = el.querySelector('[data-dismiss-welcome]');
      if (btn) {
        btn.addEventListener('click', () => {
          try { window.localStorage.setItem(UI_KEY, '1'); } catch (e) { /* storage blocked */ }
          el.querySelector('[data-welcome]').remove();
        });
      }
    },
  };
}

export { ago };
