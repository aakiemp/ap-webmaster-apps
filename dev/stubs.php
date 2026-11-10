<?php
/**
 * Minimal WordPress stand-ins so the plugin's front end can be rendered and
 * screenshotted with `php -S` and no WordPress install. Development only;
 * this folder is excluded from deploys.
 */

define( 'ABSPATH', __DIR__ . '/' );

$GLOBALS['apwa_dev'] = array(
	'actions' => array(),
	'filters' => array(),
	'rules'   => array(),
	'qv'      => array(),
	'options' => array(
		'apwa_settings' => array( 'public' => false, 'inquiry_url' => '' ),
	),
	'styles'  => array(),
	'origin'  => ( isset( $_SERVER['HTTP_HOST'] ) ? 'http://' . $_SERVER['HTTP_HOST'] : 'http://127.0.0.1:8080' ),
);

class WP_Query {
	public $is_home = true;
	public $is_404  = false;
	public function set_404() { $this->is_404 = true; }
}
$GLOBALS['wp_query'] = new WP_Query();

function add_action( $hook, $cb, $prio = 10 ) { $GLOBALS['apwa_dev']['actions'][ $hook ][ $prio ][] = $cb; }
function add_filter( $hook, $cb, $prio = 10 ) { $GLOBALS['apwa_dev']['filters'][ $hook ][ $prio ][] = $cb; }
function do_action( $hook, ...$args ) {
	$list = isset( $GLOBALS['apwa_dev']['actions'][ $hook ] ) ? $GLOBALS['apwa_dev']['actions'][ $hook ] : array();
	ksort( $list );
	foreach ( $list as $cbs ) { foreach ( $cbs as $cb ) { call_user_func_array( $cb, $args ); } }
}
function apply_filters( $hook, $value, ...$args ) {
	$list = isset( $GLOBALS['apwa_dev']['filters'][ $hook ] ) ? $GLOBALS['apwa_dev']['filters'][ $hook ] : array();
	ksort( $list );
	foreach ( $list as $cbs ) { foreach ( $cbs as $cb ) { $value = call_user_func_array( $cb, array_merge( array( $value ), $args ) ); } }
	return $value;
}
function register_activation_hook() {}
function register_deactivation_hook() {}
function plugin_dir_path( $f ) { return dirname( $f ) . '/'; }
function plugin_dir_url( $f ) { return $GLOBALS['apwa_dev']['origin'] . '/wp-content/plugins/ap-webmaster-apps/'; }
function plugin_basename( $f ) { return 'ap-webmaster-apps/' . basename( $f ); }
function home_url( $p = '' ) { return $GLOBALS['apwa_dev']['origin'] . '/' . ltrim( $p, '/' ); }
function admin_url( $p = '' ) { return home_url( 'wp-admin/' . $p ); }
function trailingslashit( $s ) { return rtrim( $s, '/' ) . '/'; }
function is_admin() { return false; }
function get_option( $k, $d = false ) { return isset( $GLOBALS['apwa_dev']['options'][ $k ] ) ? $GLOBALS['apwa_dev']['options'][ $k ] : $d; }
function update_option( $k, $v ) { $GLOBALS['apwa_dev']['options'][ $k ] = $v; return true; }
function add_option( $k, $v ) { return update_option( $k, $v ); }
function delete_option( $k ) { unset( $GLOBALS['apwa_dev']['options'][ $k ] ); return true; }
function current_user_can() { return true; }
function get_bloginfo( $k = '' ) { return 'AP Webmaster'; }
function get_locale() { return 'en_US'; }
function __( $s ) { return $s; }
function esc_html__( $s ) { return esc_html( $s ); }
function esc_html_e( $s ) { echo esc_html( $s ); }
function esc_attr_e( $s ) { echo esc_attr( $s ); }
function _n( $a, $b, $n ) { return 1 === (int) $n ? $a : $b; }
function esc_html( $s ) { return htmlspecialchars( (string) $s, ENT_QUOTES, 'UTF-8' ); }
function esc_attr( $s ) { return esc_html( $s ); }
function esc_url( $s ) { return esc_html( $s ); }
function esc_url_raw( $s ) { return (string) $s; }
function sanitize_key( $k ) { return preg_replace( '/[^a-z0-9_\-]/', '', strtolower( (string) $k ) ); }
function wp_json_encode( $d, $o = 0 ) { return json_encode( $d, $o ); }
function wp_parse_url( $u, $c = -1 ) { return parse_url( $u, $c ); }
function add_query_arg( $k, $v, $url ) { return $url . ( false === strpos( $url, '?' ) ? '?' : '&' ) . rawurlencode( $k ) . '=' . rawurlencode( $v ); }
function status_header( $c ) { http_response_code( $c ); }
function nocache_headers() { header( 'Cache-Control: no-cache, must-revalidate, max-age=0' ); }
function get_page_by_path() { return null; }
function add_rewrite_rule( $regex, $query ) { $GLOBALS['apwa_dev']['rules'][ $regex ] = $query; }
function flush_rewrite_rules() {}
function get_query_var( $k, $d = '' ) { return isset( $GLOBALS['apwa_dev']['qv'][ $k ] ) ? $GLOBALS['apwa_dev']['qv'][ $k ] : $d; }
function wp_is_block_theme() { return empty( $_GET['theme'] ); }
function wp_enqueue_style( $h, $src, $deps = array(), $ver = '' ) { $GLOBALS['apwa_dev']['styles'][ $h ] = $src . '?ver=' . rawurlencode( $ver ); }
function wp_robots_no_robots( $r ) { return $r; }

/** Fake classic theme header/footer, with deliberately aggressive global CSS to prove our styles hold up. */
function get_header() {
	do_action( 'wp_enqueue_scripts' );
	$title = apply_filters( 'pre_get_document_title', '' );
	$classes = implode( ' ', apply_filters( 'body_class', array( 'home', 'blog', 'theme-sample' ) ) );
	echo '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>' . esc_html( $title ) . '</title>';
	echo '<style>body{margin:0;font-family:Georgia,serif;color:#222;font-size:18px;line-height:1.8} h1,h2,h3,h4{font-family:Georgia,serif;text-transform:uppercase;letter-spacing:2px;margin:1em 0;color:#900} a{color:#c00;text-decoration:underline} ul{margin:1em 2em} li{margin-bottom:1em} button{background:#900;color:#fff;border-radius:0;padding:12px 30px} p{margin-bottom:1.5em} .site-head{background:#111;color:#fff;padding:18px 24px;display:flex;justify-content:space-between} .site-head a{color:#fff} .site-foot{background:#111;color:#aaa;padding:30px 24px}</style>';
	foreach ( $GLOBALS['apwa_dev']['styles'] as $h => $src ) { echo '<link rel="stylesheet" id="' . esc_attr( $h ) . '" href="' . esc_url( $src ) . '">'; }
	echo '</head><body class="' . esc_attr( $classes ) . '"><header class="site-head"><a href="/">Sample theme header</a><nav><a href="/">Home</a> · <a href="/contact/">Contact</a></nav></header>';
}
function get_footer() { echo '<footer class="site-foot">Sample theme footer</footer></body></html>'; }
