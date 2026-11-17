<?php
/**
 * Renders the app shell and the marketplace.
 *
 * @package APWebmaster\Apps
 */

namespace APWebmaster\Apps;

defined( 'ABSPATH' ) || exit;

/**
 * Page output for plugin routes.
 */
final class Renderer {

	/**
	 * Version string that changes whenever any shipped front-end file changes.
	 *
	 * @return string
	 */
	public static function asset_version() {
		static $version = null;
		if ( null === $version ) {
			$latest = 0;
			foreach ( self::front_files() as $file ) {
				$latest = max( $latest, (int) @filemtime( $file ) ); // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged
			}
			$version = VERSION . '.' . $latest;
		}
		return $version;
	}

	/**
	 * Every JS and CSS file the front end may load.
	 *
	 * @return array Absolute paths.
	 */
	private static function front_files() {
		$files = array_merge(
			(array) glob( APWA_DIR . 'assets/js/*.js' ),
			(array) glob( APWA_DIR . 'assets/js/core/*.js' ),
			(array) glob( APWA_DIR . 'assets/css/*.css' ),
			(array) glob( APWA_DIR . 'apps/*/*.js' ),
			(array) glob( APWA_DIR . 'apps/*/*.css' )
		);
		return array_filter( $files );
	}

	/**
	 * Absolute path to plugin URL.
	 *
	 * @param string $file Absolute path inside the plugin.
	 * @return string
	 */
	private static function file_url( $file ) {
		return APWA_URL . ltrim( str_replace( '\\', '/', substr( $file, strlen( APWA_DIR ) ) ), '/' );
	}

	/**
	 * Import map that adds a version to every module URL, so a deploy never
	 * mixes old and new files from the browser cache.
	 *
	 * @return array
	 */
	private static function import_map() {
		$v       = rawurlencode( self::asset_version() );
		$imports = array();
		foreach ( self::front_files() as $file ) {
			if ( '.js' === substr( $file, -3 ) && 'sw.js' !== basename( $file ) ) {
				$url             = self::file_url( $file );
				$imports[ $url ] = $url . '?v=' . $v;
			}
		}
		return array( 'imports' => $imports );
	}

	/**
	 * Versioned asset URL.
	 *
	 * @param string $rel Path relative to the plugin root.
	 * @return string
	 */
	public static function asset( $rel ) {
		return APWA_URL . ltrim( $rel, '/' ) . '?v=' . rawurlencode( self::asset_version() );
	}

	/**
	 * Configuration handed to the browser app.
	 *
	 * @param string $app Initial app slug.
	 * @return array
	 */
	public static function client_config( $app ) {
		return array(
			'version'     => self::asset_version(),
			'basePath'    => Router::demo_path(),
			'siteUrl'     => home_url( '/' ),
			'siteName'    => get_bloginfo( 'name' ),
			'marketplace' => Router::url(),
			'inquiryUrl'  => Router::url( 'contact/' ),
			'assetsUrl'   => APWA_URL,
			'swUrl'       => Router::demo_path() . 'sw.js',
			'isPublic'    => Settings::is_public(),
			'initialApp'  => $app,
			'apps'        => Registry::for_client(),
			'icons'       => self::icons(),
		);
	}

	/**
	 * Shared icon set (SVG inner markup keyed by name), one source for PHP and JS.
	 *
	 * @return array
	 */
	public static function icons() {
		static $icons = null;
		if ( null === $icons ) {
			$json  = file_get_contents( APWA_DIR . 'assets/icons/icons.json' ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- local plugin file.
			$icons = json_decode( (string) $json, true );
			$icons = is_array( $icons ) ? $icons : array();
		}
		return $icons;
	}

	/**
	 * Inline SVG icon. Icon markup comes from the plugin's own icons.json.
	 *
	 * @param string $name  Icon name.
	 * @param string $class Extra class.
	 * @return string
	 */
	public static function icon( $name, $class = '' ) {
		$icons = self::icons();
		$inner = isset( $icons[ $name ] ) ? $icons[ $name ] : $icons['grid'];
		return '<svg class="apwa-icon ' . esc_attr( $class ) . '" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' . $inner . '</svg>';
	}

	/**
	 * Standalone HTML document for the dashboard app (no theme output).
	 *
	 * @param string $app Initial app slug or empty for the dashboard.
	 */
	public static function app_shell( $app ) {
		status_header( 200 );
		header( 'Content-Type: text/html; charset=utf-8' );
		$config     = self::client_config( $app );
		$import_map = self::import_map();
		$manifest   = Router::demo_path() . 'manifest.webmanifest';
		$current    = $app ? Registry::get( $app ) : null;
		$page_title = $current ? $current['name'] . ( $current['tag'] ? ' (' . $current['tag'] . ')' : '' ) . ' · ' . __( 'AP Webmaster Apps', 'ap-webmaster-apps' ) : __( 'AP Webmaster Apps — Demo', 'ap-webmaster-apps' );
		include APWA_DIR . 'templates/app-shell.php';
	}

	/**
	 * URL of the AP Webmaster logo shown in the marketplace header and footer.
	 *
	 * @return string Empty to fall back to an "AP" mark and the site name.
	 */
	private static function site_logo() {
		return (string) apply_filters( 'apwa_marketplace_logo', APWA_URL . 'assets/img/logo-horizontal.png' );
	}

	/**
	 * Marketplace page.
	 */
	public static function marketplace( $page = 'landing' ) {
		$apwa_page  = 'contact' === $page ? 'contact' : 'landing';
		status_header( 200 );
		$apps       = Registry::all();
		$categories = Registry::categories();
		$demo_url   = Router::url( 'demo/' );
		$inquiry    = Router::url( 'contact/' );
		$logo       = self::site_logo();
		/**
		 * "standalone" (default) renders the page as its own landing page with
		 * its own header and footer. "theme" wraps it in the site's header and
		 * footer instead; on Elementor sites that can show two headers.
		 */
		$layout = apply_filters( 'apwa_marketplace_layout', 'standalone' );
		$layout = 'standalone' === $layout ? 'standalone' : 'theme';

		if ( 'theme' === $layout ) {
			// Our styles load only on this route; the theme supplies header and footer.
			add_action(
				'wp_enqueue_scripts',
				static function () {
					$ver = self::asset_version();
					wp_enqueue_style( 'apwa-tokens', APWA_URL . 'assets/css/tokens.css', array(), $ver );
					wp_enqueue_style( 'apwa-marketplace', APWA_URL . 'assets/css/marketplace.css', array( 'apwa-tokens' ), $ver );
				}
			);
			add_filter(
				'pre_get_document_title',
				static function () {
					return ( 'contact' === get_query_var( Router::QV_ROUTE ) ? __( 'Get a quote', 'ap-webmaster-apps' ) : __( 'Business Apps', 'ap-webmaster-apps' ) ) . ' | ' . get_bloginfo( 'name' );
				}
			);
			add_filter(
				'body_class',
				static function ( $classes ) {
					$classes   = array_diff( (array) $classes, array( 'home', 'blog' ) );
					$classes[] = 'apwa-marketplace-page';
					return $classes;
				}
			);
			if ( ! Settings::is_public() ) {
				add_filter( 'wp_robots', 'wp_robots_no_robots' );
			}
			// The request matches no post, so stop themes from treating it as the blog index.
			global $wp_query;
			if ( $wp_query instanceof \WP_Query ) {
				$wp_query->is_home = false;
			}
		}

		include APWA_DIR . 'templates/marketplace.php';
	}
}
