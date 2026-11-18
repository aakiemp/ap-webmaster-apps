<?php
/**
 * Standalone document for the Field to Forest demo (no theme output).
 *
 * @package APWebmaster\Apps
 *
 * @var array $config Client config.
 */

namespace APWebmaster\Apps;

defined( 'ABSPATH' ) || exit;
?><!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<meta name="theme-color" content="#faf7ef">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="Field to Forest">
<title>Field to Forest · Bookings</title>
<link rel="manifest" href="<?php echo esc_url( F2f::path() . 'manifest.webmanifest' ); ?>" crossorigin="use-credentials">
<link rel="icon" href="<?php echo esc_url( APWA_URL . 'assets/f2f/img/favicon-64.png' ); ?>" type="image/png">
<link rel="apple-touch-icon" href="<?php echo esc_url( APWA_URL . 'assets/f2f/img/apple-touch-icon.png' ); ?>">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap">
<link rel="stylesheet" href="<?php echo esc_url( F2f::asset( 'f2f.css' ) ); ?>">
<script>window.APWA_CONFIG = <?php echo wp_json_encode( $config, JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP ); ?>;</script>
</head>
<body class="f2f">
<div id="f2f-root">
	<div class="f2f-boot" role="status">
		<img src="<?php echo esc_url( APWA_URL . 'assets/f2f/img/f2f-mark.png' ); ?>" alt="" width="96">
		<span>Loading Field to Forest…</span>
	</div>
</div>
<noscript><p style="padding:24px;font-family:sans-serif">This demo needs JavaScript turned on.</p></noscript>
<script type="module" src="<?php echo esc_url( F2f::asset( 'f2f.js' ) ); ?>"></script>
</body>
</html>
