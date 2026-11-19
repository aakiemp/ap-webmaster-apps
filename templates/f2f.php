<?php
/**
 * Standalone document for the booking app demo (no theme output).
 *
 * @package APWebmaster\Apps
 *
 * @var array $config Client config.
 * @var array $brand  Build settings (see F2f::BUILDS).
 */

namespace APWebmaster\Apps;

defined( 'ABSPATH' ) || exit;
?><!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<meta name="theme-color" content="<?php echo esc_attr( $brand['bg'] ); ?>">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="<?php echo esc_attr( $brand['name'] ); ?>">
<title><?php echo esc_html( $brand['name'] ); ?> · Bookings</title>
<link rel="manifest" href="<?php echo esc_url( $brand['base'] . 'manifest.webmanifest' ); ?>" crossorigin="use-credentials">
<link rel="icon" href="<?php echo esc_url( APWA_URL . 'assets/f2f/img/' . $brand['icon'] . 'favicon-64.png' ); ?>" type="image/png">
<link rel="apple-touch-icon" href="<?php echo esc_url( APWA_URL . 'assets/f2f/img/' . $brand['icon'] . 'apple-touch-icon.png' ); ?>">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="modulepreload" href="<?php echo esc_url( F2f::asset( 'f2f.js' ) ); ?>">
<link rel="preload" as="image" href="<?php echo esc_url( APWA_URL . 'assets/f2f/img/' . $brand['mark'] ); ?>" fetchpriority="high">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" media="print" onload="this.media='all'">
<link rel="stylesheet" href="<?php echo esc_url( F2f::asset( 'f2f.css' ) ); ?>">
<style>
#f2f-splash{position:fixed;inset:0;z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;background:<?php echo esc_attr( $brand['bg'] ); ?>;font-family:Roboto,system-ui,-apple-system,"Segoe UI",sans-serif;transition:opacity .4s ease,visibility .4s;}
#f2f-splash.out{opacity:0;visibility:hidden;}
#f2f-splash img{width:112px;height:auto;animation:f2fIn .5s ease both;}
#f2f-splash b{font-size:22px;font-weight:700;color:<?php echo esc_attr( $brand['theme'] ); ?>;letter-spacing:-.01em;animation:f2fIn .5s .08s ease both;}
#f2f-splash small{font-size:13px;color:<?php echo esc_attr( $brand['muted'] ); ?>;animation:f2fIn .5s .14s ease both;}
#f2f-splash i{display:block;position:relative;width:120px;height:4px;margin-top:10px;border-radius:2px;background:<?php echo esc_attr( $brand['line'] ); ?>;overflow:hidden;}
#f2f-splash i::after{content:"";position:absolute;top:0;left:-40%;width:40%;height:100%;border-radius:2px;background:<?php echo esc_attr( $brand['accent'] ); ?>;animation:f2fBar 1s ease-in-out infinite;}
@keyframes f2fIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
@keyframes f2fBar{to{left:100%}}
@media (prefers-reduced-motion:reduce){#f2f-splash *{animation:none!important}}
<?php echo $brand['vars']; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- fixed CSS from F2f::BUILDS. ?>
</style>
<script>window.APWA_CONFIG = <?php echo wp_json_encode( $config, JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP ); ?>;</script>
</head>
<body class="f2f">
<div id="f2f-splash" role="status" aria-label="Loading <?php echo esc_attr( $brand['name'] ); ?>">
	<img src="<?php echo esc_url( APWA_URL . 'assets/f2f/img/' . $brand['mark'] ); ?>" alt="" width="112">
	<b><?php echo esc_html( $brand['name'] ); ?></b>
	<small>Bookings</small>
	<i aria-hidden="true"></i>
</div>
<div id="f2f-root"></div>
<noscript><p style="padding:24px;font-family:sans-serif">This demo needs JavaScript turned on.</p></noscript>
<script type="module" src="<?php echo esc_url( F2f::asset( 'f2f.js' ) ); ?>"></script>
</body>
</html>
