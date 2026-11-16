<?php
/**
 * Get-a-quote page: the app they came from and the Calendly booking embed.
 * Included from templates/marketplace.php inside <main>.
 *
 * @package APWebmaster\Apps
 */

namespace APWebmaster\Apps;

defined( 'ABSPATH' ) || exit;

// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- read-only display of a public query arg.
$apwa_slug  = isset( $_GET['app'] ) ? sanitize_key( wp_unslash( $_GET['app'] ) ) : '';
$apwa_about = $apwa_slug ? Registry::get( $apwa_slug ) : null;

$apwa_cal = (string) apply_filters( 'apwa_calendly_url', 'https://calendly.com/aakiem-philippe/ap-webmaster?hide_gdpr_banner=1' );
if ( $apwa_about ) {
	// Calendly fills its first question ("anything that will help prepare") with this.
	$apwa_cal = add_query_arg( 'a1', rawurlencode( sprintf( /* translators: %s: app name */ __( 'Interested in: %s', 'ap-webmaster-apps' ), $apwa_about['name'] ) ), $apwa_cal );
}
?>
		<section class="apwa-mkt-contact" aria-labelledby="apwa-mkt-contact-title">
			<div class="apwa-mkt-wrap apwa-mkt-contact__inner">
				<div class="apwa-mkt-contact__intro">
					<p class="apwa-mkt-eyebrow"><?php esc_html_e( 'Get a quote', 'ap-webmaster-apps' ); ?></p>
					<h1 id="apwa-mkt-contact-title" class="apwa-mkt-h2"><?php esc_html_e( 'Let’s talk about your business', 'ap-webmaster-apps' ); ?></h1>
					<p class="apwa-mkt-sub"><?php esc_html_e( 'Pick a time for a free call. I will walk through how the apps would fit your process and give you a clear quote before anything is built.', 'ap-webmaster-apps' ); ?></p>
					<?php if ( $apwa_about ) : ?>
					<p class="apwa-mkt-contact__about"><span class="apwa-mkt-contact__icon"><?php echo Renderer::icon( $apwa_about['icon'] ); ?></span><span><?php esc_html_e( 'You’re asking about', 'ap-webmaster-apps' ); ?> <strong><?php echo esc_html( $apwa_about['name'] ); ?></strong></span></p>
					<?php endif; ?>
					<ol class="apwa-mkt-contact__steps">
						<li><strong><?php esc_html_e( 'Book a call', 'ap-webmaster-apps' ); ?></strong><span><?php esc_html_e( 'Tell me what slows your team down.', 'ap-webmaster-apps' ); ?></span></li>
						<li><strong><?php esc_html_e( 'Get a clear quote', 'ap-webmaster-apps' ); ?></strong><span><?php esc_html_e( 'Packages start at $100 a month.', 'ap-webmaster-apps' ); ?></span></li>
						<li><strong><?php esc_html_e( 'I set it up for you', 'ap-webmaster-apps' ); ?></strong><span><?php esc_html_e( 'On your own website, with your branding.', 'ap-webmaster-apps' ); ?></span></li>
					</ol>
					<a class="apwa-mkt-link" href="<?php echo esc_url( $apwa_about ? Router::url( 'demo/' . $apwa_about['slug'] . '/' ) : $demo_url ); ?>"><?php echo $apwa_about ? esc_html( sprintf( /* translators: %s: app name */ __( 'Back to the %s demo', 'ap-webmaster-apps' ), $apwa_about['name'] ) ) : esc_html__( 'Try the live demo first', 'ap-webmaster-apps' ); ?></a>
				</div>
				<div class="apwa-mkt-contact__cal" id="book">
					<div class="calendly-inline-widget" data-url="<?php echo esc_url( $apwa_cal ); ?>" style="min-width:320px;height:700px;"></div>
					<noscript><a class="apwa-mkt-btn apwa-mkt-btn--primary" href="<?php echo esc_url( $apwa_cal ); ?>"><?php esc_html_e( 'Book a call on Calendly', 'ap-webmaster-apps' ); ?></a></noscript>
				</div>
			</div>
		</section>
		<script src="https://assets.calendly.com/assets/external/widget.js" async></script>
