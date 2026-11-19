<?php
/**
 * Field 2 Forest client demo at /apps/f2f/: a private, branded booking app
 * demo for one client. It is not listed on the marketplace. Admins can always
 * open it; anyone else needs the private share link (?k=...), which also
 * sets a cookie so the page keeps working after that first visit.
 *
 * Everything runs in the browser with made-up data. Nothing is sent anywhere.
 *
 * @package APWebmaster\Apps
 */

namespace APWebmaster\Apps;

defined( 'ABSPATH' ) || exit;

/**
 * Routes and page output for the Field 2 Forest demo.
 */
final class F2f {

	const KEY_OPTION = 'apwa_f2f_key';
	const COOKIE     = 'apwa_f2f';
	const DEFAULT_KEY = 'MSLb5o9VTQAH1Jjz';

	/**
	 * Rewrite rules (added by Router::add_rules).
	 *
	 * @param string $b Quoted base path.
	 */
	public static function add_rules( $b ) {
		add_rewrite_rule( '^' . $b . '/f2f/manifest\.webmanifest$', 'index.php?' . Router::QV_ROUTE . '=f2f-manifest', 'top' );
		add_rewrite_rule( '^' . $b . '/f2f/sw\.js$', 'index.php?' . Router::QV_ROUTE . '=f2f-sw', 'top' );
		add_rewrite_rule( '^' . $b . '/f2f(?:/.*)?$', 'index.php?' . Router::QV_ROUTE . '=f2f', 'top' );
	}

	/**
	 * Path of the demo, with trailing slash.
	 *
	 * @return string
	 */
	public static function path() {
		$path = wp_parse_url( Router::url( 'f2f/' ), PHP_URL_PATH );
		return $path ? trailingslashit( $path ) : '/' . Settings::base() . '/f2f/';
	}

	/**
	 * The private share key.
	 *
	 * @return string
	 */
	public static function key() {
		// Fixed default so the link can be shared right after deploy. Saving a
		// new value in the option replaces it (and turns off old links).
		$key = (string) get_option( self::KEY_OPTION, '' );
		return '' !== $key ? $key : self::DEFAULT_KEY;
	}

	/**
	 * Private link to share with the client.
	 *
	 * @return string
	 */
	public static function share_url() {
		return add_query_arg( 'k', self::key(), Router::url( 'f2f/' ) );
	}

	/**
	 * May this visitor open the demo? Sets the cookie on a valid key.
	 *
	 * @return bool
	 */
	private static function allowed() {
		if ( Settings::can_view() ) {
			return true;
		}
		$key  = self::key();
		$hash = hash_hmac( 'sha256', 'f2f', $key );
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- read-only share key.
		$given = isset( $_GET['k'] ) ? sanitize_text_field( wp_unslash( $_GET['k'] ) ) : '';
		if ( '' !== $given && hash_equals( $key, $given ) ) {
			setcookie( self::COOKIE, $hash, time() + 90 * DAY_IN_SECONDS, self::path(), '', is_ssl(), true );
			return true;
		}
		$cookie = isset( $_COOKIE[ self::COOKIE ] ) ? sanitize_text_field( wp_unslash( $_COOKIE[ self::COOKIE ] ) ) : '';
		return '' !== $cookie && hash_equals( $hash, $cookie );
	}

	/**
	 * Serve one of our routes.
	 *
	 * @param string $route Route name.
	 */
	public static function dispatch( $route ) {
		nocache_headers();
		header( 'X-Robots-Tag: noindex, nofollow', true );
		header( 'X-LiteSpeed-Cache-Control: no-cache', true );

		if ( 'f2f-sw' === $route ) {
			self::service_worker();
			exit;
		}
		if ( ! self::allowed() ) {
			global $wp_query;
			$wp_query->set_404();
			status_header( 404 );
			return;
		}
		if ( 'f2f-manifest' === $route ) {
			self::manifest();
			exit;
		}
		self::page();
		exit;
	}

	/**
	 * Version string for this demo's files.
	 *
	 * @return string
	 */
	public static function version() {
		$latest = 0;
		foreach ( (array) glob( APWA_DIR . 'assets/f2f/*.*' ) as $file ) {
			$latest = max( $latest, (int) @filemtime( $file ) ); // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged
		}
		return VERSION . '.' . $latest;
	}

	/**
	 * Versioned URL of a file in assets/f2f/.
	 *
	 * @param string $rel File below assets/f2f/.
	 * @return string
	 */
	public static function asset( $rel ) {
		return APWA_URL . 'assets/f2f/' . ltrim( $rel, '/' ) . '?v=' . rawurlencode( self::version() );
	}

	/**
	 * The page.
	 */
	private static function page() {
		status_header( 200 );
		header( 'Content-Type: text/html; charset=utf-8' );
		$icons  = Renderer::icons();
		$config = array(
			'version'  => self::version(),
			'basePath' => self::path(),
			'swUrl'    => self::path() . 'sw.js',
			'img'      => APWA_URL . 'assets/f2f/img/',
			'quoteUrl' => Router::url( 'contact/' ),
			'icons'    => $icons,
		);
		include APWA_DIR . 'templates/f2f.php';
	}

	/**
	 * Web app manifest. Start URL keeps the share key so the installed app
	 * opens even where the home screen app has its own cookies (iPhone).
	 */
	private static function manifest() {
		$scope = self::path();
		$img   = APWA_URL . 'assets/f2f/img/';
		$data  = array(
			'name'             => 'Field 2 Forest',
			'short_name'       => 'Field 2 Forest',
			'description'      => 'Bookings, sitters and invoices for Field 2 Forest (demo).',
			'id'               => $scope,
			'start_url'        => add_query_arg( 'k', self::key(), $scope ),
			'scope'            => $scope,
			'display'          => 'standalone',
			'orientation'      => 'portrait',
			'background_color' => '#faf7ef',
			'theme_color'      => '#42532b',
			'icons'            => array(
				array( 'src' => $img . 'icon-192.png', 'sizes' => '192x192', 'type' => 'image/png', 'purpose' => 'any' ),
				array( 'src' => $img . 'icon-512.png', 'sizes' => '512x512', 'type' => 'image/png', 'purpose' => 'any' ),
				array( 'src' => $img . 'icon-maskable-512.png', 'sizes' => '512x512', 'type' => 'image/png', 'purpose' => 'maskable' ),
			),
		);
		status_header( 200 );
		header( 'Content-Type: application/manifest+json; charset=utf-8' );
		echo wp_json_encode( $data, JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- JSON.
	}

	/**
	 * Service worker scoped to /apps/f2f/. Same code as the main demo's.
	 */
	private static function service_worker() {
		$js = (string) file_get_contents( APWA_DIR . 'assets/js/sw.js' ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- local plugin file.
		$js = str_replace(
			array( '__APWA_VERSION__', '__APWA_ASSET_PREFIX__', 'apwa-assets-' ),
			array( self::version(), APWA_URL . 'assets/f2f/', 'apwa-f2f-' ),
			$js
		);
		status_header( 200 );
		header( 'Content-Type: application/javascript; charset=utf-8' );
		header( 'Service-Worker-Allowed: ' . self::path() );
		echo $js; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- JavaScript file.
	}
}
