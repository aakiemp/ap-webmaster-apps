# Deployment

The plugin is uploaded by a GitHub Action over FTPS to
`public_html/wp-content/plugins/ap-webmaster-apps` on apwebmaster.com
(KnownHost, cPanel). The FTP account is locked to that one folder.

## One-time setup (done by the owner)

Repository secrets (Settings → Secrets and variables → Actions):

- `FTP_SERVER`
- `FTP_USERNAME`
- `FTP_PASSWORD`

Never paste these anywhere else. The workflow masks them in logs.

## Deploying

1. Merge the change into `main`.
2. Actions tab → **Deploy plugin** → **Run workflow**.
   - `protocol`: leave on `ftps`. Use `ftp` only if the host refuses TLS.
   - `dry_run`: tick it for a first look at what would upload.
3. The workflow checks PHP, JS and JSON syntax, then uploads only changed
   files. It skips `.github`, `docs`, `dev` and the README.

The deploy action keeps a small `.ftp-deploy-sync-state.json` file in the
plugin folder to know what changed. Deleting it just makes the next run
upload everything.

Uploading never activates the plugin and never changes anything else on the
site.

## First activation (owner only)

1. Confirm a recent backup exists (KnownHost or cPanel backup).
2. WordPress admin → Plugins → **AP Webmaster Apps** → Activate.
3. While logged in, open `/apps/demo/` and `/apps/`. Logged-out visitors get
   a 404 until launch.
4. Settings → AP Webmaster Apps: set the inquiry link to the real contact
   page. If a notice says a page already uses `/apps/`, tell the developer
   before going further.

## Launch (owner only)

1. Settings → AP Webmaster Apps → tick **Launched** → Save.
2. Purge the page cache (LiteSpeed or any caching plugin) so logged-out
   visitors see the pages.
3. Check `/apps/` and `/apps/demo/` in a private window and on a phone.

## Updates after launch

Run the workflow again. Asset URLs carry a version string, so browsers pick
up new files without a cache purge. Purge the page cache if the marketplace
copy changed.
