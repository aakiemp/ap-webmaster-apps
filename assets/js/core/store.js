/**
 * Demo state: one versioned object in localStorage, shared by every app.
 *
 * - Nothing here ever leaves the browser.
 * - SCHEMA bumps go with a migration in MIGRATIONS so returning visitors keep
 *   their changes; anything unreadable is replaced with fresh seed data.
 * - If storage is unavailable (private mode, blocked), state lives in memory.
 */
import { uid } from './dom.js';
import { createSeed } from './seed.js';
import { SCHEMA_VERSION } from './schema.js';

const KEY = 'apwa.demo';
export const SCHEMA = SCHEMA_VERSION;

/** from-version -> function(state) returning the next version's state. */
const MIGRATIONS = {
  // 1: (s) => ({ ...s, schema: 2, quotes: [] }),
};

let state = null;
let persistent = true;
const listeners = new Set();

function readStorage() {
  try {
    const rawValue = window.localStorage.getItem(KEY);
    return rawValue ? JSON.parse(rawValue) : null;
  } catch (e) {
    persistent = false;
    return null;
  }
}

function writeStorage() {
  if (!persistent) return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch (e) {
    persistent = false;
  }
}

function migrate(s) {
  let cur = s;
  while (cur && cur.schema < SCHEMA) {
    const step = MIGRATIONS[cur.schema];
    if (!step) return null;
    cur = step(cur);
  }
  return cur && cur.schema === SCHEMA ? cur : null;
}

export function load() {
  const saved = readStorage();
  state = saved ? migrate(saved) : null;
  if (!state) {
    state = createSeed();
    writeStorage();
  }
  return state;
}

export function get() {
  return state || load();
}

export function isPersistent() { return persistent; }

/** Subscribe to changes. Returns unsubscribe. */
export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function commit(change) {
  state.updatedAt = new Date().toISOString();
  writeStorage();
  listeners.forEach((fn) => {
    try { fn(change); } catch (e) { console.error(e); }
  });
}

/** Low-level: mutate the state in a function and persist. */
export function update(mutator, change = { type: 'update' }) {
  mutator(get());
  commit(change);
}

/* ---------- collection helpers ---------- */

export function all(col) { return get()[col] || []; }

export function find(col, id) { return all(col).find((r) => r.id === id) || null; }

export function insert(col, record) {
  const now = new Date().toISOString();
  const row = { id: uid(col.slice(0, 3)), createdAt: now, updatedAt: now, ...record };
  update((s) => { (s[col] = s[col] || []).unshift(row); }, { type: 'insert', col, id: row.id });
  return row;
}

export function patch(col, id, changes) {
  let row = null;
  update((s) => {
    row = (s[col] || []).find((r) => r.id === id);
    if (row) Object.assign(row, changes, { updatedAt: new Date().toISOString() });
  }, { type: 'patch', col, id });
  return row;
}

export function remove(col, id) {
  update((s) => { s[col] = (s[col] || []).filter((r) => r.id !== id); }, { type: 'remove', col, id });
}

/** Start over with fresh sample data. */
export function reset() {
  state = createSeed();
  commit({ type: 'reset' });
}

/** Lookup helpers used across apps. */
export function user(id) { return find('users', id); }
export function contact(id) { return find('contacts', id); }
export function contactName(c) { return c ? `${c.firstName} ${c.lastName}`.trim() : 'Unknown contact'; }
export function currentUser() { return find('users', get().currentUserId) || all('users')[0]; }

/** Record an activity on the shared timeline. */
export function logActivity(a) {
  const row = insert('activities', { at: new Date().toISOString(), userId: get().currentUserId, ...a });
  if (a.contactId) {
    const c = find('contacts', a.contactId);
    if (c) { c.lastActivityAt = row.at; writeStorage(); }
  }
  return row;
}
