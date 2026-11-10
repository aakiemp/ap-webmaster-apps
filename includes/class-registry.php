<?php
/**
 * App registry: every product is a folder in /apps with an app.json.
 *
 * @package APWebmaster\Apps
 */

namespace APWebmaster\Apps;

defined( 'ABSPATH' ) || exit;

/**
 * Loads and exposes product metadata.
 */
final class Registry {

	/**
	 * Loaded apps keyed by slug.
	 *
	 * @var array|null
	 */
	private static $apps = null;

	/**
	 * Marketplace categories (order matters).
	 *
	 * @return array
	 */
	public static function categories() {
		return apply_filters(
			'apwa_categories',
			array(
				'sales'      => __( 'Sales & CRM', 'ap-webmaster-apps' ),
				'scheduling' => __( 'Booking & Scheduling', 'ap-webmaster-apps' ),
				'billing'    => __( 'Billing & Invoices', 'ap-webmaster-apps' ),
				'documents'  => __( 'AI & Documents', 'ap-webmaster-apps' ),
				'marketing'  => __( 'Marketing', 'ap-webmaster-apps' ),
				'reporting'  => __( 'Analytics & Reporting', 'ap-webmaster-apps' ),
				'clients'    => __( 'Clients & Support', 'ap-webmaster-apps' ),
				'operations' => __( 'Business Operations', 'ap-webmaster-apps' ),
			)
		);
	}

	/**
	 * All apps: live demos first, newest launch on top, then the rest by "order".
	 *
	 * @return array
	 */
	public static function all() {
		if ( null !== self::$apps ) {
			return self::$apps;
		}
		$apps = array();
		foreach ( (array) glob( APWA_DIR . 'apps/*/app.json' ) as $file ) {
			$app = self::load( $file );
			if ( $app ) {
				$apps[ $app['slug'] ] = $app;
			}
		}
		uasort(
			$apps,
			static function ( $a, $b ) {
				$a_live = 'demo' === $a['status'];
				$b_live = 'demo' === $b['status'];
				if ( $a_live !== $b_live ) {
					return $a_live ? -1 : 1;
				}
				return $a['order'] <=> $b['order'];
			}
		);
		self::$apps = apply_filters( 'apwa_apps', $apps );
		return self::$apps;
	}

	/**
	 * One app by slug.
	 *
	 * @param string $slug App slug.
	 * @return array|null
	 */
	public static function get( $slug ) {
		$apps = self::all();
		return isset( $apps[ $slug ] ) ? $apps[ $slug ] : null;
	}

	/**
	 * Apps with a working demo.
	 *
	 * @return array
	 */
	public static function live() {
		return array_filter(
			self::all(),
			static function ( $app ) {
				return 'demo' === $app['status'];
			}
		);
	}

	/**
	 * Read and normalise one app.json.
	 *
	 * @param string $file Path to app.json.
	 * @return array|null
	 */
	private static function load( $file ) {
		$json = file_get_contents( $file ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- local plugin file.
		$data = json_decode( (string) $json, true );
		if ( ! is_array( $data ) || empty( $data['slug'] ) || empty( $data['name'] ) ) {
			return null;
		}
		$slug = sanitize_key( $data['slug'] );
		if ( basename( dirname( $file ) ) !== $slug ) {
			return null;
		}
		$defaults = array(
			'slug'              => $slug,
			'name'              => '',
			'shortName'         => '',
			'icon'              => 'grid',
			'color'             => 'blue',
			'category'          => 'operations',
			'status'            => 'coming-soon',
			'stage'             => '',
			'priority'          => '',
			'order'             => 100,
			'launched'          => 0,
			'tagline'           => '',
			'description'       => '',
			'problem'           => '',
			'audience'          => array(),
			'benefits'          => array(),
			'demoFeatures'      => array(),
			'productionOptions' => array(),
			'customization'     => array(),
			'related'           => array(),
			'module'            => '',
			'styles'            => array(),
			'package'           => array(
				'setup'   => true,
				'monthly' => true,
				'addons'  => array(),
			),
		);
		$app              = array_merge( $defaults, $data );
		$app['slug']      = $slug;
		$app['shortName'] = $app['shortName'] ? $app['shortName'] : $app['name'];
		$app['order']     = (int) $app['order'];
		$app['launched']  = (int) $app['launched'];
		$app['status']    = in_array( $app['status'], array( 'demo', 'coming-soon' ), true ) ? $app['status'] : 'coming-soon';
		return $app;
	}

	/**
	 * Metadata the browser needs (no server paths).
	 *
	 * @return array
	 */
	public static function for_client() {
		$out = array();
		foreach ( self::all() as $slug => $app ) {
			$out[] = array(
				'slug'        => $slug,
				'name'        => $app['name'],
				'shortName'   => $app['shortName'],
				'icon'        => $app['icon'],
				'color'       => $app['color'],
				'category'    => $app['category'],
				'status'      => $app['status'],
				'order'       => $app['order'],
				'stage'       => $app['stage'],
				'tagline'     => $app['tagline'],
				'audience'    => $app['audience'],
				'module'      => ( 'demo' === $app['status'] && $app['module'] ) ? APWA_URL . 'apps/' . $slug . '/' . $app['module'] : '',
				'styles'      => array_map(
					static function ( $css ) use ( $slug ) {
						return APWA_URL . 'apps/' . $slug . '/' . $css;
					},
					( 'demo' === $app['status'] ) ? (array) $app['styles'] : array()
				),
			);
		}
		return $out;
	}
}
