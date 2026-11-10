# Design system

A traditional, restrained SaaS look: navy chrome, white surfaces, one blue
accent, small radii, light borders and shadows. No gradients, glow or
oversized cards.

## Tokens (`assets/css/tokens.css`)

All tokens live on `.apwa-scope`, so they apply only inside our pages.

- **Brand:** `--apwa-brand-50` to `--apwa-brand-800` (primary `#1f5bd0`).
  These are placeholders until checked against the live site's colors.
- **Chrome:** `--apwa-navy-*` for the sidebar and dark surfaces.
- **Neutrals:** `--apwa-gray-0` to `--apwa-gray-900`.
- **Status:** green, amber, red, purple, teal, pink at `-50` (fill) and
  `-600/-700` (text).
- **Semantic:** `--apwa-bg`, `--apwa-surface`, `--apwa-border`,
  `--apwa-text`, `--apwa-text-2`, `--apwa-text-3`, `--apwa-primary`, `--apwa-focus`.
- **Type:** system font stack, sizes 11.5 to 22px, tabular numbers for money.
- **Layout:** sidebar 236px, icon rail 64px, top bar 56px, phone tab bar 58px,
  safe-area insets.

To rebrand, change the brand and navy values and the font stack. Nothing else
hard-codes a brand color.

## Breakpoints

| Width | Layout |
| --- | --- |
| 1200px and up | Full sidebar |
| 768 to 1199px | Icon rail, single-column grids from 992px down |
| Under 768px | Top bar with back button, bottom tab bar, floating action button, bottom sheets, card lists instead of tables, swipeable pipeline stages, 16px inputs (no iOS zoom) |

## Components

Buttons (primary, secondary, danger, success, ghost, small), icon buttons,
badges, avatars, cards, stat tiles, tables with sortable headers that turn
into card lists on phones, toolbars, search inputs, selects, segmented
controls, tabs, form grid with validation, modal, side drawer, bottom sheet,
dropdown menu (action sheet on phones), popover, toasts, timeline, bar list,
column chart, meter, kanban board, callouts and empty states.

Every class starts with `.apwa-` (shared) or the app's own prefix (`.crm-`).
Element resets use `:where()` so they never outrank a component.

## Icons

One source, `assets/icons/icons.json` (Lucide-style 24px outline paths),
rendered by `Renderer::icon()` in PHP and `icon()` in JS.

## Writing in the UI

- Say what happened in plain words. Simulated actions say they were simulated.
- Every control works, or it is clearly marked "Soon" or disabled.
