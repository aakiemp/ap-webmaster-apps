<?php
/**
 * Marketplace at /apps/: every app with its sales copy, a link to its demo
 * and an inquiry link. Works without JavaScript; the category filter is a
 * small progressive enhancement.
 *
 * @package APWebmaster\Apps
 *
 * @var array  $apps       Apps from the registry.
 * @var array  $categories Category labels keyed by id.
 * @var string $demo_url   Demo dashboard URL.
 * @var string $inquiry    Inquiry URL.
 * @var string $layout     "theme" or "standalone".
 */

namespace APWebmaster\Apps;

defined( 'ABSPATH' ) || exit;

$apwa_used_cats = array();
foreach ( $apps as $apwa_app ) {
	if ( isset( $categories[ $apwa_app['category'] ] ) ) {
		$apwa_used_cats[ $apwa_app['category'] ] = $categories[ $apwa_app['category'] ];
	}
}
$apwa_names = array();
foreach ( $apps as $apwa_app ) {
	$apwa_names[ $apwa_app['slug'] ] = $apwa_app['name'];
}
$apwa_live  = count( array_filter( $apps, static function ( $a ) {
	return 'demo' === $a['status'];
} ) );
$apwa_title = __( 'Business Apps', 'ap-webmaster-apps' );

// The icon markup comes from the plugin's own icons.json, never from user input.
// phpcs:disable WordPress.Security.EscapeOutput.OutputNotEscaped

if ( 'standalone' === $layout ) :
	?><!doctype html>
<html lang="<?php echo esc_attr( str_replace( '_', '-', get_locale() ) ); ?>">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<?php if ( ! Settings::is_public() ) : ?>
<meta name="robots" content="noindex, nofollow">
<?php endif; ?>
<title><?php echo esc_html( $apwa_title . ' | ' . get_bloginfo( 'name' ) ); ?></title>
<link rel="icon" href="<?php echo esc_url( APWA_URL . 'assets/icons/icon.svg' ); ?>" type="image/svg+xml">
<link rel="stylesheet" href="<?php echo esc_url( Renderer::asset( 'assets/css/tokens.css' ) ); ?>">
<link rel="stylesheet" href="<?php echo esc_url( Renderer::asset( 'assets/css/marketplace.css' ) ); ?>">
</head>
<body class="apwa-mkt-body">
<header class="apwa-scope apwa-mkt-top">
	<div class="apwa-mkt-wrap apwa-mkt-top__inner">
		<a class="apwa-mkt-top__brand" href="<?php echo esc_url( home_url( '/' ) ); ?>"><span class="apwa-mkt-top__mark" aria-hidden="true">AP</span><?php echo esc_html( get_bloginfo( 'name' ) ); ?></a>
		<a class="apwa-mkt-top__link" href="<?php echo esc_url( home_url( '/' ) ); ?>"><?php esc_html_e( 'Back to the site', 'ap-webmaster-apps' ); ?></a>
	</div>
</header>
	<?php
else :
	get_header();
endif;
?>
<main id="apwa-marketplace" class="apwa-scope apwa-mkt apwa-mkt--<?php echo esc_attr( $layout ); ?>">
	<?php if ( ! Settings::is_public() ) : ?>
	<div class="apwa-mkt-preview" role="note">
		<div class="apwa-mkt-wrap"><?php echo Renderer::icon( 'lock' ); ?><span><?php esc_html_e( 'Preview: only logged-in administrators can see this page until it is launched in Settings → AP Webmaster Apps.', 'ap-webmaster-apps' ); ?></span></div>
	</div>
	<?php endif; ?>

	<section class="apwa-mkt-hero">
		<div class="apwa-mkt-wrap">
			<p class="apwa-mkt-eyebrow"><?php esc_html_e( 'AP Webmaster Apps', 'ap-webmaster-apps' ); ?></p>
			<h1 class="apwa-mkt-hero__title"><?php esc_html_e( 'Business software, set up for the way you work', 'ap-webmaster-apps' ); ?></h1>
			<p class="apwa-mkt-hero__lead"><?php esc_html_e( 'CRMs, booking tools, quote follow-up and document processing, customized for your business and installed on your website. Try the working demos with sample data before you decide.', 'ap-webmaster-apps' ); ?></p>
			<div class="apwa-mkt-hero__actions">
				<a class="apwa-mkt-btn apwa-mkt-btn--primary" href="<?php echo esc_url( $demo_url ); ?>"><?php echo Renderer::icon( 'grid' ); ?><span><?php esc_html_e( 'Open the demo dashboard', 'ap-webmaster-apps' ); ?></span></a>
				<a class="apwa-mkt-btn apwa-mkt-btn--secondary" href="<?php echo esc_url( $inquiry ); ?>"><span><?php esc_html_e( 'Talk to us about your business', 'ap-webmaster-apps' ); ?></span></a>
			</div>
			<p class="apwa-mkt-hero__note">
				<?php
				printf(
					/* translators: %d: number of apps with a live demo. */
					esc_html( _n( '%d live demo. More on the way.', '%d live demos. More on the way.', $apwa_live, 'ap-webmaster-apps' ) ),
					(int) $apwa_live
				);
				?>
			</p>
		</div>
	</section>

	<section class="apwa-mkt-catalog" aria-labelledby="apwa-mkt-catalog-title">
		<div class="apwa-mkt-wrap">
			<div class="apwa-mkt-catalog__head">
				<h2 id="apwa-mkt-catalog-title" class="apwa-mkt-h2"><?php esc_html_e( 'Browse the apps', 'ap-webmaster-apps' ); ?></h2>
				<?php if ( count( $apwa_used_cats ) > 1 ) : ?>
				<div class="apwa-mkt-filter" role="group" aria-label="<?php esc_attr_e( 'Filter by category', 'ap-webmaster-apps' ); ?>" data-apwa-filter hidden>
					<button type="button" class="apwa-mkt-filter__btn" aria-pressed="true" data-cat="all"><?php esc_html_e( 'All', 'ap-webmaster-apps' ); ?></button>
					<?php foreach ( $apwa_used_cats as $apwa_cat_id => $apwa_cat_label ) : ?>
					<button type="button" class="apwa-mkt-filter__btn" aria-pressed="false" data-cat="<?php echo esc_attr( $apwa_cat_id ); ?>"><?php echo esc_html( $apwa_cat_label ); ?></button>
					<?php endforeach; ?>
				</div>
				<?php endif; ?>
			</div>

			<div class="apwa-mkt-grid">
				<?php
				foreach ( $apps as $apwa_app ) :
					$apwa_is_demo = 'demo' === $apwa_app['status'];
					$apwa_ask     = add_query_arg( 'app', $apwa_app['slug'], $inquiry );
					?>
				<article class="apwa-mkt-card" id="app-<?php echo esc_attr( $apwa_app['slug'] ); ?>" data-category="<?php echo esc_attr( $apwa_app['category'] ); ?>">
					<header class="apwa-mkt-card__head">
						<span class="apwa-mkt-card__icon apwa-mkt-tone--<?php echo esc_attr( $apwa_app['color'] ); ?>"><?php echo Renderer::icon( $apwa_app['icon'] ); ?></span>
						<div class="apwa-mkt-card__titles">
							<h3 class="apwa-mkt-card__title"><?php echo esc_html( $apwa_app['name'] ); ?></h3>
							<span class="apwa-mkt-card__cat"><?php echo esc_html( isset( $categories[ $apwa_app['category'] ] ) ? $categories[ $apwa_app['category'] ] : '' ); ?></span>
						</div>
						<?php if ( $apwa_is_demo ) : ?>
						<span class="apwa-mkt-badge apwa-mkt-badge--live"><?php esc_html_e( 'Live demo', 'ap-webmaster-apps' ); ?></span>
						<?php else : ?>
						<span class="apwa-mkt-badge"><?php esc_html_e( 'Coming soon', 'ap-webmaster-apps' ); ?></span>
						<?php endif; ?>
					</header>

					<p class="apwa-mkt-card__tagline"><?php echo esc_html( $apwa_app['tagline'] ); ?></p>

					<?php if ( $apwa_app['problem'] ) : ?>
					<p class="apwa-mkt-card__problem"><strong><?php esc_html_e( 'The problem:', 'ap-webmaster-apps' ); ?></strong> <?php echo esc_html( $apwa_app['problem'] ); ?></p>
					<?php endif; ?>

					<?php if ( $apwa_app['benefits'] ) : ?>
					<ul class="apwa-mkt-checks">
						<?php foreach ( $apwa_app['benefits'] as $apwa_item ) : ?>
						<li><?php echo Renderer::icon( 'check' ); ?><span><?php echo esc_html( $apwa_item ); ?></span></li>
						<?php endforeach; ?>
					</ul>
					<?php endif; ?>

					<?php if ( $apwa_app['audience'] ) : ?>
					<p class="apwa-mkt-card__aud"><span><?php esc_html_e( 'Good for', 'ap-webmaster-apps' ); ?></span> <?php echo esc_html( implode( ', ', $apwa_app['audience'] ) ); ?></p>
					<?php endif; ?>

					<details class="apwa-mkt-more">
						<summary><?php esc_html_e( 'What you can try, and what we can build', 'ap-webmaster-apps' ); ?><?php echo Renderer::icon( 'chevron-down', 'apwa-mkt-more__chev' ); ?></summary>
						<div class="apwa-mkt-more__body">
							<?php if ( $apwa_app['description'] ) : ?>
							<p><?php echo esc_html( $apwa_app['description'] ); ?></p>
							<?php endif; ?>
							<?php
							$apwa_sections = array(
								array( $apwa_is_demo ? __( 'In the demo', 'ap-webmaster-apps' ) : __( 'Planned demo', 'ap-webmaster-apps' ), $apwa_app['demoFeatures'] ),
								array( __( 'Production options', 'ap-webmaster-apps' ), $apwa_app['productionOptions'] ),
								array( __( 'Customized for you', 'ap-webmaster-apps' ), $apwa_app['customization'] ),
							);
							foreach ( $apwa_sections as $apwa_section ) :
								if ( empty( $apwa_section[1] ) ) {
									continue;
								}
								?>
							<h4><?php echo esc_html( $apwa_section[0] ); ?></h4>
							<ul>
								<?php foreach ( $apwa_section[1] as $apwa_item ) : ?>
								<li><?php echo esc_html( $apwa_item ); ?></li>
								<?php endforeach; ?>
							</ul>
								<?php
							endforeach;
							$apwa_rel = array_values( array_intersect_key( $apwa_names, array_flip( (array) $apwa_app['related'] ) ) );
							if ( $apwa_rel ) :
								?>
							<p class="apwa-mkt-more__rel"><strong><?php esc_html_e( 'Works well with:', 'ap-webmaster-apps' ); ?></strong> <?php echo esc_html( implode( ', ', $apwa_rel ) ); ?></p>
							<?php endif; ?>
						</div>
					</details>

					<footer class="apwa-mkt-card__foot">
						<?php if ( $apwa_is_demo ) : ?>
						<a class="apwa-mkt-btn apwa-mkt-btn--primary" href="<?php echo esc_url( Router::url( 'demo/' . $apwa_app['slug'] . '/' ) ); ?>"><?php echo Renderer::icon( 'arrow-right' ); ?><span><?php esc_html_e( 'Try the demo', 'ap-webmaster-apps' ); ?></span></a>
						<?php else : ?>
						<span class="apwa-mkt-btn apwa-mkt-btn--disabled" aria-disabled="true"><?php echo Renderer::icon( 'clock' ); ?><span><?php esc_html_e( 'Demo coming soon', 'ap-webmaster-apps' ); ?></span></span>
						<?php endif; ?>
						<a class="apwa-mkt-btn apwa-mkt-btn--secondary" href="<?php echo esc_url( $apwa_ask ); ?>"><span><?php esc_html_e( 'Ask about installing', 'ap-webmaster-apps' ); ?></span></a>
					</footer>
				</article>
				<?php endforeach; ?>
			</div>
		</div>
	</section>

	<section class="apwa-mkt-steps" aria-labelledby="apwa-mkt-steps-title">
		<div class="apwa-mkt-wrap">
			<h2 id="apwa-mkt-steps-title" class="apwa-mkt-h2"><?php esc_html_e( 'How it works', 'ap-webmaster-apps' ); ?></h2>
			<ol class="apwa-mkt-steps__list">
				<li><span class="apwa-mkt-steps__n">1</span><div><strong><?php esc_html_e( 'Try the demo', 'ap-webmaster-apps' ); ?></strong><p><?php esc_html_e( 'Click through a working version with sample data. Nothing you do is sent anywhere.', 'ap-webmaster-apps' ); ?></p></div></li>
				<li><span class="apwa-mkt-steps__n">2</span><div><strong><?php esc_html_e( 'Tell us how you work', 'ap-webmaster-apps' ); ?></strong><p><?php esc_html_e( 'We map your stages, fields, team and the tools you already use.', 'ap-webmaster-apps' ); ?></p></div></li>
				<li><span class="apwa-mkt-steps__n">3</span><div><strong><?php esc_html_e( 'We set it up for you', 'ap-webmaster-apps' ); ?></strong><p><?php esc_html_e( 'Your version is installed on your website with your branding, then supported month to month.', 'ap-webmaster-apps' ); ?></p></div></li>
			</ol>
			<div class="apwa-mkt-cta">
				<div><strong><?php esc_html_e( 'Not sure which app fits?', 'ap-webmaster-apps' ); ?></strong><span><?php esc_html_e( 'Tell us what slows your team down and we will suggest a starting point.', 'ap-webmaster-apps' ); ?></span></div>
				<a class="apwa-mkt-btn apwa-mkt-btn--primary" href="<?php echo esc_url( $inquiry ); ?>"><span><?php esc_html_e( 'Get in touch', 'ap-webmaster-apps' ); ?></span></a>
			</div>
		</div>
	</section>
</main>
<script>
(function () {
	var bar = document.querySelector('[data-apwa-filter]');
	if (!bar) { return; }
	bar.hidden = false;
	var cards = document.querySelectorAll('#apwa-marketplace .apwa-mkt-card');
	bar.addEventListener('click', function (e) {
		var btn = e.target.closest('[data-cat]');
		if (!btn) { return; }
		var cat = btn.getAttribute('data-cat');
		bar.querySelectorAll('[data-cat]').forEach(function (b) { b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'); });
		cards.forEach(function (c) { c.hidden = cat !== 'all' && c.getAttribute('data-category') !== cat; });
	});
}());
</script>
<?php
// phpcs:enable WordPress.Security.EscapeOutput.OutputNotEscaped
if ( 'standalone' === $layout ) :
	?>
<footer class="apwa-scope apwa-mkt-foot">
	<div class="apwa-mkt-wrap">&copy; <?php echo esc_html( gmdate( 'Y' ) . ' ' . get_bloginfo( 'name' ) ); ?></div>
</footer>
</body>
</html>
	<?php
else :
	get_footer();
endif;
