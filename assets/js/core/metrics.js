/**
 * Shared sales numbers, computed from demo data so every screen agrees.
 */
import * as store from './store.js';

const DAY = 86400000;

export function stages() {
  return store.get().pipelines[0].stages;
}

export function stageName(id) {
  const s = stages().find((x) => x.id === id);
  return s ? s.name : id;
}

export function withinDays(iso, days) {
  return iso && Date.now() - new Date(iso).getTime() <= days * DAY;
}

export function pipeline() {
  const deals = store.all('deals');
  const open = deals.filter((d) => d.status === 'open');
  const st = stages();
  const byStage = st.map((s) => {
    const list = open.filter((d) => d.stageId === s.id);
    return { ...s, count: list.length, value: list.reduce((n, d) => n + Number(d.value || 0), 0) };
  });
  const openValue = open.reduce((n, d) => n + Number(d.value || 0), 0);
  const weighted = open.reduce((n, d) => n + Number(d.value || 0) * (st.find((s) => s.id === d.stageId)?.probability || 0), 0);

  const closed90 = deals.filter((d) => d.status !== 'open' && withinDays(d.closedAt, 90));
  const won90 = closed90.filter((d) => d.status === 'won');
  const winRate = closed90.length ? won90.length / closed90.length : 0;
  const wonValue90 = won90.reduce((n, d) => n + Number(d.value || 0), 0);
  const avgDeal = won90.length ? wonValue90 / won90.length : 0;
  const cycle = won90.length
    ? won90.reduce((n, d) => n + (new Date(d.closedAt) - new Date(d.createdAt)) / DAY, 0) / won90.length
    : 0;

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const wonThisMonth = deals.filter((d) => d.status === 'won' && d.closedAt && new Date(d.closedAt) >= monthStart);

  const soon = open
    .filter((d) => d.expectedClose && new Date(d.expectedClose).getTime() - Date.now() <= 14 * DAY)
    .sort((a, b) => (a.expectedClose < b.expectedClose ? -1 : 1));

  return {
    deals,
    open,
    byStage,
    openValue,
    weighted,
    winRate,
    won90,
    wonValue90,
    avgDeal,
    cycle,
    wonThisMonth,
    wonThisMonthValue: wonThisMonth.reduce((n, d) => n + Number(d.value || 0), 0),
    closingSoon: soon,
    newLeads7: store.all('contacts').filter((c) => withinDays(c.createdAt, 7)).length,
  };
}

/** Won revenue for the last n months, oldest first. */
export function wonByMonth(n = 6) {
  const out = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i -= 1) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const value = store.all('deals')
      .filter((d) => d.status === 'won' && d.closedAt && new Date(d.closedAt) >= start && new Date(d.closedAt) < end)
      .reduce((s, d) => s + Number(d.value || 0), 0);
    out.push({ label: start.toLocaleString('en-US', { month: 'short' }), value, highlight: i === 0 });
  }
  return out;
}

export function bySource() {
  const deals = store.all('deals');
  const sources = [...new Set(deals.map((d) => d.source).filter(Boolean))];
  return sources.map((src) => {
    const list = deals.filter((d) => d.source === src);
    const closed = list.filter((d) => d.status !== 'open');
    const won = closed.filter((d) => d.status === 'won');
    return {
      source: src,
      count: list.length,
      value: list.reduce((n, d) => n + Number(d.value || 0), 0),
      wonValue: won.reduce((n, d) => n + Number(d.value || 0), 0),
      winRate: closed.length ? won.length / closed.length : null,
    };
  }).sort((a, b) => b.value - a.value);
}

export function byOwner() {
  return store.all('users').map((u) => {
    const list = store.all('deals').filter((d) => d.ownerId === u.id);
    const open = list.filter((d) => d.status === 'open');
    const closed = list.filter((d) => d.status !== 'open');
    const won = closed.filter((d) => d.status === 'won');
    return {
      user: u,
      openCount: open.length,
      openValue: open.reduce((n, d) => n + Number(d.value || 0), 0),
      wonValue: won.reduce((n, d) => n + Number(d.value || 0), 0),
      winRate: closed.length ? won.length / closed.length : null,
    };
  });
}
