<?php
/**
 * Standalone document for the Field 2 Forest demo (no theme output).
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
<meta name="apple-mobile-web-app-title" content="Field 2 Forest">
<title>Field 2 Forest · Bookings</title>
<link rel="manifest" href="<?php echo esc_url( F2f::path() . 'manifest.webmanifest' ); ?>" crossorigin="use-credentials">
<link rel="icon" href="<?php echo esc_url( APWA_URL . 'assets/f2f/img/favicon-64.png' ); ?>" type="image/png">
<link rel="apple-touch-icon" href="<?php echo esc_url( APWA_URL . 'assets/f2f/img/apple-touch-icon.png' ); ?>">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="modulepreload" href="<?php echo esc_url( F2f::asset( 'f2f.js' ) ); ?>">
<link rel="preload" as="image" href="<?php echo esc_url( APWA_URL . 'assets/f2f/img/f2f-mark.png' ); ?>" fetchpriority="high">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" media="print" onload="this.media='all'">
<link rel="stylesheet" href="<?php echo esc_url( F2f::asset( 'f2f.css' ) ); ?>">
<style>
#f2f-splash{position:fixed;inset:0;z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;background:#faf7ef;font-family:Roboto,system-ui,-apple-system,"Segoe UI",sans-serif;transition:opacity .4s ease,visibility .4s;}
#f2f-splash.out{opacity:0;visibility:hidden;}
#f2f-splash img{width:112px;height:auto;animation:f2fIn .5s ease both;}
#f2f-splash b{font-size:22px;font-weight:700;color:#42532b;letter-spacing:-.01em;animation:f2fIn .5s .08s ease both;}
#f2f-splash small{font-size:13px;color:#7c8270;animation:f2fIn .5s .14s ease both;}
#f2f-splash i{display:block;position:relative;width:120px;height:4px;margin-top:10px;border-radius:2px;background:#ece8db;overflow:hidden;}
#f2f-splash i::after{content:"";position:absolute;top:0;left:-40%;width:40%;height:100%;border-radius:2px;background:#d6a23a;animation:f2fBar 1s ease-in-out infinite;}
@keyframes f2fIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
@keyframes f2fBar{to{left:100%}}
@media (prefers-reduced-motion:reduce){#f2f-splash *{animation:none!important}}
</style>
<script>window.APWA_CONFIG = <?php echo wp_json_encode( $config, JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP ); ?>;</script>
</head>
<body class="f2f">
<div id="f2f-splash" role="status" aria-label="Loading Field 2 Forest">
	<img src="<?php echo esc_url( APWA_URL . 'assets/f2f/img/f2f-mark.png' ); ?>" alt="" width="112">
	<b>Field 2 Forest</b>
	<small>Bookings</small>
	<i aria-hidden="true"></i>
</div>
<div id="f2f-root"></div>
<noscript><p style="padding:24px;font-family:sans-serif">This demo needs JavaScript turned on.</p></noscript>
<script type="module" src="<?php echo esc_url( F2f::asset( 'f2f.js' ) ); ?>"></script>
</body>
</html>
