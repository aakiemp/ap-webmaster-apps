<?php
/**
 * Marketplace at /apps/: the landing page for the whole suite. Works without
 * JavaScript; the menu, screenshot tabs and category filter are small
 * progressive enhancements.
 *
 * @package APWebmaster\Apps
 *
 * @var array  $apps       Apps from the registry.
 * @var array  $categories Category labels keyed by id.
 * @var string $demo_url   Demo dashboard URL.
 * @var string $inquiry    Inquiry URL.
 * @var string $logo       Site logo URL or empty.
 * @var string $layout     "standalone" or "theme".
 */

namespace APWebmaster\Apps;

defined( 'ABSPATH' ) || exit;

$apwa_used_cats = array();
$apwa_names     = array();
foreach ( $apps as $apwa_app ) {
	if ( isset( $categories[ $apwa_app['category'] ] ) ) {
		$apwa_used_cats[ $apwa_app['category'] ] = $categories[ $apwa_app['category'] ];
	}
	$apwa_names[ $apwa_app['slug'] ] = $apwa_app['name'];
}
$apwa_live_apps = array_values(
	array_filter(
		$apps,
		static function ( $a ) {
			return 'demo' === $a['status'];
		}
	)
);
$apwa_featured  = $apwa_live_apps ? $apwa_live_apps[0] : null;
$apwa_site      = get_bloginfo( 'name' );
$apwa_title     = __( 'Business Apps', 'ap-webmaster-apps' );
$apwa_img       = static function ( $file ) {
	return Renderer::asset( 'assets/img/' . $file );
};

// Real screenshots of each live demo, keyed by app slug.
$apwa_shots = array(
	'crm' => array(
		array( __( 'Dashboard', 'ap-webmaster-apps' ), 'product-dashboard.webp', __( 'Demo dashboard with pipeline value, win rate and deals closing soon', 'ap-webmaster-apps' ) ),
		array( __( 'Pipeline', 'ap-webmaster-apps' ), 'product-pipeline.webp', __( 'Sales pipeline board with deals in each stage', 'ap-webmaster-apps' ) ),
		array( __( 'Contacts', 'ap-webmaster-apps' ), 'product-contacts.webp', __( 'Contact directory with search and filters', 'ap-webmaster-apps' ) ),
		array( __( 'Reports', 'ap-webmaster-apps' ), 'product-reports.webp', __( 'Pipeline reports by stage, owner and lead source', 'ap-webmaster-apps' ) ),
	),
);

// Small drawn previews for apps that have no demo screenshot yet.
$apwa_mocks = array(
	'quote-recovery'      => 'list',
	'booking-manager'     => 'calendar',
	'invoice-automation'  => 'doc',
	'document-processor'  => 'doc',
	'email-automation'    => 'chart',
	'analytics-reporting' => 'chart',
	'client-portal'       => 'calendar',
);

$apwa_nav = array(
	'#apps' => __( 'Apps', 'ap-webmaster-apps' ),
	'#why'  => __( 'Why us', 'ap-webmaster-apps' ),
	'#how'  => __( 'How it works', 'ap-webmaster-apps' ),
	'#faq'  => __( 'FAQ', 'ap-webmaster-apps' ),
);

$apwa_features = array(
	array( 'process', 'sliders', __( 'Shaped around your process', 'ap-webmaster-apps' ), __( 'Your stages, fields, lead sources and reports, so the software follows how you already sell and schedule.', 'ap-webmaster-apps' ) ),
	array( 'phone', 'smartphone', __( 'Just as good on a phone', 'ap-webmaster-apps' ), __( 'Every screen is built for phones, tablets and desktops, and it can be added to a home screen like an app.', 'ap-webmaster-apps' ) ),
	array( 'site', 'building', __( 'Lives on your website', 'ap-webmaster-apps' ), __( 'Installed on your own website under your domain, with your logo and colors.', 'ap-webmaster-apps' ) ),
	array( 'tools', 'repeat', __( 'Works with your tools', 'ap-webmaster-apps' ), __( 'Connect website forms, email, Google Workspace, Microsoft 365 or QuickBooks when you need them.', 'ap-webmaster-apps' ) ),
	array( 'team', 'users', __( 'One view for the whole team', 'ap-webmaster-apps' ), __( 'Team logins and permissions, so everyone works from the same up-to-date picture.', 'ap-webmaster-apps' ) ),
	array( 'support', 'award', __( 'Set up and supported for you', 'ap-webmaster-apps' ), __( 'We install it, set it up with you and keep it running month to month.', 'ap-webmaster-apps' ) ),
);

$apwa_faq = array(
	array( __( 'Is the demo a real app?', 'ap-webmaster-apps' ), __( 'Yes. It is the same software, running with sample data for a fictional business. You can add contacts, move deals through the pipeline and log activity.', 'ap-webmaster-apps' ) ),
	array( __( 'What happens to what I type in the demo?', 'ap-webmaster-apps' ), __( 'It stays in your own browser. Nothing is sent to us or anyone else, and "Reset demo data" puts everything back the way it started.', 'ap-webmaster-apps' ) ),
	array( __( 'Can it be changed to fit my business?', 'ap-webmaster-apps' ), __( 'Yes, that is the point. Stages, fields, lead sources, reports, branding and colors are all set up around how you work.', 'ap-webmaster-apps' ) ),
	array( __( 'Where does it run?', 'ap-webmaster-apps' ), __( 'On your own website, under your own domain. Your team signs in there from any phone, tablet or computer.', 'ap-webmaster-apps' ) ),
	array( __( 'How much does it cost?', 'ap-webmaster-apps' ), __( 'It depends on which apps you need and how much setup they take. After a short call we give you a clear quote before anything is built.', 'ap-webmaster-apps' ) ),
);

// Icon markup comes from the plugin's own icons.json and image URLs from
// Renderer::asset(); everything else is escaped where it is printed.
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
<title><?php echo esc_html( $apwa_title . ' | ' . $apwa_site ); ?></title>
<meta name="description" content="<?php esc_attr_e( 'Business apps built around the way you work: CRM, booking, quote follow-up and document tools, installed on your own website. Try the live demo.', 'ap-webmaster-apps' ); ?>">
<meta name="theme-color" content="#0b1422">
<link rel="icon" href="<?php echo esc_url( APWA_URL . 'assets/icons/favicon-64.png' ); ?>" type="image/png">
<link rel="preload" as="image" href="<?php echo esc_url( $apwa_img( 'product-dashboard.webp' ) ); ?>">
<link rel="stylesheet" href="<?php echo esc_url( Renderer::asset( 'assets/css/tokens.css' ) ); ?>">
<link rel="stylesheet" href="<?php echo esc_url( Renderer::asset( 'assets/css/marketplace.css' ) ); ?>">
</head>
<body class="apwa-mkt-body">
<a class="apwa-mkt-skip" href="#apwa-marketplace"><?php esc_html_e( 'Skip to content', 'ap-webmaster-apps' ); ?></a>
	<?php
else :
	get_header();
endif;
?>
<div class="apwa-scope apwa-mkt apwa-mkt--<?php echo esc_attr( $layout ); ?>">
	<?php if ( ! Settings::is_public() ) : ?>
	<div class="apwa-mkt-preview" role="note">
		<div class="apwa-mkt-wrap"><?php echo Renderer::icon( 'lock' ); ?><span><?php esc_html_e( 'Preview: only logged-in administrators can see this page until it is launched in Settings → AP Webmaster Apps.', 'ap-webmaster-apps' ); ?></span></div>
	</div>
	<?php endif; ?>

	<?php if ( 'standalone' === $layout ) : ?>
	<header class="apwa-mkt-nav" data-apwa-nav>
		<div class="apwa-mkt-wrap apwa-mkt-nav__inner">
			<a class="apwa-mkt-nav__brand" href="<?php echo esc_url( home_url( '/' ) ); ?>" aria-label="<?php echo esc_attr( $apwa_site ); ?>">
				<?php if ( $logo ) : ?>
				<img class="apwa-mkt-nav__logo" src="<?php echo esc_url( $logo ); ?>" alt="<?php echo esc_attr( $apwa_site ); ?>">
				<?php else : ?>
				<span class="apwa-mkt-nav__mark" aria-hidden="true">AP</span><span class="apwa-mkt-nav__name"><?php echo esc_html( $apwa_site ); ?></span>
				<?php endif; ?>
			</a>
			<nav class="apwa-mkt-nav__links" id="apwa-mkt-menu" aria-label="<?php esc_attr_e( 'Page sections', 'ap-webmaster-apps' ); ?>">
				<?php foreach ( $apwa_nav as $apwa_href => $apwa_label ) : ?>
				<a href="<?php echo esc_attr( $apwa_href ); ?>"><?php echo esc_html( $apwa_label ); ?></a>
				<?php endforeach; ?>
				<a class="apwa-mkt-nav__site" href="<?php echo esc_url( home_url( '/' ) ); ?>"><?php esc_html_e( 'Main site', 'ap-webmaster-apps' ); ?><?php echo Renderer::icon( 'external' ); ?></a>
			</nav>
			<div class="apwa-mkt-nav__actions">
				<a class="apwa-mkt-btn apwa-mkt-btn--ghost apwa-mkt-hide-phone" href="<?php echo esc_url( $inquiry ); ?>"><?php esc_html_e( 'Talk to us', 'ap-webmaster-apps' ); ?></a>
				<a class="apwa-mkt-btn apwa-mkt-btn--primary apwa-mkt-btn--sm" href="<?php echo esc_url( $demo_url ); ?>"><?php esc_html_e( 'Try the demo', 'ap-webmaster-apps' ); ?></a>
				<button type="button" class="apwa-mkt-nav__toggle" aria-controls="apwa-mkt-menu" aria-expanded="false" data-apwa-menu hidden>
					<span class="apwa-mkt-sr"><?php esc_html_e( 'Menu', 'ap-webmaster-apps' ); ?></span><?php echo Renderer::icon( 'menu', 'apwa-mkt-nav__open' ); ?><?php echo Renderer::icon( 'x', 'apwa-mkt-nav__close' ); ?>
				</button>
			</div>
		</div>
	</header>
	<?php endif; ?>

	<main id="apwa-marketplace">
		<section class="apwa-mkt-hero" aria-labelledby="apwa-mkt-hero-title">
			<div class="apwa-mkt-wrap apwa-mkt-hero__inner">
				<?php if ( $apwa_featured ) : ?>
				<a class="apwa-mkt-pill" href="<?php echo esc_url( 1 === count( $apwa_live_apps ) ? Router::url( 'demo/' . $apwa_featured['slug'] . '/' ) : $demo_url ); ?>">
					<span class="apwa-mkt-pill__tag"><?php esc_html_e( 'Live', 'ap-webmaster-apps' ); ?></span>
					<span>
					<?php
					$apwa_live_names = array_map(
						static function ( $a ) {
							return strlen( $a['name'] ) <= 16 ? $a['name'] : $a['shortName'];
						},
						$apwa_live_apps
					);
					$apwa_last_name  = array_pop( $apwa_live_names );
					$apwa_live_list  = $apwa_live_names ? implode( ', ', $apwa_live_names ) . ' ' . __( 'and', 'ap-webmaster-apps' ) . ' ' . $apwa_last_name : $apwa_last_name;
					/* translators: %s: list of app names. */
					printf( esc_html__( 'Try the %s demos', 'ap-webmaster-apps' ), esc_html( $apwa_live_list ) );
					?>
					</span>
					<?php echo Renderer::icon( 'arrow-right' ); ?>
				</a>
				<?php endif; ?>
				<h1 id="apwa-mkt-hero-title" class="apwa-mkt-hero__title"><?php esc_html_e( 'Business apps built around', 'ap-webmaster-apps' ); ?> <span class="apwa-mkt-accent"><?php esc_html_e( 'the way you work.', 'ap-webmaster-apps' ); ?></span></h1>
				<p class="apwa-mkt-hero__lead"><?php esc_html_e( 'CRM, booking, quote follow-up and document tools, customized to your process and installed on your own website. Click through a working demo before you spend a dollar.', 'ap-webmaster-apps' ); ?></p>
				<div class="apwa-mkt-hero__actions">
					<a class="apwa-mkt-btn apwa-mkt-btn--primary apwa-mkt-btn--lg" href="<?php echo esc_url( $demo_url ); ?>"><span><?php esc_html_e( 'Try the live demo', 'ap-webmaster-apps' ); ?></span><?php echo Renderer::icon( 'arrow-right' ); ?></a>
					<a class="apwa-mkt-btn apwa-mkt-btn--outline apwa-mkt-btn--lg" href="<?php echo esc_url( $inquiry ); ?>"><span><?php esc_html_e( 'Talk to us', 'ap-webmaster-apps' ); ?></span></a>
				</div>
				<ul class="apwa-mkt-hero__meta">
					<li><?php echo Renderer::icon( 'check' ); ?><?php esc_html_e( 'No sign-up', 'ap-webmaster-apps' ); ?></li>
					<li><?php echo Renderer::icon( 'check' ); ?><?php esc_html_e( 'Sample data only', 'ap-webmaster-apps' ); ?></li>
					<li><?php echo Renderer::icon( 'check' ); ?><?php esc_html_e( 'Works on any device', 'ap-webmaster-apps' ); ?></li>
				</ul>
			</div>
			<div class="apwa-mkt-wrap apwa-mkt-hero__visual">
				<figure class="apwa-mkt-frame apwa-mkt-frame--browser">
					<div class="apwa-mkt-frame__bar" aria-hidden="true"><i></i><i></i><i></i><span><?php echo esc_html( wp_parse_url( home_url( '/' ), PHP_URL_HOST ) . '/apps/demo/' ); ?></span></div>
					<img src="<?php echo esc_url( $apwa_img( 'product-dashboard.webp' ) ); ?>" width="1600" height="1000" alt="<?php esc_attr_e( 'The AP Webmaster Apps demo dashboard', 'ap-webmaster-apps' ); ?>" fetchpriority="high">
				</figure>
				<figure class="apwa-mkt-frame apwa-mkt-frame--phone">
					<img src="<?php echo esc_url( $apwa_img( 'product-phone-pipeline.webp' ) ); ?>" width="600" height="1298" alt="<?php esc_attr_e( 'The sales pipeline on a phone', 'ap-webmaster-apps' ); ?>" loading="lazy">
				</figure>
			</div>
		</section>

		<section class="apwa-mkt-trust" aria-label="<?php esc_attr_e( 'Highlights', 'ap-webmaster-apps' ); ?>">
			<div class="apwa-mkt-wrap">
				<ul class="apwa-mkt-trust__list">
					<li class="apwa-mkt-trust__item apwa-mkt-trust__item--suite">
						<span class="apwa-mkt-trust__icon" aria-hidden="true"><?php echo Renderer::icon( 'grid' ); ?></span>
						<strong><?php echo esc_html( count( $apps ) ); ?></strong>
						<span><?php esc_html_e( 'business apps in one suite', 'ap-webmaster-apps' ); ?></span>
						<span class="apwa-mkt-trust__dots" aria-hidden="true">
							<?php foreach ( $apps as $apwa_app ) : ?>
							<i class="apwa-mkt-tone--<?php echo esc_attr( $apwa_app['color'] ); ?>"><?php echo Renderer::icon( $apwa_app['icon'] ); ?></i>
							<?php endforeach; ?>
						</span>
					</li>
					<li class="apwa-mkt-trust__item apwa-mkt-trust__item--live">
						<span class="apwa-mkt-trust__icon" aria-hidden="true"><?php echo Renderer::icon( 'zap' ); ?></span>
						<strong><?php echo esc_html( count( $apwa_live_apps ) ); ?></strong>
						<span><?php echo esc_html( _n( 'live demo you can try right now', 'live demos you can try right now', count( $apwa_live_apps ), 'ap-webmaster-apps' ) ); ?></span>
						<span class="apwa-mkt-trust__meter" aria-hidden="true"><i style="width: <?php echo esc_attr( (string) round( 100 * count( $apwa_live_apps ) / max( 1, count( $apps ) ) ) ); ?>%"></i></span>
					</li>
					<li class="apwa-mkt-trust__item apwa-mkt-trust__item--shared">
						<span class="apwa-mkt-trust__icon" aria-hidden="true"><?php echo Renderer::icon( 'users' ); ?></span>
						<strong>1</strong>
						<span><?php esc_html_e( 'customer list shared by every app, so nothing is typed twice', 'ap-webmaster-apps' ); ?></span>
					</li>
					<li class="apwa-mkt-trust__item apwa-mkt-trust__item--site">
						<span class="apwa-mkt-trust__icon" aria-hidden="true"><?php echo Renderer::icon( 'lock' ); ?></span>
						<strong>1</strong>
						<span><?php esc_html_e( 'home for it all: your own website, under your name', 'ap-webmaster-apps' ); ?></span>
					</li>
				</ul>
			</div>
		</section>

		<?php if ( $apwa_featured ) : ?>
			<?php
			$apwa_f_shots = isset( $apwa_shots[ $apwa_featured['slug'] ] ) ? $apwa_shots[ $apwa_featured['slug'] ] : array();
			$apwa_f_url   = Router::url( 'demo/' . $apwa_featured['slug'] . '/' );
			?>
		<section class="apwa-mkt-section apwa-mkt-feature" aria-labelledby="apwa-mkt-feature-title">
			<div class="apwa-mkt-wrap apwa-mkt-feature__grid">
				<div class="apwa-mkt-feature__copy">
					<p class="apwa-mkt-eyebrow"><?php esc_html_e( 'Featured app · Live demo', 'ap-webmaster-apps' ); ?></p>
					<h2 id="apwa-mkt-feature-title" class="apwa-mkt-h2"><?php echo esc_html( $apwa_featured['name'] ); ?></h2>
					<p class="apwa-mkt-sub"><?php echo esc_html( $apwa_featured['tagline'] ); ?></p>
					<?php if ( $apwa_featured['benefits'] ) : ?>
					<ul class="apwa-mkt-checks apwa-mkt-checks--lg">
						<?php foreach ( $apwa_featured['benefits'] as $apwa_item ) : ?>
						<li><span class="apwa-mkt-checks__dot"><?php echo Renderer::icon( 'check' ); ?></span><span><?php echo esc_html( $apwa_item ); ?></span></li>
						<?php endforeach; ?>
					</ul>
					<?php endif; ?>
					<div class="apwa-mkt-feature__actions">
						<a class="apwa-mkt-btn apwa-mkt-btn--primary apwa-mkt-btn--lg" href="<?php echo esc_url( $apwa_f_url ); ?>"><span>
						<?php
						/* translators: %s: short app name such as CRM. */
						printf( esc_html__( 'Open the %s demo', 'ap-webmaster-apps' ), esc_html( $apwa_featured['shortName'] ? $apwa_featured['shortName'] : $apwa_featured['name'] ) );
						?>
						</span><?php echo Renderer::icon( 'arrow-right' ); ?></a>
						<a class="apwa-mkt-link" href="#app-<?php echo esc_attr( $apwa_featured['slug'] ); ?>"><?php esc_html_e( 'See everything included', 'ap-webmaster-apps' ); ?></a>
					</div>
				</div>
				<?php if ( $apwa_f_shots ) : ?>
				<div class="apwa-mkt-tabs" data-apwa-tabs>
					<div class="apwa-mkt-tabs__list" role="tablist" aria-label="<?php esc_attr_e( 'Screens', 'ap-webmaster-apps' ); ?>" hidden>
						<?php foreach ( $apwa_f_shots as $apwa_i => $apwa_shot ) : ?>
						<button type="button" role="tab" id="apwa-tab-<?php echo (int) $apwa_i; ?>" aria-controls="apwa-panel-<?php echo (int) $apwa_i; ?>" aria-selected="<?php echo 0 === $apwa_i ? 'true' : 'false'; ?>" tabindex="<?php echo 0 === $apwa_i ? '0' : '-1'; ?>"><?php echo esc_html( $apwa_shot[0] ); ?></button>
						<?php endforeach; ?>
					</div>
					<figure class="apwa-mkt-frame apwa-mkt-frame--browser">
						<div class="apwa-mkt-frame__bar" aria-hidden="true"><i></i><i></i><i></i></div>
						<?php foreach ( $apwa_f_shots as $apwa_i => $apwa_shot ) : ?>
						<div class="apwa-mkt-tabs__panel" role="tabpanel" id="apwa-panel-<?php echo (int) $apwa_i; ?>" aria-labelledby="apwa-tab-<?php echo (int) $apwa_i; ?>"<?php echo 0 === $apwa_i ? '' : ' hidden'; ?>>
							<img src="<?php echo esc_url( $apwa_img( $apwa_shot[1] ) ); ?>" width="1600" height="1000" alt="<?php echo esc_attr( $apwa_shot[2] ); ?>" loading="lazy">
						</div>
						<?php endforeach; ?>
					</figure>
				</div>
				<?php endif; ?>
			</div>
		</section>
		<?php endif; ?>

		<section class="apwa-mkt-section apwa-mkt-catalog" id="apps" aria-labelledby="apwa-mkt-catalog-title">
			<div class="apwa-mkt-wrap">
				<div class="apwa-mkt-head">
					<p class="apwa-mkt-eyebrow"><?php esc_html_e( 'The suite', 'ap-webmaster-apps' ); ?></p>
					<h2 id="apwa-mkt-catalog-title" class="apwa-mkt-h2"><?php esc_html_e( 'One suite of apps that work together', 'ap-webmaster-apps' ); ?></h2>
					<p class="apwa-mkt-sub"><?php esc_html_e( 'Start with the one that fixes your biggest headache, then add the rest as you grow.', 'ap-webmaster-apps' ); ?></p>
				</div>
				<?php if ( count( $apwa_used_cats ) > 1 ) : ?>
				<div class="apwa-mkt-filter" role="group" aria-label="<?php esc_attr_e( 'Filter by category', 'ap-webmaster-apps' ); ?>" data-apwa-filter hidden>
					<button type="button" class="apwa-mkt-filter__btn" aria-pressed="true" data-cat="all"><?php esc_html_e( 'All apps', 'ap-webmaster-apps' ); ?></button>
					<?php foreach ( $apwa_used_cats as $apwa_cat_id => $apwa_cat_label ) : ?>
					<button type="button" class="apwa-mkt-filter__btn" aria-pressed="false" data-cat="<?php echo esc_attr( $apwa_cat_id ); ?>"><?php echo esc_html( $apwa_cat_label ); ?></button>
					<?php endforeach; ?>
				</div>
				<?php endif; ?>

				<ul class="apwa-mkt-tiles" data-apwa-tiles hidden>
					<?php foreach ( $apps as $apwa_app ) : ?>
					<?php
					$apwa_state = 'demo' === $apwa_app['status'] ? 'live' : ( 'building' === $apwa_app['stage'] ? 'building' : 'soon' );
					$apwa_state_labels = array(
						'live'     => __( 'Live demo', 'ap-webmaster-apps' ),
						'building' => __( 'In progress', 'ap-webmaster-apps' ),
						'soon'     => __( 'Coming soon', 'ap-webmaster-apps' ),
					);
					?>
					<li data-category="<?php echo esc_attr( $apwa_app['category'] ); ?>">
						<div class="apwa-mkt-tile apwa-mkt-tone--<?php echo esc_attr( $apwa_app['color'] ); ?> apwa-mkt-tile--<?php echo esc_attr( $apwa_state ); ?>">
							<div class="apwa-mkt-tile__media" aria-hidden="true">
								<span class="apwa-mkt-tile__icon"><?php echo Renderer::icon( $apwa_app['icon'] ); ?></span>
								<span class="apwa-mkt-tile__state apwa-mkt-tile__state--<?php echo esc_attr( $apwa_state ); ?>"><i></i><?php echo esc_html( $apwa_state_labels[ $apwa_state ] ); ?></span>
							</div>
							<div class="apwa-mkt-tile__body">
								<button type="button" class="apwa-mkt-tile__open" data-app="<?php echo esc_attr( $apwa_app['slug'] ); ?>" aria-haspopup="dialog"><strong class="apwa-mkt-tile__name"><?php echo esc_html( $apwa_app['name'] ); ?></strong></button>
								<span class="apwa-mkt-tile__line"><?php echo esc_html( $apwa_app['tagline'] ); ?></span>
								<div class="apwa-mkt-tile__foot">
									<span class="apwa-mkt-tile__more"><?php esc_html_e( 'Details', 'ap-webmaster-apps' ); ?></span>
									<?php if ( 'live' === $apwa_state ) : ?>
									<a class="apwa-mkt-tile__demo" href="<?php echo esc_url( Router::url( 'demo/' . $apwa_app['slug'] . '/' ) ); ?>"><?php esc_html_e( 'Try demo', 'ap-webmaster-apps' ); ?><?php echo Renderer::icon( 'arrow-right' ); ?></a>
									<?php endif; ?>
								</div>
							</div>
						</div>
					</li>
					<?php endforeach; ?>
				</ul>

				<div class="apwa-mkt-grid">
					<?php
					foreach ( $apps as $apwa_app ) :
						$apwa_is_demo = 'demo' === $apwa_app['status'];
						$apwa_ask     = add_query_arg( 'app', $apwa_app['slug'], $inquiry );
						?>
					<article class="apwa-mkt-card apwa-mkt-tone--<?php echo esc_attr( $apwa_app['color'] ); ?><?php echo $apwa_is_demo ? ' apwa-mkt-card--live' : ''; ?>" id="app-<?php echo esc_attr( $apwa_app['slug'] ); ?>" data-category="<?php echo esc_attr( $apwa_app['category'] ); ?>">
						<div class="apwa-mkt-card__media" aria-hidden="true">
							<span class="apwa-mkt-card__icon"><?php echo Renderer::icon( $apwa_app['icon'] ); ?></span>
							<?php if ( isset( $apwa_shots[ $apwa_app['slug'] ] ) ) : ?>
							<img class="apwa-mkt-card__shot" src="<?php echo esc_url( $apwa_img( $apwa_shots[ $apwa_app['slug'] ][1][1] ) ); ?>" width="1600" height="1000" alt="" loading="lazy">
							<?php else : ?>
							<span class="apwa-mkt-mock apwa-mkt-mock--<?php echo esc_attr( isset( $apwa_mocks[ $apwa_app['slug'] ] ) ? $apwa_mocks[ $apwa_app['slug'] ] : 'list' ); ?>"><b></b><b></b><b></b><b></b><b></b><b></b><b></b><b></b></span>
							<?php endif; ?>
						</div>
						<div class="apwa-mkt-card__body">
						<?php if ( $apwa_is_demo ) : ?>
						<span class="apwa-mkt-badge apwa-mkt-badge--live"><i aria-hidden="true"></i><?php esc_html_e( 'Live demo', 'ap-webmaster-apps' ); ?></span>
						<?php elseif ( 'building' === $apwa_app['stage'] ) : ?>
						<span class="apwa-mkt-badge apwa-mkt-badge--building"><i aria-hidden="true"></i><?php esc_html_e( 'In progress', 'ap-webmaster-apps' ); ?></span>
						<?php else : ?>
						<span class="apwa-mkt-badge"><?php esc_html_e( 'Coming soon', 'ap-webmaster-apps' ); ?></span>
						<?php endif; ?>
						<p class="apwa-mkt-card__cat"><?php echo esc_html( isset( $categories[ $apwa_app['category'] ] ) ? $categories[ $apwa_app['category'] ] : '' ); ?></p>
						<h3 class="apwa-mkt-card__title"><?php echo esc_html( $apwa_app['name'] ); ?></h3>
						<p class="apwa-mkt-card__tagline"><?php echo esc_html( $apwa_app['tagline'] ); ?></p>

						<?php if ( $apwa_app['benefits'] ) : ?>
						<ul class="apwa-mkt-checks">
							<?php foreach ( array_slice( $apwa_app['benefits'], 0, 2 ) as $apwa_item ) : ?>
							<li><?php echo Renderer::icon( 'check' ); ?><span><?php echo esc_html( $apwa_item ); ?></span></li>
							<?php endforeach; ?>
						</ul>
						<?php endif; ?>

						<details class="apwa-mkt-more">
							<summary><span class="apwa-mkt-more__lead" aria-hidden="true"><?php echo Renderer::icon( 'list' ); ?></span><span class="apwa-mkt-more__label"><?php esc_html_e( 'Details and what is included', 'ap-webmaster-apps' ); ?></span><span class="apwa-mkt-more__chev" aria-hidden="true"><?php echo Renderer::icon( 'chevron-down' ); ?></span></summary>
							<div class="apwa-mkt-more__body">
								<?php if ( $apwa_app['problem'] ) : ?>
								<p><strong><?php esc_html_e( 'The problem:', 'ap-webmaster-apps' ); ?></strong> <?php echo esc_html( $apwa_app['problem'] ); ?></p>
								<?php endif; ?>
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
								if ( $apwa_app['audience'] ) :
									?>
								<p class="apwa-mkt-more__rel"><strong><?php esc_html_e( 'Good for:', 'ap-webmaster-apps' ); ?></strong> <?php echo esc_html( implode( ', ', $apwa_app['audience'] ) ); ?></p>
									<?php
								endif;
								$apwa_rel = array_values( array_intersect_key( $apwa_names, array_flip( (array) $apwa_app['related'] ) ) );
								if ( $apwa_rel ) :
									?>
								<p class="apwa-mkt-more__rel"><strong><?php esc_html_e( 'Works well with:', 'ap-webmaster-apps' ); ?></strong> <?php echo esc_html( implode( ', ', $apwa_rel ) ); ?></p>
								<?php endif; ?>
							</div>
						</details>

						<div class="apwa-mkt-card__foot">
							<?php if ( $apwa_is_demo ) : ?>
							<a class="apwa-mkt-btn apwa-mkt-btn--primary" href="<?php echo esc_url( Router::url( 'demo/' . $apwa_app['slug'] . '/' ) ); ?>"><span><?php esc_html_e( 'Try the demo', 'ap-webmaster-apps' ); ?></span><?php echo Renderer::icon( 'arrow-right' ); ?></a>
							<?php else : ?>
							<span class="apwa-mkt-btn apwa-mkt-btn--disabled" aria-disabled="true"><?php echo Renderer::icon( 'clock' ); ?><span><?php esc_html_e( 'Demo coming soon', 'ap-webmaster-apps' ); ?></span></span>
							<?php endif; ?>
							<a class="apwa-mkt-btn apwa-mkt-btn--secondary" href="<?php echo esc_url( $apwa_ask ); ?>"><span><?php esc_html_e( 'Ask about it', 'ap-webmaster-apps' ); ?></span></a>
						</div>
						</div>
					</article>
					<?php endforeach; ?>
				</div>
			</div>
		</section>

		<section class="apwa-mkt-section apwa-mkt-why" id="why" aria-labelledby="apwa-mkt-why-title">
			<div class="apwa-mkt-wrap">
				<div class="apwa-mkt-head">
					<p class="apwa-mkt-eyebrow"><?php esc_html_e( 'Why AP Webmaster Apps', 'ap-webmaster-apps' ); ?></p>
					<h2 id="apwa-mkt-why-title" class="apwa-mkt-h2"><?php esc_html_e( 'Software that fits your business, not the other way around', 'ap-webmaster-apps' ); ?></h2>
					<p class="apwa-mkt-sub"><?php esc_html_e( 'Off-the-shelf tools make you change how you work. These are set up around you from day one.', 'ap-webmaster-apps' ); ?></p>
				</div>
				<ul class="apwa-mkt-why__grid">
					<?php foreach ( $apwa_features as $apwa_feature ) : ?>
					<li class="apwa-mkt-why__item apwa-mkt-why__item--<?php echo esc_attr( $apwa_feature[0] ); ?>">
						<span class="apwa-mkt-why__icon"><?php echo Renderer::icon( $apwa_feature[1] ); ?></span>
						<h3><?php echo esc_html( $apwa_feature[2] ); ?></h3>
						<p><?php echo esc_html( $apwa_feature[3] ); ?></p>
						<?php
						switch ( $apwa_feature[0] ) {
							case 'process':
								echo '<div class="apwa-mkt-why__viz apwa-mkt-stages" aria-hidden="true">';
								foreach ( array( __( 'New lead', 'ap-webmaster-apps' ), __( 'Site visit', 'ap-webmaster-apps' ), __( 'Quote sent', 'ap-webmaster-apps' ), __( 'Won', 'ap-webmaster-apps' ) ) as $apwa_i => $apwa_stage ) {
									echo '<span class="apwa-mkt-stages__s' . (int) $apwa_i . '">' . esc_html( $apwa_stage ) . '</span>';
								}
								echo '</div>';
								break;
							case 'phone':
								echo '<img class="apwa-mkt-why__viz apwa-mkt-why__phone" src="' . esc_url( $apwa_img( 'product-phone-dashboard.webp' ) ) . '" width="600" height="1298" alt="" loading="lazy">';
								break;
							case 'site':
								echo '<div class="apwa-mkt-why__viz apwa-mkt-urlbar" aria-hidden="true"><i></i><i></i><i></i><span>' . Renderer::icon( 'lock' ) . esc_html__( 'yourbusiness.com/apps', 'ap-webmaster-apps' ) . '</span></div>';
								break;
							case 'tools':
								echo '<div class="apwa-mkt-why__viz apwa-mkt-chips" aria-hidden="true">';
								foreach ( array( 'Web forms', 'Gmail', 'Outlook', 'Google', 'Microsoft 365', 'QuickBooks' ) as $apwa_tool ) {
									echo '<span>' . esc_html( $apwa_tool ) . '</span>';
								}
								echo '</div>';
								break;
							case 'support':
								echo '<div class="apwa-mkt-why__viz apwa-mkt-stages" aria-hidden="true">';
								foreach ( array( __( 'Setup call', 'ap-webmaster-apps' ), __( 'Your data brought in', 'ap-webmaster-apps' ), __( 'Team training', 'ap-webmaster-apps' ), __( 'Monthly care', 'ap-webmaster-apps' ) ) as $apwa_stage ) {
									echo '<span>' . esc_html( $apwa_stage ) . '</span>';
								}
								echo '</div>';
								break;
							case 'team':
								echo '<div class="apwa-mkt-why__viz apwa-mkt-avatars" aria-hidden="true"><span>JM</span><span>AR</span><span>KT</span><span>SL</span><em>+6</em></div>';
								break;
						}
						?>
					</li>
					<?php endforeach; ?>
				</ul>
			</div>
		</section>

		<section class="apwa-mkt-section apwa-mkt-mobile" aria-labelledby="apwa-mkt-mobile-title">
			<div class="apwa-mkt-wrap apwa-mkt-mobile__grid">
				<div class="apwa-mkt-mobile__phones" aria-hidden="true">
					<img class="apwa-mkt-mobile__p1" src="<?php echo esc_url( $apwa_img( 'product-phone-dashboard.webp' ) ); ?>" width="600" height="1298" alt="" loading="lazy">
					<img class="apwa-mkt-mobile__p2" src="<?php echo esc_url( $apwa_img( 'product-phone-pipeline.webp' ) ); ?>" width="600" height="1298" alt="" loading="lazy">
				</div>
				<div class="apwa-mkt-mobile__copy">
					<p class="apwa-mkt-eyebrow"><?php esc_html_e( 'Built for the field', 'ap-webmaster-apps' ); ?></p>
					<h2 id="apwa-mkt-mobile-title" class="apwa-mkt-h2"><?php esc_html_e( 'The whole app, in your pocket', 'ap-webmaster-apps' ); ?></h2>
					<p class="apwa-mkt-sub"><?php esc_html_e( 'Not a cut-down mobile view. Update a deal from the driveway, log a call between jobs and check the pipeline before your next meeting.', 'ap-webmaster-apps' ); ?></p>
					<ul class="apwa-mkt-checks apwa-mkt-checks--lg">
						<li><span class="apwa-mkt-checks__dot"><?php echo Renderer::icon( 'check' ); ?></span><span><?php esc_html_e( 'Tab bar and quick actions sized for thumbs', 'ap-webmaster-apps' ); ?></span></li>
						<li><span class="apwa-mkt-checks__dot"><?php echo Renderer::icon( 'check' ); ?></span><span><?php esc_html_e( 'Add it to your home screen like an app', 'ap-webmaster-apps' ); ?></span></li>
						<li><span class="apwa-mkt-checks__dot"><?php echo Renderer::icon( 'check' ); ?></span><span><?php esc_html_e( 'Same data on every device', 'ap-webmaster-apps' ); ?></span></li>
					</ul>
					<p class="apwa-mkt-mobile__hint"><?php echo Renderer::icon( 'smartphone' ); ?><span><?php esc_html_e( 'Open this page on your phone and tap "Try the demo" to see it for yourself.', 'ap-webmaster-apps' ); ?></span></p>
				</div>
			</div>
		</section>

		<section class="apwa-mkt-section apwa-mkt-how" id="how" aria-labelledby="apwa-mkt-how-title">
			<div class="apwa-mkt-wrap">
				<div class="apwa-mkt-head apwa-mkt-head--center">
					<p class="apwa-mkt-eyebrow"><?php esc_html_e( 'How it works', 'ap-webmaster-apps' ); ?></p>
					<h2 id="apwa-mkt-how-title" class="apwa-mkt-h2"><?php esc_html_e( 'From demo to your own app in three steps', 'ap-webmaster-apps' ); ?></h2>
				</div>
				<ol class="apwa-mkt-how__list">
					<li>
						<span class="apwa-mkt-how__n">01</span>
						<h3><?php esc_html_e( 'Try the demo', 'ap-webmaster-apps' ); ?></h3>
						<p><?php esc_html_e( 'Click through a working version with sample data. Nothing you do is sent anywhere.', 'ap-webmaster-apps' ); ?></p>
					</li>
					<li>
						<span class="apwa-mkt-how__n">02</span>
						<h3><?php esc_html_e( 'Tell us how you work', 'ap-webmaster-apps' ); ?></h3>
						<p><?php esc_html_e( 'We map your stages, fields, team and the tools you already use.', 'ap-webmaster-apps' ); ?></p>
					</li>
					<li>
						<span class="apwa-mkt-how__n">03</span>
						<h3><?php esc_html_e( 'We set it up for you', 'ap-webmaster-apps' ); ?></h3>
						<p><?php esc_html_e( 'Your version is installed on your website with your branding, then supported month to month.', 'ap-webmaster-apps' ); ?></p>
					</li>
				</ol>
			</div>
		</section>

		<section class="apwa-mkt-section apwa-mkt-faq" id="faq" aria-labelledby="apwa-mkt-faq-title">
			<div class="apwa-mkt-wrap apwa-mkt-faq__grid">
				<div class="apwa-mkt-head">
					<p class="apwa-mkt-eyebrow"><?php esc_html_e( 'FAQ', 'ap-webmaster-apps' ); ?></p>
					<h2 id="apwa-mkt-faq-title" class="apwa-mkt-h2"><?php esc_html_e( 'Questions, answered', 'ap-webmaster-apps' ); ?></h2>
					<p class="apwa-mkt-sub">
						<?php esc_html_e( 'Something else on your mind?', 'ap-webmaster-apps' ); ?>
						<a class="apwa-mkt-link" href="<?php echo esc_url( $inquiry ); ?>"><?php esc_html_e( 'Ask us directly', 'ap-webmaster-apps' ); ?></a>
					</p>
				</div>
				<div class="apwa-mkt-faq__list">
					<?php foreach ( $apwa_faq as $apwa_q ) : ?>
					<details class="apwa-mkt-faq__item">
						<summary><?php echo esc_html( $apwa_q[0] ); ?><span class="apwa-mkt-faq__sign" aria-hidden="true"><?php echo Renderer::icon( 'plus' ); ?></span></summary>
						<p><?php echo esc_html( $apwa_q[1] ); ?></p>
					</details>
					<?php endforeach; ?>
				</div>
			</div>
		</section>

		<section class="apwa-mkt-final" aria-labelledby="apwa-mkt-final-title">
			<div class="apwa-mkt-wrap apwa-mkt-final__inner">
				<div>
					<h2 id="apwa-mkt-final-title" class="apwa-mkt-h2"><?php esc_html_e( 'See what it would look like for your business', 'ap-webmaster-apps' ); ?></h2>
					<p class="apwa-mkt-sub"><?php esc_html_e( 'Tell us what slows your team down and we will show you where the apps fit, before anything is built.', 'ap-webmaster-apps' ); ?></p>
				</div>
				<div class="apwa-mkt-final__actions">
					<a class="apwa-mkt-btn apwa-mkt-btn--primary apwa-mkt-btn--lg" href="<?php echo esc_url( $inquiry ); ?>"><span><?php esc_html_e( 'Talk to us', 'ap-webmaster-apps' ); ?></span><?php echo Renderer::icon( 'arrow-right' ); ?></a>
					<a class="apwa-mkt-btn apwa-mkt-btn--outline apwa-mkt-btn--lg" href="<?php echo esc_url( $demo_url ); ?>"><span><?php esc_html_e( 'Try the live demo', 'ap-webmaster-apps' ); ?></span></a>
				</div>
			</div>
		</section>
	</main>

	<?php if ( 'standalone' === $layout ) : ?>
	<footer class="apwa-mkt-foot">
		<div class="apwa-mkt-wrap apwa-mkt-foot__inner">
			<a class="apwa-mkt-nav__brand" href="<?php echo esc_url( home_url( '/' ) ); ?>">
				<?php if ( $logo ) : ?>
				<img class="apwa-mkt-nav__logo" src="<?php echo esc_url( $logo ); ?>" alt="<?php echo esc_attr( $apwa_site ); ?>" loading="lazy">
				<?php else : ?>
				<span class="apwa-mkt-nav__mark" aria-hidden="true">AP</span><span class="apwa-mkt-nav__name"><?php echo esc_html( $apwa_site ); ?></span>
				<?php endif; ?>
			</a>
			<nav class="apwa-mkt-foot__links" aria-label="<?php esc_attr_e( 'Footer', 'ap-webmaster-apps' ); ?>">
				<a href="<?php echo esc_url( home_url( '/' ) ); ?>"><?php esc_html_e( 'Main site', 'ap-webmaster-apps' ); ?></a>
				<a href="#apps"><?php esc_html_e( 'Apps', 'ap-webmaster-apps' ); ?></a>
				<a href="<?php echo esc_url( $demo_url ); ?>"><?php esc_html_e( 'Live demo', 'ap-webmaster-apps' ); ?></a>
				<a href="<?php echo esc_url( $inquiry ); ?>"><?php esc_html_e( 'Contact', 'ap-webmaster-apps' ); ?></a>
			</nav>
			<p class="apwa-mkt-foot__copy">&copy; <?php echo esc_html( gmdate( 'Y' ) . ' ' . $apwa_site ); ?></p>
		</div>
	</footer>
	<?php endif; ?>
</div>
<script>
(function () {
	var root = document.querySelector('.apwa-mkt');
	if (!root) { return; }

	// Category filter.
	var bar = root.querySelector('[data-apwa-filter]');
	if (bar) {
		bar.hidden = false;
		var cards = root.querySelectorAll('.apwa-mkt-card');
		bar.addEventListener('click', function (e) {
			var btn = e.target.closest('[data-cat]');
			if (!btn) { return; }
			var cat = btn.getAttribute('data-cat');
			bar.querySelectorAll('[data-cat]').forEach(function (b) { b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'); });
			cards.forEach(function (c) { c.hidden = cat !== 'all' && c.getAttribute('data-category') !== cat; });
			root.querySelectorAll('[data-apwa-tiles] > li').forEach(function (c) { c.hidden = cat !== 'all' && c.getAttribute('data-category') !== cat; });
		});
	}

	// Compact app grid: each tile opens its full card in a dialog.
	var tiles = root.querySelector('[data-apwa-tiles]');
	if (tiles) {
		tiles.hidden = false;
		root.classList.add('apwa-mkt--compact');
		var modal = null;
		var current = null;
		var lastTile = null;
		var visibleTiles = function () {
			return Array.prototype.slice.call(tiles.querySelectorAll('li:not([hidden]) [data-app]'));
		};
		var closeModal = function () {
			if (!modal) { return; }
			var m = modal;
			modal = null;
			m.classList.remove('is-open');
			document.removeEventListener('keydown', onKey, true);
			setTimeout(function () { m.remove(); document.documentElement.classList.remove('apwa-mkt-lock'); }, 220);
			if (lastTile) { lastTile.focus({ preventScroll: true }); }
		};
		var show = function (slug) {
			var src = root.querySelector('#app-' + slug);
			if (!src || !modal) { return; }
			current = slug;
			var card = src.cloneNode(true);
			card.removeAttribute('id');
			card.hidden = false;
			var det = card.querySelector('details');
			if (det) { det.open = false; }
			var slot = modal.querySelector('[data-slot]');
			slot.innerHTML = '';
			slot.appendChild(card);
			slot.scrollTop = 0;
			var title = card.querySelector('.apwa-mkt-card__title');
			modal.querySelector('[role=dialog]').setAttribute('aria-label', title ? title.textContent : 'App details');
			var list = visibleTiles();
			var i = list.findIndex(function (t) { return t.getAttribute('data-app') === slug; });
			modal.querySelector('[data-nav=prev]').disabled = i <= 0;
			modal.querySelector('[data-nav=next]').disabled = i < 0 || i >= list.length - 1;
		};
		var step = function (d) {
			var list = visibleTiles();
			var i = list.findIndex(function (t) { return t.getAttribute('data-app') === current; });
			var next = list[i + d];
			if (next) { lastTile = next; show(next.getAttribute('data-app')); }
		};
		var onKey = function (e) {
			if (e.key === 'Escape') { e.preventDefault(); closeModal(); }
			else if (e.key === 'ArrowRight') { step(1); }
			else if (e.key === 'ArrowLeft') { step(-1); }
			else if (e.key === 'Tab' && modal) {
				var f = Array.prototype.slice.call(modal.querySelectorAll('a[href], button:not([disabled]), summary')).filter(function (n) { return n.offsetParent !== null; });
				if (!f.length) { return; }
				if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
				else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
			}
		};
		tiles.addEventListener('click', function (e) {
			if (e.target.closest('a')) { return; }
			var tile = e.target.closest('.apwa-mkt-tile');
			var t = tile && tile.querySelector('[data-app]');
			if (!t) { return; }
			lastTile = t;
			modal = document.createElement('div');
			modal.className = 'apwa-mkt-modal';
			modal.innerHTML = '<div class="apwa-mkt-modal__backdrop" data-close></div>' +
				'<div class="apwa-mkt-modal__panel" role="dialog" aria-modal="true">' +
				'<div class="apwa-mkt-modal__bar">' +
				'<button type="button" class="apwa-mkt-modal__btn" data-nav="prev" aria-label="Previous app">' + chev(180) + '</button>' +
				'<button type="button" class="apwa-mkt-modal__btn" data-nav="next" aria-label="Next app">' + chev(0) + '</button>' +
				'<button type="button" class="apwa-mkt-modal__btn apwa-mkt-modal__close" data-close aria-label="Close">' + xIcon + '</button>' +
				'</div><div class="apwa-mkt-modal__slot" data-slot></div></div>';
			root.appendChild(modal);
			document.documentElement.classList.add('apwa-mkt-lock');
			modal.addEventListener('click', function (ev) {
				if (ev.target.closest('[data-close]')) { closeModal(); return; }
				var n = ev.target.closest('[data-nav]');
				if (n) { step(n.getAttribute('data-nav') === 'next' ? 1 : -1); }
			});
			document.addEventListener('keydown', onKey, true);
			show(t.getAttribute('data-app'));
			requestAnimationFrame(function () { requestAnimationFrame(function () {
				if (!modal) { return; }
				modal.classList.add('is-open');
				modal.querySelector('.apwa-mkt-modal__close').focus({ preventScroll: true });
			}); });
		});
		var svg = function (inner, rot) { return '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"' + (rot ? ' style="transform:rotate(' + rot + 'deg)"' : '') + '>' + inner + '</svg>'; };
		var chev = function (rot) { return svg('<path d="m9 18 6-6-6-6"/>', rot); };
		var xIcon = svg('<path d="M18 6 6 18M6 6l12 12"/>', 0);
	}

	// Screenshot tabs.
	var tabs = root.querySelector('[data-apwa-tabs]');
	if (tabs) {
		var list = tabs.querySelector('[role=tablist]');
		var btns = Array.prototype.slice.call(list.querySelectorAll('[role=tab]'));
		list.hidden = false;
		var select = function (btn) {
			btns.forEach(function (b) {
				var on = b === btn;
				b.setAttribute('aria-selected', on ? 'true' : 'false');
				b.tabIndex = on ? 0 : -1;
				document.getElementById(b.getAttribute('aria-controls')).hidden = !on;
			});
		};
		list.addEventListener('click', function (e) {
			var btn = e.target.closest('[role=tab]');
			if (btn) { select(btn); }
		});
		list.addEventListener('keydown', function (e) {
			var i = btns.indexOf(document.activeElement);
			if (i < 0 || (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft')) { return; }
			var next = btns[(i + (e.key === 'ArrowRight' ? 1 : btns.length - 1)) % btns.length];
			select(next);
			next.focus();
			e.preventDefault();
		});
	}

	// Phone menu and header shadow.
	var nav = root.querySelector('[data-apwa-nav]');
	if (nav) {
		var toggle = nav.querySelector('[data-apwa-menu]');
		toggle.hidden = false;
		var setOpen = function (open) {
			nav.classList.toggle('is-open', open);
			toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
		};
		toggle.addEventListener('click', function () { setOpen(!nav.classList.contains('is-open')); });
		nav.querySelectorAll('.apwa-mkt-nav__links a').forEach(function (a) { a.addEventListener('click', function () { setOpen(false); }); });
		document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { setOpen(false); } });
		var onScroll = function () { nav.classList.toggle('is-scrolled', window.scrollY > 8); };
		window.addEventListener('scroll', onScroll, { passive: true });
		onScroll();
	}
}());
</script>
<?php
// phpcs:enable WordPress.Security.EscapeOutput.OutputNotEscaped
if ( 'standalone' === $layout ) :
	?>
</body>
</html>
	<?php
else :
	get_footer();
endif;
