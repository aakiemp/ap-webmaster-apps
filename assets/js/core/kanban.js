/**
 * Kanban board. Desktop: columns side by side with drag and drop.
 * Phone: one full-width column at a time, swipe between stages or tap a
 * stage chip; cards move through an action sheet instead of dragging.
 */
import { html, el, icon, on, isPhone } from './dom.js';

/**
 * @param {object} o
 * @param {Array} o.columns [{id, title, meta, items:[...] }]
 * @param {Function} o.card (item) => html for the card body
 * @param {Function} o.itemId (item) => id
 * @param {Function} o.onOpen (id) when a card is activated
 * @param {Function} o.onMove (id, toColumnId) after a drop
 * @param {string}   o.activeColumn initial column on phones
 * @param {Function} o.onColumnChange (id) when the visible phone column changes
 * @param {Function} o.empty (column) => html for an empty column
 */
export function kanban(o) {
  const root = el(html`<div class="apwa-kanban">
    <div class="apwa-kanban__chips apwa-show-phone" role="tablist" aria-label="Stages">
      ${o.columns.map((c) => html`<button type="button" role="tab" class="apwa-chip ${c.id === o.activeColumn ? 'is-active' : ''}" data-col-chip="${c.id}" aria-selected="${c.id === o.activeColumn}">
        <span>${c.title}</span><span class="apwa-chip__count">${c.items.length}</span></button>`)}
    </div>
    <div class="apwa-kanban__cols">
      ${o.columns.map((c) => html`<section class="apwa-kanban__col" data-col="${c.id}" aria-label="${c.title}">
        <header class="apwa-kanban__colhead">
          <div class="apwa-kanban__coltitle"><span>${c.title}</span><span class="apwa-kanban__count">${c.items.length}</span></div>
          ${c.meta ? html`<div class="apwa-kanban__colmeta">${c.meta}</div>` : ''}
        </header>
        <div class="apwa-kanban__list" data-drop="${c.id}">
          ${c.items.length ? c.items.map((it) => html`<article class="apwa-kcard" draggable="true" tabindex="0" data-card="${o.itemId(it)}" aria-roledescription="Draggable card">
            ${o.card(it)}
          </article>`) : html`<div class="apwa-kanban__empty">${o.empty ? o.empty(c) : 'No items'}</div>`}
        </div>
      </section>`)}
    </div>
  </div>`);

  const cols = root.querySelector('.apwa-kanban__cols');

  // Open on click / Enter.
  on(root, 'click', '[data-card]', (e, card) => {
    if (e.target.closest('a, button')) return;
    o.onOpen(card.dataset.card);
  });
  on(root, 'keydown', '[data-card]', (e, card) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); o.onOpen(card.dataset.card); }
  });

  // Desktop drag and drop.
  let dragId = null;
  on(root, 'dragstart', '[data-card]', (e, card) => {
    if (isPhone()) { e.preventDefault(); return; }
    dragId = card.dataset.card;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', dragId);
    requestAnimationFrame(() => card.classList.add('is-dragging'));
    root.classList.add('is-dragging');
  });
  on(root, 'dragend', '[data-card]', (e, card) => {
    card.classList.remove('is-dragging');
    root.classList.remove('is-dragging');
    root.querySelectorAll('.is-over').forEach((n) => n.classList.remove('is-over'));
    dragId = null;
  });
  on(root, 'dragover', '[data-drop]', (e, list) => {
    if (!dragId) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    root.querySelectorAll('.is-over').forEach((n) => n !== list.parentElement && n.classList.remove('is-over'));
    list.parentElement.classList.add('is-over');
  });
  on(root, 'dragleave', '[data-drop]', (e, list) => {
    if (!list.contains(e.relatedTarget)) list.parentElement.classList.remove('is-over');
  });
  on(root, 'drop', '[data-drop]', (e, list) => {
    e.preventDefault();
    const id = dragId || e.dataTransfer.getData('text/plain');
    list.parentElement.classList.remove('is-over');
    const from = root.querySelector(`[data-card="${CSS.escape(id)}"]`)?.closest('[data-col]')?.dataset.col;
    if (id && from !== list.dataset.drop) o.onMove(id, list.dataset.drop);
  });

  // Phone: chips scroll to a column; scrolling updates the active chip.
  const setActive = (id) => {
    root.querySelectorAll('[data-col-chip]').forEach((b) => {
      const on_ = b.dataset.colChip === id;
      b.classList.toggle('is-active', on_);
      b.setAttribute('aria-selected', String(on_));
      if (on_) b.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    });
    if (o.onColumnChange) o.onColumnChange(id);
  };
  on(root, 'click', '[data-col-chip]', (e, chip) => {
    const col = cols.querySelector(`[data-col="${CSS.escape(chip.dataset.colChip)}"]`);
    if (col) cols.scrollTo({ left: col.offsetLeft - cols.offsetLeft, behavior: 'smooth' });
    setActive(chip.dataset.colChip);
  });
  let t;
  cols.addEventListener('scroll', () => {
    if (!isPhone()) return;
    clearTimeout(t);
    t = setTimeout(() => {
      const w = cols.clientWidth;
      const i = Math.round(cols.scrollLeft / Math.max(1, cols.querySelector('[data-col]').offsetWidth + 12));
      const col = cols.querySelectorAll('[data-col]')[Math.min(i, o.columns.length - 1)];
      if (col && w) setActive(col.dataset.col);
    }, 90);
  }, { passive: true });

  // Restore the phone column after re-render.
  if (o.activeColumn) {
    requestAnimationFrame(() => {
      if (!isPhone()) return;
      const col = cols.querySelector(`[data-col="${CSS.escape(o.activeColumn)}"]`);
      if (col) cols.scrollLeft = col.offsetLeft - cols.offsetLeft;
    });
  }

  return root;
}

export const kanbanIcon = () => icon('pipeline');
