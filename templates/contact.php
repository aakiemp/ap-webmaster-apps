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
// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- read-only result flag after the form posts.
$apwa_sent = isset( $_GET['sent'] ) ? sanitize_key( wp_unslash( $_GET['sent'] ) ) : '';
$apwa_mail = Contact::email();

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
					<p class="apwa-mkt-contact__price"><?php esc_html_e( 'Packages start at $100 a month.', 'ap-webmaster-apps' ); ?></p>
					<div class="apwa-mkt-quote" id="quote-form">
						<?php if ( 'sent' === $apwa_sent ) : ?>
						<div class="apwa-mkt-quote__done" role="status">
							<strong><?php esc_html_e( 'Thanks, I got your message.', 'ap-webmaster-apps' ); ?></strong>
							<span><?php esc_html_e( 'I will get back to you soon. You can also book a call on the calendar.', 'ap-webmaster-apps' ); ?></span>
						</div>
						<?php else : ?>
						<h2 class="apwa-mkt-quote__title"><?php esc_html_e( 'Prefer to write? Send me a message', 'ap-webmaster-apps' ); ?></h2>
						<?php if ( 'error' === $apwa_sent ) : ?>
						<p class="apwa-mkt-quote__err" role="alert"><?php esc_html_e( 'Please add your name, a valid email and a message.', 'ap-webmaster-apps' ); ?></p>
						<?php elseif ( 'busy' === $apwa_sent ) : ?>
						<p class="apwa-mkt-quote__err" role="alert"><?php esc_html_e( 'Too many messages from this connection. Please email me instead.', 'ap-webmaster-apps' ); ?></p>
						<?php endif; ?>
						<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
							<input type="hidden" name="action" value="<?php echo esc_attr( Contact::ACTION ); ?>">
							<input type="hidden" name="app" value="<?php echo esc_attr( $apwa_about ? $apwa_about['slug'] : '' ); ?>">
							<input type="hidden" name="t" value="<?php echo esc_attr( (string) time() ); ?>">
							<div class="apwa-mkt-quote__hp" aria-hidden="true"><label>Website <input type="text" name="website" tabindex="-1" autocomplete="off"></label></div>
							<div class="apwa-mkt-quote__row">
								<label><span><?php esc_html_e( 'Name', 'ap-webmaster-apps' ); ?></span><input type="text" name="name" required maxlength="120" autocomplete="name"></label>
								<label><span><?php esc_html_e( 'Email', 'ap-webmaster-apps' ); ?></span><input type="email" name="email" required maxlength="190" autocomplete="email"></label>
							</div>
							<label><span><?php esc_html_e( 'Phone (optional)', 'ap-webmaster-apps' ); ?></span><input type="tel" name="phone" maxlength="40" autocomplete="tel"></label>
							<label><span><?php esc_html_e( 'Message', 'ap-webmaster-apps' ); ?></span><textarea name="message" rows="4" required maxlength="4000" placeholder="<?php echo esc_attr( $apwa_about ? sprintf( /* translators: %s: app name */ __( 'What would you like %s to do for your business?', 'ap-webmaster-apps' ), $apwa_about['name'] ) : __( 'Tell me a little about your business and what you need.', 'ap-webmaster-apps' ) ); ?>"></textarea></label>
							<button type="submit" class="apwa-mkt-btn apwa-mkt-btn--primary"><?php esc_html_e( 'Send message', 'ap-webmaster-apps' ); ?></button>
						</form>
						<?php endif; ?>
						<?php if ( $apwa_mail ) : ?>
						<p class="apwa-mkt-quote__mail"><?php esc_html_e( 'Or email me directly at', 'ap-webmaster-apps' ); ?> <a href="<?php echo esc_url( 'mailto:' . $apwa_mail ); ?>"><?php echo esc_html( $apwa_mail ); ?></a></p>
						<?php endif; ?>
					</div>
					<a class="apwa-mkt-link" href="<?php echo esc_url( $apwa_about ? Router::url( 'demo/' . $apwa_about['slug'] . '/' ) : $demo_url ); ?>"><?php echo $apwa_about ? esc_html( sprintf( /* translators: %s: app name */ __( 'Back to the %s demo', 'ap-webmaster-apps' ), $apwa_about['name'] ) ) : esc_html__( 'Try the live demo first', 'ap-webmaster-apps' ); ?></a>
				</div>
				<div class="apwa-mkt-contact__cal" id="book">
					<div class="calendly-inline-widget" data-url="<?php echo esc_url( $apwa_cal ); ?>" style="min-width:320px;height:700px;"></div>
					<noscript><a class="apwa-mkt-btn apwa-mkt-btn--primary" href="<?php echo esc_url( $apwa_cal ); ?>"><?php esc_html_e( 'Book a call on Calendly', 'ap-webmaster-apps' ); ?></a></noscript>
				</div>
			</div>
		</section>
		<script src="https://assets.calendly.com/assets/external/widget.js" async></script>
