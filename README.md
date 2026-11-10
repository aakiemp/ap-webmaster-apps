# AP Webmaster Apps

WordPress plugin that serves interactive business-software demos on
apwebmaster.com: a marketplace at `/apps/` and a demo dashboard at
`/apps/demo/` (CRM & Sales Pipeline is live; more apps are listed as coming
soon). Demo data stays in each visitor's browser; nothing is emailed,
texted or charged.

- [Overview](docs/OVERVIEW.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Design system](docs/DESIGN-SYSTEM.md)
- [App catalog](docs/APP-CATALOG.md)
- [Status](docs/STATUS.md) and [backlog](docs/BACKLOG.md)
- [Deployment](docs/DEPLOYMENT.md) and [rollback](docs/ROLLBACK.md)
- [Next actions](docs/NEXT-ACTIONS.md)

Run locally without WordPress:

```
php -S 127.0.0.1:8080 dev/router.php
# open http://127.0.0.1:8080/apps/demo/
```
