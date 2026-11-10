<?php
/**
 * Dev server: php -S 127.0.0.1:8080 dev/router.php (run from the repo root).
 *   /apps/            marketplace (standalone; add ?theme=1 for the theme layout)
 *   /apps/demo/       demo dashboard and app deep links
 *   /wp-content/plugins/ap-webmaster-apps/...  plugin files
 */

$apwa_path   = parse_url( $_SERVER['REQUEST_URI'], PHP_URL_PATH );
$apwa_prefix = '/wp-content/plugins/ap-webmaster-apps/';

if ( 0 === strpos( $apwa_path, $apwa_prefix ) ) {
	$apwa_file = realpath( dirname( __DIR__ ) . '/' . substr( $apwa_path, strlen( $apwa_prefix ) ) );
	if ( ! $apwa_file || 0 !== strpos( $apwa_file, dirname( __DIR__ ) ) || ! is_file( $apwa_file ) ) {
		http_response_code( 404 );
		return true;
	}
	$apwa_types = array( 'js' => 'text/javascript', 'css' => 'text/css', 'svg' => 'image/svg+xml', 'png' => 'image/png', 'json' => 'application/json' );
	$apwa_ext   = pathinfo( $apwa_file, PATHINFO_EXTENSION );
	header( 'Content-Type: ' . ( isset( $apwa_types[ $apwa_ext ] ) ? $apwa_types[ $apwa_ext ] : 'application/octet-stream' ) );
	readfile( $apwa_file );
	return true;
}

require __DIR__ . '/stubs.php';
require dirname( __DIR__ ) . '/ap-webmaster-apps.php';

\APWebmaster\Apps\Plugin::activate();
do_action( 'plugins_loaded' );
do_action( 'init' );

$apwa_rel = ltrim( $apwa_path, '/' );
foreach ( $GLOBALS['apwa_dev']['rules'] as $apwa_regex => $apwa_query ) {
	if ( preg_match( '#' . $apwa_regex . '#', $apwa_rel, $apwa_m ) ) {
		parse_str( preg_replace_callback( '/\$matches\[(\d+)\]/', function ( $x ) use ( $apwa_m ) { return isset( $apwa_m[ $x[1] ] ) ? $apwa_m[ $x[1] ] : ''; }, substr( $apwa_query, strlen( 'index.php?' ) ) ), $GLOBALS['apwa_dev']['qv'] );
		break;
	}
}
do_action( 'template_redirect' );
http_response_code( 404 );
echo '<h1>Not found (dev harness)</h1>';
