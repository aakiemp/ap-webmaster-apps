# AP Webmaster Apps: overview

AP Webmaster Apps is a WordPress plugin that adds a suite of interactive
business-software demos to apwebmaster.com. Visitors try a working app with
fictional sample data, then ask AP Webmaster to set up a real version for
their business.

## What visitors get

| URL | What it is |
| --- | --- |
| `/apps/` | Marketplace: a landing page for the suite with product screenshots, every app's sales copy, demo links and inquiry links |
| `/apps/demo/` | Demo dashboard: one app shell with all live demos |
| `/apps/demo/crm/` | Deep link straight into an app (works for any app slug) |

## Ground rules

- **Demos only.** Everything runs in the browser with JavaScript and
  `localStorage`. There is no backend, no database table and no real email,
  text or payment. Simulated actions say so ("No email was actually sent").
- **Owns only its own pages.** The plugin adds three URL patterns and nothing
  else: no theme changes, no posts or pages created, no global CSS or JS.
- **Unlaunched by default.** Until "Launched" is ticked in
  Settings → AP Webmaster Apps, only logged-in administrators can see the
  pages. Everyone else gets the site's normal 404, and search engines are told
  not to index.
- **One plugin, many apps.** Each app is a folder under `apps/` with an
  `app.json` that describes it for the marketplace and dashboard.

## Live today

- CRM & Sales Pipeline (live demo)
- Smart Follow-Ups, Booking Manager, AI Document Processor, Email Campaigns
  (listed as "coming soon")

See [APP-CATALOG.md](APP-CATALOG.md), [STATUS.md](STATUS.md) and
[NEXT-ACTIONS.md](NEXT-ACTIONS.md).
