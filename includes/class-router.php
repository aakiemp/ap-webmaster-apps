<?php
/**
 * Routes owned by the plugin: /apps/, /apps/demo/, /apps/demo/<app>/...
 *
 * @package APWebmaster\Apps
 */

namespace APWebmaster\Apps;

defined( 'ABSPATH' ) || exit;

/**
 * Rewrite rules and request dispatch.
 */
final class Router {

	const QV_ROUTE = 'apwa_route';
	const QV_APP   = 'apwa_app';
	const RULES_OPTION = 'apwa_rules_version';

	/**
	 * Hook in.
	 */
	public static function init() {
		add_action( 'init', array( __CLASS__, 'add_rules' ) );
		add_action( 'init', array( __CLASS__, 'maybe_flush' ), 99 );
		add_filter( 'query_vars', array( __CLASS__, 'query_vars' ) );
		add_action( 'template_redirect', array( __CLASS__, 'dispatch' ), 0 );
		add_filter( 'redirect_canonical', array( __CLASS__, 'no_canonical_redirect' ), 10, 2 );
	}

	/**
	 * Register rewrite rules. Only paths under the base belong to us.
	 */
	public static function add_rules() {
		$b = preg_quote( Settings::base(), '#' );
		add_rewrite_rule( '^' . $b . '/demo/manifest\.webmanifest$', 'index.php?' . self::QV_ROUTE . '=manifest', 'top' );
		add_rewrite_rule( '^' . $b . '/demo/sw\.js$', 'index.php?' . self::QV_ROUTE . '=sw', 'top' );
		add_rewrite_rule( '^' . $b . '/demo/?$', 'index.php?' . self::QV_ROUTE . '=demo', 'top' );
		add_rewrite_rule( '^' . $b . '/demo/([a-z0-9-]+)(?:/.*)?$', 'index.php?' . self::QV_ROUTE . '=demo&' . self::QV_APP . '=$matches[1]', 'top' );
		add_rewrite_rule( '^' . $b . '/?$', 'index.php?' . self::QV_ROUTE . '=marketplace', 'top' );
	}

	/**
	 * Flush once after a deploy that changed the rules (cheap: compares one option).
	 */
	public static function maybe_flush() {
		if ( get_option( self::RULES_OPTION ) !== RULES_VERSION . '|' . Settings::base() ) {
			flush_rewrite_rules( false );
			update_option( self::RULES_OPTION, RULES_VERSION . '|' . Settings::base(), false );
		}
	}

	/**
	 * Allow our query vars.
	 *
	 * @param array $vars Query vars.
	 * @return array
	 */
	public static function query_vars( $vars ) {
		$vars[] = self::QV_ROUTE;
		$vars[] = self::QV_APP;
		return $vars;
	}

	/**
	 * Keep WordPress from "correcting" our URLs to other pages.
	 *
	 * @param string|false $redirect Redirect target.
	 * @param string       $requested Requested URL.
	 * @return string|false
	 */
	public static function no_canonical_redirect( $redirect, $requested ) {
		return get_query_var( self::QV_ROUTE ) ? false : $redirect;
	}

	/**
	 * Serve our routes; leave every other request alone.
	 */
	public static function dispatch() {
		$route = get_query_var( self::QV_ROUTE );
		if ( ! $route ) {
			return;
		}

		if ( ! Settings::can_view() ) {
			// Not launched yet: behave exactly like a page that doesn't exist.
			global $wp_query;
			$wp_query->set_404();
			status_header( 404 );
			nocache_headers();
			return;
		}

		if ( ! Settings::is_public() ) {
			nocache_headers();
			header( 'X-Robots-Tag: noindex, nofollow', true );
		}

		switch ( $route ) {
			case 'manifest':
				Pwa::manifest();
				exit;
			case 'sw':
				Pwa::service_worker();
				exit;
			case 'marketplace':
				Renderer::marketplace();
				exit;
			case 'demo':
				$app = sanitize_key( (string) get_query_var( self::QV_APP ) );
				if ( $app && ! Registry::get( $app ) ) {
					global $wp_query;
					$wp_query->set_404();
					status_header( 404 );
					return;
				}
				Renderer::app_shell( $app );
				exit;
		}
	}

	/**
	 * Public URL helpers.
	 *
	 * @param string $path Path below the base.
	 * @return string
	 */
	public static function url( $path = '' ) {
		return home_url( '/' . Settings::base() . '/' . ltrim( $path, '/' ) );
	}

	/**
	 * Absolute path (no host) of the demo app, with trailing slash.
	 *
	 * @return string
	 */
	public static function demo_path() {
		$path = wp_parse_url( self::url( 'demo/' ), PHP_URL_PATH );
		return $path ? trailingslashit( $path ) : '/' . Settings::base() . '/demo/';
	}
}
