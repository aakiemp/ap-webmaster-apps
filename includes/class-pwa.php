<?php
/**
 * Progressive Web App support, scoped to /apps/demo/ only.
 *
 * @package APWebmaster\Apps
 */

namespace APWebmaster\Apps;

defined( 'ABSPATH' ) || exit;

/**
 * Manifest and service worker served from inside the demo path so their
 * scope can never reach the rest of the website.
 */
final class Pwa {

	/**
	 * Output the web app manifest.
	 */
	public static function manifest() {
		$scope = Router::demo_path();
		$icons = APWA_URL . 'assets/icons/';
		$data  = array(
			'name'             => __( 'AP Webmaster Apps', 'ap-webmaster-apps' ),
			'short_name'       => __( 'AP Apps', 'ap-webmaster-apps' ),
			'description'      => __( 'Interactive business software demos by AP Webmaster.', 'ap-webmaster-apps' ),
			'id'               => $scope,
			'start_url'        => $scope,
			'scope'            => $scope,
			'display'          => 'standalone',
			'orientation'      => 'any',
			'background_color' => '#f4f6f9',
			'theme_color'      => '#0f1b2d',
			'icons'            => array(
				array( 'src' => $icons . 'icon-192.png', 'sizes' => '192x192', 'type' => 'image/png', 'purpose' => 'any' ),
				array( 'src' => $icons . 'icon-512.png', 'sizes' => '512x512', 'type' => 'image/png', 'purpose' => 'any' ),
				array( 'src' => $icons . 'icon-maskable-512.png', 'sizes' => '512x512', 'type' => 'image/png', 'purpose' => 'maskable' ),
			),
		);
		status_header( 200 );
		header( 'Content-Type: application/manifest+json; charset=utf-8' );
		header( 'Cache-Control: public, max-age=3600' );
		echo wp_json_encode( $data, JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- JSON.
	}

	/**
	 * Output the service worker. It only caches this plugin's versioned files.
	 */
	public static function service_worker() {
		$file = APWA_DIR . 'assets/js/sw.js';
		$js   = (string) file_get_contents( $file ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- local plugin file.
		$js   = str_replace(
			array( '__APWA_VERSION__', '__APWA_ASSET_PREFIX__' ),
			array( Renderer::asset_version(), APWA_URL ),
			$js
		);
		status_header( 200 );
		header( 'Content-Type: application/javascript; charset=utf-8' );
		header( 'Cache-Control: no-cache' );
		header( 'Service-Worker-Allowed: ' . Router::demo_path() );
		echo $js; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- JavaScript file.
	}
}
