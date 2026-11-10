<?php
/**
 * Plugin settings: one small option, removed on uninstall.
 *
 * @package APWebmaster\Apps
 */

namespace APWebmaster\Apps;

defined( 'ABSPATH' ) || exit;

/**
 * Reads and writes the plugin's single option.
 */
final class Settings {

	const OPTION = 'apwa_settings';

	/**
	 * Default values.
	 *
	 * @return array
	 */
	public static function defaults() {
		return array(
			// Until Keem approves launch, app pages are visible to administrators only.
			'public'      => false,
			// Where "Ask about installing" buttons point. Empty = site contact page guess.
			'inquiry_url' => '',
		);
	}

	/**
	 * All settings merged with defaults.
	 *
	 * @return array
	 */
	public static function all() {
		$saved = get_option( self::OPTION, array() );
		return array_merge( self::defaults(), is_array( $saved ) ? $saved : array() );
	}

	/**
	 * One setting.
	 *
	 * @param string $key Setting key.
	 * @return mixed
	 */
	public static function get( $key ) {
		$all = self::all();
		return isset( $all[ $key ] ) ? $all[ $key ] : null;
	}

	/**
	 * Save settings (sanitized).
	 *
	 * @param array $values New values.
	 */
	public static function save( array $values ) {
		$clean = array(
			'public'      => ! empty( $values['public'] ),
			'inquiry_url' => isset( $values['inquiry_url'] ) ? esc_url_raw( trim( (string) $values['inquiry_url'] ) ) : '',
		);
		update_option( self::OPTION, $clean, false );
	}

	/**
	 * URL path segment that owns the app routes (default "apps").
	 *
	 * @return string
	 */
	public static function base() {
		$base = apply_filters( 'apwa_base_path', 'apps' );
		$base = trim( preg_replace( '#[^a-z0-9/_-]#', '', strtolower( (string) $base ) ), '/' );
		return '' === $base ? 'apps' : $base;
	}

	/**
	 * Is the platform launched publicly?
	 *
	 * @return bool
	 */
	public static function is_public() {
		return (bool) apply_filters( 'apwa_is_public', (bool) self::get( 'public' ) );
	}

	/**
	 * May the current visitor see app pages?
	 *
	 * @return bool
	 */
	public static function can_view() {
		return self::is_public() || current_user_can( 'manage_options' );
	}

	/**
	 * Where inquiry buttons lead.
	 *
	 * @return string
	 */
	public static function inquiry_url() {
		$url = (string) self::get( 'inquiry_url' );
		if ( '' === $url ) {
			$url = home_url( '/contact/' );
		}
		return (string) apply_filters( 'apwa_inquiry_url', $url );
	}
}
