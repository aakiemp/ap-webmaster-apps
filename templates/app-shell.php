<?php
/**
 * Standalone document for the demo dashboard. Deliberately does not call
 * wp_head()/wp_footer(), so theme and plugin assets never load here and
 * nothing here can leak into the rest of the site.
 *
 * @package APWebmaster\Apps
 *
 * @var array  $config     Client config.
 * @var array  $import_map Import map.
 * @var string $manifest   Manifest URL.
 * @var string $page_title Title.
 */

namespace APWebmaster\Apps;

defined( 'ABSPATH' ) || exit;
?><!doctype html>
<html lang="<?php echo esc_attr( str_replace( '_', '-', get_locale() ) ); ?>">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<meta name="theme-color" content="#0f1b2d">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="AP Apps">
<title><?php echo esc_html( $page_title ); ?></title>
<link rel="manifest" href="<?php echo esc_url( $manifest ); ?>">
<link rel="icon" href="<?php echo esc_url( APWA_URL . 'assets/icons/icon.svg' ); ?>" type="image/svg+xml">
<link rel="apple-touch-icon" href="<?php echo esc_url( APWA_URL . 'assets/icons/apple-touch-icon.png' ); ?>">
<link rel="stylesheet" href="<?php echo esc_url( Renderer::asset( 'assets/css/tokens.css' ) ); ?>">
<link rel="stylesheet" href="<?php echo esc_url( Renderer::asset( 'assets/css/app.css' ) ); ?>">
<script type="importmap"><?php echo wp_json_encode( $import_map, JSON_UNESCAPED_SLASHES ); ?></script>
<script>window.APWA_CONFIG = <?php echo wp_json_encode( $config, JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP ); ?>;</script>
</head>
<body class="apwa-body apwa-scope">
<div id="apwa-root" class="apwa-root" aria-live="polite">
	<div class="apwa-boot" role="status">
		<div class="apwa-boot__mark" aria-hidden="true">AP</div>
		<div class="apwa-boot__text"><?php esc_html_e( 'Loading AP Webmaster Apps…', 'ap-webmaster-apps' ); ?></div>
	</div>
</div>
<noscript><p style="padding:24px;font-family:sans-serif"><?php esc_html_e( 'This demo needs JavaScript turned on.', 'ap-webmaster-apps' ); ?></p></noscript>
<script type="module" src="<?php echo esc_url( Renderer::asset( 'assets/js/app.js' ) ); ?>"></script>
</body>
</html>
