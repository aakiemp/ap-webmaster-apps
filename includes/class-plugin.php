<?php
/**
 * Bootstrap, activation and deactivation.
 *
 * @package APWebmaster\Apps
 */

namespace APWebmaster\Apps;

defined( 'ABSPATH' ) || exit;

/**
 * Plugin lifecycle.
 */
final class Plugin {

	/**
	 * Runs on plugins_loaded.
	 */
	public static function boot() {
		Router::init();
		Contact::init();
		if ( is_admin() ) {
			Admin::init();
		}
	}

	/**
	 * Activation: register our rules and rebuild the rewrite table once.
	 */
	public static function activate() {
		Router::add_rules();
		flush_rewrite_rules( false );
		update_option( Router::RULES_OPTION, RULES_VERSION . '|' . Settings::base(), false );
		if ( false === get_option( Settings::OPTION ) ) {
			add_option( Settings::OPTION, Settings::defaults(), '', false );
		}
	}

	/**
	 * Deactivation: drop the cached rewrite table so WordPress rebuilds it
	 * without our routes on the next request. Settings are kept.
	 */
	public static function deactivate() {
		delete_option( 'rewrite_rules' );
		delete_option( Router::RULES_OPTION );
	}
}
