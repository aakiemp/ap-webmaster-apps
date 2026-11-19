<?php
/**
 * Small settings screen: Settings → AP Webmaster Apps.
 *
 * @package APWebmaster\Apps
 */

namespace APWebmaster\Apps;

defined( 'ABSPATH' ) || exit;

/**
 * Admin UI.
 */
final class Admin {

	const PAGE = 'ap-webmaster-apps';

	/**
	 * Hook in.
	 */
	public static function init() {
		add_action( 'admin_menu', array( __CLASS__, 'menu' ) );
		add_action( 'admin_post_apwa_save', array( __CLASS__, 'save' ) );
		add_action( 'admin_notices', array( __CLASS__, 'path_conflict_notice' ) );
		add_filter( 'plugin_action_links_' . plugin_basename( APWA_FILE ), array( __CLASS__, 'action_links' ) );
	}

	/**
	 * Register the page.
	 */
	public static function menu() {
		add_options_page(
			__( 'AP Webmaster Apps', 'ap-webmaster-apps' ),
			__( 'AP Webmaster Apps', 'ap-webmaster-apps' ),
			'manage_options',
			self::PAGE,
			array( __CLASS__, 'render' )
		);
	}

	/**
	 * Settings link on the Plugins screen.
	 *
	 * @param array $links Links.
	 * @return array
	 */
	public static function action_links( $links ) {
		array_unshift( $links, '<a href="' . esc_url( admin_url( 'options-general.php?page=' . self::PAGE ) ) . '">' . esc_html__( 'Settings', 'ap-webmaster-apps' ) . '</a>' );
		return $links;
	}

	/**
	 * Warn if an existing page already uses /apps/ (our routes would take over that URL).
	 */
	public static function path_conflict_notice() {
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}
		$page = get_page_by_path( Settings::base() );
		if ( ! $page ) {
			return;
		}
		echo '<div class="notice notice-warning"><p>';
		printf(
			/* translators: %s: URL path */
			esc_html__( 'AP Webmaster Apps: a page already uses /%s/. The apps marketplace now answers at that address. Rename that page, or change the base path with the apwa_base_path filter.', 'ap-webmaster-apps' ),
			esc_html( Settings::base() )
		);
		echo '</p></div>';
	}

	/**
	 * Save handler.
	 */
	public static function save() {
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_die( esc_html__( 'Not allowed.', 'ap-webmaster-apps' ), 403 );
		}
		check_admin_referer( 'apwa_save' );
		// phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- sanitized in Settings::save().
		$input = isset( $_POST['apwa'] ) && is_array( $_POST['apwa'] ) ? wp_unslash( $_POST['apwa'] ) : array();
		Settings::save( $input );
		wp_safe_redirect( add_query_arg( 'updated', '1', admin_url( 'options-general.php?page=' . self::PAGE ) ) );
		exit;
	}

	/**
	 * Render the page.
	 */
	public static function render() {
		$s        = Settings::all();
		$live     = count( Registry::live() );
		$total    = count( Registry::all() );
		$is_pub   = Settings::is_public();
		?>
		<div class="wrap">
			<h1><?php esc_html_e( 'AP Webmaster Apps', 'ap-webmaster-apps' ); ?></h1>
			<?php if ( isset( $_GET['updated'] ) ) : // phpcs:ignore WordPress.Security.NonceVerification.Recommended ?>
				<div class="notice notice-success is-dismissible"><p><?php esc_html_e( 'Settings saved.', 'ap-webmaster-apps' ); ?></p></div>
			<?php endif; ?>

			<p>
				<?php
				printf(
					/* translators: 1: live demos, 2: total apps */
					esc_html__( '%1$d live demo(s) of %2$d apps in the catalog. Demo data is stored only in each visitor\'s browser; nothing is saved to WordPress.', 'ap-webmaster-apps' ),
					(int) $live,
					(int) $total
				);
				?>
			</p>
			<p>
				<a class="button" href="<?php echo esc_url( Router::url() ); ?>" target="_blank" rel="noopener"><?php esc_html_e( 'View marketplace', 'ap-webmaster-apps' ); ?></a>
				<a class="button button-primary" href="<?php echo esc_url( Router::url( 'demo/' ) ); ?>" target="_blank" rel="noopener"><?php esc_html_e( 'Open demo dashboard', 'ap-webmaster-apps' ); ?></a>
			</p>

			<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
				<input type="hidden" name="action" value="apwa_save">
				<?php wp_nonce_field( 'apwa_save' ); ?>
				<table class="form-table" role="presentation">
					<tr>
						<th scope="row"><?php esc_html_e( 'Visibility', 'ap-webmaster-apps' ); ?></th>
						<td>
							<label>
								<input type="checkbox" name="apwa[public]" value="1" <?php checked( ! empty( $s['public'] ) ); ?>>
								<?php esc_html_e( 'Launched: anyone can open /apps/ and the demos', 'ap-webmaster-apps' ); ?>
							</label>
							<p class="description">
								<?php
								echo $is_pub
									? esc_html__( 'Currently public.', 'ap-webmaster-apps' )
									: esc_html__( 'Currently in preview: only logged-in administrators can see the pages; everyone else gets a normal "page not found", and search engines are told not to index them.', 'ap-webmaster-apps' );
								?>
							</p>
						</td>
					</tr>
					<tr>
						<th scope="row"><label for="apwa-inquiry"><?php esc_html_e( 'Inquiry link', 'ap-webmaster-apps' ); ?></label></th>
						<td>
							<input id="apwa-inquiry" class="regular-text" type="url" name="apwa[inquiry_url]" value="<?php echo esc_attr( $s['inquiry_url'] ); ?>" placeholder="<?php echo esc_attr( home_url( '/contact/' ) ); ?>">
							<p class="description"><?php esc_html_e( 'Where "Ask about installing" buttons go. Leave empty to use /contact/.', 'ap-webmaster-apps' ); ?></p>
						</td>
					</tr>
					<tr>
						<th scope="row"><?php esc_html_e( 'Field 2 Forest demo', 'ap-webmaster-apps' ); ?></th>
						<td>
							<input class="large-text" type="text" readonly value="<?php echo esc_attr( F2f::share_url() ); ?>" onfocus="this.select()">
							<p class="description"><?php esc_html_e( 'Private link to the Field 2 Forest demo. Anyone with this link can open it, even before launch. It is not listed anywhere.', 'ap-webmaster-apps' ); ?></p>
						</td>
					</tr>
				</table>
				<?php submit_button(); ?>
			</form>

			<h2><?php esc_html_e( 'If something goes wrong', 'ap-webmaster-apps' ); ?></h2>
			<p><?php esc_html_e( 'Deactivate the plugin here, or rename the folder wp-content/plugins/ap-webmaster-apps in cPanel File Manager; WordPress then switches it off. The plugin adds no database tables and changes no theme files.', 'ap-webmaster-apps' ); ?></p>
		</div>
		<?php
	}
}
