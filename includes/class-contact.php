<?php
/**
 * Get-a-quote form: emails Keem and keeps a private copy of every request in
 * WordPress (Quote requests), so a request is never lost if an email fails.
 *
 * @package APWebmaster\Apps
 */

namespace APWebmaster\Apps;

defined( 'ABSPATH' ) || exit;

/**
 * Quote request form handler.
 */
final class Contact {

	const ACTION = 'apwa_quote';
	const CPT    = 'apwa_quote';
	const META   = '_apwa_quote';

	/**
	 * Hooks.
	 */
	public static function init() {
		add_action( 'init', array( __CLASS__, 'register' ) );
		add_action( 'admin_post_nopriv_' . self::ACTION, array( __CLASS__, 'handle' ) );
		add_action( 'admin_post_' . self::ACTION, array( __CLASS__, 'handle' ) );
		add_filter( 'manage_' . self::CPT . '_posts_columns', array( __CLASS__, 'columns' ) );
		add_action( 'manage_' . self::CPT . '_posts_custom_column', array( __CLASS__, 'column' ), 10, 2 );
	}

	/**
	 * Where quote requests are emailed and the address shown on the page.
	 *
	 * @return string
	 */
	public static function email() {
		return sanitize_email( (string) apply_filters( 'apwa_quote_email', 'aakiem@apwebmaster.com' ) );
	}

	/**
	 * Private "Quote requests" list in wp-admin. Admins only; never public.
	 */
	public static function register() {
		register_post_type(
			self::CPT,
			array(
				'labels'          => array(
					'name'          => __( 'Quote requests', 'ap-webmaster-apps' ),
					'singular_name' => __( 'Quote request', 'ap-webmaster-apps' ),
					'menu_name'     => __( 'Quote requests', 'ap-webmaster-apps' ),
					'edit_item'     => __( 'Quote request', 'ap-webmaster-apps' ),
				),
				'public'          => false,
				'show_ui'         => true,
				'show_in_menu'    => true,
				'menu_icon'       => 'dashicons-email-alt',
				'supports'        => array( 'title', 'editor' ),
				'capability_type' => 'post',
				'capabilities'    => array(
					'create_posts'       => 'do_not_allow',
					'edit_posts'         => 'manage_options',
					'edit_others_posts'  => 'manage_options',
					'edit_private_posts' => 'manage_options',
					'read_private_posts' => 'manage_options',
					'delete_posts'       => 'manage_options',
				),
				'map_meta_cap'    => true,
				'rewrite'         => false,
				'query_var'       => false,
			)
		);
	}

	/**
	 * Admin list columns.
	 *
	 * @param array $cols Columns.
	 * @return array
	 */
	public static function columns( $cols ) {
		$date = isset( $cols['date'] ) ? $cols['date'] : '';
		unset( $cols['date'] );
		$cols['apwa_email'] = __( 'Reply to', 'ap-webmaster-apps' );
		$cols['apwa_sent']  = __( 'Emailed to you', 'ap-webmaster-apps' );
		$cols['date']       = $date;
		return $cols;
	}

	/**
	 * Admin list cells.
	 *
	 * @param string $col     Column.
	 * @param int    $post_id Post.
	 */
	public static function column( $col, $post_id ) {
		$m = (array) get_post_meta( $post_id, self::META, true );
		if ( 'apwa_email' === $col && ! empty( $m['email'] ) ) {
			echo '<a href="' . esc_url( 'mailto:' . $m['email'] ) . '">' . esc_html( $m['email'] ) . '</a>';
		}
		if ( 'apwa_sent' === $col ) {
			echo ! empty( $m['emailed'] ) ? esc_html__( 'Yes', 'ap-webmaster-apps' ) : '<strong style="color:#b32d2e">' . esc_html__( 'No, check your mail setup', 'ap-webmaster-apps' ) . '</strong>';
		}
	}

	/**
	 * Back to the quote page with a result flag.
	 *
	 * @param string $result sent|error|busy.
	 * @param string $app    App slug.
	 */
	private static function back( $result, $app = '' ) {
		$url = Router::url( 'contact/' );
		$url = add_query_arg( array_filter( array( 'app' => $app, 'sent' => $result ) ), $url );
		wp_safe_redirect( $url . '#quote-form' );
		exit;
	}

	/**
	 * Form post.
	 */
	public static function handle() {
		// phpcs:disable WordPress.Security.NonceVerification.Missing -- public contact form; a cached page would carry stale nonces, so it uses a honeypot, a fill-time check and a rate limit instead.
		$p   = wp_unslash( $_POST );
		$app = isset( $p['app'] ) ? sanitize_key( $p['app'] ) : '';
		$app = $app && Registry::get( $app ) ? $app : '';

		if ( ! Settings::can_view() ) {
			wp_safe_redirect( home_url( '/' ) );
			exit;
		}
		// Bots: hidden field filled, or the form sent within 3 seconds of loading.
		$started = isset( $p['t'] ) ? (int) $p['t'] : 0;
		if ( ! empty( $p['website'] ) || ( $started && time() - $started < 3 ) ) {
			self::back( 'sent', $app );
		}

		$name    = isset( $p['name'] ) ? sanitize_text_field( $p['name'] ) : '';
		$email   = isset( $p['email'] ) ? sanitize_email( $p['email'] ) : '';
		$phone   = isset( $p['phone'] ) ? sanitize_text_field( $p['phone'] ) : '';
		$message = isset( $p['message'] ) ? sanitize_textarea_field( $p['message'] ) : '';
		// phpcs:enable
		if ( '' === $name || ! is_email( $email ) || '' === trim( $message ) ) {
			self::back( 'error', $app );
		}
		$name    = mb_substr( $name, 0, 120 );
		$phone   = mb_substr( $phone, 0, 40 );
		$message = mb_substr( $message, 0, 4000 );

		// At most 5 requests an hour from one address.
		$ip   = isset( $_SERVER['REMOTE_ADDR'] ) ? sanitize_text_field( wp_unslash( $_SERVER['REMOTE_ADDR'] ) ) : '';
		$key  = 'apwa_q_' . md5( $ip );
		$seen = (int) get_transient( $key );
		if ( $seen >= 5 ) {
			self::back( 'busy', $app );
		}
		set_transient( $key, $seen + 1, HOUR_IN_SECONDS );

		$about = $app ? Registry::get( $app )['name'] : __( 'General', 'ap-webmaster-apps' );

		// Keep a private copy first, so the request is safe even if the email fails.
		$post_id = wp_insert_post(
			array(
				'post_type'    => self::CPT,
				'post_status'  => 'private',
				'post_title'   => wp_strip_all_tags( $name . ' · ' . $about ),
				'post_content' => $message,
			)
		);
		$meta = array(
			'name'    => $name,
			'email'   => $email,
			'phone'   => $phone,
			'app'     => $app,
			'emailed' => false,
		);

		$to = self::email();
		if ( $to ) {
			$subject = sprintf( /* translators: 1: app name, 2: visitor name */ __( 'Quote request: %1$s from %2$s', 'ap-webmaster-apps' ), $about, $name );
			$body    = implode(
				"\n",
				array(
					sprintf( 'Name: %s', $name ),
					sprintf( 'Email: %s', $email ),
					sprintf( 'Phone: %s', $phone ? $phone : '-' ),
					sprintf( 'Interested in: %s', $about ),
					'',
					$message,
					'',
					'Sent from the Get a quote page on ' . home_url( '/' ),
				)
			);
			$headers         = array( 'Reply-To: ' . str_replace( array( "\r", "\n", '<', '>', ',' ), '', $name ) . ' <' . $email . '>' );
			$meta['emailed'] = (bool) wp_mail( $to, $subject, $body, $headers );
		}
		if ( $post_id && ! is_wp_error( $post_id ) ) {
			update_post_meta( $post_id, self::META, $meta );
		}

		self::back( 'sent', $app );
	}
}
