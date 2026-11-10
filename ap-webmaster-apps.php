<?php
/**
 * Plugin Name:       AP Webmaster Apps
 * Plugin URI:        https://apwebmaster.com/apps/
 * Description:       Interactive business software demos (CRM, Smart Follow-Ups, Booking, Document Processing) served at /apps/. Demo data lives only in each visitor's browser.
 * Version:           0.1.0
 * Requires at least: 6.0
 * Requires PHP:      7.4
 * Author:            AP Webmaster
 * Author URI:        https://apwebmaster.com/
 * License:           Proprietary
 * Text Domain:       ap-webmaster-apps
 *
 * @package APWebmaster\Apps
 */

namespace APWebmaster\Apps;

defined( 'ABSPATH' ) || exit;

const VERSION = '0.1.0';

/*
 * Bump when rewrite rules change. The router flushes rules once when this
 * differs from the stored value, so a deploy that adds routes works without
 * deactivating and reactivating the plugin.
 */
const RULES_VERSION = '1';

define( 'APWA_FILE', __FILE__ );
define( 'APWA_DIR', plugin_dir_path( __FILE__ ) );
define( 'APWA_URL', plugin_dir_url( __FILE__ ) );

require_once APWA_DIR . 'includes/class-settings.php';
require_once APWA_DIR . 'includes/class-registry.php';
require_once APWA_DIR . 'includes/class-router.php';
require_once APWA_DIR . 'includes/class-pwa.php';
require_once APWA_DIR . 'includes/class-renderer.php';
require_once APWA_DIR . 'includes/class-admin.php';
require_once APWA_DIR . 'includes/class-plugin.php';

register_activation_hook( __FILE__, array( Plugin::class, 'activate' ) );
register_deactivation_hook( __FILE__, array( Plugin::class, 'deactivate' ) );

/*
 * After a deploy, clear this plugin's files from PHP's OPcache so the new
 * templates and classes are used straight away. The deploy writes build.txt.
 */
add_action(
	'plugins_loaded',
	static function () {
		$stamp = @file_get_contents( APWA_DIR . 'build.txt' ); // phpcs:ignore
		if ( ! $stamp || ! function_exists( 'opcache_invalidate' ) ) {
			return;
		}
		$stamp = trim( $stamp );
		if ( get_option( 'apwa_build' ) === $stamp ) {
			return;
		}
		$files = new \RecursiveIteratorIterator( new \RecursiveDirectoryIterator( APWA_DIR, \FilesystemIterator::SKIP_DOTS ) );
		foreach ( $files as $file ) {
			if ( 'php' === $file->getExtension() ) {
				@opcache_invalidate( $file->getPathname(), true ); // phpcs:ignore
			}
		}
		update_option( 'apwa_build', $stamp, false );
	},
	1
);

add_action( 'plugins_loaded', array( Plugin::class, 'boot' ) );
