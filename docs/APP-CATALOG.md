# App catalog

Each app lives in `apps/<slug>/` with an `app.json`. The marketplace,
dashboard launcher and sidebar all read from it.

## `app.json` fields

| Field | Use |
| --- | --- |
| `slug`, `name`, `shortName` | Identity. `slug` must match the folder |
| `icon`, `color` | Icon name from `icons.json`, tone (blue, green, purple, amber, teal, pink) |
| `category` | sales, scheduling, documents, operations, marketing, reporting |
| `status` | `demo` (live) or `coming-soon` |
| `order` | Sort order |
| `tagline`, `description`, `problem` | Sales copy |
| `audience`, `benefits`, `demoFeatures`, `productionOptions`, `customization` | Lists for the marketplace card |
| `related` | Other app slugs |
| `module`, `styles` | JS module and CSS files (live apps only) |
| `package` | `{ setup, monthly, addons[] }`, kept for a future pricing configurator |

## Apps

| App | Status | Category |
| --- | --- | --- |
| CRM & Sales Pipeline | Live demo | Sales & CRM |
| Smart Follow-Ups | Coming soon | Sales & CRM |
| Booking Manager | Coming soon | Booking & Scheduling |
| AI Document Processor | Coming soon | AI & Documents |
| Email Campaigns | Coming soon | Marketing |

## CRM & Sales Pipeline demo

- Contacts: search, status and owner filters, sortable table, CSV export,
  add, edit, delete, contact page with quick actions, KPIs and details.
- Activity: log notes, calls, emails (simulated) and meetings on a timeline.
- Pipeline: kanban with drag and drop, list view, filters, weighted
  forecast, deal drawer with stage stepper, mark won or lost with a reason,
  reopen.
- Reports: open pipeline, weighted forecast, won revenue, win rate, average
  deal, sales cycle, won by month, pipeline by stage, lead sources, team
  performance.

## Adding an app

1. Create `apps/<slug>/app.json` with `status: "coming-soon"`.
2. Build `apps/<slug>/<slug>.js` to the module contract in ARCHITECTURE.md,
   plus `<slug>.css` with a short class prefix.
3. Add seed data for it in `seed.js` and bump `SCHEMA_VERSION` with a migration.
4. Set `status` to `demo` and list `module` and `styles`.
