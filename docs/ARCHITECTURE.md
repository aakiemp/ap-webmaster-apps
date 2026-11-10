# Architecture

## Plugin (PHP, 7.4+)

Namespace `APWebmaster\Apps`, all options and hooks prefixed `apwa_`.

| File | Job |
| --- | --- |
| `ap-webmaster-apps.php` | Header, constants (`VERSION`, `RULES_VERSION`, `APWA_DIR`, `APWA_URL`), loads classes, activation hooks |
| `includes/class-plugin.php` | Boot, activate (add rules, flush once), deactivate (drop rules) |
| `includes/class-router.php` | Rewrite rules, query vars, preview gate, dispatch to a renderer |
| `includes/class-registry.php` | Reads `apps/*/app.json`, normalizes it, exposes it to PHP and JS |
| `includes/class-renderer.php` | Asset versions, import map, client config, icons, page templates |
| `includes/class-pwa.php` | Web app manifest and service worker, both scoped to `/apps/demo/` |
| `includes/class-settings.php` | `apwa_settings` option: launched flag and inquiry link |
| `includes/class-admin.php` | Settings → AP Webmaster Apps screen |
| `uninstall.php` | Deletes the plugin's two options |

### Routes

Added at the top of WordPress's rewrite rules on activation:

```
apps/demo/manifest.webmanifest  -> manifest
apps/demo/sw.js                 -> service worker
apps/demo/                      -> demo dashboard
apps/demo/<slug>/...            -> demo dashboard, opened on that app
apps/                           -> marketplace
```

The base `apps` can be changed with the `apwa_base_path` filter. When
`RULES_VERSION` changes in a deploy, rules are flushed once on the next page
load, so new routes work without reactivating.

### Pages

- **Demo dashboard** is a standalone HTML document (`templates/app-shell.php`).
  It does not call `wp_head()` or `wp_footer()`, so theme and other plugins'
  assets never load there and the app's CSS can't leak into the site.
- **Marketplace** (`templates/marketplace.php`) is a standalone landing page
  with its own header and footer (no `wp_head()`), because the theme header
  plus the Elementor header showed twice on apwebmaster.com. It uses the
  site's Customizer logo when one is set (filter `apwa_marketplace_logo`),
  otherwise an "AP" mark and the site name. The `apwa_marketplace_layout`
  filter can return `theme` to wrap it in the theme's header and footer
  instead; its CSS is then enqueued only on that route.
- **Product screenshots** on the marketplace are real captures of the demo,
  stored as `assets/img/product-*.webp`. Recapture them after visible demo
  changes (desktop 1280x800 at 2x, phone 390x844 at 2x, resized to 1600 and
  600 px wide).

### Filters

`apwa_base_path`, `apwa_is_public`, `apwa_inquiry_url`, `apwa_categories`,
`apwa_apps`, `apwa_marketplace_layout`, `apwa_marketplace_logo`.

## Front end (vanilla ES modules, no build step)

```
assets/js/app.js           entry: load data, load live app modules, mount shell
assets/js/dashboard.js     platform home
assets/js/core/dom.js      html`` templates with escaping, formatters, icons
assets/js/core/store.js    versioned localStorage store, insert/patch/remove, reset
assets/js/core/seed.js     fictional "Summit Home Services" sample data
assets/js/core/schema.js   SCHEMA_VERSION
assets/js/core/router.js   History API router under /apps/demo/
assets/js/core/shell.js    sidebar, top bar, phone tab bar, FAB, search, sheets
assets/js/core/ui.js       toasts, modal/drawer/bottom sheet, menus, confirm, validation
assets/js/core/components.js  badges, avatars, buttons, cards, stats, tables, fields, charts
assets/js/core/kanban.js   board with drag and drop (desktop) and swipeable stages (phone)
assets/js/core/metrics.js  shared pipeline numbers
apps/<slug>/<slug>.js      the app module
```

An import map gives every module URL a version string (plugin version plus the
newest file time), so a deploy busts browser caches without a build step.

### App module contract

```js
export default {
  slug: 'crm',
  nav: [{ id, path, label, icon }],             // sidebar and tab bar
  routes: [{ pattern: 'crm/contacts/:id', view, nav }],
  quickActions: [{ label, icon, onClick }],     // "New" menu
  search: (q) => [{ title, sub, href, icon }],  // global search
};
```

A view returns `{ title, subtitle, actions, body, mount(el, ctx) }`.
`actions` with `primary: true` becomes the floating button on phones.

### Demo data

- Key `apwa.demo` in `localStorage`, shape `{ schema, business, users,
  contacts, deals, activities, pipelines, ... }`.
- `SCHEMA_VERSION` plus a `MIGRATIONS` map in `store.js`. Bump the version and
  add a migration (or let it reseed) whenever the shape changes.
- If storage is blocked, the store falls back to memory and the Demo Mode
  panel says changes won't persist.
- Reset Demo restores the seed.

### PWA

The manifest and service worker are served from `/apps/demo/`, so the
installable app covers only the demo. The worker caches only this plugin's
versioned files and never caches pages or the rest of the site.

## Local development

No WordPress needed:

```
php -S 127.0.0.1:8080 dev/router.php
```

Then open `http://127.0.0.1:8080/apps/demo/` or `/apps/` (add `?theme=1` to
see the marketplace inside a sample theme). `dev/` is never deployed.
