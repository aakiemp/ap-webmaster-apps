<?php
/**
 * Booking app demo in two brands, same code:
 * - Field 2 Forest at /apps/f2f/: private, for one client. Not listed on the
 *   marketplace. Admins can always open it; anyone else needs the private
 *   share link (?k=...), which also sets a cookie for later visits.
 * - Sitter Booking at /apps/builds/sitter-booking/: an unbranded copy shown
 *   under Custom builds on /apps/. Visible like the rest of /apps/.
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
	 * Brand per build. Route prefix => settings. Colors feed the CSS variables.
	 */
	const BUILDS = array(
		'f2f' => array(
			'path'    => 'f2f',
			'private' => true,
			'name'    => 'Field 2 Forest',
			'desc'    => 'Bookings, sitters and invoices for Field 2 Forest (demo).',
			'mark'    => 'f2f-mark.png',
			'icon'    => '',
			'store'   => 'f2f',
			'theme'   => '#42532b',
			'bg'      => '#faf7ef',
			'line'    => '#ece8db',
			'muted'   => '#7c8270',
			'accent'  => '#d6a23a',
			'vars'    => '',
		),
		'sb'  => array(
			'path'    => 'builds/sitter-booking',
			'private' => false,
			'name'    => 'Sitter Booking',
			'desc'    => 'Bookings, sitters and invoices for a babysitting and pet-sitting company (demo).',
			'mark'    => 'sb-mark.svg',
			'icon'    => 'sb-',
			'store'   => 'sb',
			'theme'   => '#2f5d62',
			'bg'      => '#f5f8f8',
			'line'    => '#dde6e7',
			'muted'   => '#607174',
			'accent'  => '#e39b3c',
			'vars'    => ':root{--green:#2f5d62;--green-d:#234649;--green-l:#e6eff0;--sage:#93a7aa;--sage-l:#e9eff0;--sage-d:#4f6366;--gold:#e39b3c;--gold-d:#a0621a;--gold-l:#fbefdd;--bg:#f5f8f8;--top-bg:rgba(245,248,248,.94);--ink:#1f2d2f;--muted:#607174;--line:#dde6e7}',
		),
	);

	/**
	 * Rewrite rules (added by Router::add_rules).
	 *
	 * @param string $b Quoted base path.
	 */
	public static function add_rules( $b ) {
		foreach ( self::BUILDS as $id => $build ) {
			$p = preg_quote( $build['path'], '#' );
			add_rewrite_rule( '^' . $b . '/' . $p . '/manifest\.webmanifest$', 'index.php?' . Router::QV_ROUTE . '=' . $id . '-manifest', 'top' );
			add_rewrite_rule( '^' . $b . '/' . $p . '/sw\.js$', 'index.php?' . Router::QV_ROUTE . '=' . $id . '-sw', 'top' );
			add_rewrite_rule( '^' . $b . '/' . $p . '(?:/.*)?$', 'index.php?' . Router::QV_ROUTE . '=' . $id, 'top' );
		}
	}

	/**
	 * Which build a route belongs to, or '' when it isn't ours.
	 *
	 * @param string $route Route name.
	 * @return string
	 */
	public static function build_of( $route ) {
		$id = (string) strtok( (string) $route, '-' );
		return isset( self::BUILDS[ $id ] ) ? $id : '';
	}

	/**
	 * Settings of one build.
	 *
	 * @param string $id Build id.
	 * @return array
	 */
	public static function build( $id = 'f2f' ) {
		return isset( self::BUILDS[ $id ] ) ? self::BUILDS[ $id ] : self::BUILDS['f2f'];
	}

	/**
	 * Path of a build, with trailing slash.
	 *
	 * @param string $id Build id.
	 * @return string
	 */
	public static function path( $id = 'f2f' ) {
		$rel  = self::build( $id )['path'] . '/';
		$path = wp_parse_url( Router::url( $rel ), PHP_URL_PATH );
		return $path ? trailingslashit( $path ) : '/' . Settings::base() . '/' . $rel;
	}

	/**
	 * Full URL of a build.
	 *
	 * @param string $id Build id.
	 * @return string
	 */
	public static function url( $id = 'f2f' ) {
		return Router::url( self::build( $id )['path'] . '/' );
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
	private static function allowed( $id ) {
		if ( Settings::can_view() ) {
			return true;
		}
		if ( ! self::build( $id )['private'] ) {
			return false;
		}
		$key  = self::key();
		$hash = hash_hmac( 'sha256', 'f2f', $key );
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- read-only share key.
		$given = isset( $_GET['k'] ) ? sanitize_text_field( wp_unslash( $_GET['k'] ) ) : '';
		if ( '' !== $given && hash_equals( $key, $given ) ) {
			setcookie( self::COOKIE, $hash, time() + 90 * DAY_IN_SECONDS, self::path( 'f2f' ), '', is_ssl(), true );
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

		$id = self::build_of( $route );
		if ( $id . '-sw' === $route ) {
			self::service_worker( $id );
			exit;
		}
		if ( ! self::allowed( $id ) ) {
			global $wp_query;
			$wp_query->set_404();
			status_header( 404 );
			return;
		}
		if ( $id . '-manifest' === $route ) {
			self::manifest( $id );
			exit;
		}
		self::page( $id );
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
	private static function page( $id ) {
		status_header( 200 );
		header( 'Content-Type: text/html; charset=utf-8' );
		$icons  = Renderer::icons();
		$brand  = self::build( $id );
		$brand['id']   = $id;
		$brand['base'] = self::path( $id );
		$config = array(
			'version'  => self::version(),
			'basePath' => self::path( $id ),
			'swUrl'    => self::path( $id ) . 'sw.js',
			'brand'    => array(
				'name'  => $brand['name'],
				'mark'  => $brand['mark'],
				'store' => $brand['store'],
			),
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
	private static function manifest( $id ) {
		$b     = self::build( $id );
		$scope = self::path( $id );
		$img   = APWA_URL . 'assets/f2f/img/' . $b['icon'];
		$data  = array(
			'name'             => $b['name'],
			'short_name'       => $b['name'],
			'description'      => $b['desc'],
			'id'               => $scope,
			'start_url'        => $b['private'] ? add_query_arg( 'k', self::key(), $scope ) : $scope,
			'scope'            => $scope,
			'display'          => 'standalone',
			'orientation'      => 'portrait',
			'background_color' => $b['bg'],
			'theme_color'      => $b['theme'],
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
	 * Service worker scoped to the build's path. Same code as the main demo's.
	 *
	 * @param string $id Build id.
	 */
	private static function service_worker( $id ) {
		$js = (string) file_get_contents( APWA_DIR . 'assets/js/sw.js' ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- local plugin file.
		$js = str_replace(
			array( '__APWA_VERSION__', '__APWA_ASSET_PREFIX__', 'apwa-assets-' ),
			array( self::version(), APWA_URL . 'assets/f2f/', 'apwa-' . $id . '-' ),
			$js
		);
		status_header( 200 );
		header( 'Content-Type: application/javascript; charset=utf-8' );
		header( 'Service-Worker-Allowed: ' . self::path( $id ) );
		echo $js; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- JavaScript file.
	}
}
