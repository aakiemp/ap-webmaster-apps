# Status

_Last updated: 10 Nov 2026_

| Area | State |
| --- | --- |
| Plugin foundation (routes, preview gate, settings, PWA) | Done, not yet on the live site |
| App shell, design system, components | Done |
| CRM & Sales Pipeline demo | Done |
| Marketplace page | Done |
| Deploy workflow (GitHub Actions over FTPS) | Written, not yet run |
| Booking Manager | Demo live (calendar, requests, bookings, booking page, settings) |
| AI Document Processor, Email Campaigns, Quote Recovery | Not started (listed as coming soon) |
| Public launch | Not launched. Needs the owner's approval |

## Tested

- Locally with `dev/router.php` and headless Chromium at 1440px, 900px and
  390px: no horizontal overflow on any screen, no console errors.
- Click-through on desktop and phone: add contact with validation, log
  activity, simulated email notice, open deal, mark won, drag a deal between
  stages, list view and search, global search, Demo Mode panel, reset,
  data persists after reload.
- PHP syntax on 8.3 (code written to run on 7.4+). Not yet run inside a real
  WordPress install.

## Known gaps

- Brand colors, logo and font are placeholders.
- The default inquiry link is `/contact/`; change it in settings if that page
  doesn't exist.
