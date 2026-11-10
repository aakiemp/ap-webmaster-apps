# Rollback

The plugin only adds its own pages and two options, so turning it off
returns the site to exactly how it was.

## Fastest: deactivate

WordPress admin → Plugins → AP Webmaster Apps → **Deactivate**. The `/apps/`
pages disappear and the rewrite rules are removed.

## If WordPress admin won't load

cPanel → File Manager → `public_html/wp-content/plugins/` → rename
`ap-webmaster-apps` to `ap-webmaster-apps-off`. WordPress turns the plugin off
on the next page load. Rename it back to restore.

## Go back to an earlier version

Re-run **Deploy plugin** from an earlier commit: Actions → Deploy plugin →
Run workflow → pick the branch or tag. Or revert the commit on `main` and run
the workflow again.

## Remove completely

Deactivate, then Delete in the Plugins screen. `uninstall.php` removes the
`apwa_settings` and `apwa_rules_version` options. Visitors' demo data lives
only in their own browsers.

## Last resort

Restore the KnownHost or cPanel backup taken before activation.
